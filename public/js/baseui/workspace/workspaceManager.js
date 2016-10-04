/**
 * Created by Chris on 11/29/13.
 */

window.workspaceManager = (function($) {

    var _local = {},
        $body,
        $systemStatus,
        $systemStatusElement;

    _local.webEndpoint = window.location.origin;
    _local.socketEndPoint = window.location.origin;
    _local.apiEndpoint = _local.webEndpoint + '/api/';

    //logged in user
    _local.user = ko.observable('');

    _local.workspace = {};
    _local.workspace.isVisible = ko.observable('false');
    _local.workspace.windows = ko.observableArray([]);

    _local.systemEnums = {};
    _local.systemEnumObjects = {};

    _local.appHeight = ko.observable();

    $(window).resize(function() {
        _local.appHeight($body.height());
    });

    _local.sounds = {
        beep: "data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
    };

    _local.displayableTypes = ['display', 'report', 'sequence', 'alarm', 'activitylog', 'trendplot', 'script', 'slide show', 'dashboard'];

    //active set
    _local.workspace.activeSet = ko.observable('open');

    //filters
    _local.workspace.filters = {
        recent: {
            filter: {
                isRecent: true
            },
            name: 'Recent'
        },
        fav: {
            filter: {
                isFav: true
            },
            name: 'Favorites'
        },
        open: {
            filter: {
                isOpen: true
            },
            name: 'All Open Windows'
        },
        display: {
            filter: {
                type: 'display',
                isOpen: true
            },
            name: 'Display Windows'
        },
        report: {
            filter: {
                type: 'report',
                isOpen: true
            },
            name: 'Report Windows'
        },
        gpl: {
            filter: {
                type: 'sequence',
                isOpen: true
            },
            name: 'GPL Windows'
        },
        alarm: {
            filter: {
                type: 'alarm',
                isOpen: true
            },
            name: 'Alarm Windows'
        },
        activitylog: {
            filter: {
                type: 'activitylog',
                isOpen: true
            },
            name: 'Activity Windows'
        },
        trendplot: {
            filter: {
                type: 'trendplot',
                isOpen: true
            },
            name: 'Trend Plot Windows'
        },
        dashboard: {
            filter: {
                type: 'dashboard',
                isOpen: true
            },
            name: 'Dashboard Windows'
        },
        script: {
            filter: {
                type: 'script',
                isOpen: true
            },
            name: 'Script Windows'
        },
        slideShow: {
            filter: {
                type: 'slide show',
                isOpen: true
            },
            name: 'Slide Show Windows'
        }
    };

    _local.workspace.filteredWindows = ko.computed(function() {
        return ko.utils.arrayFilter(_local.workspace.windows(), function(win) {
            var _filter = _local.workspace.filters[_local.workspace.activeSet()].filter;
            if (!~_local.displayableTypes.indexOf(win.type)) return false;
            for (var prop in _filter) {
                if (ko.unwrap(win[prop]) !== _filter[prop]) {
                    return false;
                }
            }
            return true;
        });
    });

    _local.workspace.getFilteredWindowsByType = function(type) {
        return ko.computed(function() {
            var _windows = ko.utils.arrayFilter(_local.workspace.windows(), function(win) {
                return win.type === type && win.isOpen() === true;
            });
            return _windows;
        });
    };

    _local.workspace.filteredWindowsByType = {
        display: _local.workspace.getFilteredWindowsByType('display'),
        report: _local.workspace.getFilteredWindowsByType('report'),
        sequence: _local.workspace.getFilteredWindowsByType('sequence'),
        alarm: _local.workspace.getFilteredWindowsByType('alarm'),
        activitylog: _local.workspace.getFilteredWindowsByType('activitylog'),
        trendplot: _local.workspace.getFilteredWindowsByType('trendplot'),
        dashboard: _local.workspace.getFilteredWindowsByType('dashboard'),
        script: _local.workspace.getFilteredWindowsByType('script'),
        slideShow: _local.workspace.getFilteredWindowsByType('slide show'),
        devicetree: _local.workspace.getFilteredWindowsByType('devicetree')
    };

    _local.workspace.getRecentXPoints = function(x) {
        return ko.computed(function() {
            var _points = _local.workspace.windows(),
                allowedPointTypes = window.Config.Utility.pointTypes.getAllowedPointTypes().map(function(item) {
                    return item.key.toLowerCase();
                }),
                _filteredPoints = [];
            //dont include utility windows
            for (var i = 0, len = _points.length; i < len; i++) {
                if (!!~allowedPointTypes.indexOf(_points[i].type)) _filteredPoints.push(_points[i]);
            }
            return _filteredPoints.slice(-x);
        });
    };

    _local.workspace.isVisible.subscribe(function(val) {
        var $toggle = $('#workspaceToggle'),
            _work;
        if (val) {
            _local.workspace.$mainWindowCloseBtn.hide();
            _work = function() {
                $toggle
                    .removeClass('fa-arrow-up')
                    .addClass('fa-arrow-down')
                    .parent().attr('title', 'Hide workspace');
            };
        } else {
            if (!!_local.currentMainWindowOccupant()) _local.workspace.$mainWindowCloseBtn.show();
            _work = function() {
                $toggle
                    .removeClass('fa-arrow-down')
                    .addClass('fa-arrow-up')
                    .parent().attr('title', 'Show workspace');
            };
        }
        setTimeout(_work, 250);
    });

    //change active set
    _local.workspace.showSet = function(set) {
        _local.workspace.activeSet(set);
    };

    //make bold active set
    _local.workspace.isActiveSet = function(set) {
        return set === _local.workspace.activeSet() && 'bold';
    };

    _local.workspace.animateOut = function(item) {
        if (item.nodeType === 1) {
            $(item).fadeOut(250, function() {
                $(this).remove();
            });
        }
    };

    _local.workspace.animateIn = function(item) {
        if (item.nodeType === 1) {
            $(item)
                .css({
                    marginLeft: 20,
                    opacity: 0
                })
                .animate({
                    marginLeft: 0,
                    opacity: 1
                }, {
                    duration: 500,
                    easing: 'easeInOutQuint'
                });
        }
    };

    _local.workspace.beforeMove = function(elem) {
        var $elem;
        if (elem.nodeType === 1) {
            $elem = $(elem);
            $elem.data('saveOffsetTop', $elem.offset().top - 91);
            $elem.data('saveOffsetLeft', $elem.offset().left - 157);
        }
    };

    _local.workspace.afterMove = function(elem) {
        var $elem, $container, _offsetTop, _offsetLeft;
        if (elem.nodeType === 1) {
            $elem = $(elem);
            $container = $elem.parent();
            _offsetTop = $elem.data('saveOffsetTop');
            _offsetLeft = $elem.data('saveOffsetLeft');
            if ($elem.offset().top !== _offsetTop || $elem.offset().left !== _offsetLeft) {
                var $tempElement = $elem.clone();
                $elem.css({
                    visibility: 'hidden'
                });
                $tempElement.css({
                    position: "absolute",
                    width: $elem.outerWidth()
                });
                $container.append($tempElement);
                $tempElement
                    .css({
                        top: _offsetTop,
                        left: _offsetLeft
                    })
                    .animate({
                        top: $elem.offset().top - 91,
                        left: $elem.offset().left - 157
                    }, 500, 'easeInOutQuint', function() {
                        $elem.css({
                            visibility: 'visible'
                        });
                        $tempElement.remove();
                    });
            }
        }
    };

    //favorites
    _local.workspace.fav = function(instance) {
        instance.isFav(true);
    };
    _local.workspace.unfav = function(instance) {
        instance.isFav(false);
    };

    _local.workspace.applyThumbClass = function(_instance) {
        var _class = '';
        switch (_instance.type) {
            case 'display':
                _class = 'fa-sitemap';
                break;
            case 'sequence':
                _class = 'fa-code-fork';
                break;
            case 'report':
                _class = 'fa-file-text-o';
                break;
            case 'alarm':
                _class = 'fa-bell-o';
                break;
            case 'activitylog':
                _class = 'fa-comments-o';
                break;
            case 'trendplot':
                _class = 'fa-line-chart';
                break;
            case 'dashboard':
                _class = 'fa-tachometer';
                break;
            case 'slide show':
                _class = 'fa-film';
                break;
            case 'script':
                _class = 'fa-file-code-o';
                break;
        }
        return 'thumbIcon fa fa-2x ' + _class;
    };

    _local.workspace.thumbError = function(data, event) {
        $(event.target).hide().parent().find('.thumbIcon').show();
    };

    _local.jiggleWindow = function(theWindow, howManyTimes) {
        var backDrop = theWindow.document.getElementById('backDrop'),
            originalBgColor,
            newBgColor,
            timeout,
            moveByPixels = 3;

        if (backDrop) {
            function shadeRGBColor(color, percent) {
                var f = color.split(","),
                    t = percent < 0 ? 0 : 255,
                    p = percent < 0 ? percent * -1 : percent,
                    R = parseInt(f[0].slice(4), 10),
                    G = parseInt(f[1], 10),
                    B = parseInt(f[2], 10);
                return "rgb(" + (Math.round((t - R) * p) + R) + "," + (Math.round((t - G) * p) + G) + "," + (Math.round((t - B) * p) + B) + ")";
            }

            function cancelJiggling() {
                clearTimeout(timeout);
                backDrop.style.backgroundColor = originalBgColor;
                theWindow.jiggling = false;
            }

            function doJiggle() {
                backDrop.style.backgroundColor = (backDrop.style.backgroundColor === originalBgColor) ? newBgColor : originalBgColor;
                moveByPixels = moveByPixels > 0 ? -moveByPixels : moveByPixels;
                theWindow.moveBy(moveByPixels, moveByPixels);

                if (--howManyTimes > 0 && !theWindow.document.hasFocus()) {
                    timeout = setTimeout(doJiggle, 500); // .5 secs
                } else {
                    cancelJiggling();
                }
            }

            howManyTimes = parseInt(howManyTimes, 10);
            if (isNaN(howManyTimes)) {
                howManyTimes = 120; // default amount of times
            }
            if (!theWindow.jiggling) {
                originalBgColor = backDrop.style.backgroundColor;
                newBgColor = shadeRGBColor(originalBgColor, 0.25);
                moveByPixels = 3;

                theWindow.jiggling = true;
                doJiggle();
            }
        }
    };

    _local.init = function() {
        var _username,
            $login = $('#login');

        $body = $('body');
        $systemStatusElement = $('.systemStatus');
        $systemStatus = {
            init: false,
            led: $systemStatusElement.find('.led'),
            status: $systemStatusElement.find('.text'),
            timer: null,
            setStatus: function(status) {
                var $led = this.led;
                //reset
                $led.removeClass('led-red led-orange led-yellow led-green led-blue');

                switch (status) {
                    case 'connecting':
                        this.timer = setInterval(function() {
                            $led.toggleClass('led-yellow');
                        }, 500);
                        this.status.text('Connecting...');
                        break;
                    case 'serverup':
                        $led.addClass('led-green');
                        this.status.text('Online');
                        break;
                    case 'serverdown':
                        $led.addClass('led-red');
                        this.status.text('Offline');
                }
            }
        };

        //are we in the top frame
        if (!!window.top) {
            window.top.location.replace(window.location);
            window.close();
        } else if (window.top !== window.self) {
            window.top.location.replace(window.location);
        }
        //get user cookie
        _username = _local.readCookie('username');
        _local.login.rememberMe(!!_username);
        _local.login.username(_username || '');
        //if we are already authenticated, skip the login screen
        if (window.isAuthenticated) {
            _local.load();
            return;
        } else {
            $login.show();
            _local.login.isLogIn(true);
        }
        //bind login screen
        ko.applyBindingsWithValidation(_local.login, document.getElementById('login'), {
            registerExtenders: true,
            messagesOnModified: true,
            insertMessages: false,
            decorateElement: true,
            errorElementClass: 'input-validation-error',
            errorMessageClass: 'error'
        });
        $('#user').focus();
        $login.find('.form-group input').keyup(function(event) {
            if (event.keyCode === 13) {
                if (_local.login.isLogIn())
                    _local.login.signIn();
                else
                    _local.login.passwordReset();
            }
        });
    };

    _local.load = function() {
        var $app = $('#appContainer'),
            $login = $('#login'),
            thumbnailTemp = {
                showThumbnailLink: ko.computed(function() {
                    var user = _local.user();
                    return (user['System Admin'] && user['System Admin'].Value === true);
                }),
                openThumbnailBatch: function() {
                    _local.openWindow('/thumbnail/batch', 'Thumbnails', '', 'Thumbnails', 999999, 1024, 768);
                }
            };

        //connect socket
        _local.socket = io.connect(_local.socketEndPoint);

        //set system status
        //$systemStatus.setStatus('connecting');
        //start polling for system status
        //$systemStatus.getStatus();
        _local.socket.emit('getStatus');
        _local.socket.on('statusUpdate', function(data) {
            console.log('statusupdate', data);
            $systemStatus.setStatus(data);
        });

        _local.refreshUserCtlr = function(data) {
            // This routine adds the user's controller ID to the user object
            // Parms: data is the received array of controllers
            var user = _local.user(),
                controller = ko.utils.arrayFilter(data, function(ctrl) {
                    return ctrl.name === user.username;
                });
            if (controller.length) {
                user.controllerId = controller[0].value;
                _local.user(user);
            }
        };
        _local.socket.on('updatedSystemInfo', function(data) {
            if (data.name === 'controllers') {
                _local.getSystemEnum('controllers', _local.refreshUserCtlr);
            } else if (data.name === 'Preferences') {
                _local.getSystemEnum('telemetry');
            } else {
                _local.getSystemEnum(data.name);
            }
        });

        _local.hasUnackedAlarms = false;
        _local.unackAlarms = [];
        _local.checkAlarms = function() {
            _local.hasUnackedAlarms = !!_local.unackAlarms.length;
        };

        _local.loadUnack = ko.computed(function() {
            var user = _local.user();
            if (!!user) {
                _local.socket.emit('getUnacknowledged', {
                    user: user,
                    currentPage: 1,
                    itemsPerPage: 1
                });
            }
        });

        _local.socket.on('unacknowledged', function(data) {
            _local.unackAlarms = data.alarms;
        });

        _local.socket.on('newUnackAlarm', function(data) {
            _local.unackAlarms.push(data.newAlarm);
        });

        _local.socket.on('removingUnackAlarm', function(data) {
            for (var u = 0; u < _local.unackAlarms.length; u++) {
                if (data._id === _local.unackAlarms[u]._id) {
                    _local.unackAlarms.splice(u, 1);
                    u--;
                }
            }
        });
        _local.alertForUnack = (function() {
            setInterval(function() {
                _local.checkAlarms();
                if (!!_local.hasUnackedAlarms) {
                    _local.playSound('beep');
                }
            }, 10000);
        }());

        //load system enums
        _local.getSystemEnum('controlpriorities');
        _local.getSystemEnum('qualityCodes');
        _local.getSystemEnum('telemetry');
        _local.getSystemEnum('controllers', _local.refreshUserCtlr);

        //load point navigator
        _local.loadNavigator();
        _local.$workspace = $('#workspace');
        _local.workspace.mainWindow = document.getElementById('mainWindow');
        _local.workspace.$mainWindowCloseBtn = $('#mainWindowClose');
        _local.showWorkspace(true);

        // Add user's controller ID to the user object & default to 0
        window.userData.controllerId = 0;
        // Set user data
        _local.user(window.userData);


        ko.applyBindings(thumbnailTemp, $('#statusBar')[0]);

        //bind workspace
        ko.applyBindings(_local, $app[0]);
        //hide login form
        $login.hide();
        $app.show();
        //get stored data
        _local.restoreWorkspace();
        //set unload handler for child windows
        window.onbeforeunload = function() {
            var _ref,
                _windows = _local.workspace.windows();

            //disconnect socket
            _local.socket.disconnect();

            //save workspace
            _local.persistWorkspace();

            //close windows
            _local.closeAll('shutdown');
        };
        //set event listeners
        _local.initializeEventListeners();
        //start window monitor
        setTimeout(function() {
            _local.timer(_local.windowMonitor, 1000);
        }, 5000);
    };

    _local.toggleWorkspace = function() {
        if (_local.workspace.isVisible()) {
            _local.hideWorkspace();
        } else {
            _local.showWorkspace();
        }
    };

    _local.showWorkspace = function(suppressAnimation) {
        _local.workspace.isVisible(true);
        if (suppressAnimation) {
            _local.$workspace
                .show()
                .css({
                    top: 50
                });
            return;
        }
        if ($.support.transition) {
            _local.$workspace
                .show()
                .transition({
                    y: 0
                }, 250, 'easeOutQuint');
        } else {
            _local.$workspace
                .show()
                .animate({
                    top: 50
                }, {
                    duration: 250,
                    easing: 'easeOutQuint'
                });
        }
    };

    _local.hideWorkspace = function(suppressAnimation) {
        _local.workspace.isVisible(false);
        if (suppressAnimation) {
            _local.$workspace
                .hide()
                .css({
                    top: $(window).height()
                });
            return;
        }
        if ($.support.transition) {
            _local.$workspace.transition({
                    y: $(window).height()
                }, 250, 'easeInQuint',
                function() {
                    _local.$workspace.hide();
                }
            );
        } else {
            _local.$workspace.animate({
                top: $(window).height()
            }, {
                duration: 250,
                easing: 'easeInQuint',
                complete: function() {
                    _local.$workspace.hide();
                }
            });
        }
    };

    _local.showDisplays = function() {
        _local.workspace.showSet('display');
        _local.showWorkspace();
    };

    _local.showGPLs = function() {
        _local.workspace.showSet('gpl');
        _local.showWorkspace();
    };

    _local.showAlarms = function() {
        _local.workspace.showSet('alarm');
        _local.showWorkspace();
    };

    _local.showActivities = function() {
        _local.workspace.showSet('activitylog');
        _local.showWorkspace();
    };

    _local.showTrendPlot = function() {
        _local.workspace.showSet('trendplot');
        _local.showWorkspace();
    };

    _local.showDashboard = function() {
        _local.workspace.showSet('dashboard');
        _local.showWorkspace();
    };

    _local.showScripts = function() {
        _local.workspace.showSet('script');
        _local.showWorkspace();
    };

    _local.showReports = function() {
        _local.workspace.showSet('report');
        _local.showWorkspace();
    };

    _local.showSlideShows = function() {
        _local.workspace.showSet('slideShow');
        _local.showWorkspace();
    };

    _local.showDeviceTree = function() {
        _local.workspace.showSet('devicetree');
        _local.showWorkspace();
    };

    _local.showNavigator = function() {
        var $navBackground = $('#navigatorWrapper'),
            $navWindow = $('#navigatorWindow'),
            _navWindow = document.getElementById('navigator'),
            _topDestination = 50,
            _bottomDestination = 25;
        $navWindow
            .css({
                opacity: 0,
                top: _topDestination + 100,
                bottom: _bottomDestination - 100
            })
            .show();
        $navBackground
            .css('opacity', 0)
            .show();
        if ($.support.transition) {
            $navBackground.transition({
                    opacity: 1
                }, 200, 'snap',
                function() {
                    $navWindow.transition({
                            opacity: 1,
                            y: -100
                        }, 300, 'snap',
                        function() {
                            _navWindow.contentWindow.pointLookup.refreshUI();
                        });
                }
            );
        } else {
            $navBackground.animate({
                opacity: 1
            }, {
                duration: 200,
                easing: 'easeInQuint',
                complete: function() {
                    $navWindow
                        .animate({
                            opacity: 1,
                            top: _topDestination,
                            bottom: _bottomDestination
                        }, {
                            duration: 300,
                            easing: 'easeOutQuint',
                            complete: function() {
                                _navWindow.contentWindow.pointLookup.refreshUI();
                            }
                        });
                }
            });
        }
    };

    _local.showNavigatorFiltered = function(filter) {
        var _navWindow = document.getElementById('navigator'),
            _filter = [],
            uniqueId;

        if (filter === 'Alarm') {
            //alarms won't use navigator so we'll do something different
            uniqueId = _local.createUniqueId();
            _local.openWindow('/alarms?' + uniqueId, 'Recent Alarms', 'alarm', 'mainWindow', 'alarm' + uniqueId);
            return;
        }
        if (filter === 'Activity') {
            //alarms won't use navigator so we'll do something different
            _local.openWindow('/activityLogs', 'Activity Log', 'activitylog', 'mainWindow', 'activitylog');
            return;
        }
        if (filter === 'Trend Plot') {
            uniqueId = _local.createUniqueId();
            _local.openWindow('/trendPlots?' + uniqueId, 'Trend Plot', 'trendplot', 'mainWindow', 'trendplot' + uniqueId);
            return;
        }
        if (filter === 'Dashboard') {
            uniqueId = _local.createUniqueId();
            _local.openWindow('/dashboard', 'Dashboard', 'dashboard', 'mainWindow', 'dashboard');
            return;
        }
        if (filter === 'Point Involvement') {
            //Point Involvement won't use navigator so we'll do something different
            uniqueId = _local.createUniqueId();
            _local.openWindow('/report/cr/pointInvolvement?' + uniqueId, 'Point Involvement', 'pointInvolvement', 'mainWindow', 'pointInvolvement' + uniqueId);
            return;
        }
        if (filter === 'Device Tree') {
            //Device Tree won't use navigator so we'll do something different
            uniqueId = _local.createUniqueId();
            _local.openWindow('/devicetree?' + uniqueId, 'Device Tree', 'devicetree', 'mainWindow', 'devicetree' + uniqueId);
            return;
        }

        if (typeof filter === 'object') {
            switch (_local.workspace.activeSet()) {
                case 'display':
                    _filter.push('Display');
                    break;
                case 'report':
                    _filter.push('Report');
                    break;
                case 'gpl':
                    _filter.push('Sequence');
                    break;
                case 'script':
                    _filter.push('Script');
                    break;
                case 'slideShow':
                    _filter.push('Slide Show');
                    break;
                case 'alarm':
                    uniqueId = _local.createUniqueId();
                    //alarms won't use navigator so we'll do something different
                    _local.openWindow('/alarms?' + uniqueId, 'Recent Alarms', 'alarm', 'mainWindow', 'alarm' + uniqueId);
                    return;
                case 'trendplot':
                    uniqueId = _local.createUniqueId();
                    //alarms won't use navigator so we'll do something different
                    _local.openWindow('/trendPlots?' + uniqueId, 'Trend Plot', 'trendplot', 'mainWindow', 'activity' + uniqueId);
                    return;
                case 'dashboard':
                    uniqueId = _local.createUniqueId();
                    _local.openWindow('/dashboard?' + uniqueId, 'Dashboard', 'dashboard', 'mainWindow', 'dashboard' + uniqueId);
                    return;
                case 'activitylog':
                    //alarms won't use navigator so we'll do something different
                    _local.openWindow('/activityLogs', 'Activity Log', 'activitylog', 'mainWindow', 'activitylog');
                    return;
            }
        } else {
            _filter.push(filter);
        }

        _navWindow.contentWindow &&
            _navWindow.contentWindow.pointLookup &&
            _navWindow.contentWindow.pointLookup.checkPointTypes(_filter);
        _local.showNavigator();
    };

    _local.hideNavigator = function() {
        var $navBackground = $('#navigatorWrapper'),
            $navWindow = $('#navigatorWindow');

        if ($.support.transition) {
            $navWindow.transition({
                opacity: 0,
                y: 100
            }, 200, 'easeOutExpo', function() {
                $navWindow.hide();
                $navBackground.transition({
                    opacity: 0
                }, 300, 'easeOutExpo', function() {
                    $navBackground.hide();
                });
            });
        } else {
            $navWindow
                .animate({
                    opacity: 0
                }, {
                    duration: 200,
                    easing: 'easeInQuint',
                    complete: function() {
                        $navWindow.hide();
                    }
                });
            $navBackground
                .delay(100)
                .animate({
                    opacity: 0
                }, {
                    duration: 300,
                    easing: 'easeInQuint',
                    complete: function() {
                        $navBackground.hide();
                    }
                });
        }
    };

    _local.focusWindow = function(upi) {
        var _target,
            _window = ko.utils.arrayFirst(_local.workspace.windows(), function(item) {
                return item.upi() === upi;
            });

        if (_window) {
            _target = (_window.target() === 'mainWindow' || _window.isOpen() === false) ? 'mainWindow' : '';
            _local.openWindow(_window.url, _window.title(), _window.type, _target, upi, _window.width(), _window.height());
        }
    };

    /**
     *
     * @param url           - URL of content
     * @param title         - Point name or whatever you would like the thumbnail label to be
     * @param type          - Display, Sequence, Report, etc. Falsey will not show up in workspace
     * @param target        - 'mainWindow' targets main workspace area, falsey targets a new window
     * @param uniqueId      - upi for point. If non-point type, use unique name
     * @param options
     *          width       - width of window (not applicable if target is 'mainWindow')
     *          height      - height of window (not applicable if target is 'mainWindow')
     *          top      - top coordinates in pixels. Windows will be centered if not provided. (not applicable if target is 'mainWindow')
     *          left     - left coordinates in pixels. Window will be centered if not provided. (not applicable if target is 'mainWindow')
     *          callback    - executed after window has loaded
     */
    _local.openWindowPositioned = function(url, title, type, target, uniqueId, options) {
        var workspaceLeft = typeof window.screenLeft === 'undefined' ? screen.left : window.screenLeft,
            workspaceTop = typeof window.screenTop === 'undefined' ? screen.top : window.screenTop,
            workspaceWidth = window.innerWidth ? window.innerWidth :
            document.documentElement.clientWidth ? document.documentElement.clientWidth :
            screen.width,
            workspaceHeight = window.innerHeight ? window.innerHeight :
            document.documentElement.clientHeight ? document.documentElement.clientHeight :
            screen.height,
            settings = {
                width: 1250,
                height: 750,
                callback: function() {}
            };


        if (options) $.extend(settings, options);

        settings.top = settings.top || (workspaceHeight / 2) - (settings.height / 2) + workspaceTop;
        settings.left = settings.left || (workspaceWidth / 2) - (settings.width / 2) + workspaceLeft;

        return _local.openWindow(url, title, type, target, uniqueId, settings.width, settings.height, settings.callback, settings.top, settings.left);
    };

    /**
     * DEPRECATED!! Use openWindowPositioned
     * @param url       - URL of content
     * @param title     - Point name or whatever you would like the thumbnail label to be
     * @param type      - Display, Sequence, Report, etc. Falsey will not show up in workspace
     * @param target    - 'mainWindow' targets main workspace area, falsey targets a new window
     * @param upi       - upi for point. If non-point type, use unique name
     * @param width     - width for new window. Ignored otherwise
     * @param height    - height for new window. Ignored otherwise
     * @param callback  - executed after window has loaded
     * ////////////// extended to support positioning
     * @param top       - top coordinates in pixels (not applicable if target is 'mainWindow')
     * @param left      - left coordinates in pixels (not applicable if target is 'mainWindow')
     */
    _local.openWindow = function(url, title, type, target, upi, width, height, callback, top, left) {
        var _qualifiedURL = _local.qualifyURL(url),
            _newWindowRef,
            _oldWindowRef,
            _target = (target === 'mainWindow' ? 'mainWindow' : 'pid_' + upi),
            _windows = _local.workspace.windows(),
            _recent = ko.utils.arrayFirst(_windows, function(item) {
                return item.upi() === upi;
            }),
            _width = width || 800,
            _height = height || 500,
            _left = left || 0,
            _top = top || 0,
            isFav = false,
            _callback = callback || function() {},
            frame,
            _instance;

        if (_target === 'mainWindow') {
            _local.hideWorkspace();
            _local.hideNavigator();
        }
        _newWindowRef = _local.getWindowReference('', _target, _width, _height, _left, _top);
        frame = _local.getFrame(_newWindowRef);
        if (_local.newWindowOkToOpen(_newWindowRef.location.href, _qualifiedURL)) {
            if (_target === 'mainWindow') {
                _local.addEvent(frame || _newWindowRef, 'load', function() {
                    var frameWindow = this.contentWindow;
                    framewindow.top = window;
                    frameWindow.upi = upi;
                    _callback.call(_newWindowRef);
                });
                _newWindowRef.location.replace(_qualifiedURL);
                _local.workspace.$mainWindowCloseBtn.show();
            } else {
                _newWindowRef.close();
                _newWindowRef = _local.getWindowReference(_qualifiedURL, _target, _width, _height, _left, _top);
                _newWindowRef.opener = window;
                _newWindowRef.upi = upi;
                _local.addEvent(frame || _newWindowRef, 'load', function() {
                    _newWindowRef.document.title = title;
                    _callback.call(_newWindowRef);
                });
            }
        } else { // url is already open in another window -- bring attention to that window -- move window and fade background color
            //_local.jiggleWindow(_newWindowRef, 120);
        }

        _newWindowRef.top.focus();

        //clean up old windows
        if (!!_recent) {
            isFav = _recent.isFav();
            if (_recent.target() !== _target) {
                _oldWindowRef = _local.getWindowReference('', _recent.target());
                if (_target !== 'mainWindow') {
                    _local.showWorkspace();
                    _local.hideNavigator();
                    _local.closeMainWindow(true);
                } else {
                    _oldWindowRef.close();
                }
            }

            _windows = _windows.filter(function(item) {
                return item.upi() != _recent.upi();
            });
        }
        _instance = new _local.Instance(_qualifiedURL, _target, type.toLowerCase(), title, upi, _width, _height, isFav, null, _newWindowRef, true);
        _instance.isOpen(true);
        _instance.isRecent(true);
        _windows.unshift(_instance);
        _local.workspace.windows(_windows);

        return _newWindowRef;
    };

    _local.newWindowOkToOpen = function(currentURLofTarget, newURLofTarget) {
        function diffInFirstString(a, b) {
            var diff = [];
            if (a && b) {
                for (var i = 0; i < a.length; i++) {
                    if (b.length > i) {
                        if (a[i] !== b[i]) {
                            diff.push(a[i]);
                        }
                    } else {
                        diff.push(a[i]);
                    }
                }
            } else if (!b && a) {
                diff.push(a);
            }
            return diff.join("");
        }
        if (_local.removeHash(currentURLofTarget) === _local.removeHash(newURLofTarget)) {
            return false;
        }
        // if existing window is already open in "edit" mode
        // if (diffInFirstString(currentURLofTarget, newURLofTarget) === 'edit') {
        //     return false;
        // }

        return true;
    };

    _local.close = function(upi) {
        var _instance;
        if (typeof upi === 'object') {
            _instance = upi;
        } else {
            _instance = ko.utils.arrayFirst(_local.workspace.windows(), function(item) {
                return item.upi() === upi;
            });
        }
        if (!!_instance) {
            if (_instance.target() !== 'mainWindow') {
                !!_instance.ref() && !_instance.ref().closed && _instance.ref().close();
            } else {
                !!_instance.ref() && (_instance.ref().location.href = 'about:blank');
                _local.workspace.$mainWindowCloseBtn.hide();
            }
            _instance.ref(undefined);
            _instance.isOpen(false);
        }
    };

    _local.closeAll = function(mode) {
        var filter,
            _ref;
        if (typeof mode != 'string') {
            filter = 'open';
        } else {
            filter = _local.workspace.activeSet();
        }

        ko.utils.arrayFilter(_local.workspace.windows(), function(win) {
            var _filter = _local.workspace.filters[filter].filter;
            for (var prop in _filter) {
                if (ko.unwrap(win[prop]) !== _filter[prop]) {
                    return false;
                }
            }
            _ref = win.ref();
            if (_ref) {
                console.log(_ref);
                if (_ref.name === 'mainWindow') {
                    _local.closeMainWindow(true);
                } else if (!!_ref && !_ref.closed) {
                    _ref.close();
                }
                if (mode != 'shutdown') {
                    win.ref(undefined);
                    win.isOpen(false);
                }
            }
        });
    };

    _local.closeMainWindow = function(preserveState) {
        var _mainWindowInstance = _local.currentMainWindowOccupant(),
            _next;
        if (!_mainWindowInstance) return;
        _local.close(_mainWindowInstance);
        _next = _local.getLastMainWindow();
        if (!_next || preserveState) {
            _local.showWorkspace();
            return;
        }
        _local.openWindow(_next.url, _next.title(), _next.type, _next.target(), _next.upi());
    };

    _local.getFrame = function(win) {
        try {
            // On IE, accessing the frameElement of a popup window results in a "No
            // Such interface" exception.
            return win.frameElement;
        } catch (e) {
            return null;
        }
    };

    _local.getWindowReference = function(url, name, width, height, left, top) {
        return window.open(url, name, 'width=' + width + ', height=' + height + ', resizable=1,scrollbars=1, left=' + left + ', top=' + top);
    };

    _local.persistWorkspace = function() {
        var _window = {},
            _workspace = [],
            _windows = _local.workspace.windows();
        //for (var i = _windows.length - 1; i >= 0; i--) {
        for (var i = 0, winLength = _windows.length; i < winLength; i++) {
            _window = $.extend({}, _windows[i]);
            delete _window.ref;
            if (!!~_local.displayableTypes.indexOf(_window.type) && (_window.isOpen() || _window.isFav())) _workspace.push(ko.toJS(_window));
        }
        store.set('workspace_' + _local.user()._id, _workspace);
    };

    _local.loadWorkspace = function() {
        return store.get('workspace_' + _local.user()._id) || [];
    };

    _local.restoreWorkspace = function() {
        var _windows = _local.loadWorkspace(),
            _mainOccupied = false,
            _instance,
            _reservedWindow;
        for (var i = 0, winLength = _windows.length; i < winLength; i++) {
            _instance = _windows[i];
            if (!_instance.isOpen && _instance.isFav) {
                _local.workspace.windows.push(new _local.Instance(_instance.url, _instance.target, _instance.type, _instance.title, _instance.upi, _instance.width, _instance.height, _instance.isFav, _instance.thumb, null, _instance.isRecent));
                continue;
            }
            if (_instance.target === 'mainWindow' && _mainOccupied) {
                _reservedWindow = new _local.Instance(_instance.url, _instance.target, _instance.type, _instance.title, _instance.upi, _instance.width, _instance.height, _instance.isFav, _instance.thumb, null, _instance.isRecent);
                _reservedWindow.isOpen(true);
                _local.workspace.windows.push(_reservedWindow);
                continue;
            }
            _local.openWindow(_instance.url, _instance.title, _instance.type, _instance.target, _instance.upi, _instance.width, _instance.height, _instance.isFav);
            _instance.target === 'mainWindow' && (_mainOccupied = true);
        }
    };

    _local.getLastMainWindow = function() {
        var _instance,
            i,
            len = _local.workspace.windows().length;
        for (i = 0; i < len; i++) {
            _instance = _local.workspace.windows()[i];
            if (_instance.target() === 'mainWindow' && _instance.isOpen()) {
                return _instance;
            }
        }
        return null;
    };

    _local.currentMainWindowOccupant = function() {
        return ko.utils.arrayFirst(_local.workspace.windows(), function(item) {
            return !!item.ref() && item.ref().name === 'mainWindow' && _local.removeHash(_local.workspace.mainWindow.contentWindow.location.href) === _local.removeHash(item.url);
        });
    };

    _local.timer = function(func, wait) {
        var _interval = function(w) {
            return function() {
                setTimeout(_interval, w);
                try {
                    func.call(null);
                } catch (e) {
                    //throw e.toString();
                }
            };
        }(wait);
        setTimeout(_interval, wait);
    };

    _local.windowMonitor = function() {
        for (var _i = 0, _len = _local.workspace.windows().length; _i < _len; _i++) {
            var _instance = _local.workspace.windows()[_i];
            if (!!_instance.ref() && _instance.target() !== 'mainWindow' && _instance.ref().closed) _local.close(_instance.upi());
        }
    };

    _local.Instance = function(url, target, type, title, upi, width, height, isFav, thumb, ref, isRecent) {
        var _self = this;
        _self.url = _local.qualifyURL(url);
        _self.target = ko.observable(target);
        _self.type = type;
        _self.title = ko.observable(title);
        _self.upi = ko.observable(upi);
        _self.width = ko.observable(width);
        _self.height = ko.observable(height);
        _self.isFav = ko.observable(isFav);
        _self.thumb = ko.observable(thumb);
        _self.ref = ko.observable(ref);
        _self.isRecent = ko.observable(isRecent);
        _self.isOpen = ko.observable(false);
    };

    _local.qualifyURL = function(url) {
        var _qualifyingAnchor = document.createElement('a'),
            _qualifiedURL;
        _qualifyingAnchor.href = url;
        _qualifiedURL = _qualifyingAnchor.href;
        return _qualifiedURL;
    };
    _local.removeHash = function(url) {
        return url.split('#')[0];
    };
    _local.createUniqueId = function() {
        return Math.random().toString(36).slice(2);
    };

    _local.initializeEventListeners = function() {
        //set thumb listeners
        _local.$workspace.on('mouseenter', '.thumb', function(e) {
            var $thumb = $(this),
                $controls = $thumb.find('.thumbControls');
            $controls.data('right', -($controls.outerWidth()));
            $controls.animate({
                right: 0
            }, {
                duration: 150,
                easing: 'easeOutQuint'
            });
        });
        _local.$workspace.on('mouseleave', '.thumb', function(e) {
            var $thumb = $(this),
                $controls = $thumb.find('.thumbControls');
            $controls.stop(true, true).animate({
                right: $controls.data('right')
            }, {
                duration: 150,
                easing: 'easeInQuint'
            });
        });
        //_local.addEvent(_local.workspace.mainWindow, 'load', function(){ _local.workspace.mainWindow.contentWindow.openWindow = _local.openWindow; });
    };
    _local.loadNavigator = function() {
        var _nav = window.open('/pointlookup', 'navigator');
        _local.addEvent(document.getElementById('navigator'), 'load', function() {
            _nav.pointLookup.init();
        });
    };

    _local.login = {
        username: ko.observable('').extend({
            required: {
                message: 'Please enter a valid username'
            }
        }),
        password: ko.observable('').extend({
            required: {
                message: 'Please enter a password'
            }
        }),
        rememberMe: ko.observable(false),
        errorMessage: ko.observable(''),
        isLogIn: ko.observable(false),
        oldPassword: ko.observable('').extend({
            required: {
                message: 'Please enter the current password'
            }
        }),
        newPassword1: ko.observable('').extend({
            required: {
                message: 'Please enter a valid new password'
            }
        }).extend({
            validation: {
                validator: function(val, local) {
                    return val !== local.login.oldPassword();
                },
                message: 'New and old password can not be the same',
                params: _local
            }
        }),
        newPassword2: ko.observable('').extend({
            required: {
                message: 'Please retype the new password'
            }
        }).extend({
            validation: {
                validator: function(val, local) {
                    return val === local.login.newPassword1();
                },
                message: 'Passwords must match',
                params: _local
            }
        }),
        signIn: function() {
            var $btnSignIn = $('button.signIn');

            $btnSignIn.focus();

            _local.loginValidation.showAllMessages();
            if (!_local.login.username.isValid()) {
                $('input.input-validation-error:first').focus();
                return;
            }
            if (!_local.login.password.isValid()) {
                $('input.input-validation-error:first').focus();
                return;
            }
            $btnSignIn.attr('disabled', 'disabled');
            console.log(_local);
            $.ajax({
                url: _local.webEndpoint + '/authenticate',
                contentType: 'application/json',
                dataType: 'json',
                type: 'post',
                data: (ko.toJSON({
                    username: this.username(),
                    password: this.password(),
                    'remember-me': this.rememberMe().toString()
                }))
            }).done(
                function(data) {
                    var $login = $('#login'),
                        sessionId;
                    $btnSignIn.removeAttr('disabled');
                    if (!!data.resetPass) {
                        _local.login.errorMessage(data.message);
                        _local.login.isLogIn(false);
                        $('#oldPassword').focus();
                        return;
                    }
                    if (!!data.message) {
                        _local.login.errorMessage(data.message);
                        return;
                    }
                    if (!!data.err) {
                        _local.login.errorMessage(data.err);
                        return;
                    }
                    if (!!data._id) {
                        window.userData = data;
                        _local.login.setupAutoLogout(window.userData);
                        sessionId = base64.encode(new Date().getTime().toString().split('').reverse().join(''));
                        store.set('sessionId', sessionId);
                        $('#appContainer').show();
                        if ($.support.transition) {
                            $login
                                .css('overflow', 'hidden')
                                .find('fieldset')
                                .transition({
                                        y: 1000
                                    }, 350, 'easeInExpo',
                                    function() {
                                        $login.transition({
                                            opacity: 0,
                                            y: 51
                                        }, 500, 'snap');
                                        _local.load();
                                    }
                                );
                        } else {
                            $login
                                .css('overflow', 'hidden')
                                .find('fieldset')
                                .animate({
                                        top: 1000
                                    }, 500, 'easeInExpo',
                                    function() {
                                        $login.animate({
                                            opacity: 0,
                                            top: 51
                                        }, 500, 'easeInExpo');
                                        _local.load();
                                    }
                                );
                        }
                    }
                }
            );
        },
        setupAutoLogout: function(userData) {
            var start = new Date(),
                idleTimeout = userData.idleTimeout,
                sessionLength = userData.sessionLength,
                sessionEnd,
                sessionWarning,
                idleTime = 0,
                sentIdleAlert = false,
                sentSessionAlert = false;

            sessionEnd = new Date(start.getTime() + sessionLength * 60000);
            sessionWarning = new Date(sessionEnd.getTime() - (15 * 60000));
            $(document).ready(function() {
                $(this).mousemove(function(e) {
                    idleTime = 0;
                    sentIdleAlert = false;
                });
                $(this).keypress(function(e) {
                    idleTime = 0;
                    sentIdleAlert = false;
                });
            });

            if (idleTimeout > 0) {
                var idleInterval = setInterval(function() {
                    idleTime++;
                    if (idleTime > idleTimeout) {
                        // console.log('idle signout', new Date(), new Date() - start);
                        window.location.href = "/logout";
                    } else if ((idleTime > (idleTimeout - 5)) && !sentIdleAlert) {
                        alert('You will be automatically logged out in 5 minutes due to inactivity.');
                        sentIdleAlert = true;
                    }
                }, 60 * 1000);
            }

            if (sessionLength > 0) {
                var sessionInterval = setInterval(function() {
                    // console.log(new Date(), sessionWarning, (new Date() > sessionWarning));
                    if (new Date() > sessionEnd) {
                        console.log('session signout', new Date(), new Date() - start);
                        window.location.href = "/logout";
                    } else if ((new Date() > sessionWarning) && !sentSessionAlert) {
                        sentSessionAlert = true;
                        alert('You will be automatically logged out in 15 minutes. Please save your work.');
                    }
                }, 60 * 1000);
            }
        },
        passwordReset: function() {
            var $btnResetPass = $('button.resetPass');
            var self = this;

            $btnResetPass.focus();

            _local.passResetValidation.showAllMessages();
            if (!_local.login.oldPassword.isValid()) {
                $('input.input-validation-error:first').focus();
                return;
            }
            if (!_local.login.newPassword1.isValid()) {
                $('input.input-validation-error:first').focus();
                return;
            }
            if (!_local.login.newPassword2.isValid()) {
                $('input.input-validation-error:first').focus();
                return;
            }
            $btnResetPass.attr('disabled', 'disabled');

            $.ajax({
                url: _local.webEndpoint + '/reset-password',
                contentType: 'application/json',
                dataType: 'json',
                type: 'post',
                data: (ko.toJSON({
                    username: this.username(),
                    oldPass: this.oldPassword(),
                    newPass: this.newPassword1()
                }))
            }).done(
                function(data) {
                    console.log(data);
                    var $login = $('#login'),
                        sessionId;
                    $btnResetPass.removeAttr('disabled');
                    if (!!data.message) {
                        _local.login.errorMessage(data.message);
                        _local.login.isLogIn(true);
                        _local.login.username('');
                        _local.login.password('');
                        _local.login.oldPassword('');
                        _local.login.newPassword1('');
                        _local.login.newPassword2('');
                        $('#user').focus();
                        _local.loginValidation.showAllMessages(false);
                        return;
                    }
                    if (!!data.err) {
                        _local.login.errorMessage(data.err);
                        return;
                    }

                }
            );
        }
    };

    _local.login.animate = ko.computed(function() {
        var $errMsg = $('#login').find('.errorMessage'),
            _vm = this;
        if (!!_vm.errorMessage()) {
            _vm.timer && clearTimeout(_vm.timer);
            _vm.timer = setTimeout(function() {
                $errMsg
                    .removeClass('flipInX')
                    .fadeOut(500, function() {
                        _vm.errorMessage('');
                    });
            }, 3000);
            return 'flipInX';
        }
        return '';
    }, _local.login);

    _local.loginValidation = ko.validation.group([_local.login.username, _local.login.password], {
        deep: false
    });
    _local.passResetValidation = ko.validation.group([_local.login.oldPassword, _local.login.newPassword1, _local.login.newPassword2], {
        deep: false
    });

    _local.getSystemEnum = function(enumType, callback) {
        return $.ajax({
            url: _local.apiEndpoint + 'system/' + enumType,
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

                _local.systemEnums[enumType] = _array;
                _local.systemEnumObjects[enumType] = _object;
                if (callback) callback(_array);
            }
        ).fail(
            function(jqXHR, textStatus) {
                console.log('Get system enum (' + enumType + ') failed', jqXHR, textStatus);
                // Set an empty array/object for code looking @ systemEnums[enumType]
                // TODO Try again or alert the user and stop
                _local.systemEnums[enumType] = [];
                _local.systemEnumObjects[enumType] = {};
            }
        );
    };

    _local.addEvent = function(element, event, fn) {
        if (element.addEventListener) {
            element.addEventListener(event, fn, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + event, fn);
        }
    };

    _local.removeEvent = function(element, event, fn) {
        if (element.removeEventListener) {
            element.removeEventListener(event, fn, false);
        } else if (element.detachEvent) {
            element.detachEvent('on' + event, fn);
        }
    };

    _local.readCookie = function(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    _local.createCookie = function(name, value, days) {
        var date = new Date(),
            expires = '; expires=' + date.toGMTString();
        if (days) {
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        } else {
            expires = "";
        }
        document.cookie = name + '=' + value + expires + '; path=/';
    };

    _local.captureThumbnail = function(obj) {
        var upi = obj.upi,
            name = obj.name,
            type = obj.type,
            init = function() {
                var gen = _local.thumbnailWindowRef.thumbnailGenerator;
                console.log('wsm init thumbnail');
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
            };

        if (!_local.thumbnailWindowRef) {
            _local.thumbnailWindowRef = _local.openWindowPositioned(window.location.origin + '/thumbnail/' + upi, 'Capture Thumbnail', '', 'thumbnailframe', 'thumbnailframe', {
                callback: init,
                width: 10,
                height: 10
            });
        } else {
            init();
        }
    };

    /**
     * @param options
     *          targetDocument  - [optional] target document reference; defaults to workspace's document reference
     *          title           - [optional] Title text; html accepted; placed in modal's header area; hidden if not used
     *          message         - [optional] Confirmation message text; html accepted; defaults to 'Are you sure you want to do this?'
     *          okText          - [optional] OK button text string; defaults to 'OK'
     *          okClass         - [optional] Bootstrap button class to apply; defaults to 'btn-primary'
     *          cancelText      - [optional] Cancel button text string; defaults to 'Cancel'
     *          cancelClass     - [optional] Bootstrap button class to apply; defaults to 'btn-default'
     *          callback        - [optional] Executed after confirmation is dismissed; called with a single boolean argument (true=ok, false=cancel)
     */
    _local.showConfirmation = function(_options) {
        var options = _options || {},
            content = '<div id="confirm" data-backdrop="static" data-keyboard="false" class="modal fade"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"></div><div class="modal-body"></div><div class="modal-footer"><button type="button" class="btn btn-default cancel">Cancel</button><button type="button" class="btn btn-primary ok">OK</button></div></div></div></div>',
            target = options.targetDocument || document,
            $target = $(target),
            $preConfirm = $target.find('#confirm'),
            $confirm = $preConfirm.length ? $preConfirm : $target.find('body').append(content) ? $target.find('#confirm') : $(),
            $modalHeader = $confirm.find('.modal-header'),
            $modalBody = $confirm.find('.modal-body'),
            $okBtn = $confirm.find('.btn.ok'),
            $cancelBtn = $confirm.find('.btn.cancel'),
            btnClassNames = ['btn-default', 'btn-primary', 'btn-success', 'btn-info', 'btn-warning', 'btn-danger'],
            okClass = btnClassNames.indexOf(options.okClass) > -1 ? options.okClass : 'btn-primary',
            cancelClass = btnClassNames.indexOf(options.cancelClass) > -1 ? options.cancelClass : 'btn-default',
            callback = function(result) {
                // Remove button event handlers
                $okBtn.off();
                $cancelBtn.off();

                // Hide the modal
                $confirm.modal('hide');
                $target.find('.modal-backdrop').remove();

                // Make the callback
                options.callback && options.callback(result);
            };

        // Remove previoulsy attached handlers and attach click handlers to our ok/cancel buttons
        $okBtn.off().on('click', function() {
            callback(true);
        });
        $cancelBtn.off().on('click', function() {
            callback(false);
        });

        // Add the confirmation title or hide if unused
        if (options.title) {
            $modalHeader.show();
            $modalHeader.html(options.title);
        } else {
            $modalHeader.hide();
        }
        $modalBody.html(options.message || 'Are you sure you want to do this?');

        $okBtn.text(options.okText || 'OK');
        $okBtn.removeClass(btnClassNames.join(' ')).addClass(okClass);

        $cancelBtn.text(options.cancelText || 'Cancel');
        $cancelBtn.removeClass(btnClassNames.join(' ')).addClass(cancelClass);

        // We manually add/remove the backdrop because bootstrap always adds it to its own document
        $target.find('body').append('<div class="modal-backdrop fade in"></div>');

        $confirm.modal({
            backdrop: false,
            show: true
        });
    };

    /**
     * @param sound - string indicating what sound byte to play. Available sounds stored in _local.sounds
     */
    _local.playSound = function(sound) {
        sound = _local.sounds[sound];
        if (!sound) {
            return;
        }
        sound = new Audio(sound);
        sound.play();
    };

    var base64 = (function() {
        "use strict";
        var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        var _utf8_encode = function(string) {
            var utftext = "",
                c, n;

            string = string.replace(/\r\n/g, "\n");

            for (n = 0; n < string.length; n++) {
                c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                } else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                } else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        };

        var _utf8_decode = function(utftext) {
            var string = "",
                i = 0,
                c = 0,
                c1 = 0,
                c2 = 0;
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                } else if ((c > 191) && (c < 224)) {
                    c1 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
                    i += 2;
                } else {
                    c1 = utftext.charCodeAt(i + 1);
                    c2 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
                    i += 3;
                }
            }
            return string;
        };

        var encode = function(input) {
            var output = "",
                chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
            console.log(input);
            input = _utf8_encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output += _keyStr.charAt(enc1);
                output += _keyStr.charAt(enc2);
                output += _keyStr.charAt(enc3);
                output += _keyStr.charAt(enc4);
            }
            return output;
        };

        var decode = function(input) {
            var output = "",
                chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = _keyStr.indexOf(input.charAt(i++));
                enc2 = _keyStr.indexOf(input.charAt(i++));
                enc3 = _keyStr.indexOf(input.charAt(i++));
                enc4 = _keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output += String.fromCharCode(chr1);

                if (enc3 !== 64) {
                    output += String.fromCharCode(chr2);
                }
                if (enc4 !== 64) {
                    output += String.fromCharCode(chr3);
                }
            }
            return _utf8_decode(output);
        };

        return {
            'encode': encode,
            'decode': decode
        };
    }());

    return {
        init: _local.init,
        showConfirmation: _local.showConfirmation,
        captureThumbnail: _local.captureThumbnail,
        playSound: _local.playSound,
        focusWindow: _local.focusWindow,
        openWindow: _local.openWindow,
        openWindowPositioned: _local.openWindowPositioned,
        user: function() {
            return JSON.parse(JSON.stringify(_local.user()));
        },
        windows: _local.workspace.windows,
        config: window.Config,
        systemEnums: _local.systemEnums,
        systemEnumObjects: _local.systemEnumObjects,
        sessionId: function() {
            return store.get('sessionId');
        },
        socket: function() {
            return _local.socket;
        }
    };
})(jQuery);


