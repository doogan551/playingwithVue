var dti = {
    $loginBtn: $('#loginBtn'),
    itemIdx: 0,
    settings: {
        logLinePrefix: true,
        webEndpoint: window.location.origin,
        socketEndPoint: window.location.origin,
        apiEndpoint: window.location.origin + '/api/',
        idxPrefix: 'dti_',
        sessionId: btoa(new Date().getTime().toString().split('').reverse().join(''))
    },
    config: {
        init: function () {
            dti.utility.configureMoment(moment);
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
            },
            'Device Tree': {
                title: 'Device Tree',
                iconText: '',
                iconClass: 'mdi mdi-file-tree',
                group: 'Device Tree',
                standalone: true,
                url: '/deviceTree',
                singleton: true,
                options: {
                    width: '85%',
                    height: '85%'
                }
            },
            'Thumbnails': {
                title: 'Thumbnails',
                iconText: 'photo_camera',
                iconClass: 'material-icons',
                group: 'Thumbnails',
                standalone: true,
                singleton: true,
                url: '/thumbnail/batch',
                adminOnly: true,
                options: {
                    width: 1000
                }
            },
            'Navigator': {
                title: 'Navigator',
                iconText: '',
                iconClass: 'mdi mdi-compass',
                group: 'Navigator',
                standalone: true,
                singleton: true,
                initFn: 'navigator.createNavigator',
                fullScreen: true
                // options: {
                //     width: 1000
                // }
            }
        }
    },
    makeId: function () {
        dti.itemIdx++;
        return dti.settings.idxPrefix + dti.itemIdx;
    },
    destroyObject: function (o, recursive) {
        var keys = Object.keys(o),
            val,
            c;

        for (c = 0; c < keys.length; c++) {
            val = o[keys[c]];

            if (val && typeof val === 'object' && recursive) {
                dti.destroyObject(val, true);
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
            formattedtime = dti.formatDate(new Date(), true);

        if (dti.settings.logLinePrefix === true) {
            err = new Error();
            if (Error.captureStackTrace) {
                Error.captureStackTrace(err);

                stack = err.stack.split('\n')[2];

                steps = stack.split(':');

                lineNumber = steps[2];

                args.unshift('line:' + pad(lineNumber), formattedtime);
            }
        }
        // args.unshift(formattedtime);
        if (!dti.noLog) {
            console.log.apply(console, args);
        }
    },
    _events: {},
    _onceEvents: {},
    on: function (event, handler) {
        dti._events[event] = dti._events[event] || [];
        dti._events[event].push(handler);
    },
    once: function (event, handler) {
        dti._onceEvents[event] = dti._onceEvents[event] || [];
    },
    off: function (event, handler) {
        var handlers = dti._events[event] || [];

        dti.forEachArray(handlers, function processOffHandler (fn, idx) {
            if (fn === handler) {
                dti._events[event].splice(idx, 1);
                return false;
            }
        });
    },
    fire: function (event, obj1, obj2) {
        var c,
            handlers = dti._events[event] || [],
            len = handlers.length;

        // dti.log('firing', event);

        // if (!dti.skipEventLog) {
        //     dti.eventLog.push({
        //         event: event,
        //         obj1: obj1 && obj1.dtiId,
        //         obj2: obj2 && obj2.dtiId
        //     });
        // }

        for (c = 0; c < len; c++) {
            handlers[c](obj1 || null, obj2 || null);
        }
    },
    thumbs: {
    },
    thumbnails: {
        $window: $('#thumbnailGen'),
        currUpi: null,
        // init: function () {

        // },
        postProcess: function () {
            if (dti.thumbnails.prevUpi) {
                dti.fire('thumbnailCaptured', dti.thumbnails.prevUpi);
                dti.thumbnails.prevUpi = null;
            }
        },
        capture: function (obj) {
            var upi = obj.upi,
                name = obj.name,
                type = obj.type.toLowerCase(),
                gen,
                setGen = function () {
                    gen = dti.thumbnails.thumbnailWindowRef.thumbnailGenerator;
                },
                runCapture = function () {
                    dti.log('Capturing thumbnail');

                    dti.thumbnails.prevUpi = upi;

                    gen.captureList([{
                        'id': upi,
                        'name': name,
                        'type': type,
                        'tn': false
                    }]);
                    // gen.hasQueued = false;
                    // gen.retainQueue = true;
                    // gen.thumbnailCallback = closeOut;
                    gen.nextCapture();
                },
                init = function () {
                    setGen();

                    gen.thumbnailCallback = dti.thumbnails.postProcess;  

                    runCapture();
                };

            if (!dti.thumbnails.thumbnailWindowRef) {
                dti.thumbnails.thumbnailWindowRef = dti.thumbnails.$window[0].contentWindow;
                dti.utility.addEvent(dti.thumbnails.$window[0], 'load', init);
                dti.thumbnails.$window.attr('src', window.location.origin + '/thumbnail/' + upi);
            } else {
                setGen();
                runCapture();
            }
        }
    },
    animations: {
        tempinit: function () {
            $(window).focus(function () {
                console.log('Focus');
            });

            $(window).blur(function () {
                console.log('Blur');
            });
        },
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
            dti.animations._fade($el, 1, cb);
        },
        fadeOut: function ($el, cb) {
            dti.animations._fade($el, 0, function finishFadeOut () {
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
            dti.on('hideMenus', function hideMenu () {
                $('.modal.open').closeModal();
            });
        },
        _bodyClickHandlers: [],
        bodyClick: function (fn) {
            dti.events._bodyClickHandlers.push(fn);
        },
        clickMenu: function (clickEl, menuEl, callbacks) {
            var isOpen = false,
                $clickEl = $(clickEl),
                $menuEl = $(menuEl);

            $clickEl.click(function openMenu (event) {
                isOpen = true;
                
                dti.animations.fadeIn($menuEl, callbacks && callbacks.after);

                if (callbacks && callbacks.before) {
                    callbacks.before();
                }

            });

            dti.events.bodyClick(function checkOpenMenu (event, $target) {
                if (isOpen && $target.parents(menuEl).length === 0) {
                    isOpen = false;
                    dti.animations.fadeOut($menuEl);
                }
            });

            dti.on('hideMenus', function hideMenu () {
                isOpen = false;
                dti.animations.fadeOut($menuEl);
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
                            dti.animations.fadeOut($menu, function checkMenuClose () {
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
                    dti.off('hideMenus', closeMenu);
                    dti.off('openMenu', closeMenu);
                };

            $button.hover(function showHoverMenu (event) {
                dti.fire('openMenu', menuID);
                clearTimeout(hideTimer);
                if (!menuShown) {
                    menuShown = true;
                    if (eventHandlers && eventHandlers.onBeforeShow) {
                        eventHandlers.onBeforeShow();
                    }
                    dti.animations.fadeIn($menu, function checkMenuOpen () {
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
                    dti.animations.fadeIn($menu);
                    menuShown = true;
                }
            }, function hideHoverMenu (event) {
                var $target = $(event.relatedTarget);

                if (($target.parents(button).length === 0) && ($target.attr('id')) !== 'context-menu-layer') {
                    setTimer();
                }
            });

            dti.events.bodyClick(function closeHoverMenus (event, $target) {
                var notMenuClick = !$target.closest('#' + menuID).length,
                    notButtonClick = !$target.closest(button).length;

                if (menuShown && notMenuClick && notButtonClick) {
                    closeMenu();
                }
            });

            dti.on('hideMenus', closeMenu);

            dti.on('openMenu', closeMenu);

            return {
                isOpen: function () {
                    return menuShown;
                },
                destroy: destroy
            };
        }
    },
    keyboardShortcuts: {
        _lastInit: true,
        init: function () {
            dti.forEach(dti.keyboardShortcuts.shortcuts, function (shortcutEntries, keyCombo) {
                dti.forEachArray(shortcutEntries, function (shortcut) {
                    var elements = shortcut.elements || document;

                    if (!Array.isArray(elements)) {
                        elements = [elements];
                    }

                    dti.forEachArray(elements, function (el) {
                        $(el).bind(shortcut.type, keyCombo, shortcut.fn);
                    });
                });
            });
        },
        shortcuts: {
            'shift+space': [{
                type: 'keydown',
                fn: function (e) {dti.globalSearch.show(e);}
            }],
            'shift+p': [{
                type: 'keydown',
                fn: function (e) {dti.navigator.showNavigator(e);}
            }],
            'esc': [{
                type: 'keyup',
                elements: [document, '#searchNavbar input'],
                fn: function (e) {dti.globalSearch.handleEscape(e);}
            }]
        }
    },
    Window: function (config) {
        var windowId = config.id || dti.makeId(),
            iframeId = dti.makeId(),
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
            prepMeasurements = function (inConfig, bindings) {
                var cfg = inConfig || config,
                    $container = $(dti.windows.draggableConfig.containment),
                    containerWidth = $container.width(),
                    containerHeight = $container.height(),
                    containerPadding = parseFloat($container.css('padding'), 10),
                    obj = {
                        left: cfg.left || bindings.left(),
                        top: cfg.top || bindings.top()
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
                        if (parseInt(obj.right, 10) - parseInt(obj.left || 0, 10) >  containerWidth) {
                            obj.left = containerPadding;
                            obj.right = containerPadding;
                            obj.width = containerWidth - (2 * containerPadding);
                        }
                    } else {
                        if (parseInt(obj.left || 0, 10) + parseInt(obj.width, 10) > containerWidth) {
                            obj.width = containerWidth;
                            obj.left = containerPadding;
                        }
                    }

                    if (parseInt(obj.top || 0, 10) + parseInt(obj.height, 10) > containerHeight) {
                        obj.height = containerHeight;
                        obj.top = containerPadding;
                    }
                }

                dti.forEach(obj, function prepWindowMeasurement (val, key) {
                    obj[key] = prepMeasurement(val);
                });

                return obj;
            },
            getGroupName = function (config) {
                var groupName = dti.taskbar.getWindowGroupName(config.type);

                if (config.exempt) {
                    return '';
                }

                return groupName;
            },
            close = function (event) {
                dti.off('thumbnailCaptured', self.handleThumbnail);
                self.bindings.minimize();
                dti.bindings.openWindows[self.bindings.group()].remove(self.bindings);

                self.$windowEl.draggable('destroy');
                self.$windowEl.resizable('destroy');

                dti.fire('closeWindow', self);

                if (self.$iframe && self.$iframe[0].contentWindow) {
                    if (self.$iframe[0].contentWindow.destroy) {
                        self.$iframe[0].contentWindow.destroy();
                    }
                }

                setTimeout(function closeWindow () {
                    if (self.$iframe) {
                        self.$iframe.attr('src', 'about:blank');
                        ko.cleanNode(self.$windowEl[0]);
                        $(self.$iframe[0].contentDocument).off('mousedown');
                    }
                    self.$windowEl.remove();
                    // dti.destroyObject(self.bindings);
                    dti.destroyObject(self, true);
                }, 1000);
            },
            minimize = function (event, skipActivate) {
                active = false;
                self.bindings.minimized(true);
                if (active && !skipActivate) {
                    dti.windows.activate(null);
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
                        dti.windows.activate(windowId);
                    }
                    self.bindings.minimized(false);
                    self.bindings.active(true);
                }

                return true;
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
                self.bindings.loading(true);
                self.$iframe[0].contentWindow.location.reload();
            },
            getTitleForPoint = function (upi) {
                var handlePointData = function (pt) {
                    self.bindings.title(pt.Name);
                };

                $.getJSON('/api/points/' + upi).done(handlePointData);
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
                    hasUrl: ko.observable(!!config.url),
                    refresh: refresh,
                    activate: activate,
                    minimize: minimize,
                    minimized: ko.observable(false),
                    loading: ko.observable(true),
                    windowsHidden: dti.bindings.windowsHidden,
                    hidden: false,
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
                            var measurements = prepMeasurements(message.parameters, self.bindings);

                            ko.viewmodel.updateFromModel(self.bindings, measurements);
                        }
                    };

                    if (callbacks[message.action]) {
                        callbacks[message.action]();
                    }
                },
                handleThumbnail: function (obj) {
                    if (obj === self.bindings.upi()) {
                        self.bindings.thumbnailFound(true);
                        self.bindings.upi.valueHasMutated();
                    }
                },
                onLoad: function (event) {
                    // var group = this.contentWindow.pointType;
                    // self.bindings.group(group);

                    // dti.log('window loaded');

                    if (config.onLoad) {
                        dti.log('calling config.onload');
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

        if (config.url) {
            self.$iframe = self.$windowEl.children('iframe');
            self.$iframe.attr('id', iframeId);

            dti.utility.addEvent(self.$iframe[0], 'load', self.onLoad);
        }

        dti.on('thumbnailCaptured', self.handleThumbnail);

        if (config.upi !== undefined && typeof config.upi === 'number') {
            self.bindings.upi(config.upi);

            if (!config.title) {
                getTitleForPoint(config.upi);
            }
        }

        group = dti.taskbar.getWindowGroup(config.type);
        self.bindings.iconClass(group.iconClass);
        self.bindings.iconText(group.iconText);
        self.bindings.thumbnail(group.thumbnail || false);

        self.$windowEl.draggable(dti.windows.draggableConfig);
        self.$windowEl.resizable(dti.windows.resizableConfig);

        //detect clicks inside iframe
        // setInterval(function detectIframeClick () {
        //     var elem = document.activeElement;
        //     if (elem && elem.id === iframeId) {
        //         self.bindings.activate();
        //     }
        // }, 100);

        ko.applyBindings(self.bindings, self.$windowEl[0]);

        if (!config.url) {
            self.initFn = dti.utility.getPathFromObject(config.initFn, dti);
            // self.instance = new self.cls({
            //     $container: self.$windowEl.children('.markupContent')
            // });
            self.initFn({
                $container: self.$windowEl.find('.markupContent'),
                onActive: self.bindings.active
            });

            self.bindings.loading(false);
        }

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
                dti.windows.dragStart();
            },
            stop: function () {
                dti.windows.dragStop();
            }
        },
        resizableConfig: {
            // helper: 'ui-resizable-helper',
            containment: 'main',
            handles: 'all',
            start: function () {
                dti.windows.resizeStart();
            },
            stop: function () {
                dti.windows.resizeStop();
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

            dti.forEachArray(dti.windows.windowList, function checkForTargetWindow (win) {
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
                dti.forEachArray(dti.windows.windowList, function checkForTargetWindow (win) {
                    if (win.upi === upi) {
                        targetWindow = win;
                        return false;
                    }
                });
            }

            return targetWindow;
        },
        resizeStart: function () {
            dti.windows._setInteractingFlag(true);
        },
        resizeStop: function () {
            dti.windows._setInteractingFlag(false);
        },
        dragStart: function () {
            dti.windows._setInteractingFlag(true);
        },
        dragStop: function () {
            dti.windows._setInteractingFlag(false);
        },
        init: function () {
            // dti.windows.elementSelector = '.dti-card-panel';//'.card, .card-panel';
            // dti.windows.$elements = $(dti.windows.elementSelector);

            // dti.windows.$elements.draggable(dti.windows.draggableConfig);

            // dti.windows.$elements.resizable(dti.windows.resizableConfig);

            dti.on('closeWindow', function handleCloseWindow (win) {
                var windowId = win.bindings.windowId();

                dti.forEachArray(dti.windows.windowList, function checkOpenWindow (openWin, idx) {
                    if (openWin.windowId === windowId) {
                        dti.windows.windowList.splice(idx, 1);
                        return false;
                    }
                });
            });

            dti.on('hideWindows', function hideWindows () {
                dti.bindings.windowsHidden(true);
            });

            dti.on('unhideWindows', function unhideWindows () {
                dti.bindings.windowsHidden(false);
            });
        },
        offset: function () {
            dti.windows._offsetCount++;

            if (dti.windows._offsetCount >= dti.windows._offsetMax) {
                dti.windows._offsetCount = 0;
                dti.windows._offsetX = 30;
                dti.windows._offsetY = 30;
            } else {
                dti.windows._offsetX += dti.windows._offset;
                dti.windows._offsetY += dti.windows._offset;
            }
        },
        sendMessage: function (e) {
            var targetWindow,
                winId = e.winId || e._windowId;

            targetWindow = dti.windows.getWindowById(winId);

            if (targetWindow) {
                targetWindow.handleMessage(e);
            }
        },
        create: function (config) {
            var newWindow;

            if (config.options && config.options.sameWindow) {
                newWindow = dti.windows.getWindowById(config._windowId || config.options.windowId);
                newWindow.setUrl(config.url);
            } else {
                newWindow = dti.windows.getWindowByUpi(config.upi);

                if (newWindow) {
                    dti.windows.activate(newWindow.windowId);
                } else {
                    $.extend(config, config.options);

                    if (!config.exempt) {
                        dti.windows.offset();

                        if (config.left === undefined) {
                            config.left = dti.windows._offsetX;
                        }
                        if (config.top === undefined) {
                            config.top = dti.windows._offsetY;
                        }
                    }

                    newWindow = new dti.Window(config);

                    dti.taskbar.addWindow(newWindow);

                    // config.afterLoad = dti.windows.afterLoad;

                    dti.windows.windowList.push(newWindow);

                    if (!config.isHidden) {
                        dti.windows.activate(newWindow.windowId);
                    }

                    if (config.options && config.options.callback) {
                        config.options.callback();
                    }
                }
            }

            return newWindow;
        },
        processOpenWindowParameters: function (config) {
            if (config.pointType && !config.type) {
                config.type = config.pointType;
            }

            if (typeof config.type === 'number') {
                config.type = dti.workspaceManager.config.Utility.pointTypes.getPointTypeNameFromEnum(config.type);
            }

            if (typeof config.url !== 'string' && !config.initFn) {
                config.url = dti.utility.getEndpoint(config.type, config.upi).review.url;
            }

            return config;
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

            config = dti.windows.processOpenWindowParameters(config);

            dti.navigator.hideNavigator();
            dti.windows.create(config);
        },
        getWindowsByType: function (type) {
            var openWindows = dti.bindings.openWindows[type];

            return (openWindows && openWindows()) || [];
        },
        closeWindow: function (id) {
            var targetWindow = dti.windows.getWindowById(id);

            targetWindow.close();
        },
        closeAll: function (group) {
            var openWindows;

            if (group) {
                openWindows = dti.bindings.openWindows[group];

                if (openWindows) {
                    openWindows = openWindows();
                }
            } else {
                //no group, close all of them
                openWindows = dti.windows.windowList;
            }

            dti.forEachArrayRev(openWindows, function (win) {
                win.close();
            });

            dti.fire('hideMenus');
        },
        activate: function (target) {
            dti.fire('hideMenus');

            dti.forEachArray(dti.windows.windowList, function processWindowActivate (win) {
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
            dti.forEachArray(dti.windows.windowList, function deactivateOnShowDesktop (win) {
                win.minimize(null, true);
            });
        }
    },
    taskbar: {
        pinnedItems: ['Navigator', 'Display'],
        init: function () {
            dti.bindings.startMenuItems(ko.viewmodel.fromModel(dti.config.itemGroups));
            //load user preferences 
            dti.forEachArray(dti.taskbar.pinnedItems, function processPinnedItem (item) {
                dti.bindings.openWindows[item] = ko.observableArray([]);
                dti.bindings.windowGroups.push(dti.taskbar.getKOWindowGroup(item, true));
            });

            dti.on('closeWindow', function handleCloseWindow (win) {
                var group = win.bindings.group(),
                    openWindows = dti.bindings.openWindows[group]();

                if (openWindows.length === 0) {
                    dti.fire('hideMenus');
                    dti.bindings.windowGroups.remove(function removeWindowGroup (item) {
                        return item.group() === group && item.pinned() === false;
                    });
                }
            });

            // dti.bindings.windowGroups(pinnedItems);
        },
        show: function () {
            dti.bindings.taskbarShown(true);
        },
        hide: function () {
            dti.bindings.taskbarShown(false);
        },
        addWindow: function (win) {
            var group = win.bindings.group();

             if (group && dti.taskbar.isValidGroup(group)) {
                if (!dti.taskbar.isGroupOpen(group)) {
                    dti.bindings.openWindows[win.bindings.group()] = ko.observableArray([]);
                    dti.bindings.windowGroups.push(dti.taskbar.getKOWindowGroup(group));
                }

                dti.bindings.openWindows[win.bindings.group()].push(win.bindings);
            }
        },
        getWindowGroup: function (grp) {
            return dti.config.itemGroups[grp] || dti.config.itemGroups.Point;
        },
        getWindowGroupName: function (grp) {
            var group = dti.taskbar.getWindowGroup(grp);

            return group.group;
        },
        getKOWindowGroup: function (grp, pinned) {
            var group = dti.taskbar.getWindowGroup(grp);

            group.pinned = !!pinned;

            return ko.viewmodel.fromModel(group);
        },
        isValidGroup: function (group) {
            return dti.config.itemGroups[group] !== undefined;
        },
        isGroupOpen: function (group) {
            var openWindowGroups = dti.bindings.windowGroups(),
                found = false;

            dti.forEachArray(openWindowGroups, function isWindowGroupOpen (windowGroup) {
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
            dti.startButton.$el = $('#startButton');

            $('body').mousedown(function handleBodyMouseDown (event) {
                dti.forEachArray(dti.events._bodyClickHandlers, function bodyMouseDownHandler (handler) {
                    var $target = $(event.target);

                    handler(event, $target);
                });
            });

            $('#openItems').click(function showOpenItems () {
                $('#modal2').openModal();
            });

            dti.events.hoverMenu('.startButtonContainer', 'startmenu');

            // dti.events.clickMenu('#globalSearch', '#searchBox', {
            //     before: function () {
            //         $('#searchBox input').focus();
            //     }
            // });
        }
    },
    startMenu: {
        init: function () {
            $.contextMenu({
                selector: '.dti-menu-tile',
                items: {
                    pin: {
                        name: 'Pin to taskbar',
                        callback: function (key, opt) {
                            var $target = opt.$trigger,
                                text = $target.children('span').text(),
                                icon = $target.children('i').html(),
                                $el,
                                template = '<li class="taskbarItem active"><a href="javascript://" data-position="bottom" data-tooltip="' + text + '" data-delay="10" class="taskbarButton testHover hoverButton2 waves-effect"><i class="material-icons">' + icon + '</i><span>' + text + '</span></a></li>';

                            if (!dti.taskbar.pinnedItems[text]) {
                                $el = $('.taskbar .left').append(template);

                                dti.taskbar.pinnedItems[text] = {
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
            //     $('.dti-card-panel').addClass('hide');
            // });
        },
        handleClick: function (koIconObj) {
            var obj = ko.toJS(koIconObj),
                id = dti.makeId(),
                openWindows,
                doOpenWindow = function () {
                    if (obj.url) {
                        obj.url += '?' + id;
                    }

                    obj.pointType = obj.group;

                    dti.windows.openWindow(obj);
                };

            if (!obj.standalone) {
                dti.settings._workspaceNav = true;
                dti.bindings.showNavigator({
                    pointType: obj.group,
                    retainNames: true
                });
            } else {
                if (obj.singleton) {
                    openWindows = dti.windows.getWindowsByType(obj.group);
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
            var alarms = dti.bindings.alarms,
                unacknowledgedAlarms = alarms.unacknowledged,
                constants = dti.bindings.alarms.constants,
                debug = dti.alarms.debug,
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

                        // TODO change this to use dti.workspaceManager.getConfig('revEnums.Alarm Classes.' + alarm.almClass)
                        // after it is available
                        alarm.almClassText = dti.workspaceManager.config.revEnums['Alarm Classes'][alarm.almClass];
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

                    dti.socket.emit('getUnacknowledged', JSON.stringify({
                        user: dti.bindings.user(),
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

                    if (initDone && data.count && !dti.alarms.annunciator.active) {
                        dti.alarms.annunciator.start();
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
                    
                    dti.forEachArray(unacknowledgedAlarms.list(), function iterator (alarm, index) {
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
                    var acknowledgeRequests = dti.alarms.acknowledgeRequests,
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
                dti.alarms.receiveUnacknowledgedAlarms = receiveUnacknowledgedAlarms;
                dti.alarms.newUnackAlarm = newUnackAlarm;
                dti.alarms.removingUnackAlarm = removingUnackAlarm;
            } else {
                dti.socket.on('unacknowledged', receiveUnacknowledgedAlarms);
                dti.socket.on('newUnackAlarm', newUnackAlarm);
                dti.socket.on('removingUnackAlarm', removingUnackAlarm);
                dti.socket.on('acknowledgeResponse', acknowledgeResponse);
                getUnacknowledgedAlarms();
            }

            // Initialize our unacknowledged alarms hover menu
            dti.alarms.hoverMenu = dti.events.hoverMenu('#alarmIcon');

            dti.on('loaded', function () {
                initDone = true;

                if (debug.enable) {
                    debug.loadAlarms(75);
                }

                if (unacknowledgedAlarms.count() > 0) {
                    dti.alarms.annunciator.start();
                }

            });
        },
        sendAcknowledge: function (alarmList) {
            var request = {
                    reqID: dti.makeId(),
                    username: dti.bindings.user().username,
                    ids: [],
                    timeoutID: null
                },
                constants = dti.bindings.alarms.constants,
                acknowledgeTimeout = function () {
                    dti.forEachArray(alarmList, function (alarm, index) {
                        alarm.ackStatus(constants.ACK_ERROR);
                    });
                };

            if (dti.alarms.debug.enable) {
                dti.alarms.debug.sendAcknowledge(alarmList);
                return;
            }

            dti.forEachArray(alarmList, function (alarm, index) {
                request.ids.push(alarm._id);
                alarm.ackStatus(constants.ACK_IN_PROGRESS);
            });

            request.timeoutID = window.setTimeout(acknowledgeTimeout, constants.TIMEOUT);

            dti.alarms.acknowledgeRequests[request.reqID] = request;

            dti.log('Sending alarm acknowledge:', request.ids);

            dti.socket.emit('sendAcknowledge', JSON.stringify(request));
        },
        acknowledgeRequests: {},
        annunciator: {
            id: 0,
            interval: 10000, // milliseconds
            sound: 'chime',
            active: false,
            start: function () {
                var annunciator = dti.alarms.annunciator;

                if (annunciator.active) {
                    return;
                }
                annunciator.active = true;
                annunciator.play();

                annunciator.id = window.setInterval(function () {
                    if (dti.bindings.alarms.unacknowledged.count() > 0) {
                        if (dti.bindings.alarms.isMuted() === false) {
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
                dti.audio.play(dti.alarms.annunciator.sound);
            }
        },
        debug: {
            enable: false,
            loadAlarms: function (amount) {
                var _id,
                    unacknowledged = dti.bindings.alarms.unacknowledged,
                    list = unacknowledged.list(),
                    listLength = list.length,
                    count = unacknowledged.count(),
                    BUFFER_MAX = dti.bindings.alarms.constants.BUFFER_MAX,
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

                dti.alarms.receiveUnacknowledgedAlarms({
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
                    dti.alarms.newUnackAlarm({
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
                var unacknowledgedAlarms = dti.bindings.alarms.unacknowledged;

                while (count && count-- && unacknowledgedAlarms.list().length) {
                    dti.alarms.removingUnackAlarm({
                        _id: unacknowledgedAlarms.list()[0]._id,
                        ackStatus: 2,
                        ackUser: '',
                        ackTime: 0
                    });
                }
            },
            start: function (interval) {
                var debug = dti.alarms.debug;
                
                if (dti.bindings.alarms.unacknowledged.list().length === 0) {
                    debug.loadAlarms(150);
                }

                debug.id = window.setInterval(function () {
                    debug.removeAlarms(1);
                }, interval || 300);
            },
            stop: function () {
                window.clearInterval(dti.alarms.debug.id);
            },
            sendAcknowledge: function (alarmList) {
                dti.forEachArray(alarmList, function (alarm, index) {
                    dti.alarms.removingUnackAlarm({
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
        $resultsEl: $('#globalSearchResults'),
        $inputEl: null, // Element added to the DOM in globalSearch.init()
        $chips: $('#searchNavbar .chips'),
        $clearAllChipEl: $('#searchNavbar .clearAllChip'),
        visible: false,
        searchTerms: {},
        chipsTimeoutID: 0,
        scrollTimeoutID: 0,
        reqID: 0,
        performingNewSearch: true,
        options: {
            highlightNameMatch: true,
            searchLimit: 200, // Number of results to get per search
            maximumResultsShown: 2000, // Maximum number of results we'll get/show in the DOM
            infiniteScrollThreshold: 0.75, // Scroll within 75% of page bottom auto-gets more results
            manualLoadThreshold: 1000 // Replace infinite scroll with manual load button every [this many] results
        },
        autosuggest: null, // Initialized in 'initOnLoad'
        autosuggestPropertyData: {},
        init: function () {
            var bindings = dti.bindings.globalSearch,
                expressionMap = {
                    upi: '_id'
                };

            dti.globalSearch.chips = dti.globalSearch.$chips.material_chip({
                placeholder: '+Search',
                secondaryPlaceholder: 'Search'
            });

            dti.globalSearch.$chips.on('chip.add', function (e, chip) {
                window.clearTimeout(dti.globalSearch.chipsTimeoutID);

                var parsed = dti.globalSearch.autosuggest.parse(chip.tag);
                
                if (parsed.isInvalid) {
                    dti.globalSearch.$chips.find('.chip').last().addClass('err');
                } else {
                    if (parsed.isEquation && !parsed.isInvalid) {
                        if (expressionMap[parsed.expression]) {
                            parsed.expression = expressionMap[parsed.expression];
                        }
                        // If it's not a chained expression or an internal property (they start with '_')
                        if ((parsed.expression.indexOf('.') < 0) && (parsed.expression.charAt(0) !== '_')) {
                            // Append the Value key
                            parsed.expression = parsed.expression + '.Value';
                        }
                    }
                    
                    parsed.property = parsed.expression.split('.')[0];

                    dti.globalSearch.searchTerms[chip.tag] = parsed;
                    // Set our flag indicating we're going to perform a new search
                    dti.globalSearch.performingNewSearch = true;
                    // Do the search
                    dti.globalSearch.doSearch();
                }
                
                // Ensure our 'Clear All' chip is visible
                dti.globalSearch.$clearAllChipEl.removeClass('hide');
            });

            dti.globalSearch.$chips.on('chip.delete', function (e, chip) {
                delete dti.globalSearch.searchTerms[chip.tag];
                window.clearTimeout(dti.globalSearch.chipsTimeoutID);

                // We need to clear our request ID immediately in case a previous request
                // is in route
                dti.globalSearch.reqID = 0;
                // Set our flag indicating we're going to perform a new search
                dti.globalSearch.performingNewSearch = true;
                // We signal the UI that we're getting data even though we're not yet because
                // it has a glitchy feel if the search doesn't appear to begin immediately
                // after we've changed our search criteria
                bindings.gettingData(true);

                if (Object.keys(dti.globalSearch.searchTerms).length) {
                    dti.globalSearch.chipsTimeoutID = window.setTimeout(function () {
                        dti.globalSearch.doSearch();
                    }, 750);
                } else {
                    bindings.gettingData(false);
                    dti.globalSearch.$clearAllChipEl.addClass('hide');
                }
            });

            dti.globalSearch.$inputEl = $('#searchNavbar input');

            dti.globalSearch.$resultsEl.scroll(function handleScroll () {
                window.clearTimeout(dti.globalSearch.scrollTimeoutID);

                dti.globalSearch.scrollTimeoutID = window.setTimeout(function () {
                    var $resultsEl = dti.globalSearch.$resultsEl,
                        totalHeight = $resultsEl[0].scrollHeight,
                        visibleHeight = $resultsEl[0].clientHeight,
                        scrollTop = $resultsEl.scrollTop(),
                        totalNumberOfResults = bindings.count(),
                        numberOfResultsShown = bindings.searchResults().length;

                    // If we're already in the process of getting data, or we've reached our maximum nubmer of results, get out of here!
                    if (bindings.gettingData() || (numberOfResultsShown >= dti.globalSearch.options.maximumResultsShown)) {
                        return;
                    }

                    // If we're scrolled within [infiniteScrollThreshold]% of page bottom
                    if ((scrollTop + visibleHeight) >= (totalHeight * dti.globalSearch.options.infiniteScrollThreshold)) {
                        // If we have more results on the server
                        if (numberOfResultsShown < totalNumberOfResults) {
                            // If we've haven't gathered another [manualLoadThreshold] results
                            if (numberOfResultsShown % dti.globalSearch.options.manualLoadThreshold) {
                                // Auto-get more results
                                dti.globalSearch.doSearch(true);
                            } else {
                                // Show the laod more button so the user can get more results
                                bindings.showLoadMoreResultsButton(true);
                            }
                        }
                    }
                }, 100);
            });

            // Add a click handler for our 'Clear All' chip button
            dti.globalSearch.$clearAllChipEl.click(function handleClick (e) {
                dti.globalSearch.clear();
                dti.globalSearch.$inputEl.focus();
            });

            // Subscribe to our gettingData observable so we can setup the UI accordingly
            bindings.gettingData.subscribe(function whatAmI (gettingData) {
                var resultsEl;

                if (gettingData) { // Search started
                    bindings.showError(false);
                    bindings.showLoadMoreResultsButton(false);

                    if (dti.globalSearch.performingNewSearch) {
                        bindings.showSummary(false);
                        bindings.count(0);
                        bindings.searchResults.removeAll();
                    }
                } else { // Search finished
                    if (!bindings.showError() && Object.keys(dti.globalSearch.searchTerms).length) {
                        bindings.showSummary(true);

                        resultsEl = dti.globalSearch.$resultsEl.get(0);
                        // If scroll bar isn't visible
                        if (resultsEl.scrollHeight <= resultsEl.clientHeight) {
                            // If we have more results on the server
                            if (bindings.count() > bindings.searchResults().length) {
                                // We do this because normally the scroll event triggers loading of 
                                // more results. But since the scroll bar isn't visible, we need to 
                                // let the user do it manually
                                bindings.showLoadMoreResultsButton(true);
                            }
                        }
                    }
                }
            });
        },
        initOnLoad: function () {
            var valueTypes = Object.keys(dti.utility.getConfig('Enums.Value Types')),
                distinct = [],
                getControlData = function () {
                    var systemEnums = dti.workspaceManager.systemEnums,
                        controlData = [{
                            name: 'Control Priority',
                            enumsSet: systemEnums.controlpriorities
                        }, {
                            name: 'Controller',
                            enumsSet: systemEnums.controllers
                        }];

                    if (!systemEnums.controlpriorities || !systemEnums.controllers) {
                        return window.setTimeout(getControlData, 1000);
                    }

                    dti.forEachArray(controlData, function (ctrl) {
                        var item = {
                                isDisplayable: [true, false],
                                isReadOnly: [true, false],
                                ValueType: "",
                                Value: ""
                            },
                            _values = [],
                            data = {};

                        dti.forEachArray(ctrl.enumsSet, function (obj) {
                            _values.push(obj.name);
                        });
                        if (ctrl.name === 'Control Priority') {
                            item._valuesNoSort = _values;
                        } else {
                            item._values = _values;
                        }
                        item.Value = _values;

                        data[ctrl.name] = item;
                        $.extend(dti.globalSearch.autosuggestPropertyData, data);
                        dti.globalSearch.autosuggest.addData('Properties', data);
                    });
                };

            // Build autosuggest data
            dti.forEach(dti.utility.getConfig('Enums.Properties'), function buildAutosuggestData (property, name, index) {
                var item = {
                        isDisplayable: [true, false],
                        isReadOnly: [true, false],
                        ValueType: "",
                        Value: ""
                    },
                    _values,
                    arr,
                    addDistinct = function () {
                        distinct.push({
                            property: name,
                            valueTypes: [0, 2, 5] // None, string, enum
                        });
                    };

                if (!property.reportEnable) {
                    return;
                }
                if ((name === 'Control Priority') || (name === 'Controller')) {
                    return;
                }

                if (property.valueType === 'Enum') {
                    if (property.hasOwnProperty('enumsSet') && property.enumsSet.length && (property.enumsSet !== 'Default Active States')) {
                        _values = Object.keys(dti.utility.getConfig('Enums.' + property.enumsSet));
                        item._values = _values;
                        item.Value = _values;
                    } else {
                        addDistinct();
                    }
                } else if (property.valueType === 'BitString') {
                    _values = Object.keys(dti.utility.getConfig('Enums.' + name + ' Bits'));
                    item._values = _values;
                    item.Value = _values;
                } else if (property.valueType === 'None') {
                    item.ValueType = valueTypes;
                    addDistinct();
                } else if (property.valueType === 'String') {
                    addDistinct();
                } else if (property.valueType === 'Bool') {
                    _values = [true, false];
                    item._values = _values;
                    item.Value = _values;
                }
                dti.globalSearch.autosuggestPropertyData[name] = item;
            });

            // Create auto suggest
            dti.globalSearch.autosuggest = new dti.autosuggest.Autosuggest({
                $inputElement: dti.globalSearch.$inputEl,
                $resultsContainer: $('#searchNavbar'),
                $chips: dti.globalSearch.$chips,
                sources: [{
                    name: 'Properties',
                    nameShown: true,
                    data: dti.globalSearch.autosuggestPropertyData
                }]
            });

            // Add click handler to hide the autosuggest
            $('#globalSearchResults').click(function (e) {
                dti.globalSearch.autosuggest.hide();
            });

            // Async call to db to get distinct values
            $.ajax({
                type: 'post',
                url: '/api/points/getDistinctValues',
                data: JSON.stringify(distinct),
                contentType: 'application/json'
            }).done(
                function handleData (data) {
                    if (data.err) {
                        return dti.log('globalSearch getDistinctValues failed', data.err);
                    }
                    var obj = {};

                    dti.forEachArray(data, function (item) {
                        obj[item.property] = {
                            Value: item.distinct,
                            _values: item.distinct
                        };
                    });

                    dti.globalSearch.autosuggest.addData('Properties', obj);
                }
            ).fail(
                function fnName (jqXHR, textStatus, errorThrown) {
                    dti.log('globalSearch getDistinctValues failed', jqXHR, textStatus, errorThrown);
                }
            ).always (
                function finished () {
                }
            );
            // Here's an example of our distinct Quality Code Enable.Value values in the db:
            // [11,255,9,251,254,247,240,250,0,248,241,244,242]
            // But our Quality Code Enable Values the user enters are 'Override', 'COV Enable', 'Alarms Off', 'Command Pending', 'All'
            // On the server side if we see the user searching for something with bit string, make sure to account for this type of thing
            
            // Get controller and control priorities data for the autosuggest
            getControlData();
        },
        show: function () {
            dti.globalSearch.visible = true;
            dti.fire('hideWindows');
            dti.fire('hideMenus');

            dti.animations.fadeIn(dti.globalSearch.$taskbarEl, function focusSearchInput () {
                dti.globalSearch.$inputEl.focus();
                dti.taskbar.hide();
            });

            dti.animations.fadeIn(dti.globalSearch.$resultsEl);
        },
        hide: function (doNotResetResults) {
            if (dti.globalSearch.visible) {
                dti.globalSearch.visible = false;
                dti.fire('unhideWindows');
                dti.taskbar.show();

                dti.animations.fadeOut(dti.globalSearch.$taskbarEl);
                dti.animations.fadeOut(dti.globalSearch.$resultsEl, function resetSearch () {
                    dti.globalSearch.autosuggest.hide(true);
                    if (doNotResetResults) {
                        return;
                    }
                    dti.globalSearch.clear();
                });
            }
        },
        doSearch: function (appendResults) {
            var bindings = dti.bindings.globalSearch,
                data = {
                    searchTerms: dti.globalSearch.searchTerms,
                    reqID: dti.makeId(),
                    limit: dti.globalSearch.options.searchLimit
                },
                handleError = function (errorMessage) {
                    bindings.errorMessage(errorMessage);
                    bindings.showError(true);
                },
                processPoint = function (point) {
                    var pointType = point['Point Type'].Value,
                        itemGroup = dti.config.itemGroups[pointType];

                    if (itemGroup === undefined) {
                        itemGroup = dti.config.itemGroups.Point;
                    }

                    point.iconClass = itemGroup.iconClass;
                    point.iconText = itemGroup.iconText;

                    if (pointType === 'Display') {
                        point.thumbnailFound = ko.observable(false);
                    }

                    if (dti.globalSearch.options.highlightNameMatch) {
                        Object.keys(dti.globalSearch.searchTerms).forEach(function (searchTerm) {
                            var name = point.NameWithHighlight || point.Name;
                            point.NameWithHighlight = name.replace(new RegExp(searchTerm, 'ig'), ['<span class="highlight">', '$&', '</span>'].join(''));
                        });
                    }
                };

            // Clear our timers just to make sure we don't encounter any unexpected race conditions
            window.clearTimeout(dti.globalSearch.scrollTimeoutID);
            window.clearTimeout(dti.globalSearch.chipsTimeoutID);

            dti.globalSearch.reqID = data.reqID;
            
            if (!dti.globalSearch.performingNewSearch) {
                data.skip = bindings.searchResults().length;
            }

            bindings.gettingData(true);

            $.ajax({
                type: 'post',
                url: '/api/points/globalSearch',
                data: JSON.stringify(data),
                contentType: 'application/json'
            }).done(
                function (data) {
                    var resultsEl;

                    if (data.err) {
                        return handleError(data.err);
                    }
                    // If the request ID doesn't match our current request ID
                    if (data.reqID !== dti.globalSearch.reqID) {
                        return;
                    }
                    // If our global search isn't visible we need to discard results
                    if (!dti.globalSearch.visible) {
                        return;
                    }

                    data.points.forEach(processPoint);

                    if (dti.globalSearch.performingNewSearch) {
                        bindings.searchResults(data.points);
                    } else {
                        bindings.searchResults(bindings.searchResults().concat(data.points));
                    }
                    dti.globalSearch.performingNewSearch = false;
                    bindings.count(data.count);
                }
            ).fail(
                function globalSearchFail (jqXHR, textStatus, errorThrown) {
                    dti.log('Global search failed', jqXHR, textStatus);
                    handleError([textStatus, jqXHR.status, errorThrown, jqXHR.responseText].join('</br>'));
                }
            ).always (
                function globalSearchFinished () {
                    bindings.gettingData(false);
                }
            );
        },
        clear: function () {
            var $chips = dti.globalSearch.$chips,
                chipsIndex = $chips.data('index'),
                len = $chips.data('chips').length;

            // Remove all chips (search terms)
            while (len--) {
                $chips.deleteChip(chipsIndex, 0, $chips);
            }
            // Hide auto suggest and clear the search box
            dti.globalSearch.autosuggest.hide(true);
        },
        openPoint: function (data) {
            dti.windows.openWindow({
                pointType: data['Point Type'].Value,
                upi: data._id
            });
            dti.globalSearch.hide(true);
        },
        handleEscape: function (e) {
            if (dti.globalSearch.autosuggest.bindings.isShown() === false) {
                dti.globalSearch.hide();
            }
        }
    },
    autosuggest: {
        init: function () {

        },
        Autosuggest: function (config) {
            // config:
            // {
            //     $inputElement: $element,
            //     $resultsContainer: $element,
            //     $chips: $element, // Materialize chips $ element - ONLY if the autosuggest is on an input with materialize chips installed
            //     sources: [{
            //         data: [array of suggestion strings],
            //         name: 'name of data source',
            //         nameShown: bool (show name header before suggestion results)
            //         * async data sources will require additional info TBD
            //     }, {...}],
            //     see 'defaults' object below for additional options
            // }

            var self = this,
                defaults = {
                    highlight: true, // If true, when suggestions are rendered, pattern matches for the current query in text nodes will be wrapped in a strong element with its class set to {{classNames.highlight}}
                    minLength: 0, // The minimum character length needed before suggestions start getting rendered
                    classNames: {
                        highlight: 'autosuggestHighlight',  // Added to the element that wraps highlighted text
                        match: 'autosuggestMatch',          // Added to suggestion elements in the suggestion container
                        selected: 'autosuggestSelected',    // Added to selected suggestion elements
                        header: 'autosuggestHeader',        // Added to suggestion source header (if shown)
                        container: 'autosuggestContainer'   // Added to suggestion container
                    },
                    autoselect: false, // If nothing selected, autoselect the first suggestion when autosuggest renders or the suggestions change
                    chainCharacter: '.' // Delimiter character used to separate links in an object chain
                },
                cfg = $.extend(defaults, config),
                selectors = (function () {
                    var obj = {};

                    dti.forEach(cfg.classNames, function (cssClass, name) {
                        obj[name] = '.' + cssClass;
                    });
                    
                    return obj;
                })(),
                operatorsRegex = new RegExp('[<>]=|!=|<>|>|<|=|:'),
                $markup,
                $container,
                scrollTo = function ($target) {
                    if (!$target || !$target.length) {
                        return $target;
                    }

                    var topOffset = $target.position().top,
                        doScroll = false;

                    if (topOffset < 0) {
                        doScroll = true;
                    } else {
                        topOffset = (topOffset + $target.height()) - $container.height();
                        
                        if (topOffset > 0) {
                            doScroll = true;
                        }
                    }

                    if (doScroll) {
                        $container.scrollTop($container.scrollTop() + topOffset);
                    }

                    return $target;
                },
                sortArray = function (arr) {
                    arr.sort(function (a,b) {
                        return a.text.toLowerCase() > b.text.toLowerCase() ? 1:-1;
                    });
                },
                getOperator = function (str) {
                    var operator = str.match(operatorsRegex);

                    return operator && operator[0];
                },
                parse = function (str) {
                    var beginningWhitespaceRegex = /^\s*/,
                        parsed = {
                            expression: str,
                            isEquation: false,
                            isInvalid: false,
                            operator: getOperator(str),
                            value: null,
                        },
                        equationParts,
                        i;

                    if (parsed.operator) {
                        parsed.isEquation = true;
                        equationParts = str.split(parsed.operator);
                        parsed.expression = equationParts[0].trim();
                        parsed.value = equationParts[1].replace(beginningWhitespaceRegex, '');
                        
                        if (parsed.expression.length === 0) {
                            parsed.isEquation = false;
                            parsed.value = null;
                            parsed.operator = null;
                            parsed.expression = str;
                        } else if (equationParts.length > 2) {
                            parsed.isInvalid = true;
                            // Our 'value' term is incomplete - finish it out
                            i = 2;
                            do {
                                parsed.value += equationParts[i++];
                            } while (i < parsed.expression.length);
                        } else if (parsed.expression.match(operatorsRegex) || parsed.value.match(operatorsRegex)) {
                            parsed.isInvalid = true;
                        }
                    }

                    return parsed;
                },
                getMatches = function (inputValue) {
                    var regex = new RegExp(inputValue, 'ig'),
                        totalMatches = 0,
                        parsed,
                        matches,
                        data,
                        chain,
                        stopIndex;

                    dti.forEachArray(self.bindings.sources(), function (source) {
                        matches = [];
                        data = source.data;

                        if (Array.isArray(data)) {
                            dti.forEachArray(data, function (item) {
                                if (regex.test(item.text)) {
                                    if (cfg.highlight) {
                                        item.html(item.text.replace(regex, ['<span class="', cfg.classNames.highlight, '">', '$&', '</span>'].join('')));
                                    }
                                    matches.push(item);
                                }
                            });
                        } else { // Must be an object
                            parsed = parse(inputValue);

                            // If our search includes a chain character
                            if (!!~parsed.expression.indexOf(cfg.chainCharacter)) {
                                chain = parsed.expression.split(cfg.chainCharacter);

                                if (parsed.operator) {
                                    stopIndex = chain.length - 1;
                                } else {
                                    stopIndex = chain.length - 2;
                                    // Ex: Part1.Sub2.stillWorkingOnThisOne
                                    // We want to stop on 'Sub2' so we get all of Sub2's available keys and match against string 'stillWorkingOnThisOne'
                                }

                                dti.forEachArray(chain, function (link, ndx) {
                                    if (data.hasOwnProperty(link)) {
                                        data = data[link];
                                    } else {
                                        data = null;
                                        return false;
                                    }

                                    if (ndx === stopIndex) {
                                        if (parsed.operator) {
                                            data = data._private.values;
                                        } else {
                                            // Update our regex; continuing the example above, we want to test against 'stillWorkingOnThisOne' instead of 'Part1.Sub2.stillWorkingOnThisOne'
                                            regex = new RegExp(chain[chain.length-1], 'ig');
                                        }
                                        return false;
                                    }
                                });
                            } else if (parsed.operator) {
                                data = data[parsed.expression] && data[parsed.expression]._private.values;
                            }

                            if (data) {
                                if (parsed.operator) {
                                    regex = new RegExp(parsed.value, 'ig');

                                    dti.forEachArray(data, function (item, index) {
                                        if (regex.test(item.text)) {
                                            if (cfg.highlight) {
                                                item.html(item.text.replace(regex, ['<span class="', cfg.classNames.highlight, '">', '$&', '</span>'].join('')));
                                            }
                                            matches.push(item);
                                        }
                                    });
                                } else {
                                    dti.forEach(data, function (item, key) {
                                        if (key === '_private') {
                                            return;
                                        }

                                        if (regex.test(item._private.text)) {
                                            if (cfg.highlight) {
                                                item._private.html(item._private.text.replace(regex, ['<span class="', cfg.classNames.highlight, '">', '$&', '</span>'].join('')));
                                            }
                                            matches.push(item._private);
                                        }
                                    });
                                }
                            }
                        }

                        sortArray(matches);
                        source.matches(matches);
                        totalMatches += matches.length;
                    });

                    if (totalMatches <= 1) {
                        self.hide();
                    }
                    self.numberOfMatches = totalMatches;
                },
                handleKeyup = function (e) {
                    var inputValue = cfg.$inputElement.val(),
                        key = e.which,
                        catchKeys = [27, 40, 38, 10, 13]; // escape, down, up, return, return

                    if (!!~catchKeys.indexOf(key)) {
                        if (key === 27) { // escape
                            self.hide();
                        }
                        return;
                    }

                    getMatches(inputValue);

                    if (self.bindings.isShown() === false) {
                        if (inputValue.length > cfg.minLength) {
                            self.show();
                        }
                    } else if (!self.getSelected().length) {
                        if (cfg.autoselect) {
                            self.selectFirst();
                        }
                    } else {
                        scrollTo(self.getSelected());   // Scroll to the selected item (JIC it's not in view)
                    }
                },
                handleKeydown = function (e) {
                    var key = e.which,
                        $selected;

                    if (key === 10 || key === 13) { // return
                        $selected = self.getSelected();
                        if (self.bindings.isShown() && $selected.length) {
                            // If materialize chips is installed on this input
                            if (cfg.$chips) {
                                // Stop propagation so we don't create a chip
                                e.stopImmediatePropagation();
                            }

                            self.bindings.selectMatch(ko.dataFor($selected[0]));
                        } else {
                            getMatches('');
                            self.hide();
                        }
                    } else if (key === 40) { // down
                        if (self.bindings.isShown() === false) {
                            self.show();
                        } else {
                            self.selectNext();
                        }
                    } else if (key === 38) { // up
                        if (self.bindings.isShown()) {
                            self.selectPrevious();
                        }
                    }
                };

            if (!cfg.$inputElement || !cfg.$inputElement.length) {
                return dti.log('Invalid $inputElement', config.$inputElement);
            }
            if (!cfg.$resultsContainer || !cfg.$resultsContainer.length) {
                return dti.log('Invalid $resultsContainer', config.$resultsContainer);
            }
            if (cfg.$chips && !cfg.$chips.length) {
                return dti.log('Invalid $chips', config.$chips);
            }

            self.getSource = function (name) {
                var sources = self.bindings.sources(),
                    source;

                dti.forEachArray(sources, function (src) {
                    if (src.name() === name) {
                        source = src;
                        return false;
                    }
                });

                return source;
            };

            self.addSource = function (src) {
                var source = {
                        name: ko.observable(src.name || dti.makeId()),
                        nameShown: ko.observable(src.nameShown),
                        data: Array.isArray(src.data) ? []:{},
                        matches: ko.observableArray([])
                    };

                self.bindings.sources.push(source);

                self.addData(source.name(), src.data);

                getMatches(cfg.$inputElement.val());
            };

            self.addData = function (sourceName, data) {
                // data: array of suggestion strings or an object
                var source = self.getSource(sourceName),
                    addValues = function (fromArray, toArray, additionalProperties) {
                        var item;

                        additionalProperties = additionalProperties || {};

                        dti.forEachArray(fromArray, function (value) {
                            value = value.toString();
                            item = $.extend({
                                text: value,
                                html: ko.observable(value)
                            }, additionalProperties);

                            toArray.push(item);
                        });
                    },
                    addValuesAndSort = function (fromArray, toArray, additionalProperties) {
                        addValues(fromArray, toArray, additionalProperties);
                        sortArray(toArray);
                    },
                    addObj = function (parent, srcItem, text) {
                        var item = {
                                _private: {
                                    parent: parent,
                                    text: text,
                                    html: ko.observable(text),
                                    values: [],
                                    isTopLevel: !!!parent._private
                                }
                            };

                        if (!parent[text]) {
                            parent[text] = item;
                        } else {
                            item = parent[text];
                        }

                        if (Array.isArray(srcItem)) {
                            addValuesAndSort(srcItem, item._private.values);
                        } else {
                            dti.forEach(srcItem, function (subSource, subText) {
                                // Look for special keys and handle accordingly
                                if (subText === '_values') {
                                    return addValuesAndSort(subSource, item._private.values);
                                }
                                if (subText === '_valuesNoSort') {
                                    return addValues(subSource, item._private.values);
                                }

                                addObj(item, subSource, subText);
                            });
                        }
                    };

                if (!source) {
                    return dti.log('Source not found');
                }

                // If the new data is not the same type as our source
                if (Array.isArray(data) !== Array.isArray(source.data)) {
                    return dti.log('Invalid data');
                }

                if (Array.isArray(data)) {
                    addValuesAndSort(data, source.data, {
                        isTopLevel: true
                    });
                } else { // data must be an object
                    dti.forEach(data, function (item, text) {
                        addObj(source.data, item, text);
                    });
                }

                getMatches(cfg.$inputElement.val());
            };

            self.deleteData = function (sourceName) {
                var source = self.getSource(sourceName);

                if (!source) {
                    return dti.log('Source not found');
                }

                if (Array.isArray(source.data)) {
                    source.data = [];
                } else {
                    source.data = {};
                }

                getMatches(cfg.$inputElement.val());
            };

            self.show = function () {
                if (!self.bindings.isShown() && (self.numberOfMatches > 0)) {
                    if (cfg.autoselect) {
                        self.selectFirst();
                    }
                    self.reposition();
                    self.bindings.isShown(true);
                }
            };

            self.hide = function (clearInputValue) {
                self.bindings.isShown(false);
                self.selectNone();
                if (clearInputValue) {
                    cfg.$inputElement.val('');
                }
            };

            self.reposition = function () {
                var leftOffset = cfg.$inputElement.get(0).getBoundingClientRect().left;
                self.bindings.position.left(leftOffset + 'px');
                // $markup.position({
                //     my: 'left top',
                //     at: 'left bottom',
                //     of: cfg.$inputElement,
                // });
            };

            self.selectFirst = function () {
                return $container.find(selectors.match).first().addClass(cfg.classNames.selected);
            };

            self.selectLast = function () {
                return $container.find(selectors.match).last().addClass(cfg.classNames.selected);
            };

            self.selectNext = function () {
                var $selected = self.getSelected(),
                    $next = $selected.next(),
                    topOffset;

                if ($selected.length) {
                    self.selectNone($selected);
                    $next.addClass(cfg.classNames.selected);
                } else {
                    $next = self.selectFirst();
                }
                scrollTo($next);

                return $next;
            };

            self.selectPrevious = function () {
                var $selected = self.getSelected(),
                    $previous = $selected.prev();

                if ($selected.length) {
                    self.selectNone($selected);
                    $previous.addClass(cfg.classNames.selected);
                } else {
                    $previous = self.selectLast();
                }
                scrollTo($previous);

                return $previous;
            };

            self.selectNone = function ($selected) {
                if (!$selected) {
                    $selected = self.getSelected();
                }
                return $selected.removeClass(cfg.classNames.selected);
            };

            self.getSelected = function () {
                return $container.find(selectors.selected);
            };

            self.parse = function (str) {
                return parse(str);
            };

            self.numberOfMatches = 0;

            self.bindings = {
                isShown: ko.observable(false),
                sources: ko.observableArray([]),
                position: {
                    top: ko.observable('0px'),
                    left: ko.observable('0px')
                },
                selectMatch: function (data, e) {
                    var inputValue = cfg.$inputElement.val(),
                        operator = getOperator(inputValue);

                    if (data.text) {
                        if (operator) {
                            inputValue = inputValue.replace(new RegExp(operator + '.*'), operator + ' ' + data.text);
                        } else {
                            if (data.isTopLevel) {
                                inputValue = data.text;
                            } else {
                                inputValue = inputValue.slice(0, inputValue.lastIndexOf(cfg.chainCharacter)+1) + data.text;
                            }
                        }

                        cfg.$inputElement.val(inputValue);
                        cfg.$inputElement.focus();
                        self.hide();
                    }
                }
            };

            // Add autosuggest sources
            dti.forEachArray(cfg.sources, self.addSource);

            // Get autosuggest DOM template
            $markup = dti.utility.getTemplate('#autosuggestTemplate');

            // Change default class names if needed
            dti.forEach(defaults.classNames, function changeDefaultClassName (defaultClassName, key) {
                var defaultSelector = '.' + defaultClassName,
                    requestedClassName = cfg.classNames[key];

                if (requestedClassName !== defaultClassName) {
                    $markup.find(defaultSelector).removeClass(defaultClassName).addClass(requestedClassName);
                }
            });

            // Add autosuggest DOM to the document & apply bindings
            cfg.$resultsContainer.append($markup);
            ko.applyBindings(self.bindings, $markup[0]);

            // Cache the container
            $container = cfg.$resultsContainer.find(selectors.container);

            // Add event handlers
            cfg.$inputElement.keyup(handleKeyup);

            cfg.$inputElement.keydown(handleKeydown);

            cfg.$resultsContainer.click(function handleClick (e) {
                var $target = $(e.target);

                if (($target.is(cfg.$inputElement) === false) && ($target.parents(selectors.container).length) === 0) {
                    self.hide();
                }
            });

            if (cfg.$chips) {
                cfg.$chips.on('chip.delete', function (e, chip) {
                    self.reposition();
                });
            }
        }
    },
    globalSearchOld: {
        definitelyNotInit: function () {
            dti.globalSearch.$el = $('#search');
            dti.globalSearch.$resultsEl = $('#globalSearchResults');

            dti.globalSearch.rawResults = ['4250 AH5 DISP', '4200 PARKING LOT LIGHTS', 'AIR HANDLERS', 'MONTHLY REPORT'];

            // dti.globalSearch.results = new Bloodhound({
            //     datumTokenizer: Bloodhound.tokenizers.whitespace,
            //     queryTokenizer: Bloodhound.tokenizers.whitespace,
            //     local: dti.globalSearch.rawResults
            // });

            // // on keydown, take string and get results from bloodhound, replace string in results with span.searchHighlight, then populate dropdown and show if not shown already

            dti.globalSearch.$el.on('keyup', function showSearchResults () {
                dti.globalSearch.$resultsEl.css('display', 'block');
            });

            dti.globalSearch.$el.on('blur', function hideSearchResults () {
                dti.globalSearch.$resultsEl.css('display', 'none');
                dti.globalSearch.$el.val(null);
            });

            // dti.globalSearch.$el.typeahead({
            //     hint: true,
            //     highlight: true,
            //     minLength: 1
            // }, {
            //     name: 'Results',
            //     source: dti.globalSearch.results
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
    navigator: {
        _lastInit: true,
        _navigators: {},
        temporaryCallback: null,
        defaultClickHandler: function (pointInfo) {
            var endPoint = dti.utility.getEndpoint(pointInfo.pointType, pointInfo._id),
                name = [pointInfo.name1, pointInfo.name2, pointInfo.name3, pointInfo.name4].join(' '),
                group = dti.config.itemGroups[pointInfo.pointType],
                options = group && group.options || null;

            dti.windows.openWindow(endPoint.review.url, name, pointInfo.pointType, null, pointInfo._id, options);
        },
        handleNavigatorRowClick: function (pointInfo) {
            dti.navigator.hideNavigator();

            if (dti.navigator.temporaryCallback) {
                if (typeof dti.navigator.temporaryCallback === 'function') {
                    dti.navigator.temporaryCallback(pointInfo);
                    dti.navigator.temporaryCallback = null;
                }
                
            } else {
                dti.navigator.defaultClickHandler(pointInfo);
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
                    dti.navigator.temporaryCallback = config.callback;
                }

                if (config.pointType && config.property) {
                    config.pointTypes = dti.workspaceManager.config.Utility.pointTypes.getAllowedPointTypes(config.property, config.pointType);
                }
            }

            dti.navigator.commonNavigator.applyConfig(config);

            config.ready = dti.navigator.commonNavigator.bindings.handleModalOpen;

            dti.navigator.$commonNavigatorModal.openModal(config);
        },
        hideNavigator: function () {
            dti.navigator.$commonNavigatorModal.closeModal();
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
                    var pointTypes = $.extend(true, [], dti.utility.pointTypes),
                        bindings = {
                            name1: '',
                            name2: '',
                            name3: '',
                            name4: '',
                            showInactive: false,
                            showDeleted: false,
                            dropdownOpen: false,
                            restrictCreate: false,
                            fetchingPoints: false,
                            points: [],
                            mode: self.modes.DEFAULT,
                            deviceId: null,
                            remoteUnitId: null,
                            id: self.id,
                            disableCreatePoint: false,
                            loading: false,
                            focus: false
                        },
                        explodedPointTypes = [];

                    dti.forEachArray(pointTypes, function addSelectedToPointType(type) {
                        var subTypes = dti.utility.subPointTypes[type.key],
                            newType;

                        type.selected = true;
                        type.visible = true;

                        //process sub types if exist
                        if (subTypes) {
                            dti.forEachArray(subTypes, function buildSubType(subType) {
                                var newSubType = {
                                    key: type.key + ' (' + subType.name + ')',
                                    enum: subType.value,
                                    selected: false,
                                    visible: true,
                                    _type: type.key,
                                    _subType: subType.name
                                };

                                explodedPointTypes.push(newSubType);
                            });
                        } else {
                            newType = $.extend(true, {}, type);
                            newType.selected = false;
                            explodedPointTypes.push(newType);
                        }
                    });

                    bindings.pointTypes = pointTypes;
                    bindings._newPointType = explodedPointTypes[0];
                    bindings.newPointType = explodedPointTypes[0].key;
                    explodedPointTypes[0].selected = true;
                    bindings.explodedPointTypes = explodedPointTypes;

                    self.defaultConfig = bindings;

                    //build observable viewmodel so computeds have access to observables
                    bindings = ko.viewmodel.fromModel(bindings);

                    bindings.handleModalOpen = function () {
                        setTimeout(function focusInput () {
                            bindings.focus(true);
                        }, 100);
                    };

                    bindings.createPoint = function () {
                        // self.bindings.explodedPointTypes()[0].selected(true);
                        self.bindings.mode(self.modes.CREATE);
                    };

                    bindings.doCreatePoint = function () {
                        var filterProperties = ['name1', 'name2', 'name3', 'name4'],
                            newPointType = ko.toJS(bindings._newPointType),
                            parameters = {
                                pointType: newPointType._type || newPointType.key,
                                subType: newPointType._subType
                            };

                        if (bindings.allowCreatePoint()) {
                            bindings.disableCreatePoint(true);
                            bindings.loading(true);

                            dti.forEachArray(filterProperties, function buildFilterObj(prop) {
                                parameters[prop] = bindings[prop]();
                            });

                            self._createPointParameters = parameters;

                            $.ajax({
                                url: '/api/points/initpoint',
                                dataType: 'json',
                                type: 'post',
                                data: parameters
                            }).done(self.handleNewPoint);
                        }
                    };

                    bindings.doAcceptFilter = function () {
                        var filterProperties = ['name1', 'name2', 'name3', 'name4'],
                            filterObj = {
                                pointTypes: self.getFlatPointTypes(ko.toJS(bindings.pointTypes))
                            };

                        dti.forEachArray(filterProperties, function buildFilterObj(prop) {
                            filterObj[prop] = bindings[prop]();
                        });

                        // dti.log(ko.toJS(filterObj));
                        dti.navigator.handleNavigatorRowClick(filterObj);
                    };

                    bindings.togglePointTypeDropdown = function (obj, event) {
                        var dropdownShown = bindings.dropdownOpen();

                        if (!bindings.restrictCreate() || dropdownShown === true) {
                            bindings.dropdownOpen(!dropdownShown);
                        }

                        if (event) {
                            event.preventDefault();
                        }
                    };

                    bindings.pointTypeChanged = function () {
                        self.pointTypeChanged = true;
                        self.getPoints();
                    };

                    bindings.pointTypeInvert = function (type) {
                        self._pauseRequest = true;
                        self.applyPointTypes(type);
                        self._pauseRequest = false;
                        bindings.pointTypeChanged();
                    };

                    bindings.toggleAllPointTypes = function () {
                        var types = bindings.pointTypes();

                        self._pauseRequest = true;

                        dti.forEachArray(types, function doCheckPointType(type) {
                            if (type.visible()) {
                                type.selected(true);
                            }
                        });

                        self._pauseRequest = false;

                        bindings.pointTypeChanged();
                    };

                    bindings.handleNavigatorRowClick = function (navigator, event) {
                        var target = event && event.target,
                            point;

                        if (target) { //open window for main one, others just send the information
                            point = ko.dataFor(target);

                            point.name = [point.name1, point.name2, point.name3, point.name4].join(' ');
                            // dti.log('row click', point);

                            //handles click in an empty table...weird, I know
                            if (point !== self.bindings) {
                                //valid click
                                switch (bindings.mode()) {
                                    case self.modes.DEFAULT:
                                        dti.navigator.handleNavigatorRowClick(point);
                                        break;
                                    case self.modes.FILTER:
                                    case self.modes.CREATE:
                                        // dti.log(point);
                                        break;
                                }
                            }
                        }
                    };

                    bindings.clearNames = function () {
                        var c;

                        for (c = 1; c < 5; c++) {
                            bindings.clearBinding('name' + c);
                        }
                    };

                    bindings.clearBinding = function (binding) {
                        if (self.bindings[binding]) {
                            self.bindings[binding]('');
                        }
                    };

                    bindings.storePointType = function (object) {
                        bindings._newPointType = object;
                        // bindings.togglePointTypeDropdown(); issue #53
                        return true;
                    };

                    bindings.modalText = ko.pureComputed(function getModalText() {
                        var mode = bindings.mode(),
                            ret;

                        switch (mode) {
                            case self.modes.CREATE:
                                ret = 'Create Point';
                                break;
                            case self.modes.FILTER:
                                ret = 'Select Filter';
                                break;
                            case self.modes.DEFAULT:
                                ret = 'Select Point';
                                break;
                        }

                        return ret;
                    });

                    bindings.allowCreatePoint = ko.pureComputed(function shouldAllowCreatePoint() {
                        var uniqueName = bindings.points().length === 0,
                            disabled = bindings.disableCreatePoint(),
                            c,
                            tmpName,
                            noGaps = true,
                            hasValue = 0;

                        for (c = 4; c; c--) {
                            tmpName = bindings['name' + c]() || '';
                            if (hasValue) {
                                if (!tmpName.length) {
                                    noGaps = false;
                                }
                            } else {
                                if (tmpName.length) {
                                    hasValue = c;
                                }
                            }
                        }

                        return uniqueName && hasValue && noGaps && !disabled;
                    });

                    bindings.allTypesSelected = ko.pureComputed(function allPointTypesSelected() {
                        var currTypes = bindings.pointTypes(),
                            numChecked = 0;

                        dti.forEachArray(currTypes, function isTypeChecked(type) {
                            if (type.selected()) {
                                numChecked++;
                            }
                        });

                        return numChecked === currTypes.length;
                    });

                    bindings.allTypesSelected.extend({
                        rateLimit: 50
                    });

                    dti.forEachArray(bindings.pointTypes(), function initPointTypeSubscription(type) {
                        var pointTypeChangedInterceptor = function () {
                            if (!self._pauseRequest) {
                                bindings.pointTypeChanged.apply(this, arguments);
                            }
                        };

                        type.selected.subscribe(pointTypeChangedInterceptor);
                    });

                    bindings.nameHasChanged = ko.computed(function nameFilterChanged() {
                        var name1 = bindings.name1(),
                            name2 = bindings.name2(),
                            name3 = bindings.name3(),
                            name4 = bindings.name4();

                        if (!self._pauseRequest && self._loaded) {
                            self.getPoints();
                        }
                    });

                    bindings.optionsChanged = ko.computed(function optionsHaveChanged() {
                        var showInactive = bindings.showInactive(),
                            showDeleted = bindings.showDeleted();

                        if (!self._pauseRequest && self._loaded) {
                            self.getPoints();
                        }
                    });

                    bindings.pointTypeText = ko.pureComputed(function getPointTypeText() {
                        var currTypes = bindings.pointTypes(),
                            selectedTypes = [],
                            ret;

                        if (bindings.mode() === self.modes.CREATE) {
                            ret = bindings.newPointType();
                        } else {
                            dti.forEachArray(currTypes, function isTypeChecked(type) {
                                if (type.selected()) {
                                    selectedTypes.push(type.key());
                                }
                            });

                            if (selectedTypes.length === 1) {
                                ret = selectedTypes[0];
                            } else {
                                ret = (selectedTypes.length === currTypes.length ? 'All' : selectedTypes.length) + ' Point Types';
                            }
                        }

                        return ret;
                    });

                    return bindings;
                };

            $.extend(self, config);

            self.modes = {
                CREATE: 'create',
                FILTER: 'filter',
                DEFAULT: 'default'
            };

            // if (self.$modal) {
            //     self.$footer = self.$modal.find('.modal-footer');
            // }

            self.id = dti.makeId();

            self.bindings = getBindings();

            self.applyPointTypes = function (types, exclusive) {
                self._pauseRequest = true;
                if (types && types.length > 0) {
                    dti.forEachArray(self.bindings.pointTypes(), function isPointTypeChecked (type) {
                        var isFound = types.indexOf(type.key()) > -1;

                        if (exclusive) {
                            type.visible(isFound);
                        } else {
                            type.visible(true);
                        }
                       
                        type.selected(isFound);
                    });
                }
                self._pauseRequest = false;
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

            self.getPointTypeByName = function (type) {
                var ret;

                dti.forEachArray(self.bindings.explodedPointTypes(), function findExplodedPointType (explodedType) {
                    if (explodedType.key() === type) {
                        ret = ko.toJS(explodedType);
                        return false;
                    }
                });

                return ret;
            };

            self.applyConfig = function (cfg) {
                var defaultConfig = $.extend({}, self.defaultConfig),
                    config = $.extend(defaultConfig, cfg || {}),
                    propertiesToApply = ['showInactive', 'showDeleted', 'mode', 'deviceId', 'remoteUnitId', 'loading'];

                if (cfg.pointType && !cfg.pointTypes && cfg.pointType !== 'Point') {
                    config.pointTypes = [cfg.pointType];
                }

                if (cfg.mode === 'create' && cfg.pointType) {
                    cfg.newPointType = cfg.pointType;
                    self.bindings.restrictCreate(true);
                } else {
                    self.bindings.restrictCreate(false);
                }

                if (cfg.newPointType !== 'Point' && cfg.newPointType) { //skip this for 'Point' placeholder
                    config._newPointType = self.getPointTypeByName(cfg.newPointType);
                    ko.viewmodel.updateFromModel(self.bindings._newPointType, config._newPointType);
                    self.bindings.newPointType(cfg.newPointType);
                }

                config.pointTypes = self.getFlatPointTypes(config.pointTypes);

                self.applyPointTypes(config.pointTypes);

                if (!config.retainNames) {
                    self.applyPointNames(config);
                }

                dti.forEachArray(propertiesToApply, function applyProperty (prop) {
                    self.bindings[prop](config[prop]);
                });

                self.getPoints();
            };

            self.handleDataReturn = function (response) {
                self.bindings.points(response);
                self._request = null;
                self._pauseRequest = false;
                setTimeout(function doHideLoadingBar () {
                    self.bindings.fetchingPoints(false);
                }, 250);
                // dti.log(response);
            };

            self.handleNewPoint = function (data) {
                self.bindings.disableCreatePoint(false);
                if (data.err) {
                    dti.log(data.err);
                } else {

                    var params = self._createPointParameters,
                        endPoint = dti.workspaceManager.config.Utility.pointTypes.getUIEndpoint(params.pointType, data._id),
                        handoffMode = endPoint.edit || endPoint.review;

                    if (dti.navigator.temporaryCallback) {
                        dti.navigator.hideNavigator();
                        dti.navigator.temporaryCallback(data);
                    } else {
                        dti.windows.openWindow({
                            url: handoffMode.url,
                            title: data.Name,
                            pointType: params.pointType,
                            upi: data._id,
                            options: {
                                height: 750,
                                width: 1250
                            }
                        });
                    }
                }
            };

            self.getFlatPointTypes = function (pointTypes) {
                var ret = [];

                dti.forEachArray(pointTypes, function flattenPointType (type) {
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

                dti.forEach(parameters, function checkParameter (val, key) {
                    if (Array.isArray(val)) {
                        same = dti.arrayEquals(val, self.lastParameters[key]);
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
                        deviceId: bindings.deviceId,
                        remoteUnitId: bindings.remoteUnitId,
                        name1: bindings.name1,
                        name2: bindings.name2,
                        name3: bindings.name3,
                        name4: bindings.name4
                    },
                    now = new Date(),
                    fetchDelay = 500,
                    tmpId = dti.makeId(),
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

            dti.events.bodyClick(function checkNavigatorOpenMenu (event, $target) {
                var buttonClass = 'pointTypeDropdownButton';

                if (self.bindings.dropdownOpen() && $target.parents('.dropdown-content').length === 0 && !$target.hasClass(buttonClass) && $target.closest('.' + buttonClass).length === 0) {
                    self.bindings.dropdownOpen(false);
                }
            });

            self._loaded = true;

            self.getPoints();

            ko.applyBindings(self.bindings, self.$container[0]);

            // self.$container.find('select').material_select();
        },
        createNavigator: function (isModal) {
            var templateMarkup = dti.utility.getTemplate('#navigatorTemplate'),
                navigatorMarkup,
                navigator,
                $container = (isModal === true) ? $('main') : (isModal.$container || isModal);

            if (isModal === true) {
                navigatorModalMarkup = dti.utility.getTemplate('#navigatorModalTemplate');
                $container.append(navigatorModalMarkup);
                $container = navigatorModalMarkup;
                dti.navigator.$commonNavigatorModal = $container;
                $container.find('.modal-content').append(templateMarkup);
            } else {
                $container.append(templateMarkup);

            }

            navigator = new dti.navigator.Navigator({
                $container: $container
            });

            if (!!isModal && isModal !== true) {
                isModal.onActive.subscribe(navigator.bindings.handleModalOpen);
            }

            $container.data('navigatorId', navigator.id);

            dti.navigator._navigators[navigator.id] = navigator;

            // Materialize.updateTextFields();

            return navigator;
        },
        init: function () {
            dti.navigator.commonNavigator = dti.navigator.createNavigator(true);
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
        clone: function (toCopy) {
            var ret,
                copyArray = function () {
                    ret = $.extend(true, [], toCopy);
                },
                copyObject = function () {
                    if (Array.isArray(toCopy)) {
                        copyArray();
                    } else {
                        ret = $.extend(true, {}, toCopy);
                    }
                },
                basic = function () {
                    ret = toCopy;
                };

            switch (typeof toCopy) {
                case 'object':
                    copyObject();
                    break;
                default:
                    basic();
                    break;
            }

            return ret;
        },
        getTemplate: function (id) {
            var markup = $(id).html();

            return $(markup);
        },
        getPathFromObject: function (path, obj) {
            var explodedPath = path.split('.'),
                result = obj;

            dti.forEachArray(explodedPath, function processPathSegment (segment) {
                result = result[segment];
            });

            return result;
        },
        getConfig: function (path, parameters) {
            var Config = dti.workspaceManager.config,
                result = dti.utility.getPathFromObject(path, Config);

            if (parameters) {
                result = result.apply(this, parameters);
            }

            return dti.utility.clone(result);
        },
        getEndpoint: function (type, id) {
            return dti.workspaceManager.config.Utility.pointTypes.getUIEndpoint(type, id);
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
                url: dti.settings.apiEndpoint + 'system/' + enumType,
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

                    dti.utility.systemEnums[enumType] = _array;
                    dti.utility.systemEnumObjects[enumType] = _object;
                    if (callback) callback(_array);
                }
            ).fail(
                function getSystemEnumFail (jqXHR, textStatus) {
                    dti.log('Get system enum (' + enumType + ') failed', jqXHR, textStatus);
                    // Set an empty array/object for code looking @ systemEnums[enumType]
                    // TODO Try again or alert the user and stop
                    dti.utility.systemEnums[enumType] = [];
                    dti.utility.systemEnumObjects[enumType] = {};
                }
            );
        },
        refreshUserCtlr: function (data) {
            // This routine adds the user's controller ID to the user object
            // Parms: data is the received array of controllers
            var user = dti.bindings.user(),
                controller = ko.utils.arrayFilter(data, function filterControllerUser (ctrl) {
                    return ctrl.name === user.username;
                });

            if (controller.length) {
                user.controllerId = controller[0].value;
                dti.bindings.user(user);
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
            dti.utility.pointTypeLookup = {};
            dti.utility.pointTypes = dti.workspaceManager.config.Utility.pointTypes.getAllowedPointTypes();
            dti.utility.subPointTypes = {};

            dti.forEachArray(dti.utility.pointTypes, function checkForSubPointType (type) { 
                var ret = dti.workspaceManager.config.Utility.pointTypes.getEnums(type.key + ' Types', type.key); 

                if (ret) {
                    dti.utility.subPointTypes[type.key] = ret;
                }
            });

            dti.forEachArray(dti.utility.pointTypes, function processPointType (type) {
                dti.utility.pointTypeLookup[type.key] = type;
            });

            dti.utility.getSystemEnum('controlpriorities');
            dti.utility.getSystemEnum('qualityCodes');
            dti.utility.getSystemEnum('telemetry');
            dti.utility.getSystemEnum('controllers', dti.utility.refreshUserCtlr);
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
                dti.messaging.processMessage(e);
            });

            store.set('sessionId', dti.settings.sessionId);

            $('#testLink').on('click', function clickTestLink (event) {
                store.set('startupCommands', true);
            });

            dti.on('loaded', function checkStartupCommands () {
                var commands = store.get('startupCommands');

                if (commands) {
                    dti.windows.create({
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

            dti.messaging.onMessage(dti.messaging.processMessage);
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
                                dti.messaging.sendMessage({
                                    key: sourceWindowId, 
                                    message: 'pointSelected',
                                    value: data
                                });
                            };

                        config.callback = callback;

                        dti.navigator.showNavigator(config);
                    },
                    showCreatePoint: function () {
                        var sourceWindowId = config._windowId,
                            callback = function (data) {
                                dti.messaging.sendMessage({
                                    key: sourceWindowId, 
                                    message: 'pointCreated',
                                    value: data
                                });
                            };

                        config.callback = callback;
                        config.mode = 'create';

                        dti.navigator.showNavigator(config);
                    },
                    windowMessage: function () {
                        dti.windows.sendMessage(config);
                    },
                    openWindow: function () {
                        dti.workspaceManager.openWindow(config);
                    },
                    closeWindow: function () {
                        var windowId = config._windowId;

                        dti.windows.closeWindow(windowId);
                    },
                    getConfig: function () {
                        var path = config.path,
                            parameters = config.parameters,
                            ret,
                            winId = config._windowId;

                        ret = dti.utility.getConfig(path, parameters);

                        dti.messaging.sendMessage({
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
                    dti.navigator._prevMessage = config;
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

            dti.messaging.doProcessMessage(message);

            // dti.forEachArray(dti.messaging._messageCallbacks, function (cb) {
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
            dti.messaging._messageCallbacks.push(cb);
        }
    },
    bindings: {
        user: ko.observable(window.userData || {}),
        openWindows: {},
        windowGroups: ko.observableArray([]), // Pinned items prepopulate this array
        startMenuItems: ko.observableArray([]),
        windowsHidden: ko.observable(false),
        taskbarShown: ko.observable(true),
        hasAccess: function (obj) {
            var cfg = ko.toJS(obj.value);

            return !cfg.adminOnly || dti.workspaceManager.user()['System Admin'].Value === true;
        },
        // showNavigator: function () {
        //     dti.navigator.showNavigator();
        // },
        globalSearch: {
            gettingData: ko.observable(false),
            showSummary: ko.observable(false),
            showLoadMoreResultsButton: ko.observable(false),
            showError: ko.observable(false),
            errorMessage: ko.observable(''),
            searchResults: ko.observableArray([]),
            count: ko.observable(0),
            show: function () {
                dti.globalSearch.show();
            },
            hide: function (viewModel, e) {
                // Hide the tooltip associated with the close button
                $('#' + $(e.target).data('tooltipId')).css('display', 'none');
                // Hide search
                dti.globalSearch.hide();
            },
            doSearch: function (appendResults) {
                dti.globalSearch.doSearch(appendResults);
            },
            openPoint: function (data) {
                dti.globalSearch.openPoint(data);
            }
        },
        closeAllWindows: function () {
            dti.windows.closeAll();
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
                var alarmBindings = dti.bindings.alarms,
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
                var unacknowledgedAlarms = dti.bindings.alarms.unacknowledged;

                // If the hover menu isn't shown, remove the row without animation
                if (dti.alarms.hoverMenu.isOpen() === false) {
                    $(element).remove();
                    unacknowledgedAlarms.showList(!!unacknowledgedAlarms.count());
                    return;
                }

                dti.animations.slideUp($(element), function updateAlarmList () {
                    // Remove the alarm from the DOM (it has already been removed from the observable 
                    // array - see socket handler "removingUnackAlarm" defined in dti.alarms.init)
                    $(element).remove();

                    if (unacknowledgedAlarms.count() === 0) {
                        // Short delay before hiding the list (just for UI - otherwise it felt choppy)
                        window.setTimeout(function () {
                            // Use the count variable instead of blindly hiding the list in case the count changed while we were away
                            unacknowledgedAlarms.showList(!!unacknowledgedAlarms.count());
                        }, 300);
                    }
                    
                    // FUTURE use
                    // var recentlyAcknowledgedList = dti.bindings.alarms.recentlyAcknowledged.list();
                    // // Add the removed alarm to our recently acknowledged list
                    // recentlyAcknowledgedList.unshift(alarm);
                    // // If our recent list has outgrown itself
                    // if (recentlyAcknowledgedList.length > dti.bindings.alarms.constants.BUFFER_MIN) {
                    //     // Remove the last entry
                    //     recentlyAcknowledgedList.pop();
                    // }
                    // // Notify depdendencies
                    // dti.bindings.alarms.recentlyAcknowledged.list.valueHasMutated();
                });
            },
            acknowledgeOne: function (alarm) {
                dti.alarms.sendAcknowledge([alarm]);
            }
        },
        closeWindows: function (group) {
            dti.windows.closeAll(group);
        },
        taskbarButtonClick: function (object) {
            dti.fire('hideMenus');
            if (object.singleton()) {
                dti.bindings.startMenuClick(object);
            } else {
                dti.bindings.showNavigator(object.group());
            }
        },
        showNavigator: function (group, isStartMenu) {
            dti.navigator.showNavigator(group);
            // dti.navigator.showNavigator(group, isStartMenu);
        },
        showCreatePoint: function (group) {
            dti.navigator.showNavigator({
                mode: 'create',
                pointType: group.group()
            });
        },
        startMenuClick: function (obj) {
            dti.fire('hideMenus');
            dti.startMenu.handleClick(obj);
        },
        handleCardClick: function (obj, e) {
            //only close menus on 'open'.  keeps modals open when closing individual windows
            if ($(e.target).hasClass('closeIcon')) {
                obj.close();
            } else {
                dti.fire('hideMenus');
                obj.activate();
            }
        },
        showDesktop: function () {
            dti.windows.showDesktop();
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
                    var upi = ko.unwrap(valueAccessor()),
                        thumbnailFound = viewModel.thumbnailFound,
                        $element = $(element),
                        $bg = $element.parent(),
                        currThumb = dti.thumbs[upi],
                        bg,
                        img;

                    if (upi !== undefined && upi !== null) {
                        if (currThumb === undefined || currThumb === false) {
                            // dti.log('No thumb for upi', upi);
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

                                        // dti.log('Saving thumb for upi', upi);

                                        dti.thumbs[upi] = {
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
                                        dti.thumbs[upi] = false;
                                        thumbnailFound(false);
                                        // $icon.show();
                                    }
                                );
                        } else {
                            // dti.log('Using existing thumb for', upi);
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
                        menuId = dti.makeId(),
                        buttonId = $element.attr('id'),
                        hoverMenu;

                    if (!buttonId) {
                        buttonId = dti.makeId();
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

                        hoverMenu = dti.events.hoverMenu('#' + buttonId, menuId);
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
                        dti.navigator.showNavigator(type,  true);
                    });
                }
            };

            ko.bindingHandlers.contextMenuInvert = {
                init: function (element, valueAccessor) {
                    var $element = $(element),
                        handler = valueAccessor();

                    $element.contextmenu(function handleRightClick (event) {
                        var $target = $(event.target),
                            $li = $target.is('li') ? $target : $target.parents('li'),
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

                    dti.forEachArray(list, function addItemToSelect(item) {
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

                    dti.forEachArray(list, function syncDropdownStatus (item, idx) {
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


            ko.bindingHandlers.fadeVisible = {
                init: function (element, valueAccessor) {
                    // Initially set the element to be instantly visible/hidden depending on the value
                    var value = valueAccessor();
                    $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
                },
                update: function (element, valueAccessor) {
                    // Whenever the value subsequently changes, slowly fade the element in or out
                    var value = valueAccessor(),
                        $element = $(element);

                    if (ko.unwrap(value)) {
                        dti.animations.fadeIn($element);
                    } else {
                        dti.animations.fadeOut($element);
                    }
                }
            };

            ko.applyBindings(dti.bindings);
            //needed for prefilled text input labels to not overlap
            Materialize.updateTextFields();
        }
    },
    authentication: {
        logIn: function (username, password) {
            $.ajax({
                url: dti.settings.webEndpoint + '/authenticate',
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
                    dti.$loginBtn.removeAttr('disabled');

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
                        dti.bindings.user(data);
                        // _local.login.setupAutoLogout(window.userData);
                        // sessionId = base64.encode(new Date().getTime().toString().split('').reverse().join(''));
                        // store.set('sessionId', sessionId);
                        dti.init();
                    }
                }
            );
        }
    },
    audio: {
        sounds: {
            chime: 'data:audio/wav;base64,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Kaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+pIARINcD/AAAGkHAAAAAAANIOAAAAAAAaQAAAAAAAA0gAAAAKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
        },
        play: function (sound) {
            sound = dti.audio.sounds[sound];
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
                dti.animations.fadeIn($('main, header'), function startInitFlow () {
                    dti.forEach(dti, function dtiInit (val, key) {
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
                                dti.on('loaded', val.initOnLoad);
                            }
                        }
                    });

                    dti.forEachArray(lastInits, function runFinalInits (val) {
                        val.fn();
                    });

                    $('select:not(.select-processed').material_select();

                    complete();
                });
            },
            complete = function () {
                setTimeout(function doLoginFadeout () {
                    dti.fire('loaded');
                    dti.animations.fadeOut($('#loading'), function afterLoadFadeOut () {
                        dti.log('Load time:', (new Date() - dti.startLoad)/1000, 'seconds');
                    });
                }, 1500);
            },
            showLoading = function () {
                dti.animations.fadeIn($('#loading'), runInits);
            };

        dti.animations.fadeOut($('#login'), showLoading);
    }
};

$(function initWorkspaceV2 () {
    dti.startLoad = new Date();
    dti.socket = io.connect(dti.settings.socketEndPoint);
    dti.socket.on('disconnect', function (err) {
        dti.log('server offline, disconnecting');
        dti.socket.disconnect();
    });

    dti.$loginBtn.click(function validateLogin (event) {
        var user = $('#username').val(),
            pw = $('#password').val();

        dti.$loginBtn.attr('disabled', 'disabled');
        dti.authentication.logIn(user, pw);
    });

    if (window.isAuthenticated) {
        dti.init();
        return;
    }

    dti.animations.fadeIn($('#login'));
            
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

dti.workspaceManager = window.workspaceManager = {
    openWindowPositioned: dti.windows.openWindow,
    openWindow: dti.windows.openWindow,
    config: window.Config,
    systemEnums: dti.utility.systemEnums,
    systemEnumObjects: dti.utility.systemEnumObjects,
    socket: function () {
        return dti.socket;
    },
    sessionId: function () {
        return store.get('sessionId');
    },
    user: function () {
        return JSON.parse(JSON.stringify(dti.bindings.user()));
    },
    captureThumbnail: function () {
        dti.thumbnails.capture.apply(this, arguments);
    }
};
