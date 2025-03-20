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
    
    console.log('===== 应用初始化开始 =====');
    
    // 使用更直观的存储键名
    const STORAGE_KEY = 'savedTimezoneCities';
    
    // 首先触发读取localStorage并加载时区
    initializeApp();
    
    // 主要初始化函数
    function initializeApp() {
        console.log('-----初始化应用-----');
        
        // 清空现有时区列表
        timezoneList.innerHTML = '';
        console.log('已清空初始时区列表');
        
        // 尝试加载保存的设置
        if (!loadSavedTimezones()) {
            // 如果没有保存的设置，加载默认设置
            console.log('没有找到已保存的设置，加载默认时区');
            loadDefaultTimezones();
        }
        
        // 初始化保存按钮
        if (saveButton) {
            console.log('找到保存按钮，添加点击事件');
            saveButton.addEventListener('click', handleSaveButtonClick);
        } else {
            console.error('未找到保存按钮!');
        }
        
        // 初始化拖放功能
        initDragAndDrop();
        console.log('已初始化拖放排序功能');
    }
    
    // 保存按钮点击处理
    function handleSaveButtonClick() {
        console.log('保存按钮被点击');
        saveTimezonesToLocalStorage(true);
    }
    
    // 加载保存的时区设置
    function loadSavedTimezones() {
        console.log('尝试加载保存的时区设置...');
        
        try {
            // 从localStorage获取保存的数据
            const savedData = window.localStorage.getItem(STORAGE_KEY);
            console.log('从localStorage读取的数据:', savedData);
            
            if (!savedData) {
                console.log('localStorage中没有保存的数据');
                return false;
            }
            
            // 解析保存的数据
            try {
                const cities = JSON.parse(savedData);
                console.log('解析后的城市数据:', cities);
                
                if (!Array.isArray(cities) || cities.length === 0) {
                    console.log('解析的数据不是有效的城市数组');
                    return false;
                }
                
                // 倒序加载城市（因为新添加的会在最上方）
                console.log('开始加载保存的城市...');
                for (let i = cities.length - 1; i >= 0; i--) {
                    const cityName = cities[i];
                    console.log(`加载城市 ${i+1}/${cities.length}: ${cityName}`);
                    addTimezone(getTimezoneFromCity(cityName), true);
                }
                
                console.log('保存的城市加载完成');
                updateAllTimeZones(new Date());
                return true;
            } catch (parseError) {
                console.error('解析保存的数据失败:', parseError);
                return false;
            }
        } catch (error) {
            console.error('读取localStorage失败:', error);
            return false;
        }
    }
    
    // 加载默认时区
    function loadDefaultTimezones() {
        console.log('加载默认时区...');
        // 先添加London，然后New York，最后Beijing（顺序很重要，因为prepend会使最后添加的显示在最前面）
        addTimezone('Europe/London', true);
        addTimezone('America/New_York', true);
        addTimezone('Asia/Shanghai', true);
        console.log('默认时区加载完成');
        updateAllTimeZones(new Date());
    }
    
    // 保存当前时区设置到localStorage
    function saveTimezonesToLocalStorage(showNotification = false) {
        console.log('保存时区设置...');
        
        try {
            // 获取所有时区项
            const timezoneItems = document.querySelectorAll('.timezone-item');
            if (timezoneItems.length === 0) {
                console.warn('没有时区可以保存');
                return false;
            }
            
            // 提取城市名称
            const cityNames = Array.from(timezoneItems).map(item => {
                const cityElem = item.querySelector('h2');
                return cityElem ? cityElem.textContent : null;
            }).filter(name => name); // 过滤掉空值
            
            console.log('将要保存的城市:', cityNames);
            
            // 保存到localStorage
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cityNames));
            
            console.log('成功保存城市列表:', cityNames);
            
            if (showNotification) {
                showSaveNotification();
            }
            
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            if (showNotification) {
                alert('保存设置失败: ' + error.message);
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
                // 显示未保存提示
                showUnsavedChangesNotification();
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

    function addTimezone(timezone, isLoading = false) {
        console.log(`添加时区: ${timezone}, 是否加载中: ${isLoading}`);
        
        const now = moment().tz(timezone);
        const city = timezone.split('/').pop().replace(/_/g, ' ');
        const region = timezone.split('/')[0];
        
        const newTimezoneItem = document.createElement('div');
        newTimezoneItem.className = 'timezone-item';
        // 添加拖动功能所需的属性
        newTimezoneItem.setAttribute('draggable', 'true');
        newTimezoneItem.innerHTML = `
            <div class="timezone-info">
                <div class="timezone-header">
                    <h2>${city === 'Shanghai' ? 'Beijing' : city}</h2>
                    <div class="header-controls">
                        <span class="drag-handle" title="拖动调整顺序">⋮⋮</span>
                        <button class="remove-button" title="Remove">×</button>
                    </div>
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
        
        // 绑定拖拽事件
        setupDragAndDrop(newTimezoneItem);
        
        // 仅当不是在加载过程中时更新时区（移除保存部分）
        if (!isLoading) {
            updateAllTimeZones(now.toDate());
        }
        
        return newTimezoneItem;
    }
    
    // 设置拖放排序功能
    function setupDragAndDrop(timezoneItem) {
        // 默认禁用拖动
        timezoneItem.setAttribute('draggable', 'false');
        
        // 为拖动手柄添加事件
        const dragHandle = timezoneItem.querySelector('.drag-handle');
        if (dragHandle) {
            // 为拖动手柄添加鼠标按下事件
            dragHandle.addEventListener('mousedown', (e) => {
                console.log('拖动手柄被按下');
                // 设置父元素为可拖动
                timezoneItem.setAttribute('draggable', 'true');
                timezoneItem.style.cursor = 'grabbing';
                dragHandle.style.cursor = 'grabbing';
            });
        }
        
        // 为时区项添加拖拽事件
        timezoneItem.addEventListener('dragstart', (e) => {
            console.log('开始拖动时区项');
            draggedItem = timezoneItem;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', timezoneItem.innerHTML);
            timezoneItem.classList.add('dragging');
            
            // 添加拖动中的指示样式到所有时区项
            const items = document.querySelectorAll('.timezone-item');
            items.forEach(item => {
                if (item !== draggedItem) {
                    item.classList.add('droppable');
                }
            });
        });
        
        // 完成拖放后禁用拖动并显示未保存提示
        timezoneItem.addEventListener('dragend', (e) => {
            console.log('拖动结束');
            timezoneItem.classList.remove('dragging');
            
            // 移除所有时区项的拖动指示样式
            const items = document.querySelectorAll('.timezone-item');
            items.forEach(item => {
                item.setAttribute('draggable', 'false');
                item.classList.remove('droppable');
                item.classList.remove('drag-over');
                item.style.cursor = '';
                
                const handle = item.querySelector('.drag-handle');
                if (handle) {
                    handle.style.cursor = 'grab';
                }
            });
            
            draggedItem = null;
            
            // 显示未保存提示
            showUnsavedChangesNotification();
        });
        
        // 拖动经过另一个时区项
        timezoneItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            return false;
        });
        
        // 拖动进入另一个时区项
        timezoneItem.addEventListener('dragenter', function() {
            if (this !== draggedItem) {
                this.classList.add('drag-over');
            }
        });
        
        // 拖动离开时区项
        timezoneItem.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        // 放置时区项
        timezoneItem.addEventListener('drop', function(e) {
            e.stopPropagation();
            
            // 只在不同元素间处理放置
            if (draggedItem && this !== draggedItem) {
                console.log('放置时区项');
                // 获取当前时区项的位置信息
                const targetRect = this.getBoundingClientRect();
                const targetMiddleY = targetRect.top + targetRect.height / 2;
                
                // 根据放置位置（上半部分或下半部分）决定插入位置
                if (e.clientY < targetMiddleY) {
                    // 放在目标之前
                    timezoneList.insertBefore(draggedItem, this);
                } else {
                    // 放在目标之后
                    timezoneList.insertBefore(draggedItem, this.nextSibling);
                }
            }
            
            this.classList.remove('drag-over');
            return false;
        });
        
        // 为文档添加鼠标抬起事件，确保释放时禁用拖动
        document.addEventListener('mouseup', () => {
            timezoneItem.setAttribute('draggable', 'false');
            timezoneItem.style.cursor = '';
            if (dragHandle) {
                dragHandle.style.cursor = 'grab';
            }
        });
    }
    
    // 当前被拖动的元素
    let draggedItem = null;
    
    // 初始化已存在的时区项的拖放功能
    function initDragAndDrop() {
        console.log('开始初始化拖放功能');
        const existingItems = document.querySelectorAll('.timezone-item');
        console.log(`找到 ${existingItems.length} 个时区项`);
        
        existingItems.forEach((item, index) => {
            console.log(`设置第 ${index+1} 个时区项的拖放功能`);
            setupDragAndDrop(item);
            
            // 检查并确保拖动手柄样式正确
            const dragHandle = item.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.style.cursor = 'grab';
                console.log('已设置拖动手柄的鼠标样式为手掌形状');
            } else {
                console.warn('未找到拖动手柄元素');
            }
        });
        
        console.log('拖放功能初始化完成');
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
                    <div style="font-weight: bold;">设置已保存</div>
                    <div style="font-size: 12px;">您的时区设置已成功保存到本地存储</div>
                    <div style="font-size: 11px; margin-top: 5px;">提示：下次打开页面前请记得保存更改！</div>
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
                const originalBg = saveButton.style.backgroundColor;
                const originalColor = saveButton.style.color;
                
                saveButton.style.backgroundColor = 'var(--accent-color)';
                saveButton.style.color = 'white';
                saveButton.style.transform = 'scale(1.1)';
                saveButton.textContent = '✓ 已保存';
                
                setTimeout(() => {
                    saveButton.style.backgroundColor = originalBg;
                    saveButton.style.color = originalColor;
                    saveButton.style.transform = 'scale(1)';
                    saveButton.textContent = '保存设置';
                }, 2000);
            }
        }, 10);
        
        // 5秒后隐藏通知（增加显示时间）
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 5000);
    }

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

    // 添加清除缓存的快捷键
    document.addEventListener('keydown', (e) => {
        // 按Ctrl+Shift+Delete清除所有设置（仅开发测试用）
        if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
            if (confirm('确定要清除所有保存的设置吗？这将恢复默认时区布局。')) {
                clearAllSettings();
            }
        }
    });
    
    // 添加清除存储的功能，便于调试
    function clearAllSettings() {
        try {
            // 清除所有自定义设置
            localStorage.removeItem(STORAGE_KEY);
            console.log('已清除所有保存的时区设置');
            
            // 刷新页面
            alert('设置已清除，页面将重新加载');
            location.reload(); // 刷新页面
        } catch (error) {
            console.error('清除设置失败:', error);
            alert('清除设置失败: ' + error.message);
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
                    <div style="font-weight: bold;">未保存的更改</div>
                    <div style="font-size: 12px;">您有未保存的更改</div>
                    <div style="font-size: 11px; margin-top: 5px;">点击"保存设置"按钮以保存您的设置</div>
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
});