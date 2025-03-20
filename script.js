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
    const saveButton = document.querySelector('.save-button');
    
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

    // 保存当前时区设置到本地存储
    function saveTimezonesToLocalStorage(showNotification = false) {
        const timezones = Array.from(document.querySelectorAll('.timezone-item')).map(item => {
            const cityName = item.querySelector('h2').textContent;
            return getTimezoneFromCity(cityName);
        });
        
        localStorage.setItem('savedTimezones', JSON.stringify(timezones));
        console.log('已保存时区设置:', timezones); // 添加日志便于调试
        
        // 仅在手动保存时显示提示
        if (showNotification) {
            showSaveNotification();
        }
    }
    
    // 显示保存成功的提示
    function showSaveNotification() {
        // 检查是否已存在通知元素
        let notification = document.querySelector('.save-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'save-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = '时区设置已保存！';
        
        // 显示通知
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // 3秒后隐藏通知
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 3000);
    }

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

        // 每次更新后自动保存时区设置（静默保存，不显示通知）
        saveTimezonesToLocalStorage(false);
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
            case 'Los Angeles': return 'America/Los_Angeles';
            case 'Tokyo': return 'Asia/Tokyo';
            case 'Paris': return 'Europe/Paris';
            case 'Singapore': return 'Asia/Singapore';
            case 'Sydney': return 'Australia/Sydney';
            case 'Moscow': return 'Europe/Moscow';
            case 'Dubai': return 'Asia/Dubai';
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
    
    // 每分钟自动更新所有时区的时间
    setInterval(() => {
        const now = new Date();
        updateAllTimeZones(now);
    }, 60000); // 60秒更新一次
    
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
                // 删除地区后自动保存设置（静默保存，不显示通知）
                saveTimezonesToLocalStorage(false);
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

        // 将新添加的时区放在列表最前面
        timezoneList.prepend(newTimezoneItem);
        updateAllTimeZones(now.toDate());
        
        // 添加时区后自动保存设置（静默保存，不显示通知）
        saveTimezonesToLocalStorage(false);
    }
    
    // 从本地存储加载时区设置
    function loadTimezonesFromLocalStorage() {
        // 先清空现有的时区列表
        timezoneList.innerHTML = '';
        
        // 从localStorage获取保存的时区
        const savedTimezones = localStorage.getItem('savedTimezones');
        console.log('从localStorage读取到的数据:', savedTimezones); // 添加日志
        
        if (savedTimezones && savedTimezones !== "null" && savedTimezones !== "undefined") {
            try {
                // 如果有保存的时区，则加载它们（保持用户的自定义顺序）
                const timezones = JSON.parse(savedTimezones);
                console.log('解析后的时区数据:', timezones); // 添加日志
                
                if (Array.isArray(timezones) && timezones.length > 0) {
                    // 我们需要倒序添加，因为prepend会把每个新项放在最前面
                    // 所以我们要从数组的最后一个元素开始添加
                    for (let i = timezones.length - 1; i >= 0; i--) {
                        if (timezones[i]) {
                            addTimezone(timezones[i]);
                        }
                    }
                    return; // 成功加载保存的设置，提前返回
                }
            } catch (error) {
                console.error('加载保存的时区设置出错:', error);
            }
        }
        
        console.log('加载默认设置'); // 添加日志
        // 如果没有保存的时区设置或解析出错，则加载默认设置
        // 先添加伦敦，然后纽约，最后添加北京（由于prepend，北京会显示在最前面）
        addTimezone('Europe/London');
        addTimezone('America/New_York');
        addTimezone('Asia/Shanghai'); // 北京将显示在最前面
    }
    
    // 初始化时加载时区设置
    loadTimezonesFromLocalStorage();
    
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

    // 给保存按钮添加事件监听器
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            // 手动点击保存按钮，显示通知
            saveTimezonesToLocalStorage(true);
        });
    }
});