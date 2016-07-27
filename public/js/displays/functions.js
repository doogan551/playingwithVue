var displays = window.displays || {};

var ActionButton = function(config) {
    var codes = [{
            text: 'No Action (useless)'
        }, {
            text: 'History Log Plot – No longer supported'
        }, {
            text: 'History Log Report'
        }, {
            text: 'History Log Export'
        }, {
            text: 'Totalizer Plot'
        }, {
            text: 'Totalizer Report'
        }, {
            text: 'Totalizer Export'
        }, {
            text: 'MultiState Value Command',
            pointType: 'MultiState Value'
        }, {
            text: 'Program Start'
        }, {
            text: 'Analog Output Command',
            pointType: 'Analog Output'
        }, {
            text: 'Analog Value Command',
            pointType: 'Analog Value'
        }, {
            text: 'Binary Output Command',
            pointType: 'Binary Output'
        }, {
            text: 'Binary Value Command',
            pointType: 'Binary Value'
        }, {
            text: 'Report Display'
        }, {
            text: 'Verification Report'
        }, {
            text: 'Browse Verify Reports'
        }, {
            text: 'Data Report'
        }],
        actions = {
            'MultiState Value': {},
            'Analog Output': {},
            'Analog Value': {},
            'Binary Output': {},
            'Binary Value': {}
        },
        parameters = [{
            text: 'None'
        }, {
            text: 'This Hour'
        }, {
            text: 'Last Hour'
        }, {
            text: 'Today'
        }, {
            text: 'Yesterday'
        }, {
            text: 'This Week'
        }, {
            text: 'Last Week'
        }, {
            text: 'This Month'
        }, {
            text: 'Last Month'
        }, {
            text: 'This Year'
        }, {
            text: 'Last Year'
        }, {
            text: 'Select Time'
        }, {
            text: 'Last 24 Hours'
        }, {
            text: 'Last 7 Days'
        }, {
            text: 'Select Interval'
        }, {
            text: 'Display'
        }, {
            text: 'Print'
        }],

        _commandArguments = {
            'Command Type': 7,
            upi: '',
            Value: '',
            Controller: displays.workspaceManager.user().controllerId,
            Relinquish: 0,
            Priority: '',
            Wait: 0,
            OvrTime: 0
        },
        _id,
        _pointData,
        _code,
        noPointFound,

        min = 0,
        max = 10,
        external,

        _getCommandArguments = function() {
            var ret = $.extend(true, {}, _commandArguments),
                val = external.ActionParm;

            if (typeof val === 'object') {
                val = val.value;
            }

            ret.upi = external.ActionPoint;
            ret.Value = val;
            ret.logData.newValue.Value = val;
            ret.Priority = external.ActionPriority;

            return ret;
        },
        _processPointData = function(response) {
            var transformOptions = function() {
                var options = response.Value.ValueOptions,
                    ret = [];

                for (var option in options) {
                    ret.push({
                        name: option,
                        value: options[option]
                    });
                }

                if (external.ActionParm === undefined) {
                    external.ActionParm = ret[0].value;
                }

                return ret;
            };
            _pointData = response;

            if (response.message !== 'No Point Found') {
                noPointFound = false;
                external.ActionPoint = response._id;
                config.ActionPoint = response._id;
                // config.upi = response._id;
                _validateOptions('upi');

                displays.upiNames[response._id] = response.Name;

                _commandArguments.logData = {
                    user: displays.workspaceManager.user(),
                    point: {
                        _id: _pointData._id,
                        Security: _pointData.Security,
                        Name: _pointData.Name,
                        name1: _pointData.name1,
                        name2: _pointData.name2,
                        name3: _pointData.name3,
                        name4: _pointData.name4,
                        "Point Type": {
                            eValue: _pointData["Point Type"].eValue
                        }
                    },
                    newValue: {
                        Value: ''
                    }
                };

                if (_pointData['Minimum Value']) {
                    external.min = _pointData['Minimum Value'].Value;
                    external.max = _pointData['Maximum Value'].Value;
                }

                if (_pointData['Point Type'].Value.match('Binary')) {
                    external.isBinary = true;
                    external.options = transformOptions();
                }

                if (_pointData['Point Type'].Value.match('MultiState')) {
                    external.isMultistate = true;
                    external.options = transformOptions();
                }

                if (_pointData['Point Type'].Value.match('Report')) {
                    external.isReport = true;
                    external.reportType = _pointData['Report Type'].Value;
                    external.isProperty = external.reportType === 'Property';
                }

                if (displays.editMode) {
                    setTimeout(function() {
                        displays.EditItemCtrl.$apply();
                    }, 1);
                }
            } else {
                noPointFound = true;

                _pointData = {
                    Name: 'No Point Found'
                };

                _commandArguments.logData = {
                    newValue: {
                        Value: ''
                    }
                };
            }
        },
        _getPointData = function(upi) {
            if (!isNaN(upi)) {
                $.ajax({
                    url: '/api/points/' + upi
                }).done(function(response) {
                    _processPointData(response);
                });
            }
        },
        _validateOptions = function(arg) {
            var pointType = _code.pointType;

            if (pointType && pointType !== _pointData['Point Type']) {
                //invalid point type/code combo
                //update UI, if 'upi', else 'command'
            }
        },
        _sendCommand = function() {
            console.log('Send Command', _getCommandArguments());
            displays.socket.emit('fieldCommand', JSON.stringify(_getCommandArguments()));
            displays.$scope.currActionButton = null;
        },

        sendValue = function(value) {
            external.ActionParm = value;
            _sendCommand();
        },
        getExternalConfig = function(cfg) {
            var ccfg = {
                    intervalNum: 1,
                    intervalType: 'Minute',
                    timestamp: '08:00',
                    durationInfo: {
                        duration: 86399,
                        selectedRange: 'Today',
                        endDate: moment().endOf('d'),
                        startDate: moment().startOf('d')
                    }
                },
                externalReportConfig = {
                    startDate: cfg.durationInfo.startDate,
                    endDate: cfg.durationInfo.endDate,
                    startTimeOffSet: cfg.starttimestamp,
                    endTimeOffSet: cfg.endtimestamp,
                    duration: cfg.durationInfo.duration,
                    selectedRange: cfg.durationInfo.selectedRange,
                    interval: {
                        text: cfg.intervalType,
                        value: cfg.intervalNum
                    }
                };

            return externalReportConfig;
        },
        openReport = function(cfg) { //type, duration, start, end) {
            var endPoint,
                params = cfg && getExternalConfig(cfg);

            $('#reportChooseRange').modal('hide');

            endPoint = displays.workspaceManager.config.Utility.pointTypes.getUIEndpoint('Report', external.ActionPoint);
            displays.openWindow(endPoint.review.url + '?pause', _pointData['Name'], 'Report', '', external.ActionPoint, {
                width: 1250,
                height: 750,
                callback: function() {
                    if (!external.isProperty) {
                        this.applyBindings(params);
                    } else {
                        this.applyBindings(true);
                    }
                }
            });

        },
        updateReportConfig = function(rConfig) {
            config.reportConfig = $.extend(true, {}, rConfig);
            $('#reportChooseRange').modal('hide');
        },
        sendCommand = function() {
            if (!noPointFound) {
                var pointType = _pointData['Point Type'].Value;

                if (pointType.match('Analog')) {
                    $('#actionButtonInput').popup('open');
                    $('#actionButtonValue').attr({
                        min: external.min,
                        max: external.max
                    });
                } else if (pointType === 'Report') {
                    displays.setReportConfig(config.reportConfig);
                    if (displays.editMode) {
                        $('#reportChooseRange').modal('show');
                    } else {
                        // displays.$scope.$apply();
                        if (!external.isProperty) {
                            if (config.confirmRange) {
                                $('#reportChooseRange').modal('show');
                            } else {
                                openReport(config.reportConfig);
                            }
                        } else {
                            openReport();
                        }
                    }
                    // $('#actionButtonReportInput').popup('open');
                } else {
                    _sendCommand();
                }
            }
        },
        setCommand = function(idx) {
            _code = codes[idx];
            _validateOptions('command');
        },
        setParameter = function(parameter) {
            external.ActionParm = parameter;
        },
        getPointData = function() {
            return _pointData;
        },
        updateConfig = function(newCfg, fromPointSelect) {
            _code = newCfg.ActionCode;
            if (newCfg.ActionParm !== undefined) {
                external.ActionParm = newCfg.ActionParm;
            }
            if (fromPointSelect) {
                if (external.ActionPoint !== newCfg.upi) {
                    _getPointData(newCfg.upi);
                }
            } else {
                if (external.ActionPoint !== newCfg.ActionPoint) {
                    _getPointData(newCfg.ActionPoint);
                }
            }
            _commandArguments.Priority = newCfg.ActionPriority;
            external.ActionPriority = displays.workspaceManager.systemEnums.controlpriorities[+config.ActionPriority || 0].value;

            config.reportConfig = newCfg.reportConfig || config.reportConfig || $.extend(true, {}, displays.defaultReportConfig);
            config.confirmRange = config.confirmRange || false;

            if (typeof config.reportConfig.durationInfo.endDate === 'string') {
                config.reportConfig.durationInfo.endDate = moment(config.reportConfig.durationInfo.endDate);
                config.reportConfig.durationInfo.startDate = moment(config.reportConfig.durationInfo.startDate);
            }
        },
        setUPI = function(upi) {
            external.ActionPoint = upi;
            _getPointData(upi);
        };

    // if (config.ActionPoint === undefined || config.ActionPoint === 'none' || config.upi !== undefined) {
    //     config.ActionPoint = config.upi;
    // }

    _id = displays.actionButtonCount++;

    external = {
        id: _id,
        setUPI: setUPI,
        setCommand: setCommand,
        setParameter: setParameter,
        getPointData: getPointData,
        updateConfig: updateConfig,
        sendCommand: sendCommand,
        sendValue: sendValue,
        openReport: openReport,
        updateReportConfig: updateReportConfig,
        _getCommandArguments: _getCommandArguments,
        ActionPoint: null,
        min: min,
        max: max,
        ActionPriority: null,
        isBinary: false,
        isMultistate: false,
        isReport: false,
        ActionParm: (config.ActionParm !== undefined) ? parseFloat(config.ActionParm) : config.ActionParm
    };

    updateConfig(config);

    return external;
};

