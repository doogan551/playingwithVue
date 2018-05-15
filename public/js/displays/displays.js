let __el = function (el) {
    return el instanceof $ ? el[0] : el instanceof HTMLElement ? el : null;
};
let kodt = function (obj = window.$0) {
    return ko.dataFor(__el(obj));
};
let kojs = function (obj = window.$0, depth = 0) {
    let el = __el(obj);

    let data = el ? kodt(obj) : obj;

    let cycle = function (item) {
        let ret = {};

        dti.forEach(item, (val, prop) => {
            let kval = koUnwrap(val);

            if (kval === null || kval === undefined) {
                ret[prop] = kval;
            } else {
                if (kval instanceof $) {
                    ret[prop] = kval;
                } else {
                    if (Array.isArray(kval)) {
                        let tmpArr = [];
                        ret[prop] = tmpArr;
                        dti.forEachArray(kval, (innerVal) => {
                            let kinnerVal = koUnwrap(innerVal);
                            tmpArr.push(kojs(kinnerVal, depth + 1));
                        });
                    } else if (typeof kval === 'object') {
                        let tmpObj = {};
                        ret[prop] = tmpObj;
                        dti.forEach(kval, (innerVal, innerProp) => {
                            let kinnerVal = koUnwrap(innerVal);
                            tmpObj[innerProp] = kojs(kinnerVal, depth + 1);
                        });
                    } else {
                        ret[prop] = koUnwrap(kval);
                    }
                }
            }
        });

        return ret;
    };

    // skip nested element references (maximum call stack exceeded error)
    if (!!el && depth > 0) {
        return obj;
    }

    let kdata = koUnwrap(data);

    if (Array.isArray(kdata)) {
        let tempArr = [];
        dti.forEachArray(kdata, (obj, idx) => {
            let kobj = koUnwrap(obj);
            tempArr.push(kojs(kobj, depth + 1));
        });
        return tempArr;
    }

    if (typeof kdata === 'object') {
        return cycle(kdata);
    }

    return kdata;
};
let koct = function (obj = window.$0) {
    return ko.contextFor(__el(obj));
};
let koUnwrap = function (value) {
    return ko.utils.unwrapObservable(value);
};
let dti = {
    itemIdx: 0,
    settings: {
        isNew: false,
        pauseDatePick: false,
        delayLoad: true,
        logLinePrefix: true,
        logLevel: 'trace',
        webEndpoint: window.location.origin,
        socketEndPoint: window.location.origin,
        apiEndpoint: window.location.origin + '/api/',
        idxPrefix: 'dti_',
        sessionId: btoa(new Date().getTime().toString().split('').reverse().join(''))
    },
    placeholder: (() => {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; 

        for (let c = 0; c < 8; c++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    })(),
    emptyFn() {return;},
    //per window
    onLoadFn (cb = () => {return;}) {
        if (window.onLoadFn) {
            dti.onLoadFnCalled = true;
            window.onLoadFn();
            setTimeout(() => {
                cb();
            });
        } else {
            let interval = setInterval(() => {
                if (window.onLoadFn) {
                    dti.onLoadFnCalled = true;
                    window.onLoadFn();
                    setTimeout(() => {
                        cb();
                    });
                    clearInterval(interval);
                }
            }, 100);
        }
    },
    _onLoadedFns: [],
    onLoaded (cb) {
        if (displays.loaded === true) {
            if (Array.isArray(cb)) {
                dti.forEachArray(cb, (fn) => {
                    fn();
                });
            } else {
                cb();
            }
        } else {
            if (Array.isArray(cb)) {
                dti._onLoadedFns =  dti._onLoadedFns.concat(cb);
            } else {
                dti._onLoadedFns.push(cb);
            }
        }
    },
    updateModel (vm, model) {
        dti.forEach(vm, (obs, name) => {
            let prop = koUnwrap(model[name]);

            if (prop !== undefined) {
                obs(prop);
            }
        });
    },
    makeId () {
        dti.itemIdx++;
        return dti.settings.idxPrefix + dti.itemIdx;
    },
    destroyObject (o, recursive) {
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
    uniqueArray (arr) {
        let unique = [];

        dti.forEachArray(arr, (item) => {
            if (unique.indexOf(item) === -1) {
                unique.push(item);
            }
        });

        return unique;
    },    
    arrayEquals (a, b) {
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
    forEach (obj, fn, isClass) {
        let keys = obj && Object.keys(obj) || [];
        let errorFree = true;

        if (isClass) {
            let classKeys = Object.getOwnPropertyNames(obj.constructor.prototype);
            keys = keys.concat(classKeys);
        }
        
        let len = keys.length;

        for (let c = 0; c < len && errorFree; c++) {
            errorFree = fn(obj[keys[c]], keys[c], c);
            if (errorFree === undefined) {
                errorFree = true;
            }
        }

        return errorFree;
    },
    forEachArray (arr, fn) {
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
    forEachArrayRev (arr, fn) {
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
    clone (toCopy) {
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
            },
            copyFunction = function () {
                if (ko.isObservable(toCopy)) {
                    ret = ko.observable(koUnwrap(toCopy));
                } else {
                    ret = toCopy;
                }
            };

        switch (typeof toCopy) {
            case 'object':
                copyObject();
                break;
            case 'function':
                copyFunction();
                break;
            default:
                basic();
                break;
        }

        return ret;
    },
    // shamelessly stolen from underscore
    debounce (func, wait, immediate) {
        var timeout, args, context, timestamp, result;

        var later = function () {
            var last = Date.now() - timestamp;

            if (last < wait && last > 0) {
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                }
            }
        };

        return function () {
            context = this;
            args = arguments;
            timestamp = Date.now();
            var callNow = immediate && !timeout;
            if (!timeout) timeout = setTimeout(later, wait);
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }

            return result;
        };
    },
    throttle (func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) options = {};
        var later = function () {
            previous = options.leading === false ? 0 : Date.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function () {
            var now = Date.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    },
    updateFromModel(viewModel, model) {
        //assumes only one level
        let input = kojs(model);
        let unpause = [];

        dti.forEach(input, (val, prop) => {
            if (typeof val === 'function') {
                viewModel[prop] = val;
            } else if (val instanceof $) {
                viewModel[prop] = val;
            } else {
                let target = viewModel[prop];    
                if (target) {
                    if (ko.isObservable(target)) {
                        // target.withPausing();
                        // unpause.push(target);
                        // target.silentUpdate(val);
                        target(val);
                    } else {
                        // dti.log('found non-observable property: ', prop);

                        // is plain object
                        if (val.constructor === Object.constructor) {
                            viewModel[prop] = dti.clone(val);
                        } else {
                            //is other object.  class?
                            viewModel[prop] = val;
                        }
                    }
                } else {
                    viewModel[prop] = ko.observable(val);    
                }
            }
        });

        // dti.forEachArray(unpause, (obs) => {
        //     obs.valueHasMutated();
        // });
    },
    merge(dest, src, clone) {
        dti.forEach(src, (val, prop) => {
            if (dest[prop] === undefined) {
                if (!clone) {
                    dest[prop] = val;
                } else {
                    dest[prop] = dti.clone(prop);
                }
            }
        });
    },
    formatDate (date, addSuffix) {
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
    _gapTimers: {},
    _gapTimerSteps: {},
    // used when you want to time one or more functions.  
    // just pass the name when you want to start
    // call timeGapPause with that name to 'pause' it
    // call timegapend to end that timer, clear it out, and optionally log the gap
    timeGap: (name) => {
        let start = new Date();

        //just started
        if (dti._gapTimers[name] === undefined) {
            dti._gapTimers[name] = 0;
        }

        if (dti._gapTimerSteps[name] === undefined) {
            dti._gapTimerSteps[name] = start;
        }
    },
    timeGapPause: (name) => {
        let start = new Date();
        let step = start - dti._gapTimerSteps[name];

        dti._gapTimers[name] += step;  

        delete dti._gapTimerSteps[name];
    },
    timeGapEnd: (name, skipLog) => {
        let end = new Date();
        let gap = dti._gapTimers[name];

        if (!skipLog) {
            dti.log(name + ':', gap);
        }

        delete dti._gapTimers[name];

        return gap;
    },
    timeGapEndAll: () => {
        dti.forEach(dti._gapTimers, (time, name) => {
            dti.timeGapEnd(name);
        });
    },
    // a dti version of console.time to get specific one-off timers
    _timers: {},
    time: (name) => {
        let start = new Date();

        dti._timers[name] = start;
    },
    timeEnd: (name, skipLog) => {
        let end = new Date();
        let gap = end - dti._timers[name];

        if (!skipLog) {
            dti.log(name + ':', gap);
        }

        delete dti._timers[name];

        return gap;
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
                if (typeof entry === 'object') {
                    if (dti.settings.logObjects === true) {
                        let clean = dti.deCycleObject(entry);
                        output.push(clean);
                    }
                } else {
                    output.push(entry);
                }
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
    trace() {
        dti.logging.log(arguments, 'trace');
    },
    log() {
        dti.logging.log(arguments, 'debug');
    },
    events: {
        init: function () {
            // Setup listener for body clicks
            $('body').mousedown(function handleBodyMouseDown(event) {
                let start = new Date();
                dti.forEachArray(dti.events._bodyClickHandlers, function bodyMouseDownHandler(handler) {
                    var $target = $(event.target);

                    handler(event, $target);
                });
                dti.events._bodyClickCount++;
                dti.events._bodyClickTime += new Date() - start;
            });
        },
        _bodyClickHandlers: [],
        _bodyClickCount: 0,
        _bodyClickTime: 0,
        bodyClick: function (fn) {
            dti.events._bodyClickHandlers.push(fn);
        },
        offBodyClick: function (offFn) {
            dti.forEachArray(dti.events._bodyClickHandlers, (fn, i) => {
                if (fn === offFn) {
                    dti.events._bodyClickHandlers.splice(i, 1);
                    return false; // Stop iterating
                }
            });
        }
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
    $ (fn) {
        $(function delayLoadFn () {
            setTimeout(function runInit () {
                fn();
            }, 100);
        });
    },
    post(config) {
        return $.ajax({
            url: config.url,
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(config.data)
        });
    },
    animations: {
        tempinit () {
            $(window).focus(function () {
                console.log('Focus');
            });

            $(window).blur(function () {
                console.log('Blur');
            });
        },
        _fade ($el, opacity, cb) {
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
        fadeIn ($el, cb) {
            $el[0].style.willChange = 'opacity, display';
            $el.css('display', 'block');
            dti.animations._fade($el, 1, cb);
        },
        fadeOut ($el, cb) {
            dti.animations._fade($el, 0, function finishFadeOut () {
                $el.css('display', 'none');
                $el[0].style.willChange = '';
                if (cb) {
                    cb();
                }
            });
        },
        slideUp ($el, cb) {
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
    }
};

let BaseWidget = class Widget {
    constructor(cfg) {
        // dti.timeGap('widget');
        this.cfg = cfg;

        // dti.timeGap('widget config');
        this.initConfig();
        // dti.timeGapPause('widget config');

        // dti.timeGap('widget bindings');
        this.initBindings();
        // dti.timeGapPause('widget bindings');

        // dti.timeGap('widget postinit');
        this.postInit();
        // dti.timeGapPause('widget postinit');

        // dti.timeGap('widget template');
        this.updateWidgetTemplate();
        // dti.timeGapPause('widget template');

        delete this.cfg;
        // dti.timeGapPause('widget');
    }

    getClassProperties() {
        let ret = Object.keys(this);
        let classProperties = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

        ret = ret.concat(classProperties);

        return dti.uniqueArray(ret);
    }

    syncCurrWidget() {
        let me = this;
        let properties = this.getClassProperties();
        let widget = displays.bindings.currWidget;

        dti.forEachArray(properties, (prop, c) => {
            let val = me[prop];

            if (ko.isObservable(val) || ko.isComputed(val)) {
                widget[prop](val());
            } else if (typeof val === 'function') {
                //non-observable functions
                widget[prop] = val;
            }
        });

    }

    updateWidgetTemplate() {
        dti.forEach(this, (binding, property) => {
            if (displays.bindings.currWidget[property] === undefined) {
                let prop;

                if (ko.isObservable(binding)) {
                    prop = ko.observable(koUnwrap(binding));
                } else if (binding instanceof $) {
                    prop = '';
                } else {
                    switch (typeof binding) {
                        case 'function':
                            prop = dti.emptyFn;
                            break;
                        case 'object': 
                            prop = {};
                            break;
                        default: 
                            prop = dti.clone(binding);
                            break;
                    }
                }
                displays.bindings.currWidget[property] = prop;
            }
        }, true);
    }

    getPointInfo() {
        let upi = koUnwrap(this.upi);
        let pointInfo = null;

        if (!!upi) {
            pointInfo = displays.pointInfo[upi];
        }

        return pointInfo;
    }

    handleClick(isMiddleClick) {
        let upi = this.upi();
        dti.log('handleclick', isMiddleClick);

        if (!!upi) {
            dtiUtility.openWindow({
                upi,
                popout: isMiddleClick || displays.windowCfg.popout
            });
        }
    }

    handleModalConfirm() {

    }

    handleRangeClick() {

    }

    handleDynamicUpdate() {

    }

    handlePoint(data) {
        displays.pointInfo[data._id] = displays.pointInfo[data._id] || data;
    }

    saveConfig () {
        if (!this._originalConfig) {
            this._originalConfig = this.getConfig(true);
        }
    }

    getConfig(skipMutate = false) {
        let skipProperties = ['complexWidget', 'isNew', 'displaysID', 'skipProperties', 'cleft', 'ctop', 'cwidth', 'cheight', 'config', 'editMode', 'editing', 'id', 'idx', 'name', 'pointType', 'state', '_originalConfig', 'draggableConfig'];
        skipProperties = skipProperties.concat(this.skipProperties);

        let me = kojs(this);

        // flag as new version
        me.widgetType = me.type;

        dti.forEachArray(skipProperties, (prop) => {
            delete me[prop];
        });

        // other mutate properties
        if (!skipMutate) {
            if (me.color) {
                me.color = me.color.replace(/#/g,'');
            }
        }

        dti.forEach(me, (val, prop) => {
            if (val === null || val === undefined || typeof val === 'function' || ko.isComputed(this[prop]) || val instanceof $) {
                delete me[prop];
            }
        });

        // dti.log('config:', me);

        return me;
    }

    getTooltipElement() {
        return;
    }

    postInit() {
        // dti.timeGap('widget base postinit');
        if (this.config.isNew === true && this.config.skipClick !== true) {
            setTimeout(() => {
                this.$el.find('.dti-widget').trigger('click');
            });

            // on newly added widgets, adjust display size/dimensions 
            let left = this.left();
            let right = left + this.width();
            let top = this.top();
            let bottom = top + this.height();
            
            // content area
            if (right > displays.bindings.width()) {
                displays.bindings.width(right);
            }

            if (bottom > displays.bindings.height()) {
                displays.bindings.height(bottom);
            }

            // huh?
            // if (left < 0) {
            //     displays.bindings.left(left);
            //     displays.bindings.width(displays.bindings.width() + this.width());
            // }

            // if (top < 0) {
            //     displays.bindings.top(top);
            //     displays.bindings.height(displays.bindings.height() + this.height());
            // }

        }

        if (!this.isPreview()) {
            this.$widgetEl.draggable(this.draggableConfig);
        }

        dti.on('viewMode', () => {
            this.selected(false);
        });

        // dti.timeGapPause('widget base postinit');
    }

    initConfig() {
        let cfg = this.cfg;
        let allDefaults = this.getDefaults();
        let defaults = allDefaults.base;
        let previewDefaults = allDefaults.preview;

        let config = this.config = ko.toJS(cfg.config);
        let $el = cfg.$element;

        this.$el = $el;
        this.$widgetEl = this.$el.children().eq(0);
        this.$modal = $('#actionButtonModal');
        this.displaysID = cfg.displaysID;

        delete cfg.$element;

        if (config.color) {
            config.color = config.color.replace(/#/g,'');
        }

        config.isPreview = ko.toJS(cfg.isPreview);

        if (config.isPreview) {
            defaults = $.extend(true, defaults, previewDefaults);
            this.initPreview();
        }

        this.config = $.extend(true, defaults, config);

        this.id = dti.makeId();

        if (this.config.upi !== undefined) {
            displays.socket.addUpiListener(this);
        }

        let me = this;
        this.draggableConfig = {
            cursor: 'move',
            cancel: '.viewMode .dti-widget',
            grid: [displays.bindings.selection.gridSize(), displays.bindings.selection.gridSize()],
            appendTo: $('main'),
            drag(event, ui) {
                if (displays.bindings.selecting()) {
                    let zoom = displays.bindings.zoom() / 100;
                    let dt = (ui.position.top / zoom) - me.offset.top;
                    let dl = (ui.position.left / zoom) - me.offset.left;

                    displays.forEachWidget((widget) => {
                        // for other widgets, keep in sync
                        if (widget.selected() && widget.id() !== me.id()) {
                            widget.saveConfig();
                            let offset = widget.offset;
                            widget.left(offset.left + dl);
                            widget.top(offset.top + dt);
                        }
                    });
                }
            },
            start(event, ui) {
                if (me.selected()) {
                    // store original position, then set data for every other selected widget
                    
                    me.offset = {
                        left: me.left(),
                        top: me.top()
                    };

                    me.saveConfig();

                    displays.forEachWidget((widget) => {
                        if (widget.selected() && widget.id() !== me.id()) {
                            widget.offset = {
                                left: widget.left(),
                                top: widget.top()
                            };
                        }
                    });
                    // $el.data('offset', $el.offset());
                    // dti.log($(this).offset());
                }
            },
            stop(event, ui) {
                me.saveConfig();

                let zoom = displays.bindings.zoom() / 100;
                let left = ui.position.left / zoom;
                let top = ui.position.top / zoom;
                me.left(left);
                me.top(top);
                me.offset = {};
            }
        };
    }

    delete (obj) {
        let type = this.type();
        let displaysID = this.displaysID();

        displays.bindings.screenObjects[type].remove((obj) => {
            return koUnwrap(obj.displaysID) === displaysID;
        });

        if (obj !== true && this.isNew() !== true) {
            let config = this.getConfig();
            displays.deletedWidgets.push({
                config,
                type
            });
        }

        delete displays.widgets[type][displaysID];

        let api = this.getTooltipAPI && this.getTooltipAPI();

        if (api) {
            api.hide();
        }
    }

    initBindings() {
        this.bindings = this.getBindings();

        if (this.bindings.isControllable === undefined) {
            this.bindings.isControllable = ko.observable(false);
        }

        this.bindings.displaysID = ko.observable(this.config.displaysID);

        this.bindings.delete = this.delete;
        this.bindings.isPreview = ko.observable(this.config.isPreview);

        $.extend(this, this.bindings);

        let point = this.getPointInfo();

        // wait on loaded so common has the separator
        // grab upi so it's recalculated on point change
        this.path = ko.pureComputed(() => {
            let loaded = displays.bindings.commonLoaded();
            let name = '';

            if (!!loaded) {
                let upi = this.upi();
                if (upi) {
                    let point = this.getPointInfo();
                    let path = point.path || [];

                    // if path is a string, it's already converted (aka via point selector)
                    if (typeof path !== 'string') {
                        name = dtiCommon.getPointName(path);
                    } else {
                        name = path;
                    }
                } else {
                    name = '';
                }
            }

            return name;
        });

        delete this.bindings;
    }

    initPreview() {

        this.$widgetEl.draggable({
            cursor: 'move',
            grid: [displays.bindings.selection.gridSize(), displays.bindings.selection.gridSize()],
            cursorAt: {
                left: 0,
                top: 0
            },
            appendTo: displays.$container,
            helper (event, ui) {
                let $el = $(event.target);
                let $clone = $el.closest('.dti-widget-content').clone();
                let widget = kodt($el);
                let zoom = displays.getDragOffsets().zoom / 100;

                // $('body').append($clone);

                let fontSize = widget.fontSize() * zoom;
                let height = widget.getDefaults().base.height;
                let width = widget.getDefaults().base.width;
                let lineHeight = (height * zoom) - 2 + 'px';
                let offset = $el.offset();
                

                // dti.log($clone[0], fontSize, lineHeight);

                $clone.addClass('clone');

                $clone.css({
                    backgroundColor: $el.css('backgroundColor'),//'rgba(244, 244, 244, 0.8)',
                    width: width * zoom,
                    height: height * zoom,
                    fontSize: fontSize,
                    lineHeight: lineHeight,
                    // position: 'absolute',
                    // left: offset.left,
                    // top: offset.top,
                    zIndex: 100
                });

                // dti.log($clone[0]);

                return $clone[0];
            },
            drag (event, ui) {
                // dti.log(ui.helper[0]);
            },
            start (event, ui) {
                let $target = $(event.target); 
                let offset = $target.offset();
                let zoom = displays.bindings.zoom() / 100;
                let left =  (event.clientX - offset.left);
                let top =  (event.clientY - offset.top);


                // dti.log(left, top);
                $target.draggable('option', 'cursorAt', {
                    left,
                    top
                });
            },
            stop (event, ui) {
                var offsets = displays.getDragOffsets(),
                    zoom = displays.bindings.zoom() / 100,
                    leftOffset = zoom === 1 ? 0 : offsets.left,
                    topOffset = zoom === 1 ? 0 : offsets.top,
                    left = ui.position.left / zoom, // - (offsets.left * offsets.zoom)) / offsets.zoom),
                    top = ui.position.top / zoom, // - (offsets.top * offsets.zoom)) / offsets.zoom),
                    $el = $(event.target),
                    previewConfig = kodt($el),
                    $parent = $el.parent(),
                    type = previewConfig.type(),
                    text = previewConfig.text(), //$el.find('.preview').text() || $el.text(),
                    copyProperties = {
                        color: (c) => {
                            return c && c.slice(1);
                        },
                        fontSize: (c) => {
                            return c;
                        },
                        bold(c) {
                            return c;
                        },
                        underline(c) {
                            return c;
                        },
                        italic(c) {
                            return c;
                        }
                    },
                    config = {
                        left: left,
                        top: top,
                        text: text,
                        isNew: true
                    };

                if (left >= 0 && top >= 0) {
                    dti.forEach(copyProperties, (fn, prop) => {
                        config[prop] = fn(previewConfig[prop]());
                    });

                    displays.createWidget(config, type);
                }

                // dti.log(arguments);
                // widgets.createWidget(type, config);

                
            }
        });
    }

    handleUpdate() {
        
    }

    refreshDOM($el = this.$el) {
        $el.find('textarea').trigger('autoresize');
        $el.find('select').material_select();
        Materialize.updateTextFields();

        let api = displays.tooltipAPI;

        if (api.reposition) {
            api.reposition();
        }
    }
};
var widgets = {
    isWidget($el) {
        return $el.closest('.dti-widget').length > 0;
    },
    getWidget($el) {
        let ret;
        let isWidget = widgets.isWidget($el);

        if (isWidget) {
            ret = kodt($el);
        }

        return ret;
    },
    /* widget classes ----------- */
    classes: {
        Text: class TextWidget extends BaseWidget {

            getDefaults() {
                return {
                    base: {
                        color: '000000',
                        text: 'Text',
                        fontSize: 12,
                        bold: false,
                        underline: false,
                        strikethrough: false,
                        italic: false,
                        editMode: false,
                        widgetType: 'Text',
                        editing: false
                    },
                    preview: {
                        editMode: true,
                        fontSize: 16
                    }
                };
            }

            getBindings() {
                let ret = {
                    isNew: this.config.isNew || false,
                    complexWidget: false,
                    fontSize: this.config.fontSize,
                    color: '#' + this.config.color,
                    bold: this.config.bold,
                    italic: this.config.italic,
                    underline: this.config.underline,
                    strikethrough: this.config.strikethrough,
                    fontFamily: this.config.fontName,
                    left: this.config.left,
                    top: this.config.top,
                    height: this.config.height ? this.config.height : null,
                    width: this.config.width ? this.config.width  : null,
                    idx: this.config.idx,
                    id: this.id,
                    text: this.config.text.replace(/\r\n/g, '<br/>'),
                    editMode: this.config.editMode,
                    type: this.config.widgetType,
                    editing: this.config.editing
                };

                dti.merge(ret, displays.widgetTemplate);

                ret = ko.viewmodel.fromModel(ret);                

                ret = displays.adjustBindings(ret, !!this.config.isPreview);

                return ret;
            }
        },

        Button: class ButtonWidget extends BaseWidget {

            initConfig () {
                super.initConfig();

                this.skipProperties = ['valueOptions'];

                if (!!!this.config.buttonType) {
                    if (this.cfg.actionButtonConfig || (!!this.cfg.pointType && this.cfg.pointType !== 'Display')) {
                        this.config.buttonType = 'Action';
                    } else {
                        this.config.buttonType = 'Link';
                    }
                }
            }

            setValueOptions(data, skipAssign = false) {
                let ret = {};
                let options = [];
                if (data) {
                    dti.forEach(data.Value.ValueOptions, (option, optionName) => {
                        options.push({
                            name: optionName,
                            value: option
                        });
                    });

                    if (!skipAssign) {
                        this.valueOptions(options);
                    } else {
                        ret.valueOptions = options;
                    }
                } else {
                    options = this.valueOptions();
                }

                let commandValue = options[0].value;
                let commandName = options[0].name;

                if (!skipAssign) {
                    this.commandValue(commandValue);
                    this.commandName(commandName);
                } else {
                    ret.commandValue = commandValue;           
                    ret.commandName = commandName;
                }

                return ret;
            }

            setCustomRange() {
                this.range('Custom');
            }

            setRange(cfg) {
                let range = cfg;
                if (typeof range === 'string') {
                    dti.forEachArray(displays.bindings.dateTime.dateRanges, (defRange) => {
                        if (defRange.range === range) {
                            range = defRange;
                            return false;
                        }
                    });
                }

                this.maxInterval(range.maxInterval);
                this.range(range.range); // sounds weird, right?

                let start = range.stamps[0];
                let end = range.stamps[1];

                // dti.trace(start.toString(), end.toString());

                this.startDate(start.unix() * 1000);
                this.endDate(end.unix() * 1000);

                let interval = this.intervalType();
                let maxInterval = displays.dateTime.intervals.indexOf(range.maxInterval);

                if (displays.dateTime.intervals.indexOf(interval) > maxInterval) {
                    this.intervalType(range.maxInterval);
                }
            }

            handleTimePick() {
                this.setCustomRange();
            }

            handleDatePick() {
                if (!dti.pauseDatePick) {
                    this.setCustomRange();
                }
            }

            handleValueClick(event) {
                let $target = $(event.target);
                let val = kodt($target);

                this.commandValue(val.value);
                this.commandName(val.name);

                dti.trace('commandValue', val);
            }

            handlePriorityClick(event) {
                let $target = $(event.target);
                let priority = kodt($target);

                this.priority(priority.value());

                dti.trace('priority', priority);
            }

            handleIntervalClick(event) {
                let $target = $(event.target);
                let interval = kodt($target);
                this.intervalType(interval);
                dti.trace('interval', interval);
            }

            handleRangeClick(event) {
                let $target = $(event.target);
                let range = kodt($target);

                this.setRange(range);
            }

            handleModalConfirm() {
                let me = displays.currWidget;

                if (me.pointType() === 'Report') {
                    me.openReport();
                } else {
                    me.sendCommand();
                }
            }

            handlePoint(data, skipButtonType = false) {
                if (data) {
                    super.handlePoint(data);

                    let pointType = data.pointType || data['Point Type'].Value;
                    let reportType = data.reportType || (data['Report Type'] && data['Report Type'].Value);

                    if (pointType.match(/(Binary|MultiState)/)) {
                        this.setValueOptions(data);
                    }

                    this.upi(data._id);
                    this.name(data.path);

                    this.isReport(false);
                    this.reportType(null);

                    if (pointType !== 'Display') {
                        if (pointType === 'Report') {
                            this.isReport(true);
                            this.reportType(reportType);
                        }
                        if (!skipButtonType) {
                            this.buttonType('Action');
                        }
                        // this.complexWidget(true);
                    } else {
                        this.buttonType('Link');
                        // this.complexWidget(false);
                    }

                }

                let el = this.getTooltipElement();

                if (el) {
                    this.refreshDOM($(el));
                }
            }

            getDefaults() {
                let point = this.getPointInfo() || {};
                return {
                    actionButton: {
                        actionCode: 1,
                        from: new Date().getTime(),
                        to: new Date().getTime(),
                        interval: 1800,
                        text: 'Text',
                        parameter: 5,
                        upi: 0,
                        priority: 0
                    },
                    commandArgs: {
                        'Command Type': 7,
                        upi: '',
                        Value: '',
                        Controller: displays.user.controllerId,
                        Relinquish: 0,
                        Priority: '',
                        Wait: 0,
                        OvrTime: 0,
                        logData: {
                            user: displays.user,
                            point: {
                                _id: point._id,
                                Security: point.Security,
                                path: point.path,
                                'Point Type': {
                                    eValue: point && point['Point Type'] && point['Point Type'].eValue
                                }
                            },
                            newValue: {
                                Value: this.commandValue && this.commandValue()
                            }
                        }
                    },
                    report: {
                        duration: {
                            startDate: moment().unix() * 1000, //moment || ms,
                            startTimeOffSet: '00:00', //str: 00:00
                            endDate: moment().unix() * 1000, //moment || ms,
                            endTimeOffset: '00:00', //str: 00:00,
                            selectedRange: 'Last Week' //range text: 'Custom'
                        },
                        interval: {
                            period: 'Day', // str: 'day'
                            value: 2 //number: 1
                        }
                    },
                    externalReport: {
                        startDate: moment().subtract(1, "day").unix(),
                        endDate: moment(),
                        offset: "12:00AM",
                        duration: 0,
                        selectedRange: ""
                    },
                    defaultReport: {
                        intervalNum: 1,
                        intervalType: 'Day',
                        starttimestamp: '12:00AM',
                        endtimestamp: '12:00AM',
                        durationInfo: {
                            duration: 86399,
                            selectedRange: 'Today',
                            endDate: moment().endOf('d'),
                            startDate: moment().startOf('d').unix(),
                            durations: [{
                                text: "Minute"
                            }, {
                                text: "Hour"
                            }, {
                                text: "Day"
                            }, {
                                text: "Week"
                            }, {
                                text: "Month"
                            }, {
                                text: "Year"
                            }]
                        }
                    },
                    base: {
                        width: 60,
                        height: 16,
                        text: '',
                        fontSize: 12,
                        bold: false,
                        editMode: false,
                        widgetType: 'Button',
                        transparent: false,
                        color: '000000',
                        editing: false
                    },
                    preview: {
                        height: 28,
                        width: 60,
                        fontSize: 16,
                        editMode: true,
                        text: 'Button'
                    }
                };
            }

            getCommandArguments () {
                let ret = $.extend(true, {}, this.getDefaults().commandArgs);
                let val = this.commandValue();
                let upi = this.upi();
                let priority = this.priority();

                // if (typeof val === 'object') {
                //     val = val.value;
                // }

                ret.upi = upi;
                ret.Value = val;
                // ret.logData.newValue.Value = val;
                if (this.pointType() !== 'MultiState Value') {
                    ret.Priority = priority;
                }

                return ret;
            }

            sendCommand (pointType) {
                dti.log('Send Command', this.getCommandArguments());
                displays.socket.socket.emit('fieldCommand', JSON.stringify(this.getCommandArguments()));
            }

            openReport (isMiddleClick) {
                let reportConfig = {
                    duration: {
                        startDate: this.startDate(), //mothisnt || ms,
                        startTithisOffSet: this.startTime(), //str: 00:00
                        endDate: this.endDate(), //mothisnt || ms,
                        endTithisOffset: this.endTime(), //str: 00:00,
                        selectedRange: this.range() //range text: 'Custom'
                    },
                    interval: {
                        period: this.intervalType(), // str: 'day'
                        value: this.intervalNum() //number: 1
                    }
                };

                dtiUtility.openWindow({
                    upi: this.upi(),
                    reportConfig,
                    popout: isMiddleClick || displays.windowCfg.popout
                });
            }

            openModal () {
                let me = this;
                let $el = me.$modal;

                // ko.cleanNode($el[0]);

                // displays.bindings.loadingWidget(true);

                me.syncCurrWidget();

                // dti.updateFromModel(displays.bindings.currWidget, me);

                // displays.bindings.loadingWidget(false);

                // ko.applyBindings(displays.bindings.currWidget, $el[0]);

                setTimeout(() => {
                    $el.openModal({
                        ready() {
                            Materialize.updateTextFields();        
                        }
                    });
                }, 100);
            }

            processActionButtonClick (isMiddleClick) {
                let me = this;
                let sendCommand = function (pointType) {
                    me.sendCommand(pointType);
                };
                let upi = this.upi();
                let pointType = displays.pointTypes[upi];
                let handlers = {
                        report () {
                            let reportType = displays.reportTypes[upi];

                            if (reportType !== 'Property') {
                                //if confirmRange else
                                if (me.confirmReportRange()) {
                                    me.openModal();
                                    
                                } else {
                                    me.openReport(isMiddleClick);
                                }
                            } else {
                                dtiUtility.openWindow({
                                    upi,
                                    popout: isMiddleClick || displays.windowCfg.popout
                                });
                            }
                        },
                        default () {
                            if (me.confirmCommand()) {
                                if (me.commandValue() === null) {
                                    let pointInfo = me.getPointInfo();
                                    me.commandValue(pointInfo.Value.Value);
                                }
                                me.openModal();
                            } else {
                                sendCommand(pointType);
                            }
                        }

                    };

                switch (pointType) {
                    case 'Report':
                        handlers.report();
                        break;
                    // case: 'MultiState Value':
                    //     handlers.multiState();
                    //     break;
                    default:
                        handlers.default();
                        break;
                }
            }

            processClick (isMiddleClick) {
                dti.log('button click', isMiddleClick);
                displays.currWidget = this;
                if (this.buttonType() === 'Link') {
                    if (this.upi() !== 0) {
                        dtiUtility.openWindow({
                            upi: this.upi(),
                            popout: isMiddleClick || displays.windowCfg.popout
                        });
                    }
                } else {
                    this.processActionButtonClick(isMiddleClick);
                }
            }

            handleClick (isMiddleClick) {
                this.processClick(isMiddleClick);
                // dti.log('handle click', arguments);
            }

            postInit() {
                super.postInit();
                // dti.timeGap('button postinit');

                if (this.range() !== 'Custom') {
                    // dti.timeGap('button range');
                    this.setRange(this.range());
                    // dti.timeGapPause('button range');
                }

                if (!this.isPreview()) {
                    // dti.timeGap('button resize');
                    let handleResize = function (event, ui) {
                        this.saveConfig();
                        let zoom = displays.bindings.zoom()/100;
                        let width = ui.size.width / zoom;
                        let height = ui.size.height / zoom;

                        this.width(width);
                        this.height(height);
                    };

                    this.$widgetEl.resizable({
                        stop: handleResize.bind(this)
                    });
                    // dti.timeGapPause('button resize');
                }

                // dti.timeGap('button point info');
                let point = this.getPointInfo();
                this.handlePoint(point, true);
                // dti.timeGapPause('button point info');
                // dti.timeGapPause('button postinit');
            }

            getBindings (skipModel) {
                let ret = {
                    isNew: this.config.isNew || false,
                    complexWidget: false,
                    fontSize: this.config.fontSize,
                    bold: this.config.bold || false,
                    italic: this.config.italic || false,
                    color: '#' + this.config.color,
                    transparent: this.config.transparent || false,
                    left: this.config.left,
                    top: this.config.top,
                    height: this.config.height,
                    width: this.config.width,
                    idx: this.config.idx,
                    id: this.id,
                    text: this.config.text || (!!this.config.isNew ? 'Text' : ''),
                    editMode: this.config.editMode,
                    type: this.config.widgetType,
                    buttonType: this.config.buttonType,
                    upi: this.config.upi,
                    name: displays.upiNames[this.config.upi] || 'Not in Hierarchy',                    
                    editing: this.config.editing,
                    isReport: this.config.isReport || false,
                    reportType: this.config.reportType || null,
                    confirmReportRange: this.config.confirmReportRange || false,
                    confirmCommand: this.config.confirmCommand || false,
                    startDate: this.config.startDate || moment().unix() * 1000,
                    endDate: this.config.endDate || moment().unix() * 1000,
                    startTime: this.config.startTime || '12:00PM',
                    endTime: this.config.endTime || '12:00PM',
                    range: this.config.range || 'Today',
                    intervalNum: this.config.intervalNum || 1,
                    intervalType: this.config.intervalType || 'Day',
                    maxInterval: this.config.maxInterval ||'Day',
                    valueOptions: [],
                    commandValue: this.config.commandValue || null,
                    commandName: this.config.commandName || null,
                    maxValue: 100,
                    minValue: 0,
                    priority: this.config.priority || 16
                };

                if (skipModel) {
                    return ret;
                }

                dti.merge(ret, displays.widgetTemplate);

                ret = ko.viewmodel.fromModel(ret);                

                ret = displays.adjustBindings(ret, !!this.config.isPreview);

                // ret.buttonType.subscribe((val) => {
                //     if (val === 'Link') {
                //         ret.complexWidget(false);
                //     } else {
                //         ret.complexWidget(true);
                //     }
                // });

                ret.pointType = ko.pureComputed(() => {
                    return displays.pointTypes[this.upi()] || '';
                });

                ret.isControllable = ko.pureComputed(() => {
                    let controllablePointTypes = displays.settings.widgets.controllablePointTypes;

                    return controllablePointTypes.indexOf(this.pointType()) !== -1;
                });

                ret.intervalList = ko.pureComputed(() => {
                    let interval = ret.range();

                    return displays.bindings.dateTime.intervals;
                });

                let me = this;
                ret.complexWidget = ko.pureComputed(() => {
                    let isComplex = this.config.ActionCode !== undefined || //imported action button
                                    this.reportType() === 'History' || //history report
                                    this.isControllable();
                    return isComplex;
                });

                return ret;                
            }
        },

        Dynamic: class DynamicWidget extends BaseWidget {
            initConfig () {
                this.placeholder = '###';

                this.skipProperties = ['Text'];

                super.initConfig();

                this._origColor = this.config.color;
            }

            getDefaults () {
                return {
                    base: {
                        fontSize: 12,
                        bold: false,
                        underline: false,
                        strikethrough: false,
                        editMode: false,
                        color: '000000',
                        widgetType: 'Dynamic',
                        editing: false,
                        width: 50,
                        height: 16,
                        text: this.placeholder
                    },
                    preview: {
                        editMode: true,
                        fontSize: 16,
                        height: 20,
                        text: 'Dynamic'
                    }
                };
            }

            getBindings (skipModel) {
                let ret = {
                    isNew: this.config.isNew || false,
                    complexWidget: false,
                    fontSize: this.config.fontSize,
                    bold: this.config.bold,
                    underline: this.config.underline,
                    precision: this.config.precision || 3.1,
                    left: this.config.left,
                    top: this.config.top,
                    color: '#' + this.config.color,
                    text: this.config.text,
                    qualityCode: '',
                    qualityCodeColor: '',
                    height: this.config.height ? this.config.height : null,
                    width: this.config.width ? this.config.width : null,
                    idx: this.config.idx,
                    id: this.id,
                    upi: this.config.upi || 0,
                    name: displays.upiNames[this.config.upi] || 'Not in Hierarchy',
                    editMode: this.config.editMode,
                    type: this.config.widgetType,
                    editing: this.config.editing
                };

                if (skipModel) {
                    return ret;
                }

                dti.merge(ret, displays.widgetTemplate);

                ret = ko.viewmodel.fromModel(ret);  

                ret.cColor = ko.pureComputed(() => {
                    let qualityCode = this.qualityCode();

                    if (qualityCode === '') {
                        return this.color();
                    }

                    return this.qualityCodeColor();
                });            

                ret = displays.adjustBindings(ret, !!this.config.isPreview);

                return ret;
            }

            handlePoint(data) {
                super.handlePoint(data);

                let pointType = data['Point Type'].Value;

                // if (pointType.match(/(Binary|MultiState)/)) {
                //     let options = [];
                //     dti.forEach(data.Value.ValueOptions, (option, optionName) => {
                //         options.push({
                //             name: optionName,
                //             value: option
                //         });
                //     });
                //     this.valueOptions(options);
                // }

                this.upi(data._id);
                this.name(data.path);

                
                if (pointType.match(/(Binary|MultiState|Analog)/)) {
                    if (pointType.match(/(Binary|MultiState)/)) {
                        let vOpt = this.setValueOptions(data, true);

                        this.valueOptions(vOpt.valueOptions);
                        this.commandValue(vOpt.commandValue);
                        this.commandName(vOpt.commandName);
                    } else {
                        this.commandValue(data.Value.Value);
                    }
                } else if (pointType === 'Report') {
                    // for imported report action buttons
                    this.reportType(data['Report Type'].Value);
                }

                let el = this.getTooltipElement();

                if (el) {
                    this.refreshDOM($(el));
                }
            }

            handleDynamicUpdate(data) {
                let precision = this.config.precision || 0;
                precision = (precision * 10) % 10;

                let val = data.val;
                let label = data.label;

                if (typeof val !== 'string') {
                    if (precision > 0) {
                        val = val.toFixed(precision);
                    } else {
                        val = parseInt(val, 10);
                    }
                }

                let newVal = val;
                let color = this._origColor;

                if (label === 'none') {
                    color = this._origColor;
                    this.qualityCode('');
                    newVal = val;
                } else {
                    color = displays.qualityCodes.lookup[label].color;
                    this.qualityCodeColor('#' + color);
                    // newVal = val + ' ' + displays.qualityCodes.lookup[label].code;
                    this.qualityCode(' ' + displays.qualityCodes.lookup[label].code);
                }

                this.color('#' + color);

                if (newVal !== false) {
                    this.text(newVal);
                }
            }
        },

        Animation: class AnimationWidget extends BaseWidget {
            getDefaults() {
                return {
                    base: {
                        color: '000000',
                        text: 'Text',
                        editMode: false,
                        widgetType: 'Animation',
                        editing: false,
                        width: 24,
                        height: 24,
                        animationFile: 'fan2-supply',
                        animationType: 'onoff'
                    },
                    preview: {
                        editMode: true
                    }
                };
            }

            isUploadedAnimationFile (data) {
                return data.match(/data:image\/gif/);
            }

            initConfig () {
                super.initConfig();

                this.baseUrl = '/displays/gifs/';

                this.animTypeLookup = {
                    'onoff': 0,
                    'frame': 1,
                    'multifile': 2,
                    0: 'onoff',
                    1: 'frame',
                    2: 'multifile'
                };

                this.animFileLookup = {};
                this.stateList = ['Off', 'On', 'OffAlarm', 'OnAlarm', 'Fault'];

                this.skipProperties = ['imageData', 'stateList', 'animTypeLookup', 'animFileLookup', 'animTypeHandlers', 'animationFiles', 'baseUrl'];

                dti.forEachArray(this.stateList, (state, idx) => {
                    this.animFileLookup[idx] = state;
                    this.animFileLookup[state] = idx;
                });
                // 0: 'Off',
                // 1: 'On',
                // 2: 'OffAlarm',
                // 3: 'OnAlarm',
                // 4: 'Fault',
                // 'Off': 0,
                // 'On': 1,
                // 'OffAlarm': 2,
                // 'OnAlarm': 3,
                // 'Fault': 4

                this.animTypeHandlers = {
                    onoff(val) {
                        return (val > 0) ? '' : 0;
                    },
                    frame(val) {
                        let retVal = parseInt(val / this.precision(), 10);

                        return retVal;
                    },
                    multifile(val) {
                        let state = this.animFileLookup[val];
                        let animationFile = this.animationFiles[state + 'State'];

                        this.animationState = state;

                        if (animationFile) {
                            if (this.isUploadedAnimationFile(animationFile)) {
                                this.imageData(animationFile);
                            } else {
                                this.imageData('');
                                this.animationFile(animationFile);
                            }
                        }

                        return '';
                    }
                };

                if (typeof this.config.animationType === 'number') {
                    this.config.animationType = this.animTypeLookup[this.config.animationType];
                }
            }

            postInit () {
                super.postInit();

                // dti.timeGap('animation postinit');

                if (!this.isPreview()) {
                    let handleResize = function (event, ui) {
                        let zoom = displays.bindings.zoom()/100;
                        let width = ui.size.width / zoom;
                        let height = ui.size.height / zoom;

                        this.width(width);
                        this.height(height);
                    };

                    this.$widgetEl.resizable({
                        aspectRatio: true,
                        stop: handleResize.bind(this)
                    });
                }

                // this is to avoid newly added animations getting incorrect dimensions (before the image loads)
                setTimeout(() => {
                    dti.onLoaded([this.getAnimationFiles.bind(this), this.setDimensions.bind(this)]);
                }, 100);
                // dti.timeGapPause('animation postinit');
            }

            setDimensions () {
                if (!this.isPreview()) {
                    let $el = this.$el.find('.dti-widget-animation img');
                    let zoom = displays.bindings.zoom()/100;

                    let width = $el.width()/zoom;
                    let height = $el.height()/zoom;
                    


                    // return {
                    //     width,
                    //     height
                    // };

                    this.height(height);
                    this.width(width);
                    

                    setTimeout(() => {
                        this.loaded(true);
                    });
                }
            }

            getBindings (skipModel) {
                let ret = {
                    isNew: this.config.isNew || false,
                    complexWidget: true,
                    loaded: this.config.isNew || false,
                    left: this.config.left,
                    top: this.config.top,
                    height: this.config.height ? this.config.height : null,
                    width: this.config.width ? this.config.width : null,
                    idx: this.config.idx,
                    id: this.id,
                    precision: this.config.precision || 3.1,
                    upi: this.config.upi || 0,
                    name: displays.upiNames[this.config.upi] || 'Not in Hierarchy',
                    editMode: this.config.editMode,
                    type: this.config.widgetType,
                    editing: this.config.editing,
                    animationID: this.config.animationID,
                    state: this.config.state,
                    animationType: this.config.animationType,
                    animationFile: this.config.animationFile,
                    baseUrl: this.baseUrl,
                    src: this.config.animationFile + '/',
                    imageData: null
                };

                if (skipModel) {
                    return ret;
                }

                dti.merge(ret, displays.widgetTemplate);

                ret = ko.viewmodel.fromModel(ret);                

                ret = displays.adjustBindings(ret, !!this.config.isPreview);

                return ret;
            }

            handlePoint(data) {
                super.handlePoint(data);

                if (data.pointType.match(/(Binary|MultiState)/)) {
                    let options = [];
                    dti.forEach(data.Value.ValueOptions, (option, optionName) => {
                        options.push({
                            name: optionName,
                            value: option
                        });
                    });
                    this.valueOptions(options);
                }

                this.upi(data._id);
                this.name(data.path);

                let el = this.getTooltipElement();

                if (el) {
                    this.refreshDOM($(el));
                }
            }

            handleDynamicUpdate(data) {
                let dynamic = data.dynamic;
                let val = dynamic.Value;
                let eVal = dynamic.eValue;
                let frame;

                if (typeof val !== 'string') {
                    frame = parseInt(val / (this.precision() || 1), 10);
                } else {
                    frame = eVal;
                    val = eVal;
                }

                let updateHandler = this.animTypeHandlers[this.animationType()];

                if (updateHandler) {
                    frame = updateHandler.call(this, val);
                } else {
                    frame = 0;
                }

                if (frame === undefined) {
                    frame = '';
                }

                let img = this.animationFile();

                // this.$el.attr('src', baseUrl + img + '/' + frame);

                this.src(img + '/' + frame);
            }

            imageLoaded (event, image) {
                let width = image.width;
                let height = image.height;
                let myWidth = this.width();
                let myHeight = this.height();
                let zoom = displays.bindings.zoom() / 100;

                if (width >= height) {
                    //width should match
                    let newHeight = (height/width) * myWidth;
                    height = newHeight;
                    width = myWidth;
                } else {
                    let newWidth = (width/height) * myHeight;
                    width = newWidth;
                    height = myHeight;
                }

                this.width(width * zoom);
                this.height(height * zoom);

                dti.log(arguments);
                this.refreshDOM();
            }

            handleImageLoaded (config) {
                let src = config.src;
                let file = config.file;
                let data = config.data;
                let state = data.replace('State', '');

                displays.filesToUpload[this.id()] = displays.filesToUpload[this.id()] || {};

                if (this.animationType() === 'multifile') {
                    this.animationFiles[data] = file.name.replace('.gif', '');
                    displays.filesToUpload[this.id()][data] = {
                        name: file.name,
                        data: src,
                        file: file
                    };

                    if (this.animationState === state) {
                        this.imageData(src);
                    }
                } else {
                    this.animationFile(file.name.replace('.gif', ''));
                    this.imageData(src);   

                    displays.filesToUpload[this.id()] = {
                        name: file.name,
                        data: src,
                        file: file
                    };
                }
            }

            getAnimationFiles() {
                let animations = displays.animationIDs[this.animationID()] || {};
                let keys = Object.keys(animations);
                let states = [0, 1, 2, 3, 4];
                let stateList = ['Off', 'On', 'OffAlarm', 'OnAlarm', 'Fault'];
                let ret = {};
                let animationType = this.config.animationType;

                if (this.config._v2 === true) {
                    if (animationType === 'multifile') {
                        dti.forEachArray(states, (state, idx) => {
                            ret[state] = this.config[state];
                        });
                    } else {
                        ret['Animation File'] = this.config['Animation File'];
                    }
                } else {
                    if (keys.length > 1) {
                        dti.forEachArray(keys, (key, idx) => {
                            let val = animations[key];
                            ret[this.animFileLookup[key] + 'State'] = val;
                        });
                    } else {
                        dti.forEachArray(stateList, (state, idx) => {
                           ret[state + 'State'] = ''; 
                        });
                        // ret['Animation File'] = (animations[keys[0]]) ? animations[keys[0]] : this.config['Animation File'];
                    }
                }

                this.animationFiles = ret;
            }
        }
    }
};

var displays = {
    container: '.displayContainer',
    $container: $('.displayContainer'),
    tooltipAPI: {},
    clipboard: [],
    system: {},
    widgets: {},
    settings: {
        scrollZoomStep: 5,
        bindingsLoaded: false,
        widgets: {
            tooltipWidthSmall: '285px',
            tooltipWidthLarge: '550px',
            controllablePointTypes: ['Analog Value', 'Analog Output', 'Binary Value', 'Binary Output', 'MultiState Value']
        },
        actionButton: {
            dropdownConfig: {
                keepInViewport: true,
                offsetOrigin: false,
                delayHide: true,
                width: 'element'
            },
            modalDropdownConfig: {
                offsetOrigin: false,
                delayHide: true,
                width: 'element'
            }
        }
    },
    deletedWidgets: [],
    filesToUpload: {},
    animationUPIs: {},
    animationIDs: {},
    lookup: {
        upiMatrix: {}
    },
    screenObjectTypeMatrix: {
        0: 'Dynamic',
        1: 'Button',//isActionButton = item.hasOwnProperty('ActionCode'),
        2: 'Text',
        3: 'Animation'
    },
    widgetTemplate: {
        idx: undefined,
        left: undefined,
        top: undefined,
        height: undefined,
        width: undefined,
        italic: undefined,
        fontSize: undefined,
        bold: undefined,
        underline: undefined,
        strikethrough: undefined,
        color: undefined,
        transparent: undefined,
        fontName: undefined,
        text: undefined,
        precision: undefined,
        pointType: '',
        upi: undefined,
        name: undefined,
        animationID: undefined,
        animationFile: undefined,
        complexWidget: undefined,
        state: undefined,
        editing: undefined,
        type: undefined,
        buttonType: undefined,
        selected: undefined
    },
    bindings: {
        desktop: false,
        editMode: false,
        commonLoaded: false,
        showDisplaySettings: false,
        transitioning: false,
        selecting: false,
        editingWidget: false,
        widgetsReady: false,
        editingPreviewWidget: false,
        editingComplexWidget: false,
        backgroundImage: '',
        backgroundImageData: '',
        backgroundPath: '/display_assets/assets/',
        backgroundColor: '#ffffff',
        scale: 100,
        zoom: 100,
        width: 800,
        height: 600,
        bgWidth: 800,
        bgHeight: 600,
        left: 0,
        top: 0,
        backgroundImageWidth: 100,
        backgroundImageHeight: 100,
        screenObjects: {},
        tooltipBindings: dti.clone(widgets.tooltipMenuBindings),
        controlPriorities: [],
        currWidget: {},
        selection: {
            active: false,
            dragging: false,
            dragSelection: false,
            origLeft: 0,
            origTop: 0,
            currLeft: 0,
            currTop: 0,
            gridSize: 5,
            coords: {
                left: 0,
                top: 0
            }
        }
    },
    dateTime: {
        intervals: ['Minute', 'Hour', 'Day', 'Week', 'Month', 'Year'],
        dateRanges: [{
            range: "Today",
            stamps: [moment(), moment().add(1, "day")],
            maxInterval: 'Day'
        }, {
            range: "Yesterday",
            stamps: [moment().subtract(1, "days"), moment()],
            maxInterval: 'Day'
        }, {
            range: "Last 7 Days",
            stamps: [moment().subtract(6, "days"), moment().add(1, "day")],
            maxInterval: 'Week'
        }, {
            range: "Last Week",
            stamps: [moment().subtract(1, "weeks").startOf("week"), moment().subtract(1, "weeks").endOf("week").add(1, "day")],
            maxInterval: 'Week'
        }, {
            range: "Last 4 Weeks",
            stamps: [moment().subtract(4, "weeks"), moment().add(1, "day")],
            maxInterval: 'Week'
        }, {
            range: "This Month",
            stamps: [moment().startOf("month"), moment().endOf("month").add(1, "day")],
            maxInterval: 'Month'
        }, {
            range: "Last Month",
            stamps: [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month").add(1, "day")],
            maxInterval: 'Month'
        }, {
            range: "This Year",
            stamps: [moment().startOf("year"), moment().add(1, "day")],
            maxInterval: 'Year'
        }, {
            range: "Last Year",
            stamps: [moment().subtract(1, "year").startOf("year"), moment().subtract(1, "year").endOf("year").add(1, "day")],
            maxInterval: 'Year'
        }]
    },
    events: {
        panning: false,
        mouseDown: null,
        coords: {
            left: null,
            top: null
        },
        selection: {
            selectableConfig: {
                cancel: 'body.viewMode, .dti-widget, .context-menu-list',
                stop() {
                    let selected = displays.getSelectedWidgets();

                    displays.bindings.selecting(selected.length !== 0);
                },
                selecting(event, ui) {
                    let $el = $(ui.selecting);
                    let widget = widgets.getWidget($el);

                    if (widget) {
                        widget.selected(true);
                    }
                },
                unselecting(event, ui) {
                    let $el = $(ui.unselecting);
                    let widget = widgets.getWidget($el);

                    if (widget) {
                        widget.selected(false);
                    }
                }
            },
            init () {
                let $main = $('main');
                let disable = () => {
                    $main.selectable('option', 'disabled', true);
                };
                let enable = () => {
                    $main.selectable('option', 'disabled', false);
                };

                $main.selectable(displays.events.selection.selectableConfig);

                // for 'straight to edit mode' displays
                if (!koUnwrap(displays.bindings.editMode)) {
                    disable();
                }

                dti.on('viewMode', disable);
                dti.on('editMode', enable);

                dti.on('showContextMenu', disable);
                dti.on('hideContextMenu', enable);
            }
        },
        contextMenu: {
            eventConfig: {
                show () {
                    dti.fire('showContextMenu');
                },
                hide () {
                    dti.fire('hideContextMenu');
                }
            },
            init() {
                $.contextMenu({
                    selector: 'main, .dti-widget',
                    build: displays.events.contextMenu.build,
                    events: displays.events.contextMenu.eventConfig
                });
            },
            handleEditClick(item, opt, event) {
                let zoom = displays.bindings.zoom() / 100;
                let offsets = displays.getDragOffsets();
                let leftOffset = zoom === 1 ? 0 : offsets.left;
                let topOffset = zoom === 1 ? 0 : offsets.top;
                let coords = displays.events.contextCoords;

                displays.createWidget({
                    left: (coords.clientX - leftOffset) / zoom,
                    top: (coords.clientY - topOffset) / zoom,
                    isNew: true
                }, item);
            },
            build($triggerElement, e) {
                if (displays.events.panning === true) {
                    return false;
                }

                displays.events.contextCoords = {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    offsetX: e.offsetX,
                    offsetY: e.offsetY,
                    pageX: e.pageX,
                    pageY: e.pageY
                };

                let editModeOptions = {
                    callback: displays.events.contextMenu.handleEditClick,
                    items: {
                        'Button': {
                            name: 'Button'
                        },
                        'Animation': {
                            name: 'Animation'
                        },
                        'Text': {
                            name: 'Text'
                        }
                    }
                };

                let viewModeOptions = {
                    items: {
                        'Edit': {
                            name: 'Edit Display',
                            callback: displays.bindings.toggleEditMode
                        }
                    }
                };

                let deleteWidget = {
                    name: 'Delete',
                    callback: () => {
                        let widget = kodt($triggerElement);

                        widget.delete();
                    }
                };

                let deleteWidgets = {
                    name: 'Delete Selected',
                    callback: () => {
                        displays.forEachWidget((widget) => {
                            if (widget.selected()) {
                                widget.delete();
                            }
                        });
                    }
                };

                let copyAll = {
                    name: 'Copy Selected',
                    callback () {
                        let widgets = [];

                        displays.forEachWidget((widget) => {
                            if (widget.selected()) {
                                widgets.push(widget.getConfig());
                            }
                        });       

                        displays.clipboard = widgets;                 
                    }
                };

                let copy = {
                    name: 'Copy',
                    callback () {
                        let widget = kodt($triggerElement);

                        displays.clipboard = [widget];           
                    }
                };

                let paste = {
                    name: 'Paste Selected',
                    callback (item, opt, event) {
                        let zoom = displays.bindings.zoom() / 100;
                        let widgets = displays.clipboard;
                        let coords = displays.events.contextCoords;
                        let x = coords.offsetX / zoom;
                        let y = coords.offsetY / zoom;
                        let minX = 99999;
                        let minY = 99999;
                        let leftOffset = displays.getLeftOffset();

                        dti.forEachArray(widgets, (cfg) => {
                            minX = Math.min(cfg.left, minX);
                            minY = Math.min(cfg.top, minY);
                        });

                        let xDiff = x - minX;
                        let yDiff = y - minY;
                                // {
                                //     clientX: e.clientX,
                                //     clientY: e.clientY,
                                //     offsetX: e.offsetX,
                                //     offsetY: e.offsetY,
                                //     pageX: e.pageX,
                                //     pageY: e.pageY
                                // };

                        dti.forEachArray(widgets, (cfg) => {
                            cfg.left = (cfg.left - minX) + x;
                            cfg.top = (cfg.top - minY) + y;
                            // let left = cfg.left - minX + leftOffset + xDiff;
                            // let top = cfg.top - minY + yDiff;
                            // cfg.left = left;
                            // cfg.top = top;

                            cfg.isNew = true;
                            if (widgets.length !== 1) {
                                cfg.skipClick = true;
                            }

                            displays.createWidget(cfg);
                        });

                        displays.forEachWidget((widget) => {
                            widget.selected(false);
                        });

                        displays.clipboard = [];
                    }
                };

                let isEditMode = displays.bindings.editMode();
                let options = isEditMode ? editModeOptions : viewModeOptions;

                if (isEditMode) {
                    if (displays.bindings.selecting() !== true && kodt($triggerElement) instanceof BaseWidget) {
                        // add delete option or only delete option?
                        options.items = {
                            delete: deleteWidget,
                            copy
                        };
                    }

                    if (displays.bindings.selecting() === true) {
                       options.items = {
                            deleteAll: deleteWidgets,
                            copy: copyAll
                        };
                    }

                    if (displays.clipboard.length > 0) {
                        options.items.paste = paste;
                    }
                } 

                return options;
            }
        },
        init () {
            let $main = $(document);

            displays.events.contextMenu.init();

            displays.events.selection.init();
            
            $main.on('mousewheel', displays.events.handleMouseWheel);
            $main.mousedown(displays.events.handleMouseDown);
            $main.mouseup(displays.events.handleMouseUp);
            $main.mousemove(displays.events.handleMouseMove);
            $('body').keydown(displays.events.handleKeydown);
        },
        handleKeydown (e) {
            let handlers = {
                // delete
                '46' () {
                    if (displays.bindings.selecting()) {
                        displays.forEachWidget((widget) => {
                            if (widget.selected()) {
                                widget.delete();
                            }
                        });
                    }
                }
            };
            
            let handler = handlers[e.which];

            if (handler) {
                handler();
            }
        },
        handleMouseWheel (e) {
            dti.timeGap('mousewheel');
            let gap = e.deltaY * displays.settings.scrollZoomStep;
            let zoom = displays.bindings.zoom;
            let newZoom = parseFloat(zoom()) + gap;

            zoom(newZoom);
            dti.timeGapPause('mousewheel');
        },
        handleMouseDown (e) {
            let isWidget = $(e.target).closest('.dti-widget').length > 0;
            let isRightClick = e.which === 3;
            let isMiddleClick = e.which === 2;

            if (!isMiddleClick && !isRightClick && e.type === 'mousedown') {
                return;
            }

            if (isRightClick) {
                displays.events.mouseDown = 'right';
            } else if (isMiddleClick) {
                displays.events.mouseDown = 'middle';
            } else {
                displays.events.mouseDown = 'left';
            }

            displays.events.coords = {
                left: e.clientX,
                top: e.clientY
            };

            if (!isWidget) {
                displays.bindings.selection.origLeft(e.clientX);
                displays.bindings.selection.origTop(e.clientY);
            } else {
                displays.events.widgetClicked = true;
            }
        },
        handleMouseUp (e) {
            let shouldCancel = displays.events.mouseDown === 'right';

            // if you clicked after a selection
            // if (displays.bindings.selection.dragging() === false) {
            //     displays.bindings.selection.active(false);
            //     displays.forEachWidget((widget) => {
            //         widget.selected(false);
            //     });
            // }

            setTimeout(() => {
                displays.events.panning = false;
            });

            displays.events.mouseDown = false;
            displays.events.skipDrag = false;
            displays.events.widgetClicked = false;
            // displays.bindings.selection.dragging(false);

            return !shouldCancel;
        },
        handleMouseMove (e) {
            let left = e.clientX;
            let top = e.clientY;

            if (displays.events.mouseDown === 'right') {
                let zoom = displays.bindings.zoom() / 100;
                let diffLeft = (displays.events.coords.left - left);
                let diffTop = (displays.events.coords.top - top);
                let koLeft = displays.bindings.left;
                let koTop = displays.bindings.top;
                let gridSize = displays.bindings.selection.gridSize();

                if (Math.abs(diffLeft) >= gridSize || Math.abs(diffTop) >= gridSize) {

                    ko.viewmodel.updateFromModel(displays.bindings, {
                        left: koLeft() - diffLeft,
                        top: koTop() - diffTop
                    });

                    // make sure it's moved
                    if (diffLeft !== 0 || diffTop !== 0) {
                        displays.events.panning = true;
                    }

                    displays.events.coords = {
                        left: left,
                        top: top
                    };
                }
            }
        }
    },
    qualityCodes: {
        init () {
            var ret = store.get('dti-systemenum-qualityCodes');

            displays.qualityCodes.codes = ret.arr;
            displays.qualityCodes.lookup = ret.obj;
        },
        processQualityCodes (data) {
            var codes = {},
                entries = data.Entries,
                row,
                el,
                newVal,
                code;

            dti.forEach(entries, function processEntry (row) {
                codes[row['Quality Code Label']] = {
                    color: row['Quality Code Font HTML Color'],
                    label: row['Quality Code']
                };
            });

            displays.qualityCodes = codes;

            // dti.forEach(displays.qualityCodeQueue, function processQualityQueue (row) {
            //     el = row.el;
            //     code = row.code;
            //     newVal = row.val;
            //     el.css('color', '#' + displays.qualityCodes[code].color);
            //     el.html(newVal + ' ' + displays.qualityCodes[code].label);
            // });
        }
    },
    socket: {
        init () {
            displays.socket.socket = io.connect(window.location.protocol + '//' + window.location.hostname);

            let socket = displays.socket.socket;

            socket.on('recieveUpdate', displays.socket.handleSocketUpdate);

            socket.on('disconnect', displays.socket.handleSocketDisconnect);

            socket.on('returnFromField', displays.socket.handleSocketFieldCommand);

            $(window).on('unload', function () {
                socket.disconnect();
            });

            dti.on('loaded', () => {
                socket.emit('dynamics', dti.clone(displays.point));
            });
        },

        handleSocketFieldCommand (data) {
            dti.log('field command return:', data);
            if (data.err) {
                Materialize.toast('Command failed: ' + data.err, 3000);
            }
        },

        handleSocketUpdate (dynamic) {
            var val = dynamic.Value,
                upi = dynamic.upi,
                label = dynamic['Quality Label'];

            dti.forEach(displays.lookup.upiMatrix[upi], (widget) => {
                widget.handleDynamicUpdate({ 
                    val,
                    label,
                    dynamic
                });
            });
        },

        handleSocketDisconnect () {
            dti.log('socket disconnect');
        },
        removeUpiListener (widget) {
            var upi = widget.config.upi;

            dti.forEachArray(displays.lookup.upiMatrix[upi], function removeListener(wdgt, idx) {
                if (wdgt.id === widget.id) {
                    displays.lookup.upiMatrix[upi].splice(idx, 1);
                    return false;
                }
            });
        },

        addUpiListener (widget) {
            var upi = widget.config.upi;

            if (!displays.lookup.upiMatrix[upi]) {
                displays.lookup.upiMatrix[upi] = [];
            }

            displays.lookup.upiMatrix[upi].push(widget);
        }
    },

    //utilities
    getDragOffsets () {
        var offset = displays.$container.offset();

        return {
            top: offset.top,
            left: offset.left,
            height: displays.$container.height(),
            width: displays.$container.width(),
            zoom: displays.bindings.zoom()
        };
    },
    ptsToPx (input) {
        return Math.floor(input * (4 / 3));
    },
    editModeOffset: 150,
    getLeftOffset () {
        return displays.bindings.editMode() ? displays.editModeOffset : 0;
    },

    //widget functions
    createWidget (config, type) {
        if (!type) {
            type = config.type;
        }

        dti.merge(config, displays.widgetTemplate);

        let displaysID = dti.makeId();
        config.displaysID = displaysID;

        displays.bindings.screenObjects[type].push({
            cfg: config,
            displaysID,
            type: type
        });
    },
    adjustBindings (bindings, skipScale) {
        let adjustProperties = ['top', 'left', 'width', 'height', 'fontSize'];
        let prefix = 'c';
        let makeComputed = function (prop) {
            if (bindings[prop] !== undefined) {
                // let newBinding = bindings[prefix + prop] = ko.observable(bindings[prop]());
                
                // displays.bindings.zoom.subscribe((zoom) => {
                //     let val = bindings[prop]();

                //     if (val !== null && val !== undefined) {
                //         val = val * (zoom / 100);
                //     }

                //     // requestAnimationFrame(() => {
                //         newBinding(val);
                //     // });
                // });

                bindings[prefix + prop] = ko.pureComputed(() => {
                    dti.timeGap('prefixed computed');
                    let zoom = displays.bindings.zoom();
                    let val = bindings[prop]();

                    if (skipScale) {
                        dti.timeGapPause('prefixed computed');
                        return val;
                    }

                    if (val !== null && val !== undefined) {
                        dti.timeGapPause('prefixed computed');
                        return val * (zoom/100);
                    } 

                    dti.timeGapPause('prefixed computed');
                    return val;
                });
            }
        };

        dti.forEachArray(adjustProperties, (prop) => {
            makeComputed(prop);
        });

        return bindings;
    },
    processScreenObject (object, idx) {
        let scrObj = object['Screen Object'];
        let type = displays.screenObjectTypeMatrix[scrObj];
        let config = object;
        let isValid = true;

        let processAnimation = function (animation) {
            var animID = animation['Animation ID'],
                state = animation.State,
                lookup;

            let file = animation['Animation File'].replace('.gif', '');

            animation['Animation File'] = file;

            type = 'Animation';

            if (animation._saveHeight !== true) {
                animation.animationType = animation.Height;
                animation._saveHeight = true;
            }

            if (animID) {
                if (animation.upi) {
                    lookup = displays.animationUPIs[animation.upi] || [];

                    lookup.push(animID);

                    displays.animationUPIs[animation.upi] = lookup;
                }

                displays.animationIDs[animID] = displays.animationIDs[animID] || {};

                if (state !== undefined) {
                    displays.animationIDs[animID][state] = file;
                }
            } 

            if (animation['Screen Object'] === undefined) {
                isValid = false;
            }
        };

        if (object.widgetType === undefined) {//is old version

            if (scrObj === 3 || scrObj === undefined && object['Animation ID']) { //is animation
                processAnimation(object);
                // dti.log('animation', object);
            }

            config = {
                idx: idx,
                left: object.Left,
                top: object.Top,
                height: object.Height,
                width: object.Width,
                bold: object['Font Bold'] || false,
                italic: object['Font Italic'] || false,
                underline: object['Font Underline'] || false,
                strikethrough: object['Font Strikethru'] || false,
                fontSize: displays.ptsToPx(object['Font Size']),
                color: object['Foreground Color'],
                transparent: object['Background Color'] === '1',
                fontName: object['Font Name'],
                text: object.Text || undefined,
                precision: object.Precision,
                pointType: object['Point Type'],
                upi: object.upi,
                animationID: object['Animation ID'],
                animationFile: object['Animation File'],
                animationType: object.animationType,
                state: object.State
            };

            if (config.upi !== undefined) {
                config.pointType = displays.pointTypes[config.upi];
            }

            if (type === 'Button' && object.ActionCode !== undefined) {
                config.actionButtonConfig = {
                    actionCode: object.ActionCode,
                    from: object.ActionFromTime,
                    to: object.ActionToTime,
                    interval: object.ActionReportInterval,
                    text: object.ActionText,
                    parameter: object.ActionParm,
                    upi: object.ActionPoint,
                    priority: object.ActionPriority
                };
            }
        } else {
            type = config.widgetType;
        }

        let displaysID = dti.makeId();
        config.displaysID = displaysID;

        if (isValid) {
            config.new = false;

            return {
                cfg: config,
                type: type,
                displaysID
            };
        }

        
    },
    setBackgroundUrl (pic) {
        displays.bindings.backgroundImage = pic;
    },
    forEachWidget (fn) {
        dti.forEach(displays.widgets, (widgets) => {
            dti.forEach(widgets, (widget) => {
                fn(widget);
            });
        });
    },
    getSelectedWidgets () {
        let ret = [];

        displays.forEachWidget((widget) => {
            if (widget.selected()) {
                ret.push(widget);
            }
        });

        return ret;
    },
    save () {
        let data = new FormData();
        let widgetsToSave = [];
        displays.forEachWidget((widget) => {
            let config = widget.getConfig();

            if (!config.isPreview) {
                widgetsToSave.push(config);
            }
        });

        displays._widgetsToSave = widgetsToSave;
        displays.point['Screen Objects'] = widgetsToSave;

        dti.forEach(displays.filesToUpload, (obj, key) => {
            // obj = displays.filesToUpload[list[c]];
            if (obj.file) {
                dti.log('appending', obj.name);
                data.append(obj.name, obj.file);
            } else {
                dti.forEach(obj, (innerObj) => {
                    dti.log('appending', innerObj.name);
                    data.append(innerObj.name, innerObj.file);
                });
            }
        });

        let displayProperties = [{
            old: 'Background Color',
            new: 'backgroundColor'
        }, {
            old: 'Background Picture',
            fn() {
                // what was I thinking?
                if (displays.bindings.backgroundImageData()) {
                    return displays.bindings.backgroundImage();
                }
                return displays.bindings.backgroundImage();
            }
        }, {
            old: 'Height',
            new: 'height'
        }, {
            old: 'Width',
            new: 'width'
        }];

        dti.forEachArray(displayProperties, (prop) => {
            let ret;

            if (prop.fn) {
                ret = prop.fn();
            } else {
                ret = displays.bindings[prop.new]();
            }

            displays.point[prop.old] = ret;
        });

        displays.point['Background Picture'] = displays.bindings.backgroundImage();

        data.append('display', JSON.stringify(displays.point));

        let doSave = function () {
            $.ajax({
                url: '/displays/publish',
                processData: false,
                type: 'POST',
                cache: false,
                contentType: false,
                data: data
            }).done((data) => {
                var msg,
                    delay = 1000;

                if (data.err) {
                    msg = 'Save Error: ' + data.err;
                } else {
                    msg = 'Save Result: ' + data.msg;
                    // widgets.onSave();
                }

                Materialize.toast(msg, delay);

                // setTimeout(() => {
                //     displays.bindings.toggleEditMode();
                // }, delay);
            });
        };

        if (displays.settings.isNew) {
            displays.socket.socket.emit('addPoint', [{
                newPoint: displays.point
            }]);

            displays.socket.socket.once('pointUpdated', (data) => {
                let msg;
                let delay = 1000;
                let point = data.points && data.points[0];

                if (data.err) {
                    msg = 'Save Error: ' + data.err;
                } else {
                    msg = 'Save Result: ' + data.message;

                    doSave();

                    displays.point = point;
                    displays.settings.isNew = false;
                    displays.forEachWidget((widget) => {
                        widget.isNew(false);
                    });
                    // widgets.onSave();
                }

                Materialize.toast(msg, delay);
                setTimeout(() => {
                    displays.bindings.toggleEditMode();
                }, delay);
            });
        } else {
            displays.socket.socket.emit('updatePoint', {
                oldPoint: displays.settings.originalPoint,
                newPoint: displays.point
            });

            displays.socket.socket.once('pointUpdated', (data) => {
                var msg,
                    delay = 1000;

                if (data.err) {
                    msg = 'Save Error: ' + data.err;
                } else {
                    msg = 'Save Result: ' + data.message;
                    displays.settings.originalPoint = dti.clone(displays.point);
                    displays.forEachWidget((widget) => {
                        widget.isNew(false);
                    });
                    doSave();
                    // widgets.onSave();
                }

                Materialize.toast(msg, delay);
                setTimeout(() => {
                    displays.bindings.toggleEditMode();
                }, delay);
            });
        }

    },
    handleWidgetPoint (pointData) {
        dti.log('widgetPoint', arguments);
    },

    //display functions
    centerDisplay () {
        var winWidth = window.innerWidth,
            winHeight = window.innerHeight,
            $container = $('.displayContainer'),
            containerWidth = $container.width(),
            containerHeight = $container.height(),
            newLeft = (winWidth - containerWidth) / 2,
            newTop = (winHeight - containerHeight) / 2;

        if (newLeft < 0) {
            newLeft = 0;
        }

        if (newTop < 0) {
            newTop = 0;
        }

        displays.bindings.left(newLeft); 
        displays.bindings.top(newTop);
    },
    zoomToFitWindow () {
        var bindings = ko.toJS(displays.bindings),
            zoom = +bindings.zoom,
            displayWidth = parseInt(displays.bindings.width(), 10) * (zoom * 0.01),
            displayHeight = parseInt(displays.bindings.height(), 10) * (zoom * 0.01),
            winWidth = window.innerWidth - displays.getLeftOffset(),
            winHeight = window.innerHeight,
            percentageWidthDiff = winWidth / displayWidth,
            percentageHeightDiff = winHeight / displayHeight,
            zoomTo;

        if (percentageWidthDiff < 1 || percentageHeightDiff < 1) {
            if (percentageWidthDiff < 1 && percentageHeightDiff < 1) {
                zoomTo = Math.min(percentageWidthDiff, percentageHeightDiff);
            } else if (percentageHeightDiff < 1 && (percentageWidthDiff > percentageHeightDiff)) {
                zoomTo = percentageHeightDiff;
            } else if (percentageWidthDiff < 1 && (percentageHeightDiff > percentageWidthDiff)) {
                zoomTo = percentageWidthDiff;
            }
        } else if (percentageWidthDiff > 1 || percentageHeightDiff > 1) {
            if (percentageWidthDiff > 1 && percentageHeightDiff > 1) {
                zoomTo = Math.min(percentageWidthDiff, percentageHeightDiff);
            } else if (percentageHeightDiff > 1 && (percentageWidthDiff < percentageHeightDiff) && percentageWidthDiff !== 1) {
                zoomTo = percentageHeightDiff;
            } else if (percentageWidthDiff > 1 && (percentageHeightDiff < percentageWidthDiff)) {
                zoomTo = percentageWidthDiff;
            }
        }

        if (zoomTo) {
            zoomTo = Math.round(zoomTo * zoom);
            displays.bindings.zoom(zoomTo);
            displays.bindings.scale(1);
        }
    },

    //init/workflow
    loadComplete (config) {
        dti.log('window config', config);
    },
    init () {
        dti.on('loaded', function onLoad () {
            let cfg = window.getWindowParameters ? window.getWindowParameters() : {};

            displays.windowCfg = cfg;

            // dti.onLoadFn(() => {
                if (cfg.desktop) {
                    // $('main').addClass('desktop');
                    // displays.bindings.editMode(true); //temporary
                    displays.bindings.desktop(true);
                    displays.zoomToFitWindow();
                    displays.centerDisplay();
                } else {
                    let width = displays.point.Width;
                    let height = displays.point.Height;

                    if (displays.settings.isNew) {
                        width += displays.editModeOffset;
                    }

                    if (cfg.popout) {
                        dti.log('popout resizing window');
                        dtiUtility.updateWindow('resize', {
                            width,
                            height
                        }, () => {
                            dti.log('Resizing window cb');
                            setTimeout(() => {
                                dti.log('Resizing window');
                                displays.zoomToFitWindow();
                                if (!displays.settings.isNew) {
                                    displays.centerDisplay();
                                }
                            }, 10000);
                        });
                    } else {
                        dtiUtility.updateWindow('resize', {
                            width,
                            height
                        }, () => {
                            displays.zoomToFitWindow();
                            if (!displays.settings.isNew) {
                                displays.centerDisplay();
                            }
                        });
                    }

                    
                }
            // });
            setTimeout(() => {
                dti.onLoadFn();
            });

            // dti.log('windowid', window.windowId);
            // dtiUtility.getWindowParameters(displays.point._id, displays.loadComplete);
        });

        dtiUtility.getSystemEnum('controlpriorities', (priorities) => {
            displays.system.controlPriorities = priorities;

            if (displays.settings.bindingsLoaded === true) {
                ko.viewmodel.updateFromModel(displays.bindings.controlPriorities, priorities);
            } else {
                displays.bindings.controlPriorities = priorities;
            }
        });

        //// dti.time('events');
        dti.events.init();
        //// dti.timeEnd('events');

        //// dti.time('display events');
        displays.events.init();
        //// dti.timeEnd('display events');

        //// dti.time('quality code');
        displays.qualityCodes.init();
        //// dti.timeEnd('quality code');

        //// dti.time('socket');
        displays.socket.init();
        //// dti.timeEnd('socket');

        //// dti.time('point');
        displays.initDisplayPoint();
        //// dti.timeEnd('point');

        //// dti.time('bindings');
        displays.initBindings();
        //// dti.timeEnd('bindings');

        // set delay due to getWindowParameters not always showing up
        let interval = setInterval(() => {
            if (window.getWindowParameters !== undefined) {
                clearInterval(interval);
                displays.postInit();
            }
        }, 50);
        // setTimeout(() => {
        //     displays.postInit();
        // });

        dti.log('Display load time:', (new Date() - displays._startLoad)/1000, 'seconds');
    },
    initDisplayPoint () {
        if (Object.keys(window.point).length === 0) {
            let cfg = window.getWindowParameters();

            //new display
            displays.point = cfg.pointData;

            displays.settings.isNew = true;
            displays.bindings.editMode = true;
        }

        var point = displays.point,
            list = displays.point['Screen Objects'] || [],
            screenObject,
            pointRef,
            upiList = [];

        displays.settings.originalPoint = dti.clone(displays.point);

        widgets.tooltipMenuBindings = displays.widgetTemplate;

        dti.forEach(widgets.classes, (clsFn, className) => {
            displays.bindings.screenObjects[className] = [];
        });

        //todo update structure, translate first
        displays.setBackgroundUrl(displays.point['Background Picture']);
        displays.bindings.backgroundColor = '#' + displays.point['Background Color'];
        displays.bindings.bgHeight = displays.bindings.height = displays.point.Height;
        displays.bindings.bgWidth = displays.bindings.width = displays.point.Width;

        // widgets.manager = new widgets.WidgetManager(displays.$container);

        // dti.timeGap('each screen object loop');
        dti.forEachArray(list, function processScreenObjects (screenObject, idx) {
            var config = displays.processScreenObject(screenObject, idx);

            if (config) {
                // config.cfg.isNew = true;

                if (!displays.bindings.screenObjects[config.type]) {
                    displays.bindings.screenObjects[config.type] = [config];
                } else {
                    displays.bindings.screenObjects[config.type].push(config);
                }
            }

            // dti.timeGap('createone');
            // widgets.createWidget(config.type, config.cfg);
            // dti.timeGapPause('createone');
        });
        // dti.timeGapPause('each screen object loop');

        let timerList = [];
        dti.forEach(dti._gapTimers, (val, prop) => {
            let time = dti.timeGapEnd(prop, true);
            timerList.push([prop, time]);
        });

        timerList.sort((a, b) => {
            return a[1] - b[1];
        });

        displays.pointInfo = {};
        dti.forEachArray(window.displayInfo.points, (point) => {
            displays.pointInfo[point._id] = point;
        });

        displays.bindings.widgetsReady = true;

        // dti.forEachArrayRev(timerList, (item) => {
        //     dti.log(item[0] + ':', item[1]);
        // });
    },
    initBindingHandlers () {
        let bindingHandlers = {
            delegate: {
                init: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
                    let $element = $(element);
                    let scope = bindingContext.$rawData;
                    let delegations = ko.utils.unwrapObservable(valueAccessor());
                    let makeHandler = (fn) => {
                        return (e) => {
                            fn.call(scope, e);
                            e.preventDefault();
                        };
                    };

                    dti.forEachArray(delegations, (cfg) => {
                        $element.on(cfg.event, cfg.selector, makeHandler(cfg.handler));
                    });

                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        dti.forEachArray(delegations, (cfg) => {
                            $element.off(cfg.event, cfg.selector, makeHandler(cfg.handler));
                        });
                    });
                }
            },

            dtiTooltip: {
                init (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    let $el = $(element);
                    let parent = $el.parent()[0];
                    let observable = koUnwrap(valueAccessor());
                    let disable = koUnwrap(allBindings().dtiTooltipDisable);

                    if (!disable) {
                        if (observable !== '') {
                            // dti.log($el, observable);
                            $el.attr('data-tooltip', observable);
                            $el.tooltip({
                                delay: 50
                            });
                        }

                        // let observer = new MutationObserver((mutations) => {
                        //     dti.log('in observer');
                        //     if (!parent.contains(element)) {
                        //         dti.log('REMOVED');
                        //         $el.tooltip('remove');
                        //     }
                        // });

                        // observer.observe(parent, {
                        //     childList: true
                        // });


                        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                            $el.tooltip('remove');
                        });
                    }

                    
                },
                update (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    let $el = $(element);
                    let tooltipId = $el.data('tooltip-id');
                    
                    let observable = koUnwrap(valueAccessor());
                    let disable = koUnwrap(allBindings().dtiTooltipDisable);

                    if (!disable) {
                        if (observable !== '') {
                            if (!!tooltipId) {
                                let $tooltip = $('#' + tooltipId);
                                $tooltip.find('span').text(observable);
                            } else {
                                $el.attr('data-tooltip', observable);
                                $el.tooltip({
                                    delay: 50
                                });
                            }
                        } else {
                            if (!!tooltipId) {
                                $el.tooltip('remove');
                                $el.data('tooltip-id', null);
                            }
                        }
                    }
                }
            },

            stopBindings: {
                init() {
                    return {
                        controlsDescendantBindings: true
                    };
                }
            },

            widgetPreview: {
                init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var $element = $(element),
                        type = valueAccessor();

                    $element.data('widget-type', type);

                    // setTimeout(() => {
                    //     widgets.createWidgetPreview(type, $element);
                    // });

                    return {
                        controlsDescendantBindings: true
                    };
                }
            },

            spectrum: {
                init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    let $element = $(element);
                    let observable = valueAccessor();
                    let allBindings = allBindingsAccessor();
                    let appendTo = allBindings.appendTo;
                    let observer;
                    let setColor = function (color) {
                        observable(color);
                    };

                    let colorToHex = function (color) {
                        if (color.substr(0, 1) === '#') {
                            return color;
                        }

                        let splitRGB = color.split('(')[1].split(')')[0];

                        splitRGB = splitRGB.split(',');

                        let colors = splitRGB.map((c) => { //For each array element
                            c = parseInt(c).toString(16); //Convert to a base16 string
                            return (c.length === 1) ? '0' + c : c; //Add zero if we get only one character
                        });

                        return '#' + colors.join('');
                    };

                    let setObserver = function () {
                        let $parent = $element.parent();
                        let $preview = $parent.find('.sp-preview-inner');

                        observer = new MutationObserver((mutations) => {
                            dti.forEachArray(mutations, (mutation) => {
                                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                                    let bgColor = mutation.target.style.backgroundColor;
                                    let color = colorToHex(bgColor);
                                    setColor(color);
                                }
                            });
                        });

                        observer.observe($preview[0], {
                            attributes: true
                        });
                    };

                    $element.spectrum({
                        color: observable(),
                        preferredFormat: 'hex',
                        // change: setColor,
                        // move: setColor,
                        show: setObserver,
                        containerClassName: 'white',
                        showInitial: true,
                        showInput: true,
                        appendTo: $element.parent() //appendTo ? $element.parents(appendTo) : $element.parent()
                    });

                    //if they click on a widget element twice, this will trigger so there exists only one instance on an element
                    ko.utils.domNodeDisposal.addDisposeCallback(element, function destroySpectrum() {
                        $element.spectrum('destroy');

                        if (observer) {
                            observer.disconnect();
                        }
                    });
                }
            },

            fadeVisible: {
                init(element, valueAccessor) {
                    // Initially set the element to be instantly visible/hidden depending on the value
                    var value = valueAccessor();
                    $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
                },
                update(element, valueAccessor) {
                    // Whenever the value subsequently changes, slowly fade the element in or out
                    var value = valueAccessor(),
                        $element = $(element);

                    if (ko.unwrap(value)) {
                        dti.animations.fadeIn($element);
                    } else {
                        dti.animations.fadeOut($element);
                    }
                }
            },

            materialSelect: {
                init(element, valueAccessor, allBindingsAccessor, viewModel) {
                    var $element = $(element);

                    $element.material_select();
                },
                update(element, valueAccessor, allBindingsAccessor, viewModel) {
                    // $(element).material_select();
                }
            },

            dropdown: { // ch900; added binding
                // :: DROPDOWN USE & NOTES ::
                // (1)  The actual dropdown is expected to be a child of 'element', or the next immediate sibling, and it must contain the '.dtiDropdown' class
                // (2)  The dropdown respects CSS max and min width/height rules if present.
                // (3)  This dropdown can be used as-is without any values, i.e. <div data-bind="dropdown"> for the default behavior (see defaults below). Options can be
                //      provided through the valueAccessor, data-* attributes on the DOM element, or both. data-* attributes take priority over valueAccessor attributes.
                //      data-* DOM attributes translate to JS attributes as follows:
                //      <div data-drop-up="true"> translates to { dropUp: true }
                //      <div data-keep-in-viewport="true"> translates to { keepInViewport: true }, etc. etc.
                init(element, valueAccessor, allBindingsAccessor, viewModel) {
                    let $element = $(element);      // Source element
                    let $parent = $element.parent();// Source element's parent
                    let $posParent = $(window);     // This is the parent element the drop down is referenced to for positioning purposes
                    let offsetFn = 'offset';        // This is the dropdown function to use to get the dropdown's coordinates relative to posParent
                    let defaults = {
                        dropUp: false,              // <optional - boolean - set true to drop up; drops down otherwise>
                        alignment: 'left',          // <optional - string - drop position: 'left', 'center', or 'right'
                        width: 'auto',              // <optional - string - drop width 'auto' or 'element' (if element, dropdown width matches width of the source element)
                        keepInViewport: false,      // <optional - boolean - sacrifice alignment to keep the the dropdown in the viewport (applies to left/right & top/bottom)>
                        openOnClick: true,          // <optional - boolean - open the dropdown when the user clicks on the source element>
                        closeOnClick: true,         // <optional - boolean - close the dropdown when the user clicks on the source element>
                        closeOnDropdownClick: true, // <optional - boolean - close the dropdown when the user clicks anywhere inside the dropdown>
                        closeOnBodyClick: true,     // <optional - boolean - close the dropdown when the user clicks anywhere outside the dropdown>
                        origin: 'element',          // <optional - string - dropdown x,y origin is based on the 'element' (i.e. source element), 'cursor' (x,y cursor coords), or 'target'
                        offsetOrigin: true,         // <optional - boolean - position dropdown above or below the origin, depending on if dropping up or down, respectively (versus cover the origin); ignored if origin='click'>
                        delayHide: false,           // <optional - boolean - delay for hiding the dropdown on a click - required if closeOnDropdownClick is true and you have delegated click handlers on the list elements                        
                        delayHideTimer: 100,        // <optional - integer - ms delay if delayHide is true
                        animationSpeed: 200,        // <optional - integer - dropdown open/close animation speed; this must match the '.dtiDropdown' CSS transition setting>
                        vOffset: 0,                 // <optional - integer - vertical offset from the origin by this amount>
                        hOffset: 0,                 // <optional - integer - horizontal offset from the origin by this amount>
                        activeClass: 'active'       // <optional - string - class applied to the source element when the dropdown is active>
                    };
                    let options = ko.utils.unwrapObservable(valueAccessor()) || {};
                    let config = $.extend(true, defaults, kojs(options), $element.data()); // data-* attributes in the view take priority; ch928
                    let $dropdown = $element.find('.dtiDropdown').first();
                    let constraints = {                                             // These are contraining widths/heights the user has set. Save these before we touch the css values in showing/hiding the dropdown
                        maxWidth: parseInt($dropdown.css('maxWidth'), 10) || 9999,  // Maximums yield 'none' if unset; if unset we push the max out to an unrealistic value
                        maxHeight: parseInt($dropdown.css('maxHeight'), 10) || 9999,
                        minWidth: parseInt($dropdown.css('minWidth'), 10),          // Minimums yield '0px' if unset
                        minHeight: parseInt($dropdown.css('minHeight'), 10)
                    };
                    let id = dti.makeId();
                    let timerId = 0;
                    let isShown = false;
                    let getOrigin = (event) => {
                        if (config.origin === 'element') {
                            return $element;
                        } else if (config.origin === 'cursor') {
                            return {
                                offset() {
                                    return {
                                        left: event.pageX,
                                        top: event.pageY
                                    };
                                },
                                position() {
                                    return {
                                        left: event.pageX,
                                        top: event.pageY
                                    };
                                },
                                outerHeight() {
                                    return 0;
                                },
                                outerWidth() {
                                    return 0;
                                }
                            };
                        } else { // 'target'
                            return $(event.target);
                        }
                    };
                    let positionDropdown = (action, event = {}) => {
                        let $origin = getOrigin(event);
                        let originOffset = $origin && $origin[offsetFn]();

                        if (!originOffset) {
                            return dti.log("Cannot", action, "dropdown because the origin is not on screen. Event data is", event);
                        }

                        let hideDropdown = (setDisplayNone) => {
                            let cssCfg = {
                                minWidth: '0px',
                                minHeight: '0px',
                                height: '0px',
                                width: '0px',
                                opacity: 0
                            };

                            // If we're center aligned
                            if (config.alignment === 'center') {
                                // Do a vertical-only collapse
                                delete cssCfg.width;
                            }

                            let doHide = function () {
                                if ($dropdown) {
                                    $dropdown.css(cssCfg);
                                    $element.removeClass(config.activeClass);
                                }
                            };

                            if (!!config.delayHide) {
                                setTimeout(() => {
                                    doHide();
                                }, config.delayHideTimer);
                            } else {
                                doHide();
                            }
                            

                            if (setDisplayNone) {
                                timerId = setTimeout(() => {
                                    $dropdown.css('display', 'none');
                                }, config.animationSpeed);
                            }
                        };
                        let showDropdown = (requestConfig) => {
                            let cfg = {
                                transition: '',
                                display: 'flex',
                                opacity: 1,
                                minWidth: '',
                                minHeight: ''
                            };

                            // For some reason the dropdown wouldn't animate open after just previously updating the css without a small delay (it was instantly opening)
                            timerId = setTimeout(() => {
                                $dropdown.css($.extend(cfg, requestConfig));
                                $dropdown.scrollTop(0);
                                $element.addClass(config.activeClass);
                            }, 50);
                        };
                        let getPositioning = () => {
                            let parentWidth = $posParent.width();
                            let parentHeight = $posParent.height();

                            // Source size and position (save before we mess with it - we'll get positioning just below)
                            let source = {
                                width: $dropdown.css('width'),
                                height: $dropdown.css('height'),
                            };
                            // Target size & position
                            let target = {};

                            // Get source positioning
                            if (config.dropUp) {
                                source.bottom = $dropdown.css('bottom');
                            } else {
                                source.top = $dropdown.css('top');
                            }
                            if (config.alignment === 'right') {
                                source.right = $dropdown.css('right');
                            } else { // alignment is 'left' or 'center'
                                source.left = $dropdown.css('left');
                            }

                            // Make the dropdown visible so we can get positioning & sizing
                            $dropdown.css({
                                transition: 'inherit',
                                display: 'flex',
                                opacity: 1,
                                width: 'auto',
                                height: 'auto'
                            });

                            // Get the dropdown sizing & positioning; its initial position is the origin's position
                            let width = config.width === 'auto' ? $dropdown.outerWidth() : $element.outerWidth();
                            let height = $dropdown.outerHeight();

                            // Get the origin sizing & positioning
                            let originWidth = $origin.outerWidth();
                            let originHeight = $origin.outerHeight();
                            let originLeft = originOffset.left;
                            let originTop = originOffset.top;

                            // Check constraints
                            if (height > constraints.maxHeight) {
                                height = constraints.maxHeight;
                            } else if (height < constraints.minHeight) {
                                height = constraints.minHeight;
                            }
                            if (width > constraints.maxWidth) {
                                width = constraints.maxWidth;
                            } else if (width < constraints.minWidth) {
                                width = constraints.minWidth;
                            }
                            target.height = height;
                            target.width = width;

                            // Get target positioning
                            if (config.alignment === 'right') {
                                target.right = parentWidth - originLeft - originWidth + config.hOffset;
                            } else if (config.alignment === 'center') {
                                target.left = originLeft - (width/2) + (originWidth/2) + config.hOffset;
                            } else { // 'left'
                                target.left = originLeft + config.hOffset;
                            }

                            if (config.dropUp) {
                                target.bottom = parentHeight - originTop + config.vOffset;

                                if (!config.offsetOrigin) {
                                    target.bottom -= originHeight;
                                }
                            } else {
                                target.top = originTop + config.vOffset;

                                if (config.offsetOrigin) {
                                    target.top += originHeight;
                                }
                            }

                            // Relocate dropdown if it's overflowing the viewport - this overrides dropdown alignment
                            if (config.keepInViewport) {
                                // Check left/right
                                let hOverflow = ((target.right || target.left) + width) - parentWidth;
                                if (hOverflow > 0) {
                                    if (target.right) {
                                        target.right -= hOverflow;
                                    } else {
                                        target.left -= hOverflow;
                                    }
                                }
                                // Check top/bottom
                                let vOverflow = ((target.top || target.bottom) + height) - parentHeight;
                                if (vOverflow > 0) {
                                    if (target.top) {
                                        target.top -= vOverflow;
                                    } else {
                                        target.bottom -= vOverflow;
                                    }
                                }
                            }

                            // Append 'px' to all target key values
                            dti.forEach(target, (val, key) => {
                                target[key] = val + 'px';
                            });

                            return {
                                source: source,
                                target: target
                            };
                        };

                        if (action === 'hide') {
                            hideDropdown(true);
                        } else if (action === 'show') {
                            // Get the target positioning
                            let cfg = getPositioning();
                            // Position the dropdown where it will be shown
                            $dropdown.css(cfg.target);
                            // Hide the dropdown
                            if (isShown) {
                                hideDropdown();
                            }
                            // Animate to the target position
                            showDropdown(cfg.target);
                        } else { // update
                            // Get positioning
                            let cfg = getPositioning();
                            // Reset the positioning
                            $dropdown.css(cfg.source);
                            // Animate to the target position
                            showDropdown(cfg.target);
                        }
                    };
                    let handlers = {
                        show(event) {
                            positionDropdown('show', event);
                            isShown = true;
                        },
                        hide(event) {
                            positionDropdown('hide', event);
                            isShown = false;
                        },
                        update(event) {
                            if (!isShown) {
                                handlers.show(event);
                            } else {
                                positionDropdown('update', event);
                            }
                        }
                    };
                    let handleEventMessage = (data) => {
                        // data = {
                        //     id: int,             // <required - target dropdown instance id>
                        //     method: function,    // <required - target dropdown function>
                        //     data: *              // <optional - object, int, string, whatever>
                        // }
                        if (data && (data.id === id)) {
                            if (handlers[data.method]) {
                                handlers[data.method](data.data);
                            } else {
                                dti.log('Dropdown binding', id, 'has no method', data.method);
                            }
                        }
                    };
                    let handleBodyClick = (event) => {
                        let $target = $(event.target);

                        if (!isShown) {
                            if (config.openOnClick && $target.closest($element).length) {
                                handlers.show(event);
                            }
                        } else {
                            if ($target.closest($dropdown).length) {
                                if (config.closeOnDropdownClick) {
                                    handlers.hide(event);
                                }
                            } else if ($target.closest($element).length) {
                                if (config.closeOnClick) {
                                    handlers.hide(event);
                                }
                            } else if (config.closeOnBodyClick) {
                                handlers.hide(event);
                            }
                        }
                    };

                    // If the dropdown wasn't found inside our binding element
                    if (!$dropdown.length) {
                        // See if it's the next sibling
                        $dropdown = $element.next();

                        if (!$dropdown.length || ($dropdown[0].className.indexOf('dtiDropdown') < 0)) {
                            return dti.log('ko.bindingHandlers.dropdown:', '.dtiDropdown not found within or after $element', $element);
                        }
                    }

                    // See if the parent element should be something besides the default (window). The dropdown uses 'fixed'
                    // positioning, so if we have a parent with 'fixed' position, we have to reference that element when
                    // positioning the dropdown
                    dti.forEachArray($element.parents(), function (el) {
                        let $el = $(el);

                        if ($el.css('position') === 'fixed') { // If the parent is fixed position
                            $posParent = $el;
                            offsetFn = 'position';
                            return false;
                        }
                    });

                    // This is the only modification to the received options object! Install our unique id on the options object.
                    // The author needs this id to call one of our handler methods via dti event messaging
                    options.id = id;

                    // Setup event listeners
                    if (config.openOnClick || config.closeOnClick || config.closeOnDropdownClick || config.closeOnBodyClick) {
                        dti.events.bodyClick(handleBodyClick);
                    }

                    dti.on('callDropdownMethod', handleEventMessage);

                    // Cleanup
                    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
                        clearTimeout(timerId);
                        dti.off('callDropdownMethod', handleEventMessage);
                        // TODO unregister body click handler
                        $element = null;
                        $dropdown = null;
                        options = null;
                    });
                }
            },

            dtiDatePicker: {
                init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    let boundDate = valueAccessor();
                    let container = allBindingsAccessor().dtiDatePickerContainer || 'main';
                    let onCloseFn = allBindingsAccessor.get('onClose') || dti.emptyFn;
                    let scope = bindingContext.$rawData;

                    //observable is moment object
                    $(element).pickadate({
                        container: container,
                        onSet(val) {
                            var picked;

                            if (!!val.select) {
                                boundDate(val.select);
                                onCloseFn.call(scope);

                                // boundDate.set({
                                //     date: picked.day(),
                                //     month: picked.month(),
                                //     year: picked.year()
                                // });
                            }
                            // observable(val.highlight.obj);
                        }
                    });
                },
                update(element, valueAccessor, allBindings) {
                    var $element = $(element),
                        boundDate = valueAccessor();

                    dti.pauseDatePick = true;

                    $element.pickadate('picker').set('select', boundDate());

                    dti.pauseDatePick = false;
                }
            },

            dtiTimePicker: {
                init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    let container = koUnwrap(valueAccessor()) || 'main';
                    let onCloseFn = allBindingsAccessor.get('onClose') || dti.emptyFn;
                    let scope = bindingContext.$rawData;
                    let cb = function () {
                        onCloseFn.apply(scope, arguments);
                    };
                    $(element).pickatime({
                        container: container,
                        autoclose: true,
                        twelvehour: false,
                        afterDone: cb
                    });

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function disposeTaskbarMenu() {
                        $(element).data('clockpicker').remove();
                    });
                },
                update(element, valueAccessor, allBindings) {}
            },

            //labelID: 'child' if using a container, labelID: 'sibling' if it's input then label
            labelID: {
                init(element, valueAccessor) {
                    let type = valueAccessor();

                    let $el = $(element);
                    let id = dti.makeId();

                    let $input;
                    let $label;

                    if (type === 'sibling') {
                        $input = $el;
                        $label = $input.next('label');
                    } else if (type === 'child') {
                        $input = $el.find('input');
                        $label = $el.find('label');
                    }

                    $input.attr('id', id);
                    $label.attr('for', id);
                }
            },

            fileUpload: {
                init (element, valueAccessor, allBindings, viewModel) {
                    let $el = $(element);
                    let config = koUnwrap(valueAccessor());
                    let context = config.context;
                    let fileName = config.fileName || '';
                    let data = config.option || '';
                    let onImgLoadFn = config.onImgLoad || dti.emptyFn;
                    let onLoadFn = config.onLoad || dti.emptyFn;

                    $el.change(function (e) {
                        let file = element.files[0];
                        let reader = new FileReader();

                        reader.onload = function (ee) {
                            let image = new Image();

                            dti.log('image upload', this);

                            image.onload = function (event) {
                                let args = Array.prototype.slice.call(arguments);
                                dti.log('image dimensions', image.width, image.height);
                                args.push(this);
                                onImgLoadFn.call(context, event, image);
                            };
                            image.src = ee.target.result;

                            onLoadFn.call(context, {
                                src: ee.target.result,
                                file,
                                data
                            });
                        };

                        reader.readAsDataURL(file);
                    });
                }
            }
        };

        dti.merge(ko.bindingHandlers, bindingHandlers);

        // virtual elements
        ko.virtualElements.allowedBindings.stopBindings = true;

        ko.observable.fn.withPausing = function () {
            this.notifySubscribers = function () {
                if (!this.pauseNotifications) {
                    ko.subscribable.fn.notifySubscribers.apply(this, arguments);
                }
            };

            this.silentUpdate = function (newValue) {
                this.pauseNotifications = true;
                this(newValue);
                this.pauseNotifications = false;
            };

            return this;
        };
    },
    initBindings () {
        // ko.options.deferUpdates = true;

        // dti.time('binding handlers');
        displays.initBindingHandlers();
        // dti.timeEnd('binding handlers');

        // displays.bindings.currWidget = displays.widgetTemplate;

        // dti.time('from model');
        displays.bindings = ko.viewmodel.fromModel(displays.bindings);
        // dti.timeEnd('from model');

        // displays.bindings.zoom.extend({
        //     deferred: true
        // });

        // displays.bindings.zoomSync = ko.computed(() => {
        //     dti.timeGap('zoomSync');
        //     let scale = displays.bindings.scale();
        //     let zoom = displays.bindings.zoom;
        //     let newZoom = scale * (zoom()/100);
        //     dti.log('sync', newZoom);
        //     dti.timeGapPause('zoomSync');

        //     dti.timeGap('zoomSyncApply');
        //     zoom(newZoom * 100);
        //     dti.timeGapPause('zoomSyncApply');

        //     dti.timeGap('zoomSyncScale');
        //     displays.bindings.scale(1);
        //     dti.timeGapPause('zoomSyncScale');
        // }).extend({
        //     rateLimit: {
        //         timeout: 300,
        //         method: 'notifyWhenChangesStop'
        //     }
        // });

        // displays.bindings.effectiveZoom = ko.pureComputed({
        //     read() {
        //         let bindings = displays.bindings;

        //         return bindings.zoom() * bindings.scale();
        //     },
        //     write(val) {
        //         displays.bindings.scale(1);
        //         displays.bindings.zoom(val);
        //     }
        // });

        displays.settings.bindingsLoaded = true;

        // $.extend(displays.bindings.currWidget, {
        //     edit: dti.emptyFn,
        //     delete: dti.emptyFn,
        //     save: dti.emptyFn
        // });

        $.extend(true, displays.bindings, {
            toggleDisplayProperties () {
                displays.bindings.showDisplaySettings(!displays.bindings.showDisplaySettings());
            },
            cancelEdit () {
                displays.bindings.toggleEditMode(true);
            },
            toggleEditMode (isCancel) {
                var isEdit = !displays.bindings.editMode(),
                    editModeOffset = displays.editModeOffset,
                    displayWidth = parseInt(displays.bindings.width(), 10),
                    displayHeight = parseInt(displays.bindings.height(), 10),
                    displayLeft = parseInt(displays.bindings.left(), 10);

                displays.bindings.transitioning(true);
                displays.bindings.editMode(isEdit);

                if (isEdit) {
                    dti.fire('editMode');
                    // displays.bindings.editMode(isEdit);
                    if (displays.windowCfg.desktop) {
                        // let left = displays.bindings.left();
                        // if (left < displays.editModeOffset) {
                        //     displays.bindings.left(displays.editModeOffset);
                        // }// else it's already over enough by being centered
                    } else {
                        dtiUtility.updateWindow('resize', {
                            width: (displayWidth + editModeOffset) + 'px'
                        });
                    }
                } else {
                    dti.fire('viewMode');
                    displays.bindings.showDisplaySettings(false);
                    displays.forEachWidget((widget) => {
                        if (widget.isNew() && isCancel) {
                            widget.delete(true);
                        } else if (widget._originalConfig !== undefined) {
                            if (isCancel) {
                                dti.updateFromModel(widget, widget._originalConfig);
                            }

                            delete widget._originalConfig;
                        }

                        widget.selected(false);
                    });

                    if (isCancel) {
                        displays.bindings.width(displays.point.Width);
                        displays.bindings.height(displays.point.Height);
                        displays.bindings.backgroundImageData('');
                        displays.bindings.backgroundImage(displays.point['Background Picture']);
                        dti.forEachArray(displays.deletedWidgets, (oldWidget) => {
                            displays.createWidget(oldWidget.config, oldWidget.type);
                        });
                    }

                    displays.deletedWidgets = [];


                    // widgets.revertChanges();
                    // displays.bindings.editMode(isEdit);
                    dtiUtility.updateWindow('resize', {
                        width: (displayWidth) + 'px'
                    }, (ret) => {
                        if (ret) {
                            displays.bindings.left(0);
                        }

                        setTimeout(() => {
                            displays.zoomToFitWindow();
                            displays.centerDisplay();
                        }, 150);

                    });
                }
            },

            chooseWidgetPoint (widget) {
                let handlePointData = function (data) {
                    displays.pointTypes[data._id] = data.pointType;
                    displays.upiNames[data._id] = data.path;

                    widget.handlePoint(data);
                };

                dtiUtility.showPointSelector();
                dtiUtility.onPointSelect(handlePointData);
            },

            autoZoom () {
                displays.zoomToFitWindow();
                displays.centerDisplay();
            },

            widgetClickHandler (event) {
                let widget = kodt(event.target);
                let $el = $(event.target);
                let isMiddleClick = event.which === 2;

                if (!isMiddleClick && event.type === 'mousedown') {
                    return;
                }

                if (displays.bindings.editMode()) {
                    //// dti.time('clone');
                    let $clone = $('.menuContainer > .tooltipMenu').clone().addClass('activeTooltip');
                    //// dti.timeEnd('clone');
                    let subscriptions = [];

                    widget.saveConfig();

                    displays.currWidget = widget;
                    // dti.log('widget:', widget);

                    if (widget.config.isPreview) {
                        displays.bindings.editingPreviewWidget(true);
                    } else {
                        displays.bindings.editingWidget(true);
                    }
                    widget.editing(true);                

                    let zoom = (displays.bindings.zoom() - 100) / 100;
                    let width = widget.width() || $el.width();
                    let height = widget.height() || $el.height() / 2;
                    let xOffset = widget.type() === 'Animation' ? zoom * width : 0;
                    let yOffset = widget.type() === 'Animation' ? zoom * height : 0;

                    //// dti.time('qtip');

                    $el.qtip({
                        style: {
                            classes: 'qtip-light',
                            width: widget.complexWidget() ? displays.settings.widgets.tooltipWidthLarge : displays.settings.widgets.tooltipWidthSmall
                        },
                        overwrite: false,
                        content: $clone,
                        position: {
                            my: 'center left',
                            at: 'center right',
                            of: $el,
                            viewport: $('body'),
                            adjust: {
                                x: xOffset
                                // y: yOffset
                            }
                        },
                        show: {
                            event: event.type,
                            ready: true,
                            delay: 0
                        },
                        hide: {
                            event: 'unfocus',
                            effect: false
                        },
                        events: {
                            render(event, api) {
                                displays.tooltipAPI = api;
                                //// dti.time('render');
                                let el = api.elements.content[0];
                                // ko.cleanNode(el);
                                //// dti.time('bindings');
                                ko.applyBindings(displays.currWidget, el);
                                //// dti.timeEnd('bindings');

                                widget.getTooltipElement = function () {
                                    return el;
                                };

                                widget.getTooltipAPI = function () {
                                    return api;
                                };

                                if (displays.currWidget.type() === 'Button') {
                                    subscriptions.push(displays.currWidget.complexWidget.subscribe((isComplex) => {
                                        let width = displays.settings.widgets.tooltipWidthSmall;
                                        if (isComplex === true) {
                                            width = displays.settings.widgets.tooltipWidthLarge;
                                        }

                                        setTimeout(() => {
                                            api.set('style.width', width);
                                        });

                                        displays.bindings.editingComplexWidget(isComplex === true);
                                        widget.refreshDOM($(el));
                                    }));
                                }
                                widget.refreshDOM($(el));
                                //// dti.timeEnd('render');
                            },
                            hide(event, api) {
                                displays.tooltipAPI = {};
                                let el = api.elements.content[0];
                                ko.cleanNode(el);
                                api.destroy();
                                dti.forEachArray(subscriptions, (sub) => {
                                    sub.dispose();
                                });

                                widget.editing(false);

                                widget.getTooltipElement = function () {
                                    return;
                                };
                                displays.bindings.editingWidget(false);
                                displays.bindings.editingPreviewWidget(false);
                                displays.bindings.editingComplexWidget(false);

                            }
                        }
                    }, event);
                    //// dti.timeEnd('qtip');
                } else {
                    widget.handleClick(isMiddleClick);
                }
            },

            backgroundImageLoad () {
                // displays.bindings.backgroundImageWidth(this.width);
                // displays.bindings.backgroundImageHeight(this.height);
            },

            handleBackgroundImageUpload (config) {
                let src = config.src;
                let file = config.file;

                displays.bindings.backgroundImage(file.name);
                displays.bindings.backgroundImageData(src);
                // displays.point['Background Picture'] = file.name;
                displays.hasNewBackground = true;
                displays.filesToUpload.background = {
                    name: file.name,
                    data: src,
                    file: file
                };
            },

            selection: {
                // invertX: ko.pureComputed(() => {
                //     let selection = displays.bindings.selection;

                //     return selection.currLeft() < selection.origLeft();
                // }),
                // invertY: ko.pureComputed(() => {
                //     let selection = displays.bindings.selection;

                //     return selection.currTop() < selection.origTop(); 
                // }),
                left: ko.pureComputed(() => {
                    let selection = displays.bindings.selection;
                    let ret;
                    let currLeft = selection.currLeft();
                    let origLeft = selection.origLeft();

                    return Math.min(currLeft, origLeft);

                    // if (selection.invertX()) {
                    //     dti.log('invert left: curr-', currLeft, ' orig-', origLeft);
                    //     ret = currLeft;
                    // }

                    // ret = origLeft;

                    // return ret + 'px';
                }),
                top: ko.pureComputed(() => {
                    let selection = displays.bindings.selection;
                    let ret;
                    let currTop = selection.currTop();
                    let origTop = selection.origTop();

                    return Math.min(currTop, origTop);

                    // if (selection.invertY()) {
                    //     ret = currTop;
                    // }

                    // ret = origTop;

                    // return ret + 'px';
                }),
                width: ko.pureComputed(() => {
                    let selection = displays.bindings.selection;

                    return Math.abs(selection.currLeft() - selection.origLeft());
                }),
                height: ko.pureComputed(() => {
                    let selection = displays.bindings.selection;

                    return Math.abs(selection.currTop() - selection.origTop());
                })
            },

            save: displays.save,

            dateTime: displays.dateTime
        });

        // dti.time('adjust bindings');
        displays.bindings = displays.adjustBindings(displays.bindings);
        // dti.timeEnd('adjust bindings');

        displays.commonInterval = setInterval(() => {
            let isCommonReady = dtiCommon.init.isComplete;

            if (!!isCommonReady) {
                clearTimeout(displays.commonInterval);
                displays.bindings.commonLoaded(true);
            }
        }, 100);

        // $.extend(displays.bindings.selection, {
        //     invertX: ko.pureComputed(() => {
        //         let selection = displays.bindings.selection;

        //         return selection.currLeft() < selection.origLeft();
        //     }),
        //     invertY: ko.pureComputed(() => {
        //         let selection = displays.bindings.selection;

        //         return selection.currTop() < selection.origTop(); 
        //     }),
        //     left: ko.pureComputed(() => {
        //         let selection = displays.bindings.selection;

        //         if (selection.invertX()) {
        //             return selection.currLeft();
        //         }

        //         return selection.origLeft();
        //     }),
        //     top: ko.pureComputed(() => {
        //         let selection = displays.bindings.selection;

        //         if (selection.invertY()) {
        //             return selection.currTop();
        //         }

        //         return selection.origTop();
        //     }),
        //     width: ko.pureComputed(() => {
        //         let selection = displays.bindings.selection;

        //         return Math.abs(selection.currLeft - selection.origLeft);
        //     }),
        //     height: ko.pureComputed(() => {
        //         let selection = displays.bindings.selection;

        //         return Math.abs(selection.currTop - selection.origTop);
        //     })
        // });

        // dti.time('register components');
        ko.components.register('display-button', {
            synchronous: true,
            viewModel: {
                createViewModel(params, componentInfo) {
                    params.$element = $(componentInfo.element);
                    let widget = new widgets.classes.Button(params);

                    if (!params.isPreview) {
                        displays.widgets.Button = displays.widgets.Button || {};

                        displays.widgets.Button[koUnwrap(params.config.displaysID)] = widget;
                    }

                    return widget;
                }
            },
            template: {
                element: 'display-button-template'
            }
        });

        ko.components.register('display-text', {
            synchronous: true,
            viewModel: {
                createViewModel(params, componentInfo) {
                    params.$element = $(componentInfo.element);
                    let widget = new widgets.classes.Text(params);

                    if (!params.isPreview) {
                        displays.widgets.Text = displays.widgets.Text || {};

                        displays.widgets.Text[koUnwrap(params.config.displaysID)] = widget;
                    }
                    
                    return widget;
                }
            },
            template: {
                element: 'display-text-template'
            }
        });

        ko.components.register('display-dynamic', {
            synchronous: true,
            viewModel: {
                createViewModel(params, componentInfo) {
                    params.$element = $(componentInfo.element);
                    let widget = new widgets.classes.Dynamic(params);

                    if (!params.isPreview) {
                        displays.widgets.Dynamic = displays.widgets.Dynamic || {};

                        displays.widgets.Dynamic[koUnwrap(params.config.displaysID)] = widget;
                    }
                    
                    return widget;
                }
            },
            template: {
                element: 'display-dynamic-template'
            }
        });

        ko.components.register('display-animation', {
            synchronous: true,
            viewModel: {
                createViewModel(params, componentInfo) {
                    params.$element = $(componentInfo.element);
                    let widget = new widgets.classes.Animation(params);

                    if (!params.isPreview) {
                        displays.widgets.Animation = displays.widgets.Animation || {};

                        displays.widgets.Animation[koUnwrap(params.config.displaysID)] = widget;
                    }
                    
                    return widget;
                }
            },
            template: {
                element: 'display-animation-template'
            }
        });

        // dti.timeEnd('register components');

        // dti.log('applying display bindings');
        // dti.time('apply bindings');
        ko.applyBindings(displays.bindings, $('body')[0]);
        // dti.timeEnd('apply bindings');

        // dti.timeGapEnd('widget config');
        // dti.timeGapEnd('widget bindings');
        // dti.timeGapEnd('widget postinit');
        // dti.timeGapEnd('widget template');
        // dti.timeGapEnd('widget base postinit');
        // dti.timeGapEnd('button postinit');
        // dti.timeGapEnd('animation postinit');
        // dti.timeGapEnd('widget');
        // dti.timeGapEndAll();
    },

    postInit () {
        Materialize.updateTextFields();

        dtiUtility.getUser(function handleUser(user) {
            displays.user = user;
        });

        displays.loaded = true;

        dti.forEachArray(dti._onLoadedFns, (fn) => {
            fn();
        });

        dti.fire('loaded');
    }
};

dti.$(function initDisplays () {
    dti._applyCount = 0;
    dti._applyTime = 0;
    ko._applyBindings = ko.applyBindings;
    ko.applyBindings = function apply() {
        dti._applyCount++;
        let start = Date.now();
        ko._applyBindings.apply(this, arguments);
        dti._applyTime += Date.now() - start;
    };

    dti._fromModelCount = 0;
    dti._fromModelTime = 0;
    dti._fromModel = ko.viewmodel.fromModel;
    ko.viewmodel.fromModel = function fromModel() {
        dti._fromModelCount++;
        let start = Date.now();
        let ret = dti._fromModel.apply(this, arguments);
        dti._fromModelTime += Date.now() - start;
        return ret;
    };

    displays._startLoad = new Date();
    $.extend(true, displays, window.displayInfo);
    displays.point = window.point;
    displays.init();
});
