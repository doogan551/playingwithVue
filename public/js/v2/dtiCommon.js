/*
    This file is used to access common functions, variables, etc. that are frequently needed by multiple InfoScan applications.
    It may be included one of two ways:
    1. Included by the view (i.e. a typical script include)
    2. Included through the inclusion of dorsettUtility.js (i.e. dorsettUtility.js includes dtiCommon.js if it is not already included)

    Config.js functions can be moved to this file, however, they should still be accessible as Confg.whatever
    Search config.js for "getPointName" to see a very simple implementation example.
*/
var dtiCommon = {
    // _private intended to only be used by dtiCommon API functions and not accessed outside of dtiCommon
    _private: {
        pointNameSeparator: '' // hex: e296ba   UTF8:  "\u25ba"   keyboard: Alt 16
    },

    // API functions
    getPointName: (target) => {
        // 'target' is a point object, or the point's path array
        let path = target && (target.path || target);
        let result = '';

        if (Array.isArray(path)) {
            result = path.join(dtiCommon._private.pointNameSeparator);
        }

        return result;
    },

    resolveAlarmName: (alarmsMsg, alarmPath) => {
        return alarmsMsg.replace("%NAME", dtiCommon.getPointName(alarmPath));
    },

    // init fns should only be run once after dtiCommon is loaded, and is normally self-handled (see end of this script)
    init: {
        isComplete: false,
        clientSide: () => {
            if (window.dti) {
                dtiCommon._private.pointNameSeparator = dti.utility.getConfig('Enums.Point Name Separator').Value;
            } else {
                dtiUtility.getConfig('Enums.Point Name Separator', null, function (result) {
                    // result = {
                    //  Value: ' ► ' // or whatever the char is
                    // }
                    dtiCommon._private.pointNameSeparator = result.Value;
                    dtiCommon.init.isComplete = true;
                });
            }
        },
        serverSide: () => {
            let Config = require('../lib/config');
            dtiCommon._private.pointNameSeparator = Config.Enums['Point Name Separator'].Value;
            dtiCommon.init.isComplete = true;
        }
    }
};

// If included on the client
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function done (event) {
        // We have to delay the init function to make sure Config has been loaded
        setTimeout(dtiCommon.init.clientSide, 1000);
    });
} else { // nope, we're server-side
    // We have to delay the init function to make sure Config has been fully loaded
    setTimeout(dtiCommon.init.serverSide, 100);

    module.exports = dtiCommon;
}
