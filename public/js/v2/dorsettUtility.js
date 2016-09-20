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

var dtUtility =  {
    store: window.store,
    initEventListener: function () {
        window.addEventListener('storage', dtUtility.handleMessage);
    },

    init: function () {
        if (dtUtility.store === undefined) {
            $.getScript('/js/lib/store.min.js', function handleGetStore () {
                var storeInterval = setInterval(function testStore () {
                    if (window.store) {
                        dtUtility.store = window.store;
                        clearInterval(storeInterval);
                    }
                }, 100);
            });
        }

        dtUtility.initEventListener();
    },

    defaultHandler: function (e) {
        console.log('Default handler:', e);
    },

    processMessage: function (newValue) {
        var action = newValue.message,
            callbacks = {
                getConfig: function () {
                    if (dtUtility._configCb) {
                        dtUtility._configCb(newValue.value);
                    }

                    dtUtility._configCb = null;
                },
                pointSelected: function () {
                    if (dtUtility._pointSelectCb) {
                        dtUtility._pointSelectCb(newValue);
                    }
                },
                pointFilterSelected: function () {
                    if (dtUtility._pointFilterSelectCb) {
                        dtUtility._pointFilterSelectCb(newValue);
                    }
                }
            };

        if (callbacks[action]) { // store previous call
            callbacks[action]();
        } else {
            dtUtility.defaultHandler(newValue);
        }
    },

    handleMessage: function (e) {
        var config;
        if (e.key === window.windowId) {
            config = e.newValue;
            if (typeof config === 'string') {
                config = JSON.parse(config);
            }
            dtUtility.processMessage(config);
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
        dtUtility.sendMessage('showPointSelector', parameters);
    },

    showNavigator: function (parameters) {
        // send message to navigator to open
        // dtUtility.utility.showNavigatorModal();
        dtUtility.sendMessage('navigatormodal', {
            action: 'open',
            callback: true,
            parameters: parameters
        });
    },

    showNavigatorFilter: function () {
        // send message to navigator to open
        // dtUtility.utility.showNavigatorModal();
        dtUtility.sendMessage('navigatorfiltermodal', {
            action: 'open'
        });
    },

    onPointSelect: function (cb) {
        dtUtility._pointSelectCb = cb;
    },

    onPointFilterSelect: function (cb) {
        dtUtility._pointFilterSelectCb = cb;
    },

    sendMessage: function (target, cfg) {
        var data = cfg || {};
        //add timestamp to guarantee changes
        data._timestamp = new Date().getTime();
        data._windowId = window.windowId;
        
        store.set(target, data);
    },

    onMessage: function (cb) {
        dtUtility.defaultHandler = cb;
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

        dtUtility.sendMessage('openWindow', config);
    },

    updateWindow: function (action, parameters) {
        dtUtility.sendMessage('windowMessage', {
            action: action,
            parameters: parameters
        });
    },

    closeWindow: function () {
        dtUtility.sendMessage('closeWindow');
    },

    getConfig: function (path, parameters, cb) {
        dtUtility._configCb = cb;

        dtUtility.sendMessage('getConfig', {
            path: path,
            parameters: parameters
        });

    }
};

// $(dtUtility.init);
document.addEventListener("DOMContentLoaded", function loaddtUtility (event) {
    setTimeout(dtUtility.init, 1000); 
});
