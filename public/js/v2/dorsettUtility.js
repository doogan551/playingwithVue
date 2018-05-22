/*
USAGE
Include this in your view, that's it

Top-level commands:

//
pass in a path and optional parameters.  if you pass in parameters, it will assume you're looking for a function
dtiMessaging.getConfig('Utility.pointTypes.getAllowedPointTypes', ['Device Point', 'Optimum Start']);

//to modify an open window.  right now, only resize and updateTitle are supported
dtiMessaging.updateWindow('resize', {
    width: width,
    height: height
});

//no parameters.  this replaces window.close
dtiMessaging.closeWindow();

//same parameters as you're used to, or optionally the first parameter is an object with keys corresponding to the parameters in the list
// -parameter list url, title, type, target, uniqueId, options
// pass in 'sameWindow: true' in options to open in the same window, as in displays/gpl edit mode transitions
dtiMessaging.openWindow(arguments);

*/

var dtiUtility = {
    itemIdx: 0,
    lastIdNumber: 0,
    settings: {
        idxPrefix: 'dti_',
        logLevel: 'debug',
        logLinePrefix: true
    },
    formatDate: function(date, addSuffix) {
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
            dtiUtility.forEachArray(message, (entry) => {
                if (typeof entry === 'object') {
                    if (dtiUtility.settings.logObjects === true) {
                        let clean = dtiUtility.deCycleObject(entry);
                        output.push(clean);
                    }
                } else {
                    output.push(entry);
                }
            });

            let stringMessage = JSON.stringify(output);
            dtiUtility.logging.logHistory.push({
                message: stringMessage,
                level
            });
        },
        showLogs(level) {
            let pad = (num) => {
                return ('     ' + num).slice(-5);
            };
            dtiUtility.forEachArray(dtiUtility.logging.logHistory, (log) => {
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
                formattedtiUtilityme = dtiUtility.formatDate(new Date(), true);

            if (dtiUtility.settings.logLinePrefix === true) {
                err = new Error();
                if (Error.captureStackTrace) {
                    Error.captureStackTrace(err);

                    //entry 5 in the stack
                    stack = err.stack.split('\n')[4];

                    steps = stack.split(':');

                    lineNumber = steps[2];

                    // args.unshift('gap:' + pad(now - dtiUtility._lastLog));

                    message.unshift('line:' + pad(lineNumber), formattedtiUtilityme);
                }
            }

            return message;
        },
        isValidLog(level) {
            let logLevel = dtiUtility.logging.logLevels[level.toLowerCase()] || 1;
            let appLogLevel = dtiUtility.logging.logLevels[dtiUtility.settings.logLevel.toLowerCase()] || 1;

            if (logLevel <= appLogLevel) {
                return true;
            }

            return false;
        },
        log (args, level) {
            let message = dtiUtility.logging.getLogMessage(args);

            if (dtiUtility.logging.isValidLog(level)) {
                console.log.apply(console, message);
            }

            dtiUtility.logging.addLog(message, level);

            dtiUtility.logging._lastLog = new Date().getTime();
        }
    },
    trace() {
        dtiUtility.logging.log(arguments, 'trace');
    },
    log() {
        dtiUtility.logging.log(arguments, 'debug');
    },
    makeId: function () {
        dtiUtility.itemIdx++;
        return dtiUtility.settings.idxPrefix + dtiUtility.itemIdx;
    },
    generateFauxPointID: function (preFix) {
        let newId = dtiUtility.lastIdNumber;
        while (dtiUtility.lastIdNumber === newId) {
            newId = Date.now();
        }
        dtiUtility.lastIdNumber = newId;
        return (!!preFix ? preFix : 'fauxID') + newId.toString();
    },
    store: window.store,
    getConfigCallbacks: {},
    openWindowCallbacks: {},
    getSystemEnumCallbacks: {},
    updateWindowCallbacks: {}, 
    windowIdCallbacks: {},
    initEventListener: function () {
        window.addEventListener('storage', dtiUtility.handleMessage);

        dti.on('pointSelected', (data) => {
            if (dtiUtility._pointSelectCb) {
                dtiUtility._pointSelectCb(data);
            }
        });
    },

    init: function () {
        let storeLoaded = false;
        let storeLoadFns = [];
        let onStoreLoad = function (fn) {
            if (storeLoaded) {
                fn();
            } else {
                storeLoadFns.push(fn);
            }
        };
        let afterStoreLoad = function () {
            dtiUtility.forEachArray(storeLoadFns, (fn) => {
                fn();
            });
        };

        dtiUtility.initEventListener();

        if (window.store === undefined) {
            $.getScript('/js/lib/store2.min.js', function handleGetStore() {
                let storeInterval;
                let checkStore = function () {
                    if (window.store) {
                        dtiUtility.store = window.store;
                        clearInterval(storeInterval);
                        afterStoreLoad();
                    }
                };

                if (!window.store) {
                    storeInterval = setInterval(checkStore, 1);
                } else {
                    afterStoreLoad();
                }
                
            });
        }
        // If dtiCommon.js isn't already included, get it
        if (window.dtiCommon === undefined) {
            $.getScript('/js/v2/dtiCommon.js', function handleGetFile() {
                // When dtiCommon is included by the view, it inits itself by listening 
                // to the DOM load event, but that event has already come and gone so we 
                // manually call init
                onStoreLoad(window.dtiCommon.init.clientSide);
            });
        }

        dtiUtility.initKnockout();

        setTimeout(() => {
            if (!window.windowId) {
                window.windowId = new Date().getTime().toString();
                dtiUtility.trace('no window id, asking for:', window.windowId);
                
                dtiUtility.getNewWindowId((ret) => {
                    dtiUtility.trace('got window id', ret);
                    window.windowId = ret;
                });
            }
        }, 100);
    },

    initKnockout: () => {
        if (window.ko) {
            var utils = {
                formatInputField: (element, valueAccessor, allBindingsAccessor) => {
                    var fieldValue = ko.unwrap(valueAccessor()),
                        allBindings = allBindingsAccessor(),
                        stripSpaces = (allBindings.stripSpaces !== undefined ? allBindings.stripSpaces : true),
                        stripDoubleSpace = (allBindings.stripDoubleSpace !== undefined ? allBindings.stripDoubleSpace : false),
                        $element = $(element);

                    if (stripSpaces && !!fieldValue) {
                        fieldValue = fieldValue.trim();
                    }
                    if (stripDoubleSpace && !!fieldValue) {
                        fieldValue = fieldValue.replace(/ {2,}/g, ' ');
                    }

                    $element.val(fieldValue);
                },
                setPointNameField: (element, valueAccessor) => {
                    var pointPathArray = ko.unwrap(valueAccessor()),
                        $element = $(element),
                        pointName = dtiCommon ? dtiCommon.getPointName(pointPathArray) : (dti && dti.utility ? dti.utility.getConfig("Utility.getPointName", [pointPathArray]) : window.getConfig("Utility.getPointName", [pointPathArray]));

                    $element.text(pointName);
                }
            };

            ko.bindingHandlers.diPointName = {
                init: function (element, valueAccessor) {
                    utils.setPointNameField(element, valueAccessor);
                },
                update: function (element, valueAccessor) {
                    utils.setPointNameField(element, valueAccessor);
                }
            };

            ko.bindingHandlers.diTextInput = {
                init: function (element, valueAccessor, allBindingsAccessor) {
                    utils.formatInputField(element, valueAccessor, allBindingsAccessor);
                },
                update: function (element, valueAccessor, allBindingsAccessor) {
                    utils.formatInputField(element, valueAccessor, allBindingsAccessor);
                }
            };
        }
    },

    defaultHandler: function (e) {
        dtiUtility.log('Default handler:', e);
    },

    processMessage: function (newValue) {
        var action = newValue.message,
            callbacks = {
                gotTemplate: function () {
                    if (dtiUtility._getTemplateCb) {
                        dtiUtility._getTemplateCb(newValue);
                    }
                },
                gotTemplates: function () {
                    if (dtiUtility._getTemplatesCb) {
                        dtiUtility._getTemplatesCb(newValue);
                    }
                },
                openWindowCallback: function () {
                    var cb = dtiUtility.openWindowCallbacks[newValue._openWindowID];

                    if (cb) {
                        cb(newValue.value);
                    }
                },
                getSystemEnum() {
                    var cb = dtiUtility.getSystemEnumCallbacks[newValue.getEnumID];

                    if (cb) {
                        cb(newValue.value);
                    }

                    delete dtiUtility.getConfigCallbacks[newValue.getEnumID];
                },
                getConfig: function () {
                    var cb = dtiUtility.getConfigCallbacks[newValue._getCfgID];

                    if (cb) {
                        cb(newValue.value);
                    }

                    delete dtiUtility.getConfigCallbacks[newValue._getCfgID];
                },
                getNewWindowId() {
                    let cb = dtiUtility.windowIdCallbacks[newValue.getWinID];

                    if (cb) {
                        cb(newValue.value);
                    }

                    delete dtiUtility.windowIdCallbacks[newValue.getWinID];
                },
                getBatchConfig: function () { 
                    var cb = dtiUtility.getConfigCallbacks[newValue._getCfgID]; 
 
                    if (cb) { 
                        cb(newValue.value); 
                    } 
 
                    delete dtiUtility.getConfigCallbacks[newValue._getCfgID]; 
                },
                getUser: function () {
                    if (dtiUtility._getUserCb) {
                        dtiUtility._getUserCb(newValue.user);
                    }
                },
                pointSelected: function () {
                    if (dtiUtility._pointSelectCb) {
                        dtiUtility._pointSelectCb(newValue.point);
                    }
                },
                pointCreated: function () {
                    if (dtiUtility._CreatePointCb) {
                        dtiUtility._CreatePointCb(newValue.point);
                    }
                },
                pointFilterSelected: function () {
                    if (dtiUtility._pointFilterSelectCb) {
                        dtiUtility._pointFilterSelectCb(newValue);
                    }
                },
                windowUpdated: function () {
                    var cb = dtiUtility.updateWindowCallbacks[newValue._updateWindowID];

                    if (cb) {
                        cb(newValue.result);
                    }
                }
            };

        if (callbacks[action]) { // store previous call
            callbacks[action]();
        } else {
            dtiUtility.defaultHandler(newValue);
        }
    },

    handleMessage: function (e) {
        var config;
        //if it's directed at this window
        if (e.key.split(';')[0] === window.windowId) {
            config = e.newValue;
            if (typeof config === 'string') {
                config = JSON.parse(config);
            }
            if (config) {
                dtiUtility.processMessage(config);
            }
        }

        store.remove(e.key); // memory cleanup
        // console.log({
        //     'Storage Key': e.key,
        //     'Old Value': e.oldValue,
        //     'New Value': e.newValue
        // });
    },


    // API -----------------------------------------
    // openWindow: function (url, title, type, target, uniqueId, options) {
    //     //if target = new, call window.top.workspaceManager.openWindow..., else change this window's url
    // },

    showPointSelector: function (parameters) {
        // dtiUtility.sendMessage('showPointSelector', parameters);
        dti.fire('showPointSelector', parameters);
    },

    showPointFilter: function (parameters) {
        var params = parameters || {};

        params.mode = 'filter';

        dtiUtility.sendMessage('showPointSelectorFilter', params);
    },

    showCreatePoint: function (parameters) {
        var params = parameters || {};

        dtiUtility.sendMessage('showCreatePoint', params);
    },

    onCreatePoint: function (cb) {
        dtiUtility._CreatePointCb = cb;
    },

    onPointSelect: function (cb) {
        dti.on('pointSelected', cb);
        dtiUtility._pointSelectCb = cb;
    },

    onPointFilterSelect: function (cb) {
        dtiUtility._pointFilterSelectCb = cb;
    },

    sendMessage: function (target, cfg) {
        let data = cfg || {};
        //add timestamp to guarantee changes
        data._timestamp = new Date().getTime();
        data._windowId = window.windowId;
        data.messageID = data.messageID || dtiUtility.makeId();

        let title = ['dti', data._windowId, target].join(';'); 

        dtiUtility.trace('dtiUtility sending message', title , data);

        (window.opener || window.top).dtiMessage(target, data, function () {
            if (cfg.cb) {
                cfg.cb.apply(null, arguments);
            }
            dtiUtility.trace(target, 'return', arguments);
        });
        // store.set(title, data); 
    },

    onMessage: function (cb) {
        dtiUtility.defaultHandler = cb;
    },

    openWindow: function (url, title, type, target, upi, options) {
        var config,
            newID = dtiUtility.makeId();

        if (typeof url === 'object') {
            config = url;
        } else {
            config = {
                url: url,
                title: title,
                type: type,
                target: target,
                upi: upi,
                options: options
            };
        }

        if (config.options && config.options.callback) {
            dtiUtility.openWindowCallbacks[newID] = config.options.callback;
            config.messageID = newID;
            config._openWindowID = newID;
        }

        dtiUtility.sendMessage('openWindow', config);
    },

    updateWindow: function (action, parameters, cb) {
        var updateWindowID = dtiUtility.makeId();

        if (cb) {
            dtiUtility.updateWindowCallbacks[updateWindowID] = cb;
        }

        dtiUtility.sendMessage('windowMessage', {
            messageID: updateWindowID,
            action: action,
            parameters: parameters,
            _updateWindowID: cb ? updateWindowID : null,
            cb
        });


    },

    updateUPI: function (upi) {
        dtiUtility.sendMessage('windowMessage', {
            action: 'updateUPI',
            parameters: upi
        });
    },

    closeWindow: function () {
        dtiUtility.sendMessage('closeWindow');
    },

    getSystemEnum(enumType, cb) {
        let getEnumID = dtiUtility.makeId();

        dtiUtility.getSystemEnumCallbacks[getEnumID] = cb;

        dtiUtility.sendMessage('getSystemEnum', {
            messageID: getEnumID,
            enumType,
            getEnumID,
            cb
        });        
    },

    getNewWindowId(cb) {
        var getWinID = dtiUtility.makeId();

        dtiUtility.windowIdCallbacks[getWinID] = cb;

        dtiUtility.sendMessage('getNewWindowId', {
            messageID: getWinID,
            getWinID: getWinID,
            cb
        });
    },

    getConfig: function (path, parameters, cb) {
        var getCfgID = dtiUtility.makeId();

        // dtiUtility.getConfigCallbacks[getCfgID] = cb;

        dtiUtility.sendMessage('getConfig', {
            messageID: getCfgID,
            path: path,
            parameters: parameters,
            _getCfgID: getCfgID,
            cb
        });
    },
    getBatchConfig: function (path, parameters, cb) { 
        // path: string path to the desired config.js function, i.e. 'Utility.getPointName', 
        // parameters: [param1, param2, param3, etc.] --> paramN is an array list of arguments passed to the path fn, 
        // i.e. pathFn(param1a, param1b, ... param1x) 
        var getCfgID = dtiUtility.makeId(); 
 
        dtiUtility.getConfigCallbacks[getCfgID] = cb; 
 
        dtiUtility.sendMessage('getBatchConfig', { 
            messageID: getCfgID, 
            path: path, 
            parameters: parameters, 
            _getCfgID: getCfgID,
            cb 
        }); 
    },
    getUser: function (cb) {
        dtiUtility._getUserCb = cb;

        dtiUtility.sendMessage('getUser', {
            cb
        });
    },

    toast: function (parameters) {
        dtiUtility.sendMessage('toast', parameters);
    },

    playAudio: function (parameters) {
        dtiUtility.sendMessage('playAudio', parameters);
    }
};

// $(dtiUtility.init);
document.addEventListener('DOMContentLoaded', function loaddtiUtility(event) {
    setTimeout(dtiUtility.init, 1000);
});