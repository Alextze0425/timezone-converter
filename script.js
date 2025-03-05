document.addEventListener('DOMContentLoaded', () => {
    let timeSliders = document.querySelectorAll('.time-slider');
    let currentTimeMarkers = document.querySelectorAll('.current-time-marker');
    const datePicker = document.getElementById('datePicker');
    const searchInput = document.querySelector('.search-input');
    const addButton = document.querySelector('.add-button');
    const themeButton = document.querySelector('[title="Theme"]');
    const shareButton = document.querySelector('.share-button');
    const currentTimeButton = document.querySelector('.current-time-button');
    const currentTimeTooltip = document.querySelector('.current-time-tooltip');
    const timezoneList = document.querySelector('.timezone-list');
    
    // Update current time tooltip every second with local time
    function updateCurrentTimeTooltip() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        currentTimeTooltip.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // Initialize and update current time
    updateCurrentTimeTooltip();
    setInterval(updateCurrentTimeTooltip, 1000);

    // Current time button click handler
    currentTimeButton.addEventListener('click', () => {
        const now = moment();
        datePicker.value = formatDate(now.toDate());
        
        // Get current time in first timezone (Beijing)
        const timezone = getTimezoneFromIndex(0);
        const localTime = now.tz(timezone);
        const minutes = localTime.hours() * 60 + localTime.minutes();
        
        // Update all timezones
        updateTimes(minutes, 0);
    });

    // Handle slider changes
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('time-slider')) {
            const minutes = parseInt(e.target.value);
            const timezoneItem = e.target.closest('.timezone-item');
            const index = Array.from(document.querySelectorAll('.timezone-item')).indexOf(timezoneItem);
            updateTimes(minutes, index);
        }
    });

    // Handle timeline clicks
    document.addEventListener('click', (e) => {
        const timelineContainer = e.target.closest('.timeline-container');
        if (timelineContainer && !e.target.classList.contains('time-slider')) {
            const slider = timelineContainer.querySelector('.time-slider');
            const rect = timelineContainer.getBoundingClientRect();
            const position = (e.clientX - rect.left) / rect.width;
            const minutes = Math.round(position * 1439);
            
            // Update slider value
            slider.value = minutes;
            
            // Find the timezone index and update times
            const timezoneItem = timelineContainer.closest('.timezone-item');
            const index = Array.from(document.querySelectorAll('.timezone-item')).indexOf(timezoneItem);
            updateTimes(minutes, index);
        }
    });

    // Load all IANA timezones and add major cities
    const majorCities = [
        'Asia/Shanghai',    // Beijing
        'Asia/Tokyo',       // Tokyo
        'Europe/London',    // London
        'America/New_York', // New York
        'Europe/Paris',     // Paris
        'Asia/Singapore',   // Singapore
        'Australia/Sydney', // Sydney
        'Europe/Moscow',    // Moscow
        'America/Los_Angeles', // Los Angeles
        'Asia/Dubai',       // Dubai
    ];

    const allTimezones = moment.tz.names().map(tz => {
        const parts = tz.split('/');
        let city = parts[parts.length - 1].replace(/_/g, ' ');
        const region = parts[0];
        const offset = moment.tz(tz).utcOffset();
        const abbreviation = moment.tz(tz).format('z');
        
        // Special case for Beijing (Shanghai timezone)
        if (tz === 'Asia/Shanghai') {
            city = 'Beijing';
        }
        
        return {
            city: city,
            region: region,
            timezone: tz,
            offset: offset,
            abbreviation: abbreviation,
            isMajor: majorCities.includes(tz)
        };
    }).sort((a, b) => {
        // Sort major cities first, then by region and city name
        if (a.isMajor !== b.isMajor) return b.isMajor - a.isMajor;
        if (a.region !== b.region) return a.region.localeCompare(b.region);
        return a.city.localeCompare(b.city);
    });

    // Theme switching
    let isDarkMode = false;
    themeButton.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode');
        themeButton.querySelector('.icon').textContent = isDarkMode ? '☀️' : '🌙';
    });

    // Share functionality
    shareButton.addEventListener('click', () => {
        const timezones = Array.from(document.querySelectorAll('.timezone-item')).map(item => {
            return {
                city: item.querySelector('h2').textContent,
                time: item.querySelector('.current-time').textContent,
                zone: item.querySelector('.timezone-label').textContent
            };
        });

        const shareText = timezones.map(tz => 
            `${tz.city}: ${tz.time} ${tz.zone}`
        ).join('\n');

        if (navigator.share) {
            navigator.share({
                title: 'Time Zone Comparison',
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Copied to clipboard!');
            }).catch(console.error);
        }
    });

    // Improved search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 1) {
            hideSearchResults();
            return;
        }

        const searchResults = allTimezones.filter(tz => {
            const cityMatch = tz.city.toLowerCase().includes(searchTerm);
            const regionMatch = tz.region.toLowerCase().includes(searchTerm);
            const timezoneMatch = tz.abbreviation.toLowerCase().includes(searchTerm);
            const offsetMatch = moment.tz(tz.timezone).format('Z').includes(searchTerm);
            return cityMatch || regionMatch || timezoneMatch || offsetMatch;
        }).slice(0, 20); // Show more results

        showSearchResults(searchResults);
    });

    function showSearchResults(results) {
        let resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-results';
            document.querySelector('.search-container').appendChild(resultsContainer);
        }

        resultsContainer.innerHTML = results.map(result => {
            const offset = moment.tz(result.timezone).format('Z');
            const abbr = result.abbreviation;
            return `
                <div class="search-result" data-timezone="${result.timezone}">
                    <div class="result-city">${result.city}</div>
                    <div class="result-info">${result.region} (${abbr} UTC${offset})</div>
                </div>
            `;
        }).join('');

        // Add click handlers to results
        resultsContainer.querySelectorAll('.search-result').forEach(result => {
            result.addEventListener('click', () => {
                addTimezone(result.dataset.timezone);
                hideSearchResults();
                searchInput.value = '';
            });
        });
    }

    function hideSearchResults() {
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.remove();
        }
    }

    // Handle date changes
    datePicker.addEventListener('change', () => {
        const minutes = parseInt(timeSliders[0].value);
        updateTimes(minutes, 0);
    });

    function updateTimes(minutes, sourceIndex) {
        const date = moment().tz('Asia/Shanghai').startOf('day').toDate();  // 使用北京时间的日期
        const timezoneItems = document.querySelectorAll('.timezone-item');
        const sourceTimezone = getTimezoneFromIndex(sourceIndex);
        
        // Create source time using moment.js
        const sourceTime = moment.tz(date, sourceTimezone)
            .hours(Math.floor(minutes / 60))
            .minutes(minutes % 60);
        
        timezoneItems.forEach((item, index) => {
            const targetTimezone = getTimezoneFromIndex(index);
            const targetTime = sourceTime.clone().tz(targetTimezone);
            
            // Update displayed time
            const timeStr = targetTime.format('h:mm A');
            const zoneStr = targetTime.format('z');
            const dateStr = targetTime.format('ddd, MMM D');
            
            item.querySelector('.current-time').textContent = timeStr;
            item.querySelector('.timezone-label').textContent = zoneStr;
            item.querySelector('.date-label').textContent = dateStr;
            
            // Update slider position
            const targetMinutes = targetTime.hours() * 60 + targetTime.minutes();
            const slider = item.querySelector('.time-slider');
            slider.value = targetMinutes;
            
            // Update time marker
            const marker = item.querySelector('.current-time-marker');
            marker.textContent = timeStr;
            marker.style.left = `${(targetMinutes / 1439) * 100}%`;
        });
        
        updateTimelineBackgrounds();
    }

    function getTimezoneFromIndex(index) {
        const item = document.querySelectorAll('.timezone-item')[index];
        if (!item) return 'UTC';
        
        // Use the timezone data attribute if available
        if (item.dataset.timezone) {
            return item.dataset.timezone;
        }
        
        // Fallback to city name lookup
        const city = item.querySelector('h2').textContent;
        switch(city) {
            case 'Beijing': return 'Asia/Shanghai';
            case 'New York': return 'America/New_York';
            case 'London': return 'Europe/London';
            default: {
                const timezone = allTimezones.find(tz => tz.city === city)?.timezone;
                return timezone || 'UTC';
            }
        }
    }

    function updateTimelineBackgrounds() {
        timeSliders.forEach(slider => {
            const value = parseInt(slider.value);
            const percent = (value / 1439) * 100;
            
            const gradient = `linear-gradient(to right, 
                var(--night-color) 0%, var(--night-color) ${percent}%,
                var(--day-color) ${percent}%, var(--day-color) 100%
            )`;
            
            slider.style.background = gradient;
        });
    }
    
    function formatTimeFromMinutes(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const period = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
    }
    
    function formatDate(date) {
        // 使用上海时区格式化日期
        return moment(date).tz('Asia/Shanghai').format('YYYY-MM-DD');
    }
    
    function formatDateLabel(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    // Initialize default timezones
    function initializeDefaultTimezones() {
        ['Asia/Shanghai', 'America/New_York', 'Europe/London'].forEach(timezone => {
            addTimezone(timezone);
        });
    }

    function initializeWithCurrentTime() {
        // 使用北京时间初始化
        const now = moment().tz('Asia/Shanghai');
        datePicker.value = formatDate(now.toDate());
        
        // 使用北京时间的小时和分钟
        const minutes = now.hours() * 60 + now.minutes();
        updateTimes(minutes, 0);
    }

    // Add timezone functionality
    function addTimezone(timezone) {
        const tzInfo = allTimezones.find(tz => tz.timezone === timezone);
        if (!tzInfo) return;

        const newTimezoneItem = document.createElement('div');
        newTimezoneItem.className = 'timezone-item';
        newTimezoneItem.dataset.timezone = timezone;  // Add timezone data attribute
        newTimezoneItem.innerHTML = `
            <div class="timezone-info">
                <div class="timezone-header">
                    <h2>${tzInfo.city}</h2>
                    <button class="remove-button" title="Remove">×</button>
                </div>
                <div class="location-info">${tzInfo.region} (${tzInfo.abbreviation} UTC${moment.tz(timezone).format('Z')})</div>
                <div class="time-info">
                    <span class="current-time"></span>
                    <span class="timezone-label"></span>
                    <span class="date-label"></span>
                </div>
            </div>
            <div class="timeline-container">
                <div class="timeline">
                    <div class="time-marker" data-time="12am">12am</div>
                    <div class="time-marker" data-time="3am">3am</div>
                    <div class="time-marker" data-time="6am">6am</div>
                    <div class="time-marker" data-time="9am">9am</div>
                    <div class="time-marker" data-time="12pm">12pm</div>
                    <div class="time-marker" data-time="3pm">3pm</div>
                    <div class="time-marker" data-time="6pm">6pm</div>
                    <div class="time-marker" data-time="9pm">9pm</div>
                </div>
                <div class="timeline-slider">
                    <input type="range" min="0" max="1439" value="720" class="time-slider">
                    <div class="current-time-marker"></div>
                </div>
            </div>
        `;

        // Add remove button functionality
        newTimezoneItem.querySelector('.remove-button').addEventListener('click', () => {
            newTimezoneItem.remove();
        });

        timezoneList.appendChild(newTimezoneItem);

        // Update references to sliders and markers
        timeSliders = document.querySelectorAll('.time-slider');
        currentTimeMarkers = document.querySelectorAll('.current-time-marker');

        // Get the first slider's current value
        const firstSlider = document.querySelector('.time-slider');
        const currentMinutes = parseInt(firstSlider.value);

        // Update all times based on the current time
        updateTimes(currentMinutes, 0);
    }

    // Initialize remove buttons for existing timezones
    document.querySelectorAll('.remove-button').forEach(button => {
        button.addEventListener('click', () => {
            const timezoneItem = button.closest('.timezone-item');
            timezoneItem.remove();
        });
    });

    // Initialize
    const today = new Date();
    datePicker.value = formatDate(today);
    updateTimelineBackgrounds();
    initializeWithCurrentTime();
});