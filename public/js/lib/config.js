/*jshint -W069 */ // JSLint directive - Do not warn about dot notation
/* jslint white: true */
var Config = (function(obj) {
    var fs, enumsTemplatesFile, enumsTemplatesJson, lodash;
    if (typeof window === 'undefined') {
        // This will happen on the server side, in NodeJS
        fs = require('fs');
        enumsTemplatesFile = __dirname + '/enumsTemplates.json';
        enumsTemplatesJson = JSON.parse(fs.readFileSync(enumsTemplatesFile));
        lodash = require('lodash');
    } else {
        // This will happen on the client side
        if (typeof $ === 'function') {
            $.ajax({
                url: "/js/lib/enumsTemplates.json",
                async: false,
                success: function(data) {
                    enumsTemplatesJson = data;
                }
            });
        }
    }
    if (lodash) _ = lodash;
    obj.Enums = enumsTemplatesJson.Enums;
    obj.revEnums = (function(enums) {
        var topKey,
            key,
            topVal,
            val,
            enumObject,
            ret = {},
            count,
            innerObj,
            obj;

        for (topKey in enums) { //access flags
            count = 0;
            topVal = enums[topKey];
            obj = {};
            for (key in topVal) { //read, etc
                count++;
                enumObject = topVal[key];
                if (enumObject) {
                    val = enumObject.enum;
                    if (val !== undefined) {
                        if (typeof val === 'number') {
                            obj[val] = key;
                        } else {
                            if (typeof val.enum === 'number') {
                                innerObj = JSON.parse(JSON.stringify(val));

                                innerObj.key = key;

                                obj[val.enum] = innerObj;
                            } else {
                                count--;
                            }
                        }
                    } else {
                        count--;
                    }
                }
            }
            if (count > 0) {
                ret[topKey] = obj;
            }
        }

        return ret;
    }(obj.Enums));

    obj.PointTemplates = enumsTemplatesJson.Templates;

    obj.deadbandFactor = 0.1; // This is the deadband constant factor. It is used to calculate 'Alarm Deadband.Max' and 'Value Deadband.Max' for AI, AO, and AV point types

    obj.Test = {
        test: function() {
            console.log("inside test");
            return true;
        }
    };

    obj.Utility = {

        clone: function(obj) {
            if (obj === null || typeof(obj) != 'object')
                return obj;

            var temp = obj.constructor(); // changed

            for (var key in obj)
                temp[key] = this.clone(obj[key]);
            return temp;
        },

        formatNumber: function(data) {
            var val = data.val,
                maxDigits = data.maxDigits,
                valType = typeof val,
                integer,
                absInteger,
                absValue,
                digitString,
                digits,
                power,
                mantissa,
                _val,
                tmp,
                commetize = function(integerValue) {
                    if (data.noComma)
                        return integerValue;
                    else
                        return integerValue.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
                };
            integer = parseInt(val, 10);
            absValue = Math.abs(val);

            // Max digits defaults to 4 if undefined; it has a minimum of 4
            if (typeof maxDigits != 'number') maxDigits = 4;
            else if (maxDigits < 4) maxDigits = 4;

            // Force scientific notation if very small or very large
            if ((absValue < 0.0001 && absValue !== 0) || (absValue >= 1000000)) {
                _val = parseFloat(val).toExponential(maxDigits).split('e');
                // Remove extra zeroes
                _val[0] = parseFloat(_val[0]);
                // If the resultant exponential is of the form 1E+8, reformat to '1.0E+8' per LMH request
                if (_val[0].toString().indexOf('.') === -1) {
                    _val[0] += '.0';
                }
                return _val[0] + 'E' + _val[1];
            }
            digitString = val.toString().split('.')[1];

            // If no decimal chars
            if (digitString === undefined) {
                return commetize(integer);
            } else if (data.noTruncate) {
                return commetize(integer) + '.' + digitString;
            }
            tmp = digitString.split('e');
            digits = tmp[0];
            power = tmp[1];

            if (absValue < 1) {} // No change
            else if (absValue < 10) maxDigits -= 1;
            else if (absValue < 100) maxDigits -= 2;
            else maxDigits -= 3;

            // ------ Use a multistep operation to trim our digits to the desired number ----------------
            // Create a decimal string by prepending '0.', then convert that to a number type
            // using parseFloat. The number is trimmed using toFixed (this also manages rounding 
            // for us but leaves trailing zeroes). Use a do while & increment maxDigits to
            // prevent large round up / round down errors. maxDigits <=5 recommended by LMH
            do {
                _val = parseFloat('0.' + digits).toFixed(maxDigits++);
            } while ((_val === 1 || _val === 0) && maxDigits <= 5);
            // If our value rounded up, we need to bump our integer component
            if (_val === 1) integer += (val < 0) ? -1 : 1;
            // Trim trailing zeroes using parseFloat, then convert the number back to a string 
            // and split it to get the formatted mantissa. If index 1 is undefined, it means
            // parseFloat generated 0
            mantissa = parseFloat(_val).toString().split('.')[1] || 0;
            // If we had a power, i.e. e+30, add it back
            if (power) {
                mantissa += ("E" + power);
            }
            return commetize(integer) + '.' + mantissa;
        },

        // isNumber routine from: http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric (swipped by JDR)
        isNumber: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        isPointNameCharacterLegal: function(_char) {
            // a-z, A-Z, space, 0-9, %, ., &, -, +, [, ], (, ), /
            var allowedChars = /[a-zA-Z 0-9%\.&\-\+\[\]\(\)\/]/;

            if (!allowedChars.test(_char)) {
                return false;
            }
            return true;
        },

        isPropInSchedProps: function(pointType, property) {
            return enumsTemplatesJson.Enums["Point Types"][pointType].schedProps.indexOf(property) >= 0;
        },

        getUniquePIDprops: function() {
            var props = [];
            for (var prop in enumsTemplatesJson.Enums.Properties) {
                if (enumsTemplatesJson.Enums.Properties[prop].valueType === "UniquePID")
                    props.push(prop);
            }
            return props;
        },

        pointTypes: (function() {
            var types = enumsTemplatesJson.Enums['Point Types'],
                totalTypes = Object.keys(types).length,
                filterPointTypes = function(filter) {
                    var filtered = [],
                        added = {},
                        i,
                        len,
                        doFilter = function(_filter) {
                            var prop,
                                item,
                                arr = [];
                            for (prop in types) {
                                item = types[prop];
                                if ((!_filter || !!~item.lists.indexOf(_filter)) && !added[prop]) {
                                    added[prop] = true;
                                    arr.push({
                                        key: prop,
                                        enum: item.enum
                                    });
                                }
                            }
                            return arr;
                        };
                    if (typeof filter === 'string') {
                        filtered = doFilter(filter);
                    } else {
                        len = filter.length;
                        for (i = 0; i < len; i++) {
                            filtered = filtered.concat(doFilter(filter[i]));
                        }
                    }
                    return filtered;
                },
                _getAllPointTypes = function() {
                    return filterPointTypes();
                },
                _getAllowedPointTypes = function(property, pointType) {
                    var allowed = [];
                    if (typeof property === 'undefined' && typeof pointType === 'undefined') {
                        //return all default point types
                        return filterPointTypes('default');
                    }
                    // gplblock
                    switch (property) {
                        case 'Qualifier Point':
                        case 'Display Button':
                            return filterPointTypes('default');
                        case 'Display Trend':
                        case 'Display Animation':
                        case 'Display Dynamic':
                        case 'Dynamic':
                            return filterPointTypes('dynamic');
                        case 'GPLBlock':
                            return filterPointTypes('gpl');
                        case 'Alarm Adjust Point':
                        case 'Dry Bulb Point':
                        case 'Humidity Point':
                        case 'Mixed Air Point':
                        case 'Outside Air Point':
                        case 'Return Air Point':
                        case 'Setpoint Input':
                        case "CFM Input Point":
                        case "Occupied Cool Setpoint":
                        case "Occupied Heat Setpoint":
                        case "Source Air Temp Point":
                        case "Unoccupied Cool Setpoint":
                        case "Unoccupied Heat Setpoint":
                        case "Zone Temp Point":
                        case "Zone Offset Point":
                            return filterPointTypes('float');
                        case 'Alarm Display Point':
                        case 'Slide Display':
                            return filterPointTypes('display');
                        case 'Device Point':
                        case 'Sequence Device':
                            return filterPointTypes('device');
                        case 'Feedback Point':
                        case 'Interlock Point':
                        case 'Select Input':
                        case 'Shutdown Point':
                        case 'Trigger Point':
                        case "Occupied Input":
                            return filterPointTypes('enum');
                        case 'Remote Unit Point':
                            return filterPointTypes('remote');
                        case 'Sensor Point':
                            return filterPointTypes('sensor');
                        case 'Point Register':
                            return filterPointTypes('register');
                        case 'Occupied Point':
                        case 'Control Point':
                            if (typeof pointType === 'undefined') {
                                return filterPointTypes('control');
                            } else {
                                switch (pointType) {
                                    case 'Alarm Status':
                                    case 'Binary Selector':
                                    case 'Comparator':
                                    case 'Delay':
                                    case 'Digital Logic':
                                    case 'Duty Cycle':
                                    case 'Imux Watchdog':
                                    case 'Logic':
                                    case 'Optimum Start':
                                        return filterPointTypes('enumControl');
                                    case 'Analog Selector':
                                    case 'Average':
                                    case 'Economizer':
                                    case 'Enthalpy':
                                    case 'Math':
                                    case 'Multiplexer':
                                    case 'Proportional':
                                    case 'Ramp':
                                    case 'Select Value':
                                    case 'Setpoint Adjust':
                                    case 'Totalizer':
                                        return filterPointTypes('floatControl');
                                    case 'Schedule Entry':
                                        return filterPointTypes('schedEntry');
                                    case 'Sequence':
                                    case 'Report':
                                        return filterPointTypes('control');
                                    default:
                                        return {
                                            error: 'Point Type not recognized for ' + property + ' property. Received "' + pointType + '".'
                                        };
                                }
                            }
                            break;
                        case 'Monitor Point':
                            if (typeof pointType === 'undefined') {
                                return filterPointTypes('value');
                            } else {
                                switch (pointType) {
                                    case 'Alarm Status':
                                        return filterPointTypes('value');
                                    case 'Binary Value':
                                    case 'Delay':
                                        return filterPointTypes('enum');
                                    case 'Analog Selector':
                                    case 'Analog Value':
                                    case 'Binary Selector':
                                    case 'Optimum Start':
                                    case 'Proportional':
                                    case 'Ramp':
                                    case 'Setpoint Adjust':
                                    case 'Totalizer':
                                        return filterPointTypes('float');
                                    case 'Sequence':
                                        return filterPointTypes('gpl');
                                    case 'Report':
                                        return filterPointTypes('value');
                                    default:
                                        return {
                                            error: 'Point Type not recognized for Monitor Point property. Received "' + pointType + '".'
                                        };
                                }
                            }
                            break;

                        case 'Input Point 1':
                            if (typeof pointType === 'undefined') pointType = 'undefined';
                            switch (pointType) {
                                case 'Average':
                                case 'Comparator':
                                case 'Logic':
                                case 'Select Value':
                                case 'Multiplexer':
                                    return filterPointTypes('value');
                                case 'Math':
                                    return filterPointTypes('math');
                                case 'Digital Logic':
                                    return filterPointTypes('enum');
                                case 'Report':
                                    return filterPointTypes('default');
                                default:
                                    return {
                                        error: 'Point Type not recognized for Input Point 1 property. Received "' + pointType + '".'
                                    };
                            }
                            break;
                        case 'Input Point 2':
                            if (typeof pointType === 'undefined') pointType = 'undefined';
                            switch (pointType) {
                                case 'Average':
                                case 'Comparator':
                                case 'Logic':
                                case 'Select Value':
                                case 'Multiplexer':
                                    return filterPointTypes('value');
                                case 'Digital Logic':
                                    return filterPointTypes('enum');
                                case 'Math':
                                    return filterPointTypes('float');
                                case 'Report':
                                    return filterPointTypes('default');
                                default:
                                    return {
                                        error: 'Point Type not recognized for Input Point 2 property. Received "' + pointType + '".'
                                    };
                            }
                            break;
                        case 'Input Point 3':
                        case 'Input Point 4':
                        case 'Input Point 5':
                            if (typeof pointType === 'undefined') pointType = 'undefined';
                            switch (pointType) {
                                case 'Average':
                                case 'Logic':
                                case 'Select Value':
                                    return filterPointTypes('value');
                                case 'Report':
                                    return filterPointTypes('default');
                                default:
                                    return {
                                        error: 'Point Type not recognized for ' + property + ' property. Received "' + pointType + '".'
                                    };
                            }
                            break;
                        case 'Script Point':
                            return filterPointTypes('script');
                        case "Damper Control Point":
                        case "Heat 1 Control Point":
                            return filterPointTypes('floatControl');
                        case "Digital Heat 1 Control Point":
                        case "Digital Heat 2 Control Point":
                        case "Digital Heat 3 Control Point":
                        case "Fan Control Point":
                        case "Lights Control Point":
                            return filterPointTypes('enumControl');
                        case "Column Point":
                            return filterPointTypes('value');
                            // Begin Lift Station point properties
                        case "High Level Float Point":
                        case "Lag Level Float Point":
                        case "Lead Level Float Point":
                        case "Off Level Float Point":
                        case "Low Level Float Point":
                            return filterPointTypes(['bi', 'bv']);
                        case "Flow Rate Point":
                        case "Level Sensor Point":
                            return filterPointTypes(['ai', 'av']);
                        case "Light Control Point":
                        case "Horn Control Point":
                        case "Auxiliary Control Point":
                            return filterPointTypes(['bo', 'bv']);
                        case "Float Alarm Point":
                        case "Runtime Alarm Point":
                            return filterPointTypes('bv');
                        case "Power Fail Point":
                            return filterPointTypes('bi');
                        case "Flow Total Point":
                            return filterPointTypes('av');
                        case "Pump 1 Control Point":
                        case "Pump 2 Control Point":
                            return filterPointTypes(['bi', 'bo', 'bv']);
                            // End Lift Station point properties
                        default:
                            return {
                                error: 'Property not recognized. Received "' + property + '".'
                            };
                    }
                },
                _getPointTypeNameFromEnum = function(enumeration) {
                    return obj.revEnums['Point Types'][enumeration];
                },
                _getUIEndpoint = function(pointType, id) {
                    var endPoints = JSON.parse(JSON.stringify(enumsTemplatesJson.Enums.endPoints)),
                        endPoint;

                    //in case we only have the enum

                    if (typeof pointType === 'number') {
                        pointType = _getPointTypeNameFromEnum(pointType);
                    }

                    if (typeof types[pointType] === 'undefined') throw new Error('Unrecognized Point Type');

                    endPoint = endPoints[types[pointType].endpoint];

                    if (endPoint) {
                        if (endPoint.review) {
                            endPoint.review.url = endPoint.review.url.replace(/{id}/g, id);
                        }

                        if (endPoint.edit) {
                            endPoint.edit.url = endPoint.edit.url.replace(/{id}/g, id);
                        }
                    }

                    return endPoint;
                },
                _getEnums = function(property, pointType, options) {
                    var workspace = (typeof window != 'undefined') && window.workspaceManager,
                        set = [],
                        _hasPointType = !!pointType;

                    switch (property) {
                        case 'Alarm Class':
                            return _getEnumFromTemplate('Alarm Classes');
                        case 'Alarm State':
                            return _getEnumFromTemplate('Alarm States');
                        case 'Control Priority':
                            return workspace && workspace.systemEnums.controlpriorities;
                        case 'Controller':
                            return workspace && workspace.systemEnums.controllers;
                        case 'Conversion Type':
                            return _getEnumFromTemplate('Conversion Types');
                        case 'Device Status':
                            return _getEnumFromTemplate('Device Statuses');
                        case 'Ethernet Protocol':
                            return _getEnumFromTemplate('Ethernet Protocols');
                        case 'Fail Action':
                            return _getEnumFromTemplate('Fail Actions');
                        case 'Input Rate':
                            return _getEnumFromTemplate('Input Rate');
                        case 'Model Type':
                            if (pointType === 'Device') {
                                return _getEnumFromTemplate('Device Model Types');
                            }
                            if (pointType === 'Remote Unit') {
                                return _getEnumFromFunction(pointType, options);
                            }
                            set.push.apply(set, _getEnumFromTemplate('Device Model Types'));
                            set.push.apply(set, _getEnumFromTemplate('Remote Unit Model Types'));
                            return set;
                        case 'Point Type':
                            return _getEnumFromTemplate('Point Types');
                        case 'Close Polarity':
                        case 'Feedback Polarity':
                        case 'Polarity':
                            return _getEnumFromTemplate('Polarities');
                        case 'Control Data Type':
                        case 'Off Control Data Type':
                        case 'On Control Data Type':
                        case 'Poll Data Type':
                            return _getEnumFromTemplate('Modbus Data Types');
                        case 'Control Function':
                        case 'Off Control Function':
                        case 'On Control Function':
                        case 'Poll Function':
                            return _getEnumFromTemplate('Modbus Poll Functions');
                        case 'Modbus Order':
                            return _getEnumFromTemplate('Modbus Orders');
                        case 'Port 1 Prototcol':
                        case 'Port 2 Prototcol':
                        case 'Port 3 Prototcol':
                        case 'Port 4 Prototcol':
                            return _getEnumFromTemplate('Port Protocols');
                        case 'Reliability':
                            return _getEnumFromTemplate('Reliabilities');
                        case 'Reset Interval':
                            return _getEnumFromTemplate('Reset Intervals');
                        case 'Sensor Type':
                            return _getEnumFromTemplate('Sensor Types');
                        case 'Report Type':
                            return _getEnumFromTemplate('Report Types');
                        default:
                            return _getEnumFromTemplate(property);
                    }

                    function _getEnumFromFunction(pointType, options) {
                        var valueOptions = {};
                        switch (pointType) {
                            case 'Remote Unit':
                                valueOptions = Config.Utility.getRmuValueOptions(options.devModel);
                                break;
                        }

                        return _buildOptionsArray(valueOptions);
                    }

                    function _buildOptionsArray(options) {
                        var optionsArray = [];
                        for (var key in options) {
                            optionsArray.push({
                                name: key,
                                value: options[key].hasOwnProperty('enum') ? options[key].enum : options[key],
                                noninitializable: false
                            });
                        }
                        return optionsArray;
                    }

                    function _getEnumFromTemplate(property) {
                        var enums = enumsTemplatesJson.Enums[property],
                            enumsProperty = enumsTemplatesJson.Enums.Properties[property],
                            enumArray;

                        enumArray = _buildOptionsArray(enums);
                        if (!enumArray.length && !!enumsProperty && !!enumsProperty["enumsSet"]) {
                            enumArray = _buildOptionsArray(enumsTemplatesJson.Enums[enumsProperty["enumsSet"]]);
                        }

                        /*for (var i = 0, last = keys.length; i < last; i++) {
                            if (_hasPointType) {
                                item = {
                                    name: keys[i],
                                    value: enums[keys[i]].enum,
                                    noninitializable: enums[keys[i]].noninitializable
                                };
                            } else {
                                item = keys[i];
                            }
                            enumArray.push(item);
                        }

                        if (!!enumsProperty && !!enumsProperty["enumsSet"]) {
                            enumsSetKey = enumsProperty["enumsSet"];
                        }

                        if (property && enumsSetKey) {
                            enumsSetKey = enumsSetKey;
                            if (enumsSetKey !== undefined && enumsSetKey !== "") {
                                enumsSet = enumsTemplatesJson.Enums[enumsSetKey];
                                for (var key in enumsSet) {
                                    if (enumsSet.hasOwnProperty(key)) {
                                        enumArray.push({
                                            name: key,
                                            value: enumsSet[key].enum,
                                            noninitializable: false
                                        });
                                    }
                                }
                            }
                        }*/

                        if (!enums && enumArray.length === 0) enumArray = null;

                        return enumArray;
                    }
                },
                _getTypes = function() {
                    var _enum = filterPointTypes('enum'),
                        _float = filterPointTypes('float'),
                        c,
                        ret = {};

                    for (c = 0; c < _enum.length; c++) {
                        ret[_enum[c].key] = 'enum';
                    }

                    for (c = 0; c < _float.length; c++) {
                        ret[_float[c].key] = 'float';
                    }

                    return ret;
                };

            return {
                getPointTypeNameFromEnum: _getPointTypeNameFromEnum,
                getAllowedPointTypes: _getAllowedPointTypes,
                getAllPointTypes: _getAllPointTypes,
                getUIEndpoint: _getUIEndpoint,
                getEnums: _getEnums,
                getTypes: _getTypes
            };
        })(),

        validateReferencePointType: function(property, pointType, refPoint) {
            var allowedPointTypes = this.pointTypes.getAllowedPointTypes(property, pointType),
                len,
                i;

            // If this property/point type combination doesn't yield any allowed point types
            if (allowedPointTypes.hasOwnProperty("error")) {
                return false;
            }

            len = allowedPointTypes.length;
            // allowedPointTypes is an array of objects of the form: {key: Point Type, enum: Point Type Enum}
            for (i = 0; i < len; i++) {
                if (refPoint["Point Type"].eValue === allowedPointTypes[i].enum) {
                    return true; // Return validation success
                }
            }
            return false; // Return validation error
        },

        getPropertyObject: function(property, point) {
            var len;
            if (point !== null && property !== null) {
                if (typeof property === "number") {
                    return point["Point Refs"][property];
                } else {
                    if (point.hasOwnProperty(property)) {
                        return point[property];
                    }

                    // Sicne we arrived here, the property must live in the point refs array if it is present. 
                    // All point types do not have the "Point Refs" property (Imux, Display, and Schedule), so 
                    // we must check that it exists first...
                    if (point.hasOwnProperty("Point Refs")) {
                        len = point["Point Refs"].length;

                        for (var i = 0; i < len; i++) {
                            if (point["Point Refs"][i].PropertyName === property)
                                return point["Point Refs"][i];
                        }
                    }
                }
            }
            return null;
        },

        getPointRefProperties: function(point) {
            var props = [];
            for (var i = 0; i < point["Point Refs"].length; i++) {
                props.push(point["Point Refs"][i].PropertyName);
            }
            return props;
        },

        getPointRegister: function(pointRefs, key, value) {
            var i,
                refVal,
                len = pointRefs.length;

            for (i = 0; i < len; i++) {
                if (typeof pointRefs[i][key] === "function") {
                    refVal = pointRefs[i][key]();
                } else {
                    refVal = pointRefs[i][key];
                }

                if (refVal === value) {
                    return pointRefs[i];
                }
            }
            return null;
        },

        getNameFromEnum: function(enumCollection, enumValue) {
            if (typeof(enumCollection) === 'string') {
                if (!(enumCollection = enumsTemplatesJson.Enums[enumCollection])) {
                    return undefined;
                }
            }
            for (var key in enumCollection) {
                if (enumCollection[key].enum === enumValue)
                    return key;
            }
            return undefined;
        },

        setPropsDisplayable: function(point, props, val) {
            var len = props.length;

            for (var i = 0; i < len; i++) {
                point[props[i]].isDisplayable = val;
            }
        },

        setModbusPropsDisp: function(point) {
            var props = ["Control Data Type", "Control Function", "Control Register", "On Control Data Type", "On Control Function", "On Control Register", "On Control Value", "Off Control Data Type", "Off Control Function", "Off Control Register", "Off Control Value"];

            point["Poll Register"].isDisplayable = true;
            point["Poll Data Type"].isDisplayable = true;
            if (obj.Utility.checkMicroScan5Device(point)) {
                point["Modbus Order"].isDisplayable = true;
            }
            if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"]) {
                point["Poll Function"].isDisplayable = true;
                props.forEach(function(prop) {
                    if (point.hasOwnProperty(prop)) {
                        point[prop].isDisplayable = true;
                    }
                });
            }
        },

        checkValueOptions: function(prop) {
            var opts = prop.ValueOptions,
                key = Object.keys(opts)[0],
                eVal = prop.eValue;

            for (var val in opts) {
                if (opts[val] === eVal) {
                    prop.Value = val;
                    return;
                }
            }
            prop.Value = key; // unknown eValue
            prop.eValue = opts[key];
        },

        setupPropValueOptions: function(prop, opts) {
            prop.isDisplayable = true;
            prop.ValueOptions = opts;
            obj.Utility.checkValueOptions(prop);
        },

        setChannelOptions: function(prop, min, max) {
            var i,
                opts = {};

            for (i = min; i <= max; i++) {
                opts[i.toString()] = i;
            }
            obj.Utility.setupPropValueOptions(prop, opts);
        },

        checkMicroScan5Device: function(point) {
            var devTypes = enumsTemplatesJson.Enums["Device Model Types"],
                ms5Types = [
                    devTypes["MicroScan 5 UNV"].enum,
                    devTypes["MicroScan 5 xTalk"].enum,
                    devTypes["SCADA Vio"].enum,
                    devTypes["SCADA IO"].enum,
                    devTypes["Unknown"].enum
                ];

            if (ms5Types.indexOf(point._devModel) > -1) {
                return true;
            }
            return false;
        },

        checkMicroScan4Device: function(point) {
            var devTypes = enumsTemplatesJson.Enums["Device Model Types"],
                ms4Types = [
                    devTypes["MicroScan 4 UNV"].enum,
                    devTypes["MicroScan 4 xTalk"].enum,
                    devTypes["MicroScan 4 Digital"].enum
                ];

            if (ms4Types.indexOf(point._devModel) > -1) {
                return true;
            }
            return false;
        },

        checkMicroScanRMU: function(point) {
            var rmuTypes = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                msTypes = [
                    rmuTypes["MS3 RT"].enum,
                    rmuTypes["MS 3 EEPROM"].enum,
                    rmuTypes["MS 3 Flash"].enum,
                    rmuTypes["MS 4 VAV"].enum
                ];

            if (msTypes.indexOf(point._rmuModel) > -1) {
                return true;
            }
            return false;
        },

        checkModbusRMU: function(point) {
            var rmuTypes = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                modbusTypes = [
                    rmuTypes["Liebert"].enum,
                    rmuTypes["Sierra Steam Meter"].enum,
                    rmuTypes["Siemens Power Meter"].enum,
                    rmuTypes["Ingersol Rand Intellysis"].enum,
                    rmuTypes["PowerLogic 3000 Meter"].enum,
                    rmuTypes["Generic Modbus"].enum,
                    rmuTypes["PowerTraks 9000"].enum,
                    rmuTypes["Programmable Modbus"].enum
                ];

            if (modbusTypes.indexOf(point._rmuModel) > -1) {
                return true;
            }
            return false;
        },

        checkPointDeviceRMU: function(point) {
            var rmuOpt,
                eTyp = enumsTemplatesJson.Enums["Point Types"],
                eDev = enumsTemplatesJson.Enums["Device Model Types"],
                eRel = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"],
                rmuModel = obj.revEnums["Remote Unit Model Types"][point._rmuModel];

            if ((obj.revEnums["Device Model Types"][point._devModel] === undefined) || (point._devModel === eDev["Central Device"]["enum"]) || (point._devModel === eDev["Unknown"]["enum"])) {
                return enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            } else if (rmuModel === undefined) {
                return eRel;
            } else if (rmuModel === "Unknown") {
                switch (point["Point Type"].eValue) {
                    case eTyp["Analog Input"]["enum"]:
                    case eTyp["Analog Output"]["enum"]:
                    case eTyp["Binary Output"]["enum"]:
                    case eTyp["Accumulator"]["enum"]:
                        switch (point._devModel) {
                            case eDev["MicroScan 5 UNV"]["enum"]:
                            case eDev["SCADA Vio"]["enum"]:
                            case eDev["SCADA IO"]["enum"]:
                            case eDev["MicroScan 4 UNV"]["enum"]:
                            case eDev["MicroScan 4 Digital"]["enum"]:
                                break;

                            default:
                                return eRel;
                        }
                        break;

                    case eTyp["Binary Input"]["enum"]:
                        switch (point._devModel) {
                            case eDev["MicroScan 5 xTalk"]["enum"]:
                            case eDev["MicroScan 4 xTalk"]["enum"]:
                                return eRel;

                            default:
                                break;
                        }
                        break;

                    case eTyp["MultiState Value"]["enum"]:
                        switch (point._devModel) {
                            case eDev["MicroScan 5 UNV"]["enum"]:
                            case eDev["MicroScan 5 xTalk"]["enum"]:
                            case eDev["SCADA Vio"]["enum"]:
                            case eDev["SCADA IO"]["enum"]:
                            case eDev["MicroScan 4 UNV"]["enum"]:
                            case eDev["MicroScan 4 Digital"]["enum"]:
                            case eDev["MicroScan 4 xTalk"]["enum"]:
                                break;

                            default:
                                return eRel;
                        }
                        break;

                    case eTyp["VAV"]["enum"]:
                        return eRel;

                    default:
                        break;
                }
            } else {
                rmuOpt = obj.Utility.getRmuValueOptions(point._devModel);

                if (rmuOpt[rmuModel] === undefined) {
                    return eRel;
                } else {
                    switch (point["Point Type"].eValue) {
                        case eTyp["Analog Input"]["enum"]:
                        case eTyp["Analog Output"]["enum"]:
                        case eTyp["Binary Input"]["enum"]:
                        case eTyp["Binary Output"]["enum"]:
                        case eTyp["Remote Unit"]["enum"]:
                            break;

                        case eTyp["Analog Value"]["enum"]:
                        case eTyp["Binary Value"]["enum"]:
                            switch (rmuModel) {
                                case "MS3 RT":
                                case "MS 3 EEPROM":
                                case "MS 3 Flash":
                                case "MS 4 VAV":
                                case "BACnet":
                                case "N2 Device":
                                    break;

                                default:
                                    return eRel;
                            }
                            break;

                        case eTyp["MultiState Value"]["enum"]:
                            switch (rmuModel) {
                                case "MS3 RT":
                                case "MS 3 EEPROM":
                                case "MS 3 Flash":
                                case "MS 4 VAV":
                                case "N2 Device":
                                case "IFC Remote Unit":
                                    return eRel;

                                default:
                                    break;
                            }
                            break;

                        case eTyp["Accumulator"]["enum"]:
                            if (rmuModel === "MS 4 VAV") {
                                return eRel;
                            }
                            break;

                        case eTyp["Logic"]["enum"]:
                        case eTyp["Analog Selector"]["enum"]:
                        case eTyp["Binary Selector"]["enum"]:
                        case eTyp["Delay"]["enum"]:
                        case eTyp["Math"]["enum"]:
                        case eTyp["Setpoint Adjust"]["enum"]:
                        case eTyp["Proportional"]["enum"]:
                        case eTyp["Average"]["enum"]:
                        case eTyp["Select Value"]["enum"]:
                        case eTyp["Economizer"]["enum"]:
                        case eTyp["Enthalpy"]["enum"]:
                            if ((rmuModel !== "MS3 RT") && (rmuModel !== "MS 3 EEPROM") && (rmuModel !== "MS 3 Flash")) {
                                return eRel;
                            }
                            break;

                        case eTyp["VAV"]["enum"]:
                            if (rmuModel !== "MS 4 VAV") {
                                return eRel;
                            }
                            break;

                        default:
                            return eRel;
                    }
                }
            }
            return enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"];
        },

        getRmuValueOptions: function(devModel) {
            var eRmu = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                eDev = enumsTemplatesJson.Enums["Device Model Types"];

            switch (devModel) {

                case eDev["MicroScan 5 UNV"]["enum"]:
                case eDev["MicroScan 5 xTalk"]["enum"]:
                case eDev["SCADA Vio"]["enum"]:
                case eDev["SCADA IO"]["enum"]:
                case eDev["MicroScan 4 Digital"]["enum"]:
                case eDev["MicroScan 4 xTalk"]["enum"]:
                case eDev["MicroScan 4 UNV"]["enum"]:
                    return {
                        "MS3 RT": eRmu["MS3 RT"]["enum"],
                        "MS 3 EEPROM": eRmu["MS 3 EEPROM"]["enum"],
                        "MS 3 Flash": eRmu["MS 3 Flash"]["enum"],
                        "MS 4 VAV": eRmu["MS 4 VAV"]["enum"],
                        "BACnet": eRmu["BACnet"]["enum"],
                        "Programmable Modbus": eRmu["Programmable Modbus"]["enum"],
                        "N2 Device": eRmu["N2 Device"]["enum"],
                        "Liebert": eRmu["Liebert"]["enum"],
                        "Sierra Steam Meter": eRmu["Sierra Steam Meter"]["enum"],
                        "Siemens Power Meter": eRmu["Siemens Power Meter"]["enum"],
                        "Ingersol Rand Intellysis": eRmu["Ingersol Rand Intellysis"]["enum"],
                        "PowerLogic 3000 Meter": eRmu["PowerLogic 3000 Meter"]["enum"],
                        "Generic Modbus": eRmu["Generic Modbus"]["enum"],
                        "PowerTraks 9000": eRmu["PowerTraks 9000"]["enum"]
                    };

                case eDev["MicroScan Interface Device"]["enum"]:
                    return {
                        "MS3 RT": eRmu["MS3 RT"]["enum"],
                        "MS 3 EEPROM": eRmu["MS 3 EEPROM"]["enum"],
                        "MS 3 Flash": eRmu["MS 3 Flash"]["enum"]
                    };

                case eDev["Field Interface Device"]["enum"]:
                    return {
                        "IFC Remote Unit": eRmu["IFC Remote Unit"]["enum"]
                    };

                case eDev["Staefa Interface Device"]["enum"]:
                    return {
                        "Smart II Remote Unit": eRmu["Smart II Remote Unit"]["enum"]
                    };

                case eDev["N2 Interface Device"]["enum"]:
                    return {
                        "N2 Device": eRmu["N2 Device"]["enum"]
                    };

                case eDev["Sierra Steam Meter Device"]["enum"]:
                    return {
                        "Sierra Steam Meter": eRmu["Sierra Steam Meter"]["enum"]
                    };

                case eDev["Armstrong SteamEye Device"]["enum"]:
                    return {
                        "ASE Remote Unit": eRmu["ASE Remote Unit"]["enum"]
                    };

                case eDev["Siemens Power Meter Device"]["enum"]:
                    return {
                        "Siemens Power Meter": eRmu["Siemens Power Meter"]["enum"]
                    };

                case eDev["Ingersol Rand Intellysis Device"]["enum"]:
                    return {
                        "Ingersol Rand Intellysis": eRmu["Ingersol Rand Intellysis"]["enum"]
                    };

                case eDev["BACnet Interface Device"]["enum"]:
                    return {
                        "BACnet": eRmu["BACnet"]["enum"]
                    };

                default:
                    return {
                        "Unknown": eRmu["Unknown"]["enum"]
                    };
            }
        },

        updDevModel: function(data) {
            //applyAnalogInputDevModel
            var fxName = "apply" + data.point["Point Type"].Value.split(' ').join('') + "DevModel";
            if (!!obj.EditChanges.hasOwnProperty(fxName)) {
                data.point._cfgRequired = true;
                obj.EditChanges[fxName](data);
            }
        }
    };

    obj.Update = {

        //--------------------------------------------------------------------------------------------
        //    Function: formatPoint()
        // Description: This function calls the appropriate validation routine for the property
        //              being updated. The validation routine returns the data object with the
        //              'data.ok' key set to boolean true or false to indicate the validation result. 
        //              If 'data.ok' is false, a 'data.result' is also included to explain the 
        //              validation error.
        //  Parameters: data -  An object with the following keys:
        //                      point    - Modified point object
        //                      oldPoint - Unmodified point object
        //                      refPoint - Referenced point object *May not be present
        //                      property - string identifying the edited property
        //     Returns: An updated point object if successful, error object otherwise.
        //       Notes:
        // Rev.  1.00  xx/xx/xxxx  XXX   Original Issue
        //--------------------------------------------------------------------------------------------
        formatPoint: function(data) {
            // display dyn, disp anim, disp button, disp trend, slide display, point reg
            var maxFloat = Math.pow(10, 36),
                minFloat = maxFloat * (-1),
                i,
                len,
                value = null,
                valueType = 0,
                pointType = data.point["Point Type"].Value,
                pointTemplate = obj.Templates.getTemplate(pointType);

            data.ok = false; // Add 'ok' key and preset for validation fail

            if ((data.propertyObject = obj.Utility.getPropertyObject(data.property, data.point)) === null) {
                data.result = "Bad property name";
                return {
                    "err": data.result
                };
            }

            if (typeof data.property === "number")
                data.property = data.propertyObject.PropertyName;

            // The UI does not include the refPoint key if the property doesn't have a refernce point, so let's add it (CYB).
            if (data.hasOwnProperty("refPoint") === false) { // If the refPoint key doesn't exist
                data.refPoint = null; // Add refPoint key
            }

            // If this is an INVALID property for this point type (CYB)
            if (pointTemplate.hasOwnProperty(data.property) === true) {
                data.ok = true;
            } else {
                var ptRefProps = obj.Enums['Point Types'][pointType].ptRefProps;
                if (ptRefProps.indexOf(data.property) >= 0) {
                    data.ok = true;
                }
            }

            if (data.ok === false) {
                data.result = "Internal validation error. Point type '" + pointType + "' does not support this property.";
            } else {
                value = data.propertyObject.Value;

                if (typeof data.propertyObject === 'string') {
                    // TODO LMH valueTYpe recommendation for props name1, name2, name3, name4
                    valueType = enumsTemplatesJson.Enums["Value Types"]["None"]["enum"];
                } else if (data.propertyObject.hasOwnProperty("ValueType")) {
                    valueType = data.propertyObject.ValueType;
                } else {
                    valueType = enumsTemplatesJson.Enums["Value Types"]["UniquePID"]["enum"];
                }

                // If this property is a reference point
                if ((valueType === enumsTemplatesJson.Enums["Value Types"]["UniquePID"]["enum"])) {
                    // Verify reference point is correct point type
                    if (value !== 0 && !!data.refPoint)
                        if (obj.Utility.validateReferencePointType(data.property, data.point["Point Type"].Value, data.refPoint) === false) {
                            data.ok = false;
                            data.result = "Invalid point type for this property.";
                        } else if (data.refPoint._id === data.point._id) {
                        data.ok = false;
                        data.result = data.property + " cannot be set to itself.";
                    }
                }
                // If this property is a number type
                else if ((valueType === enumsTemplatesJson.Enums["Value Types"]["Float"]["enum"]) ||
                    (valueType === enumsTemplatesJson.Enums["Value Types"]["Integer"]["enum"]) ||
                    (valueType === enumsTemplatesJson.Enums["Value Types"]["Unsigned"]["enum"])) {

                    if (obj.Utility.isNumber(value) === false) {
                        data.ok = false;
                        data.result = "The value entered contains invalid characters. It must be a number.";
                        // Make sure float values are within the limits of a single precision float (with some padding)
                    } else if (valueType === enumsTemplatesJson.Enums["Value Types"]["Float"]["enum"]) {
                        if (value > maxFloat) {
                            data.ok = false;
                            data.result = data.property + " must be less than " + maxFloat + " (that's a 1 with 36 zeroes!).";
                        } else if (value < minFloat) {
                            data.ok = false;
                            data.result = data.property + " must be greater than " + minFloat + " (that's a -1 with 36 zeroes!).";
                        }
                    }
                }
            }

            if (data.ok === true) { // If no errors encountered so far
                if (valueType === enumsTemplatesJson.Enums["Value Types"]["UniquePID"]["enum"]) {
                    obj.EditChanges.applyUniquePIDLogic(data);
                }

                if (obj.EditValidation.hasOwnProperty(data.property)) { // Make sure EditValidation has a handler for this property before calling it
                    data = obj.EditValidation[data.property](data); // Validate the updated property
                    // TODO remove debug code for production
                    // debug code (for testing purposes only)
                } else {
                    console.log("No validation routine for property: " + data.property);
                }
            }

            if (data.ok === true) { // If the property validation succeeded

                // If this property has 'Value' and 'ValueOptions' keys
                if ((data.point.hasOwnProperty('Value')) && (data.point.Value.hasOwnProperty('ValueOptions'))) {
                    // If Value.ValueOptions changed
                    if (_.isEqual(data.oldPoint.Value.ValueOptions, data.point.Value.ValueOptions) === false) {
                        var enumProps = ["Value", "Alarm Value", "Authorized Value", "Default Value", "Inactive Value", "Shutdown Value", "Active Value"];

                        len = enumProps.length;
                        // Update the properties that are affected by a change in Value.ValueOptions
                        for (i = 0; i < len; i++) {
                            data.point = obj.EditChanges.applyPropertyEnumSet(data.point, enumProps[i], data.point.Value.ValueOptions);
                        }
                    }
                }

                return data.point; // Return the updated point
            } else { // Validation failed!
                return {
                    "err": data.result,
                    "truncate": data.truncate,
                    "maxLength": data.maxLength
                }; // Return an error object
            }
        }
    };

    obj.EditValidation = {

        //------------------------------------------------------------------------------------------------------------------------------
        //------ BEGIN COMMON VALIDATION HANDLERS (THESE ARE CALLED BY MULTIPLE EDITVALIDATION MEMBERS) --------------------------------
        //------------------------------------------------------------------------------------------------------------------------------

        validateUsingTheseLimits: function(data, min, max) {
            var val = data.propertyObject.Value; // Property Value

            if (val < min) {
                data.ok = false;
                data.result = data.property + " cannot be less than " + min + ".";
            } else if (val > max) {
                data.ok = false;
                data.result = data.property + " cannot be greater than " + max + ".";
            }
            return data;
        },

        validatePortNAddress: function(data) {
            data = this.validateUsingTheseLimits(data, 0, 127);
            return data;
        },

        validateNetworkNumber: function(data) {
            var point = data.point,
                val = data.propertyObject.Value,
                networkConfig = data.networkConfig,
                props = ["Port 1 Network", "Port 2 Network", "Port 3 Network", "Port 4 Network", "Downlink Network", "Ethernet Network"],
                prop,
                len = props.length,
                i;

            if (val !== 0) {
                for (i = 0; i < len; i++) {
                    prop = props[i];

                    // Make sure this isn't the property we're editing, and it exists on the point (CYB)
                    if ((prop !== data.property) && point.hasOwnProperty(prop)) {
                        // If this communications port is in use and the user-entered network number is the same as the Port N Network number
                        if ((point[prop].isDisplayable === true) && (val === point[prop].Value)) {
                            data.ok = false;
                            data.result = "Please enter a network number different from the " + prop + " number.";
                            break;
                        }
                    }
                }
                if ((data.ok === true) && (['Ethernet Network', 'Downlink Network', 'Network Segment'].indexOf(data.property) >= 0)) {
                    var validNetwork = false;
                    for (i = 0; i < networkConfig.length; i++) {
                        if (parseInt(networkConfig[i]['IP Network Segment'], 10) === val) {
                            validNetwork = true;
                            break;
                        }
                    }
                    if (!validNetwork) {
                        data.ok = false;
                        data.result = "Please enter a network number listed in System Network Configuration.";
                    }
                }
            }
            return data;
        },

        validatePortNNetwork: function(data) {
            // data = this.validateUsingMaxMinKeys(data);
            data = this.validateUsingTheseLimits(data, 0, 65535);
            if (data.ok === true) {
                data = this.validateNetworkNumber(data); // Check if donwlink network number matches one of the serial port network numbers
            }
            return data;
        },

        validatePortNProtocol: function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                type = point["Point Type"].Value; // Point type

            data.point = obj.EditChanges.applyDevicePortNProtocol(data);
            return data;
        },

        validateChannelUniqueness: function(data, prop) {
            var point = data.point;

            if (data.propertyObject.Value === point[prop].Value) {
                data.ok = false;
                data.result = data.property + " number cannot be the same as the " + prop + " number.";
            }
            return data;
        },

        validateName: function(data) {
            var point = data.point,
                hasEmpty = false;

            for (var i = 1; i < 5 && data.ok; i++) {
                if (point['name' + i] === '') {
                    if (i === 1) {
                        data.ok = true;
                        data.result = "The first name segment cannot be empty.";
                    }
                    hasEmpty = true;
                } else if (hasEmpty) {
                    data.ok = false;
                    data.result = "Blank spaces between name segments is not allowed.";
                }
            }
        },

        //------------------------------------------------------------------------------------------------------------------------------
        //------ BEGIN NON POINT TYPE SPECIFIC PROPERTIES ------------------------------------------------------------------------------
        //------------------------------------------------------------------------------------------------------------------------------

        "Active Text": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                len = val.length, // String length
                maxLength = 40;

            data.ok = false; // Add 'ok' key and preset for validation fail

            if (len < 1) {
                data.result = data.property + " must have at least one character.";
            } else if (len > maxLength) {
                data.truncate = true;
                data.maxLength = maxLength;
                data.result = data.property + " cannot be more than " + maxLength + " characters.";
            } else if (val.toLowerCase() === point["Inactive Text"].Value.toLowerCase()) {
                data.result = data.property + " must be different from the Inactive Text.";
            } else {
                data.ok = true;
                data.point = obj.EditChanges.applyActiveText(data);
            }
            return data;
        },

        //------ Analog alarm properties validation ------------------------------------------
        "Alarm Deadband": function(data) {

            if (data.propertyObject.Value < 0.0) {
                data.ok = false;
                data.result = data.property + " must be greater than or equal to 0.0";
            }
            return data;
        },

        "Alarm Adjust Band": function(data) {
            return obj.EditValidation["Alarm Deadband"](data);
        },

        "Warning Adjust Band": function(data) {
            return obj.EditValidation["Alarm Deadband"](data);
        },

        "High Alarm Limit": function(data) {
            return data;
        },

        "Low Alarm Limit": function(data) {
            return data;
        },

        "High Warning Limit": function(data) {
            return data;
        },

        "Low Warning Limit": function(data) {
            return data;
        },

        "Enable Warning Alarms": function(data) {
            data.point = obj.EditChanges.applyEnableWarningAlarms(data);
            return data;
        },
        //------ End analog alarm properties validation --------------------------------------

        "Alarm Repeat Time": function(data) {
            if (data.propertyObject.Value < 60) {
                data.ok = false;
                data.result = data.property + " cannot be less than 1 minute.";
            }
            return data;
        },

        "Alarm Repeat Enable": function(data) {
            data.point = obj.EditChanges.applyAlarmRepeatEnable(data);
            return data;
        },

        "Alarm State": function(data) {
            data.ok = false;
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "APDU Retries": function(data) {
            data = this.validateUsingTheseLimits(data, 0, 5);
            return data;
        },

        "APDU Timeout": function(data) {
            data = this.validateUsingTheseLimits(data, 5, 60);
            return data;
        },

        // TODO LMH: “0 indicates day/month/year is not used.  Otherwise, valid range is 1-31/1-12/1900-2154.  We may want to add 'Day Enable'/'Month Enable'/‘Year Enable’ keys.
        // Bing Day.Min = 0 will need to be changed to 1 if we create a 'Begin Day Enable' property
        // When reviewing with LMH, decide how we're going to handle this and alert team of the change.
        "Begin Day": function(data) {
            return this.validateUsingTheseLimits(data, 0, 31);
        },

        "Begin Month": function(data) {
            return this.validateUsingTheseLimits(data, 0, 12);
        },

        "Begin Year": function(data) {
            return this.validateUsingTheseLimits(data, 0, 2154);
        },

        "Broadcast Enable": function(data) {
            data.point = obj.EditChanges[data.property](data); // Call apply logic
            return data;
        },

        "Close Channel": function(data) {
            this.validateChannelUniqueness(data, "Open Channel");
            return data;
        },

        "Control Band Value": function(data) {
            var point = data.point,
                val = data.propertyObject.Value;

            if (val < 0) {
                data.ok = false;
                data.result = data.property + " cannot be less than 0.0";
            }
            return data;
        },

        "Control Register": function(data) {
            data = this.validateUsingTheseLimits(data, 1, 65535);
            return data;
        },

        "Conversion Type": function(data) {
            data.point = obj.EditChanges.applyConversionTypeProperty(data);
            return data;
        },

        "Cooling Setpoint": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                min = point["Heating Setpoint"].Value + (2 * point["Input Deadband"].Value);

            if (val <= min) {
                data.ok = false;
                data.result = "Cooling Setpoint must be greater than the Heating Setpoint plus 2*Input Deadband (" + min + ").";
            }
            return data;
        },

        "COV Enable": function(data) {
            data.point = obj.EditChanges[data.property](data); // Call apply logic
            return data;
        },

        "COV Increment": function(data) {
            if (data.propertyObject.Value <= 0) {
                data.ok = false;
                data.result = data.property + " must be greater than 0.0";
            }
            return data;
        },

        "Demand Enable": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Description": function(data) {
            var maxLength = 80;
            if (data.propertyObject.Value.length > maxLength) {
                data.ok = false;
                data.truncate = true;
                data.maxLength = maxLength;
                data.result = "Description cannot be more than 80 characters.";
            }
            return data;
        },

        "Device Point": function(data) {
            var point = data.point,
                updateIsDisplayable = false;

            if (data.propertyObject.PointInst !== 0) { // should be fine *ref
                point._devModel = data.refPoint._devModel;
            } else {
                point._devModel = enumsTemplatesJson.Enums["Device Model Types"]["Unknown"]["enum"];
            }

            obj.Utility.updDevModel(data);
            return data;
        },

        "Device Port": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Device Status": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Downlink Broadcast Delay": function(data) {
            return this.validateUsingTheseLimits(data, 0, 1000);
        },

        "Downlink IP Port": function(data) {
            return this.validateUsingTheseLimits(data, 47808, 47823);
        },

        "End Day": function(data) {
            return this.validateUsingTheseLimits(data, 0, 31);
        },

        "End Month": function(data) {
            return this.validateUsingTheseLimits(data, 0, 12);
        },

        "End Year": function(data) {
            return this.validateUsingTheseLimits(data, 0, 2154);
        },

        "Engineering Units": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                maxLength = 20;

            if (val.length > maxLength) {
                data.ok = false;
                data.truncate = true;
                data.maxLength = maxLength;
                data.result = data.property + " cannot be more than " + maxLength + " characters.";
            }
            return data;
        },

        "Ethernet IP Port": function(data) {
            var rmuTypes = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                modbusRemoteUnitTypes = [
                    rmuTypes["Liebert"].enum,
                    rmuTypes["Sierra Steam Meter"].enum,
                    rmuTypes["Siemens Power Meter"].enum,
                    rmuTypes["Ingersol Rand Intellysis"].enum,
                    rmuTypes["PowerLogic 3000 Meter"].enum,
                    rmuTypes["Generic Modbus"].enum,
                    rmuTypes["PowerTraks 9000"].enum,
                    rmuTypes["Programmable Modbus"].enum
                ],
                val = data.propertyObject.Value; // Property Value

            // If this is a Modbus RMU
            if (modbusRemoteUnitTypes.indexOf(data.point._rmuModel) > -1) {
                return this.validateUsingTheseLimits(data, 1, 65535);
            }
            // Else this must be a BACnet RMU or a BACnet Device
            else {
                return this.validateUsingTheseLimits(data, 47808, 47823);
            }
        },

        "Fall Time": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Fan Control Point": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Fan On CFM Setpoint": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Fan Off CFM Setpoint": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Filter Weight": function(data) {
            return this.validateUsingTheseLimits(data, 0, 1);
        },

        "Firmware Revision": function(data) {
            // TODO Add validation (to be determined)
            return data;
        },

        "Firmware 2 Version": function(data) {
            // TODO Add validation (to be determined)
            return data;
        },

        "Heating Setpoint": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                max = point["Cooling Setpoint"].Value - (2 * point["Input Deadband"].Value);

            if (val >= max) {
                data.ok = false;
                data.result = data.property + " must be less than the Cooling Setpoint minus 2*Input Deadband (" + max + ").";
            }
            return data;
        },

        "High Deadband": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property Value

            if (val < 0) {
                data.ok = false;
                data.result = data.property + " must be 0 or greater.";
            }
            return data;
        },

        "High Setpoint": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                min = point["Low Setpoint"].Value + (2 * point["Input Deadband"].Value);

            if (val <= min) {
                data.ok = false;
                data.result = data.property + " must be greater than the Low Setpoint plus twice the Input Deadband (" + min + ").";
            }
            return data;
        },

        "Inactive Text": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                len = val.length, // String length
                maxLength = 40;

            data.ok = false; // Add 'ok' key and preset for validation fail

            if (len < 1) {
                data.result = data.property + " must have at least one character.";
            } else if (len > maxLength) {
                data.truncate = true;
                data.maxLength = maxLength;
                data.result = data.property + " cannot be more than " + maxLength + " characters.";
            } else if (val.toLowerCase() === point["Active Text"].Value.toLowerCase()) {
                data.result = data.property + " must be different from the Active Text.";
            } else {
                data.ok = true;
                data.point = obj.EditChanges.applyInactiveText(data);
            }
            return data;
        },

        "Input Deadband": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property value

            if (val < 0) {
                data.ok = false;
                data.result = data.property + " cannot be less than 0.";
            }
            return data;
        },

        "Input High Limit": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property value

            if (val < point["Input Low Limit"].Value) {
                data.ok = false;
                data.result = data.property + " cannot be less than the Input Low Limit (" + point["Input Low Limit"].Value + ").";
            }
            return data;
        },

        "Input Low Limit": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property value

            if (val > point["Input High Limit"].Value) {
                data.ok = false;
                data.result = data.property + " cannot be greater than the Input High Limit (" + point["Input High Limit"].Value + ").";
            }
            return data;
        },

        "Instance": function(data) {
            data = this.validateUsingTheseLimits(data, 0, 4194303);
            return data;
        },

        "Interlock Point": function(data) {
            data.point = obj.EditChanges.applyInterlockPoint(data);
            return data;
        },

        "Last Report Time": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Last Start Reset Time": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Last Start Time": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Low Deadband": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property value

            if (val < 0) {
                data.ok = false;
                data.result = data.property + " cannot be less than 0.";
            }
            return data;
        },

        "Low Setpoint": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                max = point["High Setpoint"].Value - (2 * point["Input Deadband"].Value);

            if (val >= max) {
                data.ok = false;
                data.result = data.property + " must be less than the High Setpoint minus twice the Input Deadband (" + max + ").";
            }
            return data;
        },

        "Maximum Change": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property Value

            if (val > point["Maximum Value"].Value) {
                data.ok = false;
                data.result = data.property + " must be less than or equal to the Maximum Value.";
            }
            return data;
        },

        "name1": function(data) {
            obj.EditValidation.validateName(data);
            if (data.ok) {
                data.point = obj.EditChanges[data.property](data);
            }
            return data;
        },

        "name2": function(data) {
            obj.EditValidation.validateName(data);
            if (data.ok) {
                data.point = obj.EditChanges[data.property](data);
            }
            return data;
        },

        "name3": function(data) {
            obj.EditValidation.validateName(data);
            if (data.ok) {
                data.point = obj.EditChanges[data.property](data);
            }
            return data;
        },

        "name4": function(data) {
            obj.EditValidation.validateName(data);
            if (data.ok) {
                data.point = obj.EditChanges[data.property](data);
            }
            return data;
        },

        "Name": function(data) {
            // TODO revisit after we allow renaming of points
            return data;
        },

        "Number of Starts": function(data) {
            // TODO Validation TBD
            return data;
        },

        "Occupied Cool Setpoint": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Occupied Heat Setpoint": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Occupied Max Cool CFM": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Occupied Min Cool CFM": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Occupied Point": function(data) {
            if (obj.Utility.getPropertyObject("Device Point", data.point).PointInst !== obj.Utility.getPropertyObject("Device Point", data.refPoint).PointInst) { // will fail *ref
                data.ok = false;
                data.result = data.property + " must reside on the same Device as this point.";
            }
            return data;
        },

        "Off Channel": function(data) {
            this.validateChannelUniqueness(data, "On Channel");
            return data;
        },

        "Off Control Register": function(data) {
            data = this.validateUsingTheseLimits(data, 1, 65535);
            return data;
        },

        "Off Control Value": function(data) {
            return this.validateUsingTheseLimits(data, 0, 65535);
        },

        "On Channel": function(data) {
            this.validateChannelUniqueness(data, "Off Channel");
            return data;
        },

        "On Control Register": function(data) {
            data = this.validateUsingTheseLimits(data, 1, 65535);
            return data;
        },

        "On Control Value": function(data) {
            return this.validateUsingTheseLimits(data, 0, 65535);
        },

        "Open Channel": function(data) {
            this.validateChannelUniqueness(data, "Close Channel");
            return data;
        },

        "Out of Service": function(data) {
            data.point = obj.EditChanges.applyOutOfService(data);
            return data;
        },

        "Point Register": function(data) {
            var point = data.point,
                propertyObject = data.propertyObject;

            if (((propertyObject.AppIndex) < 1) || (propertyObject.AppIndex > point["Point Registers"].length)) {
                data.ok = false;
                data.result = "Invalid point register index (" + propertyObject.AppIndex + "). Valid indexes are between 1 and " + (point["Point Registers"].length + 1) + ".";
            } else {
                point["Point Registers"][propertyObject.AppIndex - 1] = propertyObject.PointInst;
            }
            return data;
        },

        "Point Type": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Poll Register": function(data) {
            data = this.validateUsingTheseLimits(data, 1, 65535);
            return data;
        },

        "Proportional Band": function(data) {
            var point = data.point,
                val = data.propertyObject.Value;

            if (val <= 0) {
                data.ok = false;
                data.result = data.property + " must be greater than 0.";
            }
            return data;
        },

        "Pump Control Mode": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Reset Gain": function(data) {
            var point = data.point,
                val = data.propertyObject.Value;

            if (val <= 0) {
                data.ok = false;
                data.result = data.property + " must be greater than 0.";
            }
            return data;
        },

        "Reset Interval": function(data) {
            data.point = obj.EditChanges.applyResetInterval(data);
            return data;
        },

        "Reset Time": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                ri = point["Reset Interval"].Value; // Reset Interval property value

            if (ri === "Minute") {
                // Valid values are 5, 10, 15, and 30 minutes. *Stored in seconds.
                if ((val !== 300) && (val !== 600) && (val !== 900) && (val !== 1800)) {
                    data.ok = false;
                    data.result = data.property + " must be 5, 10, 15, or 30 minutes.";
                }
            } else if (ri === "Hour") {
                data = this.validateUsingTheseLimits(data, 0, 3540);

                // Override the default error message
                if (data.ok === false) {
                    data.result = data.property + " must be between 0 and 59 minutes.";
                }
            } else {
                data = this.validateUsingTheseLimits(data, 0, 86340);

                // Override the default error message
                if (data.ok === false) {
                    data.result = data.property + " must be between 0 and 23 hours, 59 minutes.";
                }
            }
            return data;
        },

        "Pulse Weight": function(data) {
            var point = data.point,
                val = data.propertyObject.Value;

            if (val <= 0) {
                data.ok = false;
                data.result = data.property + " must be greater than 0.";
            }
            return data;
        },

        "Rate Period": function(data) {
            // TODO verify this does not require reconfig
            return data;
        },

        "Reliability": function(data) {
            data.ok = false;
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Remarks": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                len = val.length, // Value string length
                maxLength = 1000;

            if (len > maxLength) {
                data.ok = false;
                data.truncate = true;
                data.maxLength = maxLength;
                data.result = data.property + " cannot be more than " + maxLength + " characters.";
            }
            return data;
        },

        "Remote Unit Point": function(data) {
            var point = data.point,
                enums = enumsTemplatesJson.Enums,
                propertyObject = data.propertyObject,
                updateIsDisplayable = false;

            if (propertyObject.PointInst !== 0) {
                if (propertyObject.DevInst !== obj.Utility.getPropertyObject("Device Point", point).PointInst) {
                    data.ok = false;
                    data.result = data.property + " must be on same Device.";
                } else {
                    point._rmuModel = data.refPoint._rmuModel; // should be fine *ref
                }
            } else {
                point._rmuModel = enums["Remote Unit Model Types"]["Unknown"]["enum"];

                // We also need to touch _relRMU because server processes will not (because there is no RMU point)
                point._relRMU = enums["Reliabilities"]["No Fault"]["enum"];
            }

            obj.Utility.updDevModel(data);
            return data;
        },

        "Rise Time": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Run Total": function(data) {
            // TODO more logic req'd (set run total reset time)
            return data;
        },

        "Run Total Reset Time": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Script Point": function(data) {
            if (data.propertyObject.PointInst !== 0) {
                data.point = obj.EditChanges[data.property](data);
            }
            return data;
        },

        "Select Input": function(data) {
            data.point = obj.EditChanges.applySelectInput(data);
            return data;
        },

        "Setpoint Input": function(data) {
            data.point = obj.EditChanges.applySetpointInput(data);
            return data;
        },

        "Setback Enable": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Shutdown Point": function(data) {
            data.point = obj.EditChanges.applyShutdownPoint(data);
            return data;
        },

        "Starts Alarm Limit": function(data) {
            return data;
        },

        "States": function(data) {
            // check for blank enums/texts
            // set data.ok during validation w/err then check before applyStates
            var enums = [];
            var texts = [];

            for (var prop in data.point.States.ValueOptions) {
                if (texts.indexOf(prop) < 0) {
                    texts.push(prop);
                } else {
                    data.ok = false;
                    data.result = data.property + " must contain unique texts.";
                    break;
                }

                if (enums.indexOf(data.point.States.ValueOptions[prop]) < 0) {
                    enums.push(data.point.States.ValueOptions[prop]);
                } else {
                    data.ok = false;
                    data.result = data.property + " must contain unique enums.";
                    break;
                }
            }

            if (data.ok === true) {
                data.point = obj.EditChanges.applyStates(data);
            }

            return data;
        },

        "Status Flags": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Trend COV Increment": function(data) {
            var point = data.point,
                val = data.propertyObject.Value;

            if (val <= 0) {
                data.ok = false;
                data.result = data.property + " must be greater than 0.0";
            }
            return data;
        },

        "Trend Interval": function(data) {
            var point = data.point,
                val = data.propertyObject.Value;

            if (val < 1) {
                data.ok = false;
                data.result = data.property + " cannot be less than 1 second.";
            }
            return data;
        },

        "Trend Samples": function(data) {
            data = this.validateUsingTheseLimits(data, 0, 255);
            if (data.ok === true) {
                data.point = obj.EditChanges[data.property](data);
            }
            return data;
        },

        "Trend Last Status": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Trend Last Value": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Trigger Point": function(data) {
            data.point = obj.EditChanges.applyTriggerPoint(data);
            return data;
        },

        "Unoccupied Cool Setpoint": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Unoccupied Heat Setpoint": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Value Deadband": function(data) {

            if (data.propertyObject.Value < 0.0) {
                data.ok = false;
                data.result = data.property + " must be greater than or equal to 0.0";
            }
            return data;
        },

        //------------------------------------------------------------------------------------------------------------------------------
        //------ BEGIN POINT TYPE SPECIFIC PROPERTIES  ---------------------------------------------------------------------------------
        //------------------------------------------------------------------------------------------------------------------------------

        "Downlink Network": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value, // Point type
                val = data.propertyObject.Value; // Property value

            data.ok = false; // Add 'ok' key and preset for validation fail

            data = this.validateUsingTheseLimits(data, 0, 65534);
            // This property only supported by Devices
            if (type !== "Device") {
                data.result = "Internal validation error. Point type '" + type + "' does not support this property.";
            } else {
                data.ok = true; // Preset for validation success
                data = this.validateNetworkNumber(data); // Check if donwlink network number matches one of the serial port network numbers
            }
            if (data.ok === true) {
                data.point = obj.EditChanges.applyNetworkNumber(data);
            }
            return data;
        },

        "Downlink Protocol": function(data) {
            data.point = obj.EditChanges.applyDeviceDownlinkProtocol(data);
            return data;
        },

        "Ethernet Network": function(data) {
            var min = (data.point['Uplink Port'].Value === 'Ethernet') ? 1 : 0;

            data = this.validateUsingTheseLimits(data, min, 65534);

            if (data.ok === true) {
                data = this.validateNetworkNumber(data);
            }
            if (data.ok === true) {
                data.point = obj.EditChanges.applyNetworkNumber(data);
                data.point = obj.EditChanges.applyEthernetNetworkNumber(data);
            }
            return data;
        },

        "Ethernet Protocol": function(data) {
            data.point = obj.EditChanges.applyDeviceEthernetProtocol(data);
            return data;
        },

        "Model Type": function(data) {
            var point = data.point,
                propertyObject = data.propertyObject;

            if ((propertyObject.Value === "Unknown") || (propertyObject.Value === "Central Device")) {
                data.ok = false;
                data.result = 'Invalid model type.';
            } else {
                if (point["Point Type"].Value === "Device") {
                    point = obj.EditChanges.applyDeviceDevModel(data);
                } else {
                    point = obj.EditChanges.applyRemoteUnitDevModel(data);
                }
            }
            return data;
        },

        "Port 1 Address": function(data) {
            return this.validatePortNAddress(data);
        },

        "Port 2 Address": function(data) {
            return this.validatePortNAddress(data);
        },

        "Port 3 Address": function(data) {
            return this.validatePortNAddress(data);
        },

        "Port 4 Address": function(data) {
            return this.validatePortNAddress(data);
        },

        "Port 1 Maximum Address": function(data) {
            return this.validatePortNAddress(data);
        },

        "Port 2 Maximum Address": function(data) {
            return this.validatePortNAddress(data);
        },

        "Port 3 Maximum Address": function(data) {
            return this.validatePortNAddress(data);
        },

        "Port 4 Maximum Address": function(data) {
            return this.validatePortNAddress(data);
        },

        "Port 1 Network": function(data) {
            return this.validatePortNNetwork(data);
        },

        "Port 2 Network": function(data) {
            return this.validatePortNNetwork(data);
        },

        "Port 3 Network": function(data) {
            return this.validatePortNNetwork(data);
        },

        "Port 4 Network": function(data) {
            return this.validatePortNNetwork(data);
        },

        "Port 1 Protocol": function(data) {
            return this.validatePortNProtocol(data);
        },

        "Port 2 Protocol": function(data) {
            return this.validatePortNProtocol(data);
        },

        "Port 3 Protocol": function(data) {
            return this.validatePortNProtocol(data);
        },

        "Port 4 Protocol": function(data) {
            return this.validatePortNProtocol(data);
        },

        "Uplink Port": function(data) {
            data.point = obj.EditChanges.applyDeviceUplinkPort(data);
            return data;
        },

        "Network Segment": function(data) {
            var point = data.point,
                min;

            if (point["Point Type"].Value === "Remote Unit") {
                min = (point.Gateway.isDisplayable && point.Gateway.Value) ? 0 : 1;
                this.validateUsingTheseLimits(data, min, 65534);
                if (data.ok === true) {
                    data.point = obj.EditChanges.applyNetworkNumber(data);
                }
            }
            return data;
        },

        "Gateway": function(data) {
            obj.EditChanges.applyRemoteUnitNetworkType(data.point);
            return data;
        },

        "Network Type": function(data) {
            obj.EditChanges.applyRemoteUnitNetworkType(data.point);
            return data;
        },

        "Calculation Type": function(data) {
            var point = data.point,
                type = point["Point Type"].Value;

            switch (type) {
                case "Analog Selector":
                case "Binary Selector":
                case "Proportional":
                    data.point = obj.EditChanges[data.property](data);
                    break;

                default:
                    break;
            }
            return data;
        },

        "Control Point": function(data) {
            var pointType = data.point["Point Type"].Value;
            // console.log('inside control point', !!data.refPoint, !!data.point, !!obj.Utility.getPropertyObject("Device Point", data.point));
            if (obj.Utility.getPropertyObject("Device Point", data.point) === null) {
                if (pointType === "Schedule Entry") {
                    if (!!data.refPoint && !obj.Utility.isPropInSchedProps(data.refPoint["Point Type"].Value, data.point["Control Property"].Value)) { //failing *ref - fixed?
                        data.ok = false;
                        data.result = "Invalid Control Property.";
                    }
                    if (data.ok)
                        data.point = obj.EditChanges.applyControlPoint(data);
                } else {
                    data.ok = false;
                    data.result = "Invalid Point Type for Control Point property";
                }

            } else if (!!data.refPoint && obj.Utility.getPropertyObject("Device Point", data.point).Value !== obj.Utility.getPropertyObject("Device Point", data.refPoint).Value) { // should be fine *ref
                data.ok = false;
                data.result = data.property + " must reside on the same Device as this point.";
            } else if (pointType !== "Optimum Start") {

                if (data.ok)
                    data.point = obj.EditChanges.applyControlPoint(data);
            }
            return data;
        },

        "Control Property": function(data) {
            var point = data.point,
                refPoint = data.refPoint;

            if (!!data.refPoint && !obj.Utility.isPropInSchedProps(refPoint["Point Type"].Value, point["Control Property"].Value)) { // will fail *ref - fixed?
                data.ok = false;
                data.result = "Invalid Control Property.";
            } else {
                data.point = obj.EditChanges.applyControlPoint(data);
            }
            return data;
        },

        "Maximum Value": function(data) {
            var point = data.point,
                val = data.propertyObject.Value;

            if (point["Point Type"].Value === "Accumulator") {
                if (val <= 0) {
                    data.ok = false;
                    data.result = data.property + " must be greater than 0.0";
                }
            } else if (val <= point["Minimum Value"].Value) {
                data.ok = false;
                data.result = data.property + " must be greater than the Minimum Value (" + point["Minimum Value"].Value + ").";
            }
            return data;
        },

        "Minimum Value": function(data) {
            var point = data.point;

            if (data.propertyObject.Value >= point["Maximum Value"].Value) {
                data.ok = false;
                data.result = data.property + " must be less than the Maximum Value (" + point["Maximum Value"].Value + ").";
            }
            return data;
        },

        "Shutdown Value": function(data) {
            return data;
        },

        "Value": function(data) {
            var point = data.point, // Shortcut
                val = point["Value"].Value, // Property value
                type = point["Point Type"].Value; // Point type

            if ((point.Value.ValueType === enumsTemplatesJson.Enums["Value Types"]["Float"]["enum"]) && (type !== "Analog Selector")) {
                if (val > point["Maximum Value"].Value) {
                    data.ok = false;
                    data.result = data.property + " cannot be greater than the Maximum Value (" + point["Maximum Value"].Value + ")";
                } else if (type !== "Accumulator") {
                    if (val < point["Minimum Value"].Value) {
                        data.ok = false;
                        data.result = data.property + " cannot be less than the Minimum Value (" + point["Minimum Value"].Value + ").";
                    }
                } else if (val < 0) {
                    data.ok = false;
                    data.result = data.property + " cannot be less than 0.";
                }
            }
            return data;
        },

        "Input Point 1": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Input Point 2": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Input Point 3": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Input Point 4": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Input Point 5": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Monitor Point": function(data) {
            if (data.point["Point Type"].Value === "Delay") {
                data.point = obj.EditChanges.applyDelayMointorPoint(data);
            }
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Input Type": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value; // Point type

            if (type === "Binary Input") {
                data.point = obj.EditChanges.applyBinaryInputInputType(data);
            }
            return data;
        },

        "Sensor Point": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value; // Point type

            if (type === "Analog Input") {
                data.point = obj.EditChanges.applyAnalogInputSensorPoint(data);
            } else if (type === "Analog Output") {
                data.point = obj.EditChanges.applyAnalogOutputSensorPoint(data);
            }
            return data;
        },

        "Default Value": function(data) {
            var point = data.point; // Shortcut
            var val = data.propertyObject.Value; // Property value
            var type = point["Point Type"].Value; // Point type

            if ((type === "Analog Output") || (type === "Analog Value")) {
                if (val < point["Minimum Value"].Value) {
                    data.ok = false;
                    data.result = data.property + " cannot be less than the Minimum Value (" + point["Minimum Value"].Value + ").";
                } else if (val > point["Maximum Value"].Value) {
                    data.ok = false;
                    data.result = data.property + " cannot be greater than the Maximum Value (" + point["Maximum Value"].Value + ").";
                }
            }
            return data;
        },

        "Output Type": function(data) {
            var point = data.point, // Shortcut
                val = point["Output Type"].Value, // Property value
                type = point["Point Type"].Value; // Point type

            if (type === "Analog Output") {
                data.point = obj.EditChanges.applyAnalogOutputOutputType(data);
            } else if (type === "Binary Output") {
                data.point = obj.EditChanges.applyBinaryOutputOutputType(data);
            }
            return data;
        },

        "Feedback Point": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value; // Point type

            if (type === "Binary Input" || type === "Binary Value") {
                data.point = obj.EditChanges.applyBinaryInputFeedbackPoint(data); // BI and BV have same apply logic
            }
            return data;
        },

        "Feedback Type": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value; // Point type

            if (type === "Binary Output") {
                data.point = obj.EditChanges.applyBinaryOutputTypeFeedbackType(data);
            }
            return data;
        },

        "Alarm Adjust Point": function(data) {
            var point = data.point;

            data.point = obj.EditChanges.applyAlarmAdjustPoint(data); 
            return data;
        },

        "Close On Complete": function(data) {
            return data;
        },

        "Continuous Show": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Maximize Displays": function(data) {
            return data;
        },

        "Repeat Count": function(data) {
            return this.validateUsingTheseLimits(data, 1, 99);
        }

        //------ END POINT-TYPE SPECIFIC PROPERTIES  ----------------------------------------------------------------------------------------------
    };

    obj.EditChanges = {

        addFakeValueOptions: function(pointProp) {
            if (!pointProp.hasOwnProperty('eValue')) {
                pointProp.eValue = 0;
            }
            if (!pointProp.hasOwnProperty('ValueOptions')) {
                pointProp.ValueOptions = {
                    'Off': 0,
                    'On': 1
                };
            }
        },

        updateFanStrategy: function(point) {
            var fanStrategy = point["Fan Control Strategy"];
            var fanOffSetPt = point["Fan Off CFM Setpoint"].Value;
            var strategy = "Constant";

            if (obj.Utility.getPropertyObject("Fan Control Point", point).Value !== 0) {
                fanStrategy.isDisplayable = true;

                if (point["Fan On CFM Setpoint"].Value === 0) {
                    point["Fan Off CFM Setpoint"].isDisplayable = false;
                    point["Fan Off Temp Deadband"].isDisplayable = true;
                    point["Fan Off Temp Deadband"].Value = fanOffSetPt;
                    strategy = "Heating";
                } else if (fanOffSetPt > point["Occupied Max Cool CFM"].Value) {
                    strategy = "Constant";
                } else if ((point["Occupied Min Cool CFM"].Value < fanOffSetPt) && (fanOffSetPt < point["Occupied Max Cool CFM"].Value)) {
                    strategy = "Intermittent";
                } else if ((0 < fanOffSetPt) && (fanOffSetPt < point["Occupied Min Cool CFM"].Value)) {
                    strategy = "Deadband";
                }
                fanStrategy.Value = strategy;
                fanStrategy.eValue = enumsTemplatesJson.Enums["Fan Control Strategies"][strategy].enum;
            } else {
                fanStrategy.isDisplayable = false;
            }
        },

        updateName: function(data) {
            var point = data.point,
                i = data.property.slice(-1),
                Name = point.name1,
                prop = '';

            point["_name" + i] = data.propertyObject.toLowerCase();

            // Update full name (prop: Name)
            for (i = 2; i < 5; i++) {
                prop = point['name' + i];
                if (prop !== '') {
                    Name += "_" + prop;
                } else {
                    break;
                }
            }
            point.Name = Name;
            // Build _Name (lowercase prop: Name)
            point._Name = Name.toLowerCase();
        },

        "Broadcast Enable": function(data) {
            var point = data.point,
                val = point[data.property].Value,
                prop = point['Broadcast Period'],
                isDisplayable = false;
            if (val) isDisplayable = true;
            if (prop) prop.isDisplayable = isDisplayable;
            return point;
        },

        "Calculation Type": function(data) {
            var point = data.point,
                val = point["Calculation Type"].Value,
                setDisp = obj.Utility.setPropsDisplayable,
                setValOpt = obj.Utility.setupPropValueOptions;

            if ((point["Point Type"].Value === "Analog Selector") || (point["Point Type"].Value === "Binary Selector")) {
                if (val === "Single Setpoint") {
                    obj.Utility.getPropertyObject("Setpoint Input", point).isDisplayable = true;
                    setDisp(point, ["Setpoint Value", "High Deadband", "Low Deadband"], true);
                    setDisp(point, ["Input Deadband", "High Setpoint", "Low Setpoint", "Cooling Setpoint", "Heating Setpoint"], false);
                } else if (val === "Dual Setpoint") {
                    obj.Utility.getPropertyObject("Setpoint Input", point).isDisplayable = false;
                    setDisp(point, ["Setpoint Value", "High Deadband", "Low Deadband", "Cooling Setpoint", "Heating Setpoint"], false);
                    setDisp(point, ["Input Deadband", "High Setpoint", "Low Setpoint"], true);
                } else {
                    obj.Utility.getPropertyObject("Setpoint Input", point).isDisplayable = false;
                    setDisp(point, ["Setpoint Value", "High Deadband", "Low Deadband", "High Setpoint", "Low Setpoint"], false);
                    setDisp(point, ["Input Deadband", "Cooling Setpoint", "Heating Setpoint"], true);
                }
            } else if (val === "PID") {
                setValOpt(point["Input Range"], {
                    "25 Sec": 0,
                    "50 Sec": 1,
                    "75 Sec": 2,
                    "100 Sec": 3,
                    "125 Sec": 4,
                    "150 Sec": 5,
                    "175 Sec": 6,
                    "200 Sec": 7,
                });
                setDisp(point, ["Rise Time", "Fall Time"], true);
                setDisp(point, ["Proportional Band", "Reset Gain"], false);
            } else if (val === "PI") {
                setValOpt(point["Input Range"], {
                    "1": 0,
                    "10": 1,
                    "100": 2,
                    "1000": 3,
                    "5000": 4,
                    "10000": 5,
                    "25000": 6,
                    "Auto": 7,
                });
                setDisp(point, ["Proportional Band", "Reset Gain"], true);
                setDisp(point, ["Rise Time", "Fall Time"], false);
            } else {
                point["Proportional Band"].isDisplayable = true;
                setDisp(point, ["Rise Time", "Fall Time", "Input Range", "Reset Gain"], false);
            }
            return point;
        },

        "Continuous Show": function(data) {
            var point = data.point, // Shortcut
                val = point[data.property].Value; // Property value

            if (val === true) {
                point["Repeat Count"].isDisplayable = false;
            } else {
                point["Repeat Count"].isDisplayable = true;
            }
            return point;
        },

        "COV Enable": function(data) {
            var point = data.point, // Shortcut
                val = point[data.property].Value; // Property value

            // All points do not have the COV Increment property
            if (point.hasOwnProperty("COV Increment")) {
                if (val === true) {
                    point["COV Increment"].isReadOnly = false;
                } else {
                    point["COV Increment"].isReadOnly = true;
                }
            }
            return point;
        },

        "Demand Enable": function(data) {
            var point = data.point, // Shortcut
                val = point[data.property].Value; // Property value

            if (val === true) {
                point["Demand Interval"].isReadOnly = false;
            } else {
                point["Demand Interval"].isReadOnly = true;
            }
            return point;
        },

        "Device Port": function(data) {
            data.propertyObject = (!!data.propertyObject) ? data.propertyObject : obj.Utility.getPropertyObject("Device Port", data.point);
            var point = data.point;

            return obj.EditChanges.applyRemoteUnitNetworkType(point);
        },

        "Fan Control Point": function(data) {
            this.updateFanStrategy(data.point);
            return data.point;
        },

        "name1": function(data) {
            obj.EditChanges.updateName(data);
            return data.point;
        },

        "name2": function(data) {
            obj.EditChanges.updateName(data);
            return data.point;
        },

        "name3": function(data) {
            obj.EditChanges.updateName(data);
            return data.point;
        },

        "name4": function(data) {
            obj.EditChanges.updateName(data);
            return data.point;
        },

        "Pump Control Mode": function(data) {
            var i,
                len,
                isDisplayable,
                point = data.point,
                val = point[data.property].Value,
                props = ['Low Level Setpoint', 'Off Level Setpoint', 'Lead Level Setpoint', 'Lag Level Setpoint', 'High Level Setpoint'],
                refProps = ['Off Level Float Point', 'Lead Level Float Point', 'Lag Level Float Point'];

            if (val === 'Transducer') {
                isDisplayable = true;
            } else {
                isDisplayable = false;
            }
            obj.Utility.getPropertyObject("Level Sensor Point", point).isDisplayable = isDisplayable;
            point['Emergency Pump Down Time'].isDisplayable = isDisplayable;
            for (i = 0, len = props.length; i < len; i++) {
                point[props[i]].isDisplayable = isDisplayable;
            }

            isDisplayable = !isDisplayable;
            for (i = 0, len = refProps.length; i < len; i++) {
                obj.Utility.getPropertyObject(refProps[i], point).isDisplayable = isDisplayable;
            }
            return point;
        },

        "Setback Enable": function(data) {
            var point = data.point,
                val = point[data.property].Value,
                isDisplayable = val ? true : false,
                props = ["Cooling Setpoint", "Heating Setpoint", "Setback Deadband"],
                i,
                len = props.length;

            for (i = 0; i < len; i++) {
                point[props[i]].isDisplayable = isDisplayable;
            }
            return point;
        },

        "Script Point": function(data) {
            var point = data.point, // Shortcut
                oldPoint = data.oldPoint,
                refPoint = data.refPoint, // Shotcut
                propertyObject = data.propertyObject, // Shortcut
                registers = {
                    "Boolean Register Names": "Boolean Registers",
                    "Integer Register Names": "Integer Registers",
                    "Point Register Names": "Point Registers",
                    "Real Register Names": "Real Registers"
                },
                registerName,
                i,
                ndx,
                len;

            point._cfgRequired = true;

            for (registerName in registers) {
                if (_.isEqual(point[registerName], refPoint[registerName]) === false) {
                    point[registers[registerName]].length = 0;
                    len = refPoint[registerName].length;

                    for (i = 0; i < len; i++) {
                        // If the script point register name is in the list of program point register names
                        if ((ndx = oldPoint[registerName].indexOf(refPoint[registerName][i])) !== -1) {
                            point[registers[registerName]][i] = oldPoint[registers[registerName]][ndx]; // Get the register UPID
                        } else {
                            point[registers[registerName]][i] = (registerName === "Boolean Register Names") ? false : 0;
                        }
                    }

                    point[registerName] = refPoint[registerName]; // Copy register names to our point

                    // If this is the point registers
                    if (registers[registerName] === "Point Registers") {
                        // Rebuild point refs using point registers array
                        point["Point Refs"].length = 2; // Clear point registers out of point refs (array now consists of device point and script point only)

                        for (i = 0; i < len; i++) {
                            var pointRegister = null;

                            // Make sure the point register has a UPID
                            if (point["Point Registers"][i] !== 0) {
                                pointRegister = _.cloneDeep(obj.Utility.getPointRegister(oldPoint["Point Refs"], "PointInst", point["Point Registers"][i]));
                            }

                            if (pointRegister !== null) {
                                pointRegister.AppIndex = i + 1;
                            } else {
                                pointRegister = {
                                    "AppIndex": i + 1,
                                    "PropertyName": "Point Register",
                                    "PropertyEnum": 275,
                                    "isDisplayable": true,
                                    "isReadOnly": false,
                                    "Value": 0,
                                    "PointName": "",
                                    "PointType": 0,
                                    "PointInst": 0,
                                    "DevInst": 0
                                };
                            }
                            point["Point Refs"].push(pointRegister);
                        }
                    }
                }
            }
            return point;
        },

        // Common property change logic for Logic point types, Input Point N properties, where N = 1-5
        // This routine should only be called if the Input Point changes.  Otherwise 'If Value N' eValue and Value may be corrupted.
        applyLogicInputPointN: function(data) {
            var point = data.point, // Shortcut
                refPoint = data.refPoint, // Shortcut
                N = data.property.substring(data.property.length - 1), // Get the property's last character (1-5)
                prop = {
                    "ifCompareN": "If Compare " + N,
                    "ifResultN": "If Result " + N,
                    "ifValueN": "If Value " + N
                },
                isDisplayable = true,
                key, // Work var
                tempOption = {},
                hasEValue = false;

            // If a reference point is not defined,
            if (data.propertyObject.PointInst === 0) {
                isDisplayable = false;
                // Nope, a reference point IS defined
            } else {
                if (refPoint.Value.ValueType !== point[prop.ifValueN].ValueType) {
                    point[prop.ifValueN] = refPoint.Value;
                    this.addFakeValueOptions(point[prop.ifValueN]);
                    delete point[prop.ifValueN].oosValue;
                } else if (refPoint.Value.ValueType === 5) {
                    point[prop.ifValueN].ValueOptions = refPoint.Value.ValueOptions;

                    for (var property in point[prop.ifValueN].ValueOptions) {
                        tempOption = {
                            eValue: point[prop.ifValueN].ValueOptions[property],
                            Value: property
                        };
                        if (point[prop.ifValueN].ValueOptions[property] === point[prop.ifValueN].eValue) {
                            point[prop.ifValueN].Value = property;
                            hasEValue = true;
                        }
                    }

                    if (!hasEValue) {
                        point[prop.ifValueN].Value = tempOption.Value;
                        point[prop.ifValueN].eValue = tempOption.eValue;
                    }
                }
                point[prop.ifValueN].isReadOnly = false;
            }

            // Set the desired isDisplayable key value for the If Compare N, If Result N, and If Value N properties
            for (key in prop) {
                // No 'If Result 1' property
                if (prop[key] !== "If Result 1") {
                    point[prop[key]].isDisplayable = isDisplayable;
                }
            }
            return point;
        },

        applyMuxOrMathInputPointN: function(data) {
            var point = data.point,
                N = data.property.substring(data.property.length - 1), // Get the property's last character ('1' or '2')
                prop = "Input " + N + " Constant", // Related property
                isDisplayable = false;

            // If Input point N is not defined
            if (data.propertyObject.PointInst === 0) {
                isDisplayable = true; // Set 'Input N Constant' isDisplayable flag
            }
            point[prop].isDisplayable = isDisplayable; // Set 'Input N Constant' isDisplayable flag

            return point;
        },

        applyComparatorInputTypeN: function(data) {
            var point = data.point, // Shortcut
                refPoint = data.refPoint,
                hasEValue = false,
                tempOption = {};

            // If property is Input Point 1
            if (data.property === "Input Point 1") {
                if (data.propertyObject.PointInst !== 0) {
                    if (refPoint.Value.ValueType !== point["Input 2 Constant"].ValueType) {
                        point["Input 2 Constant"] = refPoint.Value;
                        this.addFakeValueOptions(point['Input 2 Constant']);
                        delete point["Input 2 Constant"].oosValue;
                    } else if (refPoint.Value.ValueType === 5) {
                        point["Input 2 Constant"].ValueOptions = refPoint.Value.ValueOptions;

                        for (var prop in point["Input 2 Constant"].ValueOptions) {
                            tempOption = {
                                eValue: point["Input 2 Constant"].ValueOptions[prop],
                                Value: prop
                            };
                            if (point["Input 2 Constant"].ValueOptions[prop] === point["Input 2 Constant"].eValue) {
                                point["Input 2 Constant"].Value = prop;
                                hasEValue = true;
                            }
                        }

                        if (!hasEValue) {
                            point["Input 2 Constant"].Value = tempOption.Value;
                            point["Input 2 Constant"].eValue = tempOption.eValue;
                        }
                    }
                    if (point._parentUpi !== 0) {
                        point["Input 2 Constant"].isReadOnly = true;
                    } else {
                        point["Input 2 Constant"].isReadOnly = false;
                    }
                }
                // Must be Input Point 2
            } else {
                if (obj.Utility.getPropertyObject("Input Point 2", point).PointInst === 0) {
                    point["Input 2 Constant"].isDisplayable = true;
                } else {
                    point["Input 2 Constant"].isDisplayable = false;
                }
            }

            return point;
        },

        applyInputPointN: function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value; // Point type

            if (type === "Logic") {
                point = this.applyLogicInputPointN(data);
            } else if ((type === "Multiplexer") || (type === "Math")) {
                point = this.applyMuxOrMathInputPointN(data);
            } else if (type === "Comparator") {
                point = this.applyComparatorInputTypeN(data);
            }
            return point;
        },

        applyOccUnoccSetpoint: function(data, prop) {
            var isDisplayable = (data.propertyObject.PointInst === 0) ? true : false,
                isReadOnly = !isDisplayable,
                point = data.point;

            point[prop].isDisplayable = isDisplayable;
            point[prop].isReadOnly = isReadOnly;
            return data.point;
        },

        "Fan On CFM Setpoint": function(data) {
            data.point = this.updateFanStrategy(data.point);
            return data.point;
        },

        "Fan Off CFM Setpoint": function(data) {
            data.point = this.updateFanStrategy(data.point);
            return data.point;
        },

        "Input Point 1": function(data) {
            return this.applyInputPointN(data);
        },

        "Input Point 2": function(data) {
            return this.applyInputPointN(data);
        },

        "Input Point 3": function(data) {
            return this.applyInputPointN(data);
        },

        "Input Point 4": function(data) {
            return this.applyInputPointN(data);
        },

        "Input Point 5": function(data) {
            return this.applyInputPointN(data);
        },

        "Monitor Point": function(data) {
            var point = data.point, // Shortcut
                props = ["Fail Action", "Demand Interval", "Demand Enable"], // Related properties
                len = props.length, // Number of related properties
                ro = (data.propertyObject.PointInst === 0) ? true : false, // Set read-only flag if value is 0
                i; // Work var

            for (i = 0; i < len; i++) {
                if (point.hasOwnProperty(props[i])) {
                    point[props[i]].isReadOnly = ro;
                }
            }

            return point;
        },

        "Occupied Max Cool CFM": function(data) {
            data.point = this.updateFanStrategy(data.point);
            return data;
        },

        "Occupied Min Cool CFM": function(data) {
            data.point = this.updateFanStrategy(data.point);
            return data;
        },

        "Trend Samples": function(data) {
            var point = data.point, // Shortcut
                val = point[data.property].Value, // Property value
                props = ["Trend Enable", "Trend Interval", "Trend COV Increment"],
                len = props.length,
                ro = (val === 0) ? true : false, // If Trend Sample 0, set read-only flag true
                prop,
                i;

            for (i = 0; i < len; i++) {
                prop = props[i];
                if (point.hasOwnProperty(prop)) {
                    point[prop].isReadOnly = ro;
                }
            }
            return point;
        },

        "Occupied Cool Setpoint": function(data) {
            return this.applyOccUnoccSetpoint(data, "Occupied Cool Setpoint Value");
        },

        "Occupied Heat Setpoint": function(data) {
            return this.applyOccUnoccSetpoint(data, "Occupied Heat Setpoint Value");
        },

        "Unoccupied Cool Setpoint": function(data) {
            return this.applyOccUnoccSetpoint(data, "Unoccupied Cool Setpoint Value");
        },

        "Unoccupied Heat Setpoint": function(data) {
            return this.applyOccUnoccSetpoint(data, "Unoccupied Heat Setpoint Value");
        },

        applyReliability: function(data) {
            var point = data.point;

            if (point._relDevice !== 0) {
                point.Reliability.eValue = point._relDevice;
            } else if (point._relRMU !== 0) {
                point.Reliability.eValue = point._relRMU;
            } else {
                point.Reliability.eValue = point._relPoint;
            }
            point = this.applyPropertyEnumSet(point, "Reliability", enumsTemplatesJson.Enums.Reliabilities);

            return point;
        },

        applyEnableWarningAlarms: function(data) {
            var point = data.point,
                setDisp = obj.Utility.setPropsDisplayable;

            if (point["Enable Warning Alarms"].Value === true) {
                setDisp(point, ["High Warning Limit", "Low Warning Limit"], true);
                if (obj.Utility.getPropertyObject("Alarm Adjust Point", point).PointInst === 0) {
                    point["Warning Adjust Band"].isDisplayable = false;
                } else {
                    point["Warning Adjust Band"].isDisplayable = true;
                }
            } else {
                setDisp(point, ["High Warning Limit", "Low Warning Limit", "Warning Adjust Band"], false);
            }
            return point;
        },

        applyNetworkNumber: function(data) {
            var point = data.point;
            var networks = data.networkConfig;
            var networkValue = point[data.property].Value;
            var findNetwork = function(segment) {
                var port = 0;
                for (var n = 0; n < networks.length; n++) {
                    if (networks[n]['IP Network Segment'] === segment) {
                        port = networks[n]['IP Port'];
                    }
                }
                return port;
            };
            if (data.property === 'Network Segment') {
                if (point.Gateway.isDisplayable && point.Gateway.Value) {
                    obj.EditChanges.applyRemoteUnitNetworkType(point);
                } else if (networkValue !== 0) {
                    point['Ethernet IP Port'].Value = findNetwork(networkValue);
                }
            } else {
                var prop = (data.property === 'Ethernet Network') ? 'Ethernet IP Port' : 'Downlink IP Port';
                if (networkValue !== 0) {
                    point[prop].Value = findNetwork(networkValue);
                    point[prop].isReadOnly = true;
                } else {
                    point[prop].isReadOnly = false;
                }
            }
            return point;
        },

        applyEthernetNetworkNumber: function(data) {
            if (data.oldPoint['Ethernet Network'].Value !== data.point['Ethernet Network'].Value) {
                data.point._cfgRequired = true;
            }
            return data.point;
        },

        applyConfigureDevice: function(data) {
            data.point["Configure Device"].Value = false;
            return data.point;
        },

        applyUniquePIDLogic: function(data, property) {
            var point = data.point,
                refPoint = data.refPoint,
                propertyObject = data.propertyObject,
                refPointDevPointProp;

            // property is an optional parameter used to override data.property
            if (property !== undefined && property !== null) {
                propertyObject = obj.Utility.getPropertyObject(property, data.point);
            }

            // Adding a reference point
            if (refPoint !== null && (propertyObject.Value !== 0)) {
                propertyObject.PointName = refPoint.Name;
                propertyObject.PointType = refPoint["Point Type"].eValue;
                propertyObject.PointInst = refPoint._id;

                if (refPoint["Point Type"].Value === "Device")
                    propertyObject.DevInst = propertyObject.PointInst;
                else if ((refPointDevPointProp = obj.Utility.getPropertyObject("Device Point", refPoint)) !== null)
                    propertyObject.DevInst = refPointDevPointProp.DevInst;
                else
                    propertyObject.DevInst = 0;
                // Removing a reference point
            } else {

                if (propertyObject.Value === 0) {
                    propertyObject.PointName = "";
                }

                propertyObject.DevInst = 0;
                propertyObject.PointInst = 0;
            }
            return point;
        },

        applyPropertyEnumSet: function(point, property, enumSet) {
            var enumValue,
                key;

            if (point.hasOwnProperty(property) === true) {

                point[property].Value = undefined; // Assume we can't find a match

                for (key in enumSet) {
                    // JDR - If the enumSet is from enumsTemplates.json file, it will have an 'enum' key
                    // and the enum has to be accessed using the 'enum' key. Otherwise the enum value is 
                    // directly accessible.
                    if (enumSet[key].hasOwnProperty('enum') === true) {
                        enumValue = enumSet[key]['enum'];
                    } else {
                        enumValue = enumSet[key];
                    }

                    if (point[property].eValue === enumValue) {
                        point[property].Value = key;
                        break;
                    }
                }
                if (!point[property].Value) {
                    point[property].Value = key;
                    point[property].eValue = enumSet[key];
                }
            }
            return point;
        },

        applyActiveText: function(data) {
            var point = data.point;

            if (point["Active Text"] !== undefined) {
                for (var key in point.Value.ValueOptions) {
                    if (point.Value.ValueOptions[key] === 1) {
                        delete point.Value.ValueOptions[key];
                        point.Value.ValueOptions[point["Active Text"].Value] = 1;
                    }
                }
            }
            return point;
        },

        applyInactiveText: function(data) {
            var point = data.point;

            if (point["Inactive Text"] !== undefined) {
                for (var key in point.Value.ValueOptions) {
                    if (point.Value.ValueOptions[key] === 0) {
                        delete point.Value.ValueOptions[key];
                        point.Value.ValueOptions[point["Inactive Text"].Value] = 0;
                        break;
                    }
                }
            }
            return point;
        },

        applyControlPoint: function(data) {
            var point = data.point,
                refPoint = data.refPoint,
                pointType = point["Point Type"].Value,
                hasEValue = false,
                tempOption = {},
                applyScheduleEntry = function() {
                    var isDisplayable = false,
                        controlPoints = ["Analog Output", "Analog Value", "Binary Output", "Binary Value"];

                    if (controlPoints.indexOf(pointType) && (point["Control Property"].Value === "Value")) {
                        isDisplayable = true;
                    } else {
                        point["Active Release"].Value = false;
                    }
                    point["Active Release"].isDisplayable = isDisplayable;
                    point["Controller"].isDisplayable = isDisplayable;
                    point["Control Priority"].isDisplayable = isDisplayable;

                    if (point["Control Property"].Value !== "Value") {
                        point["Control Value"] = refPoint[point["Control Property"].Value];
                    } else if (point["Control Value"].ValueType === 5) {
                        //point["Control Value"].ValueOptions = refPoint.Value.ValueOptions;
                        for (var prop in refPoint.Value.ValueOptions) {
                            tempOption = {
                                eValue: refPoint.Value.ValueOptions[prop],
                                Value: prop
                            };
                            if (refPoint.Value.ValueOptions[prop] === point["Control Value"].eValue) {
                                point["Control Value"].Value = prop;
                                hasEValue = true;
                            }
                        }

                        if (!hasEValue) {
                            point["Control Value"].Value = tempOption.Value;
                            point["Control Value"].eValue = tempOption.eValue;
                        }
                    }
                    point["Control Value"].isReadOnly = false;
                    point["Control Value"].isDisplayable = true;

                    switch (point["Control Property"].Value) {
                        case "Alarm Value":
                        case "Out of Service":
                        case "Execute Now":
                        case "Alarms Off":
                        case "Low Alarm Limit":
                        case "High Alarm Limit":
                            point["Host Schedule"].Value = true;
                            break;
                        default:
                            break;
                    }
                };

            if (pointType !== "Schedule Entry") {
                if (point.Value.ValueType === enumsTemplatesJson.Enums["Value Types"]["Enum"]["enum"]) {
                    if (data.propertyObject.PointInst !== 0) {
                        point.States.isDisplayable = false;
                        point.Value.ValueOptions = refPoint.Value.ValueOptions;
                    } else {
                        point.States.isDisplayable = true;
                        point.Value.ValueOptions = point.States.ValueOptions;
                    }

                    for (var prop in point.Value.ValueOptions) {
                        tempOption = {
                            Value: prop,
                            eValue: point.Value.ValueOptions[prop]
                        };
                        if (point.Value.ValueOptions[prop] === point.Value.eValue) {
                            point.Value.Value = prop;
                            hasEValue = true;
                        }
                    }
                    if (!hasEValue) {
                        point.Value.Value = tempOption.Value;
                        point.Value.eValue = tempOption.eValue;
                    }
                }
            } else if (refPoint !== null) {
                applyScheduleEntry();
            }
            return point;
        },

        applyDelayMointorPoint: function(data) {
            var point = data.point, // Shortcut
                refPoint = data.refPoint; // Shortcut

            var hasEValue = false;
            var tempOption = {};

            if (data.propertyObject.PointInst !== 0) {
                point["Trigger Constant"].ValueOptions = refPoint.Value.ValueOptions;

                for (var prop in point["Trigger Constant"].ValueOptions) {
                    tempOption = {
                        eValue: point["Trigger Constant"].ValueOptions[prop],
                        Value: prop
                    };
                    if (point["Trigger Constant"].ValueOptions[prop] === point["Trigger Constant"].eValue) {
                        point["Trigger Constant"].Value = prop;
                        hasEValue = true;
                    }
                }
                if (!hasEValue) {
                    point["Trigger Constant"].Value = tempOption.Value;
                    point["Trigger Constant"].eValue = tempOption.eValue;
                }

                point["Trigger Constant"].isReadOnly = false;
            }

            return point;
        },

        applyInterlockPoint: function(data) {
            var point = data.point;
            var refPoint = data.refPoint;
            var hasEValue = false;
            var tempOption = {};

            if (data.propertyObject.PointInst !== 0) {
                point["Interlock State"].ValueOptions = refPoint.Value.ValueOptions;
                for (var prop in point["Interlock State"].ValueOptions) {
                    tempOption = {
                        eValue: point["Interlock State"].ValueOptions[prop],
                        Value: prop
                    };
                    if (point["Interlock State"].ValueOptions[prop] === point["Interlock State"].eValue) {
                        point["Interlock State"].Value = prop;
                        hasEValue = true;
                    }
                }
                if (!hasEValue) {
                    point["Interlock State"].Value = tempOption.Value;
                    point["Interlock State"].eValue = tempOption.eValue;
                }

                point["Interlock State"].isDisplayable = true;
                point["Interlock State"].isReadOnly = false;
            } else {
                point["Interlock State"].isDisplayable = false;
            }
            return point;
        },

        applyAlarmAdjustPoint: function(data) {
            var point = data.point;

            if (data.propertyObject.PointInst === 0) {
                point["Alarm Adjust Band"].isDisplayable = false;
                point["Warning Adjust Band"].isDisplayable = false;
            } else {
                point["Alarm Adjust Band"].isDisplayable = true;
                if (point["Enable Warning Alarms"].Value === false) {
                    point["Warning Adjust Band"].isDisplayable = false;
                } else {
                    point["Warning Adjust Band"].isDisplayable = true;
                }
            }
                return point;
        },

        applyOutOfService: function(data) {
            var point = data.point;

            if (point["Point Type"].Value !== "Accumulator" && point["Point Type"].Value !== "Analog Output" && point["Point Type"].Value !== "Analog Value" && point["Point Type"].Value !== "Binary Output" && point["Point Type"].Value !== "Binary Value" && point["Point Type"].Value !== "MultiState Value") {
                if (point["Out of Service"].Value === true) {
                    point.Value.isReadOnly = false;
                } else {
                    point.Value.isReadOnly = true;
                }
            }
            return point;
        },

        applyResetInterval: function(data) {
            var point = data.point;

            if (point["Reset Interval"].Value === "Manual") {
                point["Reset Time"].isDisplayable = false;
            } else {
                point["Reset Time"].isDisplayable = true;
            }
            return point;
        },

        applySelectInput: function(data) {
            var point = data.point;
            var refPoint = data.refPoint;
            var hasEValue = false;
            var tempOption = {};

            if (data.propertyObject.PointInst !== 0) {
                point["Select State"].ValueOptions = refPoint.Value.ValueOptions;
                for (var prop in point["Select State"].ValueOptions) {
                    tempOption = {
                        eValue: point["Select State"].ValueOptions[prop],
                        Value: prop
                    };
                    if (point["Select State"].ValueOptions[prop] === point["Select State"].eValue) {
                        point["Select State"].Value = prop;
                        hasEValue = true;
                    }
                }
                if (!hasEValue) {
                    point["Select State"].Value = tempOption.Value;
                    point["Select State"].eValue = tempOption.eValue;
                }

                point["Select State"].isDisplayable = true;
                point["Select State"].isReadOnly = false;
            } else {
                point["Select State"].isDisplayable = false;
            }
            return point;
        },

        applySetpointInput: function(data) {
            var point = data.point;
            var refPoint = data.refPoint;
            if (point["Point Type"].Value !== "Optimum Start") {
                if (data.propertyObject.PointInst !== 0) {
                    point["Setpoint Value"].isDisplayable = false;
                } else {
                    point["Setpoint Value"].isDisplayable = true;
                }
            }

            return point;
        },

        applyShutdownPoint: function(data) {
            var point = data.point;
            var refPoint = data.refPoint;
            var hasEValue = false;
            var tempOption = {};

            if (data.propertyObject.PointInst !== 0) {
                point["Shutdown State"].ValueOptions = refPoint.Value.ValueOptions;
                for (var prop in point["Shutdown State"].ValueOptions) {
                    tempOption = {
                        eValue: point["Shutdown State"].ValueOptions[prop],
                        Value: prop
                    };
                    if (point["Shutdown State"].ValueOptions[prop] === point["Shutdown State"].eValue) {
                        point["Shutdown State"].Value = prop;
                        hasEValue = true;
                    }
                }
                if (!hasEValue) {
                    point["Shutdown State"].Value = tempOption.Value;
                    point["Shutdown State"].eValue = tempOption.eValue;
                }

                point["Shutdown State"].isDisplayable = true;
                point["Shutdown State"].isReadOnly = false;
            } else {
                point["Shutdown State"].isDisplayable = false;
            }
            return point;
        },

        applyStates: function(data) {
            var point = data.point;

            // This only applies if a control point is NOT defined. States is hidden if a control point is defined
            // so we couldn't/shouldn't arrive here anyway.
            var highestEState = 0;
            var highestState = "";

            for (var enumKey in point.States.ValueOptions) {
                if (point.States.ValueOptions[enumKey] > highestEState) {
                    highestEState = point.States.ValueOptions[enumKey];
                    highestState = enumKey;
                }
            }
            point.States.eValue = highestEState;
            point.States.Value = highestState;
            point.Value.ValueOptions = point.States.ValueOptions;

            return point;
        },

        applyTriggerPoint: function(data) {
            var point = data.point;

            if (data.propertyObject.PointInst !== 0)
                point["Trigger Constant"].isDisplayable = false;
            else
                point["Trigger Constant"].isDisplayable = true;

            return point;
        },

        applyAlarmRepeatEnable: function(data) {
            if (data.point["Alarm Repeat Enable"].Value === false)
                data.point["Alarm Repeat Time"].isDisplayable = false;
            else
                data.point["Alarm Repeat Time"].isDisplayable = true;

            return data.point;
        },

        applyDeviceUplinkPort: function(data) {
            var point = data.point,
                enums = enumsTemplatesJson.Enums,
                port = point["Uplink Port"].Value,
                ports = ["Ethernet", "Port 1", "Port 2", "Port 3", "Port 4"];

            for (var i = 0; i < 5; i++) {
                if (port === ports[i]) {
                    point[ports[i] + " Protocol"].isReadOnly = true;
                    if (port === "Ethernet") {
                        point["Ethernet Protocol"].Value = "IP";
                        point["Ethernet Protocol"].eValue = enums["Ethernet Protocols"]["IP"]["enum"];
                        point["Downlink Protocol"].isDisplayable = obj.Utility.checkMicroScan5Device(point);
                    } else {
                        point[ports[i] + " Protocol"].Value = "MS/TP";
                        point[ports[i] + " Protocol"].eValue = enums["Port Protocols"]["MS/TP"]["enum"];
                        point["Downlink Protocol"].isDisplayable = false;
                    }
                } else {
                    point[ports[i] + " Protocol"].isReadOnly = false;
                }
            }
            obj.EditChanges.applyDeviceEthernetProtocol(data);
            obj.EditChanges.applyDeviceDownlinkProtocol(data);
            return obj.EditChanges.applyDevicePortNProtocol(data);
        },

        applyDeviceEthernetProtocol: function(data) {
            var point = data.point,
                setDisp = obj.Utility.setPropsDisplayable;

            if ((point["Ethernet Protocol"].Value === "IP") && (point["Ethernet Protocol"].isDisplayable === true)) {
                var ro = (point["Uplink Port"].Value === "Ethernet") ? true : false;
                point["Ethernet Gateway"].isReadOnly = ro;
                point["Ethernet Subnet"].isReadOnly = ro;
                point["Ethernet IP Port"].isReadOnly = (point["Ethernet Network"].Value !== 0) ? true : false;
                point["Ethernet Network"].isDisplayable = true;
                if (obj.Utility.checkMicroScan5Device(point)) {
                    setDisp(point, ["Ethernet Address", "Ethernet IP Port", "Ethernet Gateway", "Ethernet Subnet", "Ethernet Network"], true);
                } else {
                    setDisp(point, ["Ethernet Address", "Ethernet IP Port"], ro);
                    setDisp(point, ["Ethernet Gateway", "Ethernet Subnet"], false);
                }
            } else {
                setDisp(point, ["Ethernet Address", "Ethernet IP Port", "Ethernet Gateway", "Ethernet Subnet", "Ethernet Network"], false);
            }
            return point;
        },

        applyDeviceDownlinkProtocol: function(data) {
            var point = data.point,
                disp = ((point["Downlink Protocol"].Value === "IP") && (point["Downlink Protocol"].isDisplayable === true)) ? true : false;

            point["Downlink IP Port"].isReadOnly = (point["Downlink Network"].Value !== 0) ? true : false;
            obj.Utility.setPropsDisplayable(point, ["Downlink Broadcast Delay", "Downlink IP Port", "Downlink Network"], disp);
            return point;
        },

        applyDevicePortNProtocol: function(data) {
            var point = data.point,
                port = ["Port 1", "Port 2", "Port 3", "Port 4"];

            for (var i = 0; i < 4; i++) {
                if (point[port[i] + " Protocol"].isDisplayable === false) {
                    point[port[i] + " Protocol"].Value = "None";
                    point[port[i] + " Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                    point[port[i] + " Address"].isDisplayable = false;
                    point[port[i] + " Maximum Address"].isDisplayable = false;
                    point[port[i] + " Network"].isDisplayable = false;
                } else if ((point[port[i] + " Protocol"].Value === "MS/TP") || (point[port[i] + " Protocol"].Value === "MS/RTU")) {
                    point[port[i] + " Address"].isDisplayable = true;
                    point[port[i] + " Network"].isDisplayable = true;
                    point[port[i] + " Maximum Address"].isDisplayable = true;
                } else {
                    point[port[i] + " Address"].isDisplayable = false;
                    point[port[i] + " Maximum Address"].isDisplayable = false;
                    point[port[i] + " Network"].isDisplayable = false;
                }
            }
            return point;
        },

        applyDeviceDevModel: function(data) {
            var point = data.point,
                enums = enumsTemplatesJson.Enums,
                setDisp = obj.Utility.setPropsDisplayable,
                setValOpt = obj.Utility.setupPropValueOptions,
                upPort = point["Uplink Port"],
                port = ["Port 1", "Port 2", "Port 3", "Port 4"];

            point["Model Type"].isDisplayable = true;
            point["Model Type"].isReadOnly = false;
            point._devModel = point["Model Type"].eValue;
            point._relPoint = enums.Reliabilities["No Fault"]["enum"];
            point["Time Zone"].isReadOnly = true;
            setDisp(point, ["Firmware 2 Version", "Serial Number", "Trend Interval"], false);

            if (obj.Utility.checkMicroScan5Device(point)) {
                point["Time Zone"].isReadOnly = false;
                point["Firmware 2 Version"].isDisplayable = !!~["MicroScan 5 UNV", "SCADA Vio", "SCADA IO"].indexOf(point["Model Type"].Value);
                setValOpt(upPort, {
                    "Ethernet": enums["Device Ports"]["Ethernet"]["enum"],
                    "Port 1": enums["Device Ports"]["Port 1"]["enum"],
                    "Port 2": enums["Device Ports"]["Port 2"]["enum"],
                    "Port 3": enums["Device Ports"]["Port 3"]["enum"],
                    "Port 4": enums["Device Ports"]["Port 4"]["enum"]
                });
                setDisp(point, ["Ethernet Protocol", "Port 1 Protocol", "Port 2 Protocol", "Port 3 Protocol", "Port 4 Protocol", "Serial Number", "Trend Interval"], true);

            } else if (obj.Utility.checkMicroScan4Device(point)) {
                setValOpt(upPort, {
                    "Ethernet": enums["Device Ports"]["Ethernet"]["enum"],
                    "Port 1": enums["Device Ports"]["Port 1"]["enum"]
                });
                point["Trend Interval"].Value = 60;
                setDisp(point, ["Ethernet Protocol", "Port 1 Protocol", "Port 2 Protocol"], true);
                setDisp(point, ["Port 3 Protocol", "Port 4 Protocol"], false);
            } else if (point["Model Type"].Value === "Central Device") {
                setValOpt(upPort, {
                    "Ethernet": enums["Device Ports"]["Ethernet"]["enum"]
                });
                setDisp(point, ["Port 1 Protocol", "Port 2 Protocol", "Port 3 Protocol", "Port 4 Protocol"], false);
                point["Ethernet Protocol"].isDisplayable = true;
                point["Ethernet Address"].isReadOnly = true;
                point["Ethernet Network"].isReadOnly = true;
                point._cfgRequired = false;
                point._cfgDevice = false;
            } else {
                setValOpt(upPort, {
                    "Port 1": enums["Device Ports"]["Port 1"]["enum"]
                });
                point["Trend Interval"].Value = 60;
                point["Port 1 Protocol"].isDisplayable = true;
                setDisp(point, ["Ethernet Protocol", "Port 2 Protocol", "Port 3 Protocol", "Port 4 Protocol"], false);
            }
            return obj.EditChanges.applyDeviceUplinkPort(data);
        },

        applyRemoteUnitNetworkType: function(point) {
            var nt,
                setDisp = obj.Utility.setPropsDisplayable;

            if (point.Instance.isDisplayable) {
                point["Modbus Unit Id"].isDisplayable = false;
                nt = point["Network Type"].Value;
                if (nt === "Unknown") {
                    setDisp(point, ["Device Address", "Network Segment", "Ethernet IP Port", "Router Address"], false);
                } else {
                    setDisp(point, ["Device Address", "Network Segment"], true);
                    point["Ethernet IP Port"].isDisplayable = (nt === "IP") ? true : false;

                    if (point.Gateway.isDisplayable && point.Gateway.Value) {
                        point["Ethernet IP Port"].isReadOnly = false;
                        point["Router Address"].isDisplayable = (point["Network Segment"].Value !== 0) ? true : false;
                    } else {
                        point["Ethernet IP Port"].isReadOnly = true;
                        point["Router Address"].isDisplayable = false;
                    }
                }

            } else {
                point["Device Address"].isDisplayable = true;
                setDisp(point, ["Network Segment", "Router Address"], false);
                if (point["Device Port"].Value === "Ethernet") {
                    setDisp(point, ["Modbus Unit Id", "Ethernet IP Port"], true);
                } else {
                    setDisp(point, ["Modbus Unit Id", "Ethernet IP Port"], false);
                }
            }
            return point;
        },

        applyRemoteUnitDevModel: function(data) {
            var point = data.point,
                enums = enumsTemplatesJson.Enums,
                setDisp = obj.Utility.setPropsDisplayable,
                modelType,
                temp,
                ms5Dev,
                rmuOpt,
                valOpt5 = {
                    "Ethernet": enums["Device Ports"]["Ethernet"]["enum"],
                    "Port 1": enums["Device Ports"]["Port 1"]["enum"],
                    "Port 2": enums["Device Ports"]["Port 2"]["enum"],
                    "Port 3": enums["Device Ports"]["Port 3"]["enum"],
                    "Port 4": enums["Device Ports"]["Port 4"]["enum"]
                },
                valOpt4 = {
                    "Port 1": enums["Device Ports"]["Port 1"]["enum"],
                    "Port 2": enums["Device Ports"]["Port 2"]["enum"],
                    "Port 3": enums["Device Ports"]["Port 3"]["enum"],
                    "Port 4": enums["Device Ports"]["Port 4"]["enum"]
                },
                valOpt3 = {
                    "Ethernet": enums["Device Ports"]["Ethernet"]["enum"],
                    "Port 1": enums["Device Ports"]["Port 1"]["enum"],
                    "Port 2": enums["Device Ports"]["Port 2"]["enum"]
                },
                valOpt2 = {
                    "Port 1": enums["Device Ports"]["Port 1"]["enum"],
                    "Port 2": enums["Device Ports"]["Port 2"]["enum"]
                };

            if (obj.revEnums["Device Model Types"][point._devModel] === undefined) {
                point._devModel = enums["Device Model Types"]["Unknown"]["enum"];
            }
            if (enums["Remote Unit Model Types"][point["Model Type"].Value] === undefined) {
                point["Model Type"].Value = "Unknown";
            }
            modelType = point["Model Type"].Value;
            point["Model Type"].isDisplayable = true;
            point["Model Type"].eValue = enums["Remote Unit Model Types"][modelType]["enum"];
            point._rmuModel = point["Model Type"].eValue;

            setDisp(point, ["Configure Device", "Firmware Version", "Device Port", "Poll Function", "Poll Register", "Instance", "Network Type", "Gateway"], false);
            rmuOpt = obj.Utility.getRmuValueOptions(point._devModel);

            if ((point._devModel === enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enums["Device Model Types"]["Unknown"]["enum"])) {
                point._relPoint = enums.Reliabilities["Invalid Device Model Type"]["enum"];
            } else if ((modelType === "Unknown") || (rmuOpt[modelType] === undefined)) {
                point._relPoint = enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
            } else {
                point._relPoint = enums.Reliabilities["No Fault"]["enum"];

                ms5Dev = obj.Utility.checkMicroScan5Device(point);
                if (ms5Dev) {
                    point["Device Port"].isDisplayable = true;
                    if (modelType === "BACnet") {
                        point["Device Port"].ValueOptions = valOpt5;
                    } else if (obj.Utility.checkModbusRMU(point)) {
                        point["Device Port"].ValueOptions = valOpt5;
                    } else if (obj.Utility.checkMicroScanRMU(point)) {
                        point["Device Port"].ValueOptions = valOpt4;
                    } else {
                        point["Device Port"].ValueOptions = valOpt4;
                    }
                } else if (obj.Utility.checkMicroScan4Device(point)) {
                    point["Device Port"].isDisplayable = true;
                    if (modelType === "BACnet") {
                        point["Device Port"].ValueOptions = valOpt3;
                    } else if (obj.Utility.checkModbusRMU(point)) {
                        point["Device Port"].ValueOptions = valOpt2;
                    } else if (obj.Utility.checkMicroScanRMU(point)) {
                        point["Device Port"].ValueOptions = valOpt2;
                    } else {
                        point["Device Port"].ValueOptions = valOpt2;
                    }
                } else {
                    point["Device Port"].ValueOptions = {
                        "Port 2": enums["Device Ports"]["Port 2"]["enum"]
                    };
                }
                temp = point["Device Port"].ValueOptions[point["Device Port"].Value];
                if (temp !== undefined) {
                    point["Device Port"].eValue = temp;
                } else {
                    point["Device Port"].Value = "Port 2";
                    point["Device Port"].eValue = enums["Device Ports"]["Port 2"]["enum"];
                }
                if (obj.Utility.checkMicroScanRMU(point)) {
                    setDisp(point, ["Configure Device", "Firmware Version"], true);
                } else if (modelType === "IFC Remote Unit") {
                    point["Configure Device"].isDisplayable = true;
                } else {
                    point["Configure Device"].Value = false;

                    if (obj.Utility.checkModbusRMU(point)) {
                        point["Ethernet IP Port"].isReadOnly = false;
                        if (modelType === "Programmable Modbus") {
                            setDisp(point, ["Poll Function", "Poll Register"], true);
                        }
                    } else if (modelType === "BACnet") {
                        setDisp(point, ["Instance", "Network Type"], true);
                        if (ms5Dev) {
                            point.Gateway.isDisplayable = true;
                        } else {
                            point.Gateway.Value = false;
                        }
                    }
                }
            }
            return obj.EditChanges.applyRemoteUnitNetworkType(point);
        },

        applyConversionTypeProperty: function(data) {
            var point = data.point,
                disp,
                ro,
                prop = "Conversion Coefficient ",
                propertyObject = data.propertyObject;

            if (data.property !== "Conversion Type") {
                propertyObject = obj.Utility.getPropertyObject("Conversion Type", data.point);
            }
            disp = propertyObject.isDisplayable;
            ro = propertyObject.isReadOnly;
            for (var i = 1; i < 5; i++) {
                point[prop + i].isDisplayable = disp;
                point[prop + i].isReadOnly = ro;
            }
            if (!!disp) {
                if (propertyObject.Value === "Linear") {
                    point[prop + 3].isDisplayable = false;
                    point[prop + 4].isDisplayable = false;
                } else if (propertyObject.Value !== "Cubic") {
                    point[prop + 4].isDisplayable = false;
                }
            }
            return point;
        },

        applyAnalogInputSensorPoint: function(data) {
            var point = data.point,
                refPoint = data.refPoint,
                prop = "Conversion Coefficient ";

            if (data.propertyObject.PointInst !== 0) {
                point["Conversion Type"].isReadOnly = true;
                point["Conversion Type"].eValue = refPoint["Conversion Type"].eValue;
                point["Conversion Type"].Value = refPoint["Conversion Type"].Value;

                for (var i = 1; i < 5; i++) {
                    point[prop + i].Value = refPoint[prop + i].Value;
                }
            } else {
                point["Conversion Type"].isReadOnly = false;
            }
            return obj.EditChanges.applyConversionTypeProperty(data);
        },

        applyAnalogInputDevModel: function(data) {
            var point = data.point,
                eRmu = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                eDev = enumsTemplatesJson.Enums["Device Model Types"],
                setValOpt = obj.Utility.setupPropValueOptions,
                setCh = obj.Utility.setChannelOptions,
                setDisp = obj.Utility.setPropsDisplayable,
                inType = point["Input Type"],
                ch = point.Channel,
                sensorPoint = obj.Utility.getPropertyObject("Sensor Point", point);

            setDisp(point, ["Input Type", "Channel", "Instance", "Read Only", "Modbus Order", "Poll Register", "Poll Data Type", "Poll Function"], false);
            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if (point._relPoint === enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"]) {
                switch (point._rmuModel) {
                    case eRmu["Programmable Modbus"]["enum"]:
                    case eRmu["Liebert"]["enum"]:
                    case eRmu["Sierra Steam Meter"]["enum"]:
                    case eRmu["Siemens Power Meter"]["enum"]:
                    case eRmu["Ingersol Rand Intellysis"]["enum"]:
                    case eRmu["PowerLogic 3000 Meter"]["enum"]:
                    case eRmu["Generic Modbus"]["enum"]:
                    case eRmu["PowerTraks 9000"]["enum"]:
                        obj.Utility.setModbusPropsDisp(point);
                        break;

                    case eRmu["BACnet"]["enum"]:
                        point.Instance.isDisplayable = true;
                        if (obj.Utility.checkMicroScan5Device(point)) {
                            point["Read Only"].isDisplayable = true;
                        }
                        break;

                    case eRmu["MS 4 VAV"]["enum"]:
                        setValOpt(inType, {
                            "Normal": 0,
                            "Inverted": 2,
                            "Velocity": 3
                        });
                        setValOpt(ch, {
                            "1 - Zone Temperature": 1,
                            "2 - Setpoint Adjust": 2,
                            "3 - Supply Temperature": 3,
                            "4 - Auxiliary": 4,
                            "5 - Air Volume": 5
                        });
                        break;

                    case eRmu["MS3 RT"]["enum"]:
                    case eRmu["MS 3 EEPROM"]["enum"]:
                    case eRmu["MS 3 Flash"]["enum"]:
                        setValOpt(inType, {
                            "Normal": 0,
                            "Inverted": 2,
                            "Velocity": 3
                        });
                        setCh(ch, 0, 7);
                        break;

                    case eRmu["N2 Device"]["enum"]:
                        point.Instance.isDisplayable = true;
                        break;

                    case eRmu["IFC Remote Unit"]["enum"]:
                        setValOpt(inType, {
                            "High Resistance": 0,
                            "High Voltage": 1,
                            "Low Resistance": 2,
                            "Low Voltage": 3
                        });
                        setCh(ch, 0, 15);
                        break;

                    case eRmu["Smart II Remote Unit"]["enum"]:
                        setCh(ch, 0, 7);
                        break;

                    default: // Unknown, no RMU
                        switch (point._devModel) {
                            case eDev["MicroScan 5 UNV"]["enum"]:
                                setValOpt(inType, {
                                    "Resistance": 0,
                                    "5 Volt": 1,
                                    "10 Volt": 2,
                                    "20 mA SP": 3,
                                    "20 mA LP": 4,
                                    "Rate Input": 5
                                });
                                setCh(ch, 1, 16);
                                break;
                            case eDev["SCADA Vio"]["enum"]:
                                setValOpt(inType, {
                                    "20 mA SP": 3,
                                    "Rate Input": 5
                                });
                                setCh(ch, 1, 2);
                                break;
                            case eDev["SCADA IO"]["enum"]:
                                setValOpt(inType, {
                                    "10 Volts": 2,
                                    "20 mA": 3,
                                    "Rate Input": 5
                                });
                                setValOpt(ch, {
                                    "I/O 1": 1,
                                    "I/O 2": 2,
                                    "I/O 3": 3,
                                    "I/O 4": 4,
                                    "I/O 5": 5,
                                    "I/O 6": 6,
                                    "I/O 7": 7,
                                    "I/O 8": 8,
                                    "Battery Voltage": 9,
                                    "Temperature": 10,
                                    "Power Voltage": 11,
                                    "Power Current": 12,
                                    "Power Consumption": 13
                                });
                                break;
                            case eDev["MicroScan 4 UNV"]["enum"]:
                                setValOpt(inType, {
                                    "Normal": 0,
                                    "Rate Input": 1
                                });
                                setCh(ch, 1, 16);
                                break;
                            default: // MicroScan 4 Digital
                                setValOpt(inType, {
                                    "Rate Input": 1
                                });
                                setCh(ch, 1, 32);
                                break;
                        }
                        break;
                }
            }

            if (!!point.Instance.isDisplayable) {
                sensorPoint.isDisplayable = false;
                point["Conversion Type"].isDisplayable = false;
            } else {
                sensorPoint.isDisplayable = true;
                point["Conversion Type"].isDisplayable = true;
                point["Conversion Type"].isReadOnly = (sensorPoint.PointInst !== 0) ? true : false;
            }
            return obj.EditChanges.applyConversionTypeProperty(data);
        },

        applyBinaryInputFeedbackPoint: function(data) {
            var point = data.point;

            if (data.propertyObject.PointInst !== 0) {

                point["Feedback Polarity"].isDisplayable = true;
                point["Alarm Value"].isDisplayable = false;
            } else {

                point["Feedback Polarity"].isDisplayable = false;
                point["Alarm Value"].isDisplayable = true;
            }
            return point;
        },

        applyBinaryInputInputType: function(data) {
            var point = data.point,
                type = point["Input Type"];

            point["Momentary Delay"].isDisplayable = (type.isDisplayable && (type.Value === "Momentary")) ? true : false;
            return point;
        },

        applyBinaryInputDevModel: function(data) {
            var point = data.point,
                eRmu = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                eDev = enumsTemplatesJson.Enums["Device Model Types"],
                setValOpt = obj.Utility.setupPropValueOptions,
                setCh = obj.Utility.setChannelOptions,
                setDisp = obj.Utility.setPropsDisplayable,
                ch = point.Channel,
                type = point["Input Type"];

            setDisp(point, ["Input Type", "Channel", "Instance", "Read Only", "Modbus Order", "Poll Register", "Poll Data Type", "Poll Function", "Supervised Input"], false);
            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if (point._relPoint === enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"]) {
                switch (point._rmuModel) {
                    case eRmu["Programmable Modbus"]["enum"]:
                    case eRmu["Liebert"]["enum"]:
                    case eRmu["Sierra Steam Meter"]["enum"]:
                    case eRmu["Siemens Power Meter"]["enum"]:
                    case eRmu["Ingersol Rand Intellysis"]["enum"]:
                    case eRmu["PowerLogic 3000 Meter"]["enum"]:
                    case eRmu["Generic Modbus"]["enum"]:
                    case eRmu["PowerTraks 9000"]["enum"]:
                        obj.Utility.setModbusPropsDisp(point);
                        break;

                    case eRmu["BACnet"]["enum"]:
                        point.Instance.isDisplayable = true;
                        if (obj.Utility.checkMicroScan5Device(point)) {
                            point["Read Only"].isDisplayable = true;
                        }
                        break;

                    case eRmu["MS 4 VAV"]["enum"]:
                        setValOpt(ch, {
                            "1 - Occupancy Override": 1,
                            "2 - Occupancy Sensor": 2
                        });
                        break;

                    case eRmu["MS3 RT"]["enum"]:
                    case eRmu["MS 3 EEPROM"]["enum"]:
                    case eRmu["MS 3 Flash"]["enum"]:
                        point["Supervised Input"].isDisplayable = true;
                        setCh(ch, 0, 7);
                        break;

                    case eRmu["N2 Device"]["enum"]:
                        point.Instance.isDisplayable = true;
                        break;

                    case eRmu["IFC Remote Unit"]["enum"]:
                        point["Supervised Input"].isDisplayable = true;
                        setCh(ch, 0, 15);
                        break;

                    case eRmu["Smart II Remote Unit"]["enum"]:
                        setCh(ch, 0, 7);
                        break;

                    default: // Unknown, no RMU
                        setValOpt(type, {
                            "Latch": 0,
                            "Momentary": 1,
                            "Pulse": 2
                        });
                        switch (point._devModel) {
                            case eDev["MicroScan 5 UNV"]["enum"]:
                            case eDev["MicroScan 4 UNV"]["enum"]:
                                setCh(ch, 1, 16);
                                break;
                            case eDev["SCADA Vio"]["enum"]:
                                setCh(ch, 1, 9);
                                break;
                            case eDev["SCADA IO"]["enum"]:
                                setValOpt(ch, {
                                    "I/O 1": 1,
                                    "I/O 2": 2,
                                    "I/O 3": 3,
                                    "I/O 4": 4,
                                    "I/O 5": 5,
                                    "I/O 6": 6,
                                    "I/O 7": 7,
                                    "I/O 8": 8
                                });
                                break;
                            case eDev["MicroScan 4 Digital"]["enum"]:
                                setCh(ch, 1, 32);
                                break;
                            default: // MicroSPC Device
                                setCh(ch, 0, 0);
                                ch.isDisplayable = false;
                                type.isDisplayable = false;
                                break;
                        }
                        break;
                }
            }
            return obj.EditChanges.applyBinaryInputInputType(data);
        },

        applyAnalogOutputSensorPoint: function(data) {
            var point = data.point,
                refPoint = data.refPoint;

            if (data.propertyObject.PointInst !== 0) {

                point["Conversion Coefficient 1"].isReadOnly = true;
                point["Conversion Coefficient 1"].Value = refPoint["Conversion Coefficient 1"].Value;
                point["Conversion Coefficient 2"].isReadOnly = true;
                point["Conversion Coefficient 2"].Value = refPoint["Conversion Coefficient 2"].Value;
            } else {
                point["Conversion Coefficient 1"].isReadOnly = false;
                point["Conversion Coefficient 2"].isReadOnly = false;
            }
            return point;
        },

        applyAnalogOutputOutputType: function(data) {
            var point = data.point,
                eRmu = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                eDev = enumsTemplatesJson.Enums["Device Model Types"],
                min,
                max,
                setCh = obj.Utility.setChannelOptions,
                setValOpt = obj.Utility.setupPropValueOptions,
                val = point["Output Type"].isDisplayable,
                ch = point["Channel"],
                och = point["Open Channel"],
                cch = point["Close Channel"];

            obj.Utility.setPropsDisplayable(point, ["Open Channel", "Channel", "Close Channel", "Polarity"], false);

            if (val) {
                val = point["Output Type"].Value;
                if ((val === "Pulsed") || (val === "Pulse Width")) {
                    point.Polarity.isDisplayable = true;
                }
                switch (point._rmuModel) {
                    case eRmu["MS 4 VAV"]["enum"]:
                        setValOpt(ch, {
                            "1 - Damper": 1,
                            "2 - Reheat": 2
                        });
                        max = -1;
                        break;

                    case eRmu["MS3 RT"]["enum"]:
                    case eRmu["MS 3 EEPROM"]["enum"]:
                    case eRmu["MS 3 Flash"]["enum"]:
                        min = 0;
                        max = (val === "Analog") ? 3 : 7;
                        break;

                    case eRmu["Smart II Remote Unit"]["enum"]:
                        min = 0;
                        max = 7;
                        break;

                    case eRmu["IFC Remote Unit"]["enum"]:
                        min = 0;
                        max = (val === "Analog") ? 3 : 15;
                        break;

                    default: // Unknown, no RMU
                        min = 1;
                        switch (point._devModel) {
                            case eDev["SCADA IO"]["enum"]:
                                if (val === "Pulsed") {
                                    setValOpt(och, {
                                        "I/O 1": 1,
                                        "I/O 2": 2,
                                        "I/O 3": 3,
                                        "I/O 4": 4,
                                        "I/O 5": 5,
                                        "I/O 6": 6,
                                        "I/O 7": 7,
                                        "I/O 8": 8
                                    });
                                    setValOpt(cch, {
                                        "I/O 1": 1,
                                        "I/O 2": 2,
                                        "I/O 3": 3,
                                        "I/O 4": 4,
                                        "I/O 5": 5,
                                        "I/O 6": 6,
                                        "I/O 7": 7,
                                        "I/O 8": 8
                                    });
                                } else {
                                    setValOpt(ch, {
                                        "I/O 1": 1,
                                        "I/O 2": 2,
                                        "I/O 3": 3,
                                        "I/O 4": 4,
                                        "I/O 5": 5,
                                        "I/O 6": 6,
                                        "I/O 7": 7,
                                        "I/O 8": 8
                                    });
                                }
                                max = -1;
                                break;
                            case eDev["MicroScan 5 UNV"]["enum"]:
                            case eDev["MicroScan 4 UNV"]["enum"]:
                                max = 8;
                                break;
                            case eDev["SCADA Vio"]["enum"]:
                                max = 5;
                                break;
                            default: // MicroScan 4 Digital
                                max = 32;
                                break;
                        }
                        break;
                }
                if (max >= 0) {
                    if (val === "Pulsed") {
                        setCh(och, min, max);
                        setCh(cch, min, max);
                    } else {
                        setCh(ch, min, max);
                    }
                }
            }
            return point;
        },

        applyAnalogOutputDevModel: function(data) {
            var point = data.point,
                eRmu = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                eDev = enumsTemplatesJson.Enums["Device Model Types"],
                setDisp = obj.Utility.setPropsDisplayable,
                setValOpt = obj.Utility.setupPropValueOptions,
                opts = {
                    "Analog": 0,
                    "Pulse Width": 1,
                    "Pulsed": 2
                },
                outType = point["Output Type"],
                sensorPoint = obj.Utility.getPropertyObject("Sensor Point", point);

            setDisp(point, ["Instance", "Read Only", "Output Type", "Modbus Order", "Poll Data Type", "Poll Function", "Poll Register", "Control Data Type", "Control Function", "Control Register", "Open Channel", "Channel", "Close Channel", "Polarity"], false);
            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if (point._relPoint === enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"]) {
                switch (point._rmuModel) {
                    case eRmu["Programmable Modbus"]["enum"]:
                    case eRmu["Liebert"]["enum"]:
                    case eRmu["Sierra Steam Meter"]["enum"]:
                    case eRmu["Siemens Power Meter"]["enum"]:
                    case eRmu["Ingersol Rand Intellysis"]["enum"]:
                    case eRmu["PowerLogic 3000 Meter"]["enum"]:
                    case eRmu["Generic Modbus"]["enum"]:
                    case eRmu["PowerTraks 9000"]["enum"]:
                        obj.Utility.setModbusPropsDisp(point);
                        break;

                    case eRmu["BACnet"]["enum"]:
                        point.Instance.isDisplayable = true;
                        if (obj.Utility.checkMicroScan5Device(point)) {
                            point["Read Only"].isDisplayable = true;
                        }
                        break;

                    case eRmu["N2 Device"]["enum"]:
                        point.Instance.isDisplayable = true;
                        break;

                    case eRmu["MS 4 VAV"]["enum"]:
                    case eRmu["MS3 RT"]["enum"]:
                    case eRmu["MS 3 EEPROM"]["enum"]:
                    case eRmu["MS 3 Flash"]["enum"]:
                    case eRmu["IFC Remote Unit"]["enum"]:
                        setValOpt(outType, opts);
                        break;

                    case eRmu["Smart II Remote Unit"]["enum"]:
                        setValOpt(outType, {
                            "Analog": 0
                        });
                        break;

                    default: // Unknown, no RMU
                        switch (point._devModel) {
                            case eDev["MicroScan 5 UNV"]["enum"]:
                                setValOpt(outType, {
                                    "0 to 5 Volt": 0,
                                    "0 to 10 Volt": 3,
                                    "0 to 20 mA": 4,
                                    "Pulse Width": 1,
                                    "Pulsed": 2
                                });
                                break;

                            case eDev["SCADA Vio"]["enum"]:
                                setValOpt(outType, {
                                    "Pulse Width": 1,
                                    "Pulsed": 2
                                });
                                break;

                            case eDev["SCADA IO"]["enum"]:
                                setValOpt(outType, {
                                    "0 to 10 Volt": 3,
                                    "0 to 20 mA": 4,
                                    "Pulse Width": 1,
                                    "Pulsed": 2
                                });
                                break;

                            case eDev["MicroScan 4 UNV"]["enum"]:
                                setValOpt(outType, opts);
                                break;

                            default: // MicroScan 4 Digital
                                setValOpt(outType, {
                                    "Pulse Width": 1,
                                    "Pulsed": 2
                                });
                                break;
                        }
                        break;
                }
                if (point.Instance.isDisplayable) {
                    sensorPoint.isDisplayable = false;
                } else {
                    sensorPoint.isDisplayable = true;
                    if (sensorPoint.PointInst !== 0) {
                        point["Conversion Coefficient 1"].isReadOnly = true;
                        point["Conversion Coefficient 2"].isReadOnly = true;
                    } else {
                        point["Conversion Coefficient 1"].isReadOnly = false;
                        point["Conversion Coefficient 2"].isReadOnly = false;
                    }
                    if (outType.isDisplayable) {
                        obj.EditChanges.applyAnalogOutputOutputType(data);
                    }
                }
                setDisp(point, ["Conversion Coefficient 1", "Conversion Coefficient 2"], sensorPoint.isDisplayable);
            }
            return point;
        },

        applyBinaryOutputTypeFeedbackType: function(data) {
            var point = data.point,
                fbPoint = obj.Utility.getPropertyObject("Feedback Point", point);

            fbPoint.isDisplayable = false;
            obj.Utility.setPropsDisplayable(point, ["Feedback Channel", "Feedback Polarity", "Open Channel", "Open Polarity", "Close Channel", "Close Polarity"], false);

            switch (point["Feedback Type"].Value) {
                case "Single":
                    obj.Utility.setPropsDisplayable(point, ["Feedback Channel", "Feedback Polarity"], true);
                    break;

                case "Dual":
                    obj.Utility.setPropsDisplayable(point, ["Open Channel", "Open Polarity", "Close Channel", "Close Polarity"], true);
                    break;

                case "Point":
                    point["Feedback Polarity"].isDisplayable = true;
                    fbPoint.isDisplayable = true;
                    break;

                case "Remote":
                    fbPoint.isDisplayable = true;
                    break;

                default: // None or Remote
                    break;
            }
            return point;
        },

        applyBinaryOutputOutputType: function(data) {
            var point = data.point,
                disp;

            if ((point["Output Type"].Value === "Latch") || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"])) {
                point.Channel.isDisplayable = true;
                disp = false;
            } else {
                point.Channel.isDisplayable = false;
                disp = true;
            }
            obj.Utility.setPropsDisplayable(point, ["On Channel", "Off Channel", "Momentary Delay"], disp);
            return point;
        },

        // TODO Coordinate with Rob to remove this routine
        //applyBinaryOutputTypeFeedbackPoint: function(data) {},

        applyBinaryOutputDevModel: function(data) {
            var point = data.point,
                eRmu = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                eDev = enumsTemplatesJson.Enums["Device Model Types"],
                setValOpt = obj.Utility.setupPropValueOptions,
                setCh = obj.Utility.setChannelOptions,
                setDisp = obj.Utility.setPropsDisplayable,
                ioOpts = {
                    "I/O 1": 1,
                    "I/O 2": 2,
                    "I/O 3": 3,
                    "I/O 4": 4,
                    "I/O 5": 5,
                    "I/O 6": 6,
                    "I/O 7": 7,
                    "I/O 8": 8
                },
                fbMin = 1,
                fbMax = -1,
                fbType = point["Feedback Type"],
                chMin = 1,
                chMax = -1,
                outType = point["Output Type"];

            setDisp(point, ["Output Type", "Momentary Delay", "Feedback Type", "Instance", "Read Only", "Modbus Order", "Poll Data Type", "Poll Function", "Poll Register", "On Control Data Type", "On Control Function", "On Control Register", "On Control Value", "Off Control Data Type", "Off Control Function", "Off Control Register", "Off Control Value", "Channel", "On Channel", "Off Channel", "Feedback Channel", "Open Channel", "Close Channel", "Polarity", "Feedback Polarity", "Open Polarity", "Close Polarity", "Same State Test", "Supervised Input"], false);
            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if (point._relPoint === enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"]) {
                switch (point._rmuModel) {
                    case eRmu["Programmable Modbus"]["enum"]:
                    case eRmu["Liebert"]["enum"]:
                    case eRmu["Sierra Steam Meter"]["enum"]:
                    case eRmu["Siemens Power Meter"]["enum"]:
                    case eRmu["Ingersol Rand Intellysis"]["enum"]:
                    case eRmu["PowerLogic 3000 Meter"]["enum"]:
                    case eRmu["Generic Modbus"]["enum"]:
                    case eRmu["PowerTraks 9000"]["enum"]:
                        obj.Utility.setModbusPropsDisp(point);
                        setValOpt(fbType, {
                            "None": 0,
                            "Point": 3
                        });
                        break;

                    case eRmu["BACnet"]["enum"]:
                        point.Instance.isDisplayable = true;
                        if (obj.Utility.checkMicroScan5Device(point)) {
                            point["Read Only"].isDisplayable = true;
                        }
                        setValOpt(fbType, {
                            "None": 0,
                            "Point": 3,
                            "Remote": 4
                        });
                        break;

                    case eRmu["N2 Device"]["enum"]:
                        point.Instance.isDisplayable = true;
                        setValOpt(fbType, {
                            "None": 0,
                            "Single": 1,
                            "Point": 3
                        });
                        fbMax = 255;
                        break;

                    case eRmu["MS 4 VAV"]["enum"]:
                        setValOpt(fbType, {
                            "None": 0
                        });
                        fbType.isDisplayable = false;
                        setValOpt(outType, {
                            "Latch": 0,
                            "Momentary": 1
                        });
                        setValOpt(point.Channel, {
                            "3 - Lights": 3,
                            "5 - Fan": 5,
                            "6 - Digital Heat 1": 6,
                            "7 - Digital Heat 2": 7,
                            "8 - Digital Heat 3": 8
                        });
                        break;

                    case eRmu["MS3 RT"]["enum"]:
                    case eRmu["MS 3 EEPROM"]["enum"]:
                    case eRmu["MS 3 Flash"]["enum"]:
                        setDisp(point, ["Supervised Input", "Same State Test"], true);
                        setValOpt(fbType, {
                            "None": 0,
                            "Single": 1,
                            "Point": 3
                        });
                        fbMin = 0;
                        fbMax = 7;
                        setValOpt(outType, {
                            "Latch": 0,
                            "Momentary": 1
                        });
                        chMin = 0;
                        chMax = 7;
                        break;

                    case eRmu["IFC Remote Unit"]["enum"]:
                        setDisp(point, ["Supervised Input", "Same State Test"], true);
                        setValOpt(fbType, {
                            "None": 0,
                            "Single": 1,
                            "Point": 3
                        });
                        fbMin = 0;
                        fbMax = 15;
                        setValOpt(outType, {
                            "Latch": 0,
                            "Momentary": 1
                        });
                        chMin = 0;
                        chMax = 15;
                        break;

                    case eRmu["Smart II Remote Unit"]["enum"]:
                        point["Same State Test"].isDisplayable = true;
                        setValOpt(fbType, {
                            "None": 0,
                            "Single": 1,
                            "Point": 3
                        });
                        fbMin = 0;
                        fbMax = 7;
                        setValOpt(outType, {
                            "Latch": 0,
                            "Momentary": 1
                        });
                        chMin = 0;
                        chMax = 7;
                        break;

                    default: // Unknown, no RMU
                        point["Same State Test"].isDisplayable = true;
                        setValOpt(fbType, {
                            "None": 0,
                            "Single": 1,
                            "Dual": 2,
                            "Point": 3
                        });
                        setValOpt(outType, {
                            "Latch": 0,
                            "Momentary": 1
                        });
                        switch (point._devModel) {
                            case eDev["MicroScan 5 UNV"]["enum"]:
                            case eDev["MicroScan 4 UNV"]["enum"]:
                                fbMax = 16;
                                chMax = 8;
                                break;

                            case eDev["SCADA Vio"]["enum"]:
                                fbMax = 9;
                                chMax = 5;
                                break;

                            case eDev["SCADA IO"]["enum"]:
                                setValOpt(point.Channel, ioOpts);
                                setValOpt(point["On Channel"], ioOpts);
                                setValOpt(point["Off Channel"], ioOpts);
                                setValOpt(point["Feedback Channel"], ioOpts);
                                setValOpt(point["Open Channel"], ioOpts);
                                setValOpt(point["Close Channel"], ioOpts);
                                break;

                            default: // MicroScan 4 Digital
                                fbMax = 32;
                                chMax = 32;
                                break;
                        }
                        break;
                }
                if (outType.isDisplayable) {
                    if (chMax >= 0) {
                        setCh(point.Channel, chMin, chMax);
                        setCh(point["On Channel"], chMin, chMax);
                        setCh(point["Off Channel"], chMin, chMax);
                    }
                    obj.EditChanges.applyBinaryOutputOutputType(data);
                }
                if (fbType.isDisplayable) {
                    if (fbMax >= 0) {
                        setCh(point["Feedback Channel"], fbMin, fbMax);
                        setCh(point["Open Channel"], fbMin, fbMax);
                        setCh(point["Close Channel"], fbMin, fbMax);
                    }
                    obj.EditChanges.applyBinaryOutputTypeFeedbackType(data);
                }
            }
            return point;
        },

        applyAnalogValueDevModel: function(data) {
            var point = data.point,
                enums = enumsTemplatesJson.Enums,
                mp = false;

            obj.Utility.setPropsDisplayable(point, ["Instance", "Read Only"], false);
            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if (point._relPoint === enums.Reliabilities["No Fault"]["enum"]) {
                switch (point._rmuModel) {
                    case enums["Remote Unit Model Types"]["BACnet"]["enum"]:
                        point.Instance.isDisplayable = true;
                        if (obj.Utility.checkMicroScan5Device(point)) {
                            point["Read Only"].isDisplayable = true;
                        }
                        break;

                    case enums["Remote Unit Model Types"]["N2 Device"]["enum"]:
                        point.Instance.isDisplayable = true;
                        break;

                    default: // Unknown, no RMU
                        mp = true;
                        break;
                }
            }
            obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = mp;
            obj.Utility.setPropsDisplayable(point, ["Demand Interval", "Demand Enable", "Fail Action"], mp);
            return point;
        },

        applyBinaryValueDevModel: function(data) {
            return obj.EditChanges.applyAnalogValueDevModel(data);
        },

        applyMultiStateValueDevModel: function(data) {
            var point = data.point,
                eRmu = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                setDisp = obj.Utility.setPropsDisplayable;

            setDisp(point, ["Instance", "Read Only", "Input Type", "Modbus Order", "Poll Data Type", "Poll Function", "Poll Register", "Control Data Type", "Control Function", "Control Register"], false);
            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if (point._relPoint === enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"]) {
                switch (point._rmuModel) {
                    case eRmu["Programmable Modbus"]["enum"]:
                    case eRmu["Liebert"]["enum"]:
                    case eRmu["Sierra Steam Meter"]["enum"]:
                    case eRmu["Siemens Power Meter"]["enum"]:
                    case eRmu["Ingersol Rand Intellysis"]["enum"]:
                    case eRmu["PowerLogic 3000 Meter"]["enum"]:
                    case eRmu["Generic Modbus"]["enum"]:
                    case eRmu["PowerTraks 9000"]["enum"]:
                        obj.Utility.setModbusPropsDisp(point);
                        break;

                    case eRmu["BACnet"]["enum"]:
                        obj.Utility.setupPropValueOptions(point["Input Type"], {
                            "Input": 13,
                            "Output": 14,
                            "Value": 19
                        });
                        point.Instance.isDisplayable = true;
                        if (obj.Utility.checkMicroScan5Device(point)) {
                            point["Read Only"].isDisplayable = true;
                        }
                        break;

                    case eRmu["Smart II Remote Unit"]["enum"]:
                        point.Instance.isDisplayable = true;
                        break;

                    default: // Unknown, no RMU
                        break;
                }
            }
            return point;
        },

        applyAccumulatorDevModel: function(data) {
            var point = data.point,
                eRmu = enumsTemplatesJson.Enums["Remote Unit Model Types"],
                eDev = enumsTemplatesJson.Enums["Device Model Types"],
                setDisp = obj.Utility.setPropsDisplayable,
                setValOpt = obj.Utility.setupPropValueOptions,
                setCh = obj.Utility.setChannelOptions,
                ch = point.Channel;

            setDisp(point, ["Channel", "Instance", "Read Only", "Modbus Order", "Poll Register", "Poll Data Type", "Poll Function", "Fast Pulse", "Rate Period"], false);
            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if (point._relPoint === enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"]) {
                switch (point._rmuModel) {
                    case eRmu["Programmable Modbus"]["enum"]:
                    case eRmu["Liebert"]["enum"]:
                    case eRmu["Sierra Steam Meter"]["enum"]:
                    case eRmu["Siemens Power Meter"]["enum"]:
                    case eRmu["Ingersol Rand Intellysis"]["enum"]:
                    case eRmu["PowerLogic 3000 Meter"]["enum"]:
                    case eRmu["Generic Modbus"]["enum"]:
                    case eRmu["PowerTraks 9000"]["enum"]:
                        obj.Utility.setModbusPropsDisp(point);
                        break;

                    case eRmu["BACnet"]["enum"]:
                        point.Instance.isDisplayable = true;
                        if (obj.Utility.checkMicroScan5Device(point)) {
                            point["Read Only"].isDisplayable = true;
                        }
                        break;

                    case eRmu["MS3 RT"]["enum"]:
                    case eRmu["MS 3 EEPROM"]["enum"]:
                    case eRmu["MS 3 Flash"]["enum"]:
                        point["Rate Period"].isDisplayable = true;
                        setCh(ch, 0, 7);
                        break;

                    case eRmu["N2 Device"]["enum"]:
                        point.Instance.isDisplayable = true;
                        break;

                    case eRmu["IFC Remote Unit"]["enum"]:
                        setCh(ch, 0, 15);
                        break;

                    case eRmu["Smart II Remote Unit"]["enum"]:
                        setCh(ch, 0, 7);
                        break;

                    default: // Unknown, no RMU
                        switch (point._devModel) {
                            case eDev["MicroScan 5 UNV"]["enum"]:
                                setDisp(point, ["Channel", "Fast Pulse", "Rate Period"], true);
                                setCh(ch, 1, 16);
                                break;
                            case eDev["SCADA Vio"]["enum"]:
                                setDisp(point, ["Channel", "Fast Pulse", "Rate Period"], true);
                                setCh(ch, 6, 9);
                                break;
                            case eDev["SCADA IO"]["enum"]:
                                setDisp(point, ["Channel", "Fast Pulse", "Rate Period"], true);
                                setValOpt(ch, {
                                    "I/O 1": 1,
                                    "I/O 2": 2,
                                    "I/O 3": 3,
                                    "I/O 4": 4,
                                    "I/O 5": 5,
                                    "I/O 6": 6,
                                    "I/O 7": 7,
                                    "I/O 8": 8
                                });
                                break;
                            case eDev["MicroScan 4 UNV"]["enum"]:
                                setDisp(point, ["Channel", "Rate Period"], true);
                                setCh(ch, 1, 16);
                                break;
                            default: // MicroScan 4 Digital
                                setDisp(point, ["Channel", "Rate Period"], true);
                                setCh(ch, 1, 32);
                                break;
                        }
                        break;
                }
            }
            return point;
        },

        applyCpcPointDevModel: function(point) {
            var disp;

            if ((obj.Utility.checkMicroScan5Device(point) || obj.Utility.checkMicroScan4Device(point)) && (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Unknown"]["enum"])) {
                disp = true;
            } else {
                disp = false;
            }
            point["Maximum Change"].isDisplayable = disp;
        },

        applyEnthalpyDevModel: function(data) {
            var point = data.point;

            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            obj.EditChanges.applyCpcPointDevModel(point);
            return point;
        },

        applyEconomizerDevModel: function(data) {
            return obj.EditChanges.applyEnthalpyDevModel(data);
        },

        applySelectValueDevModel: function(data) {
            return obj.EditChanges.applyEnthalpyDevModel(data);
        },

        applyAverageDevModel: function(data) {
            return obj.EditChanges.applyEnthalpyDevModel(data);
        },

        applySetpointAdjustDevModel: function(data) {
            return obj.EditChanges.applyEnthalpyDevModel(data);
        },

        applyProportionalDevModel: function(data) {
            var point = data.point,
                opts,
                disp;

            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if ((obj.Utility.checkMicroScan5Device(point) || obj.Utility.checkMicroScan4Device(point)) && (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Unknown"]["enum"])) {
                opts = {
                    "P Only": 1,
                    "PI": 2,
                    "PID": 3
                };
                disp = true;
            } else {
                opts = {
                    "P Only": 1,
                    "PI": 2
                };
                disp = false;
            }
            obj.Utility.setupPropValueOptions(point["Calculation Type"], opts);
            point["Maximum Change"].isDisplayable = disp;
            return obj.EditChanges["Calculation Type"](data);
        },

        applyMathDevModel: function(data) {
            var point = data.point,
                disp;

            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["Unknown"]["enum"]) {
                disp = true;
            } else {
                disp = false;
            }
            point["Rate"].isDisplayable = disp;
            return obj.EditChanges.applyEnthalpyDevModel(data);
        },

        applyMultiplexerDevModel: function(data) {
            var point = data.point;

            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            return point;
        },

        applyRampDevModel: function(data) {
            return obj.EditChanges.applyMultiplexerDevModel(data);
        },

        applyTotalizerDevModel: function(data) {
            return obj.EditChanges.applyMultiplexerDevModel(data);
        },

        applyAnalogSelectorDevModel: function(data) {
            return obj.EditChanges.applyMultiplexerDevModel(data);
        },

        applyBinarySelectorDevModel: function(data) {
            return obj.EditChanges.applyMultiplexerDevModel(data);
        },

        applyAlarmStatusDevModel: function(data) {
            return obj.EditChanges.applyMultiplexerDevModel(data);
        },

        applyComparatorDevModel: function(data) {
            return obj.EditChanges.applyMultiplexerDevModel(data);
        },

        applyDigitalLogicDevModel: function(data) {
            return obj.EditChanges.applyMultiplexerDevModel(data);
        },

        applyDelayDevModel: function(data) {
            var point = data.point,
                opts;

            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if ((obj.Utility.checkMicroScan5Device(point) || obj.Utility.checkMicroScan4Device(point)) && (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Unknown"]["enum"])) {
                opts = {
                    "Delay": 0,
                    "Pulsed": 1
                };
            } else {
                opts = {
                    "Delay": 0
                };
            }
            obj.Utility.setupPropValueOptions(point["Calculation Type"], opts);
            return point;
        },

        applyLogicDevModel: function(data) {
            var point = data.point,
                opts,
                i;

            point._relPoint = obj.Utility.checkPointDeviceRMU(point);
            if (obj.Utility.checkMicroScan5Device(point) && (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Unknown"]["enum"])) {
                opts = {
                    "<>": 0,
                    "=": 1,
                    ">": 2,
                    ">=": 3,
                    "<": 4,
                    "<=": 5
                };
            } else {
                opts = {
                    "<>": 0,
                    "=": 1
                };
            }
            for (i = 1; i <= 5; i++) {
                obj.Utility.setupPropValueOptions(point["If Compare " + i], opts);
            }
            return point;
        },
    };

    obj.Templates = {
        getTemplate: function(pointType) {
            var template = {},
                common = enumsTemplatesJson.Templates._common, // Common point property attributes
                unique = enumsTemplatesJson.Templates.Points[pointType], // Unique point property attributes
                templateClone = function(o) {
                    // Return the value if it's not an object; shallow copy mongo ObjectID objects
                    if ((o === null) || (typeof(o) !== 'object'))
                        return o;

                    var temp = o.constructor();

                    for (var key in o) {
                        temp[key] = templateClone(o[key]);
                    }
                    return temp;
                };
            _.extend(template, common, unique); // Combine common and unique attributes & stuff into template object var
            template["Point Type"].Value = pointType;
            template["Point Type"].eValue = enumsTemplatesJson.Enums["Point Types"][pointType].enum;
            return templateClone(template);
        },
        commonProperties: enumsTemplatesJson.Templates._common
    };

    // Application-specific configuration
    obj.Applications = {
        'Navigator': {
            'Point Types': [

            ]
        },
        'GPL': {
            'Point Types': [

            ]
        }
    };
    return obj;
}({}));

if (typeof window === 'undefined') {
    module.exports = {
        // We are on the server side, so module exports applies
        logger: function(statement, callback) {
            console.log(statement);
            return callback();
        },
        ValueOptionsUpdate: Config.ValueOptionsUpdate,
        Logger: Config.Logger,
        Update: Config.Update,
        Test: Config.Test,
        Get: Config.Get,
        Import: Config.Import,
        EditChanges: Config.EditChanges,
        EditValidation: Config.EditValidation,
        Enums: Config.Enums,
        revEnums: Config.revEnums,
        Applications: Config.Applications,
        Templates: Config.Templates,
        Utility: Config.Utility,
        //Templates: enumsTemplatesJson.Templates
        PointTemplates: Config.PointTemplates
    };
}