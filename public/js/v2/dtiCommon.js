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
        pointNameSeparator: '', // hex: e296ba   UTF8:  "\u25ba"   keyboard: Alt 16
        validPointLabelRegEx: /[a-zA-Z 0-9%\.&\-\+\[\]\(\)\/]/
    },

    post(config) {
        return $.ajax({
            url: config.url,
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(config.data)
        });
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

    cleanLabelField: (labelField) => {
        let answer = labelField.replace(/ {1,}/g," ");
        return answer.trim();
    },

    isPointDisplayStringValid: (labelValue) => {
        var invalidChars = [],
            i,
            len = labelValue.length,
            valid = true,
            errMessage = "";

        if (len === 0) {
            valid = false;
            errMessage = "Label field is blank";
        } else {
            for (i = 0; i < len; i++) {
                if (!dtiCommon._private.validPointLabelRegEx.test(labelValue[i])) {
                // if (!dti.utility.getConfig('Utility.isPointNameCharacterLegal', [labelValue[i]])) {
                    if (!invalidChars.includes(labelValue[i])) {
                        invalidChars.push(labelValue[i]);
                    }

                    valid = false;
                }
            }
            if (!valid) {
                errMessage = "Label field contains invalid characters " + invalidChars.join();
            }
        }

        return {
            valid: valid,
            errorMessage: errMessage
        };
    },

    isValidHierarchyAction: (action, actionObject, sourceNodeContainsTargetNode) => {
        let isValidAction = true,
            targetNode = actionObject.targetNode,
            sourceNode = actionObject.sourceNode,
            targetIsRootNode,
            validTypesToCopy = ['Point', 'Application'],
            protectedApplications = ['Sensor', 'Sequence', 'Schedule'],
            isTargetNodeProtectedApplication = () => {
                let answer = false;

                if (targetNode.nodeType === "Application"
                    && protectedApplications.indexOf(targetNode.pointType) >= 0) {
                    answer = true;
                }

                return answer;
            },
            isTargetNodeParentProtectedApplication = () => {
                let answer = false;

                if (targetNode.parentNode
                    && targetNode.parentNode.nodeType === "Application"
                    && protectedApplications.indexOf(targetNode.parentNode.pointType) >= 0) {
                    answer = true;
                }

                return answer;
            },
            isValidPasteAction = () => {
                let cutNodeOnClipboard = (!!sourceNode && sourceNode.isCut),
                    copyNodeOnClipboard = (!!sourceNode && sourceNode.isCopy),
                    clipboardNodeType = sourceNode && sourceNode.nodeType,
                    validPaste = (cutNodeOnClipboard || copyNodeOnClipboard);

                if (validPaste) {
                    if (isTargetNodeProtectedApplication() || isTargetNodeParentProtectedApplication()) {
                        validPaste = false;
                    } else if (targetNode.nodeType === "Reference") {
                        validPaste = false;
                    } else if (cutNodeOnClipboard) { // logic specific to CUT nodes
                        if (sourceNodeContainsTargetNode) {  // if right-clicking the cut targetNode or inside the cut targetNode
                            validPaste = false;
                        } else if (clipboardNodeType === "Location" && targetNode.nodeType !== "Location") { // a location can only be pasting into a location
                            validPaste = false;
                        } else if (sourceNode.parentNode._id === targetNode._id) { // the cut node is being pasted in exact same place
                            validPaste = false;
                        }
                    } else if (copyNodeOnClipboard) {  // logic specific to COPY nodes

                    }
                }

                return validPaste;
            },
            isValidPasteAsReferenceAction = () => {
                let copyNodeOnClipboard = (!!sourceNode && sourceNode.isCopy),
                    clipboardNodeType = !!sourceNode && sourceNode.nodeType,
                    validPaste = copyNodeOnClipboard;

                if (isTargetNodeProtectedApplication() || isTargetNodeParentProtectedApplication()) {
                    validPaste = false;
                } else if (targetNode.nodeType === "Reference") {
                    validPaste = false;
                } else if (copyNodeOnClipboard) {
                    if (sourceNodeContainsTargetNode) {
                        validPaste = false;
                    }
                }

                return validPaste;
            },
            isValidAddAction = () => {
                return (targetNode.nodeType !== "Reference"
                    && !isTargetNodeProtectedApplication()
                    && !isTargetNodeParentProtectedApplication());
            },
            isValidAddLocationAction = () => {
                return (targetNode.nodeType === "Location");
            },
            isValidAddEquipmentAction = () => {
                return true;
            },
            isValidAddCategoryAction = () => {
                return true;
            },
            isValidAddPointAction = () => {
                return true;
            },
            isValidCopyAction = () => {
                let inCopyCollection = (validTypesToCopy.indexOf(targetNode.nodeType) >= 0);

                return (inCopyCollection && !targetIsRootNode);
            },
            isValidCloneAction = () => {
                return isValidCopyAction();
            },
            isValidCutAction = () => {
                return !(targetIsRootNode || isTargetNodeParentProtectedApplication());
            },
            isValidEditAction = () => {
                return (!targetIsRootNode);
            },
            isValidRenameAction = () => {
                return isValidEditAction();
            },
            isValidOpenAction = () => {
                return (!targetIsRootNode);
            },
            isValidDeleteAction = () => {
                return (!targetIsRootNode && !isTargetNodeParentProtectedApplication());
            };

        if (targetNode) {
            targetIsRootNode = (targetNode._isRoot);

            switch (action) {
                case "add":
                    isValidAction = isValidAddAction();
                    break;
                case "addLocation":
                    isValidAction = isValidAddLocationAction();
                    break;
                case "addEquipment":
                    isValidAction = isValidAddEquipmentAction();
                    break;
                case "addCategory":
                    isValidAction = isValidAddCategoryAction();
                    break;
                case "addPoint":
                    isValidAction = isValidAddPointAction();
                    break;
                case "clone":
                    isValidAction = isValidCloneAction();
                    break;
                case "copy":
                    isValidAction = isValidCopyAction();
                    break;
                case "cut":
                    isValidAction = isValidCutAction();
                    break;
                case "delete":
                    isValidAction = isValidDeleteAction();
                    break;
                case "edit":
                    isValidAction = isValidEditAction();
                    break;
                case "rename":
                    isValidAction = isValidRenameAction();
                    break;
                case "open":
                    isValidAction = isValidOpenAction();
                    break;
                case "paste":
                    isValidAction = isValidPasteAction();
                    break;
                case "pastereference":
                    isValidAction = isValidPasteAsReferenceAction();
                    break;
                default:
                    isValidAction = false;
                    break;
            }
        }

        return isValidAction;
    },

    resolveAlarmName: (alarmsMsg, alarmPath) => {
        return alarmsMsg.replace("%NAME", dtiCommon.getPointName(alarmPath));
    },

    checkPathForUniqueness(parentNodeId, display, cb) {
        let err;

        dtiCommon.post({
            url: '/api/hierarchy/checkUniqueDisplayUnderParent',
            data: {
                parentNode: parentNodeId,
                display: display
            }
        }).done((response) => {
            let result = response;

            if (result.exists) {
                err = "error: " + "'" + display + "' already exists at this level";
            } else if (result.err) {
                err = result.err;
            }
        }).fail(() => {
            err = 'A network error occurred';
        }).always(() => {
            cb(err);
        });
    },

    knockout: {
        init: () => {
            ko.bindingHandlers.dtiHierarchyLabel = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var $element = $(element),
                        vm = viewModel,
                        elementValue,
                        keypressTimer = 300,
                        keypressTimerID,
                        handleElementStatus = (errorMessage) => {
                            let $myLabels = $(element).siblings("label");
                            if (errorMessage) {
                                $element.addClass("invalid");
                                $element.removeClass("valid");
                                $myLabels.attr("data-error", errorMessage);
                                vm.pathIsValid(false);
                            } else {
                                $element.removeClass("invalid");
                                $element.addClass("valid");
                                $myLabels.attr("data-error", "");
                                vm.pathIsValid(true);
                            }
                        },
                        handleUniquenessResult = (err) => {
                            vm.activeUniquenessCheck(false);
                            handleElementStatus(err);
                        },
                        testFieldValidity = () => {
                            elementValue = $element.val().trim();
                            let labelTest = dtiCommon.isPointDisplayStringValid(elementValue);
                            // $element.val(elementValue.trim());
                            if (labelTest.valid) {
                                vm.activeUniquenessCheck(true);
                                dtiCommon.checkPathForUniqueness(vm.parentID(), dtiCommon.cleanLabelField(elementValue), handleUniquenessResult);
                            } else {
                                handleElementStatus(labelTest.errorMessage);
                            }
                        };

                    $element
                        .on("keyup", function (event) {
                            clearTimeout(keypressTimerID);
                            if (!vm.activeUniquenessCheck()) {
                                keypressTimerID = setTimeout(function () {
                                    testFieldValidity();
                                }, keypressTimer);
                            }
                        });
                }
            };
        }
    },

    // init fns should only be run once after dtiCommon is loaded, and is normally self-handled (see end of this script)
    init: {
        isComplete: false,
        clientSide: () => {
            if (window.ko !== undefined) {
                dtiCommon.knockout.init();
            }

            if (window.dti && dti.utility) {
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
    document.addEventListener('DOMContentLoaded', function done(event) {
        // We have to delay the init function to make sure Config has been loaded
        setTimeout(dtiCommon.init.clientSide, 1000);
    });
} else { // nope, we're server-side
    // We have to delay the init function to make sure Config has been fully loaded
    setTimeout(dtiCommon.init.serverSide, 100);

    module.exports = dtiCommon;
}
