/*jslint white: true*/

//register ko components and binding handlers
require(['knockout'], function (ko) {
    //manually set the global ko property
    //for non-amd compliant plugins
    window.ko = ko;

    // Components are packaged as AMD modules
    // Controls
    ko.components.register('ctl-description', {
        require: 'components/ctl-description/module'
    });
    ko.components.register('ctl-dropdown', {
        require: 'components/ctl-dropdown/module'
    });
    ko.components.register('ctl-duration', {
        require: 'components/ctl-duration/module'
    });
    ko.components.register('ctl-involvement', {
        require: 'components/ctl-involvement/module'
    });
    ko.components.register('ctl-ip', {
        require: 'components/ctl-ip/module'
    });
    ko.components.register('ctl-notifications', {
        require: 'components/ctl-notifications/module'
    });
    ko.components.register('ctl-number', {
        require: 'components/ctl-number/module'
    });
    ko.components.register('ctl-pointReference', {
        require: 'components/ctl-pointReference/module'
    });
    ko.components.register('ctl-ROtime', {
        require: 'components/ctl-ROtime/module'
    });
    ko.components.register('ctl-ROvalue-eu', {
        require: 'components/ctl-ROvalue-eu/module'
    });
    ko.components.register('ctl-states', {
        require: 'components/ctl-states/module'
    });
    ko.components.register('ctl-statusBar', {
        require: 'components/ctl-statusBar/module'
    });
    ko.components.register('ctl-switch', {
        require: 'components/ctl-switch/module'
    });
    ko.components.register('ctl-text', {
        require: 'components/ctl-text/module'
    });
    ko.components.register('ctl-value-eu', {
        require: 'components/ctl-value-eu/module'
    });
    ko.components.register('ctl-valueBar', {
        require: 'components/ctl-valueBar/module'
    });
    ko.components.register('ctl-editor', {
        require: 'components/ctl-editor/module'
    });
    ko.components.register('ctl-permissions', {
        require: 'components/ctl-permissions/module'
    });
    ko.components.register('ctl-viewControls', {
        require: 'components/ctl-viewControls/module'
    });
    ko.components.register('ctl-sendControl', {
        require: 'components/ctl-sendControl/module'
    });
    ko.components.register('ctl-readValue', {
        require: 'components/ctl-readValue/module'
    });
    ko.components.register('ctl-viewTrend', {
        require: 'components/ctl-viewTrend/module'
    });
    ko.components.register('ctl-staticText', {
        require: 'components/ctl-staticText/module'
    });
    ko.components.register('ctl-firmwareLoader', {
        require: 'components/ctl-firmwareLoader/module'
    });
    ko.components.register('ctl-firmwareVersion', {
        require: 'components/ctl-firmwareVersion/module'
    });
    ko.components.register('ctl-conversionWizard', {
        require: 'components/ctl-conversionWizard/module'
    });
    ko.components.register('ctl-scheduleEntries', {
        require: 'components/ctl-scheduleEntries/module'
    });
    ko.components.register('ctl-qualityCodeEnable', {
        require: 'components/ctl-qualityCodeEnable/module'
    });
    ko.components.register('ctl-policies', {
        require: 'components/ctl-policies/module'
    });
    ko.components.register('ctl-networkInfo', {
        require: 'components/ctl-networkInfo/module'
    });
    // Point Reviews
    ko.components.register('pt-accumulator', {
        require: 'components/pt-accumulator/module'
    });
    ko.components.register('pt-alarmstatus', {
        require: 'components/pt-alarmstatus/module'
    });
    ko.components.register('pt-analoginput', {
        require: 'components/pt-analoginput/module'
    });
    ko.components.register('pt-analogoutput', {
        require: 'components/pt-analogoutput/module'
    });
    ko.components.register('pt-analogselector', {
        require: 'components/pt-analogselector/module'
    });
    ko.components.register('pt-analogvalue', {
        require: 'components/pt-analogvalue/module'
    });
    ko.components.register('pt-average', {
        require: 'components/pt-average/module'
    });
    ko.components.register('pt-binaryinput', {
        require: 'components/pt-binaryinput/module'
    });
    ko.components.register('pt-binaryoutput', {
        require: 'components/pt-binaryoutput/module'
    });
    ko.components.register('pt-binaryselector', {
        require: 'components/pt-binaryselector/module'
    });
    ko.components.register('pt-binaryvalue', {
        require: 'components/pt-binaryvalue/module'
    });
    ko.components.register('pt-comparator', {
        require: 'components/pt-comparator/module'
    });
    ko.components.register('pt-delay', {
        require: 'components/pt-delay/module'
    });
    ko.components.register('pt-device', {
        require: 'components/pt-device/module'
    });
    ko.components.register('pt-digitallogic', {
        require: 'components/pt-digitallogic/module'
    });
    ko.components.register('pt-economizer', {
        require: 'components/pt-economizer/module'
    });
    ko.components.register('pt-enthalpy', {
        require: 'components/pt-enthalpy/module'
    });
    ko.components.register('pt-logic', {
        require: 'components/pt-logic/module'
    });
    ko.components.register('pt-math', {
        require: 'components/pt-math/module'
    });
    ko.components.register('pt-multiplexer', {
        require: 'components/pt-multiplexer/module'
    });
    ko.components.register('pt-multistatevalue', {
        require: 'components/pt-multistatevalue/module'
    });
    ko.components.register('pt-optimumstart', {
        require: 'components/pt-optimumstart/module'
    });
    ko.components.register('pt-program', {
        require: 'components/pt-program/module'
    });
    ko.components.register('pt-proportional', {
        require: 'components/pt-proportional/module'
    });
    ko.components.register('pt-ramp', {
        require: 'components/pt-ramp/module'
    });
    ko.components.register('pt-remoteunit', {
        require: 'components/pt-remoteunit/module'
    });
    ko.components.register('pt-schedule', {
        require: 'components/pt-schedule/module'
    });
    ko.components.register('pt-script', {
        require: 'components/pt-script/module'
    });
    ko.components.register('pt-selectvalue', {
        require: 'components/pt-selectvalue/module'
    });
    ko.components.register('pt-setpointadjust', {
        require: 'components/pt-setpointadjust/module'
    });
    ko.components.register('pt-slideshow', {
        require: 'components/pt-slideshow/module'
    });
    ko.components.register('pt-totalizer', {
        require: 'components/pt-totalizer/module'
    });
    ko.components.register('pt-vav', {
        require: 'components/pt-vav/module'
    });
    ko.components.register('pt-sensor', {
        require: 'components/pt-sensor/module'
    });
    ko.components.register('pt-liftstation', {
        require: 'components/pt-liftstation/module'
    });
});