displays.DisplayAnimation = function(el, screenObject) {
    var self = this,
        frame,
        baseUrl = '/displays/gifs/',
        element = el,
        elementId = element.attr('id'),
        origConfig = $.extend(true, {}, screenObject),

        precision = parseFloat(screenObject.Precision || 1),
        file = origConfig['Animation File'],
        img = file,
        upi = origConfig.upi,
        pointType = displays.pointTypes[upi],
        valueType = displays.pointTypeList[pointType],
        animationID = origConfig['Animation ID'],

        stateList = ['Off', 'On', 'OffAlarm', 'OnAlarm', 'Fault'],

        animTypeLookup = {
            'onoff': 0,
            'frame': 1,
            'multifile': 2
        },

        animFileLookup = (function() {
            var c,
                len = stateList.length,
                ret = {};

            for (c = 0; c < len; c++) {
                ret[c] = stateList[c];
                ret[stateList[c]] = c;
            }

            return ret;
            // }
            // 0: 'Off',
            // 1: 'On',
            // 2: 'OffAlarm',
            // 3: 'OnAlarm',
            // 4: 'Fault',
            // 'Off': 0,
            // 'On': 1,
            // 'OffAlarm': 2,
            // 'OnAlarm': 3,
            // 'Fault': 4
        }()),
        animTypes = {
            0: {
                type: 'onoff',
                handler: function(val) {
                    return (val > 0) ? '' : 0;
                }
            },
            1: {
                type: 'frame',
                handler: function(val) {
                    var retVal = parseInt(val / precision, 10);

                    return retVal;
                }
            },
            2: {
                type: 'multifile',
                handler: function(val) {
                    var animation = displays.animationIDs[animationID] || {},
                        animationFile = animation[val];

                    if (origConfig._v2 === true) {
                        img = origConfig[animFileLookup[val] + 'State'];
                    } else {
                        img = animationFile || file;
                    }

                    return '';
                }
            }
        },
        animTypeCfg = animTypes[origConfig._animType || 0] || {},
        animType = animTypeCfg.type || 'onoff',

        animFiles = (function() {
            var animations = displays.animationIDs[animationID] || {},
                keys = Object.keys(animations),
                states = [0, 1, 2, 3, 4],
                key,
                val,
                len = keys.length,
                c,
                ret = {};

            if (origConfig._v2 === true) {
                if (animType === 'multifile') {
                    for (c = 0; c < stateList.length; c++) {
                        key = stateList[c] + 'State';
                        ret[key] = origConfig[key];
                    }
                } else {
                    ret['Animation File'] = origConfig['Animation File'];
                }
            } else {
                if (len > 1) {
                    for (c = 0; c < len; c++) {
                        key = keys[c];
                        val = animations[key];
                        ret[animFileLookup[key] + 'State'] = val;
                    }
                } else {
                    ret['Animation File'] = (animations[keys[0]]) ? animations[keys[0]] : origConfig['Animation File'];
                }
            }

            return ret;
        }()),

        update = function(dynamic) {
            var val = dynamic.Value,
                eVal = dynamic.eValue;

            if (typeof val !== 'string') {
                frame = parseInt(val / (precision || 1), 10);
            } else {
                frame = eVal;
                val = eVal;
            }

            if (self.updateHandler) {
                frame = self.updateHandler(val);
            } else {
                frame = 0;
            }

            img = img.replace('.gif', '');

            if (frame === undefined) {
                frame = '';
            }

            element.attr('src', baseUrl + img + '/' + frame);

            //console.log('updating animation:', elementId, img, val, 'frame: "' + frame + '"');
        };

    self.updateHandler = animTypeCfg.handler;

    return {
        update: update,
        animType: animType,
        animFiles: animFiles,
        updateAnimType: function(type) {
            animType = type;
            return animTypeLookup[type];
        }
    };
};

