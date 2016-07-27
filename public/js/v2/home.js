var dti = {
    $loginBtn: $('#loginBtn'),
    _defaultUser: {
        "_id": "567825975d29885422ca4acb",
        "System Admin": {
            "Value": true
        },
        "username": "user1",
        "firstName": "John",
        "lastName": "Doe",
        "title": "user1's title",
        "photo": "JohnnyRoberts.jpg",
        "groups": [{
            "_id": "567b05edc41bb35c3a82c44a",
            "User Group Name": "Test Group",
            "Users": {
                "567825975d29885422ca4acb": {
                    "Group Admin": false
                },
                "56e080e8a4f645c818d2866e": {
                    "Group Admin": false
                },
                "56e5b7bc8bc5484c18565aa9": {
                    "Group Admin": false
                }
            },
            "Description": "",
            "_pAccess": 15,
            "Photo": {
                "Value": ""
            }
        }],
        "controllerId": 1
    },
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
        dti.eventHandlers[event] = dti.eventHandlers[event] || [];
        dti.eventHandlers[event].push(handler);
    },
    fire: function (event, obj1, obj2) {
        var c,
            handlers = dti.eventHandlers[event] || [],
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
        68691: {
            src: 'data:image/png;base64,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',
            bg: '#fff'
        },
        44215: {
            src: 'data:image/png;base64,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',
            bg: 'rgb(64, 128, 128)'
        }
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
    eventHandlers: {
        init: function () {
            dti.on('hideMenus', function () {
                $('.modal.open').closeModal();
            });
        },
        _bodyClickHandlers: [],
        bodyClick: function (fn) {
            dti.eventHandlers._bodyClickHandlers.push(fn);
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

            dti.eventHandlers.bodyClick(function checkOpenMenu (event) {
                if (isOpen && $(event.target).parents(menuEl).length === 0) {
                    isOpen = false;
                    dti.animations.fadeOut($menuEl);
                }
            });

            dti.on('hideMenus', function () {
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

            dti.eventHandlers.bodyClick(function closeHoverMenus (event) {
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
                    group: ko.observable(''),
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
                    var group = this.contentWindow.pointType;
                    self.bindings.group(group);

                    if (config.onLoad) {
                        config.onLoad.call(self);
                    }

                    config.afterLoad.call(self, this.contentWindow);
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

        var monitor = setInterval(function () {
            var elem = document.activeElement;
            if (elem && elem.id === iframeId) {
                self.bindings.activate();
            }
        }, 100);

        dti.utility.addEvent(self.$iframe[0], 'load', self.onLoad);

        ko.applyBindings(self.bindings, self.$windowEl[0]);

        // dti.eventHandlers.bodyClick(function activateWindow (event) {
        //     var $target = $(event.target);

        //     if ($target.parents('#' + windowId).length === 1) {
        //         self.bindings.activate();
        //     }
        // });

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
        groups: {
            Display: {
                iconClass: 'material-icons',
                iconText: 'tv',
                title: 'Displays'
            }
        },
        _draggableConfig: {
            containment: 'main',
            scroll: false
        },
        _resizableConfig: {
            // helper: 'ui-resizable-helper',
            containment: 'main'
        },
        _windowList: [],
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
        getWindowGroup: function (group) {
            return ko.viewmodel.fromModel(dti.windows._groups[group] || {});
        },
        isGroupOpen: function (group) {
            var openWindowGroups = dti.bindings.windowGroups(),
                found = false;

            dti.forEachArray(openWindowGroups, function (windowGroup) {
                if (windowGroup.group() === group) {
                    found = true;
                    return false;
                }
            });

            return found;
        },
        afterLoad: function (myWindow) {
            var group = this.bindings.group();

            if (group) {
                if (!dti.windows.isGroupOpen(group)) {
                    dti.bindings.windowGroups.push(dti.windows.getWindowGroup(group));
                }

                dti.bindings.openWindows.push(this.bindings);
                if (myWindow.point) {
                    this.bindings.upi(myWindow.point._id);            
                }
            }
        },
        create: function (config) {
            var newWindow = new dti.Window(config);

            config.afterLoad = dti.windows.afterLoad;

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
                title: title
            });
        },
        activate: function (target) {
            // var $target;

            // $('.activeCard').removeClass('activeCard').children('.card-toolbar').addClass('lighten-3');

            // if ($target.hasClass('hide')) {
            //     dti.animations.fadeIn($target);
            // }

            dti.forEachArray(dti.windows._windowList, function (win) {
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
    startButton: {
        init: function () {
            dti.startButton.$el = $('#startButton');

            // dti.startButton.$el.on('mousedown', function startClick (event) {
            //     var $newPanel = $('#newPanel');

            //     if (event.which === 3) {
            //         $newPanel.removeClass('hide');
            //         dti.windows.activate($newPanel);
            //         event.preventDefault();
            //         return false;
            //     } else if (event.which === 1) {
            //         $('#startmenu').removeClass('hide');
            //     }
            // });

            // $('.taskbar a:not(#startButton)').click(function activateViaTaskbar (event) {
            //     var target = $(event.target).data('target');

            //     dti.windows.activate($('#' + target));
            // });

            $('#openItems').click(function showOpenItems () {
                $('#modal2').openModal();
            });

            // $('#itemlist .item').hover(function hoverOpenItem () {
            //     $(this).addClass('z-depth-2');
            // }, function dehoverOpenItem () {
            //     $(this).removeClass('z-depth-2');
            // });

            $('.slideDownMenu .item').click(function previewClick (event) {
                var $el = $(event.target),
                    $target;

                if (!$el.hasClass('item')) {
                    $el = $el.parents('.item');
                }

                // $target = $('#' + $el.data('target'));

                dti.windows.activate($el.data('target'));
            });

            dti.eventHandlers.hoverMenu('#displayIcon');

            dti.eventHandlers.clickMenu('.startButtonContainer', '#startmenu');

            dti.eventHandlers.clickMenu('#globalSearch', '#searchBox', {
                before: function () {
                    $('#searchBox input').focus();
                }
            });

            // $('.startButtonContainer').hover(function hoverStartButton () {
            //     dti.animations.fadeIn($('#startmenu'));
            //     // $('#startmenu').removeClass('hide')
            //     //     .stop(true, true).css('opacity', 0)
            //     //     .slideDown({
            //     //         queue: false,
            //     //         duration: 300,
            //     //         easing: 'easeOutCubic',
            //     //         complete: function () {
            //     //             $(this).css('height', '');
            //     //         }
            //     //     })
            //     //     .animate({
            //     //         opacity: 1
            //     //     }, {
            //     //         queue: false,
            //     //         duration: 300,
            //     //         easing: 'easeOutSine'
            //     //     });
            // }, function dehoverStartButton (event) {
            //     var target = $(event.relatedTarget);

            //     if (target.parents('#startmenu').length === 0) {
            //         dti.animations.fadeOut($('#startmenu'));
            //         // $('#startmenu').fadeOut(300);
            //     }
            //     // dti.log('dehoverStartButton', $(event.target));
            // });

            // $('#startmenu').hover(function hoverStartMenu (event) {
            //     dti.startMenuHover = true;
            // }, function deHoverStartMenu (event) {
            //     if (dti.startMenuHover) {
            //         // $('#startmenu').fadeOut(300);
            //         dti.startMenuHover = false;
            //     }
            // });

            $('#displayIcon').click(function showDisplayMenu () {
                $('#displayTooltip').animate({
                    opacity: 1
                }, {
                    queue: false,
                    duration: 300,
                    easing: 'easeOutSine',
                    complete: function () {
                        $(this).css('display', 'block');
                    }
                });
            });

            $('body').mousedown(function handleBodyMouseDown (event) {
                dti.forEachArray(dti.eventHandlers._bodyClickHandlers, function (handler) {
                    handler(event);
                });
            });

            dti.eventHandlers.clickMenu('#displayIcon', '#displayTooltip');

            // dti.eventHandlers.clickMenu($('#alarmIcon'), $('.alarmDropdown'));
            dti.eventHandlers.hoverMenu('#alarmIcon');

            dti.eventHandlers.bodyClick(function hideStartMenu (event) {
                var $newPanel = $('#newPanel'),
                    $target = $(event.target);

                if ($target.parents('#startmenu').length === 1) {
                    return;
                }

                if ($target.parent('#startButton').length === 0 && $target.attr('id') !== 'startButton') {
                    $('#startmenu').fadeOut(300);
                // } else {
                //     if (event.which !== 3) {
                //         $('#startmenu').fadeOut(300);
                //         $newPanel.removeClass('hide');
                //         dti.windows.activate($newPanel);
                //         $('.newPanelButton').removeClass('hide');
                //         event.preventDefault();
                //         return false;
                    // } else if (event.which === 1) {
                    //     $('#startmenu').removeClass('hide')
                    //         .stop(true, true).css('opacity', 0)
                    //         .slideDown({
                    //             queue: false,
                    //             duration: 300,
                    //             easing: 'easeOutCubic',
                    //             complete: function () {
                    //                 $(this).css('height', '');
                    //             }
                    //         })
                    //         .animate({
                    //             opacity: 1
                    //         }, {
                    //             queue: false,
                    //             duration: 300,
                    //             easing: 'easeOutSine'
                    //         });
                    // }
                }
            });
        }
    },
    startMenu: {
        pinnedItems: {
            Displays: true
        },
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

            $('#showDesktop').click(function (event) {
                $('.dti-card-panel').addClass('hide');
            });
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
    menu: {
        initOld: function () {
            $(document).ready(function () {
                $('.tooltipped').each(function (index, element) {
                    var $span = $('#' + $(element).attr('data-tooltip-id') + '>span:first-child'),
                        thumb = dti.thumbs[$(element).attr('data-upi')] || {},
                        src = thumb.src,
                        bg = thumb.bg,
                        $bg = $('<div class="tooltipBG" style="background-color: ' + bg + ';width: 75%;height: 75%;margin: 0 auto;"></div>');

                    $span.before($(element).attr('data-tooltip'));

                    if (src) {
                        $span.before($bg);
                        $bg.append($('<img style="width: 100%; height: 100%;" class="tooltipThumbnail" src="' + src + '"/>'));
                    }

                    $span.remove();
                });
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
            var user = dti.workspaceManager.user(),
                controller = ko.utils.arrayFilter(data, function(ctrl) {
                    return ctrl.name === user.username;
                });

            if (controller.length) {
                user.controllerId = controller[0].value;
                dti.user(user);
            }
        },
        showNavigator: function () {
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
                        this.$iframe[0].contentWindow.pointLookup.init();
                    }
                });
            } else {
                dti._navigatorWindow.bindings.minimized(false);
                dti.windows.activate('Navigator');
                // dti.windows.activate('Navigator');
                // $('#Navigator').removeClass('hide');
            }
        },
        hideNavigator: function () {
            dti._navigatorWindow.bindings.minimized(true);
        },
        init: function () {
            dti.user = ko.observable(dti._defaultUser);

            dti.utility.getSystemEnum('controlpriorities');
            dti.utility.getSystemEnum('qualityCodes');
            dti.utility.getSystemEnum('telemetry');
            dti.utility.getSystemEnum('controllers', dti.utility.refreshUserCtlr);
        }
    },
    storage: {
        init: function () {
            window.addEventListener('storage', function (e) {
                console.log({
                    'Storage Key': e.key,
                    'Old Value': e.oldValue,
                    'New Value': e.newValue
                });
            });
        }
    },
    bindings: {
        openWindows: ko.observableArray([]),
        windowGroups: ko.observableArray([]), // Pinned items prepopulate this array
        showNavigator: function () {
            dti.utility.showNavigator();
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

            ko.bindingHandlers.thumbnail = {
                update: function (element, valueAccessor) {
                    var upi = valueAccessor()(),
                        $element = $(element),
                        $bg = $element.parent();

                    if (upi !== undefined) {
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
                    $menu.attr('id', menuId)
                        .position({
                            of: $element,
                            my: 'center top-48',
                            at: 'center bottom'
                        });

                    ko.applyBindingsToDescendants(newContext, $menu[0]);

                    dti.eventHandlers.hoverMenu('#' + buttonId, menuId);
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
                        // _local.login.setupAutoLogout(window.userData);
                        // sessionId = base64.encode(new Date().getTime().toString().split('').reverse().join(''));
                        // store.set('sessionId', sessionId);
                        dti.init();
                        // if ($.support.transition) {
                        //     $login
                        //         .css('overflow', 'hidden')
                        //         .find('fieldset')
                        //         .transition({
                        //                 y: 1000
                        //             }, 350, 'easeInExpo',
                        //             function() {
                        //                 $login.transition({
                        //                     opacity: 0,
                        //                     y: 51
                        //                 }, 500, 'snap');
                        //                 _local.load();
                        //             }
                        //         );
                        // } else {
                        //     $login
                        //         .css('overflow', 'hidden')
                        //         .find('fieldset')
                        //         .animate({
                        //                 top: 1000
                        //             }, 500, 'easeInExpo',
                        //             function() {
                        //                 $login.animate({
                        //                     opacity: 0,
                        //                     top: 51
                        //                 }, 500, 'easeInExpo');
                        //                 _local.load();
                        //             }
                        //         );
                        // }
                    }
                }
            );
        }
    },
    init: function () {
        dti.animations.fadeOut($('#login'));

        dti.animations.fadeIn($('main, header'));

        dti.forEach(dti, function (val, key) {
            if (typeof val === 'object' && val.init) {
                val.init();
            }

            $('select').material_select();

            // $('#pointID').openModal();
        });
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

            },
            closeWindow: function (id) {

            }
        };

    return {
        addWindow: self.addWindow,
        closeWindow: self.closeWindow
    };
};

dti.workspaceManager = window.workspaceManager = {
    user: function() {
        return JSON.parse(JSON.stringify(dti.user()));
    },
    config: window.Config,
    systemEnums: dti.utility.systemEnums,
    systemEnumObjects: dti.utility.systemEnumObjects,
    socket: function () {
        return dti.socket;
    },
    openWindowPositioned: dti.windows.openWindow
};