define([
    'jquery',
    'knockout',
    'socket',
    'moment',
    'big',
    'bannerJS',
    'knockout-projections',
    'knockout.viewmodel',
    'jquery-transit',
    'jquery-mousewheel',
    'jquery-easing',
    'jquery-hilite',
    'bootstrap',
    'bootstrap-switch'
], function ($, ko, io, moment, Big, bannerJS) {
    var pointInspector = {},
        workspace = window.top.workspaceManager,
        uniqueIdRegister = [],
        formatPointErrorTimestamp = 0;

    //for workspace 'give me point data' function
    (function checkParameters() {
        setTimeout(function () { // give messaging layer time to finish with onLoad()   home.js
            if (window.getWindowParameters) {
                var cfg = window.getWindowParameters();

                window.attach = {};

                if (cfg.pointData) {
                    window.attach.point = $.extend(true, {}, cfg.pointData);
                }

                if (cfg.callback) {
                    window.attach.saveCallback = cfg.callback;
                }

                if (!!cfg.options && cfg.options.isGplEdit) {
                    pointInspector.isGplEdit = true;
                }
            }

            if (!!window.attach && !!window.attach.point) {
                //flag for external/parameter points (mainly gpl)
                pointInspector.isExternal = true;
                initialize(window.attach.point);
            } else {
                getData(pointInspector.id).done(function (data) {
                    initialize(data);
                });
            }
        }, 50);
    }());

    //adjust default calendar config to show time
    moment.locale('en', {
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'MM/DD/YYYY',
            LL: 'MMMM Do YYYY',
            LLL: 'MMMM Do YYYY LT',
            LLLL: 'dddd, MMMM Do YYYY LT'
        },
        calendar: {
            lastDay: '[Yesterday at] LTS',
            sameDay: '[Today at] LTS',
            nextDay: '[Tomorrow at] LTS',
            lastWeek: '[Last] dddd [at] LTS',
            nextWeek: 'dddd [at] LTS',
            sameElse: 'L LTS'
        }
    });

    pointInspector.webEndpoint = '//' + window.location.hostname;
    pointInspector.apiEndpoint = pointInspector.webEndpoint + ':' + window.location.port + '/api/';
    pointInspector.id = window.location.href.split('/').reverse()[0];
    pointInspector.permissionLevels = {
        READ: 1,
        CONTROL: 2,
        ACKNOWLEDGE: 4,
        WRITE: 8
    };
    pointInspector.utility = {
        getPointRefProperty: function (propertyName, point) {
            var pointRefs = (point !== undefined) ? point['Point Refs']() : pointInspector.point.data['Point Refs'](),
                pointRefProperty = {},
                i = 0,
                last = pointRefs.length;
            for (i; i < last; i++) {
                if (propertyName === pointRefs[i].PropertyName()) {
                    pointRefProperty.arrayIndex = i;
                    pointRefProperty.data = pointRefs[i];
                    return pointRefProperty;
                }
            }
        },
        getPointRefPropertyByAppIndex: function (propertyName, appIndex) {
            var pointRefs = pointInspector.point.data['Point Refs'](),
                pointRefProperty = {},
                i = 0,
                last = pointRefs.length;
            for (i; i < last; i++) {
                if (propertyName === pointRefs[i].PropertyName() && appIndex === pointRefs[i].AppIndex()) {
                    pointRefProperty.arrayIndex = i;
                    pointRefProperty.data = pointRefs[i];
                    return pointRefProperty;
                }
            }
        },
        enumToArray: function (obj) {
            var _array = [];
            for (var i in obj) {
                _array.push({
                    name: ko.observable(i),
                    value: ko.observable(typeof obj[i].enum === 'undefined' ? obj[i] : obj[i].enum)
                });
            }
            return _array;
        },
        arrayToValueOptions: function (arr) {
            var _options = {},
                i = 0;
            for (i; i < arr.length; i++) {
                _options[ko.unwrap(arr[i].name)] = ko.unwrap(arr[i].value);
            }
            return _options;
        },
        createUniqueId: function () {
            var lastId = Math.max.apply(Math, uniqueIdRegister),
                newId = lastId < 0 ? 0 : lastId + 1;

            uniqueIdRegister.push(newId);
            return newId;
        },
        addEvent: function (element, event, fn) {
            if (element.addEventListener) {
                element.addEventListener(event, fn, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + event, fn);
            }
        },
        removeEvent: function (element, event, fn) {
            if (element.removeEventListener) {
                element.removeEventListener(event, fn, false);
            } else if (element.detachEvent) {
                element.detachEvent('on' + event, fn);
            }
        },
        createSelection: function (input, start, end) {
            if (input.setSelectionRange) {
                input.focus();
                input.setSelectionRange(start, end);
            } else if (input.createTextRange) {
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
        },
        getSelectionStart: function (input) {
            if (typeof input.selectionStart === 'number') {
                return input.selectionStart;
            } else if (input.createTextRange) {
                var range;
                input.focus();
                range = document.selection.createRange().duplicate();
                range.moveEnd('character', input.value.length);
                if (range.text === '') {
                    return input.value.length;
                }
                return input.value.lastIndexOf(range.text);
            }
            return 0;
        },
        getSelectionEnd: function (input) {
            if (typeof input.selectionEnd === 'number') {
                return input.selectionEnd;
            } else if (input.createTextRange) {
                var range;
                input.focus();
                range = document.selection.createRange().duplicate();
                range.moveStart('character', -input.value.length);
                if (range.text === '') {
                    return input.value.length;
                }
                return input.value.lastIndexOf(range.text);
            }
            return 0;
        },
        isInt: function (val) {
            var re = /^[-+]?[0-9]+$/;
            return re.test(val);
        },
        isFloat: function (val) {
            return (typeof val === 'number' || (typeof val === 'string' && val !== '')) && !isNaN(Number(val));
        },
        normalizeNumber: function (val) {
            //remove commas
            return val.toString().replace(/,/g, '');
        },
        formatNumber: function (val, valueType, noTruncate, noComma) {
            if ($.trim(val) === '' || isNaN(parseFloat(val))) {
                return '';
            }
            val = new Big(pointInspector.utility.normalizeNumber(val));
            noTruncate = noTruncate || pointInspector.isInEditMode();
            // Check the value type and remove any illegal chars in case any were pasted
            if (valueType === 4) { // remove signs
                val = val.abs();
            }
            if (valueType === 3 || valueType === 4) { // remove decimals
                val = val.toFixed(0);
            }
            return workspace.config.Utility.formatNumber({
                val: val,
                noTruncate: noTruncate,
                noComma: noComma
            });
        },
        workspace: workspace,
        config: workspace.config,
        getControllerName: function (controller) {
            var controllers = workspace.systemEnums.controllers;
            for (var i = controllers.length; i--;) {
                if (controllers[i].value === controller) {
                    return controllers[i].name;
                }
            }
            return '';
        },
        getLevelName: function (level) {
            var priorities = workspace.systemEnums.controlpriorities;
            for (var i = priorities.length; i--;) {
                if (priorities[i].value === level) {
                    return priorities[i].name;
                }
            }
            return '';
        }
    };

    pointInspector.isInEditMode = ko.observable(false);
    pointInspector.modelUpdate = ko.observable(false);
    pointInspector.currentTab = ko.observable();
    pointInspector.toggleEditMode = function (edit) {
        var isInEditMode = pointInspector.isInEditMode();
        if (isInEditMode) {
            // undo changes
            // ko.viewmodel.updateFromModel(pointInspector.point.data, pointInspector.point.originalData);
            pointInspector.updateObject(pointInspector.point.data, pointInspector.point.originalData);
            // Hide the invalid character message just in case it is visible
            $('.invalidCharMsg').hide();
        }
        pointInspector.isInEditMode(!isInEditMode);
    };
    pointInspector.restorePoint = function (_, e) {
        var emitData = JSON.stringify({
                upi: pointInspector.point.data._id()
            }),
            error = '';
        $(e.currentTarget).attr('disabled', true);

        pointInspector.socket.emit('restorePoint', emitData);

        pointInspector.socket.once('pointUpdated', function (response) {
            response = JSON.parse(response);
            if (response.err) {
                error = ['An error occurred when trying to restore this point: ', response.err].join('');
            } else if (response.message !== 'success') {
                error = 'An unknown error occurred when trying to restore this point. Please try again.';
            }

            if (error.length) {
                bannerJS.showBanner({
                    msg: error,
                    dismissText: 'Dismiss',
                    color: '#D50000'
                });
            } else {
                bannerJS.showBanner({
                    msg: 'Point restored successfully',
                    dismissText: 'OK',
                    duration: 3000
                });
                pointInspector.point.originalData._pStatus = 0;
                pointInspector.point.data._pStatus(0);
            }
            $(e.currentTarget).attr('disabled', false);
        });
    };
    pointInspector.close = function (edit) {
        var newPointData = ko.viewmodel.toModel(pointInspector.point.data),
            emitData = {
                upi: newPointData._id,
                method: 'hard'
            },
            emitString = 'deletePoint';

        //if new and from external (gpl), don't delete it on close
        if (newPointData._pStatus === 1 && !pointInspector.isExternal) {
            pointInspector.socket.emit(emitString, emitData);
        }

        dtiUtility.closeWindow();
        // window.close();
    };
    pointInspector.updateObject = function (_koPoint, _configPoint) {
        // var _newPoint = ko.viewmodel.fromModel(_configPoint);
        var _newPoint = (new Point(_configPoint)).data;
        var props = ['Value', 'ValueOptions', 'isDisplayable', 'isReadOnly', 'eValue', 'ValueType', 'PropertyName', 'PropertyEnum', 'AppIndex', 'PointName', 'PointType', 'PointInst', 'DevInst', 'name', 'value'];
        var checkForProp = function (prop) {
            return !!pointInspector.utility.config.Templates.commonProperties.hasOwnProperty(prop) || !!~props.indexOf(prop);
        };
        var updateValues = function (current, updated) {
            var changeProperty = function (currentProp, updatedProp) {
                if (typeof currentProp === 'object' || (ko.isObservable(currentProp) && typeof currentProp() === 'object')) {
                    updateValues(currentProp, updatedProp);
                } else if (checkForProp(prop) && currentProp() !== updatedProp()) {
                    currentProp(updatedProp());
                }
            };
            for (var prop in current) {
                if (prop === 'Alarm Messages') {
                    continue;
                } else if (Array.isArray(current[prop]) || (ko.isObservable(current[prop]) && Array.isArray(current[prop]()))) {
                    var jsProp = (!!ko.isObservable(current[prop])) ? current[prop]() : current[prop];
                    var updatedJsProp = (!!ko.isObservable(updated[prop])) ? updated[prop]() : updated[prop];
                    if (!!~['taglist', 'Security'].indexOf(prop)) { // commented below is going to get complex and will probably rewrite entire function to better support ko/js objects
                        // if ((!!jsProp.length && !ko.isObservable(jsProp[0])) || (!!updatedJsProp.length && !ko.isObservable(updatedJsProp[0]))) {
                        current[prop] = updated[prop];
                    } else {
                        current[prop](updated[prop]());
                    }
                } else if (!updated.hasOwnProperty(prop)) {
                    // delete currentProp;
                } else {
                    changeProperty(current[prop], updated[prop]);
                }
            }
        };
        var addValues = function (current, updated) {
            var currentModel = ko.viewmodel.toModel(current);
            var updatedModel = ko.viewmodel.toModel(updated);
            for (var prop in updated) {
                if (prop === 'Alarm Messages') {
                    continue;
                }
                if (Array.isArray(current[prop]) || (ko.isObservable(current[prop]) && Array.isArray(current[prop]()))) {
                    var updatedJsProp = (!!ko.isObservable(updated[prop])) ? updated[prop]() : updated[prop];
                    current[prop](updatedJsProp);
                } else if (typeof updated[prop] === 'object' || (ko.isObservable(updated[prop]) && typeof updated[prop]() === 'object')) {
                    addValues((ko.isObservable(current[prop])) ? current[prop]() : current[prop], (ko.isObservable(updated[prop])) ? updated[prop]() : updated[prop]);
                } else if (!current.hasOwnProperty(prop) && checkForProp(prop)) {
                    current[prop] = ko.observable(updated[prop]);
                }
            }
        };
        updateValues(_koPoint, _newPoint);
        addValues(_koPoint, _newPoint);
    };
    pointInspector.tabTriggers = {};
    pointInspector.events = {
        viewmodelChange: function (e) {
            var $element = e.targetElement === null ? null : (e.targetElement instanceof jQuery) ? e.targetElement : $(e.targetElement),
                point,
                config = pointInspector.utility.config,
                updatedPoint,
                originalProp,
                pointProp;

            if (e.hasOwnProperty('oldPoint') && e.oldPoint !== null) {
                point = {
                    point: ko.viewmodel.toModel(e.point),
                    property: e.property,
                    refPoint: e.refPoint,
                    oldPoint: e.oldPoint
                };
                updatedPoint = config.Update.formatPoint(point);
                console.log('SEND111', point);
                console.log('UPDATE111', updatedPoint);
                if (!!updatedPoint.err) {
                    //set property back to original value
                    if (!!$element) {
                        $element.effect('highlight', {
                            color: '#ffff99'
                        }, 2500);
                    }
                    if (typeof e.property === 'number') {
                        pointProp = e.point['Point Refs']()[e.property];
                        originalProp = e.oldPoint['Point Refs'][e.property];
                        pointProp.Value(originalProp.Value);
                        pointProp.PointName(originalProp.PointName);
                        //display message from config.format call
                        bannerJS.showBanner(updatedPoint.err + ' The ' + e.point['Point Refs']()[e.property].PropertyName() + ' has been set back to its original value.', 'Dismiss');
                    } else {
                        pointProp = e.point[e.property];
                        originalProp = e.oldPoint[e.property];
                        if (pointProp.hasOwnProperty('Value')) { // We had to add this because now it is invoked for 'name[1-4]' changes (name[1-4] do not have a 'Value' key)
                            pointProp.Value(originalProp.Value);
                        } else {
                            pointProp(originalProp);
                        }
                        //display message from config.format call
                        bannerJS.showBanner(updatedPoint.err + ' The ' + e.property + ' has been set back to its original value.', 'Dismiss');
                    }
                } else {
                    // ko.viewmodel.updateFromModel(e.point, updatedPoint);
                    pointInspector.updateObject(e.point, updatedPoint);
                }
            } else {
                point = {
                    point: ko.viewmodel.toModel(pointInspector.point.data),
                    property: e.property,
                    refPoint: e.refPoint,
                    oldPoint: pointInspector.point.originalData,
                    networkConfig: pointInspector.utility.workspace.systemEnumObjects.telemetry['Network Configuration']
                };
                updatedPoint = config.Update.formatPoint(point);
                console.log('SEND', point);
                console.log('UPDATE', updatedPoint);
                if (!!updatedPoint.err) {
                    formatPointErrorTimestamp = new Date().getTime();

                    //set property back to original value
                    if (!!$element) {
                        $element.effect('highlight', {
                            color: '#ffff99'
                        }, 2500);
                    }
                    if (typeof e.property === 'number') {
                        pointProp = pointInspector.point.data['Point Refs']()[e.property];
                        originalProp = pointInspector.point.originalData['Point Refs'][e.property];
                        pointProp.Value(originalProp.Value);
                        pointProp.PointName(originalProp.PointName);
                        //display message from config.format call
                        bannerJS.showBanner(updatedPoint.err + ' The ' + pointInspector.point.data['Point Refs']()[e.property].PropertyName() + ' has been set back to its original value.', 'Dismiss');
                    } else {
                        pointProp = pointInspector.point.data[e.property];
                        originalProp = pointInspector.point.originalData[e.property];
                        if (!!updatedPoint.truncate) {
                            if (pointProp.hasOwnProperty('Value')) { // We had to add this because now it is invoked for 'name[1-4]' changes (name[1-4] do not have a 'Value' key)
                                pointProp.Value(point.point[e.property].Value.substring(0, updatedPoint.maxLength));
                            } else {
                                pointProp(point.point[e.property].substring(0, updatedPoint.maxLength));
                            }
                            bannerJS.showBanner(updatedPoint.err + ' The ' + e.property + ' has been truncated.', 'Dismiss');
                        } else {
                            if (e.property === 'States') { // check for any property that could update ValueOptions instead of Value
                                pointProp.ValueOptions(pointInspector.utility.enumToArray(originalProp.ValueOptions));
                            } else if (pointProp.hasOwnProperty('Value')) { // We had to add this because now it is invoked for 'name[1-4]' changes (name[1-4] do not have a 'Value' key)
                                pointProp.Value(originalProp.Value);
                            } else {
                                pointProp(originalProp);
                            }
                            //display message from config.format call
                            bannerJS.showBanner(updatedPoint.err + ' The ' + e.property + ' has been set back to its original value.', 'Dismiss');
                        }
                    }
                } else {
                    pointInspector.modelUpdate(true);
                    updatedPoint = JSON.parse(JSON.stringify(updatedPoint));
                    pointInspector.point.updatedPoint = updatedPoint;

                    //ko.viewmodel.updateFromModel(pointInspector.point.data, updatedPoint);
                    pointInspector.updateObject(pointInspector.point.data, updatedPoint);
                    // ko.viewmodel.updateFromModel(pointInspector.point.data, updatedPoint);
                    pointInspector.modelUpdate(false);
                }
            }
        }
    };
    pointInspector.initDOM = function () {
        var $body = $('body'),
            $nav = $('.nav'),
            $subNav = $nav.find('li>ul'),
            $parentItem = $subNav.parent().children('span'),
            $back = $subNav.find('.back'),
            $tab = $nav.find('li').not($parentItem.parent()).not($back).not('.header'),
            $view = $('.view'),
            $viewOverlay = $('.viewOverlay'),
            $navToggle = $('.navToggle');

        function showTabs($tab) {
            $tab.removeClass('tabHidden');
        }

        function hideTabs($tab) {
            $tab.addClass('tabHidden');
        }

        //disable context menu
        $(document).on('contextmenu', function (event) {
            if (!$(event.target).is('textarea, input[type="text"]') && !$(event.target).closest('.CodeMirror').length) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return false;
            }
        });

        // add viewmodel change handler
        $(document).on('viewmodelChange', pointInspector.events.viewmodelChange);

        $tab.on('click', function () {
            var $this = $(this),
                $header = $view.find('.header').find('h4'),
                contentTitle = $this.find('span').text(),
                contentSelectorArray = contentTitle.split(' '),
                contentSelector,
                $tabContent,
                $tabs = $('.content'),
                tabTrigger = pointInspector.tabTriggers[contentTitle.toLowerCase()];

            if ($this.hasClass('active')) {
                return;
            }

            //hide all tabs
            hideTabs($tabs);

            pointInspector.currentTab(contentTitle.toLowerCase());
            contentSelectorArray.unshift('#');
            contentSelector = contentSelectorArray.join('').toLowerCase();

            $tabContent = $(contentSelector);

            $view.scrollTop(0);

            $tab.removeClass('active');
            $this.addClass('active');

            if ($navToggle.hasClass('shown')) {
                $navToggle.trigger('click');
            }

            $view.children().stop(true, true).animate({
                opacity: 0
            }, {
                duration: 100,
                easing: 'easeOutQuint',
                complete: function () {
                    $header.text(contentTitle);
                    showTabs($tabContent);
                    $view.children().animate({
                        opacity: 1
                    }, {
                        duration: 500,
                        easing: 'easeOutQuint'
                    });
                }
            });

            //do we have any triggers?
            if (typeof tabTrigger === 'function') {
                tabTrigger(true);
            }
        });

        //show first tab
        $tab.first().trigger('click');

        $parentItem.on('click', function () {
            var $this = $(this),
                $siblingMenu = $this.siblings('ul');
            $siblingMenu.show();

            // Display the first sub-menu item
            $siblingMenu.children().not('.header').not('.back').first().trigger('click');

            $nav.addClass('animating').animate({
                left: '-146px'
            }, {
                duration: 300,
                easing: 'easeOutExpo',
                complete: function () {
                    $nav.removeClass('animating');
                }
            });
        });
        $back.on('click', function () {
            $subNav.hide();

            // Display the parent's first menu item
            $tab.first().trigger('click');

            $nav.addClass('animating').animate({
                left: '0px'
            }, {
                duration: 300,
                easing: 'easeOutExpo',
                complete: function () {
                    $nav.removeClass('animating');
                }
            });
        });
        $navToggle.on('click', function () {
            if ($navToggle.hasClass('shown')) {
                if ($(window).width() < 768) {
                    $view.animate({
                        left: '0px'
                    }, {
                        duration: 300,
                        easing: 'easeOutExpo',
                        complete: function () {
                            $view.removeAttr('style');
                        }
                    });
                }
                $viewOverlay.removeClass('shown').css({
                    top: '0',
                    bottom: '0'
                });
                $viewOverlay.animate({
                    left: '0px',
                    opacity: '0'
                }, {
                    duration: 300,
                    easing: 'easeOutExpo',
                    complete: $viewOverlay.hide
                });
                $navToggle.removeClass('shown');
                return;
            }
            $viewOverlay.css({
                opacity: '0'
            }).addClass('shown').css({
                top: '50px',
                bottom: '30px'
            });
            $view.animate({
                left: '136px'
            }, {
                duration: 300,
                easing: 'easeOutExpo'
            });
            $viewOverlay.animate({
                left: '136px',
                opacity: '1'
            }, {
                duration: 300,
                easing: 'easeOutExpo'
            });
            $navToggle.addClass('shown');
        });
        bannerJS.init();
        $.fn.bootstrapSwitch.defaults.size = 'small';
        $.fn.bootstrapSwitch.defaults.onColor = 'success';
        if ($.support.transition) {
            $body.transition({
                opacity: 1
            }, 2000, 'easeOutQuint');
        } else {
            $body.animate({
                opacity: 1
            }, {
                duration: 500,
                easing: 'easeOutQuint'
            });
        }
    };
    pointInspector.authorize = function (data, requestedAccessLevel) {
        var pAccess = (ko.isObservable(data._pAccess)) ? data._pAccess() : data._pAccess;
        return !!(pAccess & requestedAccessLevel);
    };

    pointInspector.isSystemAdmin = function () {
        return workspace.user()['System Admin'].Value;
    };

    pointInspector.isValidFirmwareLoader = function (data) {
        var modelType = data['Model Type'].eValue();

        if (data['Point Type'].eValue() === 8) {
            return (modelType === 13 || modelType === 16 || modelType === 17 || modelType === 18 || modelType === 19 || modelType === 20);
        } else if (data['Point Type'].eValue() === 144) {
            return (modelType === 3 || modelType === 6);
        }
    };
    pointInspector.selectFirstTab = function () {
        var $nav = $('.nav'),
            $subNav = $nav.find('li>ul'),
            $parentItem = $subNav.parent().children('span'),
            $back = $subNav.find('.back'),
            $tab = $nav.find('li').not($parentItem.parent()).not($back).not('.header');

        $tab.first().trigger('click');
    };

    //point viewmodel
    function Point(data) {
        var self = this,
            options = {
                extend: {
                    '{root}': {
                        map: function (point) {
                            for (var i in point) {
                                options.shared.mapValueType(point[i]);
                            }
                            return point;
                        },
                        unmap: function (point) {
                            for (var i in point) {
                                options.shared.unmapValueType(point[i]);
                            }
                            return point;
                        }
                    }
                },
                shared: {
                    mapValueType: function (item) {
                        return item;
                    },
                    unmapValueType: function (item) {
                        return item;
                    },
                    extendArrayValue: {
                        map: function (value) {
                            return ko.observable(value);
                        },
                        unmap: function (value) {
                            return value();
                        }
                    }
                },
                custom: {
                    'ValueOptions': {
                        map: function (options) {
                            var mapped = ko.observableArray(pointInspector.utility.enumToArray(options));
                            return mapped;
                        },
                        unmap: function (options) {
                            var unmapped = pointInspector.utility.arrayToValueOptions(options());
                            return unmapped;
                        }
                    },
                    '{root}.Occupancy Schedule[i]': {
                        map: function (schedule) {
                            var _schedule = ko.viewmodel.toModel(schedule);
                            _schedule.Enable = ko.observable(_schedule.Enable);
                            _schedule['Occupancy Begin Time'] = {
                                Value: ko.observable(_schedule['Occupancy Begin Time']),
                                isDisplayable: ko.observable(true),
                                ValueType: ko.observable(17)
                            };
                            _schedule['Occupancy End Time'] = {
                                Value: ko.observable(_schedule['Occupancy End Time']),
                                isDisplayable: ko.observable(true),
                                ValueType: ko.observable(17)
                            };
                            return _schedule;
                        },
                        unmap: function (schedule) {
                            // Workaround for a really strange bug where this routine was being called for the
                            // 'Lead Time' property, located on the Occupancy Schedule tab of the Optimum Start
                            // point. Make sure this really is an occupancy schedule entry before unampping
                            if (typeof schedule.Enable === 'function') {
                                schedule.Enable = schedule.Enable();
                                schedule['Occupancy Begin Time'] = schedule['Occupancy Begin Time'].Value();
                                schedule['Occupancy End Time'] = schedule['Occupancy End Time'].Value();
                            }
                            return schedule;
                        }
                    },
                    '{root}.Boolean Registers[i]': 'extendArrayValue',
                    '{root}.Integer Registers[i]': 'extendArrayValue',
                    '{root}.Real Registers[i]': 'extendArrayValue'
                }
            };

        self.controls = {
            'Device Time': {
                commandTX: {
                    'Command Type': 1,
                    upi: ''
                },
                commandRX: {
                    value: ko.observable(),
                    error: ko.observable()
                }
            },
            'Device Initialize': {
                commandTX: {
                    'Command Type': 2,
                    upi: '',
                    state: 1
                },
                commandRX: {
                    value: ko.observable(),
                    error: ko.observable()
                }
            },
            'Command Point': {
                commandTX: {
                    'Command Type': 7,
                    upi: '',
                    Value: '',
                    Controller: '',
                    Relinquish: '',
                    Priority: '',
                    Wait: ''
                },
                commandRX: {
                    value: ko.observable(),
                    error: ko.observable()
                }
            },
            'Present Value': {
                commandTX: {
                    'Command Type': 5,
                    upi: ''
                },
                commandRX: {
                    value: ko.observable(),
                    error: ko.observable()
                }
            },
            'Control Array': {
                commandTX: {
                    'Command Type': 3,
                    upi: ''
                },
                commandRX: {
                    value: ko.observable(),
                    error: ko.observable()
                }
            },
            'Control Log': {
                commandTX: {
                    'Command Type': 8,
                    upi: ''
                },
                commandRX: {
                    value: ko.observable(),
                    error: ko.observable()
                }
            },
            'Trend Data': {
                commandTX: {
                    'Command Type': 4,
                    upi: ''
                },
                commandRX: {
                    value: ko.observable(),
                    error: ko.observable()
                }
            },
            'Network Info': {
                commandTX: {
                    'Command Type': 15,
                    upi: ''
                },
                commandRX: {
                    value: ko.observable(),
                    error: ko.observable()
                }
            }
        };
        self.issueCommand = function (commandType, data, callback) {
            var command = self.controls[commandType];
            ko.utils.extend(command.commandTX, data);
            pointInspector.socket.emit('fieldCommand', ko.toJSON(command.commandTX));
            pointInspector.socket.once('returnFromField', function (data) {
                // data = $.parseJSON(data);
                if (data.err) {
                    command.commandRX.value('');
                    command.commandRX.error(data.err);
                } else {
                    command.commandRX.error('');
                    // TODO Remove temporary workaround for returned data schema inconsistency (remove after CPP_API update)
                    // command.commandRX.value(data[commandType]);
                    command.commandRX.value(data[commandType] || data);
                }
                if (typeof callback === 'function') {
                    callback.call(undefined, command.commandRX);
                }
            });
        };

        self.originalData = data;
        self.data = ko.viewmodel.fromModel(data, options);
        //throttle point refs for model switch when toggling edit mode
        self.data['Point Refs'].extend({
            rateLimit: {
                timeout: 500,
                method: 'notifyWhenChangesStop'
            }
        });
        self.status = ko.observable('saved'); // Options: saved, saving, error
        self.save = function (data) {
            // We won't execute this routine if either of the following is true:
            // 1. We're already saving the point, or
            // 2. formatPoint returned an error less than 1 second ago. We do this because the user could
            //    have been editing a property, set it to an invalid value, then clicked save. The save
            //    action will almost immediately replace the error message associated with the invalid property
            //    value.
            if (self.status() === 'saving' || ((new Date().getTime() - formatPointErrorTimestamp) < 1000)) {
                return;
            }
            var newPointData = ko.viewmodel.toModel(self.data),
                emitData = {
                    newPoint: newPointData,
                    oldPoint: self.originalData
                },
                emitString = 'updatePoint',
                close,
                finishSave = (updatedPoint) => {
                    // Update our originalData with rxData received from the server
                    self.originalData = ko.viewmodel.toModel(updatedPoint);
                    // Update our viewmodel with the new originalData
                    pointInspector.updateObject(pointInspector.point.data, self.originalData);
                    // Update our status
                    self.status('saved');

                    // ko doesn't know how to handle removed properties
                    if (pointInspector.point.data.hasOwnProperty('id')) {
                        delete pointInspector.point.data.id;
                    }

                    dtiUtility.updateUPI(updatedPoint._id);

                    if (data.exitEditModeOnSave) {
                        pointInspector.isInEditMode(false);
                    }
                };

            if (!!window.attach && typeof window.attach.saveCallback === 'function') {
                window.attach.saveCallback.call(undefined, emitData);
            }

            $('body').css('overflow', 'hidden');
            data = data || {};

            if (newPointData._pStatus === pointInspector.utility.config.Enums['Point Statuses'].Inactive.enum) {
                emitString = 'addPoint';
                emitData = [{
                    newPoint: newPointData,
                    oldPoint: self.originalData
                }];
            } else if (newPointData._pStatus === pointInspector.utility.config.Enums['Point Statuses'].Active.enum) {
                for (var prop in newPointData) {
                    if (newPointData[prop].hasOwnProperty('ValueOptions') && Array.isArray(newPointData[prop].ValueOptions)) {
                        newPointData[prop].ValueOptions = pointInspector.utility.arrayToValueOptions(newPointData[prop].ValueOptions);
                    }
                }
            }

            if (data.baseComponent === 'pt-slideshow') { // clean up any removed slides
                var i,
                    pointRefs = emitData.newPoint['Point Refs'],
                    len = pointRefs.length,
                    currentPointRef,
                    slides = emitData.newPoint.Slides,
                    slide,
                    displayId,
                    getSlideIndexById = function (id) {
                        for (var j = 0; j < slides.length; j++) {
                            if (slides[j].display === id) {
                                return j;
                            }
                        }
                        return null;
                    },
                    reorderDataSets = function () {
                        for (var i = 0; i < pointRefs.length; i++) {
                            pointRefs[i].AppIndex = i + 1;
                            displayId = pointRefs[i].Value;
                            slide = slides[getSlideIndexById(pointRefs[i].PointInst)];
                            if (slide) {
                                slide.order = i;
                                slide.pointRefIndex = pointRefs[i].AppIndex;
                            }
                        }
                    };

                for (i = (len - 1); i >= 0; i--) {
                    currentPointRef = pointRefs[i];
                    if (currentPointRef) {
                        if (currentPointRef.PointName === '' && currentPointRef.Value === 0) {
                            slides.splice(getSlideIndexById(currentPointRef.PointInst), 1);
                            pointRefs.splice(i, 1);
                        }
                    }
                }

                reorderDataSets();
            }

            ko.utils.extend(emitData, data.extendData);

            self.status('saving');
            if (pointInspector.isGplEdit) {
                finishSave(newPointData);

                if (data.saveAndClose) {
                    dtiUtility.toast({
                        msg: 'GPL point updated',
                        duration: 4000
                    });
                    return dtiUtility.closeWindow();
                }
            } else {
                pointInspector.socket.emit(emitString, emitData);
                pointInspector.socket.once('pointUpdated', function (rxData) {
                    var hideAfter = 3000,
                        bgColor,
                        dismissText,
                        msg;

                    if (rxData.message && rxData.message === 'success') {
                        msg = 'Point was successfully saved.';
                        let point;
                        if (rxData.hasOwnProperty('points')) {
                            point = rxData.points[0];
                        } else {
                            point = rxData.point;
                        }
                        finishSave(point);
                    } else {
                        if (typeof rxData.err === 'string') {
                            msg = 'Error: ' + rxData.err;
                        } else {
                            msg = 'An unexpected error occurred.';
                        }
                        hideAfter = null;
                        bgColor = '#D50000';
                        dismissText = 'OK';
                        self.status('error');
                    }
                    close = (data.saveAndClose && !rxData.err);

                    if (!close) {
                        bannerJS.showBanner(msg, dismissText, hideAfter, bgColor, close);
                        $('body').css('overflow', 'auto');
                    } else {
                        dtiUtility.toast({
                            msg: 'Point saved',
                            duration: 4000
                        });
                        return dtiUtility.closeWindow();
                    }
                });
            }
        };
        self.saveAndClose = function (data) {
            data.saveAndClose = true;
            self.save(data);
        };
    }

    function getData(id) {
        return $.ajax({
            url: pointInspector.apiEndpoint + 'points/' + id,
            contentType: 'application/json',
            dataType: 'json',
            type: 'get'
        });
    }

    function initialize(data) {
        var condition = '.permissionDenied',
            $noAccess = $('.noAccess'),
            pointStatuses = pointInspector.utility.config.Enums['Point Statuses'],
            pointInactive = (data._pStatus === pointStatuses.Inactive.enum),
            denyAccess = false;
        //check security
        if (!!data.err) {
            if (data.err.toLowerCase() === 'permission denied') {
                condition = '.permissionDenied';
            }
            denyAccess = true;
        }
        if (!denyAccess && !!data.message) {
            if (data.message.toLowerCase() === 'no point found') {
                condition = '.pointNotFound';
            }
            denyAccess = true;
        }
        // Allow access if point is inactive #180
        if (!denyAccess && !pointInactive && !pointInspector.authorize(data, pointInspector.permissionLevels.READ)) {
            denyAccess = true;
        }
        if (denyAccess) {
            $noAccess.show().find(condition).show();
            pointInspector.initDOM();
            return;
        }
        // Automatically enable edit mode if point is inactive (#180) OR if user has sufficient access & point is not deleted
        if (pointInactive || (pointInspector.authorize(data, pointInspector.permissionLevels.WRITE) && (data._pStatus !== pointStatuses.Deleted.enum))) {
            pointInspector.isInEditMode(true);
        }

        pointInspector.point = new Point(data);
        // console.log("- - - - - -    pointInspector.point.data.name1() = " + pointInspector.point.data.name1());
        pointInspector.socket = io.connect(window.location.origin);
        $('.wrapper').show(400, function () {
            // Show animation complete
            // On slower machines the UI gets really choppy if applying multiple animations @ the same time
            // Delay the bannerJS animation for another 500ms to let things settle down
            window.setTimeout(function () {
                if (data._pStatus === pointStatuses.Deleted.enum) {
                    bannerJS.showBanner({
                        msg: 'This point has been deleted. Click the restore button to undelete it.',
                        color: 'black',
                        dismissText: 'Dismiss'
                    });
                }
            }, 500);
        });
        //choose our base component
        pointInspector.baseComponent = ['pt-', data['Point Type'].Value.toLowerCase().replace(' ', '')].join('');
        // Start the application
        ko.applyBindings(pointInspector);
        window.document.title = pointInspector.point.data.path();
    }

    /*
     * Global Knockout bindings and functions
     */
    ko.utils.unwrapProperties = function (wrappedProperties) {
        if (wrappedProperties === null || typeof wrappedProperties !== 'object') {
            return wrappedProperties;
        }

        var options = {};

        ko.utils.objectForEach(wrappedProperties, function (propertyName, propertyValue) {
            options[propertyName] = ko.unwrap(propertyValue);
        });

        return options;
    };

    ko.bindingHandlers.tooltip = {
        init: function (element) {
            var $element = $(element);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                if ($element.data('bs.tooltip')) {
                    $element.tooltip('destroy');
                }
            });
        },
        update: function (element, valueAccessor) {
            var $element = $(element),
                value = ko.unwrap(valueAccessor()),
                options = ko.utils.unwrapProperties(value),
                tooltipData = $element.data('bs.tooltip'),
                defaults = {
                    delay: {
                        show: 500,
                        hide: 100
                    }
                };
            //define some defaults
            ko.utils.extend(defaults, options);
            if (!tooltipData) {
                $element.tooltip(defaults);
            } else {
                ko.utils.extend(tooltipData.options, defaults);
            }
        }
    };

    ko.bindingHandlers.modal = {
        init: function (element, valueAccessor) {
            var value = valueAccessor();

            $(element).modal({
                show: false
            });
            if (typeof value === 'function') {
                $(element).on('hide.bs.modal', function () {
                    value(false);
                });
            }
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                // $(element).modal("destroy"); // Destory was deprecated in bootstrap v3+
                $(element).data('bs.modal', null);
            });
        },
        update: function (element, valueAccessor) {
            var value = valueAccessor();
            if (ko.utils.unwrapObservable(value)) {
                $(element).modal('show');
            } else {
                $(element).modal('hide');
            }
        }
    };

    ko.bindingHandlers.formattedNumericText = {
        update: function (element, valueAccessor, allBindingsAccessor) {
            var utility = pointInspector.utility,
                $element = $(element),
                value = valueAccessor(),
                context = ko.contextFor(element),
                valueType = context.$data.valueType || allBindingsAccessor().valueType,
                formattedValue = utility.formatNumber(value(), valueType()),
                formattedLength = formattedValue.length,
                fontSize;
            if (formattedLength >= 17) {
                fontSize = 16;
            } else if (formattedLength >= 12) {
                fontSize = 22;
            } else if (formattedLength > 8) {
                fontSize = 36;
            }

            if (!!fontSize) {
                $element.css({
                    'font-size': fontSize + 'px'
                });
            } else if ($element.attr('style')) {
                $element.attr('style', function (i, style) {
                    return style.replace(/font-size[^;]+;?/g, '');
                });
            }

            $element.html(formattedValue);
        }
    };

    ko.bindingHandlers.numeric = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var utility = pointInspector.utility,
                valueTypeEnums = utility.config.Enums['Value Types'],
                $element = $(element),
                underlyingObservable = valueAccessor(),
                valueType = ko.unwrap(allBindingsAccessor().valueType),
                noTruncate = allBindingsAccessor().noTruncate,
                noComma = allBindingsAccessor().noComma,
                min = allBindingsAccessor().min,
                max = allBindingsAccessor().max,
                doValidate = allBindingsAccessor().doValidate,
                noConfigValidation = ko.unwrap(allBindingsAccessor().noValidation),
                method,
                interceptor = ko.computed({
                    read: function () {
                        var val,
                            valIsPureNumber,
                            valueType;

                        if (underlyingObservable.peek() !== undefined) {
                            val = ko.unwrap(underlyingObservable());
                            valIsPureNumber = /^([0-9]*)$/.test(val);

                            // SCADA IO device type added support for AI channel numbers that are numeric entry OR drop down selection,
                            // determined by another property selection (up to the point of this comment, the 'Channel' property was
                            // always a numeric input). Dynamically changing this property to a drop-down was causing this numeric binding
                            // to throw errors because the drop-down values are not numbers. So we'll check the value type and value
                            // before calling formatNumber...

                            if (valueType === valueTypeEnums.Enum.enum) {
                                return val;
                            } else if ((valueType === valueTypeEnums.Unsigned.enum) && !valIsPureNumber) {
                                return min;
                            }
                        } else if ($element.is(':focus') && $element.is('input')) {
                            return ko.unwrap(underlyingObservable);
                        }
                        return utility.formatNumber(ko.unwrap(underlyingObservable), valueType, noTruncate, noComma);
                    },
                    write: function (value) {
                        var newValue = value,
                            oldValue = ko.unwrap(underlyingObservable);
                        // apply logic to enforce precision for floats
                        if (valueType === 1) {
                            //newValue = new Big(newValue).toPrecision(36);
                        }
                        // and min and max
                        // don't check for key enter
                        if (method !== 'key') {
                            if ((typeof min !== 'undefined' && newValue < ko.unwrap(min)) ||
                                (typeof max !== 'undefined' && newValue > ko.unwrap(max))) {
                                newValue = oldValue;
                            }
                        }
                        if (!isNaN(newValue)) {
                            underlyingObservable(newValue);
                        } else {
                            underlyingObservable('');
                        }
                        underlyingObservable.valueHasMutated();
                    }
                }).extend({
                    notify: 'always'
                });

            if ($element.is('input')) {
                ko.applyBindingsToNode(element, {
                    value: interceptor
                });
            } else {
                ko.applyBindingsToNode(element, {
                    text: interceptor
                });
            }
            $element
                .on('keydown', function (event) {
                    var cursorPosition = utility.getSelectionStart($element[0]),
                        currentValue = $element.val(),
                        hasDecimal = /\./g.test(currentValue),
                        hasE = /[Ee]/g.test(currentValue),
                        keyCode = event.keyCode,
                        allow = false,
                        allowSign = function () {
                            if (cursorPosition === 0) {
                                // Allow if our number doesn't already begin with a sign
                                return !/^[\+-]/g.test(currentValue);
                            }
                            // Allow if previous character is 'e' or 'E' and next character is NOT '+' or '-'
                            return (/^[eE]$|^[eE][^\+-]/g).test(currentValue.substring(cursorPosition - 1, cursorPosition + 1));
                        };
                    method = 'key';

                    switch (keyCode) {
                        case 46: // delete
                        case 8: // Backspace
                        case 9: // tab
                        case 27: // escape
                        case 13: // enter
                        case 36: // Home
                        case 35: // end
                        case 37: // left
                        case 39: // right
                            allow = true;
                            break;
                            // 'a'
                        case 65:
                            if (event.ctrlKey) {
                                allow = true;
                            }
                            break;
                            // '.'
                        case 190:
                        case 110:
                            // Float number without decimal and doesn't have an 'e' or 'E' left of the cursor position
                            if (valueType === 1 && !hasDecimal && !/[eE]/g.test(currentValue.substring(0, cursorPosition))) {
                                allow = true;
                            }
                            break;
                            // '-'
                        case 109:
                        case 189:
                            if (valueType !== 4) {
                                allow = allowSign();
                            }
                            break;
                            // '+'
                        case 187:
                        case 107:
                            allow = allowSign();
                            break;
                            // 'e'
                        case 69:
                            if (!hasE && cursorPosition !== 0) {
                                allow = true;
                            }
                            break;

                        default:
                            break;
                    }

                    if (!allow) {
                        // Ensure that it is a number and stop the keypress
                        if (event.shiftKey || (keyCode < 48 || keyCode > 57) && (keyCode < 96 || keyCode > 105)) {
                            event.preventDefault();
                            event.stopImmediatePropagation();
                        }
                        // if it's an up or down arrow, increment or decrement
                        if (keyCode === 38) {
                            method = 'arrow';
                            $element.trigger('mousewheel', {
                                deltaY: 1
                            });
                        }
                        if (keyCode === 40) {
                            method = 'arrow';
                            $element.trigger('mousewheel', {
                                deltaY: -1
                            });
                        }
                    }
                })
                .on('mousewheel', function (event, trigger) {
                    var cursorPosition = utility.getSelectionStart($element[0]),
                        currentValue = this.value,
                        decimalPosition = currentValue.indexOf('.'),
                        hasDecimal = !!~decimalPosition,
                        decimalPlaces = hasDecimal ? currentValue.length - decimalPosition - 1 : 0,
                        divisor = 1,
                        selectionStart = 0,
                        selectionEnd = currentValue.length;

                    if ($.trim(currentValue) === '' || isNaN(currentValue)) {
                        return;
                    }

                    if (typeof trigger.deltaY === 'number') {
                        event = trigger;
                        method = 'arrow';
                    } else {
                        method = 'wheel';
                    }
                    if (!$element.is(':focus')) {
                        return;
                    }
                    !!event.preventDefault && event.preventDefault();

                    // if value type is float, we will check the position of the decimal and
                    // increment/decrement accordingly
                    if (hasDecimal && cursorPosition > decimalPosition) {
                        divisor = Math.pow(10, decimalPlaces);
                        selectionStart = decimalPosition + 1;
                        selectionEnd = currentValue.length;
                    } else {
                        selectionStart = 0;
                        selectionEnd = hasDecimal ? decimalPosition : currentValue.length;
                    }
                    $element.val(new Big(currentValue).plus(event.deltaY / divisor).toFixed(decimalPlaces)).trigger('change');
                    utility.createSelection($element[0], selectionStart, selectionEnd);
                })
                .on('click', function (event) {
                    var cursorPosition = utility.getSelectionStart($element[0]),
                        currentValue = $element.val(),
                        decimalPosition = currentValue.indexOf('.'),
                        hasDecimal = !!~decimalPosition,
                        selectionStart = 0,
                        selectionEnd = currentValue.length;
                    if (hasDecimal) {
                        if (cursorPosition > decimalPosition) {
                            selectionStart = decimalPosition + 1;
                            selectionEnd = currentValue.length;
                        } else {
                            selectionStart = 0;
                            selectionEnd = decimalPosition;
                        }
                    }
                    utility.createSelection($element[0], selectionStart, selectionEnd);
                })
                .on('focus', function () {
                    $element.val(utility.normalizeNumber($element.val(), valueType));
                })
                .on('focusout', function () {
                    underlyingObservable(parseFloat(underlyingObservable()));
                    if (!!noConfigValidation) {
                        return;
                    }
                    if (doValidate) {
                        $(document).triggerHandler({
                            type: 'viewmodelChange',
                            targetElement: $element,
                            property: allBindingsAccessor().propertyName,
                            refPoint: null
                        });
                    }
                })
                .on('blur', function () {
                    if ($element.val() === underlyingObservable()) {
                        $element.val(utility.formatNumber($element.val(), valueType));
                    }
                });
        }
    };

    ko.bindingHandlers.validateOnBlur = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var subscription,
                context = {
                    $element: $(element),
                    property: valueAccessor()
                };

            subscription = allBindingsAccessor().value.subscribe(function (value) {
                $(document).triggerHandler({
                    type: 'viewmodelChange',
                    targetElement: this.$element,
                    property: this.property,
                    refPoint: null
                });
            }, context);

            // Dispose our subscription after this element is removed
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                subscription.dispose();
            });
        }
    };

    ko.bindingHandlers.protectedText = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var val = valueAccessor(),
                $element = $(element),
                $message = $('.invalidCharMsg'),
                $badChar = $message.find('.invalidChar'),
                offset = $element.offset(),
                height = $element.outerHeight(),
                messageTop = offset.top + height + 3,
                messageLeft = offset.left,
                messageWidth = $element.outerWidth(),
                config = pointInspector.utility.config;

            $element.val(val());
            $element
                .on('keypress', function (event) {
                    var _char = String.fromCharCode(event.which);
                    if (config.Utility.isPointNameCharacterLegal(_char) === false) {
                        $message.css({
                            opacity: 1,
                            top: messageTop,
                            left: messageLeft,
                            width: messageWidth
                        });
                        $badChar.text(_char);
                        $message.stop().show();
                        dtiUtility.playAudio({
                            sound: 'beep'
                        });

                        event.preventDefault();
                        event.stopImmediatePropagation();

                        $element.blur();
                    }
                })
                .on('blur', function () {
                    if (val() !== $element.val()) {
                        // Update observable
                        val($element.val());
                        // Trigger viewModelChange
                        $(document).triggerHandler({
                            type: 'viewmodelChange',
                            targetElement: $element,
                            property: allBindingsAccessor().propertyName,
                            refPoint: null
                        });
                    }
                })
                .on('focus', function () {
                    $message.fadeOut(400);
                });
        }
    };
});
