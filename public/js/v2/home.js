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
                singleton: false
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
                singleton: false
            },
            'Activity Log': {
                title: 'Activity Logs',
                iconText: '',
                iconClass: 'mdi mdi-comment-multiple-outline',
                group: 'Activity Log',
                standalone: true,
                url: '/activityLogs',
                singleton: false
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
                    // left: 200,
                    // top: 200
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
        dti.itemIdx++;
        return dti.settings.idxPrefix + dti.itemIdx;
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
            formattedTime = dti.formatDate(new Date(), true);

        if (dti.settings.logLinePrefix === true) {
            err = new Error();
            if (Error.captureStackTrace) {
                Error.captureStackTrace(err);

                stack = err.stack.split('\n')[2];

                steps = stack.split(':');

                lineNumber = steps[2];

                args.unshift('line:' + pad(lineNumber), formattedTime);
            }
        }
        // args.unshift(formattedTime);
        if (!dti.noLog) {
            console.log.apply(console, args);
        }
    },
    on: function (event, handler) {
        dti.events[event] = dti.events[event] || [];
        dti.events[event].push(handler);
    },
    fire: function (event, obj1, obj2) {
        var c,
            handlers = dti.events[event] || [],
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

            dti.events.bodyClick(function checkOpenMenu (event) {
                if (isOpen && $(event.target).parents(menuEl).length === 0) {
                    isOpen = false;
                    dti.animations.fadeOut($menuEl);
                }
            });

            dti.on('hideMenus', function hideMenu () {
                isOpen = false;
                dti.animations.fadeOut($menuEl);
            });
        },
        hoverMenu: function (button, menuEl) {
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
                            dti.animations.fadeOut($menu);
                        }
                    }
                },
                setOpen = function () {
                    menuShown = true;
                },
                setTimer = function () {
                    // clearTimeout(hideTimer);
                    hideTimer = setTimeout(closeMenu, hoverDelay);
                };

            $button.hover(function showHoverMenu (event) {
                dti.fire('openMenu', menuID);
                clearTimeout(hideTimer);
                if (!menuShown) {
                    menuShown = true;
                    dti.animations.fadeIn($menu);
                }
            }, function hideHoverMenu (event) {
                var $relatedTarget = $(event.relatedTarget);

                if ($relatedTarget.attr('id') !== menuID && $relatedTarget.parents('#' + menuID).length === 0) {
                    setTimer();
                }
            });

            $('#' + menuID).hover(function maintainHoverMenu () {
                clearTimeout(hideTimer);
                menuShown = true;
            }, function hideHoverMenu (event) {
                var $target = $(event.relatedTarget);

                if (($target.parents(button).length === 0) && ($target.attr('id')) !== 'context-menu-layer') {
                    setTimer();
                }
            });

            dti.events.bodyClick(function closeHoverMenus (event) {
                var $target = $(event.target),
                    notMenuClick = !$target.closest('#' + menuID).length,
                    notButtonClick = !$target.closest(button).length;

                if (menuShown && notMenuClick && notButtonClick) {
                    closeMenu();
                }
            });

            dti.on('hideMenus', closeMenu);

            dti.on('openMenu', closeMenu);
        }
    },
    Window: function (config) {
        var windowId = config.id || dti.makeId(),
            iframeId = dti.makeId(),
            active = false,
            group,
            prepMeasurement = function (x) {
                if (typeof x === 'string') {
                    return x;
                }

                if (x !== undefined) {
                    return x + 'px';
                }
            },
            prepMeasurements = function () {
                var obj = {
                    left: ko.observable(prepMeasurement(config.left)),
                    top: ko.observable(prepMeasurement(config.top))
                };

                // if (config.right !== undefined) {
                    obj.right = ko.observable(prepMeasurement(config.right));
                    // obj.width = ko.observable(null);
                // } else {
                    obj.width = ko.observable(prepMeasurement(config.width || 800));
                    // obj.right = ko.observable(null);
                // }

                if (config.bottom !== undefined) {
                    obj.bottom = ko.observable(prepMeasurement(config.bottom));
                    obj.height = ko.observable(null);
                } else {
                    obj.height = ko.observable(prepMeasurement(config.height || 600));
                    obj.bottom = ko.observable(null);
                }

                self.bindings = $.extend(self.bindings, obj);                        
            },
            getGroupName = function (config) {
                var groupName = dti.taskbar.getWindowGroupName(config.type);

                if (config.exempt) {
                    return '';
                }

                return groupName;
            },
            close = function (event) {
                self.bindings.minimize();
                dti.bindings.openWindows[self.bindings.group()].remove(self.bindings);
                self.$iframe.attr('src', 'about:blank');

                dti.fire('closeWindow', self);

                setTimeout(function closeWindow () {
                    self.$windowEl.remove();
                }, 100);
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
            activate = function (fromManager) {
                if (!active || fromManager === false) {
                    active = true;
                    if (fromManager !== true) {
                        dti.windows.activate(windowId);
                    }
                    self.bindings.minimized(false);
                    self.bindings.active(true);
                }
            },
            self = {
                $windowEl: $($('#windowTemplate').html()),
                $iframe: null,
                bindings: {
                    title: ko.observable(config.title),
                    windowId: ko.observable(windowId),
                    group: ko.observable(getGroupName(config)),
                    url: config.url,
                    upi: ko.observable(config.upi),
                    activate: activate,
                    minimize: minimize,
                    minimized: ko.observable(false),
                    close: close,
                    iconClass: ko.observable(),
                    iconText: ko.observable(),
                    thumbnail: ko.observable(false),
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
                            self.bindings.title(message.title);
                        }
                    };

                    if (callbacks[message.action]) {
                        callbacks[message.action]();
                    }
                },
                onLoad: function (event) {
                    // var group = this.contentWindow.pointType;
                    // self.bindings.group(group);

                    if (config.onLoad) {
                        config.onLoad.call(self);
                    }

                    if (this.contentWindow.point) {
                        if (self.bindings.upi() === undefined) {
                            self.bindings.upi(this.contentWindow.point._id);
                        }
                    }

                    $(this.contentDocument).on('click', function handleIframeClick(event) {
                        self.bindings.activate();
                    });

                    this.contentWindow.windowId = self.bindings.windowId();
                },
                getGroup: function () {
                    //if point type app, get point type.  if not, check route?
                }
            };

        prepMeasurements();

        $('main').append(self.$windowEl);
        self.$windowEl.attr('id', windowId);
        self.$iframe = self.$windowEl.children('iframe');
        self.$iframe.attr('id', iframeId);

        dti.utility.addEvent(self.$iframe[0], 'load', self.onLoad);

        if (config.upi !== undefined && typeof config.upi === 'number') {
            self.bindings.upi(config.upi);
        }

        group = dti.taskbar.getWindowGroup(config.type);
        self.bindings.iconClass(group.iconClass);
        self.bindings.iconText(group.iconText);
        self.bindings.thumbnail(group.thumbnail || false);

        //detect clicks inside iframe
        // setInterval(function detectIframeClick () {
        //     var elem = document.activeElement;
        //     if (elem && elem.id === iframeId) {
        //         self.bindings.activate();
        //     }
        // }, 100);

        ko.applyBindings(self.bindings, self.$windowEl[0]);

        return {
            minimize: minimize,
            close: close,
            deactivate: deactivate,
            activate: activate,
            $el: self.$windowEl,
            windowId: windowId,
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
        _draggableConfig: {
            containment: 'main',
            scroll: false
        },
        _resizableConfig: {
            // helper: 'ui-resizable-helper',
            containment: 'main'
        },
        _windowList: [],
        init: function () {
            dti.windows.elementSelector = '.dti-card-panel';//'.card, .card-panel';
            dti.windows.$elements = $(dti.windows.elementSelector);

            dti.windows.$elements.draggable(dti.windows._draggableConfig);

            dti.windows.$elements.resizable(dti.windows._resizableConfig);
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

            dti.forEachArray(dti.windows._windowList, function checkForTargetWindow (win) {
                if (win.windowId === winId) {
                    targetWindow = win;
                    return false;
                }
            });

            targetWindow.handleMessage(e);
        },
        create: function (config) {
            var newWindow;

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

            newWindow.$el.draggable(dti.windows._draggableConfig);
            newWindow.$el.resizable(dti.windows._resizableConfig);

            dti.windows._windowList.push(newWindow);

            if (!config.isHidden) {
                dti.windows.activate(newWindow.windowId);
            }

            return newWindow;
        },
        openWindow: function (url, title, type, target, uniqueId, options) {
            dti.utility.hideNavigator();
            dti.windows.create({
                url: url,
                title: title,
                type: type,
                upi: uniqueId,
                options: options
            });
        },
        getWindowsByType: function (type) {
            var openWindows = dti.bindings.openWindows[type];

            return (openWindows && openWindows()) || [];
        },
        closeAll: function (group) {
            var openWindows = dti.bindings.openWindows[group];

            if (openWindows) {
                openWindows = openWindows();
            }

            dti.forEachArrayRev(openWindows, function (win) {
                win.close();
            });
        },
        activate: function (target) {
            dti.fire('hideMenus');

            dti.forEachArray(dti.windows._windowList, function processWindowActivate (win) {
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
            dti.forEachArray(dti.windows._windowList, function deactivateOnShowDesktop (win) {
                win.minimize(null, true);
            });
        }
    },
    taskbar: {
        pinnedItems: ['Display'],
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
                    dti.bindings.windowGroups.remove(function removeWindowGroup (item) {
                        return item.group() === group && item.pinned() === false;
                    });
                }
            });

            // dti.bindings.windowGroups(pinnedItems);
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

            $('body').mousedown(function handleBodyMouseDown(event) {
                dti.forEachArray(dti.events._bodyClickHandlers, function bodyMouseDownHandler(handler) {
                    handler(event);
                });
            });

            $('#openItems').click(function showOpenItems () {
                $('#modal2').openModal();
            });

            dti.events.hoverMenu('.startButtonContainer', 'startmenu');

            dti.events.clickMenu('#globalSearch', '#searchBox', {
                before: function () {
                    $('#searchBox input').focus();
                }
            });

            dti.events.hoverMenu('#alarmIcon');
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
                    dti.windows.openWindow(obj.url + '?' + id, obj.title, obj.group, null, null, obj.options);
                };

            if (!obj.standalone) {
                dti.settings._workspaceNav = true;
                dti.bindings.showNavigator(obj.group, true);
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
            // dti.on('loaded', function () {
            // });
        }
    },
    globalSearch: {
        init: function () {
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
    utility: {
        $navigatorModalIframe: $('#navigatorModal iframe'),
        $navigatorFilterModalIframe: $('#navigatorFilterModal iframe'),
        $navigatorModal: $('#navigatorModal'),
        $navigatorFilterModal: $('#navigatorFilterModal'),
        systemEnums: {},
        systemEnumObjects: {},
        addEvent: function (element, event, fn) {
            if (element.addEventListener) {
                element.addEventListener(event, fn, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + event, fn);
            }
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
        applyNavigatorFilter: function (pointType, pointLookup, isStartMenu) {
            var types,
                processedTypes = [];

            if (pointType && pointType !== 'Point') {
                if (!Array.isArray(pointType)) {
                    types = [pointType];
                } else {
                    types = pointType;
                }
            } else {
                types = ['all'];
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
            var filter = dti.utility._currNavigatorFilter,
                message = dti.utility._navigatorMessage;

            dti.storage.sendMessage({
                key: message._windowId,
                value: {
                    action: 'pointFilterSelected',
                    filter: filter
                }
            });
        },
        showNavigator: function (pointType, isStartMenu) {
            dti.fire('hideMenus');
            dti.utility.showNavigatorModal(pointType, isStartMenu);
        },
        hideNavigator: function () {
            if (dti._navigatorWindow) {
                dti._navigatorWindow.bindings.minimized(true);
            }
        },
        showNavigatorFilterModal: function (pointType, initial) {
            var $el = dti.utility.$navigatorFilterModalIframe[0],
                initModalLookup = function () {
                    var navigatorFilterInterval;

                    navigatorFilterInterval = setInterval(function initNavigatorFilter () {
                        if ($el.contentWindow.pointLookup && $el.contentWindow.pointLookup.init) {
                            clearInterval(navigatorFilterInterval);
                            dti._navigatorFilterModal = true;
                            $el.contentWindow.pointLookup.init(dti.utility.navigatorModalCallback, {
                                name1: '',
                                name2: '',
                                name3: '',
                                name4: '',
                                pointTypes: []
                            });

                            dti.fire('modalLoaded');
                        }
                    }, 500);
                };

            if (initial) {
                dti.utility.addEvent($el, 'load', initModalLookup);
            } else {
                dti.fire('hideMenus');
                dti.utility.$navigatorFilterModal.openModal();
            }
        },
        showNavigatorModal: function (pointType, isStartMenu, initial) {
            var loaded = false,
                $el = dti.utility.$navigatorModalIframe[0],
                applyFilter = function () {
                    dti.utility.applyNavigatorFilter(pointType, $el.contentWindow.pointLookup, isStartMenu);
                },
                initModalLookup = function () {
                    var navigatorInterval;

                    navigatorInterval = setInterval(function initNavigator () {
                        if ($el.contentWindow.pointLookup && $el.contentWindow.pointLookup.init) {
                            clearInterval(navigatorInterval);
                            dti._navigatorModal = true;
                            $el.contentWindow.pointLookup.init(dti.utility.navigatorModalCallback);
                            applyFilter();
                            dti.fire('modalLoaded');
                        }
                    }, 400);
                };

            if (initial) {
                dti.utility.addEvent($el, 'load', initModalLookup);
            } else {
                dti.fire('hideMenus');

                dti.utility.$navigatorModal.openModal({
                    ready: function () {
                        if (!dti._navigatorModal) {
                            dti._navigatorModal = true;

                            initModalLookup.call($el);
                        } else {
                            applyFilter();
                        }
                    },
                    complete: function () {
                        dti.settings._workspaceNav = false;
                    }
                });
            }
        },
        navigatorModalCallback: function (filter) {
            dti.utility._currNavigatorFilter = filter;
        },
        processMessage: function (e) {
            var config,
                ignoredProps = {
                    '__storejs__': true
                },
                callbacks = {
                    navigatormodal: function () {
                        // key: navigatormodal, oldValue: windowId of recipient to send info to
                        if (config.action === 'open') {
                            dti.utility._navigatorMessage = config;
                            dti.utility.showNavigatorModal();
                        }
                    },
                    navigatorfiltermodal: function () {
                        if (config.action === 'open') {
                            dti.utility._navigatorMessage = config;
                            dti.utility.showNavigatorFilterModal();
                        }
                    },
                    windowMessage: function () {
                        dti.windows.sendMessage(config);
                    },
                    pointSelected: function () {

                    },
                    pointFilterSelected: function () {

                    }
                };

            if (!ignoredProps[e.key]) {
                config = e.newValue;
                if (typeof config === 'string') {
                    config = JSON.parse(config);
                }

                if (callbacks[e.key]) { 
                    // store previous call
                    dti.utility._prevMessage = config;
                    callbacks[e.key]();
                }
            }
        },
        init: function () {
            dti.utility.$navigatorModalIframe.attr('src', '/pointlookup');
            dti.utility.$navigatorFilterModalIframe.attr('src', '/pointlookup?mode=filter');
            dti.utility.pointTypeLookup = {};
            dti.utility.pointTypes = dti.workspaceManager.config.Utility.pointTypes.getAllowedPointTypes();

            dti.utility.showNavigatorModal(null, null, true);
            dti.utility.showNavigatorFilterModal(null, true);

            dti.forEachArray(dti.utility.pointTypes, function processPointType (type) {
                dti.utility.pointTypeLookup[type.key] = type;
            });

            dti.utility.getSystemEnum('controlpriorities');
            dti.utility.getSystemEnum('qualityCodes');
            dti.utility.getSystemEnum('telemetry');
            dti.utility.getSystemEnum('controllers', dti.utility.refreshUserCtlr);

            dti.storage.onMessage(dti.utility.processMessage);
        }
    },
    storage: {
        _messageCallbacks: [],
        init: function () {
            window.addEventListener('storage', function (e) {
                // console.log(e);
                dti.storage.processMessage(e);
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
        },
        sendMessage: function (config) {
            config.value._timestamp = new Date().getTime();
            config.value._windowId = window.windowId;
            store.set(config.key, config.value);
        },
        processMessage: function (e) {
            var message = {
                key: e.key
            };

            if (typeof e.newValue === 'string') {
                message.newValue = JSON.parse(e.newValue);
            } else {
                message.newValue = e.newValue;
            }

            dti.forEachArray(dti.storage._messageCallbacks, function (cb) {
                cb(message);
            });
        },
        onMessage: function (cb) {
            dti.storage._messageCallbacks.push(cb);
        }
    },
    bindings: {
        user: ko.observable(window.userData || {}),
        openWindows: {},
        windowGroups: ko.observableArray([]), // Pinned items prepopulate this array
        startMenuItems: ko.observableArray([]),
        closeWindows: function (group) {
            dti.windows.closeAll(group);
        },
        showNavigator: function (group, isStartMenu) {
            dti.utility.showNavigator(group, isStartMenu);
        },
        acceptNavigatorFilter: function () {
            dti.utility.acceptNavigatorFilter();
        },
        startMenuClick: function (obj) {
            dti.startMenu.handleClick(obj);
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
                update: function (element, valueAccessor) {
                    var upi = valueAccessor()(),
                        $element = $(element),
                        $bg = $element.parent(),
                        currThumb = dti.thumbs[upi],
                        bg,
                        img;

                    if (upi !== undefined && upi !== null) {
                        if (currThumb === undefined) {
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
                                        if (bgColor != 'undefined') $bg.css('background-color', bgColor);
                                    }
                                )
                                .fail(
                                    function () {
                                        $element.hide();
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
                        buttonId = $element.attr('id');

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

                        dti.events.hoverMenu('#' + buttonId, menuId);
                    }, 100);
                }
            };

            ko.bindingHandlers.showNavigator = {
                init: function (element, valueAccessor) {
                    var $element = $(element),
                        filter = valueAccessor();

                    if (ko.isObservable(filter)) {
                        filter = filter();
                    }

                    $element.click(function showNavigatorFiltered () {
                        dti.utility.showNavigator(filter,  true);
                    });
                }
            };

            dti.on('loaded', function applyKnockoutBindings () {
                ko.applyBindings(dti.bindings);
            });
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
    init: function () {
        var num = 2,
            runInits = function () {
                dti.animations.fadeIn($('main, header'), function startInitFlow () {
                    dti.on('modalLoaded', function checkDone () {
                        num--;
                        if (num === 0) {
                            complete();
                        }
                    });
                    dti.forEach(dti, function dtiInit (val, key) {
                        if (typeof val === 'object' && val.init) {
                            val.init();
                        }
                    });

                    $('select').material_select();

                    dti.fire('loaded');
                });
            },
            complete = function () {
                dti.animations.fadeOut($('#loading'));
            },
            showLoading = function () {
                dti.animations.fadeIn($('#loading'), runInits);
            };

        dti.animations.fadeOut($('#login'), showLoading);
    }
};

$(function initWorkspaceV2 () {
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
    }
};

//include messaging.js, sets up storage listener, parses messages, etc.  grabs window id, then sets up 'onMessage' event?
dti.window = {
    updateUrl: null,
    back: null,
    forward: null,
    saveState: null,
    retrieveState: null,
    initialize: function () {
        this.id = windowPrefix + makeId();

    }
};