displays = $.extend(displays, {
    animations: {},
    animationConfigs: [],
    filesToUpload: {},
    zooming: false,
    panMode: false,
    panTimer: {},
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    pushPullMode: false,
    pushPullTimer: {},
    startZoom: 0,
    zoomY: 0,
    panels: false,
    moveMode: false,
    moveX: 0,
    moveY: 0,
    dpageX: 0,
    dpageY: 0,
    pageX: 0,
    pageY: 0,
    actionButtonCount: 0,
    tip: false,
    sizing: false,
    foc: false,
    popUpWindowActive: false,
    externalReportConfig: {
        startDate: moment().subtract(1, "day"),
        endDate: moment(),
        offSet: "00:00",
        duration: 0,
        selectedRange: ""
    },
    defaultReportConfig: {
        intervalNum: 1,
        intervalType: 'Day',
        starttimestamp: '00:00',
        endtimestamp: '00:00',
        durationInfo: {
            duration: 86399,
            selectedRange: 'Today',
            endDate: moment().endOf('d'),
            startDate: moment().startOf('d')
        }
    },
    actionCodes: {
        0: "No Action (useless)",
        1: "History Log Plot – No longer supported",
        2: "History Log Report",
        3: "History Log Export",
        4: "Totalizer Plot",
        5: "Totalizer Report",
        6: "Totalizer Export",
        7: "MultiState Value Command",
        8: "Program Start",
        9: "Analog Output Command",
        10: "Analog Value Command",
        11: "Binary Output Command",
        12: "Binary Value Command",
        13: "Report Display",
        14: "Verification Report",
        15: "Browse Verify Reports",
        16: "Data Report"
    },
    actionParameters: {
        0: "None",
        1: "This Hour",
        2: "Last Hour",
        3: "Today",
        4: "Yesterday",
        5: "This Week",
        6: "Last Week",
        7: "This Month",
        8: "Last Month",
        9: "This Year",
        10: "Last Year",
        11: "Select Time",
        12: "Last 24 Hours",
        13: "Last 7 Days",
        14: "Select Interval",
        15: "Display",
        16: "Print"
    },
    setReportConfig: function(config) {
        var $reportRange = $('#reportRange'),
            picker = $reportRange.data('daterangepicker');

        displays.$scope.reportConfig = $.extend(displays.$scope.reportConfig, {
            intervalNum: config.intervalNum,
            intervalType: config.intervalType,
            timestamp: config.timestamp,
            durationInfo: config.durationInfo
        });

        picker.setStartDate(config.durationInfo.startDate);
        picker.setEndDate(config.durationInfo.endDate);

        $reportRange.val(config.durationInfo.startDate.format('MM/DD/YYYY') + ' - ' + config.durationInfo.endDate.format('MM/DD/YYYY'));

        $reportRange.attr("title", config.durationInfo.selectedRange);

        $('#reportTimeStart').val(config.starttimestamp);
        $('#reportTimeEnd').val(config.endtimestamp);
    },
    resolveDisplayObjectPropertyName: function(screenObject) {
        var propertyName;
        switch (screenObject) {
            case 0:
                propertyName = "Display Dynamic";
                break;
            case 1:
                propertyName = "Display Button";
                break;
            case 2:
                propertyName = "Text Label";
                break;
            case 3:
                propertyName = "Display Animation";
                break;
            case 7:
                propertyName = "Display Trend";
                break;
        }

        return propertyName;
    },
    upiInPointRefs: function(upi) {
        var answer = false,
            i,
            pointRef,
            lenPointRefs = displayJson["Point Refs"].length;

        for (i = 0; i < lenPointRefs; i++) {
            pointRef = displayJson["Point Refs"][i];
            if (pointRef.Value === upi) {
                answer = true;
                break;
            }
        }

        return answer;
    },
    pointReferenceSoftDeleted: function(upi) {
        var answer = false,
            i,
            pointRef,
            lenPointRefs = displayJson["Point Refs"].length;

        for (i = 0; i < lenPointRefs; i++) {
            pointRef = displayJson["Point Refs"][i];
            if (pointRef.Value === upi) {
                if (pointRef.PointInst === 0) {
                    answer = true;
                }
                break;
            }
        }

        return answer;
    },
    pointReferenceHardDeleted: function(localUPI) {
        var answer = false;
        if (localUPI !== null && localUPI > 0) {
            if (displays.upiInPointRefs(localUPI)) {
                if (displays.pointReferenceSoftDeleted(localUPI)) {
                    answer = false;
                }
            } else {
                answer = true;
            }
        }
        return answer;
    },
    onRender: function(fn) {
        if (displays.isRendered) {
            fn();
        } else {
            displays.onRenderFn = fn;
        }
    },
    rendered: function() {
        displays.isRendered = true;
        displays.onRenderFn();
    },
    onRenderFn: function() {
        return;
    },
    workspaceManager: (window.opener || window.top).workspaceManager,

    initDisplay: function() {
        displayJson.Width = displayJson.Width || 800;
        displayJson.Height = displayJson.Height || 600;
    },
    initAnimations: function() {
        var c,
            list = displays.animationConfigs,
            len = list.length,
            cfg,
            id,
            el,
            row;

        displays.pointTypeList = displays.workspaceManager.config.Utility.pointTypes.getTypes();

        for (c = 0; c < len; c++) {
            row = list[c];
            id = row.id;
            cfg = row.screenObject;
            el = $('#' + id);

            displays.animations[id] = new displays.DisplayAnimation(el, cfg);
        }
    },
    processGif: function(el, val, precision, upi, dynamic) {
        var frame,
            src = el.src,
            img,
            eVal = dynamic.eValue,
            animationID,
            animationFile,
            animation;

        // console.log('Process gif:', dynamic);

        if (!src.match('displays/gifs')) { //has been rerouted to dynamic gif binding
            img = src.split('/').slice(-1)[0];
        } else {
            img = src.split('/').slice(-2)[0];
        }

        animationID = displays.animationUPIs[upi];

        if (typeof val !== 'string') {
            frame = parseInt(val / (precision || 1), 10);
        } else {
            frame = eVal;
        }

        if (animationID !== undefined) { //is multi-file
            if (typeof val === 'string') {
                val = eVal; //stateRef[val.toLowerCase()];
            }
            animation = displays.animationIDs[animationID];
            animationFile = animation[val];
            img = animationFile || img;
        }

        img = img.replace('.gif', '');

        if (frame === undefined) {
            frame = '';
        }

        // console.log('gif frame', frame);

        el.src = '/displays/gifs/' + img + '/' + frame;
    },

    initSocket: function() {
        var socket;
        if (document.location.href.match('nosocket') === null) {
            socket = displays.socket = io.connect(window.location.protocol + '//' + window.location.hostname);

            socket.on('reconnecting', function() {
                var retries = 0,
                    reconnect = function() {
                        $.ajax({
                            url: '/home'
                        }).done(function(data) {
                            displays.isReconnecting = false;
                        }).fail(function(data) {
                            retries++;
                            if (retries < 2) {
                                reconnect();
                            } else {
                                displays.isReconnecting = false;
                            }
                        });
                    };
                if (!displays.isReconnecting) {
                    displays.isReconnecting = true;
                    reconnect();
                }
            });

            socket.on('recieveUpdate', function(dynamic) {
                var els = $('.sc_ob_' + dynamic.upi),
                    el,
                    val = dynamic.dynamic.Value,
                    upi = dynamic.upi,
                    label = dynamic.dynamic['Quality Label'],
                    newVal = false,
                    parsedVal = parseFloat(val),
                    color,
                    precision,
                    tag,
                    c, len = els.length;

                for (c = 0; c < len; c++) {
                    el = $(els[c]);
                    tag = els[c].tagName.toLowerCase();
                    precision = el.data('precision') || 0;
                    precision = (precision * 10) % 10;

                    if (!isNaN(parsedVal)) {
                        val = parsedVal;
                    }

                    newVal = val;

                    //is dynamic
                    if (val !== undefined && (tag === 'div' || tag === 'img')) {
                        if (tag === 'img') { //animation
                            displays.animations[el[0].id].update(dynamic.dynamic);
                            // displays.processGif(els[c], val, el.data('precision'), upi, dynamic.dynamic);
                        } else {
                            //some can be "on" etc
                            if (typeof val !== 'string') {
                                if (precision > 0) {
                                    val = val.toFixed(precision);
                                } else {
                                    val = parseInt(val, 10);
                                }
                            }
                            if (label === 'none') {
                                color = el.data('orig-color');
                                newVal = val;
                            } else {
                                if (displays.qualityCodes) {
                                    color = displays.qualityCodes[label].color;
                                    newVal = val + ' ' + displays.qualityCodes[label].label;
                                } else {
                                    displays.qualityCodeQueue.push({
                                        el: el,
                                        code: label,
                                        val: val
                                    });
                                }
                            }
                            el.css('color', '#' + color);
                            if (newVal !== false) {
                                el.html(newVal);
                            }
                        }
                    }

                }
            });

            socket.on('connect', function() {
                var sess = {};
                sess.socketid = socket.id;
                sess.display = angular.copy(window.displayJson);
                socket.emit('displayOpen', {
                    data: sess
                });
            });


            $(window).on('unload', function() {
                socket.disconnect();
            });
        }
    },

    openWindow: function() {
        return displays.workspaceManager.openWindowPositioned.apply(this, arguments);
    },

    initScreenObjects: function(config) {
        var scope = config.$scope,
            display = scope.display,
            iterFn = config.iterFn || function() {
                return;
            },
            maxWidth = 0,
            maxHeight = 0,
            item,
            row,
            c,
            len,
            processAnimation = function(animation) {
                var animID = animation['Animation ID'],
                    state = animation.State,
                    file = animation['Animation File'],
                    lookup;

                animation['Animation File'] = file.replace('.gif', '');

                if (animation._saveHeight !== true) {
                    animation._animType = animation.Height;
                    animation._saveHeight = true;
                }

                if (animID) {
                    if (animation.upi) {
                        lookup = displays.animationUPIs[animation.upi] || [];

                        lookup.push(animID);

                        displays.animationUPIs[animation.upi] = lookup;
                    }

                    displays.animationIDs[animID] = displays.animationIDs[animID] || {};

                    if (state !== undefined) {
                        displays.animationIDs[animID][state] = file;
                    }
                }
            };

        displays.$scope = scope;
        displays.$scope.isEdit = displays.editMode;

        displays.upiNames = displays.upiNames || {};

        if (scope.objs === undefined) {
            scope.objs = [];
        }

        len = scope.objs.length;

        displays.animationIDs = {};
        displays.animationUPIs = {};

        for (c = 0; c < len; c++) {
            item = scope.objs[c];
            item.sel = false;

            if (item.Left > maxWidth) {
                maxWidth = item.Left;
            }

            if (item.Top > maxHeight) {
                maxHeight = item.Top;
            }

            item._idx = c;
            iterFn(item);

            if (item['Screen Object'] === 3 || (item['Screen Object'] === undefined && item['Animation ID'])) { //is animation
                processAnimation(item);
            }
        }

        //console.log('id', displayJson._id);

        for (c = 0; c < displayJson['Point Refs'].length; c++) {
            row = displayJson['Point Refs'][c];
            displays.upiNames[row.Value] = (row.Value !== 0 && row.PointInst === 0) ? (row.PointName + " - Deleted") : row.PointName;
        }

        if (maxWidth > display.Width) {
            displays.maxWidth = maxWidth;
        } else {
            displays.maxWidth = display.Width;
        }
        if (maxHeight > display.Height) {
            displays.maxHeight = maxHeight;
        } else {
            displays.maxHeight = display.Height;
        }

    },

    showTip: function(upi) {
        if (displays.isEdit !== true) {
            displays.tip = true;
            $('#tip').html(typeof upi === 'string' ? upi : (displays.upiNames[upi] || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'))
                .show();
        }
    },

    hideTip: function() {
        displays.tip = false;
        $('#tip').hide();
    },

    mouseEvents: function() {
        var leftMouseDown = false,
            rightMouseDown = false,
            ctrlKeyDown = false,
            $reportTimeStart = $('#reportTimeStart'),
            $reportTimeEnd = $('#reportTimeEnd'),
            timePickerKeyUp = function(event, $el) {
                if ($el.val().match(/^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/)) {
                    $el.parent().removeClass("has-error");
                    $el.parent().attr("title", "");
                    $el.clockpicker('hide');
                    $el.clockpicker('resetClock');
                    $el.clockpicker('show');
                } else {
                    $el.parent().addClass("has-error");
                    $el.parent().attr("title", "Error in time format");
                }

                displays.$scope.reportConfig.timestamp = $el.val();

                // timestamp = $reportTime.val();
            },
            timePickerKeyDown = function(event, $el) {
                var timeValue = $el.val(),
                    element = $el[0],
                    selectionLen = element.selectionEnd - element.selectionStart;
                if (characterAllowedInTimeField(event, timeValue, selectionLen)) {
                    if (event.keyCode === 38) { // up arrow
                        $el.val(incrementTime(1, timeValue));
                    } else if (event.keyCode === 40) { // down arrow
                        $el.val(incrementTime(-1, timeValue));
                    } else if (event.keyCode === 13) { // CR
                        $el.val(incrementTime(0, timeValue));
                    }
                    $el.clockpicker('hide');
                    $el.clockpicker('resetClock');
                    $el.clockpicker('show');

                    displays.$scope.reportConfig.timestamp = $el.val();
                } else {
                    event.preventDefault();
                }
            },
            incrementTime = function(incrementUnit, value) {
                var arr,
                    hrs,
                    mins,
                    timeLen = value.length,
                    wrapped = false;

                if (timeLen > 2) { // don't allow increment til 3 chars in time field
                    if (value.indexOf(":") > 0) {
                        arr = value.split(':');
                    } else {
                        arr = [];
                        if (timeLen === 5) { // step on errant text
                            arr[0] = value.substr(0, 2);
                            arr[1] = value.substr(3, 2);
                        } else {
                            arr[0] = value.substr(0, (timeLen === 4 ? 2 : 1));
                            arr[1] = value.substr(timeLen - 2, 2);
                        }
                    }
                    hrs = Number.isNaN(parseInt(arr[0], 10)) ? 0 : parseInt(arr[0], 10);
                    mins = Number.isNaN(parseInt(arr[1], 10)) ? 0 : parseInt(arr[1], 10);

                    if (hrs > 23) {
                        hrs = 23;
                    }
                    if (mins > 59) {
                        mins = 59;
                    }

                    if ((incrementUnit > 0 && mins < 59) ||
                        (incrementUnit < 0 && mins > 0)) {
                        mins += incrementUnit;
                    } else if ((incrementUnit < 0 && mins === 0)) {
                        if (hrs === 0 || hrs > 24) {
                            hrs = 24;
                        }
                        mins = 59;
                        wrapped = true;
                    } else if ((incrementUnit > 0 && mins >= 59)) {
                        if (hrs >= 23) {
                            hrs = 0;
                        }
                        mins = 0;
                        wrapped = true;
                    }

                    if (wrapped) { // the increment is wrapping
                        switch (true) {
                            case (incrementUnit > 0 && hrs < 23):
                            case (incrementUnit < 0 && hrs > 0):
                                hrs += incrementUnit;
                                break;
                        }
                    }

                    return ((hrs < 10 ? '0' : '') + hrs) + ':' + ((mins < 10 ? '0' : '') + mins);
                } else {
                    return value;
                }
            };

        $('#minDisplay').off('click').on('click', function() {
            var _title = window.displayJson.Name;
            displays.openWindow(window.location.href, _title, window.displayJson['Point Type'].Value, 'mainWindow', window.displayJson._id);
        });

        $('#maxDisplay').off('click').on('click', function() {
            var _title = window.displayJson.Name;
            // displays.openWindow(window.location.href, _title, window.displayJson['Point Type'].Value, '', window.displayJson._id, parseInt(window.displayJson.Width, 10) + 50, parseInt(window.displayJson.Height, 10) + 100);
            displays.openWindow(window.location.href, _title, window.displayJson['Point Type'].Value, '', window.displayJson._id, {
                width: parseInt(window.displayJson.Width, 10) + 50,
                height: parseInt(window.displayJson.Height, 10) + 100
            });
        });

        jQuery('#saveReport').click(function() {
            displays.$editScope.editItem._actionButton.updateReportConfig(displays.$editScope.reportConfig);
        });

        jQuery('#openReportWithConfig').click(function() {
            var actionButton = displays.$scope.currActionButton._actionButton;
            actionButton.openReport(displays.$scope.reportConfig);
            // actionButton.openReport($scope.reportType, $scope.reportDuration, $scope.reportStart, $scope.reportEnd);
        });

        $('#actionButtonInput').popup();
        $('#actionButtonReportInput').popup();

        $reportTimeStart.clockpicker({
            doneText: 'Done',
            autoclose: true,
            afterDone: function() {
                displays.$scope.reportConfig.starttimestamp = $reportTimeStart.val();
            },
        });

        $reportTimeEnd.clockpicker({
            doneText: 'Done',
            autoclose: true,
            afterDone: function() {
                displays.$scope.reportConfig.endtimestamp = $reportTimeEnd.val();
            },
        });

        // $reportTime.change(function (event) {
        //     // report time = $reportTime.val()
        // });

        $reportTimeStart.keyup(function(event) {
            timePickerKeyUp(event, $reportTimeStart);
        });

        $reportTimeEnd.keyup(function(event) {
            timePickerKeyUp(event, $reportTimeEnd);
        });

        $reportTimeStart.keydown(function(event) {
            timePickerKeyDown(event, $reportTimeStart);
        });

        $reportTimeEnd.keydown(function(event) {
            timePickerKeyDown(event, $reportTimeEnd);
        });

        $('#reportRange').daterangepicker({
            // startDate : durationInfo().startDate,
            // endDate : durationInfo().endDate,
            // maxDate: moment().add(1, 'day'),
            // chosenLabel: durationInfo().selectedRange,
            alwaysShowCalendars: true,
            autoApply: false,
            autoUpdateInput: false,
            timePicker: false,
            ranges: {
                'Today': [moment(), moment().add(1, 'day')],
                'Yesterday': [moment().subtract(1, 'days'), moment()],
                'Last 7 Days': [moment().subtract(6, 'days'), moment().add(1, 'day')],
                'Last Week': [moment().subtract(1, 'weeks').startOf('week'), moment().subtract(1, 'weeks').endOf('week').add(1, 'day')],
                'Last 4 Weeks': [moment().subtract(4, 'weeks'), moment().add(1, 'day')],
                'This Month': [moment().startOf('month'), moment().endOf('month').add(1, 'day')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month').add(1, 'day')],
                'This Year': [moment().startOf('year'), moment().add(1, 'day')],
                'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year').add(1, 'day')]
            }
        });

        $('#reportRange').on('apply.daterangepicker', function(ev, picker) {
            var pickerInfo = {};
            pickerInfo.startDate = picker.startDate;
            pickerInfo.endDate = picker.endDate;
            pickerInfo.duration = picker.endDate.unix() - picker.startDate.unix();
            pickerInfo.selectedRange = picker.chosenLabel;

            displays.$scope.reportConfig.durationInfo = pickerInfo;
            $(this).val(pickerInfo.startDate.format('MM/DD/YYYY') + ' - ' + pickerInfo.endDate.format('MM/DD/YYYY'));
            $(this).attr("title", pickerInfo.selectedRange);

            if (pickerInfo.duration > 86400) {
                displays.$scope.reportConfig.intervalType = 'Day';
            } else {
                displays.$scope.reportConfig.intervalType = 'Hour';
            }
            displays.$scope.$apply();
        });

        $('#reportRange').on('hide.daterangepicker', function(ev, picker) {
            var pickerInfo = {};
            pickerInfo.startDate = picker.startDate;
            pickerInfo.endDate = picker.endDate;
            pickerInfo.duration = picker.endDate.diff(picker.startDate);
            pickerInfo.selectedRange = picker.chosenLabel;

            displays.$scope.reportConfig.durationInfo = pickerInfo;
            $(this).val(pickerInfo.startDate.format('MM/DD/YYYY') + ' - ' + pickerInfo.endDate.format('MM/DD/YYYY'));
            $(this).attr("title", pickerInfo.selectedRange);

            //delay in order to hold modal open
            setTimeout(function() {
                displays.cancelModalClose = false;
            }, 1000);
        });

        $('#reportRange').on('show.daterangepicker', function(ev, picker) {
            displays.cancelModalClose = true;
        });

        $('#reportChooseRange').on('hide.bs.modal', function(e) {
            if (displays.cancelModalClose) {
                e.preventDefault();
                return false;
            }
        });

        $('#leftPanel').hover(
            function() {
                displays.panels = true;
            },
            function() {
                displays.panels = false;
            }
        );

        $('#rightPanel').hover(
            function() {
                displays.panels = true;
            },
            function() {
                displays.panels = false;
            }
        );

        $(document).bind('mouseup', function(event) {
            var whichEventCode = parseInt(event.which, 10);
            displays.sizing = false;

            switch (whichEventCode) {
                case 1:
                    leftMouseDown = false;
                    // console.log('END OBJECT MOVE');
                    displays.moveMode = false;
                    break;
                case 2:
                    displays.pushPullMode = false;
                    //console.log('PUSHPULL OFF!');
                    $('body').css('cursor', 'auto');
                    break;
                case 3:
                    rightMouseDown = false;
                    clearTimeout(displays.panTimer);
                    if (displays.panMode) {
                        displays.panMode = false;
                        // } else {
                        //     //displays.$scope.blur();
                        //     displays.$scope.menuClick();
                    }
                    // console.log('displays.PANMODE OFF!');
                    $('body').css('cursor', 'auto');
                    break;
                default:
                    // do nothing
                    break;
            }
        });

        $('#display').on('mousedown', '.object', function(event) {
            var whichEventCode = parseInt(event.which, 10);

            switch (whichEventCode) {
                case 1:
                    leftMouseDown = true;
                    // console.log('START OBJECT MOVE');
                    displays.moveStartX = event.pageX;
                    displays.moveStartY = event.pageY;
                    displays.moveMode = true;
                    displays.moveX = displays.dpageX;
                    displays.moveY = displays.dpageY;
                    break;
                case 2:
                    break;
                case 3:
                    rightMouseDown = true;
                    break;
                default:
                    // do nothing
                    break;
            }
        });

        $(document).on('mousedown', '.objectBox', function(event) {
            var whichEventCode = parseInt(event.which, 10);

            switch (whichEventCode) {
                case 1:
                    leftMouseDown = true;
                    //console.log('OBJECTBOX click');
                    displays.$scope.blur();
                    break;
                case 2:
                    break;
                case 3:
                    rightMouseDown = true;
                    break;
                default:
                    // do nothing
                    break;
            }
        });

        $(document).on('mousedown', function(event) {
            var whichEventCode = parseInt(event.which, 10);
            mouseDown = true;

            switch (whichEventCode) {
                case 1:
                    leftMouseDown = true;
                    // if (((event.target === $("#displayObjects")[0]) || (event.target === $("#backDrop")[0])) && displays.$scope) {
                    //     displays.$scope.blur();
                    // }
                    break;
                case 2:
                    displays.pushPullMode = true;
                    displays.zoomY = displays.pageY;
                    displays.startZoom = $('#zoom-slider').val();
                    $('body').css('cursor', 'url(/img/displays/pushPull.png), auto');
                    event.preventDefault();
                    break;
                case 3:
                    rightMouseDown = true;
                    if (!displays.popUpWindowActive) {
                        displays.cursorX = event.pageX;
                        displays.cursorY = event.pageY;
                        displays.leftOffOrig = $('#display').offset().left;
                        displays.topOffOrig = $('#display').offset().top;
                        displays.panTimer = setTimeout(function() {
                            // console.log('displays.PANMODE ON!');
                            displays.startX = displays.pageX;
                            displays.startY = displays.pageY;
                            displays.startPanX = $('#panw-slider').val();
                            displays.startPanY = $('#panh-slider').val();
                            $('body').css('cursor', 'move');
                            $('#menu').hide();
                            $('#paste').hide();
                        }, 10);
                    }
                    break;
                default:
                    // Do nothing special
                    break;
            }
        });

        $(document).bind('mousewheel', function(event, delta, deltaX, deltaY) {
            var zval,
                cval,
                cval2;

            if (!displays.popUpWindowActive) {
                if (ctrlKeyDown) {
                    event.preventDefault();
                } else {
                    if (displays.panels === false) {
                        //console.log(event);
                        if (event.ctrlKey) {
                            zval = $('#zoom-slider').val();
                            zval = zval + deltaY;
                            $('#zoom-slider').val(zval).slider('refresh');
                        }

                        if (displays.pushPullMode === false) {
                            cval = +$('#panh-slider').val();
                            cval = cval + (deltaY * 10);
                            $('#panh-slider').val(cval).slider('refresh');
                            cval2 = +$('#panw-slider').val();
                            cval2 = cval2 - (deltaX * 10);
                            // console.log('cval: ', cval, ' cval2: ', cval2);
                            $('#panw-slider').val(cval2).slider('refresh');
                        }
                        //event.preventDefault();
                        //return false;
                    }
                }
            }
        });

        $(document).unbind('keydown').bind('keydown', function(event) {
            var doPrevent = false,
                d = event.srcElement || event.target,
                scope = angular.element(document.getElementById('displayCtrl')).scope();

            //console.log(event.keyCode);
            if (event.keyCode === 8 || event.keyCode === 46) {
                if ((d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT' || d.type.toUpperCase() === 'PASSWORD' || d.type.toUpperCase() === 'FILE' || d.type.toUpperCase() === 'SEARCH')) || d.tagName.toUpperCase() === 'TEXTAREA') {
                    doPrevent = d.readOnly || d.disabled;
                    //alert('in txt area');
                } else {
                    doPrevent = true;
                    scope.deleteObject();
                    scope.$apply();
                }
            }

            if (event.keyCode === 38 || event.keyCode === 40 || event.keyCode === 37 || event.keyCode === 39) {
                if ((d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT' || d.type.toUpperCase() === 'PASSWORD' || d.type.toUpperCase() === 'FILE' || d.type.toUpperCase() === 'SEARCH')) || d.tagName.toUpperCase() === 'TEXTAREA') {
                    doPrevent = d.readOnly || d.disabled;
                    //alert('in txt area');
                } else {
                    doPrevent = true;
                    scope.nudgeObject(event.keyCode);
                    scope.$apply();
                }
            }

            if (event.keyCode === 17) {
                ctrlKeyDown = true;
            }

            if (doPrevent) {
                event.preventDefault();
            }
        });

        //$(document).unbind('keyup').bind('keyup', function(event) {
        //    if (event.keyCode === 17) {
        //        ctrlKeyDown = false;
        //    }
        //});

        // $("#zoom-slider").bind('change', function(event) {
        //     $('#zoom-slider').trigger('input');
        // });
        // $("#panw-slider").bind('change', function(event) {
        //     $('#panw-slider').trigger('input');
        // });
        // $("#panh-slider").bind('change', function(event) {
        //     $('#panh-slider').trigger('input');
        // });

        $(document).mousemove(function(event) {
            var cval,
                cval2,
                updateZoom = function() {
                    var zoom = +$('#zoom-slider').val();
                    // $scope.zoom = +$('#zoom-slider').val();
                    $('#display').css({
                        '-webkit-transform': 'scale(' + zoom / 100 + ')',
                        'transform': 'scale(' + zoom / 100 + ')'
                    });
                };

            if (!displays.popUpWindowActive) {
                displays.pageX = event.pageX;
                displays.pageY = event.pageY;
                //$('#coordinates').html(
                //    (event.pageX) + '/' + (event.pageY)
                //).css({
                //        left: event.pageX + 20,
                //        top: event.pageY + 20
                //    });

                if (displays.tip) {
                    $('#tip').css('left', (+displays.pageX + 20) + 'px');
                    $('#tip').css('top', (+displays.pageY + 15) + 'px');
                }

                //if (displays.panMode) {
                //    cval = +displays.startPanY;
                //    cval = cval + (displays.pageY - displays.startY);
                //    $('#panh-slider').val(cval).slider('refresh');
                //    cval2 = +displays.startPanX;
                //    cval2 = cval2 + (displays.pageX - displays.startX);
                //    // console.log('cval: ', cval, ' cval2: ', cval2);
                //    $('#panw-slider').val(cval2).slider('refresh');
                //}

                if (rightMouseDown) {
                    displays.panMode = true;
                    cval = +displays.startPanY;
                    cval = cval + (displays.pageY - displays.startY);
                    $('#panh-slider').val(cval).slider('refresh');
                    cval2 = +displays.startPanX;
                    cval2 = cval2 + (displays.pageX - displays.startX);
                    // console.log('cval: ', cval, ' cval2: ', cval2);
                    $('#panw-slider').val(cval2).slider('refresh');
                }

                if (displays.pushPullMode) {
                    cval = displays.startZoom;
                    cval = cval - (displays.pageY - displays.zoomY);
                    $('#zoom-slider').val(cval).slider('refresh');
                    updateZoom();
                }
            }
        });

        $('#display').mousemove(function(event) {
            var scope = angular.element(document.getElementById('displayCtrl')).scope(),
                x = event.pageX,
                y = event.pageY;

            if (!displays.popUpWindowActive) {
                displays.dpageX = x;
                displays.dpageY = y;
                //console.log('FIND OFFSET')
                //console.log(event);

                if (displays.moveMode && displays.sizing === false) {
                    if (scope.moveItem && (x !== displays.moveStartX || y !== displays.moveStartY)) {
                        scope.moveItem((displays.dpageX - displays.moveX), (displays.dpageY - displays.moveY));
                    }
                    // scope.$apply();
                }

                if (displays.sizing) {
                    scope.sizeItem(event); //(displays.dpageX - displays.moveX), (displays.dpageY - displays.moveY));
                    // scope.$apply();
                }
            }
        });

        $('#display').on('mouseenter mouseleave', '.sc_ob', function(event) {
            var upi,
                idx;
            if (event.type === 'mouseenter') {
                upi = $(this).data('upi');
                idx = $(this).data('scr-idx');
                if ((!upi || upi === 'undefined') && displayJson['Screen Objects'][idx] && displayJson['Screen Objects'][idx]._actionButton !== undefined) {
                    upi = displayJson['Screen Objects'][idx]._actionButton.getPointData().Name;
                }
                displays.showTip(upi);
            } else {
                displays.hideTip();
            }
        });
    },

    initAngularFilters: function() {
        var displayApp = displays.displayApp || angular.module('displayApp', []),
            resolvePrecisionPlaceholder = function(inputPrecision) {
                var displayPrecision;

                displayPrecision = parseFloat(inputPrecision).toString().split(".")[1];
                // displayPrecision = (displayPrecision > 0) ? displayPrecision : parseInt(inputPrecision);   // incase we care about number to left of .
                displayPrecision = (displayPrecision > 0) ? displayPrecision : 0;

                return ((displayPrecision > 0) ? "###." + Array(parseInt(displayPrecision, 10) + 1).join("#") : "###");
            };

        displays.displayApp = displayApp;

        displays.initDisplay();


        if (!displays.isEdit) {
            displayApp.controller('DisplayCtrl', function($scope, $http) {
                var $topBar = $(".topBar.ui-header"),
                    maxScrollPercentage = 0.25,
                    previousScrollValue = 0,
                    displayJson = window.displayJson,
                    action = function(item, e) {
                        var screenObject = parseInt(item['Screen Object'], 10),
                            _pointName = '',
                            _pointType = 'display-sup',
                            _target = 'mainWindow',
                            openGpl = function(gplItem) {
                                var url = ['/gpl/viewer/', gplItem.upi.toString()];

                                _pointName = displays.upiNames[gplItem] || gplItem.Text;

                                if (e && e.shiftKey) {
                                    _target = '';
                                }

                                displays.openWindow(url.join(''), _pointName, _pointType, _target, gplItem.upi);
                            };

                        if (screenObject === 1) {
                            //alert(item['Point Type']);
                            if (item.hasOwnProperty('ActionCode')) { // action button
                                displays.$scope.currActionButton = item;
                                item._actionButton.sendCommand();
                            } else {
                                if (item['Point Type'] === 151) {
                                    openGpl(item);
                                } else {
                                    if (item.upi === 'none') {
                                        alert('Display not set');
                                    } else {
                                        _pointName = displays.upiNames[item.upi] || item.Text;
                                        if (_pointName !== item.Text) {
                                            _pointType = 'display';
                                        }
                                        if (e && e.shiftKey) {
                                            _target = '';
                                        }
                                        displays.openWindow('/displays/view/' + item.upi, _pointName, _pointType, _target, item.upi);
                                    }
                                }
                            }
                        }
                    },
                    filterms2rgb = function(input) {
                        var ret = '#' + input;

                        return ret;
                    },
                    filterpts2px = function(input) {
                        return Math.floor(input * (4 / 3)) + 'px';
                    },
                    filterfonts = function(input) {
                        var font = input;
                        if (input === 'Bookman Old Style') {
                            font = 'Arial';
                        }
                        if (input === 'Fixedsys' || input === 'fixedsys') {
                            font = 'fixedsys, consolas, monospace';
                        }
                        return font;
                    },
                    filterbold = function(input) {
                        var out = 'normal';
                        if (input === true) {
                            out = 'bold';
                        }
                        return out;
                    },
                    filterunderline = function(input) {
                        var out = 'none';
                        if (input === true) {
                            out = 'underline';
                        }
                        return out;
                    },
                    filteritalic = function(input) {
                        var out = 'normal';
                        if (input === true) {
                            out = 'italic';
                        }
                        return out;
                    },
                    filterwh = function(input, screenObject) {
                        var wh = +input;
                        if (wh === 0 || screenObject === 0) {
                            wh = 'auto';
                        } else {
                            if (screenObject !== 1) {
                                wh += 8;
                            }
                            wh = wh + 'px';
                        }
                        return wh;
                    },
                    filterwmf = function(input) {
                        var bg = input,
                            out;

                        if (input && input.toLowerCase() !== '.png') { //not just ".png"
                            if (displays.filesToUpload[input._idx]) {
                                out = '';
                            } else {
                                bg = bg.replace('.WMF', '.png');
                                bg = bg.replace('.wmf', '.png');
                                bg = bg.replace('.BMP', '.png');
                                bg = bg.replace('.bmp', '.png');
                                bg = bg.replace(/ /g, '%20');
                                bg = '/display_assets/assets/' + bg;
                                out = bg; //'url(' + bg + ')';
                            }
                        } else {
                            out = '/img/blank.gif';
                        }
                        //out = out + 'background-size:' + displayWidth + 'px';
                        return out;
                    },
                    updatePanw = function() {
                        $scope.panW = $('#panw-slider').val();
                        $scope.dLeft = +$scope.panW + (-1 * (+$scope.display.Width / 2));
                        $('#display').css('margin-left', $scope.dLeft);
                    },
                    updatePanh = function() {
                        $scope.panH = $('#panh-slider').val();
                        $scope.dTop = +$scope.panH + (-1 * (+$scope.display.Height / 2));
                        $('#display').css('margin-top', $scope.dTop);
                    },
                    updateZoom = function() {
                        $scope.zoom = +$('#zoom-slider').val();
                        $('#display').css({
                            '-webkit-transform': 'scale(' + $scope.zoom / 100 + ')',
                            'transform': 'scale(' + $scope.zoom / 100 + ')'
                        });
                    },
                    zoomToFitWindow = function() {
                        var winWidth = window.innerWidth,
                            winHeight = window.innerHeight - $topBar.height(),
                            displayWidth = $scope.display.Width,
                            displayHeight = $scope.display.Height,
                            percentageWidthDiff = Number((winWidth / displayWidth).toFixed(2)),
                            percentageHeightDiff = Number((winHeight / displayHeight).toFixed(2)),
                            zoomTo;

                        if (percentageWidthDiff < 1 || percentageHeightDiff < 1) {
                            if (percentageWidthDiff < 1 && percentageHeightDiff < 1) {
                                zoomTo = Math.min(percentageWidthDiff, percentageHeightDiff) * 100;
                            } else if (percentageHeightDiff < 1 && (percentageWidthDiff > percentageHeightDiff)) {
                                zoomTo = percentageHeightDiff * 100;
                            } else if (percentageWidthDiff < 1 && (percentageHeightDiff > percentageWidthDiff)) {
                                zoomTo = percentageWidthDiff * 100;
                            }
                        } else if (percentageWidthDiff > 1 || percentageHeightDiff > 1) {
                            if (percentageWidthDiff > 1 && percentageHeightDiff > 1) {
                                zoomTo = Math.min(percentageWidthDiff, percentageHeightDiff) * 100;
                            } else if (percentageHeightDiff > 1 && (percentageWidthDiff < percentageHeightDiff)) {
                                zoomTo = percentageHeightDiff * 100;
                            } else if (percentageWidthDiff > 1 && (percentageHeightDiff < percentageWidthDiff)) {
                                zoomTo = percentageWidthDiff * 100;
                            }
                        }

                        if (zoomTo) {
                            $('#zoom-slider').val(zoomTo).slider("refresh");
                            updateZoom();
                        }
                    };

                displayJson['Screen Objects'] = displayJson['Screen Objects'] || [];
                // document.title = displayJson.Name;

                $('.resetZoom').click(function() {
                    $scope.resetZoom();
                });

                $('#zoom-slider').on('change', function() {
                    updateZoom();
                });

                $('.autoZoom').click(function() {
                    zoomToFitWindow();
                    updateZoom();
                    return false;
                });

                $scope.display = displayJson;
                $scope.reportDuration = 'None';
                $scope.reportType = 'predefined';
                $scope.reportStart = '';
                $scope.reportEnd = '';
                $scope.zoom = 100;
                $scope.panW = 0;
                $scope.dLeft = (-1 * ($scope.display.Width / 2)) + $scope.panW;
                $scope.panH = 0;
                $scope.dTop = (-1 * ($scope.display.Height / 2)) + $scope.panH;
                $scope.objs = [];
                $scope.objs = $scope.display['Screen Objects'];
                $scope.reportConfig = $.extend(true, {}, displays.defaultReportConfig);

                displays.initScreenObjects({
                    $scope: $scope
                });

                $scope.selectInterval = function(interval) {
                    $scope.reportConfig.intervalType = interval;
                    setTimeout(function() {
                        $scope.$apply();
                    }, 1);
                };

                // $scope.checkReportRange = function () {
                //     var $button = $('#openReport'),
                //         valid = displays.$scope.reportType === 'predefined' || (displays.$scope.reportType === 'chosen' && displays.$scope.reportStart < displays.$scope.reportEnd);

                //     if (valid) {
                //         $button.removeClass('ui-disabled');
                //     } else {
                //         $button.addClass('ui-disabled');
                //     }
                // };

                $scope.sendCommand = function() {
                    var val = parseFloat($('#actionButtonValue').val());
                    $scope.currActionButton._actionButton.sendValue(val);
                };


                $scope.action = action;
                $scope.getBGStyle = function(display) {
                    var ret = {
                        'width': displays.maxWidth || 800,
                        'height': displays.maxHeight || 600
                    };

                    if (displayJson['Background Color'] === '') {
                        ret['background-color'] = '#151515';
                    }

                    return ret;
                };
                $scope.displayDeleted = function() {
                    return (displayJson._pStatus === 2);
                };
                $scope.bgSrcURL = filterwmf(displayJson["Background Picture"]);
                $scope.getDisplayStyle = function(display) {
                    var ret = {
                        'margin-left': $scope.dLeft + 'px',
                        'margin-top': $scope.dTop + 'px',
                        'box-shadow': 'none',
                        'background-color': $scope.convertColor(display['Background Color']),
                        'height': $scope.display.Height + 'px',
                        'width': $scope.display.Width + 'px'
                    };

                    return ret;
                };
                $scope.getStyle = function(object) {
                    var ret = {
                        "color": filterms2rgb(object["Foreground Color"]),
                        "font-size": filterpts2px(object["Font Size"]),
                        "font-family": filterfonts(object["Font Name"]),
                        "font-weight": filterbold(object["Font Bold"]),
                        "text-decoration": filterunderline(object["Font Underline"]),
                        "font-style": filteritalic(object["Font Italic"]),
                        "left": object.Left + 'px',
                        "top": object.Top + 'px'
                            // "width": filterwh(object.Width),
                            // "height": filterwh(object.Height)
                    };

                    if (object['Screen Object'] === 1 || object.hasOwnProperty('ActionCode')) { // button or action button
                        ret.width = filterwh(object.Width, object['Screen Object']);
                        ret.height = filterwh(object.Height, object['Screen Object']);
                    }

                    return ret;
                };
                $scope.resetZoom = function() {
                    $scope.zoom = 100;
                    $('#zoom-slider').val('100').slider("refresh");
                    return false;
                };
                $scope.showPoint = function(item, ev) {
                    var endPoint,
                        workspaceManager = displays.workspaceManager,
                        pointType,
                        isDisplayObject = item['Point Type'] === 151,
                        localUPI = item.upi,
                        isActionButton = item.hasOwnProperty('ActionCode'),
                        target = (window.name === 'mainWindow' && isDisplayObject) ? window.name : 'pid_' + item.upi,

                        openWin = function() {
                            var title = displays.upiNames[item.upi] || item.Text;
                            endPoint = workspaceManager.config.Utility.pointTypes.getUIEndpoint(pointType, item.upi);
                            return displays.openWindow(endPoint.review.url, title, pointType, target, item.upi, {
                                width: 1250,
                                height: 750
                            });
                        };

                    if (isActionButton) {
                        displays.$scope.currActionButton = item;
                        $('#actionButtonValue').attr({
                            min: item._actionButton.min,
                            max: item._actionButton.max
                        });
                        item._actionButton.sendCommand();
                    } else {
                        if (localUPI && !(displays.pointReferenceSoftDeleted(localUPI) && isDisplayObject)) { // don't get softdeleted display references
                            if (typeof localUPI !== 'string') { //upi is string for static text
                                $.ajax({
                                    url: '/api/points/' + localUPI
                                }).done(function(response) {
                                    pointType = response['Point Type'].Value;
                                    openWin();
                                });
                            }
                        }
                    }
                };
                $scope.zoomDec = function(input) {
                    return input / 100;
                };
                $scope.convertColor = function(color) {
                    var ret = '#';

                    if (!color.match('#')) {
                        ret += color;
                    } else {
                        ret = color;
                    }

                    return ret;
                };
                $scope.ms2rgb = function(input) {
                    var bHex = 'black',
                        num = +input,
                        red,
                        green,
                        blue;
                    if (num > 0) {
                        blue = Math.round(num / 65536);
                        green = Math.round((num % 65536) / 256);
                        red = Math.round((num % 65536) % 256);
                        bHex = 'rgb(' + red + ',' + green + ',' + blue + ')';
                    }
                    return bHex;
                };

                $('#panw-slider').on('change', function() {
                    updatePanw();
                });

                $('#panh-slider').on('change', function(event) {
                    var $display = $('#display'),
                        panH = $('#panh-slider').val(),
                        currentZoom = (+$('#zoom-slider').val()) / 100,
                        scrollingUp = (panH > previousScrollValue),
                        winHeight = window.innerHeight - $topBar.height(),
                        virtualTop = maxScrollPercentage * winHeight,
                        virtualBottom = winHeight - (maxScrollPercentage * winHeight),
                        displayTop = parseInt(($display.offset().top + panH), 10),
                        displayBottom = parseInt(((displayTop + ($scope.display.Height * currentZoom)) + panH), 10);

                    if (((displayBottom >= virtualTop) && (displayTop <= virtualBottom)) || // display still in virtual window
                        (scrollingUp && (displayBottom < virtualTop)) || // maxed out scrolling up
                        (!scrollingUp && (displayTop > virtualBottom))) { // maxed out scrolling down
                        updatePanh(panH);
                        previousScrollValue = parseInt(panH, 10);
                    } else {
                        //event.preventDefault();
                        $('#panh-slider').val(parseInt(previousScrollValue, 10));
                    }
                });
                zoomToFitWindow();
            });
        }

        displayApp.filter('pointName', function() {
            return function(input) {
                var out = displays.upiNames[input]; //'none';
                return out;
            };
        });

        displayApp.filter('percent', function() {
            return function(input) {
                return input + '%';
            };
        });

        displayApp.filter('eDate', function() {
            return function(input) {
                var unix = parseInt(input.eDate ? input.eDate * 1000 : new Date().getTime(), 10),
                    date = new Date(unix),
                    hours = date.getHours(),
                    minutes = date.getMinutes(),
                    ampm = hours >= 12 ? 'PM' : 'AM',
                    time,
                    ver;
                hours = hours % 12;
                hours = hours > 0 ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0' + minutes : minutes;
                time = (date.getMonth() + 1) + '.' + date.getDate() + '.' + date.getFullYear() + ' ' + hours + ':' + minutes + ampm;
                ver = '<div class="past ' + input.version + '">Past Version</div>';
                if (input.version === 'Production') {
                    ver = '<div class="production">Production</div>';
                }
                if (input.version === 'Staging') {
                    ver = '<div class="staging">Staging</div>';
                }
                return '<div class="display-version">' + ver + time + '</div>';
            };
        });

        displayApp.filter('wh', function() {
            return function(input) {
                var wh = +input;
                if (wh === 0) {
                    wh = 'auto';
                } else {
                    wh = wh + 'px';
                }
                return wh;
            };
        });

        displayApp.filter('renderObject', function() {
            return function(input) {
                var out = '???',
                    i,
                    pts,
                    style = ' style="',
                    imgSrc,
                    ploturl,
                    underline = 'text-decoration:' + ((input['Font Underline'] === true) ? 'underline;' : 'none;'),
                    screenObject = parseInt(input['Screen Object'], 10),
                    precision = ' data-precision="' + parseFloat(input.Precision) + '"',
                    upi = (input.upi !== 'none') ? input.upi : null,
                    cls = ' sc_ob sc_ob_' + upi,
                    text,
                    dataUpi = ' data-upi="' + upi + '"',
                    animString = 'screen_anim_' + input._idx,
                    animId = 'id="' + animString + '"',
                    screenIdx = ' data-scr-idx="' + input._idx + '"',
                    noAjax = ' data-ajax="false"',
                    pointHardDeleted = displays.pointReferenceHardDeleted(upi),
                    pointSoftDeleted = displays.pointReferenceSoftDeleted(upi),
                    isEdit = displays.editMode || false; //globals need to change....temporary fix

                if (!pointHardDeleted) {
                    if (pointSoftDeleted) {
                        cls += " strikethrough-line";
                    }

                    if (typeof screenObject === 'number') {
                        switch (screenObject) {
                            case 0: // Dynamic
                                {
                                    if (isEdit) {
                                        precision = ' data-precision="' + parseInt(input.uiPrecision, 10) + '"';
                                        text = ((input.uiPrecision > 0) ? "###." + Array(parseInt(input.uiPrecision, 10) + 1).join("#") : "###");
                                    } else {
                                        text = (input.Text || resolvePrecisionPlaceholder(input.Precision));
                                    }
                                    out = '<div ' + screenIdx + 'data-orig-color="' + input['Foreground Color'] + '"' + precision + dataUpi + ' class="' + cls + '"' + '>' + text + '</div>';
                                }
                                break;
                            case 1: // button
                                {
                                    out = '';
                                    if (+input['Background Color'] !== 0) {
                                        style += 'background-image:none;border:none;';
                                    }
                                    //style += underline;
                                    style += 'line-height:' + input['Height'] + 'px;' + '"';
                                    text = ((input.Text) ? input.Text.split("\n").join("<br/>") : '&nbsp;');

                                    if (input.hasOwnProperty('ActionCode') && input._actionButton === undefined) { // action button
                                        input._actionButton = new ActionButton(input);
                                    }

                                    if (pointSoftDeleted) {
                                        out = '<p' + screenIdx + style + ' class="displayBtn' + cls + '"' + noAjax + dataUpi + '>' + text + '</p>';
                                    } else {
                                        out = '<a' + screenIdx + style + ' class="displayBtn' + cls + '"' + noAjax + dataUpi + '>' + text + '</a>';
                                    }
                                }
                                break;
                            case 2: // text
                                {
                                    out = (input.Text || '').split("\n").join("<br/>");
                                }
                                break;
                            case 3: // animation
                                {
                                    if (displays.editMode === true) { //pause animations
                                        if (displays.filesToUpload[input._idx]) {
                                            if (input._animType === 2) {
                                                imgSrc = displays.filesToUpload[input._idx]['On'];
                                                imgSrc = (imgSrc || {}).data;
                                            } else {
                                                imgSrc = displays.filesToUpload[input._idx].data;
                                            }
                                            // imgSrc = displays.filesToUpload[input._idx].data;//input.imgsrc;
                                        } else {
                                            if (input._animType === 2) { //multifile
                                                imgSrc = '/displays/gifs/' + ((input['OnState']) ? input['OnState'] : input['Animation File']);
                                            } else {
                                                imgSrc = '/displays/gifs/' + input['Animation File'];
                                            }
                                            imgSrc = imgSrc.replace('.gif', '') + '/0';
                                        }
                                    } else {
                                        if (input._animType === 2) { //multifile
                                            imgSrc = '/displays/gifs/' + ((input['OnState']) ? input['OnState'] : input['Animation File']);
                                        } else {
                                            imgSrc = '/displays/gifs/' + input['Animation File'];
                                        }

                                        imgSrc = imgSrc.replace('.gif', '') + '/';
                                    }
                                    displays.animationConfigs.push({
                                        id: animString,
                                        screenObject: input
                                    });

                                    out = '<img ' + animId + screenIdx + dataUpi + precision + ' class="' + cls + '" src="' + imgSrc + '" />';
                                }
                                break;
                            case 5: // history report
                                {
                                    out = 'history report';
                                }
                                break;
                            case 6: // history log
                                {
                                    out = 'history log';
                                }
                                break;
                            case 7: // Display Trend
                                {
                                    if (input.points.length < 1) {
                                        out = '<div><img src="/img/displays/plot.png" /></div>';
                                    } else {
                                        pts = [];
                                        for (i = 0; i < input.points.length; i++) {
                                            pts.push(input.points[i].upi);
                                        }
                                        ploturl = '?title=' + input.Title + '&height=' + input.Height + '&width=' + input.Width + '&yaxis=' + input.Yaxis + '&points=' + pts.join();
                                        out = '<div style="width:100%;height:100%;background-color:white;background-position:center center;background-repeat:no-repeat;background-image:url(/img/displays/spin.gif)">';
                                        if (isEdit) {
                                            out += '<img draggable="false" src="/displays/plot' + ploturl + '" /></div>';
                                        } else {
                                            out += '<iframe frameborder="0" width="100%" height="100%" src="/displays/trend' + ploturl + '"></iframe></div>';
                                        }
                                    }
                                }
                                break;
                            default:
                                // console.log("who broke what...  screenObject = ", screenObject);
                                break;
                        }
                    }

                    if (out === '???') {
                        return '';
                    }

                    out += '<div id="screen_object_highlight_' + input._idx + '" class="highlight"><div onmousedown="startSize()" onmouseup="endSize()" class="sH nE" /><div onmousedown="startSize()" onmouseup="endSize()" class="sH nW" /><div onmousedown="startSize()" onmouseup="endSize()" class="sH sE" /><div onmousedown="startSize()" onmouseup="endSize()" class="sH sW" /></div>';

                    return out;
                } else {
                    return '';
                }
            };
        });

        displayApp.filter('screenType', function() {
            return function(input) {
                var out = '???',
                    isActionButton = input.hasOwnProperty('ActionCode'),
                    v = '',
                    rClass;
                //dynamic
                if (input['Screen Object'] === 0) {
                    out = 'Dynamic Point Value';
                    v = displays.upiNames[input.upi];
                }
                //button
                if (input['Screen Object'] === 1) {
                    out = 'Display Button';
                    v = displays.upiNames[input.upi];
                }
                //text
                if (input['Screen Object'] === 2) {
                    out = 'Text Label';
                    v = input.Text;
                }
                //animation
                if (input['Screen Object'] === 3) {
                    out = 'Animation';
                    v = 'image here';
                }
                if (isActionButton) {
                    out = 'Action Button';
                    v = input.Text;
                }
                //history report
                if (input['Screen Object'] === 5) {
                    out = 'History Report';
                }
                //history log
                if (input['Screen Object'] === 6) {
                    out = 'History Log';
                }
                if (input['Screen Object'] === 7) {
                    out = 'Trend Plot';
                    v = 'points';
                }
                rClass = 'ui-bar-c';
                if (input.sel) {
                    rClass = 'ui-bar-e';
                }
                out = '<div class="' + rClass + '" style="overflow:hidden;border:none;padding:5px;background-color:red;cursor:move"><div>' + out + '</div><div style="font-weight:normal">' + v + '</div></div>';
                return out;
            };
        });

        displayApp.filter('screenType2', function() {
            return function(input) {
                var out = '???',
                    v = '',
                    rClass;
                //dynamic
                if (input['Screen Object'] === 0) {
                    out = 'Dynamic Point Value';
                    v = displays.upiNames[input.upi];
                }
                //button
                if (input['Screen Object'] === 1) {
                    out = 'Display Button';
                    v = 'Display Point Id: ' + input.upi;
                }
                //text
                if (input['Screen Object'] === 2) {
                    out = 'Text Label';
                    v = input.Text;
                }
                //animation
                if (input['Screen Object'] === 3) {
                    out = 'Animation';
                    v = 'image here';
                }
                //history report
                if (input['Screen Object'] === 5) {
                    out = 'History Report';
                }
                //history log
                if (input['Screen Object'] === 6) {
                    out = 'History Log';
                }
                if (input['Screen Object'] === 7) {
                    out = 'Trend Plot';
                    v = 'points';
                }
                rClass = 'ui-bar-c';
                if (input.sel) {
                    rClass = 'ui-bar-e';
                }
                out = '<div class="' + rClass + '" style="overflow:hidden;border:none;padding:5px;"><div>' + out + '</div><div style="font-weight:normal">' + v + '</div></div>';
                return out;
            };
        });

        displayApp.filter('displayName', function() {
            return function(input) {
                var out = input.split('-').join('_');
                return out;
            };
        });

        displayApp.filter('screenData', function() {
            return function(input) {
                var out = '???',
                    screenObject = parseInt(input['Screen Object'], 10);
                //dynamic
                if (screenObject === 0) {
                    out = input.upi;
                }
                //button
                if (screenObject === 1) {
                    out = input.Text;
                }
                //text
                if (screenObject === 2) {
                    out = input.Text;
                }
                //animation
                if (screenObject === 3) {
                    out = 'Image';
                }
                //history report
                if (screenObject === 5) {
                    out = 'History Report';
                }
                //history log
                if (screenObject === 6) {
                    out = 'History Log';
                }
                if (screenObject === 7) {
                    out = 'Trend Plot';
                }
                //out = 'data';
                return out;
            };
        });

        angular.bootstrap(document, ['displayApp']);

        displays.initAnimations();

        displays.rendered();
    }

});