document.addEventListener('DOMContentLoaded', () => {
    let timeSliders = document.querySelectorAll('.time-slider');
    let currentTimeMarkers = document.querySelectorAll('.current-time-marker');
    const datePicker = document.getElementById('datePicker');
    const searchInput = document.querySelector('.search-input');
    const addButton = document.querySelector('.add-button');
    const themeButton = document.querySelector('.icon-button[title="Theme"]');
    const shareButton = document.querySelector('.share-button');
    const currentTimeButton = document.querySelector('.current-time-button');
    const timezoneList = document.querySelector('.timezone-list');
    const hourSelector = document.getElementById('hourSelector');
    const saveButton = document.querySelector('.save-button'); // 直接获取保存按钮
    
    console.log('===== Application initialization started =====');
    
    // 使用更直观的存储键名
    const STORAGE_KEY = 'savedTimezoneCities';
    
    // 首先触发读取localStorage并加载时区
    initializeApp();
    
    // 主要初始化函数
    function initializeApp() {
        console.log('-----Initializing application-----');
        
        // 清空现有时区列表
        timezoneList.innerHTML = '';
        console.log('Cleared initial timezone list');
        
        // 预防可能的布局问题
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 10);
        
        // 尝试加载保存的设置
        if (!loadSavedTimezones()) {
            // 如果没有保存的设置，加载默认设置
            console.log('No saved settings found, loading default timezones');
            loadDefaultTimezones();
        }
        
        // 初始化保存按钮
        if (saveButton) {
            console.log('Found save button, adding click event');
            saveButton.addEventListener('click', handleSaveButtonClick);
            saveButton.textContent = 'Save Settings';
        } else {
            console.error('Save button not found!');
        }
        
        // 确保时区列表不会出现空白
        fixTimeZoneListLayout();
        
        // 移动Save按钮到最右侧
        moveHeaderButtons();
    }
    
    // 移动按钮到合适的位置
    function moveHeaderButtons() {
        console.log('Moving buttons around to match the requirements');
        
        // 基于HTML结构找到按钮组
        const buttonGroup = document.querySelector('.button-group');
        if (!buttonGroup) {
            console.error('Could not find button group');
            return;
        }
        
        // 找到主题按钮和保存按钮
        const themeBtn = document.querySelector('.icon-button[title="Theme"]');
        
        // 如果两个按钮都存在，确保保存按钮在主题按钮之后
        if (themeBtn && saveButton) {
            console.log('Found both theme and save buttons, repositioning them');
            
            // 从DOM中移除保存按钮
            if (saveButton.parentElement) {
                saveButton.parentElement.removeChild(saveButton);
            }
            
            // 将保存按钮样式改为圆形图标按钮，与其他按钮一致
            saveButton.className = 'icon-button save-button';
            
            // 然后将保存按钮添加到按钮组的末尾，确保它在主题按钮后面
            buttonGroup.appendChild(saveButton);
            
            // 如果主题按钮是最后一个，则交换它们的位置
            if (themeBtn === buttonGroup.lastElementChild) {
                console.log('Theme button is last, moving save button after it');
                buttonGroup.insertBefore(themeBtn, saveButton);
            }
            
            // 只显示图标，不显示文字
            saveButton.innerHTML = `<i class="icon">💾</i>`;
            saveButton.title = "Save Settings";
            
            console.log('Successfully moved save button to appear after theme button');
        } else {
            console.error('Could not find theme button or save button');
        }
    }
    
    // 保存按钮点击处理
    function handleSaveButtonClick() {
        console.log('Save button clicked');
        saveTimezonesToLocalStorage(true);
    }
    
    // 加载保存的时区设置
    function loadSavedTimezones() {
        console.log('Attempting to load saved timezone settings...');
        
        try {
            // 从localStorage获取保存的数据
            const savedData = window.localStorage.getItem(STORAGE_KEY);
            console.log('Data read from localStorage:', savedData);
            
            if (!savedData) {
                console.log('localStorage has no saved data');
                return false;
            }
            
            // 解析保存的数据
            try {
                const cities = JSON.parse(savedData);
                console.log('Parsed city data:', cities);
                
                if (!Array.isArray(cities) || cities.length === 0) {
                    console.log('Parsed data is not a valid city array');
                    return false;
                }
                
                // 倒序加载城市（因为新添加的会在最上方）
                console.log('Starting to load saved cities...');
                for (let i = cities.length - 1; i >= 0; i--) {
                    const cityName = cities[i];
                    console.log(`Loading city ${i+1}/${cities.length}: ${cityName}`);
                    addTimezone(getTimezoneFromCity(cityName), true);
                }
                
                console.log('Saved cities loaded');
                updateAllTimeZones(new Date());
                return true;
            } catch (parseError) {
                console.error('Failed to parse saved data:', parseError);
                return false;
            }
        } catch (error) {
            console.error('Failed to read localStorage:', error);
            return false;
        }
    }
    
    // 加载默认时区
    function loadDefaultTimezones() {
        console.log('Loading default timezones...');
        // 先添加London，然后New York，最后Beijing（顺序很重要，因为prepend会使最后添加的显示在最前面）
        addTimezone('Europe/London', true);
        addTimezone('America/New_York', true);
        addTimezone('Asia/Shanghai', true);
        console.log('Default timezones loaded');
        updateAllTimeZones(new Date());
    }
    
    // 保存当前时区设置到localStorage
    function saveTimezonesToLocalStorage(showNotification = false) {
        console.log('Saving timezone settings...');
        
        try {
            // 获取所有时区项
            const timezoneItems = document.querySelectorAll('.timezone-item');
            if (timezoneItems.length === 0) {
                console.warn('No timezones to save');
                return false;
            }
            
            // 提取城市名称
            const cityNames = Array.from(timezoneItems).map(item => {
                const cityElem = item.querySelector('h2');
                return cityElem ? cityElem.textContent : null;
            }).filter(name => name); // 过滤掉空值
            
            console.log('Cities to be saved:', cityNames);
            
            // 保存到localStorage
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cityNames));
            
            console.log('Successfully saved city list:', cityNames);
            
            if (showNotification) {
                showSaveNotification();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            if (showNotification) {
                alert('Failed to save settings: ' + error.message);
            }
            return false;
        }
    }
    
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
        const tooltip = currentTimeButton.querySelector('.current-time-tooltip');
        if (tooltip) {
            tooltip.textContent = moment().format('h:mm A');
        }
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
        
        // 更新移动按钮的显示状态
        updateMoveButtonsVisibility();
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
    
    // 改进后的添加时区功能，确保清空输入框
    addButton.addEventListener('click', () => {
        if (searchInput.value.trim()) {
            const searchTerm = searchInput.value.toLowerCase().trim();
            console.log(`Adding timezone from search: ${searchTerm}`);
            
            // 先尝试搜索匹配的时区
            const results = allTimezones.filter(tz => 
                tz.city.toLowerCase().includes(searchTerm) || 
                tz.region.toLowerCase().includes(searchTerm) || 
                tz.timezone.toLowerCase().includes(searchTerm)
            );
            
            if (results.length > 0) {
                // 使用第一个匹配结果
                const bestMatch = results[0];
                console.log(`Found best matching timezone: ${bestMatch.timezone} (${bestMatch.city})`);
                addTimezone(bestMatch.timezone);
                
                // 确保清空输入框和搜索结果
                searchInput.value = '';
                hideSearchResults();
                // 让输入框失去焦点，收起手机键盘
                searchInput.blur();
                // 显示未保存提示
                showUnsavedChangesNotification();
            } else {
                console.log('No matching timezones found');
                alert('No matching timezones found. Please try a different search term.');
            }
        }
    });

    // 移动时区项上下功能和删除时区功能
    timeZoneList.addEventListener('click', (e) => {
        // 处理删除按钮点击
        if (e.target.classList.contains('remove-button')) {
            const timeZoneItem = e.target.closest('.timezone-item');
            if (timeZoneItem && timeZoneList.children.length > 1) {
                timeZoneItem.remove();
                // 显示未保存提示
                showUnsavedChangesNotification();
                // 更新按钮显示状态
                updateMoveButtonsVisibility();
            }
        }
        // 处理向上移动按钮点击
        else if (e.target.classList.contains('move-up-button')) {
            const timeZoneItem = e.target.closest('.timezone-item');
            const prevItem = timeZoneItem.previousElementSibling;
            
            if (prevItem) {
                timeZoneList.insertBefore(timeZoneItem, prevItem);
                showUnsavedChangesNotification();
                updateMoveButtonsVisibility();
            }
        }
        // 处理向下移动按钮点击
        else if (e.target.classList.contains('move-down-button')) {
            const timeZoneItem = e.target.closest('.timezone-item');
            const nextItem = timeZoneItem.nextElementSibling;
            
            if (nextItem) {
                timeZoneList.insertBefore(nextItem, timeZoneItem);
                showUnsavedChangesNotification();
                updateMoveButtonsVisibility();
            }
        }
    });

    // 更新移动按钮的可见性
    function updateMoveButtonsVisibility() {
        const items = document.querySelectorAll('.timezone-item');
        
        // 如果只有一个时区项，不显示任何上下按钮
        if (items.length <= 1) {
            items.forEach(item => {
                const arrowButtons = item.querySelector('.arrow-buttons');
                if (arrowButtons) {
                    arrowButtons.innerHTML = '';
                }
            });
            return;
        }
        
        // 更新每个时区项的按钮显示
        items.forEach((item, index) => {
            const arrowButtons = item.querySelector('.arrow-buttons');
            if (!arrowButtons) return;
            
            if (index === 0) {
                // 第一项只显示向下按钮
                arrowButtons.innerHTML = `
                    <button class="arrow-button move-down-button" title="Move Down">🔽</button>
                `;
            } else if (index === items.length - 1) {
                // 最后一项只显示向上按钮
                arrowButtons.innerHTML = `
                    <button class="arrow-button move-up-button" title="Move Up">🔼</button>
                `;
            } else {
                // 中间项显示上下按钮
                arrowButtons.innerHTML = `
                    <button class="arrow-button move-up-button" title="Move Up">🔼</button>
                    <button class="arrow-button move-down-button" title="Move Down">🔽</button>
                `;
            }
        });
    }

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

    // 添加搜索输入框的事件监听
    searchInput.addEventListener('input', handleSearch);
    
    // 添加搜索框聚焦事件
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length > 0) {
            handleSearch();
        }
    });
    
    // 添加点击其他地方时隐藏搜索结果
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideSearchResults();
        }
    });
    
    // 处理搜索功能
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm.length < 1) {
            hideSearchResults();
            return;
        }
        
        console.log(`Searching timezones: ${searchTerm}`);
        
        // 从所有时区中筛选匹配项
        const results = allTimezones.filter(tz => 
            tz.city.toLowerCase().includes(searchTerm) || 
            tz.region.toLowerCase().includes(searchTerm) || 
            tz.timezone.toLowerCase().includes(searchTerm)
        ).slice(0, 20); // 限制结果数量
        
        if (results.length > 0) {
            console.log(`Found ${results.length} matching timezones`);
            showSearchResults(results);
        } else {
            console.log('No matching timezones found');
            hideSearchResults();
        }
    }

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

    function addTimezone(timezone, isLoading = false) {
        console.log(`Adding timezone: ${timezone}, isLoading: ${isLoading}`);
        
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
            <div class="arrow-buttons">
                <!-- 箭头按钮将通过JS动态添加 -->
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
        
        // 仅当不是在加载过程中时更新时区
        if (!isLoading) {
            updateAllTimeZones(now.toDate());
        }
        
        // 更新所有时区项的上下箭头按钮
        updateMoveButtonsVisibility();
        
        return newTimezoneItem;
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
        
        // 使通知更明显
        notification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="font-size: 18px; margin-right: 8px;">✅</span>
                <div>
                    <div style="font-weight: bold;">Settings Saved</div>
                    <div style="font-size: 12px;">Your timezone settings have been saved to local storage</div>
                    <div style="font-size: 11px; margin-top: 5px;">Tip: Remember to save changes before closing the page!</div>
                </div>
            </div>
        `;
        
        // 显示通知
        setTimeout(() => {
            notification.style.opacity = '1';
            
            // 添加一个视觉效果，短暂改变背景色
            timezoneList.querySelectorAll('.timezone-item').forEach(item => {
                const originalBg = item.style.backgroundColor;
                item.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                setTimeout(() => {
                    item.style.backgroundColor = originalBg;
                }, 1000);
            });
            
            // 保存按钮动画效果
            if (saveButton) {
                // 添加saved类以显示保存成功状态
                saveButton.classList.add('saved');
                
                // 2秒后恢复正常状态
                setTimeout(() => {
                    saveButton.classList.remove('saved');
                }, 2000);
            }
        }, 10);
        
        // 5秒后隐藏通知（增加显示时间）
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 5000);
    }

    // 添加清除缓存的快捷键
    document.addEventListener('keydown', (e) => {
        // 按Ctrl+Shift+Delete清除所有设置（仅开发测试用）
        if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
            if (confirm('Are you sure you want to clear all saved settings? This will restore the default timezone layout.')) {
                clearAllSettings();
            }
        }
    });
    
    // 添加清除存储的功能，便于调试
    function clearAllSettings() {
        try {
            // 清除所有自定义设置
            localStorage.removeItem(STORAGE_KEY);
            console.log('All saved timezone settings cleared');
            
            // 刷新页面
            alert('Settings cleared, the page will now reload');
            location.reload(); // 刷新页面
        } catch (error) {
            console.error('Failed to clear settings:', error);
            alert('Failed to clear settings: ' + error.message);
        }
    }
    
    // 移除页面关闭或刷新前的自动保存
    window.addEventListener('beforeunload', (event) => {
        // 不再自动保存设置
    });
    
    // 可以在控制台使用此函数重置应用
    window.clearAllSettings = clearAllSettings;

    // 显示未保存提示
    function showUnsavedChangesNotification() {
        // 检查是否已存在通知元素
        let notification = document.querySelector('.unsaved-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'unsaved-notification';
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.backgroundColor = 'rgba(255, 152, 0, 0.9)';
            notification.style.color = 'white';
            notification.style.padding = '10px 15px';
            notification.style.borderRadius = '5px';
            notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.2)';
            notification.style.zIndex = '1000';
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(notification);
        }
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
                <div>
                    <div style="font-weight: bold;">Unsaved Changes</div>
                    <div style="font-size: 12px;">You have unsaved changes</div>
                    <div style="font-size: 11px; margin-top: 5px;">Click the save button to save your settings</div>
                </div>
            </div>
        `;
        
        // 显示通知
        setTimeout(() => {
            notification.style.opacity = '1';
            
            // 高亮保存按钮
            if (saveButton) {
                saveButton.style.animation = 'pulse 1.5s infinite';
            }
        }, 10);
        
        // 5秒后隐藏通知
        setTimeout(() => {
            notification.style.opacity = '0';
            
            // 停止保存按钮动画
            if (saveButton) {
                saveButton.style.animation = '';
            }
        }, 5000);
    }

    // 修复时区列表可能的布局问题
    function fixTimeZoneListLayout() {
        // 确保时区项目之间没有意外的空白
        const items = document.querySelectorAll('.timezone-item');
        items.forEach((item, index) => {
            if (index > 0) {
                item.style.marginTop = '8px';
            }
        });
    }

    // 改进的搜索结果点击处理
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

        // 改进点击处理器，确保清空输入框和收起键盘
        resultsContainer.querySelectorAll('.search-result').forEach(result => {
            result.addEventListener('click', () => {
                const timezone = result.dataset.timezone;
                console.log(`Selected timezone: ${timezone}`);
                addTimezone(timezone);
                hideSearchResults();
                // 确保清空输入框
                searchInput.value = '';
                // 让输入框失去焦点，收起手机键盘
                searchInput.blur();
                // 显示未保存提示
                showUnsavedChangesNotification();
            });
        });
    }

    function hideSearchResults() {
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.remove();
        }
    }
    
    // 确保页面完全加载后按钮位置正确
    setTimeout(moveHeaderButtons, 500);
    
    // 在窗口大小改变时重新调整按钮位置
    window.addEventListener('resize', moveHeaderButtons);

    // ====== Leaflet 地图与时区联动 ======
    const cityMarkers = [
      { name: 'Beijing', timezone: 'Asia/Shanghai', lat: 39.9042, lng: 116.4074 },
      { name: 'New York', timezone: 'America/New_York', lat: 40.7128, lng: -74.0060 },
      { name: 'London', timezone: 'Europe/London', lat: 51.5074, lng: -0.1278 },
      { name: 'Tokyo', timezone: 'Asia/Tokyo', lat: 35.6895, lng: 139.6917 },
      { name: 'Paris', timezone: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
      { name: 'Singapore', timezone: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
      { name: 'Sydney', timezone: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
      { name: 'Moscow', timezone: 'Europe/Moscow', lat: 55.7558, lng: 37.6173 },
      { name: 'Dubai', timezone: 'Asia/Dubai', lat: 25.2048, lng: 55.2708 }
    ];
    let leafletMap, markerMap = {};
    // ====== 邮编本地表（部分中美欧常用） ======
    const postalCodeTable = [
      // 中国
      { code: '100000', city: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
      { code: '200000', city: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
      // 美国
      { code: '10001', city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
      { code: '90001', city: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
      // 欧洲
      { code: '10115', city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
      { code: '75001', city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
      { code: '00118', city: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
      // 可继续扩展...
    ];

    // ====== 地图点击事件增强 ======
    function getCountryCityFromTimezone(tz) {
      // 简单映射，实际可扩展为更全表
      const map = {
        'Asia/Shanghai': { country: 'China', city: 'Beijing' },
        'America/New_York': { country: 'USA', city: 'New York' },
        'Europe/London': { country: 'UK', city: 'London' },
        'Europe/Paris': { country: 'France', city: 'Paris' },
        'Europe/Berlin': { country: 'Germany', city: 'Berlin' },
        'Europe/Rome': { country: 'Italy', city: 'Rome' },
        'America/Los_Angeles': { country: 'USA', city: 'Los Angeles' },
        'Asia/Tokyo': { country: 'Japan', city: 'Tokyo' },
        'Asia/Singapore': { country: 'Singapore', city: 'Singapore' },
        'Australia/Sydney': { country: 'Australia', city: 'Sydney' },
        'Europe/Moscow': { country: 'Russia', city: 'Moscow' },
        'Asia/Dubai': { country: 'UAE', city: 'Dubai' },
      };
      return map[tz] || { country: '', city: '' };
    }

    // ====== 全球主要大城市英文名+国家全名+经纬度表，异步加载 ======
    let allCities = [];
    fetch('world-cities-major.json')
      .then(res => res.json())
      .then(data => { allCities = data; });
    function haversine(lat1, lng1, lat2, lng2) {
      const toRad = deg => deg * Math.PI / 180;
      const R = 6371; // 地球半径，单位km
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
    function findNearestCity(lat, lng) {
      let minDist = Infinity, nearest = null;
      for (const city of allCities) {
        const d = haversine(city.lat, city.lng, lat, lng);
        if (d < minDist) {
          minDist = d;
          nearest = city;
        }
      }
      return nearest;
    }

    // 国家代码转英文全名映射表
    const countryCodes = {
      US: 'United States',
      CA: 'Canada',
      AR: 'Argentina',
      CN: 'China',
      GB: 'United Kingdom',
      FR: 'France',
      DE: 'Germany',
      IT: 'Italy',
      RU: 'Russia',
      JP: 'Japan',
      AU: 'Australia',
      SG: 'Singapore',
      AE: 'United Arab Emirates',
      BR: 'Brazil',
      IN: 'India',
      MX: 'Mexico',
      ES: 'Spain',
      // ...可继续扩展
    };

    function showTimezoneConfirmDialog(tz, lat, lng) {
      // 获取UTC偏移和缩写
      const now = moment();
      const offset = now.tz(tz).format('Z');
      let abbr = now.tz(tz).format('z');
      if (!abbr || abbr.match(/^([+\-]?\d{2}:?\d{2}|GMT|UTC)$/i)) {
        abbr = `UTC${offset}`;
      }
      const msg = `添加时区？\n时区：${tz} (${abbr})\nUTC偏移：UTC${offset}\n经纬度：${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      return new Promise((resolve) => {
        if (window.confirm(msg)) resolve(true); else resolve(false);
      });
    }

    // 修改地图点击事件
    function initWorldMap() {
      leafletMap = L.map('world-map', {
        center: [20, 0],
        zoom: 2,
        worldCopyJump: true,
        zoomControl: true,
        attributionControl: false
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 6,
        minZoom: 2
      }).addTo(leafletMap);
      cityMarkers.forEach(city => {
        const marker = L.marker([city.lat, city.lng]).addTo(leafletMap)
          .bindTooltip(city.name, {permanent: false, direction: 'top'});
        marker.on('click', () => {
          addTimezone(city.timezone);
          highlightMarker(city.timezone);
          scrollToTimezone(city.name);
        });
        markerMap[city.timezone] = marker;
      });
      // 新增：地图任意点击
      leafletMap.on('click', async function(e) {
        const { lat, lng } = e.latlng;
        let tz;
        try {
          tz = window.tzlookup(lat, lng);
        } catch {
          alert('无法识别该位置的时区');
          return;
        }
        const ok = await showTimezoneConfirmDialog(tz, lat, lng);
        if (ok) addTimezone(tz);
      });
    }
    function highlightMarker(timezone) {
      Object.entries(markerMap).forEach(([tz, marker]) => {
        const icon = marker._icon;
        if (icon) {
          if (tz === timezone) icon.classList.add('selected');
          else icon.classList.remove('selected');
        }
      });
    }
    function scrollToTimezone(cityName) {
      // 滚动到对应的时区卡片
      setTimeout(() => {
        const items = document.querySelectorAll('.timezone-item h2');
        for (const h2 of items) {
          if (h2.textContent === cityName || (cityName === 'Beijing' && h2.textContent === 'Beijing')) {
            h2.scrollIntoView({behavior: 'smooth', block: 'center'});
            h2.parentElement.parentElement.parentElement.classList.add('highlighted');
            setTimeout(() => h2.parentElement.parentElement.parentElement.classList.remove('highlighted'), 1500);
            break;
          }
        }
      }, 300);
    }
    // 在添加时区后高亮地图marker
    const origAddTimezone = addTimezone;
    addTimezone = function(timezone, isLoading = false) {
      const item = origAddTimezone.apply(this, arguments);
      highlightMarker(timezone);
      return item;
    };
    // 页面加载后初始化地图
    setTimeout(initWorldMap, 0);
});