var dtiMessaging =  {
    store: window.store,
    initEventListener: function () {
        window.addEventListener('storage', dtiMessaging.handleMessage);
    },

    init: function () {
        if (dtiMessaging.store === undefined) {
            $.getScript('/js/lib/store.min.js', function handleGetStore () {
                var storeInterval = setInterval(function testStore () {
                    if (window.store) {
                        dtiMessaging.store = window.store;
                        clearInterval(storeInterval);
                    }
                }, 100);
            });
        }

        dtiMessaging.initEventListener();
    },

    defaultHandler: function (e) {
        console.log('Default handler:', e);
    },

    processMessage: function (newValue) {
        var action = newValue.action,
            callbacks = {
                pointSelected: function () {
                    if (dtiMessaging._pointSelectCb) {
                        dtiMessaging._pointSelectCb(newValue);
                    }
                },
                pointFilterSelected: function () {
                    if (dtiMessaging._pointFilterSelectCb) {
                        dtiMessaging._pointFilterSelectCb(newValue);
                    }
                }
            };

        if (callbacks[action]) { // store previous call
            callbacks[action]();
        } else {
            dtiMessaging.defaultHandler(newValue);
        }
    },

    handleMessage: function (e) {
        var config;
        if (e.key === window.windowId) {
            config = e.newValue;
            if (typeof config === 'string') {
                config = JSON.parse(config);
            }
            dtiMessaging.processMessage(config);
        }

        // store.remove(e.key) to clear

        // console.log({
        //     'Storage Key': e.key,
        //     'Old Value': e.oldValue,
        //     'New Value': e.newValue
        // });
    },


    // API -----------------------------------------
    openWindow: function (url, title, type, target, uniqueId, options) {
        //if target = new, call window.top.workspaceManager.openWindow..., else change this window's url
    },

    showNavigator: function (parameters) {
        // send message to navigator to open
        // dtiMessaging.utility.showNavigatorModal();
        dtiMessaging.sendMessage('navigatormodal', {
            action: 'open',
            callback: true,
            parameters: parameters
        });
    },

    showNavigatorFilter: function () {
        // send message to navigator to open
        // dtiMessaging.utility.showNavigatorModal();
        dtiMessaging.sendMessage('navigatorfiltermodal', {
            action: 'open'
        });
    },

    onPointSelect: function (cb) {
        dtiMessaging._pointSelectCb = cb;
    },

    onPointFilterSelect: function (cb) {
        dtiMessaging._pointFilterSelectCb = cb;
    },

    sendMessage: function (target, cfg) {
        var data = cfg || {};
        //add timestamp to guarantee changes
        data._timestamp = new Date().getTime();
        data._windowId = window.windowId;
        
        store.set(target, data);
    },

    onMessage: function (cb) {
        dtiMessaging.defaultHandler = cb;
    },

    closeWindow: function () {
        dtiMessaging.sendMessage('closeWindow');
    }
};

// $(dtiMessaging.init);
document.addEventListener("DOMContentLoaded", function loadDtiMessaging (event) {
    setTimeout(dtiMessaging.init, 1000); 
});
