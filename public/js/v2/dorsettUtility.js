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
    store: window.store,
    initEventListener: function () {
        window.addEventListener('storage', dtiUtility.handleMessage);
    },

    init: function () {
        if (dtiUtility.store === undefined) {
            $.getScript('/js/lib/store.min.js', function handleGetStore () {
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
                getConfig: function () {
                    if (dtiUtility._configCb) {
                        dtiUtility._configCb(newValue.value);
                    }

                    dtiUtility._configCb = null;
                },
                pointSelected: function () {
                    if (dtiUtility._pointSelectCb) {
                        dtiUtility._pointSelectCb(newValue);
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
        if (e.key === window.windowId) {
            config = e.newValue;
            if (typeof config === 'string') {
                config = JSON.parse(config);
            }
            dtiUtility.processMessage(config);
        }

        // store.remove(e.key) to clear

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
        
        store.set(target, data);
    },

    onMessage: function (cb) {
        dtiUtility.defaultHandler = cb;
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
                target: target,
                uniqueId: uniqueId,
                options: options
            };
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
        dtiUtility._configCb = cb;

        dtiUtility.sendMessage('getConfig', {
            path: path,
            parameters: parameters
        });

    }
};

// $(dtiUtility.init);
document.addEventListener("DOMContentLoaded", function loaddtiUtility (event) {
    setTimeout(dtiUtility.init, 1000); 
});
