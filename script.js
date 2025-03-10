document.addEventListener('DOMContentLoaded', () => {
    let timeSliders = document.querySelectorAll('.time-slider');
    let currentTimeMarkers = document.querySelectorAll('.current-time-marker');
    const datePicker = document.getElementById('datePicker');
    const searchInput = document.querySelector('.search-input');
    const addButton = document.querySelector('.add-button');
    const themeButton = document.querySelector('.icon-button[title="Theme"]');
    const shareButton = document.querySelector('.share-button');
    const currentTimeButton = document.querySelector('.current-time-button');
    const currentTimeTooltip = document.querySelector('.current-time-tooltip');
    const timezoneList = document.querySelector('.timezone-list');
    const hourSelector = document.getElementById('hourSelector');
    
    // Theme toggle functionality
    let isDarkTheme = localStorage.getItem('darkTheme') === 'true' || 
                      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply theme on initial load
    applyTheme(isDarkTheme);
    
    // Theme toggle function
    function applyTheme(isDark) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeButton.querySelector('.icon').textContent = '☀️';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeButton.querySelector('.icon').textContent = '🌙';
        }
        localStorage.setItem('darkTheme', isDark);
    }
    
    // Theme toggle event
    themeButton.addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        applyTheme(isDarkTheme);
    });

    // Current time functionality
    function updateCurrentTimeTooltip() {
        currentTimeButton.querySelector('.current-time-tooltip').textContent = 
            moment().format('h:mm A');
    }
    
    setInterval(updateCurrentTimeTooltip, 1000);
    updateCurrentTimeTooltip();
    
    currentTimeButton.addEventListener('click', () => {
        const now = new Date();
        updateAllTimeZones(now);
    });

    // Time zone management
    const timeZoneList = document.querySelector('.timezone-list');
    
    // Available time zones
    const availableTimeZones = moment.tz.names().filter(tz => 
        !tz.includes('Etc/') && !tz.includes('SystemV/') && !tz.includes('US/') &&
        !tz.includes('Pacific/') && !tz.includes('Indian/') && !tz.includes('Antarctica/')
    );

    function updateAllTimeZones(baseDate, sourceTimezone = null) {
        const items = document.querySelectorAll('.timezone-item');
        
        items.forEach(item => {
            const cityName = item.querySelector('h2').textContent;
            const timeZone = getTimezoneFromCity(cityName);
            
            if (!timeZone || timeZone === sourceTimezone) return;

            const localTime = moment(baseDate).tz(timeZone);
            
            // Update date picker
            const datePicker = item.querySelector('.timezone-date');
            datePicker.value = localTime.format('YYYY-MM-DD');
            
            // Update hour selector
            const hourSelector = item.querySelector('.timezone-hour');
            hourSelector.value = localTime.hours();
            
            // Update time display
            item.querySelector('.current-time').textContent = localTime.format('h:mm A');
            item.querySelector('.timezone-label').textContent = localTime.format('z');
            item.querySelector('.date-label').textContent = localTime.format('ddd, MMM D');
            
            // Update slider
            const slider = item.querySelector('.time-slider');
            const totalMinutes = localTime.hours() * 60 + localTime.minutes();
            slider.value = totalMinutes;
            
            // Update time marker
            updateTimeMarker(item, localTime);
        });
    }

    function updateTimeMarker(item, time) {
        const marker = item.querySelector('.current-time-marker');
        const totalMinutes = time.hours() * 60 + time.minutes();
        const percent = (totalMinutes / 1439) * 100;
        
        marker.textContent = time.format('h:mm A');
        marker.style.left = `${percent}%`;
        marker.style.display = 'block';
    }

    function getTimezoneFromCity(cityName) {
        switch(cityName) {
            case 'Beijing': return 'Asia/Shanghai';
            case 'New York': return 'America/New_York';
            case 'London': return 'Europe/London';
            default: return moment.tz.names().find(tz => tz.includes(cityName));
        }
    }

    // Event delegation for all timezone controls
    timeZoneList.addEventListener('input', (e) => {
        const timeZoneItem = e.target.closest('.timezone-item');
        if (!timeZoneItem) return;

        const cityName = timeZoneItem.querySelector('h2').textContent;
        const timeZone = getTimezoneFromCity(cityName);
        if (!timeZone) return;

        const datePicker = timeZoneItem.querySelector('.timezone-date');
        const hourSelector = timeZoneItem.querySelector('.timezone-hour');
        const slider = timeZoneItem.querySelector('.time-slider');

        let baseDate;
        if (e.target.classList.contains('time-slider')) {
            const minutes = parseInt(slider.value);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            
            // Update the hour selector to match the slider position
            hourSelector.value = hours;
            
            baseDate = moment.tz(datePicker.value, timeZone)
                .hour(hours)
                .minute(mins);
                
            // Update current item's time display
            timeZoneItem.querySelector('.current-time').textContent = baseDate.format('h:mm A');
            timeZoneItem.querySelector('.timezone-label').textContent = baseDate.format('z');
            timeZoneItem.querySelector('.date-label').textContent = baseDate.format('ddd, MMM D');
            
            // Update current item's time marker
            updateTimeMarker(timeZoneItem, baseDate);
        } else if (e.target.classList.contains('timezone-date') || e.target.classList.contains('timezone-hour')) {
            const hours = parseInt(hourSelector.value);
            const minutes = parseInt(slider.value) % 60;
            
            baseDate = moment.tz(datePicker.value, timeZone)
                .hour(hours)
                .minute(minutes);
            
            // Update current item's time display
            timeZoneItem.querySelector('.current-time').textContent = baseDate.format('h:mm A');
            timeZoneItem.querySelector('.timezone-label').textContent = baseDate.format('z');
            timeZoneItem.querySelector('.date-label').textContent = baseDate.format('ddd, MMM D');
            
            // Update current item's slider
            const totalMinutes = hours * 60 + minutes;
            slider.value = totalMinutes;
            
            // Update current item's time marker
            updateTimeMarker(timeZoneItem, baseDate);
        }

        if (baseDate) {
            // Convert to UTC then update all other timezones
            const utcDate = baseDate.utc().toDate();
            updateAllTimeZones(utcDate, timeZone);
        }
    });

    // Initialize with current time
    updateAllTimeZones(new Date());
    
    // Add timezone functionality
    addButton.addEventListener('click', () => {
        if (searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            const matchingTimeZone = moment.tz.names().find(tz => 
                tz.toLowerCase().includes(searchTerm)
            );
            if (matchingTimeZone) {
                addTimezone(matchingTimeZone);
                searchInput.value = '';
            }
        }
    });

    // Remove timezone functionality
    timeZoneList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-button')) {
            const timeZoneItem = e.target.closest('.timezone-item');
            if (timeZoneItem && timeZoneList.children.length > 1) {
                timeZoneItem.remove();
            }
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
        updateTimes(new Date(datePicker.valueAsDate.getFullYear(), datePicker.valueAsDate.getMonth(), datePicker.valueAsDate.getDate(), Math.floor(minutes / 60), minutes % 60));
    });

    // Initialize hour selector
    hourSelector.addEventListener('change', () => {
        const selectedHour = parseInt(hourSelector.value);
        const minutes = selectedHour * 60;
        const baseDate = new Date(datePicker.valueAsDate.getFullYear(),
                                datePicker.valueAsDate.getMonth(),
                                datePicker.valueAsDate.getDate(),
                                selectedHour,
                                0);
        updateTimes(baseDate);
    });

    // Update hour selector when time changes
    function updateHourSelector(date) {
        const hour = date.getHours();
        hourSelector.value = hour;
    }

    // Modify updateTimes to also update hour selector
    function updateTimes(baseDate) {
        const items = document.querySelectorAll('.timezone-item');
        
        items.forEach(item => {
            const cityName = item.querySelector('h2').textContent;
            const timeZone = allTimezones.find(tz => tz.city === cityName)?.timezone;
            
            if (timeZone) {
                const localTime = moment(baseDate).tz(timeZone);
                const totalMinutes = localTime.hours() * 60 + localTime.minutes();
                
                // Update time display
                item.querySelector('.current-time').textContent = localTime.format('h:mm A');
                item.querySelector('.timezone-label').textContent = localTime.format('z');
                item.querySelector('.date-label').textContent = localTime.format('ddd, MMM D');
                
                // Update date and hour selectors
                const dateSelector = item.querySelector('.timezone-date');
                const hourSelector = item.querySelector('.timezone-hour');
                if (dateSelector && hourSelector) {
                    dateSelector.valueAsDate = localTime.toDate();
                    hourSelector.value = localTime.hours();
                }
                
                // Update slider position
                const slider = item.querySelector('.time-slider');
                slider.value = totalMinutes;
                
                // Update time marker
                const marker = item.querySelector('.current-time-marker');
                marker.textContent = localTime.format('h:mm A');
                marker.style.left = `${(totalMinutes / 1439) * 100}%`;
                marker.style.display = 'block';
            }
        });
        
        // Update timeline backgrounds
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

    function addTimezone(timezone) {
        const now = moment().tz(timezone);
        const city = timezone.split('/').pop().replace(/_/g, ' ');
        const region = timezone.split('/')[0];
        
        const newTimezoneItem = document.createElement('div');
        newTimezoneItem.className = 'timezone-item';
        newTimezoneItem.innerHTML = `
            <div class="timezone-info">
                <div class="timezone-header">
                    <h2>${city === 'Shanghai' ? 'Beijing' : city}</h2>
                    <button class="remove-button" title="Remove">×</button>
                </div>
                <div class="location-info">${region}</div>
                <div class="timezone-controls">
                    <input type="date" class="date-picker timezone-date" value="${now.format('YYYY-MM-DD')}">
                    <select class="hour-selector timezone-hour">
                        ${Array.from({length: 24}, (_, i) => {
                            const hour = i;
                            const period = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            return `<option value="${hour}" ${hour === now.hours() ? 'selected' : ''}>${displayHour} ${period}</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="time-info">
                    <span class="current-time">${now.format('h:mm A')}</span>
                    <span class="timezone-label">${now.format('z')}</span>
                    <span class="date-label">${now.format('ddd, MMM D')}</span>
                </div>
            </div>
            <div class="timeline-container">
                <div class="timeline">
                    <div class="time-marker">12am</div>
                    <div class="time-marker">3am</div>
                    <div class="time-marker">6am</div>
                    <div class="time-marker">9am</div>
                    <div class="time-marker">12pm</div>
                    <div class="time-marker">3pm</div>
                    <div class="time-marker">6pm</div>
                    <div class="time-marker">9pm</div>
                </div>
                <div class="timeline-slider">
                    <input type="range" min="0" max="1439" value="${now.hours() * 60 + now.minutes()}" class="time-slider">
                    <div class="current-time-marker"></div>
                </div>
            </div>
        `;

        timezoneList.appendChild(newTimezoneItem);
        updateAllTimeZones(now.toDate());
    }
});