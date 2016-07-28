var dti = {
    $loginBtn: $('#loginBtn'),
    itemIdx: 0,
    settings: {
        logLinePrefix: true,
        webEndpoint: window.location.origin,
        socketEndPoint: window.location.origin,
        apiEndpoint: window.location.origin + '/api/',
        idxPrefix: 'dti_'
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
            $el.css('display', 'block');
            dti.animations._fade($el, 1, cb);
        },
        fadeOut: function ($el, cb) {
            dti.animations._fade($el, 0, function finishFadeOut () {
                $el.css('display', 'none');
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
                closeMenu = function () {
                    if (menuShown) {
                        menuShown = false;
                        dti.animations.fadeOut($menu);
                    }
                },
                setTimer = function () {
                    // clearTimeout(hideTimer);
                    hideTimer = setTimeout(closeMenu, hoverDelay);
                };

            $button.hover(function showHoverMenu (event) {
                if (!menuShown) {
                    menuShown = true;
                    dti.animations.fadeIn($menu);
                } else {
                    clearTimeout(hideTimer);
                }
            }, function hideHoverMenu (event) {
                var $relatedTarget = $(event.relatedTarget);

                if ($relatedTarget.attr('id') !== menuID && $relatedTarget.parents('#' + menuID).length === 0) {
                    setTimer();
                }
            });

            $('#' + menuID).hover(function maintainHoverMenu () {
                if (menuShown) {
                    clearTimeout(hideTimer);
                }
                menuShown = true;
            }, function hideHoverMenu (event) {
                var $target = $(event.relatedTarget);

                if ($target.parents(button).length === 0) {
                    setTimer();
                }
            });

            dti.events.bodyClick(function closeHoverMenus (event) {
                if (menuShown) {
                    closeMenu();
                }
            });

            dti.on('hideMenus', closeMenu);
        }
    },
    Window: function (config) {
        var windowId = config.id || dti.makeId(),
            iframeId = dti.makeId(),
            active = false,
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
            close = function (event) {
                self.bindings.minimize();
                dti.bindings.openWindows.remove(self.bindings);
                self.$iframe.attr('src', 'about:blank');

                setTimeout(function () {
                    self.$windowEl.remove();
                }, 100);
            },
            minimize = function (event) {
                if (active) {
                    active = false;
                    self.bindings.minimized(true);
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
                    group: ko.observable(config.type),
                    url: config.url,
                    upi: ko.observable(),
                    activate: activate,
                    minimize: minimize,
                    minimized: ko.observable(false),
                    close: close,
                    active: ko.observable(false),
                    exempt: ko.observable(config.exempt || false),
                    height: ko.observable(prepMeasurement(config.height)),
                    width: ko.observable(prepMeasurement(config.width)),
                    left: ko.observable(prepMeasurement(config.left)),
                    top: ko.observable(prepMeasurement(config.top)),
                    right: ko.observable(prepMeasurement(config.right)),
                    bottom: ko.observable(prepMeasurement(config.bottom))
                },
                onLoad: function (event) {
                    // var group = this.contentWindow.pointType;
                    // self.bindings.group(group);

                    if (config.onLoad) {
                        config.onLoad.call(self);
                    }

                    if (this.contentWindow.point) {
                        dti.log('Setting window upi', this.contentWindow.point._id);
                        if (self.bindings.upi() === undefined) {
                            self.bindings.upi(this.contentWindow.point._id);
                        } else {
                            dti.log('Skipping window upi, already set', self.bindings.upi());
                        }
                    } else {
                        dti.log('Skipping set window upi');
                    }

                    // config.afterLoad.call(self, this.contentWindow);
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

        //detect clicks inside iframe
        setInterval(function () {
            var elem = document.activeElement;
            if (elem && elem.id === iframeId) {
                self.bindings.activate();
            }
        }, 100);

        ko.applyBindings(self.bindings, self.$windowEl[0]);

        return {
            minimize: self.minimize,
            close: self.close,
            deactivate: deactivate,
            activate: activate,
            $el: self.$windowEl,
            windowId: windowId,
            bindings: self.bindings
        };
    },
    windows: {
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

            // $('main').on('mousedown', dti.windows.elementSelector, function handleCardClick (event) {
            //     if (!$(event.target).hasClass('minimizePanel')) {
            //         dti.windows.activate($(event.currentTarget));
            //     }
            // });

            // $('.dti-card-panel .card-toolbar .right a:first-child').click(function minimizePanel (event) {
            //     $(event.target).parents('.dti-card-panel').addClass('hide');
            // });

            // $('.material-tooltip .backdrop').addClass('blue-grey');
        },
        create: function (config) {
            var newWindow = new dti.Window(config);

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
                uniqueId: uniqueId
            });
        },
        activate: function (target) {
            // var $target;

            // $('.activeCard').removeClass('activeCard').children('.card-toolbar').addClass('lighten-3');

            // if ($target.hasClass('hide')) {
            //     dti.animations.fadeIn($target);
            // }

            dti.forEachArray(dti.windows._windowList, function processWindowActivate (win) {
                // if (win.windowId !== target) {
                //     win.deactivate();
                // }
                if (win.windowId === target) {
                    win.activate(true);
                } else {
                    if (!win.bindings.exempt()) {
                        win.deactivate();
                    }
                }
            });

            dti.fire('hideMenus');

            // $target.removeClass('hide').addClass('activeCard').children('.card-toolbar').removeClass('lighten-3 hide');
        }
    },
    taskbar: {
        _groups: {
            'Display': {
                title: 'Displays',
                iconText: 'tv',
                iconClass: 'material-icons',
                group: 'Display'
            },
            'Sequence': {
                title: 'Sequences',
                iconText: 'device_hub',
                iconClass: 'material-icons',
                group: 'Sequence'
            }
        },
        pinnedItems: ['Display', 'Sequence'],
        init: function () {
            var pinnedItems = [];
            //load user preferences
            dti.forEachArray(dti.taskbar.pinnedItems, function  processPinnedItem (item) {
                dti.bindings.windowGroups.push(dti.taskbar.getWindowGroup(item));
            });

            // dti.bindings.windowGroups(pinnedItems);
        },
        addWindow: function (win) {
            var group = win.bindings.group();

             if (group && dti.taskbar.isValidGroup(group)) {
                if (!dti.taskbar.isGroupOpen(group)) {
                    dti.bindings.windowGroups.push(dti.taskbar.getWindowGroup(group));
                }

                dti.bindings.openWindows.push(win.bindings);
                // if (myWindow.point) {
                //     this.bindings.upi(myWindow.point._id);            
                // }
            }
        },
        getWindowGroup: function (group) {
            return ko.viewmodel.fromModel(dti.taskbar._groups[group] || {});
        },
        isValidGroup: function (group) {
            return dti.taskbar._groups[group] !== undefined;
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

            dti.events.clickMenu('.startButtonContainer', '#startmenu');

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

                            if (!dti.startMenu.pinnedItems[text]) {
                                $el = $('.taskbar .left').append(template);

                                dti.startMenu.pinnedItems[text] = {
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

            $('#showOpenItems').click(function (event) {
                $('#openItemsModal').openModal();
            });

            // $('#showDesktop').click(function (event) {
            //     $('.dti-card-panel').addClass('hide');
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
        systemEnums: {},
        systemEnumObjects: {},
        addEvent: function(element, event, fn) {
            if (element.addEventListener) {
                element.addEventListener(event, fn, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + event, fn);
            }
        },
        getSystemEnum: function(enumType, callback) {
            return $.ajax({
                url: dti.settings.apiEndpoint + 'system/' + enumType,
                contentType: 'application/json',
                dataType: 'json',
                type: 'get'
            }).done(
                function(data) {
                    var c = 0,
                        len = data.length,
                        row,
                        _object = {},
                        _array = [{
                            name: 'None',
                            value: 0
                        }],
                        _setQCData = function(qc, object) {
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
                        _setCTData = function(ct, object) {
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
                        _setPLData = function(pl, object) {
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
                function(jqXHR, textStatus) {
                    dti.log('Get system enum (' + enumType + ') failed', jqXHR, textStatus);
                    // Set an empty array/object for code looking @ systemEnums[enumType]
                    // TODO Try again or alert the user and stop
                    dti.utility.systemEnums[enumType] = [];
                    dti.utility.systemEnumObjects[enumType] = {};
                }
            );
        },
        refreshUserCtlr: function(data) {
            // This routine adds the user's controller ID to the user object
            // Parms: data is the received array of controllers
            var user = dti.bindings.user(),
                controller = ko.utils.arrayFilter(data, function(ctrl) {
                    return ctrl.name === user.username;
                });

            if (controller.length) {
                user.controllerId = controller[0].value;
                dti.bindings.user(user);
            }
        },
        applyNavigatorFilter: function (pointType) {
            var types,
                processedTypes = [];

            if (pointType) {
                if (!Array.isArray(pointType)) {
                    types = [pointType];
                } else {
                    types = pointType;
                }

                // dti.forEachArray(types, function findPointType(type) {
                //     processedTypes.push(dti.utility.pointTypeLookup[type]);
                // });

            } else {
                types = ['all'];
            }

            dti._navigatorWindowIFrame[0].contentWindow.pointLookup.checkPointTypes(types);
        },
        showNavigator: function (pointType) {

            dti.fire('hideMenus');
            if (!dti.navigatorLoaded) {
                dti.navigatorLoaded = true;
                dti._navigatorWindow = dti.windows.create({
                    width: '100%',
                    // height: '100%',
                    left: 0,
                    bottom: 0,
                    top: -28,
                    right: 0,
                    title: 'Navigator',
                    id: 'Navigator',
                    url: '/pointLookup',
                    exempt: true,
                    onLoad: function () {
                        dti._navigatorWindow.$el.css('zIndex', 100);
                        dti._navigatorWindowIFrame[0].contentWindow.pointLookup.init();
                        dti.utility.applyNavigatorFilter(pointType);
                    }
                });
                dti._navigatorWindowIFrame = dti._navigatorWindow.$el.children('iframe');
            } else {
                dti._navigatorWindow.bindings.minimized(false);
                dti.windows.activate('Navigator');
                dti.utility.applyNavigatorFilter(pointType);
                // dti.windows.activate('Navigator');
                // $('#Navigator').removeClass('hide');
            }
        },
        hideNavigator: function () {
            dti._navigatorWindow.bindings.minimized(true);
        },
        init: function () {
            dti.utility.pointTypeLookup = {};
            dti.utility.pointTypes = dti.workspaceManager.config.Utility.pointTypes.getAllowedPointTypes();

            dti.forEachArray(dti.utility.pointTypes, function processPointType (type) {
                dti.utility.pointTypeLookup[type.key] = type;
            });

            dti.utility.getSystemEnum('controlpriorities');
            dti.utility.getSystemEnum('qualityCodes');
            dti.utility.getSystemEnum('telemetry');
            dti.utility.getSystemEnum('controllers', dti.utility.refreshUserCtlr);
        }
    },
    storage: {
        init: function () {
            window.addEventListener('storage', function handleStorageChange (e) {
                console.log({
                    'Storage Key': e.key,
                    'Old Value': e.oldValue,
                    'New Value': e.newValue
                });
            });
        }
    },
    bindings: {
        user: ko.observable(window.userData || {}),
        openWindows: ko.observableArray([]),
        windowGroups: ko.observableArray([]), // Pinned items prepopulate this array
        showNavigator: function () {
            dti.utility.showNavigator();
        },
        showDesktop: function () {
            dti.forEachArray(dti.bindings.openWindows(), function minimizeOnShowDesktop (win) {
                win.minimize();
            });

            dti.utility.hideNavigator();
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

            ko.bindingHandlers.thumbnail = {
                update: function (element, valueAccessor) {
                    var upi = valueAccessor()(),
                        $element = $(element),
                        $bg = $element.parent(),
                        currThumb = dti.thumbs[upi],
                        bg,
                        img;

                    if (upi !== undefined) {
                        if (currThumb === undefined) {
                            dti.log('No thumb for upi', upi);
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

                                        dti.log('Saving thumb for upi', upi);

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
                                        $icon.show();
                                    }
                                );
                        } else {
                            dti.log('Using existing thumb for', upi);
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
                        dti.utility.showNavigator(filter);
                    });
                }
            };

            ko.applyBindings(dti.bindings);
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
                function(data) {
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
                dti.forEach(dti, function dtiInit (val, key) {
                    if (typeof val === 'object' && val.init) {
                        val.init();
                    }

                    $('select').material_select();
                });
            },
            complete = function () {
                num--;
                if (num === 0) {
                    runInits();
                }
            };

        dti.animations.fadeOut($('#login'), complete);
        dti.animations.fadeIn($('main, header'), complete);
    }
};

$(function initWorkspaceV2 () {
    dti.socket = io.connect(dti.settings.socketEndPoint);
    dti.$loginBtn.click(function (event) {
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

dti.Taskbar = function () {
    var self = {
            addWindow: function (title, id) {

            }
        };

    return {
        addWindow: self.addWindow,
        closeWindow: self.closeWindow
    };
};

dti.workspaceManager = window.workspaceManager = {
    user: function() {
        return JSON.parse(JSON.stringify(dti.bindings.user()));
    },
    config: window.Config,
    systemEnums: dti.utility.systemEnums,
    systemEnumObjects: dti.utility.systemEnumObjects,
    socket: function () {
        return dti.socket;
    },
    openWindowPositioned: dti.windows.openWindow
};