$(workspaceManager.init);


//ko utility functions
ko.observableArray.fn.filterByProperty = function(propName, matchValue) {
    return ko.computed(function() {
        var allItems = this(),
            matchingItems = [];
        for (var i = 0; i < allItems.length; i++) {
            var current = allItems[i];
            if (ko.unwrap(current[propName]) === matchValue)
                matchingItems.push(current);
        }
        return matchingItems;
    }, this);
};

//{prop:'', val''}
ko.observableArray.fn.filterByProperties = function(filters) {
    return ko.computed(function() {
        var allItems = this(),
            matchingItems = [];
        for (var i = 0; i < allItems.length; i++) {
            var current = allItems[i];
            for (var j = 0; j < filters.length; j++) {
                if (ko.unwrap(current[filters[j].prop]) !== filters[j].val) {
                    break;
                }
                if (j === filters.length - 1) matchingItems.push(current);
            }
        }
        return matchingItems;
    }, this);
};

ko.bindingHandlers.setMaxHeight = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var $element = $(element),
            value = valueAccessor(),
            allBindings = allBindingsAccessor(),
            height = ko.utils.unwrapObservable(value),
            reduceBy = allBindings.reduceBy || 0,
            reduceByOffsetElement = allBindings.reduceByOffsetElement,
            elementOffset = 0,
            $offsetElement;

        if (typeof reduceByOffsetElement != 'undefined') {
            $offsetElement = $(reduceByOffsetElement);
            $element.add($element.parentsUntil($offsetElement)).each(function() {
                elementOffset += $(this).position().top;
            });
        }
        $(element).css('max-height', height - reduceBy - elementOffset);
    }
};

ko.bindingHandlers.fadeInText = {
    update: function(element, valueAccessor) {
        var text = valueAccessor();
        $(element).fadeOut(100, function() {
            ko.bindingHandlers.text.update(element, valueAccessor);
            $(element).fadeIn('fast');
        });
    }
};

ko.bindingHandlers.dataSrc = {
    update: function(element, valueAccessor) {
        var upi = valueAccessor()(),
            $element = $(element),
            $bg = $element.parent(),
            $icon = $bg.find('.thumbIcon');

        $.ajax({
                url: '/img/thumbs/' + upi + '.txt',
                dataType: 'text',
                type: 'get'
            })
            .done(
                function(file) {
                    var data = file.split('||'),
                        bgColor = data[0],
                        image = data[1];
                    $element.attr('src', image);
                    if (bgColor != 'undefined') $bg.css('background-color', bgColor);
                }
            )
            .fail(
                function() {
                    $element.hide();
                    $icon.show();
                }
            );
    }
};