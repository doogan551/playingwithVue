/*
    This file is used to access common functions, variables, etc. that are frequently needed by multiple InfoScan applications.
    It may be included one of two ways:
    1. Included by the view (i.e. a typical script include)
    2. Included through the inclusion of dorsettUtility.js (i.e. dorsettUtility.js includes dtiCommon.js if it is not already included)

    Config.js functions can be moved to this file, however, they should still be accessible as Config.whatever
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

    isValidObjectAction: (action, actionObject) => {
        let answer = true,
            hierarchyNode = actionObject.hierarchyNode,
            validTypesToOpen = ['Reference', 'Point', 'Application'],
            validTypesToCopy = ['Reference', 'Point', 'Application'],
            validTypesToDelete = ['Reference', 'Point', 'Application'],
            isValidPasteAction = () => {
                let cutNode = hierarchyNode.manager._cutNode,
                    cutNodeId = cutNode && cutNode.bindings._id(),
                    isValidPasteMode = !!hierarchyNode.manager._cutNode || !!hierarchyNode.manager._copyNode,
                    copyNode = hierarchyNode.manager._copyNode,
                    copyNodeId = copyNode && copyNode.bindings._id();

                // Make sure we don't show paste if right-clicking the cut hierarchyNode or inside the cut hierarchyNode
                while (isValidPasteMode && hierarchyNode) {
                    if (hierarchyNode.bindings._id() === cutNodeId) {
                        isValidPasteMode = false;
                    } else {
                        hierarchyNode = hierarchyNode.parentNode;    //  TODO: hmmmm  will this work in pointselector?
                    }
                }

                return isValidPasteMode;
            },
            isValidAddAction = () => {
                return (actionObject.nodeSubType !== "Sequence" && !actionObject.parentUpiSet);
            },
            isValidCopyAction = () => {
                let inCopyCollection = (validTypesToCopy.indexOf(actionObject.nodeType) !== -1);

                return (inCopyCollection && !actionObject.rootNode && !actionObject.parentUpiSet);
            },
            isValidCloneAction = () => {
                return isValidCopyAction();
            },
            isValidCutAction = () => {
                return (!actionObject.rootNode && !actionObject.parentUpiSet);
            },
            isValidEditAction = () => {
                return (actionObject.nodeType !== "Point" && !actionObject.parentUpiSet && !actionObject.rootNode);
            },
            isValidOpenAction = () => {
                let inOpenCollection = (validTypesToOpen.indexOf(actionObject.nodeType) !== -1);

                return inOpenCollection;
            },
            isValidDeleteAction = () => {
                let inDeleteCollection = (validTypesToDelete.indexOf(actionObject.nodeType) !== -1);

                return (inDeleteCollection && !actionObject.parentUpiSet);
            };

        if (!!hierarchyNode && !!hierarchyNode.bindings) {

            switch (action) {
                case "add":
                case "addApplication":
                case "addCategory":
                case "addEquipment":
                case "addLocation":
                case "addPoint":
                case "addReference":
                    answer = isValidAddAction();
                    break;
                case "clone":
                    answer = isValidCloneAction();
                    break;
                case "copy":
                    answer = isValidCopyAction();
                    break;
                case "cut":
                    answer = isValidCutAction();
                    break;
                case "delete":
                    answer = isValidDeleteAction();
                    break;
                case "edit":
                    answer = isValidEditAction();
                    break;
                case "open":
                    answer = isValidOpenAction();
                    break;
                case "paste":
                    answer = isValidPasteAction();
                    break;
                default:
                    break;
            }
        }

        return answer;
    },

    // init fns should only be run once after dtiCommon is loaded, and is normally self-handled (see end of this script)
    init: {
        clientSide: () => {
            if (window.dti) {
                dtiCommon._private.pointNameSeparator = dti.utility.getConfig('Enums.Point Name Separator').Value;
            } else {
                dtiUtility.getConfig('Enums.Point Name Separator', null, function (result) {
                    // result = {
                    //  Value: ' ► ' // or whatever the char is
                    // }
                    dtiCommon._private.pointNameSeparator = result.Value;
                });
            }
        },
        serverSide: () => {
            let Config = require('../lib/config');
            dtiCommon._private.pointNameSeparator = Config.Enums['Point Name Separator'].Value;
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
