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

var dtiUtility =  {
    itemIdx: 0,
    settings: {
        idxPrefix: 'dti_'
    },
    makeId: function () {
        dtiUtility.itemIdx++;
        return dtiUtility.settings.idxPrefix + dtiUtility.itemIdx;
    },
    store: window.store,
    getConfigCallbacks: {},
    openWindowCallbacks: {},
    initEventListener: function () {
        window.addEventListener('storage', dtiUtility.handleMessage);
    },

    init: function () {
        if (dtiUtility.store === undefined) {
            $.getScript('/js/lib/store2.min.js', function handleGetStore () {
                var storeInterval = setInterval(function testStore () {
                    if (window.store) {
                        dtiUtility.store = window.store;
                        clearInterval(storeInterval);
                    }
                }, 100);
            });
        }

        dtiUtility.initEventListener();
    },

    defaultHandler: function (e) {
        console.log('Default handler:', e);
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
                getConfig: function () {
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
        dtiUtility.sendMessage('showPointSelector', parameters);
    },

    showPointFilter: function (parameters) {
        var params = parameters || {};

        params.mode = 'filter';

        dtiUtility.sendMessage('showPointSelector', params);  
    },

    showCreatePoint: function (parameters) {
        var params = parameters || {};

        dtiUtility.sendMessage('showCreatePoint', params);
    },

    onCreatePoint: function (cb) {
        dtiUtility._CreatePointCb = cb;
    },

    onPointSelect: function (cb) {
        dtiUtility._pointSelectCb = cb;
    },

    onPointFilterSelect: function (cb) {
        dtiUtility._pointFilterSelectCb = cb;
    },

    sendMessage: function (target, cfg) {
        var data = cfg || {};
        //add timestamp to guarantee changes
        data._timestamp = new Date().getTime();
        data._windowId = window.windowId;
        data.messageID = data.messageID || dtiUtility.makeId();
        
        store.set(target, data);
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

    updateWindow: function (action, parameters) {
        dtiUtility.sendMessage('windowMessage', {
            action: action,
            parameters: parameters
        });
    },

    closeWindow: function () {
        dtiUtility.sendMessage('closeWindow');
    },

    getConfig: function (path, parameters, cb) {
        var getCfgID = dtiUtility.makeId();

        dtiUtility.getConfigCallbacks[getCfgID] = cb;

        dtiUtility.sendMessage('getConfig', {
            messageID: getCfgID,
            path: path,
            parameters: parameters,
            _getCfgID: getCfgID
        });

    },
    getUser: function (cb) {
        dtiUtility._getUserCb = cb;

        dtiUtility.sendMessage('getUser');
    }
};

// $(dtiUtility.init);
document.addEventListener("DOMContentLoaded", function loaddtiUtility (event) {
    setTimeout(dtiUtility.init, 1000); 
});
