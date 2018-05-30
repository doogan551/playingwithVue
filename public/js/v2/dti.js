var dti = dti || {
    _bodyClickHandlers: [],
    _bodyClickCount: 0,
    _bodyClickTime: 0,
    settings: {
        logLevel: 'debug'
    },
    bodyClick: function (fn) {
        dti._bodyClickHandlers.push(fn);
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
    _events: {},
    _onceEvents: {},
    on (event, handler) {
        dti._events[event] = dti._events[event] || [];
        dti._events[event].push(handler);
    },
    once (event, handler) {
        dti._onceEvents[event] = dti._onceEvents[event] || [];
        dti._onceEvents[event].push(handler);
    },
    off (event, handler) {
        var handlers = dti._events[event] || [];

        dti.forEachArray(handlers, function processOffHandler (fn, idx) {
            if (fn === handler) {
                dti._events[event].splice(idx, 1);
                return false;
            }
        });
    },
    fire (event, obj1, obj2) {
        var handlers = dti._events[event] || [],
            onceHandlers = dti._onceEvents[event] || [];

        dti.forEachArray(handlers, function fireEventHandlers (handler) {
            handler(obj1 || null, obj2 || null);
        });

        dti.forEachArray(onceHandlers, function fireOnceEvent (handler) {
            handler(obj1 || null, obj2 || null);
        });

        dti._onceEvents[event] = [];
    },
    logging: {
        logHistory: [],
        logLevels: {
            none: 0,
            debug: 1,
            trace: 2
        },
        addLog(message, level) {
            let safe = true;
            let output = [];
            dti.forEachArray(message, (entry) => {
                output.push(entry);
            });

            let stringMessage = JSON.stringify(output);
            dti.logging.logHistory.push({
                message: stringMessage,
                level
            });
        },
        showLogs(level) {
            let pad = (num) => {
                return ('     ' + num).slice(-5);
            };
            dti.forEachArray(dti.logging.logHistory, (log) => {
                if (!!level) {
                    if (log.level !== level) {
                        return;
                    }
                }

                let logLevel = '(' + pad(log.level) + ')';
                let args = [logLevel].concat(log.message);

                console.log.apply(console, args);
            });
        },
        getLogMessage(args) {
            var stack,
                steps,
                lineNumber,
                err,
                now = new Date(),
                message = [].splice.call(args, 0),
                pad = function (num) {
                    return ('    ' + num).slice(-4);
                },
                formattedtime = dti.formatDate(new Date(), true);

            if (dti.settings.logLinePrefix === true) {
                err = new Error();
                if (Error.captureStackTrace) {
                    Error.captureStackTrace(err);

                    //entry 5 in the stack
                    stack = err.stack.split('\n')[4];

                    steps = stack.split(':');

                    lineNumber = steps[2];

                    // args.unshift('gap:' + pad(now - dti._lastLog));

                    message.unshift('line:' + pad(lineNumber), formattedtime);
                }
            }

            return message;
        },
        isValidLog(level) {
            let logLevel = dti.logging.logLevels[level.toLowerCase()] || 1;
            let appLogLevel = dti.logging.logLevels[dti.settings.logLevel.toLowerCase()] || 1;

            if (logLevel <= appLogLevel) {
                return true;
            }

            return false;
        },
        log (args, level) {
            let message = dti.logging.getLogMessage(args);

            if (dti.logging.isValidLog(level)) {
                console.log.apply(console, message);
            }

            dti.logging.addLog(message, level);

            dti.logging._lastLog = new Date().getTime();
        }
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
    trace() {
        dti.logging.log(arguments, 'trace');
    },
    log() {
        dti.logging.log(arguments, 'debug');
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
            if (!!$el[0]) {
                $el[0].style.willChange = 'opacity, display';
            }
            $el.css('display', 'block');
            dti.animations._fade($el, 1, cb);
        },
        fadeOut: function ($el, cb) {
            dti.animations._fade($el, 0, function finishFadeOut() {
                $el.css('display', 'none');
                $el[0].style.willChange = '';
                if (cb) {
                    cb();
                }
            });
        },
        _scaleOld: ($el, type, cb) => {
            let animType;
            let destScale;
            let startScale;

            $el.velocity('stop');

            if (type === 'in') {
                animType = 'easeOut';
                destScale = 1;
                startScale = 0;
                $el.addClass('active');
            } else {
                animType = 'easeIn';
                destScale = 0;
                startScale = 1;
                $el.removeClass('active');
            }

            let opts = [{
                scale: [destScale, startScale]
            }, {
                queue: false,
                easing: animType,
                duration: 200,
                complete: () => {
                    if (cb) {
                        cb();
                    }
                }
            }];

            // if (startScale === 0) {
            //     opts[0].display = 'block';
            // }

            $el.velocity.apply($el, opts);

            $el[0].style.display = 'block';
        },
        _scale: ($el, $container, type, cb) => {
            let animType;
            let destHeight;
            let destWidth;
            let startHeight;
            let startWidth;
            let duration = 150;
            let smallDuration = 100;

            $el.velocity('stop');

            if (type === 'in') {
                animType = 'easeOut';
                destHeight = $container && parseInt($container.css('height'));
                destWidth = $container && parseInt($container.css('width'));
                startWidth = startHeight = 0;
                $el.addClass('active');
            } else {
                animType = 'easeIn';
                startHeight = $container && parseInt($container.css('height'));
                startWidth = $container && parseInt($container.css('width'));
                destWidth = destHeight = 0;
                $el.removeClass('active');
            }

            let max = Math.max(Math.max(destWidth, startWidth), Math.max(destHeight, startHeight));

            // dti.log('duration', max < duration ? smallDuration: duration);

            let opts = [{
                width: [destWidth, startWidth],
                height: [destHeight, startHeight]
            }, {
                queue: false,
                easing: animType,
                duration: max < duration ? smallDuration: duration,
                complete: () => {
                    if (cb) {
                        cb();
                    }
                }
            }];

            // if (startScale === 0) {
            //     opts[0].display = 'block';
            // }

            $el.velocity.apply($el, opts);

            $el[0].style.display = 'block';
        },
        scaleIn: ($el, $container, cb) => {
            dti.animations._scale($el, $container, 'in', cb);
        },
        scaleOut: ($el, $container, cb) => {
            dti.animations._scale($el, $container, 'out', cb);
        },
        slideUp: function($el, cb) {
            $el[0].style.willChange = 'height, padding-top, padding-bottom';
            $el.css('overflow', 'hidden');
            $el.velocity('stop');
            $el.velocity({
                height: 0,
                'padding-top': 0,
                'padding-bottom': 0
            }, {
                queue: false,
                duration: 150,
                easing: 'easeIn',
                complete: function finishSlideUp() {
                    $el.css('display', 'none');
                    $el[0].style.willChange = '';
                    if (cb) {
                        cb();
                    }
                }
            });
        }
    }
};

$(() => {
    // Setup listener for body clicks
    $('body').mousedown(function handleBodyMouseDown(event) {
        let start = new Date();
        dti.forEachArray(dti._bodyClickHandlers, function bodyMouseDownHandler(handler) {
            var $target = $(event.target);

            handler(event, $target);
        });
        dti._bodyClickCount++;
        dti._bodyClickTime += new Date() - start;
    });
});