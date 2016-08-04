var dtiMessaging =  {
    initEventListener: function () {
        window.addEventListener('storage', dtiMessaging.processMessage);
    },

    init: function () {
        if (window.store === undefined) {
            $.getScript('/js/lib/store.min.js');
        }

        dtiMessaging.initEventListener();
    },

    processMessage: function (e) {
        if (e.key === window.windowId) {
            dtiMessaging.onMessage(e.newValue);
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

    showNavigator: function () {
        // send message to navigator to open
        // dtiMessaging.utility.showNavigatorModal();
        dtiMessaging.sendMessage('navigatormodal', {
            action: 'open'
        });
    },

    sendMessage: function (target, data) {
        //add timestamp to guarantee changes
        data._timestamp = new Date().getTime();
        
        store.set(target, data);
    },

    onMessage: function (config) {
        console.log('Message:', config);
    }
};

$(dtiMessaging.init);
