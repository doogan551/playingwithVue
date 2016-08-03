var dtiMessaging = {
    initEventListener: function () {
        window.addEventListener('storage', dtiMessaging.processMessage);
    },

    init: function () {
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
    sendMessage: function (target, data) {
        //add timestamp to guarantee changes
        data._timestamp = new Date().getTime();
        
        window.top.store.set(target, data);
    },

    onMessage: function (config) {
        console.log('Message:', config);
    }
};

dtiMessaging.init();
