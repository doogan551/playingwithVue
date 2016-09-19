var dorsett = {
    $loginBtn: $('#loginBtn'),
    itemIdx: 0,
    settings: {
        logLinePrefix: true,
        webEndpoint: window.location.origin,
        socketEndPoint: window.location.origin,
        apiEndpoint: window.location.origin + '/api/',
        idxPrefix: 'dorsett_',
        sessionId: btoa(new Date().getTime().toString().split('').reverse().join(''))
    },
    config: {
        init: function () {
            dorsett.utility.configureMoment(moment);
        },
        itemGroups: {
            'Display': {
                title: 'Displays',
                iconText: 'tv',
                iconClass: 'material-icons',
                group: 'Display',
                thumbnail: true,
                singleton: false
            },
            'Sequence': {
                title: 'Sequences',
                iconText: 'device_hub',
                iconClass: 'material-icons',
                group: 'Sequence',
                thumbnail: true,
                singleton: false
            },
            'Report': {
                title: 'Reports',
                iconText: 'assignment',
                iconClass: 'material-icons',
                group: 'Report',
                singleton: false,
                options: {
                    width: 1000
                }
            },
            'Dashboard': {
                title: 'Dashboards',
                iconText: '',
                iconClass: 'mdi mdi-gauge',
                group: 'Dashboard',
                standalone: true,
                url: '/dashboard',
                singleton: true
            },
            'Alarm': {
                title: 'Alarms',
                iconText: 'notifications',
                iconClass: 'material-icons',
                group: 'Alarm',
                standalone: true,
                url: '/alarms',
                singleton: false,
                options: {
                    width: 1040
                }
            },
            'Activity Log': {
                title: 'Activity Logs',
                iconText: '',
                iconClass: 'mdi mdi-comment-multiple-outline',
                group: 'Activity Log',
                standalone: true,
                url: '/activityLogs',
                singleton: false,
                options: {
                    width: 1040
                }
            },
            'Point': {
                title: 'Points',
                iconText: 'memory',
                iconClass: 'material-icons',
                group: 'Point',
                singleton: false
            },
            'Settings': {
                title: 'System Prefs',
                iconText: 'settings',
                iconClass: 'material-icons',
                group: 'Settings',
                standalone: true,
                url: '/syspref',
                singleton: true,
                options: {
                    width: 1280
                }
            },
            'Security': {
                title: 'Security',
                iconText: 'security',
                iconClass: 'material-icons',
                group: 'Security',
                standalone: true,
                url: '/securityadmin',
                singleton: true,
                options: {
                    width: '85%',
                    height: '85%'
                }
            }
        }
    },
    makeId: function () {
        dorsett.itemIdx++;
        return dorsett.settings.idxPrefix + dorsett.itemIdx;
    },
    destroyObject: function (o, recursive) {
        var keys = Object.keys(o),
            val,
            c;

        for (c = 0; c < keys.length; c++) {
            val = o[keys[c]];

            if (val && typeof val === 'object' && recursive) {
                dorsett.destroyObject(val, true);
                delete o[keys[c]];
            } else {
                delete o[keys[c]];
            }
        }
    },
    arrayEquals: function (a, b) {
        var c;
        if (a === b) {
            return true;
        }

        if (a === null || b === null) {
            return false;
        }

        if (a.length !== b.length) {
            return false;
        }

        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.

        for (c = 0; c < a.length; ++c) {
            if (a[c] !== b[c]) {
                return false;
            }
        }

        return true;
    },
    forEach: function (obj, fn) {
        var keys = Object.keys(obj),
            c,
            len = keys.length,
            errorFree = true;

        for (c = 0; c < len && errorFree; c++) {
            errorFree = fn(obj[keys[c]], keys[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },
    forEachArray: function (arr, fn) {
        var c,
            list = arr || [],
            len = list.length,
            errorFree = true;

        for (c = 0; c < len && errorFree; c++) {
            errorFree = fn(list[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },
    forEachArrayRev: function (arr, fn) {
        var c,
            list = arr || [],
            len = list.length,
            errorFree = true;

        for (c = len - 1; c >= 0 && errorFree; c--) {
            errorFree = fn(list[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },
    formatDate: function (date, addSuffix) {
        var functions = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'],
            lengths = [2, 2, 2, 3],
            separators = [':', ':', ':', ''],
            suffix = ' --',
            fn,
            out = '';

        if (addSuffix) {
            separators.push(suffix);
        }

        if (typeof date === 'number') {
            date = new Date(date);
        }

        for (fn in functions) {
            if (functions.hasOwnProperty(fn)) {
                out += ('000' + date['get' + functions[fn]]()).slice(-1 * lengths[fn]) + separators[fn];
            }
        }

        return out;
    },
    log: function () {
        var stack,
            steps,
            lineNumber,
            err,
            now = new Date(),
            args = [].splice.call(arguments, 0),
            pad = function (num) {
                return ('    ' + num).slice(-4);
            },
            formattedorsettme = dorsett.formatDate(new Date(), true);

        if (dorsett.settings.logLinePrefix === true) {
            err = new Error();
            if (Error.captureStackTrace) {
                Error.captureStackTrace(err);

                stack = err.stack.split('\n')[2];

                steps = stack.split(':');

                lineNumber = steps[2];

                args.unshift('line:' + pad(lineNumber), formattedorsettme);
            }
        }
        // args.unshift(formattedorsettme);
        if (!dorsett.noLog) {
            console.log.apply(console, args);
        }
    },
    _events: {},
    _onceEvents: {},
    on: function (event, handler) {
        dorsett._events[event] = dorsett._events[event] || [];
        dorsett._events[event].push(handler);
    },
    once: function (event, handler) {
        dorsett._onceEvents[event] = dorsett._onceEvents[event] || [];
    },
    off: function (event, handler) {
        var handlers = dorsett._events[event] || [];

        dorsett.forEachArray(handlers, function processOffHandler (fn, idx) {
            if (fn === handler) {
                dorsett._events[event].splice(idx, 1);
                return false;
            }
        });
    },
    fire: function (event, obj1, obj2) {
        var c,
            handlers = dorsett._events[event] || [],
            len = handlers.length;

        // dorsett.log('firing', event);

        // if (!dorsett.skipEventLog) {
        //     dorsett.eventLog.push({
        //         event: event,
        //         obj1: obj1 && obj1.dorsettId,
        //         obj2: obj2 && obj2.dorsettId
        //     });
        // }

        for (c = 0; c < len; c++) {
            handlers[c](obj1 || null, obj2 || null);
        }
    },
    thumbs: {
    },
    animations: {
        _fade: function ($el, opacity, cb) {
            $el.velocity('stop');
            $el.velocity({
                opacity: opacity
            }, {
                queue: false,
                duration: 300,
                easing: 'easeOutSine',
                complete: cb
            });
        },
        fadeIn: function ($el, cb) {
            $el[0].style.willChange = 'opacity, display';
            $el.css('display', 'block');
            dorsett.animations._fade($el, 1, cb);
        },
        fadeOut: function ($el, cb) {
            dorsett.animations._fade($el, 0, function finishFadeOut () {
                $el.css('display', 'none');
                $el[0].style.willChange = '';
                if (cb) {
                    cb();
                }
            });
        },
        slideUp: function ($el, cb) {
            $el[0].style.willChange = 'height, padding-top, padding-bottom';
            $el.css('overflow', 'hidden');
            $el.velocity('stop');
            $el.velocity({
                height: 0,
                'padding-top': 0,
                'padding-bottom': 0
            }, {
                queue: false,
                duration: 300,
                easing: 'easeOutSine',
                complete: function finishSlideUp () {
                    $el.css('display', 'none');
                    $el[0].style.willChange = '';
                    if (cb) {
                        cb();
                    }
                }
            });
        }
    },
    events: {
        init: function () {
            dorsett.on('hideMenus', function hideMenu () {
                $('.modal.open').closeModal();
            });
        },
        _bodyClickHandlers: [],
        bodyClick: function (fn) {
            dorsett.events._bodyClickHandlers.push(fn);
        },
        clickMenu: function (clickEl, menuEl, callbacks) {
            var isOpen = false,
                $clickEl = $(clickEl),
                $menuEl = $(menuEl);

            $clickEl.click(function openMenu (event) {
                isOpen = true;
                
                dorsett.animations.fadeIn($menuEl, callbacks && callbacks.after);

                if (callbacks && callbacks.before) {
                    callbacks.before();
                }

            });

            dorsett.events.bodyClick(function checkOpenMenu (event) {
                if (isOpen && $(event.target).parents(menuEl).length === 0) {
                    isOpen = false;
                    dorsett.animations.fadeOut($menuEl);
                }
            });

            dorsett.on('hideMenus', function hideMenu () {
                isOpen = false;
                dorsett.animations.fadeOut($menuEl);
            });
        },
        hoverMenu: function (button, menuEl, eventHandlers) {
            var $button = $(button),
                menuShown = false,
                menuID = menuEl || $button.data('menu'),
                $menu = $('#' + menuID),
                hideTimer,
                hoverDelay = 500,
                closeMenu = function (id) {
                    if (id || id !== menuID) {
                        if (menuShown) {
                            menuShown = false;
                            dorsett.animations.fadeOut($menu, function checkMenuClose () {
                                if (eventHandlers && eventHandlers.onHide) {
                                    eventHandlers.onHide();
                                }
                            });
                        }
                    }
                },
                setOpen = function () {
                    menuShown = true;
                },
                setTimer = function () {
                    // clearTimeout(hideTimer);
                    hideTimer = setTimeout(closeMenu, hoverDelay);
                },
                destroy = function () {
                    $button.off('mouseenter mouseleave');
                    $('#' + menuID).off('mouseenter mouseleave');
                    clearTimeout(hideTimer);
                    dorsett.off('hideMenus', closeMenu);
                    dorsett.off('openMenu', closeMenu);
                };

            $button.hover(function showHoverMenu (event) {
                dorsett.fire('openMenu', menuID);
                clearTimeout(hideTimer);
                if (!menuShown) {
                    menuShown = true;
                    if (eventHandlers && eventHandlers.onBeforeShow) {
                        eventHandlers.onBeforeShow();
                    }
                    dorsett.animations.fadeIn($menu, function checkMenuOpen () {
                        if (eventHandlers && eventHandlers.onShow) {
                            eventHandlers.onShow();
                        }
                    });
                }
            }, function hideHoverMenu (event) {
                var $relatedTarget = $(event.relatedTarget);

                if ($relatedTarget.attr('id') !== menuID && $relatedTarget.parents('#' + menuID).length === 0) {
                    setTimer();
                }
            });

            $('#' + menuID).hover(function maintainHoverMenu () {
                clearTimeout(hideTimer);
                if (!menuShown) {
                    dorsett.animations.fadeIn($menu);
                    menuShown = true;
                }
            }, function hideHoverMenu (event) {
                var $target = $(event.relatedTarget);

                if (($target.parents(button).length === 0) && ($target.attr('id')) !== 'context-menu-layer') {
                    setTimer();
                }
            });

            dorsett.events.bodyClick(function closeHoverMenus (event) {
                var $target = $(event.target),
                    notMenuClick = !$target.closest('#' + menuID).length,
                    notButtonClick = !$target.closest(button).length;

                if (menuShown && notMenuClick && notButtonClick) {
                    closeMenu();
                }
            });

            dorsett.on('hideMenus', closeMenu);

            dorsett.on('openMenu', closeMenu);

            return {
                isOpen: function () {
                    return menuShown;
                },
                destroy: destroy
            };
        }
    },
    Window: function (config) {
        var windowId = config.id || dorsett.makeId(),
            iframeId = dorsett.makeId(),
            active = false,
            loaded = false,
            group,
            finishedMeasurements,
            prepMeasurement = function (x) {
                if (typeof x === 'string') {
                    return x;
                }

                if (x !== undefined && x !== null) {
                    return x + 'px';
                }
            },
            prepMeasurements = function (inConfig) {
                var cfg = inConfig || config,
                    container = $(dorsett.windows.draggableConfig.containment),
                    containerWidth = container.width(),
                    containerHeight = container.height(),
                    containerPadding = parseFloat(container.css('padding'), 10),
                    obj = {
                        left: cfg.left,
                        top: cfg.top
                    };

                if (cfg.fullScreen) {
                    obj.left = containerPadding;
                    obj.top = containerPadding;
                    obj.width = containerWidth;
                    obj.height = containerHeight;
                } else {

                    obj.right = cfg.right;
                    obj.width = cfg.width || 800;

                    if (cfg.bottom !== undefined) {
                        obj.bottom = cfg.bottom;
                        obj.height = null;
                    } else {
                        obj.height = cfg.height || 600;
                        obj.bottom = null;
                    }

                    if (obj.right) {
                        if (obj.right - (obj.left || 0) >  containerWidth) {
                            obj.left = containerPadding;
                            obj.right = containerPadding;
                            obj.width = containerWidth - (2 * containerPadding);
                        }
                    } else {
                        if ((obj.left || 0) + obj.width > containerWidth) {
                            obj.width = containerWidth;
                            obj.left = containerPadding;
                        }
                    }

                    if ((obj.top || 0) + obj.height > containerHeight) {
                        obj.height = containerHeight;
                        obj.top = containerPadding;
                    }
                }

                dorsett.forEach(obj, function prepWindowMeasurement (val, key) {
                    obj[key] = prepMeasurement(val);
                });

                return obj;
            },
            getGroupName = function (config) {
                var groupName = dorsett.taskbar.getWindowGroupName(config.type);

                if (config.exempt) {
                    return '';
                }

                return groupName;
            },
            close = function (event) {
                self.bindings.minimize();
                dorsett.bindings.openWindows[self.bindings.group()].remove(self.bindings);

                self.$windowEl.draggable('destroy');
                self.$windowEl.resizable('destroy');

                dorsett.fire('closeWindow', self);

                if (self.$iframe[0].contentWindow.destroy) {
                    self.$iframe[0].contentWindow.destroy();
                }

                setTimeout(function closeWindow () {
                    self.$iframe.attr('src', 'about:blank');
                    ko.cleanNode(self.$windowEl[0]);
                    $(self.$iframe[0].contentDocument).off('mousedown');
                    self.$windowEl.remove();
                    // dorsett.destroyObject(self.bindings);
                    dorsett.destroyObject(self, true);
                }, 1000);
            },
            minimize = function (event, skipActivate) {
                active = false;
                self.bindings.minimized(true);
                if (active && !skipActivate) {
                    dorsett.windows.activate(null);
                }
            },
            deactivate = function (event) {
                active = false;
                self.bindings.active(false);
            },
            handleIframeClick = function (event) {
                self.bindings.activate();
            },
            activate = function (fromManager) {
                if (!active || fromManager === false) {
                    active = true;
                    if (fromManager !== true) {
                        dorsett.windows.activate(windowId);
                    }
                    self.bindings.minimized(false);
                    self.bindings.active(true);
                }
            },
            clearEvents = function () {
                $(self.$iframe[0].contentDocument).off('mousedown', handleIframeClick);
            },
            setUrl = function (url) {
                self.bindings.loading(true);
                clearEvents();  
                self.bindings.url(url);
            },
            refresh = function () {
                self.$iframe[0].contentWindow.location.reload();
            },
            self = {
                $windowEl: $($('#windowTemplate').html()),
                $iframe: null,
                bindings: {
                    title: ko.observable(config.title),
                    windowId: ko.observable(windowId),
                    group: ko.observable(getGroupName(config)),
                    url: ko.observable(config.url),
                    upi: ko.observable(config.upi),
                    refresh: refresh,
                    activate: activate,
                    minimize: minimize,
                    minimized: ko.observable(false),
                    loading: ko.observable(true),
                    windowsHidden: dorsett.bindings.windowsHidden,
                    close: close,
                    iconClass: ko.observable(),
                    iconText: ko.observable(),
                    thumbnail: ko.observable(false),
                    thumbnailFound: ko.observable(false),
                    active: ko.observable(false),
                    exempt: ko.observable(config.exempt || false),
                    height: ko.observable(prepMeasurement(config.height)),
                    width: ko.observable(prepMeasurement(config.width)),
                    left: ko.observable(prepMeasurement(config.left)),
                    top: ko.observable(prepMeasurement(config.top)),
                    right: ko.observable(prepMeasurement(config.right)),
                    bottom: ko.observable(prepMeasurement(config.bottom))
                },
                handleMessage: function (message) {
                    var callbacks = {
                        updateTitle: function () {
                            self.bindings.title(message.parameters);
                        },
                        resize: function () {
                            var measurements = prepMeasurements(message.parameters);

                            ko.viewmodel.updateFromModel(self.bindings, measurements);
                        }
                    };

                    if (callbacks[message.action]) {
                        callbacks[message.action]();
                    }
                },
                onLoad: function (event) {
                    // var group = this.contentWindow.pointType;
                    // self.bindings.group(group);

                    // dorsett.log('window loaded');

                    if (config.onLoad) {
                        dorsett.log('calling config.onload');
                        config.onLoad.call(self);
                    }

                    if (this.contentWindow.point) {
                        if (self.bindings.upi() === undefined) {
                            self.bindings.upi(this.contentWindow.point._id);
                        }
                    }

                    $(this.contentDocument).on('mousedown', handleIframeClick);

                    this.contentWindow.windowId = self.bindings.windowId();
                    this.contentWindow.close = function () {
                        self.bindings.close();
                    };

                    self.bindings.loading(false);
                },
                getGroup: function () {
                    //if point type app, get point type.  if not, check route?
                }
            };

        finishedMeasurements = prepMeasurements();

        finishedMeasurements = ko.viewmodel.fromModel(finishedMeasurements);

        self.bindings = $.extend(self.bindings, finishedMeasurements);                        

        $('main').append(self.$windowEl);
        self.$windowEl.attr('id', windowId);
        self.$iframe = self.$windowEl.children('iframe');
        self.$iframe.attr('id', iframeId);

        dorsett.utility.addEvent(self.$iframe[0], 'load', self.onLoad);

        if (config.upi !== undefined && typeof config.upi === 'number') {
            self.bindings.upi(config.upi);
        }

        group = dorsett.taskbar.getWindowGroup(config.type);
        self.bindings.iconClass(group.iconClass);
        self.bindings.iconText(group.iconText);
        self.bindings.thumbnail(group.thumbnail || false);

        self.$windowEl.draggable(dorsett.windows.draggableConfig);
        self.$windowEl.resizable(dorsett.windows.resizableConfig);

        //detect clicks inside iframe
        // setInterval(function detectIframeClick () {
        //     var elem = document.activeElement;
        //     if (elem && elem.id === iframeId) {
        //         self.bindings.activate();
        //     }
        // }, 100);

        ko.applyBindings(self.bindings, self.$windowEl[0]);

        return {
            setUrl: setUrl,
            minimize: minimize,
            close: close,
            deactivate: deactivate,
            activate: activate,
            $el: self.$windowEl,
            windowId: windowId,
            upi: config.upi,
            bindings: self.bindings,
            handleMessage: self.handleMessage
        };
    },
    windows: {
        _offsetX: 0,
        _offsetY: 0,
        _offset: 25,
        _offsetCount: 0,
        _offsetMax: 5,
        draggableConfig: {
            containment: 'main',
            scroll: false,
            start: function () {
                dorsett.windows.dragStart();
            },
            stop: function () {
                dorsett.windows.dragStop();
            }
        },
        resizableConfig: {
            // helper: 'ui-resizable-helper',
            containment: 'main',
            handles: 'all',
            start: function () {
                dorsett.windows.resizeStart();
            },
            stop: function () {
                dorsett.windows.resizeStop();
            }
        },
        windowList: [],
        _setInteractingFlag: function (isInteracting) {
            if (isInteracting) {
                $('body').addClass('interacting');
            } else {
                $('body').removeClass('interacting');
            }
        },
        getWindowById: function (id) {
            var targetWindow;

            dorsett.forEachArray(dorsett.windows.windowList, function checkForTargetWindow (win) {
                if (win.windowId === id) {
                    targetWindow = win;
                    return false;
                }
            });

            return targetWindow;
        },
        getWindowByUpi: function (upi) {
            var targetWindow;

            if (upi) {
                dorsett.forEachArray(dorsett.windows.windowList, function checkForTargetWindow (win) {
                    if (win.upi === upi) {
                        targetWindow = win;
                        return false;
                    }
                });
            }

            return targetWindow;
        },
        resizeStart: function () {
            dorsett.windows._setInteractingFlag(true);
        },
        resizeStop: function () {
            dorsett.windows._setInteractingFlag(false);
        },
        dragStart: function () {
            dorsett.windows._setInteractingFlag(true);
        },
        dragStop: function () {
            dorsett.windows._setInteractingFlag(false);
        },
        init: function () {
            // dorsett.windows.elementSelector = '.dorsett-card-panel';//'.card, .card-panel';
            // dorsett.windows.$elements = $(dorsett.windows.elementSelector);

            // dorsett.windows.$elements.draggable(dorsett.windows.draggableConfig);

            // dorsett.windows.$elements.resizable(dorsett.windows.resizableConfig);

            dorsett.on('closeWindow', function handleCloseWindow (win) {
                var windowId = win.bindings.windowId();

                dorsett.forEachArray(dorsett.windows.windowList, function checkOpenWindow (openWin, idx) {
                    if (openWin.windowId === windowId) {
                        dorsett.windows.windowList.splice(idx, 1);
                        return false;
                    }
                });
            });

            dorsett.on('hideWindows', function hideWindows () {
                dorsett.bindings.windowsHidden(true);
            });

            dorsett.on('unhideWindows', function unhideWindows () {
                dorsett.bindings.windowsHidden(false);
            });
        },
        offset: function () {
            dorsett.windows._offsetCount++;

            if (dorsett.windows._offsetCount >= dorsett.windows._offsetMax) {
                dorsett.windows._offsetCount = 0;
                dorsett.windows._offsetX = 30;
                dorsett.windows._offsetY = 30;
            } else {
                dorsett.windows._offsetX += dorsett.windows._offset;
                dorsett.windows._offsetY += dorsett.windows._offset;
            }
        },
        sendMessage: function (e) {
            var targetWindow,
                winId = e.winId || e._windowId;

            targetWindow = dorsett.windows.getWindowById(winId);

            targetWindow.handleMessage(e);
        },
        create: function (config) {
            var newWindow;

            if (config.options && config.options.sameWindow) {
                newWindow = dorsett.windows.getWindowById(config._windowId || config.options.windowId);
                newWindow.setUrl(config.url);
            } else {
                newWindow = dorsett.windows.getWindowByUpi(config.upi);

                if (newWindow) {
                    dorsett.windows.activate(newWindow.windowId);
                } else {
                    $.extend(config, config.options);

                    if (!config.exempt) {
                        dorsett.windows.offset();

                        if (config.left === undefined) {
                            config.left = dorsett.windows._offsetX;
                        }
                        if (config.top === undefined) {
                            config.top = dorsett.windows._offsetY;
                        }
                    }

                    newWindow = new dorsett.Window(config);

                    dorsett.taskbar.addWindow(newWindow);

                    // config.afterLoad = dorsett.windows.afterLoad;

                    dorsett.windows.windowList.push(newWindow);

                    if (!config.isHidden) {
                        dorsett.windows.activate(newWindow.windowId);
                    }

                    if (config.options && config.options.callback) {
                        config.options.callback();
                    }
                }
            }

            return newWindow;
        },
        openWindow: function (url, title, type, target, uniqueId, options) {
            var config;

            if (typeof url === 'object') {
                config = url;
            } else {
                config = {
                    url: url,
                    title: title,
                    type: type,
                    upi: uniqueId,
                    options: options
                };
            }

            dorsett.navigator.hideNavigator();
            dorsett.windows.create(config);
        },
        getWindowsByType: function (type) {
            var openWindows = dorsett.bindings.openWindows[type];

            return (openWindows && openWindows()) || [];
        },
        closeWindow: function (id) {
            var targetWindow = dorsett.windows.getWindowById(id);

            targetWindow.close();
        },
        closeAll: function (group) {
            var openWindows;

            if (group) {
                openWindows = dorsett.bindings.openWindows[group];

                if (openWindows) {
                    openWindows = openWindows();
                }
            } else {
                //no group, close all of them
                openWindows = dorsett.windows.windowList;
            }

            dorsett.forEachArrayRev(openWindows, function (win) {
                win.close();
            });

            dorsett.fire('hideMenus');
        },
        activate: function (target) {
            dorsett.fire('hideMenus');

            dorsett.forEachArray(dorsett.windows.windowList, function processWindowActivate (win) {
                if (win.windowId === target) {
                    win.activate(true);
                } else {
                    if (!win.bindings.exempt()) {
                        win.deactivate();
                    }
                }
            });
        },
        showDesktop: function () {
            dorsett.forEachArray(dorsett.windows.windowList, function deactivateOnShowDesktop (win) {
                win.minimize(null, true);
            });
        }
    },
    taskbar: {
        pinnedItems: ['Display'],
        init: function () {
            dorsett.bindings.startMenuItems(ko.viewmodel.fromModel(dorsett.config.itemGroups));
            //load user preferences 
            dorsett.forEachArray(dorsett.taskbar.pinnedItems, function processPinnedItem (item) {
                dorsett.bindings.openWindows[item] = ko.observableArray([]);
                dorsett.bindings.windowGroups.push(dorsett.taskbar.getKOWindowGroup(item, true));
            });

            dorsett.on('closeWindow', function handleCloseWindow (win) {
                var group = win.bindings.group(),
                    openWindows = dorsett.bindings.openWindows[group]();

                if (openWindows.length === 0) {
                    dorsett.bindings.windowGroups.remove(function removeWindowGroup (item) {
                        return item.group() === group && item.pinned() === false;
                    });
                }
            });

            // dorsett.bindings.windowGroups(pinnedItems);
        },
        addWindow: function (win) {
            var group = win.bindings.group();

             if (group && dorsett.taskbar.isValidGroup(group)) {
                if (!dorsett.taskbar.isGroupOpen(group)) {
                    dorsett.bindings.openWindows[win.bindings.group()] = ko.observableArray([]);
                    dorsett.bindings.windowGroups.push(dorsett.taskbar.getKOWindowGroup(group));
                }

                dorsett.bindings.openWindows[win.bindings.group()].push(win.bindings);
            }
        },
        getWindowGroup: function (grp) {
            return dorsett.config.itemGroups[grp] || dorsett.config.itemGroups.Point;
        },
        getWindowGroupName: function (grp) {
            var group = dorsett.taskbar.getWindowGroup(grp);

            return group.group;
        },
        getKOWindowGroup: function (grp, pinned) {
            var group = dorsett.taskbar.getWindowGroup(grp);

            group.pinned = !!pinned;

            return ko.viewmodel.fromModel(group);
        },
        isValidGroup: function (group) {
            return dorsett.config.itemGroups[group] !== undefined;
        },
        isGroupOpen: function (group) {
            var openWindowGroups = dorsett.bindings.windowGroups(),
                found = false;

            dorsett.forEachArray(openWindowGroups, function isWindowGroupOpen (windowGroup) {
                if (windowGroup.group() === group) {
                    found = true;
                    return false;
                }
            });

            return found;
        }
    },
    startButton: {
        init: function () {
            dorsett.startButton.$el = $('#startButton');

            $('body').mousedown(function handleBodyMouseDown (event) {
                dorsett.forEachArray(dorsett.events._bodyClickHandlers, function bodyMouseDownHandler (handler) {
                    handler(event);
                });
            });

            $('#openItems').click(function showOpenItems () {
                $('#modal2').openModal();
            });

            dorsett.events.hoverMenu('.startButtonContainer', 'startmenu');

            // dorsett.events.clickMenu('#globalSearch', '#searchBox', {
            //     before: function () {
            //         $('#searchBox input').focus();
            //     }
            // });
        }
    },
    startMenu: {
        init: function () {
            $.contextMenu({
                selector: '.dorsett-menu-tile',
                items: {
                    pin: {
                        name: 'Pin to taskbar',
                        callback: function (key, opt) {
                            var $target = opt.$trigger,
                                text = $target.children('span').text(),
                                icon = $target.children('i').html(),
                                $el,
                                template = '<li class="taskbarItem active"><a href="javascript://" data-position="bottom" data-tooltip="' + text + '" data-delay="10" class="taskbarButton testHover hoverButton2 waves-effect"><i class="material-icons">' + icon + '</i><span>' + text + '</span></a></li>';

                            if (!dorsett.taskbar.pinnedItems[text]) {
                                $el = $('.taskbar .left').append(template);

                                dorsett.taskbar.pinnedItems[text] = {
                                    text: text,
                                    icon: icon,
                                    template: template,
                                    $el: $el
                                };
                            }

                            console.log($target);
                        }
                    }
                }
            });

            $('#showOpenItems').click(function showOpenItems (event) {
                $('#openItemsModal').openModal();
            });

            // $('#showDesktop').click(function (event) {
            //     $('.dorsett-card-panel').addClass('hide');
            // });
        },
        handleClick: function (koIconObj) {
            var obj = ko.toJS(koIconObj),
                id = dorsett.makeId(),
                openWindows,
                doOpenWindow = function () {
                    dorsett.windows.openWindow(obj.url + '?' + id, obj.title, obj.group, null, null, obj.options);
                };

            if (!obj.standalone) {
                dorsett.settings._workspaceNav = true;
                dorsett.bindings.showNavigator(obj.group, true);
            } else {
                if (obj.singleton) {
                    openWindows = dorsett.windows.getWindowsByType(obj.group);
                    if (openWindows.length > 0) {
                        openWindows[0].activate();
                    } else {
                        doOpenWindow();
                    }
                } else {
                    doOpenWindow();
                }
            }
        }
    },
    alarms: {
        init: function () {
            var alarms = dorsett.bindings.alarms,
                unacknowledgedAlarms = alarms.unacknowledged,
                constants = dorsett.bindings.alarms.constants,
                debug = dorsett.alarms.debug,
                initDone = false,
                prepAlarms = function (data) {
                    var dataIsArray = Array.isArray(data),
                        list = dataIsArray ? data:[data],
                        len = list.length,
                        i,
                        alarm;

                    for (i = 0; i < len; i++) {
                        alarm = list[i];
                        alarm.ackStatus = ko.observable(alarm.ackStatus).extend({ rateLimit: 100 });
                        alarm.ackUser = ko.observable();
                        alarm.ackTime = ko.observable();
                        alarm.TextColor = '#' + alarm.TextColor;
                        alarm.BackColor = '#' + alarm.BackColor;

                        // TODO change this to use dorsett.workspaceManager.getConfig('revEnums.Alarm Classes.' + alarm.almClass)
                        // after it is available
                        alarm.almClassText = dorsett.workspaceManager.config.revEnums['Alarm Classes'][alarm.almClass];
                        alarm.cssClass = 'type-' + alarm.almClassText;

                        date = new Date(alarm.msgTime);
                        alarm.dateTime = ko.observable(moment(+(alarm.msgTime + '000')).calendar());
                    }
                    return dataIsArray ? list:data;
                },
                getUnacknowledgedAlarms = function () {
                    if (debug.enable) {
                        debug.loadAlarms();
                        return;
                    }

                    dorsett.socket.emit('getUnacknowledged', JSON.stringify({
                        user: dorsett.bindings.user(),
                        numberItems: constants.BUFFER_SIZE
                    }));
                },
                receiveUnacknowledgedAlarms = function (data) {
                    // data = {
                    //     alarms: [{
                    //         BackColor: "ffffff"
                    //         Name1: "Rob"
                    //         Name2: "BI2"
                    //         Name3: ""
                    //         Name4: ""
                    //         PointType: 3
                    //         Security: ["567b05edc41bb35c3a82c44a", "..."]
                    //         TextColor: "ff0000"
                    //         _id: "57bf050fb60281b058105f98"
                    //         ackStatus: 1
                    //         ackTime: 0
                    //         ackUser: 0
                    //         almClass: 0
                    //         almNotify: true
                    //         msgCat: 1
                    //         msgText: "Rob_BI2 in unauthorized state of On"
                    //         msgTime: 1472136463
                    //         msgType: 5
                    //         upi: 2990
                    //     },
                    //     {...}],
                    //     count: 1
                    // }
                    unacknowledgedAlarms.list(prepAlarms(data.alarms));
                    unacknowledgedAlarms.count(data.count);
                    unacknowledgedAlarms.showList(!!data.count);

                    if (initDone && data.count && !dorsett.alarms.annunciator.active) {
                        dorsett.alarms.annunciator.start();
                    }
                },
                newUnackAlarm = function (data) {
                    // data: {
                    //     newAlarm: {},
                    // }
                    // * The newAlarm object format is commented in the 'unacknowledged' socket handler
                    var list = unacknowledgedAlarms.list(),
                        count = unacknowledgedAlarms.count,
                        sortFn = function (a,b) {
                            return (a.msgTime - b.msgTime);
                        };

                    // ** Work with raw array so we don't refresh the UI unnecessarily
                    // Push new alarm to top of array
                    list.unshift(prepAlarms(data.newAlarm));

                    // The new unack'd alarm could have an older timestamp than the newest entry in our list
                    if ((list.length > 1) && (list[0].msgTime < list[1].msgTime)) {
                        list.sort(sortFn);
                    }
                    
                    // If length greater than max, throw away the tail
                    if (list.length > constants.BUFFER_MAX) {
                        list.splice(constants.BUFFER_MAX);
                    }
                    
                    // Notify depdendencies
                    unacknowledgedAlarms.list.valueHasMutated();
                    // Update alarm count
                    count(count()+1);

                    unacknowledgedAlarms.showList(true);
                    
                    if (!alarms.annunciator.active) {
                        alarms.annunciator.start();
                    }
                },
                removingUnackAlarm = function (data) {
                    // data: {
                    //      _id: string
                    //      ackStatus: int 
                    //      ackUser: string
                    //      ackTime: int (Unix Epoch)
                    // }
                    var count = unacknowledgedAlarms.count;

                    // Update our alarm count - we have to do this before we remove the unacknowledged alarm
                    // because we have listeners on the unacknowledged.list array and the count must be updated
                    // before the listeners are notified
                    count(count() - 1);
                    
                    dorsett.forEachArray(unacknowledgedAlarms.list(), function iterator (alarm, index) {
                        if (alarm._id === data._id) {
                            // Update ack information
                            alarm.ackStatus(data.ackStatus);
                            alarm.ackUser(data.ackUser);
                            alarm.ackTime(data.ackTime);
                            // Remove the alarm from our list
                            unacknowledgedAlarms.list.splice(index, 1);
                            // Stop iterating over the array
                            return false;
                        }
                    });

                    if ((unacknowledgedAlarms.list().length < constants.BUFFER_MIN) && (count >= constants.BUFFER_MIN)) {
                        // Get unacknowledged alarms from server
                        getUnacknowledgedAlarms();
                    }
                },
                acknowledgeResponse = function (data) {
                    // data: {
                    //     reqID: int or string (id used for acknowledge request),
                    //     result: int (acknowledged count)
                    // }
                    var acknowledgeRequests = dorsett.alarms.acknowledgeRequests,
                        request = acknowledgeRequests[data.reqID];
                    
                    if (request) {
                        window.clearTimeout(request.timeoutID);
                        delete acknowledgeRequests[data.reqID];
                    }
                    // We will receive a follow-up socket request, 'removingUnackAlarm', which updates
                    // the alarm list and count.
                };

            if (debug.enable) {
                // Expose these normally private methods for access from within our debug routines
                dorsett.alarms.receiveUnacknowledgedAlarms = receiveUnacknowledgedAlarms;
                dorsett.alarms.newUnackAlarm = newUnackAlarm;
                dorsett.alarms.removingUnackAlarm = removingUnackAlarm;
            } else {
                dorsett.socket.on('unacknowledged', receiveUnacknowledgedAlarms);
                dorsett.socket.on('newUnackAlarm', newUnackAlarm);
                dorsett.socket.on('removingUnackAlarm', removingUnackAlarm);
                dorsett.socket.on('acknowledgeResponse', acknowledgeResponse);
                getUnacknowledgedAlarms();
            }

            // Initialize our unacknowledged alarms hover menu
            dorsett.alarms.hoverMenu = dorsett.events.hoverMenu('#alarmIcon');

            dorsett.on('loaded', function () {
                initDone = true;

                if (debug.enable) {
                    debug.loadAlarms(75);
                }

                if (unacknowledgedAlarms.count() > 0) {
                    dorsett.alarms.annunciator.start();
                }

            });
        },
        sendAcknowledge: function (alarmList) {
            var request = {
                    reqID: dorsett.makeId(),
                    username: dorsett.bindings.user().username,
                    ids: [],
                    timeoutID: null
                },
                constants = dorsett.bindings.alarms.constants,
                acknowledgeTimeout = function () {
                    dorsett.forEachArray(alarmList, function (alarm, index) {
                        alarm.ackStatus(constants.ACK_ERROR);
                    });
                };

            if (dorsett.alarms.debug.enable) {
                dorsett.alarms.debug.sendAcknowledge(alarmList);
                return;
            }

            dorsett.forEachArray(alarmList, function (alarm, index) {
                request.ids.push(alarm._id);
                alarm.ackStatus(constants.ACK_IN_PROGRESS);
            });

            request.timeoutID = window.setTimeout(acknowledgeTimeout, constants.TIMEOUT);

            dorsett.alarms.acknowledgeRequests[request.reqID] = request;

            dorsett.log('Sending alarm acknowledge:', request.ids);

            dorsett.socket.emit('sendAcknowledge', JSON.stringify(request));
        },
        acknowledgeRequests: {},
        annunciator: {
            id: 0,
            interval: 10000, // milliseconds
            sound: 'chime',
            active: false,
            start: function () {
                var annunciator = dorsett.alarms.annunciator;

                if (annunciator.active) {
                    return;
                }
                annunciator.active = true;
                annunciator.play();

                annunciator.id = window.setInterval(function () {
                    if (dorsett.bindings.alarms.unacknowledged.count() > 0) {
                        if (dorsett.bindings.alarms.isMuted() === false) {
                            annunciator.play();
                        }
                    } else {
                        annunciator.stop();
                    }
                }, annunciator.interval);
            },
            stop: function () {
                annunciator.active = false;
                window.clearInterval(annunciator.id);
            },
            play: function () {
                dorsett.audio.play(dorsett.alarms.annunciator.sound);
            }
        },
        debug: {
            enable: false,
            loadAlarms: function (amount) {
                var _id,
                    unacknowledged = dorsett.bindings.alarms.unacknowledged,
                    list = unacknowledged.list(),
                    listLength = list.length,
                    count = unacknowledged.count(),
                    BUFFER_MAX = dorsett.bindings.alarms.constants.BUFFER_MAX,
                    num,
                    i,
                    len;

                // If the requested amount is undefined, we get the difference between our current count and
                // list length, up to the buffer max
                if (!amount) {
                    len = count - listLength;
                    if (len > BUFFER_MAX) {
                        len = BUFFER_MAX - listLength;
                    }
                } else {
                    len = amount;
                    if ((len + listLength) > BUFFER_MAX) {
                        len = BUFFER_MAX - listLength;
                    }
                    count += amount;
                }

                for (i = 0; i < len; i++) {
                    num = Math.random();
                    _id = parseInt(num*10000, 10);
                    list.push({
                        _id: _id,
                        msgText: 'Unacknowledged alarm # ' + _id,
                        msgTime: 1472136463 - (i*1000),
                        ackStatus: 1,
                        ackTime: 0,
                        ackUser: '',
                        almClass: Math.floor(num*4),
                        TextColor: "ff0000",
                        BackColor: "e0e00a"
                    });
                }

                dorsett.alarms.receiveUnacknowledgedAlarms({
                    alarms: list,
                    count: count
                });
            },
            addAlarms: function (count) {
                var _id,
                    num;

                while (count && count--) {
                    num = Math.random();
                    _id = parseInt(num*10000, 10);
                    dorsett.alarms.newUnackAlarm({
                        newAlarm: {
                            _id: _id,
                            msgText: 'Unacknowledged alarm # '+ _id,
                            msgTime: 1472136463,
                            ackStatus: 1,
                            ackTime: 0,
                            ackUser: '',
                            almClass: Math.floor(num*4),
                            TextColor: "ff0000",
                            BackColor: "e0e00a"
                        }
                    });
                }
            },
            removeAlarms: function (count) {
                var unacknowledgedAlarms = dorsett.bindings.alarms.unacknowledged;

                while (count && count-- && unacknowledgedAlarms.list().length) {
                    dorsett.alarms.removingUnackAlarm({
                        _id: unacknowledgedAlarms.list()[0]._id,
                        ackStatus: 2,
                        ackUser: '',
                        ackTime: 0
                    });
                }
            },
            start: function (interval) {
                var debug = dorsett.alarms.debug;
                
                if (dorsett.bindings.alarms.unacknowledged.list().length === 0) {
                    debug.loadAlarms(150);
                }

                debug.id = window.setInterval(function () {
                    debug.removeAlarms(1);
                }, interval || 300);
            },
            stop: function () {
                window.clearInterval(dorsett.alarms.debug.id);
            },
            sendAcknowledge: function (alarmList) {
                dorsett.forEachArray(alarmList, function (alarm, index) {
                    dorsett.alarms.removingUnackAlarm({
                        _id: alarm._id,
                        ackStatus: 2,
                        ackUser: 'JDR',
                        ackTime: Math.floor(Date.now() / 1000)
                    });
                });
            },
            id: 0
        }
    },
    globalSearch: {
        $taskbarEl: $('#searchNavbar'),
        $backgroundEl: $('#searchBackground'),
        $inputEl: $('#globalSearchInput'),
        show: function () {
            dorsett.globalSearch.visible = true;
            dorsett.fire('hideWindows');

            dorsett.animations.fadeIn(dorsett.globalSearch.$taskbarEl, function focusSearchInput () {
                dorsett.globalSearch.$inputEl.focus();
            });

            dorsett.animations.fadeIn(dorsett.globalSearch.$backgroundEl);

            //if we want to go back to home on escape (we'll have to discuss and determine the different ways to 'escape' the search view)
            $(document).keyup(dorsett.globalSearch.handleKeyPress);
        },
        hide: function () {
            dorsett.globalSearch.visible = false;
            dorsett.fire('unhideWindows');

            dorsett.animations.fadeOut(dorsett.globalSearch.$taskbarEl);
            dorsett.animations.fadeOut(dorsett.globalSearch.$backgroundEl);
        },
        handleKeyPress: function (event) {
            if (event.which === 27) {
                if (dorsett.globalSearch.visible === true) {
                    dorsett.globalSearch.visible = false;
                    dorsett.globalSearch.hide();
                }
            }

        }
    },
    globalSearchOld: {
        init: function () {
            dorsett.globalSearch.$el = $('#search');
            dorsett.globalSearch.$resultsEl = $('#globalSearchResults');

            dorsett.globalSearch.rawResults = ['4250 AH5 DISP', '4200 PARKING LOT LIGHTS', 'AIR HANDLERS', 'MONTHLY REPORT'];

            // dorsett.globalSearch.results = new Bloodhound({
            //     datumTokenizer: Bloodhound.tokenizers.whitespace,
            //     queryTokenizer: Bloodhound.tokenizers.whitespace,
            //     local: dorsett.globalSearch.rawResults
            // });

            // // on keydown, take string and get results from bloodhound, replace string in results with span.searchHighlight, then populate dropdown and show if not shown already

            dorsett.globalSearch.$el.on('keyup', function showSearchResults () {
                dorsett.globalSearch.$resultsEl.css('display', 'block');
            });

            dorsett.globalSearch.$el.on('blur', function hideSearchResults () {
                dorsett.globalSearch.$resultsEl.css('display', 'none');
                dorsett.globalSearch.$el.val(null);
            });

            // dorsett.globalSearch.$el.typeahead({
            //     hint: true,
            //     highlight: true,
            //     minLength: 1
            // }, {
            //     name: 'Results',
            //     source: dorsett.globalSearch.results
            // });

            $('#globalSearchResults').dropdown({
                // inDuration: 300,
                // outDuration: 225,
                // constrain_width: false, // Does not change width of dropdown to that of the activator
                hover: true, // Activate on hover
                gutter: 0, // Spacing from edge
                belowOrigin: true, // Displays dropdown below the button
                alignment: 'left' // Displays dropdown with edge aligned to the left of button
            });
        }
    },
    navigatorNew: {
        _lastInit: true,
        _navigators: {},
        $navigatorModalNew: $('#navigatorModalNew'),
        temporaryCallback: null,
        defaultClickHandler: function (pointInfo) {
            var endPoint = dorsett.utility.getEndpoint(pointInfo.pointType, pointInfo._id),
                name = [pointInfo.name1, pointInfo.name2, pointInfo.name3, pointInfo.name4].join(' '),
                group = dorsett.config.itemGroups[pointInfo.pointType],
                options = group && group.options || null;

            dorsett.windows.openWindow(endPoint.review.url, name, pointInfo.pointType, null, pointInfo._id, options);
        },
        handleNavigatorRowClick: function (pointInfo) {
            dorsett.navigatorNew.hideNavigator();

            if (dorsett.navigatorNew.temporaryCallback) {
                if (typeof dorsett.navigatorNew.temporaryCallback === 'function') {
                    dorsett.navigatorNew.temporaryCallback(pointInfo);
                    dorsett.navigatorNew.temporaryCallback = null;
                }
                
            } else {
                dorsett.navigatorNew.defaultClickHandler(pointInfo);
            }
        },
        showNavigator: function (cfg) {
            var config = cfg || {};
            // if string, from taskbar menu/start menu, and it's a group type
            if (typeof config === 'string') {
                config = {
                    pointTypes: [config]
                };
            } else {
                if (config.callback) {
                    dorsett.navigatorNew.temporaryCallback = config.callback;
                }

                if (config.pointType && config.property) {
                    config.pointTypes = dorsett.workspaceManager.config.Utility.pointTypes.getAllowedPointTypes(config.property, config.pointType);
                }
            }

            dorsett.navigatorNew.commonNavigator.applyConfig(config);
            dorsett.navigatorNew.$navigatorModalNew.openModal(config);
        },
        hideNavigator: function () {
            dorsett.navigatorNew.$navigatorModalNew.closeModal();
        },
        //config contains container
        Navigator: function (config) {
            var self = this,
                ajaxParameters = {
                    url: '/api/points/search',
                    dataType: 'json',
                    type: 'post'
                },
                getBindings = function () {
                    var pointTypes = $.extend(true, [], dorsett.utility.pointTypes),
                        bindings = {
                            name1: '',
                            name2: '',
                            name3: '',
                            name4: '',
                            showInactive: false,
                            showDeleted: false,
                            fetchingPoints: false,
                            isFilterMode: false,
                            points: [],
                            id: self.id
                        };

                    dorsett.forEachArray(pointTypes, function addSelectedToPointType(type) {
                        type.selected = true;
                        type.visible = true;
                    });

                    bindings.pointTypes = pointTypes;

                    self.defaultConfig = bindings;

                    //build observable viewmodel so computeds have access to observables
                    bindings = ko.viewmodel.fromModel(bindings);

                    bindings.openPointTypeDropdown = function (obj, event) {
                        if (!self.$dropdownButton) {
                            self.initDropdownButton();
                        }

                        if (self._dropdownOpen) {
                            bindings.closePointTypeDropdown();
                            event.preventDefault();
                            event.stopPropagation();
                            return false;
                        } else {
                            setTimeout(function doOpenDropdown () {
                                self.$dropdownButton.trigger('open');
                                self._dropdownOpen = true;
                            }, 1);
                        }
                    };

                    bindings.closePointTypeDropdown = function () {
                        self.$dropdownButton.trigger('close');
                        self._dropdownOpen = false;

                        if (self.pointTypeChanged) {
                            // dorsett.log('point type changed, getting points');
                            self.getPoints();
                        }

                        self.pointTypeChanged = false;
                    };

                    // bindings.onDropdownHide = function () {
                        
                    // };

                    bindings.pointTypeChanged = function () {
                        self.pointTypeChanged = true;
                    };

                    bindings.pointTypeInvert = function (type) {
                        bindings.pointTypeChanged();
                        self.applyPointTypes(type);
                    };

                    bindings.toggleAllPointTypes = function () {
                        var types = bindings.pointTypes();
                        // var numChecked = 0,
                        //     numVisible = 0,
                        //     types = bindings.pointTypes(),
                        //     toSet;

                        // dorsett.forEachArray(types, function checkPointType(type) {
                        //     if (type.visible()) {
                        //         numVisible++;
                        //     }

                        //     if (type.selected()) {
                        //         numChecked++;
                        //     }
                        // });

                        // if (numChecked === types.length) {
                        //     toSet = false;
                        // } else if (numChecked === 0) {
                        //     toSet = true;
                        // } else if (numChecked > numVisible / 2) {
                        //     toSet = true;
                        // } else {
                        //     toSet = false;
                        // }

                        dorsett.forEachArray(types, function doCheckPointType(type) {
                            if (type.visible()) {
                                type.selected(true);
                            }
                        });

                        bindings.pointTypeChanged();
                    };

                    bindings.handleNavigatorRowClick = function (navigator, event) {
                        var target = event && event.target,
                            point;

                        if (target) { //open window for main one, others just send the information
                            point = ko.dataFor(target);

                            point.name = [point.name1, point.name2, point.name3, point.name4].join(' ');
                            // dorsett.log('row click', point);

                            if (point !== self.bindings) {
                                dorsett.navigatorNew.handleNavigatorRowClick(point);
                            }
                            //fire event?  .once('point selected')
                        }
                    };

                    bindings.clearNames = function () {
                        var c;

                        for (c=1; c<5; c++) {
                            bindings.clearBinding('name' + c);
                        }
                    };

                    bindings.clearBinding = function (binding) {
                        if (self.bindings[binding]) {
                            self.bindings[binding](null);
                        }
                    };

                    bindings.isFilterMode.subscribe(function manageFilterModeFooter (val) {
                        var cls = 'modal-fixed-footer';

                        if (val) {
                            self.$modal.addClass(cls);
                        } else {
                            self.$modal.removeClass(cls);
                        }
                    });

                    bindings.allTypesSelected = ko.pureComputed(function allPointTypesSelected() {
                        var currTypes = bindings.pointTypes(),
                            numChecked = 0;

                        dorsett.forEachArray(currTypes, function isTypeChecked(type) {
                            if (type.selected()) {
                                numChecked++;
                            }
                        });

                        return numChecked === currTypes.length;
                    });

                    bindings.allTypesSelected.extend({
                        rateLimit: 50
                    });

                    bindings.nameHasChanged = ko.computed(function nameFilterChanged() {
                        var name1 = bindings.name1(),
                            name2 = bindings.name2(),
                            name3 = bindings.name3(),
                            name4 = bindings.name4();

                        if (!self._pauseRequest && self._loaded) {
                            // dorsett.log('Getting points', name1, name2, name3, name4);
                            self.getPoints();
                        }
                    });

                    bindings.optionsChanged = ko.computed(function optionsHaveChanged() {
                        var showInactive = bindings.showInactive(),
                            showDeleted = bindings.showDeleted();

                        if (!self._pauseRequest && self._loaded) {
                            // dorsett.log('Getting points', name1, name2, name3, name4);
                            self.getPoints();
                        }
                    });

                    bindings.pointTypesChanged = ko.pureComputed(function pointTypeHasChanged () {
                        var currTypes = bindings.pointTypes();

                        dorsett.forEachArray(currTypes, function subscribeToCheck (type) {
                            type.selected.subscribe(bindings.pointTypeChanged);
                        });

                        return true;
                    });

                    bindings.pointTypeText = ko.pureComputed(function getPointTypeText () {
                        var currTypes = bindings.pointTypes(),
                            selectedTypes = [],
                            ret;

                        dorsett.forEachArray(currTypes, function isTypeChecked(type) {
                            if (type.selected()) {
                                selectedTypes.push(type.key());
                            }
                        });

                        if (selectedTypes.length === 1) {
                            ret = selectedTypes[0];
                        } else {
                            ret = (selectedTypes.length === currTypes.length ? 'All' : selectedTypes.length) + ' Point Types';
                        }

                        return ret;
                    });

                    return bindings;
                };

            $.extend(self, config);

            self.id = dorsett.makeId();

            self.bindings = getBindings();

            self.applyPointTypes = function (types, exclusive) {
                if (types && types.length > 0) {
                    dorsett.forEachArray(self.bindings.pointTypes(), function isPointTypeChecked (type) {
                        var isFound = types.indexOf(type.key()) > -1;

                        if (exclusive) {
                            type.visible(isFound);
                        } else {
                            type.visible(true);
                        }
                       
                        type.selected(isFound);
                    });
                }
            };

            self.applyPointNames = function (config) {
                var c,
                    name;

                for (c = 1; c <= 4; c++) {
                    name = 'name' + c;
                    if (config[name]) {
                        self.bindings[name](config[name]);
                    } else {
                        self.bindings[name](self.defaultConfig[name]);
                    }
                }
            };

            self.applyConfig = function (cfg) {
                var defaultConfig = $.extend({}, self.defaultConfig),
                    config = $.extend(defaultConfig, cfg || {});

                config.pointTypes = self.getFlatPointTypes(config.pointTypes);

                self.applyPointTypes(config.pointTypes);

                self.applyPointNames(config);

                self.getPoints();
            };

            self.handleDataReturn = function (response) {
                self.bindings.points(response);
                self._request = null;
                self._pauseRequest = false;
                setTimeout(function doHideLoadingBar () {
                    self.bindings.fetchingPoints(false);
                }, 250);
                // dorsett.log(response);
            };

            self.getFlatPointTypes = function (pointTypes) {
                var ret = [];

                dorsett.forEachArray(pointTypes, function flattenPointType (type) {
                    if (typeof type === 'object') {
                        if (type.selected !== false) {
                            ret.push(type.key);
                        }
                    } else {
                        //if string, comes from a menu click and only sends the 'type', so it's not an object and always true
                        ret.push(type);
                    }
                });

                return ret;
            };

            self.isSameRequest = function (parameters) {
                var same = true;

                if (!self.lastParameters) {
                    return false;
                }

                dorsett.forEach(parameters, function checkParameter (val, key) {
                    if (Array.isArray(val)) {
                        same = dorsett.arrayEquals(val, self.lastParameters[key]);
                    } else {
                        same = val === self.lastParameters[key];
                    }

                    // if same, returns true and continues on.  if false, kicks out
                    return same;
                });

                return same;
            };

            self.getPoints = function (fromTimer, id) {
                var bindings = ko.toJS(self.bindings),
                    parameters = {
                        pointTypes: bindings.pointTypes,
                        showDeleted: bindings.showDeleted,
                        showInactive: bindings.showInactive,
                        name1: bindings.name1,
                        name2: bindings.name2,
                        name3: bindings.name3,
                        name4: bindings.name4
                    },
                    now = new Date(),
                    fetchDelay = 500,
                    tmpId = dorsett.makeId(),
                    longEnough = now - self.lastFetchCall >= fetchDelay;

                if (!fromTimer) {
                    //only need to timestamp to check manual calls
                    self.lastFetchCall = now;
                }

                if (fromTimer && longEnough && !self._pauseRequest) {
                    parameters.pointTypes = self.getFlatPointTypes(parameters.pointTypes);

                    // if (!!module.DEVICEID) {
                    //     params.deviceId = module.DEVICEID;
                    // }

                    // if (!!module.REMOTEUNITID) {
                    //     params.remoteUnitId = module.REMOTEUNITID;
                    // }

                    // if (!!module.POINTTYPE) {
                    //     params.pointType = module.POINTTYPE;
                    // }

                    if (!self.isSameRequest(parameters)) {
                        self.lastParameters = ajaxParameters.data = parameters;

                        self._pauseRequest = true;
                        self.bindings.fetchingPoints(true);

                        if (self._request) {
                            self._request.abort();
                        }

                        self._request = $.ajax(ajaxParameters);

                        self._request.done(self.handleDataReturn);
                    }
                } else {
                    if (!fromTimer) {
                        setTimeout(function doDelayedFetch () {
                            self.getPoints(true, tmpId);
                        }, fetchDelay);
                    }
                }
            };

            self.initDropdownButton = function () {
                self.$dropdownButton = self.$container.find('.pointTypeDropdownButton');
                //this is weird, but we want to wait on the initialization
                self.$dropdownButton.addClass('dropdown-button');
                self.$dropdownButton.dropdown({
                    hover: false,
                    belowOrigin: true
                });

                self.$dropdown = self.$dropdownButton.closest('div');

                self.$container.click(function checkCloseDropdown (event) {
                    var $target = $(event.target);

                    if (!$.contains(self.$dropdown[0], $target[0])) {
                        self.bindings.closePointTypeDropdown();
                    }
                });
            };

            self._loaded = true;

            self.getPoints();

            ko.applyBindings(self.bindings, self.$container[0]);

            // self.$container.find('select').material_select();
        },
        getTemplate: function () {
            var markup = $('#navigatorTemplate').html();

            return $(markup);
        },
        createNavigator: function ($container, $modal) {
            var markup = dorsett.navigatorNew.getTemplate(),
                navigator;

            $container.append(markup);

            navigator = new dorsett.navigatorNew.Navigator({
                $container: $container,
                $modal: $modal
            });

            $container.data('navigatorId', navigator.id);

            dorsett.navigatorNew._navigators[navigator.id] = navigator;

            // Materialize.updateTextFields();

            return navigator;
        },
        init: function () {
            dorsett.navigatorNew.commonNavigator = dorsett.navigatorNew.createNavigator($('#navigatorModalNew .modal-content'), $('#navigatorModalNew'));
        }
    },
    navigator: {
        $navigatorModalIframe: $('#navigatorModal iframe'),
        $navigatorFilterModalIframe: $('#navigatorFilterModal iframe'),
        $navigatorModal: $('#navigatorModal'),
        $navigatorFilterModal: $('#navigatorFilterModal'),
        applyNavigatorFilter: function (config) {
            var types,
                pointType = config.pointType, 
                pointLookup = config.pointLookup, 
                isStartMenu = config.isStartMenu,
                property = config.property,
                parameters = dorsett.navigator._navigatorParameters,
                processedTypes = [];

            if (parameters && parameters.pointTypes) {
                types = parameters.pointTypes;
                // pointLookup.POINTTYPES = pointTypes;
                // pointLookup.POINTTYPE = pointType;
            } else {
                if (pointType && pointType !== 'Point') {
                    if (!Array.isArray(pointType)) {
                        types = [pointType];
                    } else {
                        types = pointType;
                    }
                } else {
                    types = ['all'];
                }
            }

            if (pointLookup.MODE !== 'filter') {
                if (!isStartMenu) {
                    pointLookup.MODE = 'select';
                } else {
                    pointLookup.MODE = null;
                }
            }

            pointLookup.checkPointTypes(types);
            pointLookup.refreshUI();
        },
        acceptNavigatorFilter: function () {
            var filter = dorsett.navigator._currNavigatorFilter,
                message = dorsett.navigator._navigatorMessage;

            dorsett.messaging.sendMessage({
                key: message._windowId,
                value: {
                    action: 'pointFilterSelected',
                    filter: filter
                }
            });
        },
        showNavigatorModalNew: function () {
            dorsett.navigator.$navigatorModalNew.openModal();
        },
        // showNavigatorNew: function (config) {
        //     dorsett.navigator.showNavigatorModalNew();
        // },
        showNavigator: function (config, isStart, isSelect) {
            var pointType,
                isStartMenu = isStart,
                isSelectOnly = isSelect,
                callback;

            if (typeof config === 'string') {
                pointType = config;
            } else {
                if (config) {
                    pointType = config.pointType;
                    isStartMenu = config.isStartMenu;
                    isSelectOnly = config.isSelectOnly;
                    dorsett.navigator.navigatorCallback = config.callback || false;
                }
            }

            dorsett.fire('hideMenus');
            dorsett.navigator.showNavigatorModal(pointType, isStartMenu, isSelectOnly);
        },
        hideNavigator: function () {
            if (dorsett._navigatorWindow) {
                dorsett._navigatorWindow.bindings.minimized(true);
            }
        },
        initNavigatorFilterModal: function () {
            var $el = dorsett.navigator.$navigatorFilterModalIframe[0],
                initModalLookup = function () {
                    var navigatorFilterInterval;

                    navigatorFilterInterval = setInterval(function initNavigatorFilter () {
                        if ($el.contentWindow.pointLookup && $el.contentWindow.pointLookup.init) {
                            clearInterval(navigatorFilterInterval);
                            dorsett._navigatorFilterModal = true;
                            $el.contentWindow.pointLookup.init(dorsett.navigator.defaultNavigatorModalCallback, {
                                name1: '',
                                name2: '',
                                name3: '',
                                name4: '',
                                pointTypes: []
                            });

                            dorsett.fire('modalLoaded');
                        }
                    }, 500);
                };

            dorsett.utility.addEvent($el, 'load', initModalLookup);
        },
        showNavigatorFilterModal: function (pointType) {
            dorsett.fire('hideMenus');
            dorsett.navigator.filterModal = true;
            dorsett.navigator.$navigatorFilterModal.openModal();
        },
        initNavigatorModal: function () {
            var $el = dorsett.navigator.$navigatorModalIframe[0],
                applyFilter = function () {
                    dorsett.navigator.applyNavigatorFilter({
                        pointType: null, 
                        pointLookup: $el.contentWindow.pointLookup, 
                        isStartMenu: null
                    });
                },
                initModalLookup = function () {
                    var navigatorInterval;

                    navigatorInterval = setInterval(function initNavigator () {
                        if ($el.contentWindow.pointLookup && $el.contentWindow.pointLookup.init) {
                            clearInterval(navigatorInterval);
                            dorsett._navigatorModal = true;
                            $el.contentWindow.pointLookup.init(dorsett.navigator.defaultNavigatorModalCallback);
                            applyFilter();
                            dorsett.fire('modalLoaded');
                        }
                    }, 400);
                };

            dorsett.utility.addEvent($el, 'load', initModalLookup);
        },
        showNavigatorModal: function (pointType, isStartMenu, isSelectOnly) {
            var loaded = false,
                $el = dorsett.navigator.$navigatorModalIframe[0],
                applyFilter = function () {
                    dorsett.navigator.applyNavigatorFilter({
                        pointType: pointType, 
                        pointLookup: $el.contentWindow.pointLookup, 
                        isStartMenu: isStartMenu
                    });
                };

            dorsett.navigator.filterModal = false;

            dorsett.navigator.isSelectOnly = isSelectOnly || false;

            dorsett.fire('hideMenus');

            dorsett.navigator.$navigatorModal.openModal({
                ready: function () {
                    applyFilter();
                },
                complete: function () {
                    dorsett.settings._workspaceNav = false;
                }
            });
        },
        defaultNavigatorModalCallback: function (upi, name, pointType) {
            if (dorsett.navigator.filterModal) {
                dorsett.navigator._currNavigatorFilter = upi;
            } else {
                dorsett.navigator._currNavigatorFilter = {
                    upi: upi,
                    name: name,
                    pointType: pointType
                };
            }

            dorsett.fire('hideMenus');

            if (dorsett.navigator.navigatorCallback) {
                dorsett.messaging.sendMessage({
                    key: dorsett.navigator._prevMessage._windowId,
                    value: {
                        selectedPoint: dorsett.navigator._currNavigatorFilter,
                        action: 'pointSelected'
                    }
                });
            } else {
                if (dorsett.navigator.isSelectOnly) {
                    if (dorsett.navigator.navigatorCallback) {

                    }
                    dorsett.log(upi, name, pointType);
                }
            }
            
        },
        init: function () {
            // dorsett.navigator.$navigatorModalIframe.attr('src', '/pointlookup');
            // dorsett.navigator.$navigatorFilterModalIframe.attr('src', '/pointlookup?mode=filter');

            // dorsett.navigator.initNavigatorModal();
            // dorsett.navigator.initNavigatorFilterModal();
            dorsett.fire('modalLoaded');
            dorsett.fire('modalLoaded');
        }
    },
    utility: {
        systemEnums: {},
        systemEnumObjects: {},
        addEvent: function (element, event, fn) {
            if (element.addEventListener) {
                element.addEventListener(event, fn, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + event, fn);
            }
        },
        getConfig: function (path, parameters) {
            var explodedPath = path.split('.'),
                Config = dorsett.workspaceManager.config,
                result = Config;

            dorsett.forEachArray(explodedPath, function (segment) {
                result = result[segment];
            });

            if (parameters) {
                result = result.apply(this, parameters);
            }

            return result;
        },
        getEndpoint: function (type, id) {
            return dorsett.workspaceManager.config.Utility.pointTypes.getUIEndpoint(type, id);
        },
        getParameterByName: function (name) {
            var url = window.location.href,
                regex,
                results,
                translatedName = name.replace(/[\[\]]/g, "\\$&");

            regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");

            results = regex.exec(url);

            //doesn't exist
            if (!results) {
                return null;
            }

            //exists but with no or empty value
            if (!results[2]) {
                return '';
            }

            //exists and has value
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        },
        getSystemEnum: function (enumType, callback) {
            return $.ajax({
                url: dorsett.settings.apiEndpoint + 'system/' + enumType,
                contentType: 'application/json',
                dataType: 'json',
                type: 'get'
            }).done(
                function handleGetSystemEnum (data) {
                    var c = 0,
                        len = data.length,
                        row,
                        _object = {},
                        _array = [{
                            name: 'None',
                            value: 0
                        }],
                        _setQCData = function (qc, object) {
                            var QC = 'Quality Code',
                                QCL = 'Quality Code Label',
                                QCC = 'Quality Code Font HTML Color';

                            if (object) {
                                object[qc[QCL]] = {
                                    code: qc[QC],
                                    color: qc[QCC]
                                };
                            } else {
                                return {
                                    code: qc[QC],
                                    label: qc[QCL],
                                    color: qc[QCC]
                                };
                            }
                        },
                        _setCTData = function (ct, object) {
                            var ID = 'Controller ID',
                                NAME = 'Controller Name',
                                DESC = 'Description',
                                ISUSER = 'isUser';

                            if (object) {
                                _object[ct[ID]] = {
                                    name: ct[NAME],
                                    description: ct[DESC],
                                    isUser: ct[ISUSER]
                                };
                            } else {
                                return {
                                    name: ct[NAME],
                                    value: ct[ID]
                                };
                            }
                        },
                        _setPLData = function (pl, object) {
                            var LEVEL = 'Priority Level',
                                TEXT = 'Priority Text';

                            if (object) {
                                object[pl[LEVEL]] = pl[TEXT];
                            } else {
                                return {
                                    name: pl[TEXT],
                                    value: pl[LEVEL]
                                };
                            }
                        };

                    if (enumType === 'controlpriorities') {
                        _object[0] = 'None';
                        for (c; c < len; c++) {
                            row = data[c];
                            _setPLData(row, _object); //_object[row['Priority Level']] = row;
                            _array.push(_setPLData(row));
                        }
                    } else if (enumType === 'controllers') {
                        _object[0] = {
                            name: 'None',
                            description: 'None',
                            isUser: false
                        };
                        for (c; c < len; c++) {
                            row = data[c];
                            _setCTData(row, _object); //_object[row['Controller ID']] = row;
                            _array.push(_setCTData(row));
                        }
                    } else if (enumType === 'qualityCodes') {
                        _array = []; //.length = 0; // Clear the default contents
                        data = data.Entries || [];
                        len = data.length;

                        for (c; c < len; c++) {
                            row = data[c];
                            _array.push(_setQCData(row));
                            _setQCData(row, _object); //_object[row[QCL]] = _getQCData(row);
                        }
                    } else if (enumType === 'telemetry') {
                        _array = []; //.length = 0; // Clear the default contents

                        for (var prop in data) {
                            _array.push({
                                name: prop,
                                value: data[prop]
                            });
                        }
                        _object = data;
                    }

                    dorsett.utility.systemEnums[enumType] = _array;
                    dorsett.utility.systemEnumObjects[enumType] = _object;
                    if (callback) callback(_array);
                }
            ).fail(
                function getSystemEnumFail (jqXHR, textStatus) {
                    dorsett.log('Get system enum (' + enumType + ') failed', jqXHR, textStatus);
                    // Set an empty array/object for code looking @ systemEnums[enumType]
                    // TODO Try again or alert the user and stop
                    dorsett.utility.systemEnums[enumType] = [];
                    dorsett.utility.systemEnumObjects[enumType] = {};
                }
            );
        },
        refreshUserCtlr: function (data) {
            // This routine adds the user's controller ID to the user object
            // Parms: data is the received array of controllers
            var user = dorsett.bindings.user(),
                controller = ko.utils.arrayFilter(data, function filterControllerUser (ctrl) {
                    return ctrl.name === user.username;
                });

            if (controller.length) {
                user.controllerId = controller[0].value;
                dorsett.bindings.user(user);
            }
        },
        configureMoment: function (momentInstance) {
            // Adjust default calendar config
            momentInstance.locale('en', {
                longDateFormat : {
                    LT   : "HH:mm",
                    LTS  : "HH:mm:ss",
                    L    : "MM/DD/YYYY",
                    LL   : "MMMM Do YYYY",
                    LLL  : "MMMM Do YYYY LT",
                    LLLL : "dddd, MMMM Do YYYY LT"
                },
                calendar : {
                    lastDay  : '[Yesterday] LTS',
                    sameDay  : '[Today] LTS',
                    nextDay  : '[Tomorrow] LTS',
                    lastWeek : 'L LTS',
                    nextWeek : 'L LTS',
                    sameElse : 'L LTS'
                }
            });
        },
        init: function () {
            dorsett.utility.pointTypeLookup = {};
            dorsett.utility.pointTypes = dorsett.workspaceManager.config.Utility.pointTypes.getAllowedPointTypes();

            dorsett.forEachArray(dorsett.utility.pointTypes, function processPointType (type) {
                dorsett.utility.pointTypeLookup[type.key] = type;
            });

            dorsett.utility.getSystemEnum('controlpriorities');
            dorsett.utility.getSystemEnum('qualityCodes');
            dorsett.utility.getSystemEnum('telemetry');
            dorsett.utility.getSystemEnum('controllers', dorsett.utility.refreshUserCtlr);
        }
    },
    pointSelector: {
        init: function () {

        }
    },
    messaging: {
        _messageCallbacks: [],
        init: function () {
            window.addEventListener('storage', function (e) {
                // console.log(e);
                dorsett.messaging.processMessage(e);
            });

            store.set('sessionId', dorsett.settings.sessionId);

            $('#testLink').on('click', function clickTestLink (event) {
                store.set('startupCommands', true);
            });

            dorsett.on('loaded', function checkStartupCommands () {
                var commands = store.get('startupCommands');

                if (commands) {
                    dorsett.windows.create({
                        url: '/displays/view/44215',
                        title: 'Test Open',
                        type: 'Display',
                        upi: 44215,
                        left: 0,
                        // right: 0,
                        top: 0,
                        // bottom: 0,
                        width: '100%',
                        height: '100%'
                    });

                    store.set('startupCommands', null);
                }
            });

            dorsett.messaging.onMessage(dorsett.messaging.processMessage);
        },
        doProcessMessage: function (e) {
            var config,
                ignoredProps = {
                    '__storejs__': true,
                    'sessionId': true,
                    'debug': true
                },
                callbacks = {
                    showPointSelector: function () {
                        var sourceWindowId = config._windowId,
                            callback = function (data) {
                                dorsett.messaging.sendMessage({
                                    key: sourceWindowId, 
                                    message: 'pointSelected',
                                    value: data
                                });
                            };

                        config.callback = callback;

                        dorsett.navigatorNew.showNavigator(config);
                    },
                    navigatormodal: function () {
                        // key: navigatormodal, oldValue: windowId of recipient to send info to
                        if (config.action === 'open') {
                            dorsett.navigator.navigatorCallback = config.callback || false;

                            dorsett.navigator._navigatorMessage = config;
                            dorsett.navigator._navigatorParameters = config.parameters;
                            dorsett.navigator.showNavigatorModal();
                        }
                    },
                    navigatorfiltermodal: function () {
                        if (config.action === 'open') {
                            dorsett.navigator._navigatorMessage = config;
                            dorsett.navigator.showNavigatorFilterModal();
                        }
                    },
                    windowMessage: function () {
                        dorsett.windows.sendMessage(config);
                    },
                    openWindow: function () {
                        dorsett.workspaceManager.openWindow(config);
                    },
                    closeWindow: function () {
                        var windowId = config._windowId;

                        dorsett.windows.closeWindow(windowId);
                    },
                    getConfig: function () {
                        var path = config.path,
                            parameters = config.parameters,
                            ret,
                            winId = config._windowId;

                        ret = dorsett.utility.getConfig(path, parameters);

                        dorsett.messaging.sendMessage({
                            key: winId,
                            value: {
                                message: 'getConfig',
                                value: ret
                            }     
                        });
                    },
                    pointSelected: function () {

                    },
                    pointFilterSelected: function () {

                    }
                };

            if (!ignoredProps[e.key]) {
                if (callbacks[e.key]) { 
                    config = e.newValue;
                    if (typeof config === 'string') {
                        config = JSON.parse(config);
                    }
                    // store previous call
                    dorsett.navigator._prevMessage = config;
                    callbacks[e.key]();
                }
            }
        },
        processMessage: function (e) {
            var message = {
                key: e.key
            };

            if (typeof e.newValue === 'string') {
                try {
                    message.newValue = JSON.parse(e.newValue);    
                }
                catch (ex) {
                    message.newValue = e.newValue;
                }
            } else {
                message.newValue = e.newValue;
            }

            dorsett.messaging.doProcessMessage(message);

            // dorsett.forEachArray(dorsett.messaging._messageCallbacks, function (cb) {
            //     cb(message);
            // });
        },
        // can either be (windowId, payload) or (config{key, value})
        sendMessage: function (config) {
            config.value._timestamp = new Date().getTime();
            config.value._windowId = window.windowId;

            if (config.message) {
                config.value.message = config.message;
            }

            store.set(config.key, config.value);
        },
        onMessage: function (cb) {
            dorsett.messaging._messageCallbacks.push(cb);
        }
    },
    bindings: {
        user: ko.observable(window.userData || {}),
        openWindows: {},
        windowGroups: ko.observableArray([]), // Pinned items prepopulate this array
        startMenuItems: ko.observableArray([]),
        windowsHidden: ko.observable(false),
        showNavigatorNew: function () {
            dorsett.navigatorNew.showNavigator();
        },
        showGlobalSearch: function () {
            dorsett.globalSearch.show();
        },
        closeAllWindows: function () {
            dorsett.windows.closeAll();
        },
        alarms: {
            unacknowledged: {
                count: ko.observable(0),
                list: ko.observableArray([]),
                showList: ko.observable(false)
            },
            recentlyAcknowledged: {
                count: ko.observable(0),
                list: ko.observableArray([])
            },
            isMuted: ko.observable(false), // TODO Default should be a user/system setting
            muteTooltip: ko.observable('Mute'),
            constants: {
                ACK_IN_PROGRESS: 1.5,
                ACK_ERROR: -1,
                TIMEOUT: 5000,
                BUFFER_SIZE: 100,
                BUFFER_MIN: 50,
                BUFFER_MAX: 150
            },
            toggleMute: function (bindings, element) {
                var alarmBindings = dorsett.bindings.alarms,
                    isMuted = !alarmBindings.isMuted(),
                    $el = $(element.currentTarget),
                    $tooltip = $('#' + $el.attr('data-tooltip-id')),
                    $tooltipTextContainer =  $tooltip.find('span:first'),
                    offset = $tooltip.offset(),
                    originalWidth = $tooltip.width(),
                    newWidth;

                alarmBindings.isMuted(isMuted);

                // We have to manually update the tooltip text because it isn't updated until after the user
                // mouses out and then back over the mute control icon. We also update our observable text
                // so the tooltip will be correct if/when the user does mouseout and back over the icon.

                if (isMuted) {
                    $tooltipTextContainer.text('Un-mute');
                    alarmBindings.muteTooltip('Un-mute');
                } else {
                    $tooltipTextContainer.text('Mute');
                    alarmBindings.muteTooltip('Mute');
                }
                newWidth = $tooltip.width();

                // Recenter the tooltip
                offset.left = offset.left + parseInt((originalWidth - newWidth)/2, 10);
                $tooltip.offset(offset);
            },
            slideUp: function (element, index, alarm) {
                var unacknowledgedAlarms = dorsett.bindings.alarms.unacknowledged;

                // If the hover menu isn't shown, remove the row without animation
                if (dorsett.alarms.hoverMenu.isOpen() === false) {
                    $(element).remove();
                    unacknowledgedAlarms.showList(!!unacknowledgedAlarms.count());
                    return;
                }

                dorsett.animations.slideUp($(element), function updateAlarmList () {
                    // Remove the alarm from the DOM (it has already been removed from the observable 
                    // array - see socket handler "removingUnackAlarm" defined in dorsett.alarms.init)
                    $(element).remove();

                    if (unacknowledgedAlarms.count() === 0) {
                        // Short delay before hiding the list (just for UI - otherwise it felt choppy)
                        window.setTimeout(function () {
                            // Use the count variable instead of blindly hiding the list in case the count changed while we were away
                            unacknowledgedAlarms.showList(!!unacknowledgedAlarms.count());
                        }, 300);
                    }
                    
                    // FUTURE use
                    // var recentlyAcknowledgedList = dorsett.bindings.alarms.recentlyAcknowledged.list();
                    // // Add the removed alarm to our recently acknowledged list
                    // recentlyAcknowledgedList.unshift(alarm);
                    // // If our recent list has outgrown itself
                    // if (recentlyAcknowledgedList.length > dorsett.bindings.alarms.constants.BUFFER_MIN) {
                    //     // Remove the last entry
                    //     recentlyAcknowledgedList.pop();
                    // }
                    // // Notify depdendencies
                    // dorsett.bindings.alarms.recentlyAcknowledged.list.valueHasMutated();
                });
            },
            acknowledgeOne: function (alarm) {
                dorsett.alarms.sendAcknowledge([alarm]);
            }
        },
        closeWindows: function (group) {
            dorsett.windows.closeAll(group);
        },
        showNavigator: function (group, isStartMenu) {
            dorsett.navigatorNew.showNavigator(group);
            // dorsett.navigator.showNavigator(group, isStartMenu);
        },
        acceptNavigatorFilter: function () {
            dorsett.navigator.acceptNavigatorFilter();
        },
        startMenuClick: function (obj) {
            dorsett.startMenu.handleClick(obj);
        },
        handleCardClick: function (obj, e) {
            //only close menus on 'open'.  keeps modals open when closing individual windows
            if ($(e.target).hasClass('closeIcon')) {
                obj.close();
            } else {
                dorsett.fire('hideMenus');
                obj.activate();
            }
        },
        showDesktop: function () {
            dorsett.windows.showDesktop();
        },
        logout: function () {
            window.location.href = '/logout';
        }
    },
    knockout: {
        init: function () {
            var updateLabelFn = function (element, valueAccessor) {
                var $element = $(element),
                    observable = valueAccessor(),
                    currValue = observable();

                //hasValue, add active class
                if (currValue !== null && currValue !== undefined && currValue !== '') {
                    $element.addClass('active');
                } else {
                    $element.removeClass('active');
                }
            };


            ko.bindingHandlers.updateLabel = {
                init: updateLabelFn,
                update: updateLabelFn
            };


            ko.bindingHandlers.stopBubblingOnClick = {
                init: function (element) {
                    var $element = $(element);

                    $element.on('click', function stopEvent (event) {
                        event.stopPropagation();
                    });
                }
            };

            ko.bindingHandlers.stopBindings = {
                init: function () {
                    return {
                        controlsDescendantBindings: true
                    };
                }
            };

            ko.virtualElements.allowedBindings.stopBindings = true;

            ko.bindingHandlers.foreachprop = {
                transformObject: function (obj) {
                    var properties = [];
                    ko.utils.objectForEach(obj, function (key, value) {
                        properties.push({
                            key: key,
                            value: value
                        });
                    });
                    return properties;
                },
                init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var properties = ko.pureComputed(function () {
                        var obj = ko.utils.unwrapObservable(valueAccessor());
                        return ko.bindingHandlers.foreachprop.transformObject(obj);
                    });
                    ko.applyBindingsToNode(element, {
                        foreach: properties
                    }, bindingContext);
                    return {
                        controlsDescendantBindings: true
                    };
                }
            };

            ko.bindingHandlers.thumbnail = {
                update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var upi = valueAccessor()(),
                        thumbnailFound = viewModel.thumbnailFound,
                        $element = $(element),
                        $bg = $element.parent(),
                        currThumb = dorsett.thumbs[upi],
                        bg,
                        img;

                    if (upi !== undefined && upi !== null) {
                        if (currThumb === undefined) {
                            // dorsett.log('No thumb for upi', upi);
                            $.ajax({
                                    url: '/img/thumbs/' + upi + '.txt',
                                    dataType: 'text',
                                    type: 'get'
                                })
                                .done(
                                    function (file) {
                                        var data = file.split('||'),
                                            bgColor = data[0],
                                            image = data[1];

                                        // dorsett.log('Saving thumb for upi', upi);

                                        dorsett.thumbs[upi] = {
                                            bgColor: bgColor,
                                            image: image
                                        };

                                        $element.attr('src', image);
                                        if (bgColor != 'undefined') {
                                            $bg.css('background-color', bgColor);
                                        }

                                        thumbnailFound(true);
                                    }
                                )
                                .fail(
                                    function () {
                                        thumbnailFound(false);
                                        // $icon.show();
                                    }
                                );
                        } else {
                            // dorsett.log('Using existing thumb for', upi);
                            bg = currThumb.bgColor;
                            img = currThumb.image;

                            $element.attr('src', img);
                            if (bg !== 'undefined') {
                                $bg.css('background-color', bg);
                            }
                        }
                    }
                }
            };

            ko.bindingHandlers.taskbarMenu = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var $element = $(element),
                        newContext = bindingContext.createChildContext(bindingContext.$rawData),
                        menu = $('#taskbarMenuTemplate').html(),
                        $menu,
                        menuId = dorsett.makeId(),
                        buttonId = $element.attr('id'),
                        hoverMenu;

                    if (!buttonId) {
                        buttonId = dorsett.makeId();
                        $element.attr('id', buttonId);
                    }

                    $('main').append(menu);

                    $menu = $('main > div:last-child');

                    ko.applyBindingsToDescendants(newContext, $menu[0]);

                    setTimeout(function positionTaskbarMenu () {
                        $menu.attr('id', menuId)
                            .position({
                                of: $element,
                                my: 'center top-48',
                                at: 'center bottom'
                            });

                        hoverMenu = dorsett.events.hoverMenu('#' + buttonId, menuId);
                    }, 100);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function disposeTaskbarMenu () {
                        hoverMenu.destroy();
                    });
                }
            };

            ko.bindingHandlers.showNavigator = {
                init: function (element, valueAccessor) {
                    var $element = $(element),
                        type = valueAccessor();

                    if (ko.isObservable(type)) {
                        type = type();
                    }

                    $element.click(function showNavigatorFiltered () {
                        dorsett.navigatorNew.showNavigator(type,  true);
                    });
                }
            };

            ko.bindingHandlers.contextMenuInvert = {
                init: function (element, valueAccessor) {
                    var $element = $(element),
                        handler = valueAccessor();

                    $element.contextmenu(function handleRightClick (event) {
                        var $target = $(event.target),
                            $li = $target.parents('li'),
                            $select = $li.parent().siblings('select'),
                            text = $li.text();

                        // $li.trigger('click');

                        handler(text);

                        // $li.addClass('active');
                        // $li.find('input').prop('checked', true);

                        // $li.siblings('li').each(function clearSelection () {
                        //     var $this = $(this);

                        //     $this.removeClass('active');

                        //     $this.find('input').prop('checked', false);
                        // });

                        // $select.trigger('change', {
                        //     skipNofity: true
                        // });

                        return false;
                    });
                }
            };

            ko.bindingHandlers.materializeSelect = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var $element = $(element),
                        $select = $element.children('select'),
                        config = valueAccessor(),
                        list = config.options(),
                        notifier = config.notifier,
                        hideEvent = config.hideEvent,
                        $liList;

                    $select.addClass('select-processed');

                    dorsett.forEachArray(list, function addItemToSelect(item) {
                        $select.append($('<option>', {
                                value: item.key(),
                                selected: true
                            })
                            .text(item.key())
                        );
                    });
                    // Initial initialization:
                    $select.material_select({
                        belowOrigin: true,
                        showCount: true,
                        countSuffix: 'Types'
                    });

                    $liList = $element.find('li');

                    dorsett.forEachArray(list, function syncDropdownStatus (item, idx) {
                        if (item.selected() && item.visible()) {
                            $($liList[idx]).addClass('active');
                            $($liList[idx]).find('input').prop('checked', true);
                        }
                    });

                    // Find the "options" sub-binding:
                    var boundValue = valueAccessor();

                    // Register a callback for when "options" changes:
                    // boundValue.options.subscribe(function () {
                    //     $select.material_select();
                    // });

                    $select.on('change', function handleMaterialSelectChange (event, target) {
                        var $target = $(target),
                            index = $target.index(),
                            selected = $target.hasClass('active');

                        if (!target.skipNofity) {
                            notifier();

                            list[index].selected(selected);
                        }
                    });

                    $select.siblings('input.select-dropdown').on('close', function doHide () {
                        hideEvent();
                    });

                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {

                }
            };

            ko.applyBindings(dorsett.bindings);
            //needed for prefilled text input labels to not overlap
            Materialize.updateTextFields();
        }
    },
    authentication: {
        logIn: function (username, password) {
            $.ajax({
                url: dorsett.settings.webEndpoint + '/authenticate',
                contentType: 'application/json',
                dataType: 'json',
                type: 'post',
                data: (ko.toJSON({
                    username: username,
                    password: password,
                    'remember-me': true
                }))
            }).done(
                function handleAuthenticateData (data) {
                    dorsett.$loginBtn.removeAttr('disabled');

                    // if (!!data.resetPass) {
                    //     _local.login.errorMessage(data.message);
                    //     _local.login.isLogIn(false);
                    //     $('#oldPassword').focus();
                    //     return;
                    // }
                    // if (!!data.message) {
                    //     _local.login.errorMessage(data.message);
                    //     return;
                    // }
                    // if (!!data.err) {
                    //     _local.login.errorMessage(data.err);
                    //     return;
                    // }

                    if (!!data._id) {
                        window.userData = data;
                        dorsett.bindings.user(data);
                        // _local.login.setupAutoLogout(window.userData);
                        // sessionId = base64.encode(new Date().getTime().toString().split('').reverse().join(''));
                        // store.set('sessionId', sessionId);
                        dorsett.init();
                    }
                }
            );
        }
    },
    audio: {
        sounds: {
            chime: 'data:audio/wav;base64,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KGFscGhhKaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+pIARINcD/AAAGkHAAAAAAANIOAAAAAAAaQAAAAAAAA0gAAAAKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
        },
        play: function (sound) {
            sound = dorsett.audio.sounds[sound];
            if (!sound) {
                return;
            }
            sound = new Audio(sound);
            sound.play();
        }
    },
    init: function () {
        var num = 2,
            runInits = function () {
                var lastInits = [];
                dorsett.animations.fadeIn($('main, header'), function startInitFlow () {
                    dorsett.on('modalLoaded', function checkDone () {
                        num--;
                        if (num === 0) {
                            complete();
                        }
                    });
                    dorsett.forEach(dorsett, function dorsettInit (val, key) {
                        if (typeof val === 'object') {
                            if (val.init) {
                                if (val._lastInit) {
                                    lastInits.push({
                                        fn: val.init,
                                        key: key
                                    });
                                } else {
                                    val.init();
                                }
                            }

                            if (val.initOnLoad) {
                                dorsett.on('loaded', val.initOnLoad);
                            }
                        }
                    });
                    dorsett.forEachArray(lastInits, function runFinalInits (val) {
                        val.fn();
                    });

                    $('select:not(.select-processed').material_select();
                });
            },
            complete = function () {
                setTimeout(function doLoginFadeout () {
                    dorsett.fire('loaded');
                    dorsett.animations.fadeOut($('#loading'), function afterLoadFadeOut () {
                        dorsett.log('Load time:', (new Date() - dorsett.startLoad)/1000, 'seconds');
                    });
                }, 1500);
            },
            showLoading = function () {
                dorsett.animations.fadeIn($('#loading'), runInits);
            };

        dorsett.animations.fadeOut($('#login'), showLoading);
    }
};

$(function initWorkspaceV2 () {
    dorsett.startLoad = new Date();
    dorsett.socket = io.connect(dorsett.settings.socketEndPoint);
    dorsett.socket.on('disconnect', function (err) {
        dorsett.log('server offline, disconnecting');
        dorsett.socket.disconnect();
    });

    dorsett.$loginBtn.click(function validateLogin (event) {
        var user = $('#username').val(),
            pw = $('#password').val();

        dorsett.$loginBtn.attr('disabled', 'disabled');
        dorsett.authentication.logIn(user, pw);
    });

    if (window.isAuthenticated) {
        dorsett.init();
        return;
    }

    dorsett.animations.fadeIn($('#login'));
            
    // $('#grouping').openModal();

    // $('.groupingBody').jstree({
    //     core: {
    //         'check_callback': true,
    //         data: [{
    //             "id": 1,
    //             "text": "Root node",
    //             "children": [{
    //                 "id": 2,
    //                 "text": "Child node 1"
    //             }, {
    //                 "id": 3,
    //                 "text": "Child node 2"
    //             }]
    //         }],
    //         themes: {
    //             dots: false
    //         }
    //     },
    //     plugins: [
    //         // 'checkbox',
    //         'contextmenu'
    //         // 'search',
    //         // 'types',
    //         // 'wholerow'
    //     ]
    // });

});

var Widget = function (config) {
    var emptyFn = function () {return;},
        utility = {

        },
        local = {
            getConfig: emptyFn,
            setConfig: emptyFn,

            getPosition: emptyFn,
            setPosition: emptyFn,

            beforeRender: emptyFn,
            afterRender: emptyFn,
            render: emptyFn,

            _init: emptyFn,
            beforeInit: emptyFn,
            afterInit: emptyFn,
            init: emptyFn
        };

    return local;
};



/*
input widget as subclassed widget

edit mode

subclasses/types
input widget
toolbar widget (only toolbar or has toolbar state)

minimal view?  states?
toolbar view?

container-based--passed in or auto-generated?  passed in or body?
container movement handled in base class--mixins?--or just overridable

absolute/relative/fixed position--bindings?  base css classes via binding, positions via binding

*/

dorsett.workspaceManager = window.workspaceManager = {
    openWindowPositioned: dorsett.windows.openWindow,
    openWindow: dorsett.windows.openWindow,
    config: window.Config,
    systemEnums: dorsett.utility.systemEnums,
    systemEnumObjects: dorsett.utility.systemEnumObjects,
    socket: function () {
        return dorsett.socket;
    },
    sessionId: function () {
        return store.get('sessionId');
    },
    user: function () {
        return JSON.parse(JSON.stringify(dorsett.bindings.user()));
    },
    captureThumbnail: function () {
        dorsett.log('thumbnail placeholder');
    }
};

//include messaging.js, sets up storage listener, parses messages, etc.  grabs window id, then sets up 'onMessage' event?
dorsett.window = {
    updateUrl: null,
    back: null,
    forward: null,
    saveState: null,
    retrieveState: null,
    initialize: function () {
        this.id = windowPrefix + makeId();

    }
};

// //change pointLookup to fire message?
// dorsett.navigatorModal = {
//     defaultCallback: cb,
//     currentCallback: cb,
//     showNavigatorModal: cb,
//     showNavigatorFilterModal: cb,
//     handleNavigatorSelect: cb, //'externalCallback'
//     handleNavigatorFilterSelect: cb,
//     handleNavigatorFilterAccept: cb //select on window
// };

// //openWindow is now message, optional parameters for startup, each one checks for messages
// //sends an afterOpen message with resulting window id?  or just send 'onopen' message with it?

// dorsett.showNavigatorModal = function (config) {
//     var defaultCfg = {
//         hasCallback: false,
//         filter:  {
//             pointTypes: [],
//             name1: '',
//             name2: '',
//             name3: '',
//             name4: ''
//         }
//     };
// };




