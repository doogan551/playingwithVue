/*jshint -W069 */ // JSLint directive - Do not warn about dot notation
/* jslint white: true */
var Config = (function(obj) {
    var fs, enumsTemplatesFile, enumsTemplatesJson, underscore;
    if (typeof window == 'undefined') {
        // This will happen on the server side, in NodeJS
        fs = require('fs');
        enumsTemplatesFile = __dirname + '/enumsTemplates.json';
        enumsTemplatesJson = JSON.parse(fs.readFileSync(enumsTemplatesFile));
        underscore = require('underscore');
    } else {
        // This will happen on the client side
        if (typeof $ == 'function') {
            $.ajax({
                url: "/js/lib/enumsTemplates.json",
                async: false,
                success: function(data) {
                    enumsTemplatesJson = data;
                }
            });
        }
    }
    if (underscore) _ = underscore;
    obj.Enums = enumsTemplatesJson.Enums;

    obj.deadbandFactor = 0.1; // This is the deadband constant factor. It is used to calculate 'Alarm Deadband.Max' and 'Value Deadband.Max' for AI, AO, and AV point types

    obj.Test = {
        test: function() {
            console.log("inside test");
            return true;
        }
    };

    obj.Utility = {
        createActivityLog: function(data) {
            // data.point[data.property]["Activity Log"] = {
            //     "log": "Created"
            // };
            return data;
        },

        clone: function(obj) {
            if (obj === null || typeof(obj) != 'object')
                return obj;

            var temp = obj.constructor(); // changed

            for (var key in obj)
                temp[key] = this.clone(obj[key]);
            return temp;
        },

        // isNumber routine from: http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric (swipped by JDR)
        isNumber: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        pointTypes: (function() {
            var types = enumsTemplatesJson.Enums['Point Types'],
                totalTypes = Object.keys(types).length,
                filterPointTypes = function(filter) {
                    var filtered = [],
                        item = {};
                    for (var prop in types) {
                        item = types[prop];
                        // console.log('--', prop);
                        if (!filter || !!~item.lists.indexOf(filter)) {
                            filtered.push({
                                key: prop,
                                enum: item.enum
                            });
                        }
                    }
                    return filtered;
                },
                _getAllowedPointTypes = function(property, pointType) {
                    var allowed = [];
                    if (typeof property == 'undefined' && typeof pointType == 'undefined') {
                        //return all point types
                        return filterPointTypes('default');
                    }
                    switch (property) {
                        case 'Alarm Adjust Point':
                        case 'Dry Bulb Point':
                        case 'Humidity Point':
                        case 'Mixed Air Point':
                        case 'Outside Air Point':
                        case 'Return Air Point':
                        case 'Setpoint Input':
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
                            return filterPointTypes('enum');
                        case 'Remote Unit Point':
                            return filterPointTypes('remote');
                        case 'Sensor Point':
                            return filterPointTypes('sensor');
                        case 'Point Register':
                            return filterPointTypes('register');
                        case 'Occupied Point':
                            if (typeof pointType == 'undefined') {
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
                                    default:
                                        return {
                                            error: 'Point Type not recognized for Occupied Point property. Received "' + pointType + '".'
                                        };
                                }
                            }
                            break;
                        case 'Monitor Point':
                            if (typeof pointType == 'undefined') {
                                return filterPointTypes('value');
                            } else {
                                switch (pointType) {
                                    case 'Alarm Status':
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
                                    default:
                                        return {
                                            error: 'Point Type not recognized for Monitor Point property. Received "' + pointType + '".'
                                        };
                                }
                            }
                            break;

                        case 'Input Point 1':
                            if (typeof pointType == 'undefined') pointType = 'undefined';
                            switch (pointType) {
                                case 'Average':
                                case 'Comparator':
                                case 'Logic':
                                case 'Select Value':
                                    return filterPointTypes('value');
                                case 'Math':
                                    return filterPointTypes('math');
                                case 'Digital Logic':
                                    return filterPointTypes('enum');
                                case 'Multiplexer':
                                    return filterPointTypes('float');
                                default:
                                    return {
                                        error: 'Point Type not recognized for Input Point 1 property. Received "' + pointType + '".'
                                    };
                            }
                            break;
                        case 'Input Point 2':
                            if (typeof pointType == 'undefined') pointType = 'undefined';
                            switch (pointType) {
                                case 'Average':
                                case 'Comparator':
                                case 'Logic':
                                case 'Select Value':
                                    return filterPointTypes('value');
                                case 'Digital Logic':
                                    return filterPointTypes('enum');
                                case 'Math':
                                case 'Multiplexer':
                                    return filterPointTypes('float');
                                default:
                                    return {
                                        error: 'Point Type not recognized for Input Point 2 property. Received "' + pointType + '".'
                                    };
                            }
                            break;
                        case 'Input Point 3':
                        case 'Input Point 4':
                        case 'Input Point 5':
                            if (typeof pointType == 'undefined') pointType = 'undefined';
                            switch (pointType) {
                                case 'Average':
                                case 'Logic':
                                case 'Select Value':
                                    return filterPointTypes('value');
                                default:
                                    return {
                                        error: 'Point Type not recognized for ' + property + ' property. Received "' + pointType + '".'
                                    };
                            }
                            break;
                        default:
                            return {
                                error: 'Property not recognized. Received "' + property + '".'
                            };
                    }
                },
                _getUIEndpoint = function(pointType, id) {
                    var endPoints = JSON.parse(JSON.stringify(enumsTemplatesJson.Enums.endPoints)),
                        endPoint;
                    if (typeof types[pointType] == 'undefined') throw new Error('Unrecognized Point Type');

                    endPoint = endPoints[types[pointType].endpoint];

                    if (endPoint.review) {
                        endPoint.review.url = endPoint.review.url.replace(/{id}/g, id);
                    }

                    if (endPoint.edit) {
                        endPoint.edit.url = endPoint.edit.url.replace(/{id}/g, id);
                    }

                    return endPoint;
                },
                _hasPointType = false,
                _getEnums = function(property, pointType) {
                    var workspace = (typeof window != 'undefined') && window.workspaceManager,
                        set = [];

                    _hasPointType = !!pointType;

                    switch(property) {
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
                            if (pointType == 'Device') {
                                return _getEnumFromTemplate('Device Model Types');
                            }
                            if (pointType == 'Remote Unit') {
                                return _getEnumFromTemplate('Remote Unit Model Types');
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
                        default:
                            return _getEnumFromTemplate(property);
                    }
                },
                _getEnumFromTemplate = function(property) {
                    var enums = enumsTemplatesJson.Enums[property],
                        keys = !!enums && Object.keys(enums),
                        enumArray = [],
                        item;

                    if (!enums) return null;

                    for (var i = 0, last = keys.length; i < last; i++) {
                        if (_hasPointType) {
                            item = { name: keys[i], value: enums[keys[i]].enum };
                        } else {
                            item = keys[i];
                        }
                        enumArray.push(item);
                    }
                    return enumArray;
                };

            return {
                getAllowedPointTypes: _getAllowedPointTypes,
                getUIEndpoint       : _getUIEndpoint,
                getEnums            : _getEnums
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

        getPointRegister: function(pointRefs, key, value) {
            var i,
                len = pointRefs.length;

            for (i = 0; i < len; i++) {
                if (pointRefs[i][key] === value) {
                    return pointRefs[i];
                }
            }
            return null;
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
                len = pointTemplate["Point Refs"].length;
                for (var a = 0; a < len; a++) {
                    if (pointTemplate["Point Refs"][a].PropertyName === data.property) {
                        data.ok = true;
                        break;
                    }
                }
            }

            if (data.ok === false) {
                data.result = "Internal validation error. Point type '" + pointType + "' does not support this property.";
            } else {
                value = data.propertyObject.Value;

                if (data.propertyObject.hasOwnProperty("ValueType")) {
                    valueType = data.propertyObject.ValueType;
                } else {
                    valueType = enumsTemplatesJson.Enums["Value Types"]["UniquePID"]["enum"];
                }

                // If this property is a reference point
                if ((valueType === enumsTemplatesJson.Enums["Value Types"]["UniquePID"]["enum"])) {
                    // Verify reference point is correct point type
                    if (value !== 0)
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
                data = obj.Utility.createActivityLog(data); // Create activity log

                // If this property has 'Value' and 'ValueOptions' keys
                if ((data.point.hasOwnProperty('Value')) && (data.point.Value.hasOwnProperty('ValueOptions'))) {
                    // If Value.ValueOptions changed
                    if (_.isEqual(data.oldPoint.Value.ValueOptions, data.point.Value.ValueOptions) === false) {
                        var enumProps = ["Active Value", "Alarm Value", "Authorized Value", "Inactive Value", "Shutdown Value", "Value"];

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
                    "err": data.result
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

        validateUsingMaxMinKeys: function(data) {
            var max = data.propertyObject.Max, // Max property value
                min = data.propertyObject.Min; // Min property value

            return this.validateUsingTheseLimits(data, min, max);
        },

        validatePortNAddress: function(data) {
            data = this.validateUsingTheseLimits(data, 0, 127);
            if (data.ok === true) {
                data.point._cfgRequired = true; // Require device reconfiguration
            }
            return data;
        },

        validateNetworkNumber: function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                props = ["Port 1 Network", "Port 2 Network", "Port 3 Network", "Port 4 Network", "Downlink Network", "Ethernet Network"],
                prop, // Work var
                len = props.length, // Number of networks
                i; // Work var

            for (i = 0; i < len; i++) {
                prop = props[i];

                // Make sure this isn't the property we're editing, and it exists on the point (CYB)
                if ((prop !== data.property) && point.hasOwnProperty(prop)) {
                    // If this communications port is in use
                    if ((point[prop].isReadOnly === false) && (point[prop].isDisplayable === true)) {
                        // If the user-entered network number is the same as the Port N Network number (FYI 0 means network # is unused)
                        if ((val === point[prop].Value) && (val !== 0)) {
                            data.ok = false;
                            data.result = "Please enter a network number different from the " + prop + " number.";
                            break;
                        }
                    }
                }
            }

            if (data.ok === true) {
                data.point._cfgRequired = true; // Require device reconfiguration
            }
            return data;
        },

        validatePortNNetwork: function(data) {
            data = this.validateUsingMaxMinKeys(data);
            if (data.ok === true) {
                data = this.validateNetworkNumber(data); // Check if donwlink network number matches one of the serial port network numbers
            }
            return data;
        },

        validatePortNProtocol: function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                type = point["Point Type"].Value; // Point type

            data.point = obj.EditChanges.applyDeviceTypePortNProtocol(data);
            data.point._cfgRequired = true; // Require device reconfiguration
            return data;
        },

        validateChannelUniqueness: function(data) {
            var point = data.point,
                val = data.propertyObject.Value,
                props = ["Channel", "Feedback Channel", "On Channel", "Off Channel", "Open Channel", "Close Channel"],
                len = props.length,
                prop,
                i;

            // This is called from properties: Channel, Feedback Channel, On Channel, Off Channel, Open Channel, & Close Channel
            // This routine ensures that the specified channel number isn't used by another channel proeprty. All points do not have
            // all channel properties; for example, AO doesn't have the On or Off Channel property. Therefore we must check that
            // the property exists on the point before comparing equality.

            for (i = 0; i < len; i++) {
                prop = props[i];
                if ((prop !== data.property) && point.hasOwnProperty(prop) && (point[prop].isDisplayable === true) && (point[prop].isReadOnly === false)) {
                    if (val === point[prop].Value) {
                        data.ok = false;
                        data.result = data.property + " number cannot be the same as the " + prop + " number.";
                        break;
                    }
                }
            }
        },

        //------------------------------------------------------------------------------------------------------------------------------
        //------ BEGIN NON POINT TYPE SPECIFIC PROPERTIES ------------------------------------------------------------------------------
        //------------------------------------------------------------------------------------------------------------------------------

        "Active Text": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                len = val.length; // String length

            data.ok = false; // Add 'ok' key and preset for validation fail

            if (len < 1) {
                data.result = data.property + " must have at least one character.";
            } else if (len > 40) {
                data.result = data.property + " is limited to 40 characters.";
            } else if (val.toLowerCase() === point["Inactive Text"].Value.toLowerCase()) {
                data.result = data.property + " must be different from the Inactive Text.";
            } else {
                data.ok = true;
                data.point = obj.EditChanges.applyActiveText(data);
            }
            return data;
        },

        "Alarm Adjust Band": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                max = (point["High Alarm Limit"].Value - point["Low Alarm Limit"].Value) / 2;

            if (val < point["Alarm Deadband"].Value) {
                data.ok = false;
                data.result = data.property + " must be greater than or equal to the Alarm Deadband (" + point['Alarm Deadband'].Value + ").";
            } else if (point["Alarm Adjust Band"].Value > max) {
                data.ok = false;
                data.result = data.property + " must be less than or equal to the High Alarm Limit - Low Alarm Limit (" + max + ").";
            }
            return data;
        },

        // TODO if High Alarm Limit takes into account Alarm Deadband for min/max, shouldn't Alarm Deadband take into account High Alarm Limit? Other
        // properties also take into account Alarm Deadband.
        "Alarm Deadband": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                max = Math.abs(point["Maximum Value"].Value - point["Minimum Value"].Value) * obj.deadbandFactor;

            if (val < 0.0) {
                data.ok = false;
                data.result = data.property + " must be greater than or equal to 0.";
            } else if (val > max) {
                data.ok = false;
                data.result = data.property + " can be no more than " + obj.deadbandFactor * 100 + "% of (Maximum Value - Minimum Value), (" + max + ").";
            }
            return data;
        },

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
            return this.validateUsingMaxMinKeys(data);
        },

        "Begin Month": function(data) {
            return this.validateUsingMaxMinKeys(data);
        },

        "Begin Year": function(data) {
            return this.validateUsingMaxMinKeys(data);
        },

        "Channel": function(data) {
            data = this.validateUsingMaxMinKeys(data);
            if (data.ok === true) {
                data = this.validateChannelUniqueness(data);
                if (data.ok === true) {
                    data.point._cfgRequired = true; // Require device reconfiguration
                }
            }
            return data;
        },

        "Close Channel": function(data) {
            data = this.validateUsingMaxMinKeys(data);
            if (data.ok === true) {
                data = this.validateChannelUniqueness(data);
                if (data.ok === true) {
                    data.point._cfgRequired = true; // Require device reconfiguration
                }
            }
            return data;
        },

        "Control Register": function(data) {
            data = this.validateUsingTheseLimits(data, 1, 65535);
            if (data.ok === true) {
                data.point._cfgRequired = true; // Require device reconfiguration
            }
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
                data.result = data.property + " must be greater than 0.";
            }
            return data;
        },

        "Demand Enable": function(data) {
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Description": function(data) {
            if (data.propertyObject.Value.length > 80) {
                data.ok = false;
                data.result = "Description cannot be more than 80 characters.";
            }
            return data;
        },

        "Device Point": function(data) {
            var point = data.point, // Shortcut
                runModelLogic = false,
                updateIsDisplayable = false;

            if (data.propertyObject.PointInst !== 0) {
                if (data.refPoint._devModel !== point._devModel) {
                    point._devModel = data.refPoint._devModel;
                    point._cfgRequired = true; // Require device reconfiguration
                    runModelLogic = true;
                }
            } else {
                point._devModel = enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"];
                runModelLogic = true;
            }

            if (runModelLogic === true) {
                switch (point["Point Type"].eValue) {
                    case enumsTemplatesJson.Enums["Point Types"]["Analog Input"]["enum"]:
                        point = obj.EditChanges.applyAnalogInputTypeDevModel(data);
                        updateIsDisplayable = true;
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Analog Output"]["enum"]:
                        point = obj.EditChanges.applyAnalogOutputTypeDevModel(data);
                        updateIsDisplayable = true;
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Analog Value"]["enum"]:
                        point = obj.EditChanges.applyAnalogValueTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Binary Input"]["enum"]:
                        point = obj.EditChanges.applyBinaryInputTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Binary Output"]["enum"]:
                        point = obj.EditChanges.applyBinaryOutputTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Binary Value"]["enum"]:
                        point = obj.EditChanges.applyBinaryValueTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["MultiState Value"]["enum"]:
                        point = obj.EditChanges.applyMultiStateValueTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Accumulator"]["enum"]:
                        point = obj.EditChanges.applyAccumulatorTypeDevModel(data);
                        break;

                    default:
                        break;
                }

                if (updateIsDisplayable === true) {
                    // Update Conversion Type and Conversion Coefficient isDisplayable flags based on Sensor Point property's isDisplayable flag
                    obj.EditChanges.updateConversionIsDisplayable(point, obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable);
                }
            }
            return data;
        },

        "Device Status": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Enable Warning Alarms": function(data) {
            data.point = obj.EditChanges.applyEnableWarningAlarms(data);
            return data;
        },

        "End Day": function(data) {
            return this.validateUsingMaxMinKeys(data);
        },

        "End Month": function(data) {
            return this.validateUsingMaxMinKeys(data);
        },

        "End Year": function(data) {
            return this.validateUsingMaxMinKeys(data);
        },

        "Engineering Units": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property Value

            if (val.length > 20) {
                data.ok = false;
                data.result = "Engineering Units must be 20 characters or less.";
            }
            return data;
        },

        "Fall Time": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Fast Pulse": function(data) {
            data.point._cfgRequired = true;
            return data;
        },

        "Feedback Channel": function(data) {
            data = this.validateUsingMaxMinKeys(data);
            if (data.ok === true) {
                data = this.validateChannelUniqueness(data);
                if (data.ok === true) {
                    data.point._cfgRequired = true; // Require device reconfiguration
                }
            }
            return data;
        },

        "Filter Weight": function(data) {
            return this.validateUsingTheseLimits(data, 0, 1);
        },

        "Firmware Revision": function(data) {
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

        "High Alarm Limit": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                min = point["Low Alarm Limit"].Value + (2 * point["Alarm Deadband"].Value);

            data.ok = false;

            if (val > point["Maximum Value"].Value) {
                data.result = data.property + " cannot be greater than the Maximum Value (" + point["Maximum Value"].Value + ").";
            } else if ((point["Enable Warning Alarms"].Value === true) && (val < point["High Warning Limit"].Value)) {
                data.result = data.property + " cannot be less than the High Warning Limit (" + point["High Warning Limit"].Value + ").";
            } else if (val < min) {
                data.result = data.property + " cannot be less than the Low Alarm Limit plus twice the Alarm Deadband (" + min + ").";
            } else {
                data.ok = true;
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

        "High Warning Limit": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                min = point["Low Warning Limit"].Value + (2 * point["Alarm Deadband"].Value);

            if (val > point["High Alarm Limit"].Value) {
                data.ok = false;
                data.result = data.property + " cannot be greater than the High Alarm Limit (" + point["High Alarm Limit"].Value + ").";
            } else if (val < min) {
                data.ok = false;
                data.result = data.property + " cannot be less than the Low Warning Limit plus twice the Alarm Deadband (" + min + ")";
            }
            return data;
        },

        "Inactive Text": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                len = val.length; // String length

            data.ok = false; // Add 'ok' key and preset for validation fail

            if (len < 1) {
                data.result = data.property + " must have at least one character.";
            } else if (len > 40) {
                data.result = data.property + " is limited to 40 characters.";
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
            if (data.ok === true) {
                data.point._cfgRequired = true; // Require device reconfiguration
            }
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

        "Low Alarm Limit": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                max = point["High Alarm Limit"].Value - (2 * point["Alarm Deadband"].Value);

            data.ok = false; // Add 'ok' key and preset for validation fail

            if (val < point["Minimum Value"].Value) {
                data.result = data.property + " cannot be less than the Minimum Value (" + point["Minimum Value"].Value + ").";
            } else if ((point["Enable Warning Alarms"].Value === true) && (val > point["Low Warning Limit"].Value)) {
                data.result = data.property + " cannot be greater than the Low Warning Limit (" + point["Low Warning Limit"].Value + ").";
            } else if (val > max) {
                data.result = data.property + " cannot be greater than the High Alarm Limit minus twice the Alarm Deadband (" + max + ").";
            } else {
                data.ok = true;
            }
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

        "Low Warning Limit": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property Value
                max = point["High Warning Limit"].Value - (2 * point["Alarm Deadband"].Value);

            if (val < point["Low Alarm Limit"].Value) {
                data.ok = false;
                data.result = data.property + " cannot be less than the Low Alarm Limit (" + point["Low Alarm Limit"].Value + ").";
            } else if (val > max) {
                data.ok = false;
                data.result = data.property + " cannot be greater than the High Warning Limit minus twice the Alarm Deadband (" + max + ").";
            }
            return data;
        },


        "Maximum Change": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property Value

            if (val >= point["Maximum Value"].Value) {
                data.ok = false;
                data.result = data.property + " must be less than the Maximum Value.";
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

        "Occupied Point": function(data) {
            if (obj.Utility.getPropertyObject("Device Point", data.point).PointInst !== obj.Utility.getPropertyObject("Device Point", data.refPoint).PointInst) {
                data.ok = false;
                data.result = data.property + " must reside on the same Device as this point.";
            }
            return data;
        },

        "Off Channel": function(data) {
            data = this.validateUsingMaxMinKeys(data);
            if (data.ok === true) {
                data = this.validateChannelUniqueness(data);
                if (data.ok === true) {
                    data.point._cfgRequired = true; // Require device reconfiguration
                }
            }
            return data;
        },

        "Off Control Register": function(data) {
            data = this.validateUsingTheseLimits(data, 1, 65535);
            if (data.ok === true) {
                data.point._cfgRequired = true; // Require device reconfiguration
            }
            return data;
        },

        "Off Control Value": function(data) {
            return this.validateUsingTheseLimits(data, 0, 65535);
        },

        "On Channel": function(data) {
            data = this.validateUsingMaxMinKeys(data);
            if (data.ok === true) {
                data = this.validateChannelUniqueness(data);
                if (data.ok === true) {
                    data.point._cfgRequired = true; // Require device reconfiguration
                }
            }
            return data;
        },

        "On Control Register": function(data) {
            data = this.validateUsingTheseLimits(data, 1, 65535);
            if (data.ok === true) {
                data.point._cfgRequired = true; // Require device reconfiguration
            }
            return data;
        },

        "On Control Value": function(data) {
            return this.validateUsingTheseLimits(data, 0, 65535);
        },

        "Open Channel": function(data) {
            data = this.validateUsingMaxMinKeys(data);
            if (data.ok === true) {
                data = this.validateChannelUniqueness(data);

                if (data.ok === true) {
                    data.point._cfgRequired = true; // Require device reconfiguration
                }
            }
            return data;
        },

        "Out of Service": function(data) {
            data.point = obj.EditChanges.applyOutOfService(data);
            return data;
        },

        "Point Instance": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Point Register": function(data) {
            var point = data.point,
                propertyObject = data.propertyObject;

            if (((propertyObject.AppIndex) < 1) || (propertyObject.AppIndex > point["Point Registers"].length)) {
                data.ok = false;
                data.result = "Invalid point register index (" + propertyObject.AppIndex + "). Valid indexes are between 1 and " + (point["Point Registers"].length + 1) + ".";
            } else {
                point["Point Registers"][propertyObject.AppIndex - 1] = propertyObject.Value;
            }
        },

        "Point Type": function(data) {
            data.ok = false; // Add 'ok' key and preset for validation fail
            data.result = data.property + " cannot be changed.";
            return data;
        },

        "Poll Register": function(data) {
            data = this.validateUsingTheseLimits(data, 1, 65535);
            if (data.ok === true) {
                data.point._cfgRequired = true; // Require device reconfiguration
            }
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
                len = val.length; // Value string length

            if (len > 1000) {
                data.ok = false;
                data.result = data.property + " are limited to 1000 characters.";
            }
            return data;
        },

        "Remote Unit Point": function(data) {
            var point = data.point, // Shortcut
                propertyObject = data.propertyObject,
                runModelLogic = false,
                updateIsDisplayable = false;

            if (propertyObject.PointInst !== 0) {
                if (propertyObject.DevInst !== getPropertyObject("Device Point", point).PointInst) {
                    data.ok = false;
                    data.result = "Invalid " + data.property + ".";
                } else if (data.refPoint._rmuModel !== point._rmuModel) {
                    point._rmuModel = data.refPoint._rmuModel;
                    point._cfgRequired = true; // Require device reconfiguration

                    runModelLogic = true;
                }
            } else {
                point._rmuModel = enumsTemplatesJson.Enums["Remote Unit Model Types"].Unknown["enum"];

                // We also need to touch _relRMU because server processes will not (because there is no RMU point)
                point._relRMU = enumsTemplatesJson.Enums["Reliabilities"]["No Fault"]["enum"];

                runModelLogic = true;
            }

            if (runModelLogic === true) {
                switch (point["Point Type"].eValue) {
                    case enumsTemplatesJson.Enums["Point Types"]["Analog Input"]["enum"]:
                        point = obj.EditChanges.applyAnalogInputTypeDevModel(data);
                        updateIsDisplayable = true;
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Analog Output"]["enum"]:
                        point = obj.EditChanges.applyAnalogOutputTypeDevModel(data);
                        updateIsDisplayable = true;
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Analog Value"]["enum"]:
                        point = obj.EditChanges.applyAnalogValueTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Binary Input"]["enum"]:
                        point = obj.EditChanges.applyBinaryInputTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Binary Output"]["enum"]:
                        point = obj.EditChanges.applyBinaryOutputTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Binary Value"]["enum"]:
                        point = obj.EditChanges.applyBinaryValueTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["MultiState Value"]["enum"]:
                        point = obj.EditChanges.applyMultiStateValueTypeDevModel(data);
                        break;

                    case enumsTemplatesJson.Enums["Point Types"]["Accumulator"]["enum"]:
                        point = obj.EditChanges.applyAccumulatorTypeDevModel(data);
                        break;

                    default:
                        break;
                }

                if (updateIsDisplayable === true) {
                    // Update Conversion Type and Conversion Coefficient isDisplayable flags based on Sensor Point property's isDisplayable flag
                    obj.EditChanges.updateConversionIsDisplayable(point, obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable);
                }
            }
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

        "Shutdown Point": function(data) {
            data.point = obj.EditChanges.applyShutdownPoint(data);
            return data;
        },

        "Starts Alarm Limit": function(data) {
            return data;
        },

        "States": function(data) {
            data.point = obj.EditChanges.applyStates(data);
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
                data.result = data.property + " must be greater than 0.";
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

        "Value Deadband": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                max = Math.abs(point["Maximum Value"].Value - point["Minimum Value"].Value) * obj.deadbandFactor;

            if (val < 0.0) {
                data.ok = false;
                data.result = data.property + " cannot be less than 0.";
            } else if (val > max) {
                data.ok = false;
                data.result = data.property + " cannot be more than " + obj.deadbandFactor * 100 + "% of (Maximum Value - Minimum Value), (" + max + ")";
            }
            return data;
        },

        "VAV Channel": function(data) {
            data.point._cfgRequired = true; // Require device reconfiguration
            return data;
        },

        "Warning Adjust Band": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property value

            if (val < 0) {
                data.ok = false;
                data.result = data.property + " cannot be less than 0.";
            } else if (val >= point["Alarm Adjust Band"].Value) {
                data.ok = false;
                data.result = data.property + " must be less than the Alarm Adjust Band (" + point["Alarm Adjust Band"].Value + ").";
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

            // This property only supported by Devices
            if (type !== "Device") {
                data.result = "Internal validation error. Point type '" + type + "' does not support this property.";
            } else if (val < 0) {
                data.result = data.property + " must be 0 or greater.";
            } else if (val > 65534) {
                data.result = data.property + " must be 65534 or less.";
            } else {
                data.ok = true; // Preset for validation success
                data = this.validateNetworkNumber(data); // Check if donwlink network number matches one of the serial port network numbers
            }
            return data;
        },

        "Ethernet Address": function(data) {
            data.point._cfgRequired = true; // Require device reconfiguration
            return data;
        },

        "Ethernet Network": function(data) {
            data = this.validateUsingMaxMinKeys(data);

            if (data.ok === true) {
                data = this.validateNetworkNumber(data);
                if (data.ok === true) {
                    data.point._cfgRequired = true; // Require device reconfiguration
                }
            }
            return data;
        },

        "Ethernet Protocol": function(data) {
            data.point = obj.EditChanges.applyDeviceTypeEthernetProtocol(data);
            data.point._cfgRequired = true; // Require device reconfiguration
            return data;
        },

        "Model Type": function(data) {
            var point = data.point,
                propertyObject = data.propertyObject,
                devModelTypes = enumsTemplatesJson.Enums["Device Model Types"];

            if ((propertyObject.Value === "Unknown") || (propertyObject.Value === "Central Device")) {
                data.ok = false;
                data.result = 'Invalid model type.';
            } else {
                if (point["Point Type"].Value === "Device") {
                    point = obj.EditChanges.applyDeviceTypeModelType(data);
                } else {
                    point = obj.EditChanges.applyRemoteUnitTypeModelType(data);
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
            data.point = obj.EditChanges.applyDeviceTypeUplinkPort(data);
            data.point._cfgRequired = true; // Require device reconfiguration
            return data;
        },

        "Device Address": function(data) {
            data.point._cfgRequired = true; // Require device reconfiguration
            return data;
        },

        "Device Port": function(data) {
            data.point._cfgRequired = true; // Require device reconfiguration
            return data;
        },


        "Network Segment": function(data) {
            data = this.validateUsingTheseLimits(data, 1, 65534);
            if (data.ok === true) {
                data.point._cfgRequired = true; // Require device reconfiguration
            }
            return data;
        },

        "Network Type": function(data) {
            data.point = obj.EditChanges.applyRemoteUnitTypeNetworkType(data);
            data.point._cfgRequired = true; // Require device reconfiguration
            return data;
        },

        "Calculation Type": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value; // Point type

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
            if (obj.Utility.getPropertyObject("Device Point", data.point).Value !== obj.Utility.getPropertyObject("Device Point", data.refPoint).Value) {
                data.ok = false;
                data.result = data.property + " must reside on the same Device as this point.";
            } else if (data.point["Point Type"].Value !== "Optimum Start") {
                data.point = obj.EditChanges.applyControlPoint(data);
            }
            return data;
        },

        "Maximum Value": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                type = point["Point Type"].Value; // Point type

            switch (type) {
                case "Analog Input":
                case "Analog Output":
                case "Analog Value":
                    if ((point["Alarms Off"].Value === true) && (val < point["Minimum Value"].Value)) {
                        data.ok = false;
                        data.result = data.property + " must be greater than the Minimum Value (" + point["Minimum Value"].Value + ").";
                    } else if (val < point["High Alarm Limit"].Value) {
                        data.ok = false;
                        data.result = data.property + " must be greater than the High Alarm Limit (" + point["High Alarm Limit"].Value + ").";
                    }
                    break;

                case "Accumulator":
                    if (val <= 0) {
                        data.ok = false;
                        data.result = data.property + " must be greater than 0.";
                    }
                    break;

                case "Average":
                case "Economizer":
                case "Enthalpy":
                case "Math":
                case "Multiplexer":
                case "Proportional":
                case "Ramp":
                case "Select Value":
                case "Setpoint Adjust":
                case "Totalizer":
                    if (val <= point["Minimum Value"].Value) {
                        data.ok = false;
                        data.result = data.property + " must be greater than the Minimum Value (" + point["Minimum Value"].Value + ").";
                    }
                    break;

                default:
                    break;
            }
            return data;
        },

        "Minimum Value": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value, // Property value
                type = point["Point Type"].Value; // Point type

            switch (type) {
                case "Analog Input":
                case "Analog Output":
                case "Analog Value":
                    if ((point["Alarms Off"].Value === true) && (val > point["Maximum Value"].Value)) {
                        data.ok = false;
                        data.result = data.property + " cannot be greater than the Maximum Value (" + point["Maximum Value"].Value + ").";
                    } else if (val > point["Low Alarm Limit"].Value) {
                        data.ok = false;
                        data.result = data.property + " cannot be greater than the Low Alarm Limit (" + point["Low Alarm Limit"].Value + ").";
                    }
                    break;

                case "Average":
                case "Economizer":
                case "Enthalpy":
                case "Math":
                case "Multiplexer":
                case "Proportional":
                case "Ramp":
                case "Select Value":
                case "Setpoint Adjust":
                case "Totalizer":
                    if (val >= point["Maximum Value"].Value) {
                        data.ok = false;
                        data.result = data.property + " must be less than the Maximum Value (" + point["Maximum Value"].Value + ").";
                    }
                    break;

                default:
                    break;
            }
            return data;
        },

        "Shutdown Value": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value, // Point type
                val = data.propertyObject.Value; // Property value

            if ((point.Value.ValueType === enumsTemplatesJson.Enums["Value Types"]["Float"]["enum"]) && (type !== "Analog Selector")) {
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
                data.point = obj.EditChanges.applyDelayPointTypeMointorPoint(data);
            }
            data.point = obj.EditChanges[data.property](data);
            return data;
        },

        "Input Type": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value; // Point type

            if (type === "Binary Input") {
                data.point = obj.EditChanges.applyBinaryInputTypeInputType(data);
            }
            data.point._cfgRequired = true; // Require device reconfiguration
            return data;
        },

        "Sensor Point": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value; // Point type

            if (type == "Analog Input") {
                data.point = obj.EditChanges.applyAnalogInputTypeSensorPoint(data);
            } else if (type == "Analog Output") {
                data.point = obj.EditChanges.applyAnalogOutputTypeSensorPoint(data);
            }
            return data;
        },

        "Default Value": function(data) {
            var point = data.point, // Shortcut
                val = data.propertyObject.Value; // Property value
            type = point["Point Type"].Value; // Point type

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
                data.point = obj.EditChanges.applyAnalogOutputTypeOutputType(data);
            } else if (type === "Binary Output") {
                data.point = obj.EditChanges.applyBinaryOutputTypeOutputType(data);
            }
            return data;
        },

        "Feedback Point": function(data) {
            var point = data.point, // Shortcut
                type = point["Point Type"].Value; // Point type

            if (type === "Binary Input" || type === "Binary Value") {
                data.point = obj.EditChanges.applyBinaryInputTypeFeedbackPoint(data); // BI and BV have same apply logic
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
            data = validateUsingMaxMinKeys(data);
            return data;
        }
        //------ END POINT-TYPE SPECIFIC PROPERTIES  ----------------------------------------------------------------------------------------------
    };

    obj.EditChanges = {
        updateConversionIsDisplayable: function (point, isDisplayable) {
            // Make sure isDisplayable is a boolean (it could be null if something went wrong)
            isDisplayable = !!isDisplayable;

            // Make sure property exists on point (AO's don't use Conversion Type)
            if (point.hasOwnProperty("Conversion Type"))
                point["Conversion Type"].isDisplayable = isDisplayable;

            for (var i = 1; i < 5; i++) {
                var prop = "Conversion Coefficient " + i;

                // Make sure property exists on point (AO's don't use Conversion Coefficients 3 or 4)
                if (point.hasOwnProperty(prop)) {
                    point[prop].isDisplayable = isDisplayable;
                }
            }
        },

        "Calculation Type": function(data) {
            var point = data.point, // Shortcut
                val = point[data.property].Value, // Property value
                key, // Work var
                i; // Work var

            if ((point["Point Type"].Value === "Analog Selector") || (point["Point Type"].Value === "Binary Selector")) {
                if (val === "Single Setpoint") {
                    obj.Utility.getPropertyObject("Setpoint Input", point).isDisplayable = true;
                    point["Setpoint Value"].isDisplayable = true;
                    point["High Deadband"].isDisplayable = true;
                    point["Low Deadband"].isDisplayable = true;

                    point["Input Deadband"].isDisplayable = false;
                    point["High Setpoint"].isDisplayable = false;
                    point["Low Setpoint"].isDisplayable = false;
                    point["Cooling Setpoint"].isDisplayable = false;
                    point["Heating Setpoint"].isDisplayable = false;
                } else if (val === "Dual Setpoint") {
                    obj.Utility.getPropertyObject("Setpoint Input", point).isDisplayable = false;
                    point["Setpoint Value"].isDisplayable = false;
                    point["High Deadband"].isDisplayable = false;
                    point["Low Deadband"].isDisplayable = false;

                    point["Input Deadband"].isDisplayable = true;
                    point["High Setpoint"].isDisplayable = true;
                    point["Low Setpoint"].isDisplayable = true;
                    point["Cooling Setpoint"].isDisplayable = false;
                    point["Heating Setpoint"].isDisplayable = false;
                } else {
                    obj.Utility.getPropertyObject("Setpoint Input", point).isDisplayable = false;
                    point["Setpoint Value"].isDisplayable = false;
                    point["High Deadband"].isDisplayable = false;
                    point["Low Deadband"].isDisplayable = false;

                    point["Input Deadband"].isDisplayable = true;
                    point["High Setpoint"].isDisplayable = false;
                    point["Low Setpoint"].isDisplayable = false;
                    point["Cooling Setpoint"].isDisplayable = true;
                    point["Heating Setpoint"].isDisplayable = true;
                }
                // Must be a Proportional point type. If Calculation Type is PID
            } else if (point["Calculation Type"] === "PID") {
                point["Input Range"].isDisplayable = true;

                delete point["Input Range"].ValueOptions; // Remove the ValueOptions object
                point["Input Range"].ValueOptions = {}; // Add an empty ValueOptions back

                // Set ValueOptions:
                // ’25 sec’, 0
                // ’50 sec’, 1
                // '75 sec', 2
                //  ...
                // ’200 sec’, 7
                for (i = 0; i < 8; i++) {
                    key = (25 + i * 25) + ' sec';
                    point["Input Range"].ValueOptions[key] = i;
                }

                point["Rise Time"].isDisplayable = true;
                point["Fall Time"].isDisplayable = true;

                point["Proportional Band"].isDisplayable = false;
                point["Reset Gain"].isDisplayable = false;
            } else if (point["Calculation Type"] === "PI") {
                point["Input Range"].isDisplayable = true;

                delete point["Input Range"].ValueOptions; // Remove the ValueOptions object
                point["Input Range"].ValueOptions = {}; // Add an empty ValueOptions back

                point["Input Range"].ValueOptions['1'] = 0;
                point["Input Range"].ValueOptions['10'] = 1;
                point["Input Range"].ValueOptions['100'] = 2;
                point["Input Range"].ValueOptions['1000'] = 3;
                point["Input Range"].ValueOptions['5000'] = 4;
                point["Input Range"].ValueOptions['10000'] = 5;
                point["Input Range"].ValueOptions['25000'] = 6;
                point["Input Range"].ValueOptions['Auto'] = 7;

                point["Rise Time"].isDisplayable = false;
                point["Fall Time"].isDisplayable = false;

                point["Proportional Band"].isDisplayable = true;
                point["Reset Gain"].isDisplayable = true;
            } else {
                point["Input Range"].isDisplayable = false;
                point["Rise Time"].isDisplayable = false;
                point["Fall Time"].isDisplayable = false;
                point["Proportional Band"].isDisplayable = true;
                point["Reset Gain"].isDisplayable = false;
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

            for (registerName in registers) {
                if (_.isEqual(point[registerName], refPoint[registerName]) === false) {
                    point[registers.registerName].length = 0;
                    len = refPoint[registerName].length;

                    for (i = 0; i < len; i++) {
                        // If the script point register name is in the list of program point register names
                        if ((ndx = oldPoint[registerName].indexOf(refPoint[registerName][i])) !== -1) {
                            point[registers.registerName][i] = oldPoint[registers.registerName][ndx]; // Get the register UPID
                        } else {
                            point[registers.registerName][i] = 0;
                        }
                    }

                    point[registerName] = refPoint[registerName]; // Copy register names to our point

                    // If this is the point registers
                    if (register.registerName === "Point Registers") {
                        // Rebuild point refs using point registers array
                        point["Point Refs"].length = 2; // Clear point registers out of point refs (array now consists of device point and script point only)

                        for (i = 0; i < len; i++) {
                            var pointRegister = null;

                            // Make srue the point register has a UPID
                            if (point["Point Registers"][i] !== 0) {
                                pointRegister = _.clone(getPointRegister(oldPoint["Point Refs"], "PointInst", point["Point Registers"][i]));
                            }

                            if (pointRegister !== null) {
                                pointRegister.AppIndex = i + 1;
                            } else {
                                pointRegister = {
                                    "isDisplayable": true,
                                    "isReadOnly": false,
                                    "ValueType": 8,
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
                key; // Work var

            // If a reference point is not defined,
            if (data.propertyObject.PointInst === 0) {
                isDisplayable = false;
                // Nope, a reference point IS defined
            } else {
                point[prop.ifValueN] = refPoint.Value;
                point[prop.ifValueN].isReadOnly = false;
            }

            // Set the desired isDisplayable key value for the If Compare N, If Result N, and If Value N properties
            for (key in prop) {
                // No 'If Result 1' property
                if (prop.key !== "If Result 1") {
                    point[prop.key].isDisplayable = isDisplayable;
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
                updateIsDisplayable = false;

            // If property is Input Point 1
            if (data.property === "Input Point 1") {
                if (data.propertyObject.PointInst !== 0) {
                    point["Input 2 Constant"] = refPoint.Value;
                    point["Input 2 Constant"].isReadOnly = false; // User must be able to select state from combo box
                    updateIsDisplayable = true;
                } else {
                    point["Input 2 Constant"].isDisplayable = false;
                }
                // Must be Input Point 2
            } else {
                updateIsDisplayable = true;
            }

            if (updateIsDisplayable === true) {
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
            if (data.point["Enable Warning Alarms"].Value === true) {
                data.point["High Warning Limit"].isReadOnly = false;
                data.point["Low Warning Limit"].isReadOnly = false;
            } else {
                data.point["High Warning Limit"].isReadOnly = true;
                data.point["Low Warning Limit"].isReadOnly = true;
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

                point[property].Value = "??????"; // Assume we can't find a match

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
            var point = data.point;
            var refPoint = data.refPoint;

            if (point.Value.ValueType === enumsTemplatesJson.Enums["Value Types"]["Enum"]["enum"]) {
                if (data.propertyObject.PointInst !== 0) {
                    point.States.isDisplayable = false;
                    point.Value.ValueOptions = refPoint.Value.ValueOptions;
                } else {
                    point.States.isDisplayable = true;
                    point.Value.ValueOptions = point.States.ValueOptions;
                }
            }
            return point;
        },

        applyDelayPointTypeMointorPoint: function(data) {
            var point = data.point, // Shortcut
                refPoint = data.refPoint; // Shortcut

            if (data.propertyObject.PointInst !== 0) {
                point["Trigger Constant"].Value = refPoint.Value.Value;
                point["Trigger Constant"].eValue = refPoint.Value.eValue;
                point["Trigger Constant"].ValueOptions = refPoint.Value.ValueOptions;
            }
            return point;
        },

        applyInterlockPoint: function(data) {
            var point = data.point;
            var refPoint = data.refPoint;

            if (data.propertyObject.PointInst !== 0) {
                point["Interlock State"] = refPoint.Value;
                point["Interlock State"].isDisplayable = true;
                point["Interlock State"].isReadOnly = false;
            } else {
                point["Interlock State"].isDisplayable = false;
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
                    point.Value.Value = data.oldPoint.Value.Value; // Just in case the value was changed while OOS was true

                    if (point.Value.hasOwnProperty("eValue")) {
                        point.Value.eValue = data.oldPoint.Value.eValue;
                    }
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

            if (data.propertyObject.PointInst !== 0) {
                point["Select State"] = refPoint.Value;
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

            if (data.propertyObject.PointInst !== 0) {
                point["Setpoint Value"].isDisplayable = false;
            } else {
                point["Setpoint Value"].isDisplayable = true;
            }

            return point;
        },

        applyShutdownPoint: function(data) {
            var point = data.point;
            var refPoint = data.refPoint;

            if (data.propertyObject.PointInst !== 0) {
                point["Shutdown State"] = refPoint.Value;
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

        applyConversionTypeProperty: function(data) {
            var point = data.point,
                propertyObject = data.propertyObject;

            if (data.property !== "Conversion Type") {
                propertyObject = obj.Utility.getPropertyObject("Conversion Type", data.point);
            }

            // Assume all conversion coefficients are displayable
            point["Conversion Coefficient 1"].isDisplayable = true;
            point["Conversion Coefficient 2"].isDisplayable = true;
            point["Conversion Coefficient 3"].isDisplayable = true;
            point["Conversion Coefficient 4"].isDisplayable = true;

            // Nothing to do for cubic conversion
            // If quad or flow conversion type
            if (propertyObject.Value === "Quadratic" || propertyObject.Value === "Flow") {
                point["Conversion Coefficient 4"].isDisplayable = false;
            } else if (propertyObject.Value === "Linear") {
                point["Conversion Coefficient 3"].isDisplayable = false;
                point["Conversion Coefficient 4"].isDisplayable = false;
            }
            return point;
        },

        applyDeviceTypeModelType: function(data) {
            var point = data.point;

            if (point["Model Type"].isDisplayable === false) {
                return point;
            }

            //------ Begin import data checks ---------------------------------------------------------------
            delete point.Protocol;
            delete point["Ethernet Maximum Address"];
            delete point["Ethernet Address"].Min;
            delete point["Ethernet Address"].Max;
            delete point["Port 1 Protocol"].Min;
            delete point["Port 1 Protocol"].Max;
            delete point["Port 2 Protocol"].Min;
            delete point["Port 2 Protocol"].Max;
            delete point["Port 3 Protocol"].Min;
            delete point["Port 3 Protocol"].Max;
            delete point["Port 4 Protocol"].Min;
            delete point["Port 4 Protocol"].Max;
            delete point["Port 1 Address"].Min;
            delete point["Port 1 Address"].Max;
            delete point["Port 2 Address"].Min;
            delete point["Port 2 Address"].Max;
            delete point["Port 3 Address"].Min;
            delete point["Port 3 Address"].Max;
            delete point["Port 4 Address"].Min;
            delete point["Port 4 Address"].Max;
            delete point["Port 1 Maximum Address"].Min;
            delete point["Port 1 Maximum Address"].Max;
            delete point["Port 2 Maximum Address"].Min;
            delete point["Port 2 Maximum Address"].Max;
            delete point["Port 3 Maximum Address"].Min;
            delete point["Port 3 Maximum Address"].Max;
            delete point["Port 4 Maximum Address"].Min;
            delete point["Port 4 Maximum Address"].Max;

            if (point["Uplink Port"].Value !== undefined) {

                if (point["Uplink Port"].Value == "Ethernet") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Ethernet"]["enum"];
                } else if (point["Uplink Port"].Value == "Port 1") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                } else if (point["Uplink Port"].Value == "Port 2") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"];
                } else if (point["Uplink Port"].Value == "Port 3") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"];
                } else if (point["Uplink Port"].Value == "Port 4") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"];
                }
            }

            if (point["Ethernet Protocol"].Value !== undefined) {
                if (point["Ethernet Protocol"].Value == "IP") { //Should this be TCP/IP
                    point["Ethernet Protocol"].eValue = enumsTemplatesJson.Enums["Ethernet Protocols"].IP["enum"];
                } else {
                    point["Ethernet Protocol"].eValue = enumsTemplatesJson.Enums["Ethernet Protocols"].None["enum"];
                }
            }

            if (point["Port 1 Protocol"].Value !== undefined) {
                if (point["Port 1 Protocol"].Value == "None") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "MS/TP") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "N2") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "Modbus RTU") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "MS/RTU") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                }
            }

            if (point["Port 2 Protocol"].Value !== undefined) {
                if (point["Port 2 Protocol"].Value == "None") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "MS/TP") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "N2") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "Modbus RTU") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "MS/RTU") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                }
            }

            if (point["Port 3 Protocol"].Value !== undefined) {
                if (point["Port 3 Protocol"].Value == "None") {
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                } else if (point["Port 3 Protocol"].Value == "MS/TP") {
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 3 Protocol"].Value == "N2") {
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 3 Protocol"].Value == "Modbus RTU") {
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 3 Protocol"].Value == "MS/RTU") {
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                }
            }

            if (point["Port 4 Protocol"].Value !== undefined) {
                if (point["Port 4 Protocol"].Value == "None") {
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                } else if (point["Port 4 Protocol"].Value == "MS/TP") {
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 4 Protocol"].Value == "N2") {
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 4 Protocol"].Value == "Modbus RTU") {
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 4 Protocol"].Value == "MS/RTU") {
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                }
            }
            //------ End import data checks -----------------------------------------------------------------

            point._devModel = point["Model Type"].eValue;
            point._cfgRequired = true;
            point._relPoint = enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"];

            if (typeof point["Ethernet Address"].Value !== "string") {
                point["Ethernet Address"].Value = "";
                point["Ethernet Address"].ValueType = enumsTemplatesJson.Enums["Value Types"]["String"]["enum"];
            }

            point["Ethernet Network"].Max = 65534;
            point["Port 1 Network"].Max = 65534;
            point["Port 2 Network"].Max = 65534;
            point["Port 3 Network"].Max = 65534;
            point["Port 4 Network"].Max = 65534;

            if (point["Model Type"].Value == "MicroScan 5 UNV" || point["Model Type"].Value == "Unknown" || point["Model Type"].Value == "MicroScan 5 xTalk" || point["Model Type"].Value == "MicroScan 5 UNV" || point["Model Type"].Value == "SCADA Vio") {

                point["Uplink Port"].isDisplayable = true;
                point["Uplink Port"].isReadOnly = false;
                point["Uplink Port"].ValueOptions = {
                    "Ethernet": enumsTemplatesJson.Enums["Device Ports"]["Ethernet"]["enum"],
                    "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"],
                    "Port 2": enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"],
                    "Port 3": enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"],
                    "Port 4": enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"]
                };
                if (point["Uplink Port"].Value == "Port 1") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                } else if (point["Uplink Port"].Value == "Port 2") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"];
                } else if (point["Uplink Port"].Value == "Port 3") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"];
                } else if (point["Uplink Port"].Value == "Port 4") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"];
                } else {
                    point["Uplink Port"].Value = "Ethernet";
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Ethernet"]["enum"];
                }

                point["Downlink Network"].isReadOnly = false;
                if (point["Downlink Network"].Value < 0 || point["Downlink Network"].Value > 65534) {
                    point["Downlink Network"].Value = 0;
                }

                point["Ethernet Protocol"].isDisplayable = true;
                if (point["Ethernet Protocol"].Value != "IP") { //Should this be TCP/IP
                    point["Ethernet Protocol"].Value = "None";
                    point["Ethernet Protocol"].eValue = enumsTemplatesJson.Enums["Ethernet Protocols"].None["enum"];
                } else {
                    point["Ethernet Protocol"].eValue = enumsTemplatesJson.Enums["Ethernet Protocols"].IP["enum"];
                }

                point["Ethernet Network"].isReadOnly = false;
                if (point["Ethernet Network"].Value < 0 || point["Ethernet Network"].Value > 65534) {
                    point["Ethernet Network"].Value = 0;
                }

                point["Ethernet Address"].isReadOnly = false;

                point["Port 1 Protocol"].isDisplayable = true;
                if (point["Port 1 Protocol"].Value == "MS/TP") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "N2") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "Modbus RTU") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "MS/RTU") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                } else {
                    point["Port 1 Protocol"].Value = "None";
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                }

                point["Port 2 Protocol"].isDisplayable = true;
                if (point["Port 2 Protocol"].Value == "MS/TP") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "N2") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "Modbus RTU") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "MS/RTU") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                } else {
                    point["Port 2 Protocol"].Value = "None";
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                }

                point["Port 3 Protocol"].isDisplayable = true;
                if (point["Port 3 Protocol"].Value == "MS/TP") {
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 3 Protocol"].Value == "N2") {
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 3 Protocol"].Value == "Modbus RTU") {
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 3 Protocol"].Value == "MS/RTU") {
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                } else {
                    point["Port 3 Protocol"].Value = "None";
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                }

                point["Port 4 Protocol"].isDisplayable = true;
                if (point["Port 4 Protocol"].Value == "MS/TP") {
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 4 Protocol"].Value == "N2") {
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 4 Protocol"].Value == "Modbus RTU") {
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 4 Protocol"].Value == "MS/RTU") {
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                } else {
                    point["Port 4 Protocol"].Value = "None";
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                }

                point["Port 1 Network"].isReadOnly = false;
                if (point["Port 1 Network"].Value < 0 || point["Port 1 Network"].Value > 65534) {
                    point["Port 1 Network"].Value = 0;
                }

                point["Port 2 Network"].isReadOnly = false;
                if (point["Port 2 Network"].Value < 0 || point["Port 2 Network"].Value > 65534) {
                    point["Port 2 Network"].Value = 0;
                }

                point["Port 3 Network"].isReadOnly = false;
                if (point["Port 3 Network"].Value < 0 || point["Port 3 Network"].Value > 65534) {
                    point["Port 3 Network"].Value = 0;
                }

                point["Port 4 Network"].isReadOnly = false;
                if (point["Port 4 Network"].Value < 0 || point["Port 4 Network"].Value > 65534) {
                    point["Port 4 Network"].Value = 0;
                }

                point["Port 1 Address"].isReadOnly = false;
                if (point["Port 1 Address"].Value < 0 || point["Port 1 Address"].Value > 127) {
                    point["Port 1 Address"].Value = 0;
                }

                point["Port 2 Address"].isReadOnly = false;
                if (point["Port 2 Address"].Value < 0 || point["Port 2 Address"].Value > 127) {
                    point["Port 2 Address"].Value = 0;
                }

                point["Port 3 Address"].isReadOnly = false;
                if (point["Port 3 Address"].Value < 0 || point["Port 3 Address"].Value > 127) {
                    point["Port 3 Address"].Value = 0;
                }

                point["Port 4 Address"].isReadOnly = false;
                if (point["Port 4 Address"].Value < 0 || point["Port 4 Address"].Value > 127) {
                    point["Port 4 Address"].Value = 0;
                }

                point["Port 1 Maximum Address"].isReadOnly = false;
                if (point["Port 1 Maximum Address"].Value < 0 || point["Port 1 Maximum Address"].Value > 127) {
                    point["Port 1 Maximum Address"].Value = 0;
                }

                point["Port 2 Address"].isReadOnly = false;
                if (point["Port 2 Maximum Address"].Value < 0 || point["Port 2 Maximum Address"].Value > 127) {
                    point["Port 2 Maximum Address"].Value = 0;
                }

                point["Port 3 Address"].isReadOnly = false;
                if (point["Port 3 Maximum Address"].Value < 0 || point["Port 3 Maximum Address"].Value > 127) {
                    point["Port 3 Maximum Address"].Value = 0;
                }

                point["Port 4 Maximum Address"].isReadOnly = false;
                if (point["Port 4 Maximum Address"].Value < 0 || point["Port 4 Maximum Address"].Value > 127) {
                    point["Port 4 Maximum Address"].Value = 0;
                }
            } else if (point["Model Type"].Value == "MicroScan 4 UNV" || point["Model Type"].Value == "MicroScan 4 xTalk" || point["Model Type"].Value == "MicroScan 4 Digital") {

                point["Uplink Port"].isDisplayable = true;
                point["Uplink Port"].isReadOnly = false;
                point["Uplink Port"].ValueOptions = {
                    "Ethernet": enumsTemplatesJson.Enums["Device Ports"]["Ethernet"]["enum"],
                    "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"]
                };

                if (point["Uplink Port"].Value != "Port 1") {
                    point["Uplink Port"].Value = "Ethernet";
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Ethernet"]["enum"];
                } else if (point["Uplink Port"].Value == "Port 1") {
                    point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                }

                point["Downlink Network"].isDisplayable = false;

                point["Ethernet Protocol"].isDisplayable = true;
                if (point["Ethernet Protocol"].Value != "IP") {
                    point["Ethernet Protocol"].Value = "None";
                    point["Ethernet Protocol"].eValue = enumsTemplatesJson.Enums["Ethernet Protocols"].None["enum"];
                } else {
                    point["Ethernet Protocol"].eValue = enumsTemplatesJson.Enums["Ethernet Protocols"].IP["enum"];
                }

                point["Ethernet Network"].isReadOnly = false;
                if (point["Ethernet Network"].Value < 0 || point["Ethernet Network"].Value > 65534) {
                    point["Ethernet Network"].Value = 0;
                }

                point["Ethernet Address"].isReadOnly = false;

                point["Port 1 Protocol"].isDisplayable = true;
                if (point["Port 1 Protocol"].Value == "MS/TP") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "N2") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "Modbus RTU") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 1 Protocol"].Value == "MS/RTU") {
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                } else {
                    point["Port 1 Protocol"].Value = "None";
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                }

                point["Port 2 Protocol"].isDisplayable = true;
                if (point["Port 2 Protocol"].Value == "MS/TP") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "N2") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["N2"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "Modbus RTU") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["Modbus RTU"]["enum"];
                } else if (point["Port 2 Protocol"].Value == "MS/RTU") {
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/RTU"]["enum"];
                } else {
                    point["Port 2 Protocol"].Value = "None";
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["None"]["enum"];
                }

                point["Port 3 Protocol"].isDisplayable = false;
                point["Port 4 Protocol"].isDisplayable = false;

                point["Port 1 Network"].isReadOnly = false;
                if (point["Port 1 Network"].Value < 0 || point["Port 1 Network"].Value > 65534) {
                    point["Port 1 Network"].Value = 0;
                }

                point["Port 2 Network"].isReadOnly = false;
                if (point["Port 2 Network"].Value < 0 || point["Port 2 Network"].Value > 65534) {
                    point["Port 2 Network"].Value = 0;
                }

                point["Port 1 Address"].isReadOnly = false;
                if (point["Port 1 Address"].Value < 0 || point["Port 1 Address"].Value > 127) {
                    point["Port 1 Address"].Value = 0;
                }

                point["Port 2 Address"].isReadOnly = false;
                if (point["Port 2 Address"].Value < 0 || point["Port 2 Address"].Value > 127) {
                    point["Port 2 Address"].Value = 0;
                }

                point["Port 1 Maximum Address"].isReadOnly = false;
                if (point["Port 1 Maximum Address"].Value < 0 || point["Port 1 Maximum Address"].Value > 127) {
                    point["Port 1 Maximum Address"].Value = 0;
                }

                point["Port 2 Address"].isReadOnly = false;
                if (point["Port 2 Maximum Address"].Value < 0 || point["Port 2 Maximum Address"].Value > 127) {
                    point["Port 2 Maximum Address"].Value = 0;
                }

            } else if (point["Model Type"].Value == "Central Device") {

                point["Model Type"].isDisplayable = false;

                point["Uplink Port"].isDisplayable = false;
                point["Uplink Port"].Value = "Ethernet";
                point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"].Ethernet["enum"];
                point["Uplink Port"].ValueOptions = {
                    "Ethernet": enumsTemplatesJson.Enums["Device Ports"].Ethernet["enum"]
                };

                point["Downlink Network"].isDisplayable = false;

                point["Ethernet Protocol"].isDisplayable = false;

                if (point["Ethernet Network"].Value < 0 || point["Ethernet Network"].Value > 65534) {
                    point["Ethernet Network"].Value = 0;
                }

                point["Ethernet Address"].isReadOnly = true;
                point["Ethernet Network"].isReadOnly = true;

                point["Port 1 Protocol"].isDisplayable = false;
                point["Port 2 Protocol"].isDisplayable = false;
                point["Port 3 Protocol"].isDisplayable = false;
                point["Port 4 Protocol"].isDisplayable = false;

            } else if (point["Model Type"].Value == "Field Interface Device" || point["Model Type"].Value == "MicroScan Interface Device" || point["Model Type"].Value == "Staefa Interface Device" || point["Model Type"].Value == "N2 Interface Device" || point["Model Type"].Value == "Sierra Steam Meter Device" || point["Model Type"].Value == "Armstrong SteamEye Device" || point["Model Type"].Value == "Siemens Power Meter Device" || point["Model Type"].Value == "Ingersol Rand Intellysis Device" || point["Model Type"].Value == "BACnet Interface Device") {

                point["Uplink Port"].isDisplayable = false;
                point["Uplink Port"].Value = "Port 1";
                point["Uplink Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                point["Uplink Port"].ValueOptions = {
                    "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"]
                };

                point["Ethernet Protocol"].isDisplayable = false;
                point["Ethernet Protocol"].Value = "None";
                point["Ethernet Protocol"].eValue = enumsTemplatesJson.Enums["Ethernet Protocols"].None["enum"];

                point["Port 1 Protocol"].isDisplayable = true;
                point["Port 2 Protocol"].isDisplayable = false;
                point["Port 3 Protocol"].isDisplayable = false;
                point["Port 4 Protocol"].isDisplayable = false;

                point["Port 1 Network"].isReadOnly = false;
                if (point["Port 1 Network"].Value < 0 || point["Port 1 Network"].Value > 65534) {
                    point["Port 1 Network"].Value = 0;
                }

            } else {
                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
                console.log("Bad Model Type:", point["Model Type"]);
            }
            data.point = point;
            data.point = this.applyDeviceTypeUplinkPort(data);
            return data.point;
        },

        applyAlarmRepeatEnable: function(data) {
            if (data.point["Alarm Repeat Enable"].Value === false)
                data.point["Alarm Repeat Time"].isDisplayable = false;
            else
                data.point["Alarm Repeat Time"].isDisplayable = true;

            return data.point;
        },

        applyDeviceTypeUplinkPort: function(data) {
            var point = data.point;

            if (point["Uplink Port"].Value == "Ethernet") {
                point["Ethernet Protocol"].isReadOnly = true;
                point["Ethernet Protocol"].Value = "IP";
                point["Ethernet Protocol"].eValue = enumsTemplatesJson.Enums["Ethernet Protocols"].IP["enum"];

                point["Ethernet Network"].Min = 1;

                point["Port 1 Protocol"].isReadOnly = false;
                point["Port 2 Protocol"].isReadOnly = false;
                point["Port 3 Protocol"].isReadOnly = false;
                point["Port 4 Protocol"].isReadOnly = false;

                point["Port 1 Network"].Min = 0;
                point["Port 2 Network"].Min = 0;
                point["Port 3 Network"].Min = 0;
                point["Port 4 Network"].Min = 0;

                if (point["Model Type"].Value == "MicroScan 5 UNV" || point["Model Type"].Value == "Unknown" || point["Model Type"].Value == "MicroScan 5 xTalk" || point["Model Type"].Value == "MicroScan 5 UNV" || point["Model Type"].Value == "SCADA Vio") {
                    point["Downlink Network"].isDisplayable = true;
                }
            } else {
                point["Downlink Network"].isDisplayable = false;

                point["Ethernet Protocol"].isReadOnly = false;

                point["Ethernet Network"].Min = 0;

                if (point["Uplink Port"].Value == "Port 1") {
                    point["Port 1 Protocol"].isReadOnly = true;
                    point["Port 2 Protocol"].isReadOnly = false;
                    point["Port 3 Protocol"].isReadOnly = false;
                    point["Port 4 Protocol"].isReadOnly = false;

                    point["Port 1 Protocol"].Value = "MS/TP";
                    point["Port 1 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];

                    point["Port 1 Network"].Min = 1;
                    point["Port 2 Network"].Min = 0;
                    point["Port 3 Network"].Min = 0;
                    point["Port 4 Network"].Min = 0;

                    point["Port 1 Maximum Address"].isReadOnly = false;
                    point["Port 2 Maximum Address"].isReadOnly = false;
                    point["Port 3 Maximum Address"].isReadOnly = false;
                    point["Port 4 Maximum Address"].isReadOnly = false;

                } else if (point["Uplink Port"].Value == "Port 2") {
                    point["Port 1 Protocol"].isReadOnly = false;
                    point["Port 2 Protocol"].isReadOnly = true;
                    point["Port 3 Protocol"].isReadOnly = false;
                    point["Port 4 Protocol"].isReadOnly = false;

                    point["Port 2 Protocol"].Value = "MS/TP";
                    point["Port 2 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];

                    point["Port 1 Network"].Min = 0;
                    point["Port 2 Network"].Min = 1;
                    point["Port 3 Network"].Min = 0;
                    point["Port 4 Network"].Min = 0;

                    point["Port 1 Maximum Address"].isReadOnly = false;
                    point["Port 2 Maximum Address"].isReadOnly = false;
                    point["Port 3 Maximum Address"].isReadOnly = false;
                    point["Port 4 Maximum Address"].isReadOnly = false;

                } else if (point["Uplink Port"].Value == "Port 3") {
                    point["Port 1 Protocol"].isReadOnly = false;
                    point["Port 2 Protocol"].isReadOnly = false;
                    point["Port 3 Protocol"].isReadOnly = true;
                    point["Port 4 Protocol"].isReadOnly = false;

                    point["Port 3 Protocol"].Value = "MS/TP";
                    point["Port 3 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];

                    point["Port 1 Network"].Min = 0;
                    point["Port 2 Network"].Min = 0;
                    point["Port 3 Network"].Min = 1;
                    point["Port 4 Network"].Min = 0;

                    point["Port 1 Maximum Address"].isReadOnly = false;
                    point["Port 2 Maximum Address"].isReadOnly = false;
                    point["Port 3 Maximum Address"].isReadOnly = false;
                    point["Port 4 Maximum Address"].isReadOnly = false;

                } else if (point["Uplink Port"].Value == "Port 4") {
                    point["Port 1 Protocol"].isReadOnly = false;
                    point["Port 2 Protocol"].isReadOnly = false;
                    point["Port 3 Protocol"].isReadOnly = false;
                    point["Port 4 Protocol"].isReadOnly = true;

                    point["Port 4 Protocol"].Value = "MS/TP";
                    point["Port 4 Protocol"].eValue = enumsTemplatesJson.Enums["Port Protocols"]["MS/TP"]["enum"];

                    point["Port 1 Network"].Min = 0;
                    point["Port 2 Network"].Min = 0;
                    point["Port 3 Network"].Min = 0;
                    point["Port 4 Network"].Min = 1;

                    point["Port 1 Maximum Address"].isReadOnly = false;
                    point["Port 2 Maximum Address"].isReadOnly = false;
                    point["Port 3 Maximum Address"].isReadOnly = false;
                    point["Port 4 Maximum Address"].isReadOnly = false;
                }

            }

            data.point = point;
            data.point = this.applyDeviceTypeEthernetProtocol(data);
            data.point = this.applyDeviceTypePortNProtocol(data);
            return data.point;
        },

        applyDeviceTypeEthernetProtocol: function(data) {
            var point = data.point;

            if (point["Ethernet Protocol"].Value == "None") {
                point["Ethernet Address"].isDisplayable = false;

                point["Ethernet Network"].isDisplayable = false;
            } else {
                point["Ethernet Address"].isDisplayable = true;

                point["Ethernet Network"].isDisplayable = true;
            }

            return point;
        },

        applyDeviceTypePortNProtocol: function(data) {
            var point = data.point;

            if (point["Port 1 Protocol"].isDisplayable === false) {
                point["Port 1 Address"].isDisplayable = false;
                point["Port 1 Maximum Address"].isDisplayable = false;
                point["Port 1 Network"].isDisplayable = false;
            } else if (point["Port 1 Protocol"].Value == "MS/TP") {
                point["Port 1 Network"].isDisplayable = true;
                point["Port 1 Address"].isDisplayable = true;
                point["Port 1 Maximum Address"].isDisplayable = true;
            } else if (point["Port 1 Protocol"].Value == "MS/RTU") {
                point["Port 1 Network"].isDisplayable = true;
                point["Port 1 Address"].isDisplayable = false;
                point["Port 1 Maximum Address"].isDisplayable = true;
                point["Port 1 Maximum Address"].isReadOnly = false;
            } else {
                point["Port 1 Address"].isDisplayable = false;
                point["Port 1 Maximum Address"].isDisplayable = false;
                point["Port 1 Network"].isDisplayable = false;
            }

            if (point["Port 2 Protocol"].isDisplayable === false) {
                point["Port 2 Address"].isDisplayable = false;
                point["Port 2 Maximum Address"].isDisplayable = false;
                point["Port 2 Network"].isDisplayable = false;
            } else if (point["Port 2 Protocol"].Value == "MS/TP") {
                point["Port 2 Network"].isDisplayable = true;
                point["Port 2 Address"].isDisplayable = true;
                point["Port 2 Maximum Address"].isDisplayable = true;
            } else if (point["Port 2 Protocol"].Value == "MS/RTU") {
                point["Port 2 Network"].isDisplayable = true;
                point["Port 2 Address"].isDisplayable = false;
                point["Port 2 Maximum Address"].isDisplayable = true;
                point["Port 2 Maximum Address"].isReadOnly = false;
            } else {
                point["Port 2 Address"].isDisplayable = false;
                point["Port 2 Maximum Address"].isDisplayable = false;
                point["Port 2 Network"].isDisplayable = false;
            }

            if (point["Port 3 Protocol"].isDisplayable === false) {
                point["Port 3 Address"].isDisplayable = false;
                point["Port 3 Maximum Address"].isDisplayable = false;
                point["Port 3 Network"].isDisplayable = false;
            } else if (point["Port 3 Protocol"].Value == "MS/TP") {
                point["Port 3 Network"].isDisplayable = true;
                point["Port 3 Address"].isDisplayable = true;
                point["Port 3 Maximum Address"].isDisplayable = true;
            } else if (point["Port 3 Protocol"].Value == "MS/RTU") {
                point["Port 3 Network"].isDisplayable = true;
                point["Port 3 Address"].isDisplayable = false;
                point["Port 3 Maximum Address"].isDisplayable = true;
                point["Port 3 Maximum Address"].isReadOnly = false;
            } else {
                point["Port 3 Address"].isDisplayable = false;
                point["Port 3 Maximum Address"].isDisplayable = false;
                point["Port 3 Network"].isDisplayable = false;
            }

            if (point["Port 4 Protocol"].isDisplayable === false) {
                point["Port 4 Address"].isDisplayable = false;
                point["Port 4 Maximum Address"].isDisplayable = false;
                point["Port 4 Network"].isDisplayable = false;
            } else if (point["Port 4 Protocol"].Value == "MS/TP") {
                point["Port 4 Network"].isDisplayable = true;
                point["Port 4 Address"].isDisplayable = true;
                point["Port 4 Maximum Address"].isDisplayable = true;
            } else if (point["Port 4 Protocol"].Value == "MS/RTU") {
                point["Port 4 Network"].isDisplayable = true;
                point["Port 4 Address"].isDisplayable = false;
                point["Port 4 Maximum Address"].isDisplayable = true;
                point["Port 4 Maximum Address"].isReadOnly = false;
            } else {
                point["Port 4 Address"].isDisplayable = false;
                point["Port 4 Maximum Address"].isDisplayable = false;
                point["Port 4 Network"].isDisplayable = false;
            }

            return point;
        },

        applyRemoteUnitTypeModelType: function(data) {
            var point = data.point;

            point._cfgRequired = true;
            point._relPoint = enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"];

            point._rmuModel = point["Model Type"].eValue;

            point["Device Address"].isDisplayable = true;
            point["Device Address"].Min = 0;
            point["Device Address"].Max = 127;

            point["Device Port"].isDisplayable = false;
            point["Device Port"].ValueOptions = {
                "Ethernet": enumsTemplatesJson.Enums["Device Ports"]["Ethernet"]["enum"],
                "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"],
                "Port 2": enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"],
                "Port 3": enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"],
                "Port 4": enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"]
            };

            point["Poll Function"].isDisplayable = false;
            point["Poll Register"].isDisplayable = false;
            point["Instance"].isDisplayable = false;

            point["Network Type"].isDisplayable = false;
            point["Network Type"].ValueOptions = {
                "Unknown": enumsTemplatesJson.Enums["Network Types"].Unknown["enum"],
                "MS/TP": enumsTemplatesJson.Enums["Network Types"]["MS/TP"]["enum"],
                "IP": enumsTemplatesJson.Enums["Network Types"]["IP"]["enum"]
            };

            point["Network Segment"].isDisplayable = false;

            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"])) {

                if (point["Model Type"].Value == "BACnet") {

                    point["Device Port"].Value = "Port 1";
                    point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];

                    point["Network Type"].isDisplayable = true;

                    if (point["Network Type"].eValue === enumsTemplatesJson.Enums["Network Types"]["MS/TP"]["enum"])
                        point["Network Type"].Value = "MS/TP";
                    else if (point["Network Type"].eValue === enumsTemplatesJson.Enums["Network Types"]["IP"]["enum"])
                        point["Network Type"].Value = "IP";
                    else {
                        point["Network Type"].eValue = enumsTemplatesJson.Enums["Network Types"].Unknown["enum"];
                        point["Network Type"].Value = "Unknown";
                    }
                    data.point = point;
                    point = this.applyRemoteUnitTypeNetworkType(data);

                } else if (point["Model Type"].Value == "Liebert" || point["Model Type"].Value == "Sierra Steam Meter" || point["Model Type"].Value == "Siemens Power Meter" || point["Model Type"].Value == "Ingersol Rand Intellysis" || point["Model Type"].Value == "PowerLogics 3000 Meter" || point["Model Type"].Value == "Generic Modbus" || point["Model Type"].Value == "PowerTraks 9000" || point["Model Type"].Value == "Programmable Modbus") {

                    point["Device Port"].isDisplayable = true;
                    point["Device Port"].ValueOptions = { // not stated anymore
                        "Ethernet": enumsTemplatesJson.Enums["Device Ports"]["Ethernet"]["enum"],
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"],
                        "Port 2": enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"],
                        "Port 3": enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"],
                        "Port 4": enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"]
                    };
                    if (point["Device Port"].Value == "Port 1") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                    } else if (point["Device Port"].Value == "Port 2") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"];
                    } else if (point["Device Port"].Value == "Port 3") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"];
                    } else if (point["Device Port"].Value == "Port 4") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"];
                    } else {
                        point["Device Port"].Value = "Ethernet";
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Ethernet"]["enum"];
                    }

                    point["Device Address"].isDisplayable = true; // not stated anymore
                    point["Device Address"].Max = 254;

                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;

                } else if (point["Model Type"].Value == "MS3 RT" || point["Model Type"].Value == "MS 3 EEPROM" || point["Model Type"].Value == "MS 3 Flash" || point["Model Type"].Value == "MS 4 VAV") {

                    point["Device Port"].isDisplayable = true;
                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"],
                        "Port 2": enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"],
                        "Port 3": enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"],
                        "Port 4": enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"]
                    };
                    if (point["Device Port"].Value == "Port 2") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"];
                    } else if (point["Device Port"].Value == "Port 3") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"];
                    } else if (point["Device Port"].Value == "Port 4") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"];
                    } else {
                        point["Device Port"].Value = "Port 1";
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                    }

                    point["Device Address"].isDisplayable = true;
                    point["Device Address"].Max = 127;

                    point["Poll Function"].isDisplayable = false;
                    point["Poll Register"].isDisplayable = false;
                    point["Instance"].isDisplayable = false;

                    point["Network Type"].isDisplayable = false;
                    point["Network Segment"].isDisplayable = false;

                } else if (point["Model Type"].Value == "N2 Device") {

                    point["Device Port"].isDisplayable = true;
                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"],
                        "Port 2": enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"],
                        "Port 3": enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"],
                        "Port 4": enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"]
                    };
                    if (point["Device Port"].Value == "Port 2") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"];
                    } else if (point["Device Port"].Value == "Port 3") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 3"]["enum"];
                    } else if (point["Device Port"].Value == "Port 4") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 4"]["enum"];
                    } else {
                        point["Device Port"].Value = "Port 1";
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                    }

                    point["Device Address"].isDisplayable = true; // not stated anymore
                    point["Device Address"].Max = 254;

                } else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];

                    // TODO is this production or debug code?:
                    console.log("Bad RMU Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
                }

                // If MicroScan 4 UNV, MicroScan 4 xTalk, or MicroScan 4 Digital
            } else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"])) {

                if (point["Model Type"].Value == "BACnet") {

                    point["Device Port"].Value = "Port 1";
                    point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];

                    point["Instance"].isDisplayable = true;

                    point["Network Type"].isDisplayable = true;

                    if (point["Network Type"].Value == "MS/TP") {
                        point["Network Type"].eValue = enumsTemplatesJson.Enums["Network Types"]["MS/TP"]["enum"];
                    } else if (point["Network Type"].Value == "IP") {
                        point["Network Type"].eValue = enumsTemplatesJson.Enums["Network Types"]["IP"]["enum"];
                    } else {
                        point["Network Type"].Value = "Unknown";
                        point["Network Type"].eValue = enumsTemplatesJson.Enums["Network Types"].Unknown["enum"];
                    }

                    data.point = point;
                    point = this.applyRemoteUnitTypeNetworkType(data);

                } else if (point["Model Type"].Value == "Liebert" || point["Model Type"].Value == "Sierra Steam Meter" || point["Model Type"].Value == "Siemens Power Meter" || point["Model Type"].Value == "Ingersol Rand Intellysis" || point["Model Type"].Value == "PowerLogic 3000 Meter" || point["Model Type"].Value == "Generic Modbus" || point["Model Type"].Value == "PowerTraks 9000" || point["Model Type"].Value == "Programmable Modbus") {

                    point["Device Port"].isDisplayable = true;
                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"],
                        "Port 2": enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"]
                    };
                    if (point["Device Port"].Value == "Port 2") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"];
                    } else {
                        point["Device Port"].Value = "Port 1";
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                    }

                    point["Device Address"].Max = 254;

                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;

                } else if (point["Model Type"].Value == "MS3 RT" || point["Model Type"].Value == "MS 3 EEPROM" || point["Model Type"].Value == "MS 3 Flash" || point["Model Type"].Value == "MS 4 VAV") {

                    point["Device Port"].isDisplayable = true;
                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"],
                        "Port 2": enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"]
                    };
                    if (point["Device Port"].Value == "Port 2") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"];
                    } else {
                        point["Device Port"].Value = "Port 1";
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                    }

                } else if (point["Model Type"].Value == "N2 Device") {

                    point["Device Port"].isDisplayable = true;
                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"],
                        "Port 2": enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"]
                    };
                    if (point["Device Port"].Value == "Port 2") {
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 2"]["enum"];
                    } else {
                        point["Device Port"].Value = "Port 1";
                        point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                    }

                    point["Device Address"].Max = 254;

                } else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];

                    // TODO Debug or production code?:
                    console.log("Bad RMU Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
                }
            } else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["BACnet Interface Device"]["enum"]) {

                if (point["Model Type"].Value == "BACnet") {

                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"]
                    };
                    point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];
                    point["Device Port"].Value = "Port 1";

                    point["Instance"].isDisplayable = true;

                    point["Network Type"].isDisplayable = true;
                    point["Network Type"].ValueOptions = {
                        "Unknown": enumsTemplatesJson.Enums["Network Types"].Unknown["enum"],
                        "MS/TP": enumsTemplatesJson.Enums["Network Types"]["MS/TP"]["enum"]
                    };
                    if (point["Network Type"].Value == "MS/TP") {
                        point["Network Type"].eValue = enumsTemplatesJson.Enums["Network Types"]["MS/TP"]["enum"];
                    } else {
                        point["Network Type"].Value = "Unknown";
                        point["Network Type"].eValue = enumsTemplatesJson.Enums["Network Types"].Unknown["enum"];
                    }

                    data.point = point;
                    point = this.applyRemoteUnitTypeNetworkType(data);

                } else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];

                    // TODO Debug or production code?:
                    console.log("Bad RMU Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
                }
            }
            // If Sierra steam meter, Siemens Power Meter, or Ingersol Rand device
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Sierra Steam Meter Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Siemens Power Meter Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Ingersol Rand Intellysis Device"]["enum"])) {

                if (point["Model Type"].Value == "Sierra Steam Meter" || point["Model Type"].Value == "Siemens Power Meter" || point["Model Type"].Value == "Ingersol Rand Intellysis") {

                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"]
                    };
                    point["Device Port"].Value = "Port 1";
                    point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];

                    point["Device Address"].Max = 254;

                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;

                } else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];

                    // TODO Debug or production code?:
                    console.log("Bad RMU Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
                }
            }
            // If MicroScan Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan Interface Device"]["enum"]) {
                if (point["Model Type"].Value == "MS3 RT" || point["Model Type"].Value == "MS 3 EEPROM" || point["Model Type"].Value == "MS 3 Flash") {

                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"]
                    };
                    point["Device Port"].Value = "Port 1";
                    point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];

                } else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];

                    // TODO Debug or production code?:
                    console.log("Bad RMU Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
                }
            }
            // If N2 Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["N2 Interface Device"]["enum"]) {
                if (point["Model Type"].Value == "N2 Device") {

                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"]
                    };
                    point["Device Port"].Value = "Port 1";
                    point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];

                    point["Device Address"].Max = 254;

                } else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];

                    // TODO Debug or production code?:
                    console.log("Bad RMU Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
                }
            }
            // If Field Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Field Interface Device"]["enum"]) {
                if (point["Model Type"].Value == "IFC Remote Unit") {

                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"]
                    };
                    point["Device Port"].Value = "Port 1";
                    point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];

                    point["Device Address"].Max = 254;

                } else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];

                    // TODO Debug or production code?:
                    console.log("Bad RMU Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
                }
            }
            // If Armstrong SteamEye Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Armstrong SteamEye Device"]["enum"]) {
                if (point["Model Type"].Value == "ASE Remote Unit") {
                    point["COV Period"].ValueType = 12;

                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"]
                    };
                    point["Device Port"].Value = "Port 1";
                    point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];

                    point["Device Address"].Max = 65535;

                } else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];

                    // TODO Debug or production code?:
                    console.log("Bad RMU Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
                }
            }
            // If Staefa Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Staefa Interface Device"]["enum"]) {
                if (point["Model Type"].Value == "Smart II Remote Unit") {
                    point["Device Port"].ValueOptions = {
                        "Port 1": enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"]
                    };
                    point["Device Port"].Value = "Port 1";
                    point["Device Port"].eValue = enumsTemplatesJson.Enums["Device Ports"]["Port 1"]["enum"];

                    point["Device Address"].Max = 254;

                } else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];

                    // TODO Debug or production code?:
                    console.log("Bad RMU Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
                }
            } else {
                point.relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];

                // TODO Debug or production code?:
                console.log("Bad Device Model Type:", point["Model Type"].Value, ", _id:", point._id, ", _devModel:", point._devModel);
            }
            return point;
        },

        applyRemoteUnitTypeNetworkType: function(data) {
            var point = data.point;

            if (point["Network Type"].Value == "Unknown") {
                point["Device Address"].isDisplayable = false;
                point["Network Segment"].isDisplayable = false;
            } else if (point["Network Type"].Value == "MS/TP") {
                point["Device Address"].isDisplayable = true;
                point["Device Address"].Max = 127;
                point["Network Segment"].isDisplayable = true;
            } else {
                point["Device Address"].isDisplayable = true;
                point["Device Address"].Max = -1;
                point["Network Segment"].isDisplayable = true;
            }
            return point;
        },

        applyAnalogInputTypeSensorPoint: function(data) {
            var point = data.point,
                refPoint = data.refPoint,
                i,
                prop;

            if (data.propertyObject.PointInst !== 0) {
                point["Conversion Type"].isReadOnly = true;
                point["Conversion Type"].eValue = refPoint["Conversion Type"].eValue;
                point["Conversion Type"].Value = refPoint["Conversion Type"].Value;

                for (i = 1; i < 5; i++) {
                    prop = "Conversion Coefficient " + i;
                    point[prop].isReadOnly = true;
                    point[prop].Value = refPoint[prop].Value;
                }
            } else {
                point["Conversion Type"].isReadOnly = false;

                for (i = 1; i < 5; i++) {
                    prop = "Conversion Coefficient " + i;
                    point[prop].isReadOnly = false;
                }
            }
            point = this.applyConversionTypeProperty(data);
            return point;
        },

        applyAnalogInputTypeDevModel: function(data) {
            var point = data.point;

            // If unknown or central device model type 
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"])) {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"]; // Set reliability to 'invalid device model type'
            } else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"]; // Set reliability to 'no fault'                  
            }

            point._cfgRequired = true;

            point.Instance.isDisplayable = false;
            point.Channel.isDisplayable = false;

            point["VAV Channel"].isDisplayable = false;
            point["VAV Channel"].ValueOptions = {
                "1 - Zone Temperature": 1,
                "2 - Setpoint Adjust": 2,
                "3 - Supply Temperature": 3,
                "4 - Auxiliary": 4,
                "5 - Air Volume": 5
            };

            point["Input Type"].isDisplayable = false;
            point["Poll Data Type"].isDisplayable = false;
            point["Poll Function"].isDisplayable = false;
            point["Poll Register"].isDisplayable = false;
            obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = false;
            point["Conversion Type"].isDisplayable = false;
            point["Conversion Coefficient 1"].isDisplayable = false;
            point["Conversion Coefficient 2"].isDisplayable = false;
            point["Conversion Coefficient 3"].isDisplayable = false;
            point["Conversion Coefficient 4"].isDisplayable = false;

            // If Device type uknown, Central device, MicroScan 5 xTalk, MicroScan 5 UNV, or SCADA Vio
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"])) {

                // If no RMU defined for this point
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 5 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // Else if SCADA Vio
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"]) {

                        point.Channel.isDisplayable = true;
                        point.Channel.Max = 2;
                        point.Channel.Min = 1;

                        point["Input Type"].isDisplayable = true;
                        point["Input Type"].ValueOptions = {
                            "20 mA SP": 3,
                            "Rate Input": 5
                        };

                        obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                        point["Conversion Type"].isDisplayable = true;

                        // Applying Sensor Logic
                        data.point = point;
                        return data.point;
                    }
                    // Must be MS5-UNV or central (no device assigned)
                    else {

                        point.Channel.isDisplayable = true;
                        point.Channel.Max = 16;
                        point.Channel.Min = 1;

                        point["Input Type"].isDisplayable = true;
                        point["Input Type"].ValueOptions = {
                            "Resistance": 0,
                            "5 Volt": 1,
                            "10 Volt": 2,
                            "20 mA SP": 3,
                            "20 mA LP": 4,
                            "Rate Input": 5
                        };

                        obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                        point["Conversion Type"].isDisplayable = true;

                        // Applying Sensor Logic
                        data.point = point;
                        return data.point;
                    }
                }
                // An RMU is defined for this point.  If BACnet or N2,
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                }
                // If RMU is Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // If MS3 RT, MS3 EEPROM, MS3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point["Channel"].isDisplayable = true;
                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;

                    point["Input Type"].isDisplayable = true;
                    point["Input Type"].ValueOptions = {
                        "Normal": 0,
                        "Inverted": 2,
                        "Velocity": 3
                    };

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // MS4-VAV
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"]) {

                    point["VAV Channel"].isDisplayable = true;

                    point["Input Type"].isDisplayable = true;
                    point["Input Type"].ValueOptions = {
                        "Normal": 0,
                        "Inverted": 2,
                        "Velocity": 3
                    };

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // Invalid RMU type
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"]; // Set reliability to 'Invalid Remote Unit Model Type'
                }
            }
            // If MicroScan 4 UNV, MicroScan 4 xTalk, or MicroScan 4 Digital device
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"])) {

                // If no RMU defined for this point
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 4 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // Else if MicroScan 4 Digital
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"]) {

                        point.Channel.isDisplayable = true;
                        point.Channel.Max = 32;
                        point.Channel.Min = 1;

                        point["Input Type"].isDisplayable = true;
                        point["Input Type"].ValueOptions = {
                            "Rate Input": 1
                        };

                        obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                        point["Conversion Type"].isDisplayable = true;

                        // Applying Sensor Logic
                        data.point = point;
                        return data.point;
                    }
                    // Must be MS4-UNV
                    else {

                        point.Channel.isDisplayable = true;
                        point.Channel.Max = 16;
                        point.Channel.Min = 1;

                        point["Input Type"].isDisplayable = true;
                        point["Input Type"].ValueOptions = {
                            "Normal": 0,
                            "Rate Input": 1
                        };

                        obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                        point["Conversion Type"].isDisplayable = true;

                        // Applying Sensor Logic
                        data.point = point;
                        return data.point;
                    }
                }
                // An RMU is defined for this point.  If BACnet or N2,
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // If MS3 RT, MS3 EEPROM, MS3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point["Channel"].isDisplayable = true;
                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;

                    point["Input Type"].isDisplayable = true;
                    point["Input Type"].ValueOptions = {
                        "Normal": 0,
                        "Inverted": 2,
                        "Velocity": 3
                    };

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // MS4-VAV
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"]) {

                    point["VAV Channel"].isDisplayable = true;

                    point["Input Type"].isDisplayable = true;
                    point["Input Type"].ValueOptions = {
                        "Normal": 0,
                        "Inverted": 2,
                        "Velocity": 3
                    };

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // Invalid RMU type
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If BACnet Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["BACnet Interface Device"]["enum"]) {

                // If no Remote Unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"]; // Set reliability to 'Invalid Remote Unit Model Type'
                }
                // RMU defined.  If BACnet RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) {

                    point.Instance.isDisplayable = true;
                }
                // Invalid RMU
                else
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
            }
            // If Sierra Steam Meter Device, Siemens Power Meter Device, or Ingersol Rand Intellysis Device
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Sierra Steam Meter Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Siemens Power Meter Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Ingersol Rand Intellysis Device"]["enum"])) {

                // If no remote unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined.  If Sierra Steam Meter, Siemens Power Meter, or Ingersol Rand RMU
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"])) {

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // Invalid RMU
                else
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
            }
            // MicroScan Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan Interface Device"]["enum"]) {

                // If no remote unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // If MS3 RT, MS3 EEPROM, MS3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point["Channel"].isDisplayable = true;
                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;

                    point["Input Type"].isDisplayable = true;
                    point["Input Type"].ValueOptions = {
                        "Normal": 0,
                        "Inverted": 2,
                        "Velocity": 3
                    };

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // N2 Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["N2 Interface Device"]["enum"]) {

                // If no remote unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // If N2 Device type
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"]) {

                    point.Instance.isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // Field Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Field Interface Device"]["enum"]) {

                // If no remote unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // If IFC Remote Unit type
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["IFC Remote Unit"]["enum"]) {

                    point.Channel.isDisplayable = true;
                    point.Channel.Max = 15;
                    point.Channel.Min = 0;

                    point["Input Type"].isDisplayable = true;
                    point["Input Type"].ValueOptions = {
                        "High Resistance": 0,
                        "High Voltage": 1,
                        "Low Resistance": 2,
                        "Low Voltage": 3
                    };

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // Armstrong SteamEye Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Armstrong SteamEye Device"]["enum"]) {

                // If no remote unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // If ASE RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["ASE Remote Unit"]["enum"]) {

                    point.Channel.isDisplayable = true;
                    point.Channel.Max = 255;
                    point.Channel.Min = 0;

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // Invalid RMU
                else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // Staefa Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Staefa Interface Device"]["enum"]) {

                // If no remote unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // If Smart II Remote Unit
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Smart II Remote Unit"]["enum"]) {

                    point.Channel.isDisplayable = true;
                    point.Channel.Max = 7;
                    point.Channel.Min = 0;

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Type"].isDisplayable = true;

                    // Applying Sensor Logic
                    data.point = point;
                    return data.point;
                }
                // Invalid RMU
                else {
                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // Invalid device type
            else {
                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            }
            return point;
        },

        applyAnalogOutputTypeSensorPoint: function(data) {
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

        applyAnalogOutputTypeOutputType: function(data) {
            var point = data.point;

            point["Close Channel"].isDisplayable = false;
            point["Open Channel"].isDisplayable = false;
            point["VAV Channel"].isDisplayable = false;
            point.Channel.isDisplayable = false;
            point.Polarity.isDisplayable = false;

            if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"]) {
                point["VAV Channel"].isDisplayable = true;
            }
            // If this is an AO using DO channels
            else if ((point["Output Type"].Value == "Pulsed") || (point["Output Type"].Value == "Pulse Width")) {
                point.Polarity.isDisplayable = true; // Polarity is always visible in Pulsed and Pulse Width modes
                point.Polarity.isReadOnly = false; // Ensure user can edit the polarity
                
                if (point["Output Type"].Value == "Pulsed") { // Pulsed uses the open and close channels
                    point.Channel.isDisplayable = false; // Pulsed uses 2 channels; hide this one

                    point["Close Channel"].isDisplayable = true;
                    point["Open Channel"].isDisplayable = true;
                } else { // Pulse width mode
                    point.Channel.isDisplayable = true; // Pulsed mode uses one channel
                }
            }
            // This is a non-VAV AO using AO channels
            else {
                point.Channel.isDisplayable = true;
            }
            return point;
        },

        applyAnalogOutputTypeDevModel: function(data) {
            var point = data.point;

            // If unknown or central device model type
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"])) {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            } else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"];
            }

            point._cfgRequired = true;

            obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = false;
            point["Conversion Coefficient 1"].isDisplayable = false;
            point["Conversion Coefficient 2"].isDisplayable = false;
            point.Instance.isDisplayable = false;
            point["Poll Data Type"].isDisplayable = false;
            point["Poll Function"].isDisplayable = false;
            point["Poll Register"].isDisplayable = false;
            point["Control Data Type"].isDisplayable = false;
            point["Control Function"].isDisplayable = false;
            point["Control Register"].isDisplayable = false;
            point["Output Type"].isDisplayable = false;
            point["Open Channel"].isDisplayable = false;
            point["Close Channel"].isDisplayable = false;
            point.Channel.isDisplayable = false;
            point.Polarity.isDisplayable = false;
            point["VAV Channel"].isDisplayable = false;
            point["VAV Channel"].ValueOptions = {
                "1 - Damper": 1,
                "2 - Reheat": 2
            };

            // If Device type uknown, Central device, MicroScan 5 xTalk, MicroScan 5 UNV, or SCADA Vio
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"])) {

                // If this point is not on an RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 5 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // Else if SCADA Vio
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"]) {

                        obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;

                        point["Conversion Coefficient 1"].isDisplayable = true;
                        point["Conversion Coefficient 2"].isDisplayable = true;

                        point["Output Type"].isDisplayable = true;
                        point["Output Type"].ValueOptions = {
                            "Pulse Width": 1,
                            "Pulsed": 2
                        };

                        point["Open Channel"].Max = 5;
                        point["Open Channel"].Min = 1;

                        point["Close Channel"].Max = 5;
                        point["Close Channel"].Min = 1;

                        data.point = point;
                        data.point = this.applyAnalogOutputTypeOutputType(data);
                        return data.point;
                    }
                    // Must be a MicroScan 5 UNV
                    else {

                        obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;

                        point["Conversion Coefficient 1"].isDisplayable = true;
                        point["Conversion Coefficient 2"].isDisplayable = true;

                        point["Output Type"].isDisplayable = true;
                        point["Output Type"].ValueOptions = {
                            // "0 to 5 Volt": 0,
                            // "Pulse Width": 1,
                            // "Pulsed": 2,
                            // "0 to 10 Volt": 3,
                            // "0 to 20 mA": 4
                            // JDR - 2.21.2013 - reordering the list for UI purposes
                            "0 to 5 Volt": 0,
                            "0 to 10 Volt": 3,
                            "0 to 20 mA": 4,
                            "Pulse Width": 1,
                            "Pulsed": 2
                        };

                        point["Open Channel"].Max = 8;
                        point["Open Channel"].Min = 1;

                        point["Close Channel"].Max = 8;
                        point["Close Channel"].Min = 1;


                        data.point = point;
                        data.point = this.applyAnalogOutputTypeOutputType(data);
                        return data.point;
                    }
                }
                // An RMU is defined for this point.  If BACnet or N2,
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Coefficient 1"].isDisplayable = true;
                    point["Conversion Coefficient 2"].isDisplayable = true;

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;

                    point["Control Data Type"].isDisplayable = true;
                    point["Control Function"].isDisplayable = true;
                    point["Control Register"].isDisplayable = true;

                    data.point = point;
                    data.point = this.applyAnalogOutputTypeOutputType(data);
                    return data.point;
                }
                // If MS 4 VAV, MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Coefficient 1"].isDisplayable = true;
                    point["Conversion Coefficient 2"].isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Analog": 0,
                        "Pulse Width": 1,
                        "Pulsed": 2
                    };

                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;

                    point["Open Channel"].Max = 7;
                    point["Open Channel"].Min = 0;

                    point["Close Channel"].Max = 7;
                    point["Close Channel"].Min = 0;


                    data.point = point;
                    data.point = this.applyAnalogOutputTypeOutputType(data);
                    return data.point;
                }
                // Invalid RMU type
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan 4 UNV, MicroScan 4 xTalk, or MicroScan 4 Digital
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"])) {

                // If remote unit not defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 4 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // If MicroScan 4 Digital
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"]) {

                        obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;

                        point["Conversion Coefficient 1"].isDisplayable = true;
                        point["Conversion Coefficient 2"].isDisplayable = true;

                        point["Output Type"].isDisplayable = true;
                        point["Output Type"].ValueOptions = {
                            "Pulse Width": 1,
                            "Pulsed": 2
                        };

                        point["Open Channel"].Max = 32;
                        point["Open Channel"].Min = 1;

                        point["Close Channel"].Max = 32;
                        point["Close Channel"].Min = 1;


                        data.point = point;
                        data.point = this.applyAnalogOutputTypeOutputType(data);
                        return data.point;
                    }
                    // Must be MicroScan 4 UNV
                    else {

                        obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                        point["Conversion Coefficient 1"].isDisplayable = true;
                        point["Conversion Coefficient 2"].isDisplayable = true;

                        point["Output Type"].isDisplayable = true;
                        point["Output Type"].ValueOptions = {
                            "Analog": 0,
                            "Pulse Width": 1,
                            "Pulsed": 2
                        };

                        point["Channel"].isDisplayable = true;
                        point["Channel"].Max = 8;
                        point["Channel"].Min = 1;

                        point["Open Channel"].Max = 8;
                        point["Open Channel"].Min = 1;

                        point["Close Channel"].Max = 8;
                        point["Close Channel"].Min = 1;


                        data.point = point;
                        data.point = this.applyAnalogOutputTypeOutputType(data);
                        return data.point;
                    }
                }
                // RMU defined. If BACnet or N2,
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Coefficient 1"].isDisplayable = true;
                    point["Conversion Coefficient 2"].isDisplayable = true;

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;

                    point["Control Data Type"].isDisplayable = true;
                    point["Control Function"].isDisplayable = true;
                    point["Control Register"].isDisplayable = true;

                    data.point = point;
                    data.point = this.applyAnalogOutputTypeOutputType(data);
                    return data.point;
                }
                // If MS 4 VAV, MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Coefficient 1"].isDisplayable = true;
                    point["Conversion Coefficient 2"].isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Analog": 0,
                        "Pulse Width": 1,
                        "Pulsed": 2
                    };

                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;

                    point["Open Channel"].Max = 7;
                    point["Open Channel"].Min = 0;

                    point["Close Channel"].Max = 7;
                    point["Close Channel"].Min = 0;


                    data.point = point;
                    data.point = this.applyAnalogOutputTypeOutputType(data);
                    return data.point;
                }
                // Invalid RMU type
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If BACnet Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["BACnet Interface Device"]["enum"]) {

                // If not Remote Unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined.  If BACnet RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) {

                    point.Instance.isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Ingersol Rand Intellysis Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Ingersol Rand Intellysis Device"]["enum"]) {

                // If not Remote Unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined.  If Ingersol Rand Intellysis
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) {

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Coefficient 1"].isDisplayable = true;
                    point["Conversion Coefficient 2"].isDisplayable = true;

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;

                    point["Control Data Type"].isDisplayable = true;
                    point["Control Function"].isDisplayable = true;
                    point["Control Register"].isDisplayable = true;

                    data.point = point;
                    data.point = this.applyAnalogOutputTypeOutputType(data);
                    return data.point;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan Interface Device"]["enum"]) {

                // If not Remote Unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined. If MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Coefficient 1"].isDisplayable = true;
                    point["Conversion Coefficient 2"].isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Analog": 0,
                        "Pulse Width": 1,
                        "Pulsed": 2
                    };

                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;

                    point["Open Channel"].Max = 7;
                    point["Open Channel"].Min = 0;

                    point["Close Channel"].Max = 7;
                    point["Close Channel"].Min = 0;


                    data.point = point;
                    data.point = this.applyAnalogOutputTypeOutputType(data);
                    return data.point;
                }
                // Invalid RMU type
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If N2 Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["N2 Interface Device"]["enum"]) {

                // If no Remote Unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined. If N2
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"]) {

                    point.Instance.isDisplayable = true;
                }
                // Invalid RMU type
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Field Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Field Interface Device"]["enum"]) {

                // If no Remote Unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined. If IFC RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["IFC Remote Unit"]["enum"]) {

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Coefficient 1"].isDisplayable = true;
                    point["Conversion Coefficient 2"].isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Analog": 0,
                        "Pulse Width": 1,
                        "Pulsed": 2
                    };

                    point["Channel"].Max = 3;
                    point["Channel"].Min = 0;

                    point["Open Channel"].Max = 15;
                    point["Open Channel"].Min = 0;

                    point["Close Channel"].Max = 15;
                    point["Close Channel"].Min = 0;


                    data.point = point;
                    data.point = this.applyAnalogOutputTypeOutputType(data);
                    return data.point;
                }
                // Invalid RMU type
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Staefa Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Staefa Interface Device"]["enum"]) {

                // If no Remote Unit defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined. If Smart II RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Smart II Remote Unit"]["enum"]) {

                    obj.Utility.getPropertyObject("Sensor Point", point).isDisplayable = true;
                    point["Conversion Coefficient 1"].isDisplayable = true;
                    point["Conversion Coefficient 2"].isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Analog": 0,
                        "Pulse Width": 1,
                        "Pulsed": 2
                    };

                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;

                    point["Open Channel"].Max = 7;
                    point["Open Channel"].Min = 0;

                    point["Close Channel"].Max = 7;
                    point["Close Channel"].Min = 0;


                    data.point = point;
                    data.point = this.applyAnalogOutputTypeOutputType(data);
                    return data.point;
                }
                // Invalid RMU type
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // Invalid device type
            else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            }

            return point;
        },

        applyAnalogValueTypeDevModel: function(data) {
            var point = data.point;

            // If Unknown or Central Device
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"])) {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            } else {

                point._relPoint = 0; // Set reliability to 'No Fault'
            }

            point._cfgRequired = true;

            point.Instance.isDisplayable = false;
            obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = true;
            point["Demand Interval"].isDisplayable = true;
            point["Demand Enable"].isDisplayable = true;
            point["Fail Action"].isDisplayable = true;

            // If Uknown, Central Device, MicroScan 5 xTalk, MicroScan 5 UNV, SCADA Vio
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"])) {

                // If BACnet or N2 RMU
                if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                    obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = false;
                    point["Demand Interval"].isDisplayable = false;
                    point["Demand Enable"].isDisplayable = false;
                    point["Fail Action"].isDisplayable = false;
                }
                // If remote unit defined ***AND*** is not MS 4 VAV, MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"])) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan 4 UNV, MicroScan 4 xTalk, or MicroScan 4 Digital
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"])) {

                // If BACnet or N2 RMU
                if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                    obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = false;
                    point["Demand Interval"].isDisplayable = false;
                    point["Demand Enable"].isDisplayable = false;
                    point["Fail Action"].isDisplayable = false;
                }
                // If remote unit defined ***AND*** is not MS 4 VAV, MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"])) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If BACnet Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["BACnet Interface Device"]["enum"]) {

                // If BACnet RMU
                if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) {

                    point.Instance.isDisplayable = true;
                    obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = false;
                    point["Demand Interval"].isDisplayable = false;
                    point["Demand Enable"].isDisplayable = false;
                    point["Fail Action"].isDisplayable = false;
                }
                // For all other RMU's
                else if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Sierra Steam Meter Device, Siemens Power Meter Device, Ingersol Rand Intellysis Device
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Sierra Steam Meter Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Siemens Power Meter Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Ingersol Rand Intellysis Device"]["enum"])) {

                // If remote unit not defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan Interface Device"]["enum"]) {

                // If remote unit defined ***AND*** is not MS3 RT, MS 3 EEPROM, MS 3 Flash
                if ((obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"])) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If N2 Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["N2 Interface Device"]["enum"]) {

                // If N2 RMU
                if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"]) {

                    point.Instance.isDisplayable = true;
                    obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = false;
                    point["Demand Interval"].isDisplayable = false;
                    point["Demand Enable"].isDisplayable = false;
                    point["Fail Action"].isDisplayable = false;
                }
                // For all other RMU's
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Field Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Field Interface Device"]["enum"]) {

                // If remote unit not defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Armstrong SteamEye Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Armstrong SteamEye Device"]["enum"]) {

                // If remote unit not defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Staefa Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Staefa Interface Device"]["enum"]) {

                // If remote unit not defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // Invalid device
            else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            }

            return point;
        },

        applyBinaryValueTypeDevModel: function(data) {
            var point = data.point;

            // If Unknown or Central Device
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"])) {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            } else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"];
            }

            point._cfgRequired = true;

            point.Instance.isDisplayable = false;
            obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = true;
            point["Demand Interval"].isDisplayable = true;
            point["Demand Enable"].isDisplayable = true;
            point["Fail Action"].isDisplayable = true;

            // If Uknown, Central Device, MicroScan 5 xTalk, MicroScan 5 UNV, SCADA Vio
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"])) {

                // If BACnet or N2 RMU
                if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                    obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = false;
                    point["Demand Interval"].isDisplayable = false;
                    point["Demand Enable"].isDisplayable = false;
                    point["Fail Action"].isDisplayable = false;
                }
                // If remote unit defined ***AND*** is not MS 4 VAV, MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"])) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan 4 UNV, MicroScan 4 xTalk, or MicroScan 4 Digital
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"])) {

                // If BACnet or N2 RMU
                if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                    obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = false;
                    point["Demand Interval"].isDisplayable = false;
                    point["Demand Enable"].isDisplayable = false;
                    point["Fail Action"].isDisplayable = false;
                }
                // If remote unit defined ***AND*** is not MS 4 VAV, MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"])) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If BACnet Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["BACnet Interface Device"]["enum"]) {

                // If BACnet RMU
                if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) {

                    point.Instance.isDisplayable = true;
                    obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = false;
                    point["Demand Interval"].isDisplayable = false;
                    point["Demand Enable"].isDisplayable = false;
                    point["Fail Action"].isDisplayable = false;
                }
                // For all other RMU's
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Sierra Steam Meter Device, Siemens Power Meter Device, Ingersol Rand Intellysis Device
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Sierra Steam Meter Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Siemens Power Meter Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Ingersol Rand Intellysis Device"]["enum"])) {

                // If remote unit not defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan Interface Device"]["enum"]) {

                // If remote unit defined ***AND*** RMU is MS3 RT, MS3 EEPROM, or MS3 Flash
                if ((obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]) && (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"])) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If N2 Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["N2 Interface Device"]["enum"]) {

                // If N2 RMU
                if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"]) {

                    point.Instance.isDisplayable = true;
                    obj.Utility.getPropertyObject("Monitor Point", point).isDisplayable = false;
                    point["Demand Interval"].isDisplayable = false;
                    point["Demand Enable"].isDisplayable = false;
                    point["Fail Action"].isDisplayable = false;
                }
                // If RMU defined
                else if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Field Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Field Interface Device"]["enum"]) {

                // If remote unit not defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Armstrong SteamEye Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Armstrong SteamEye Device"]["enum"]) {

                // If remote unit not defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Staefa Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Staefa Interface Device"]["enum"]) {

                // If remote unit not defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // Invalid device
            else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            }
            return point;
        },

        applyBinaryInputTypeFeedbackPoint: function(data) {
            var point = data.point;

            // If feedback point is used
            if (data.propertyObject.PointInst !== 0) {

                point["Feedback Polarity"].isDisplayable = true;
                point["Alarm Value"].isDisplayable = false;
            } else {

                point["Feedback Polarity"].isDisplayable = false;
                point["Alarm Value"].isDisplayable = true;
            }
            return point;
        },

        applyBinaryInputTypeInputType: function(data) {
            var point = data.point;

            // If momentary input type
            // TODO fix hard coded enum value
            if (point["Input Type"].eValue === 1) {

                point["Momentary Delay"].isDisplayable = true;
            } else {

                point["Momentary Delay"].isDisplayable = false;
            }

            return point;
        },

        applyBinaryInputTypeDevModel: function(data) {
            var point = data.point;

            // If Unknown or Central Device
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"])) {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            } else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"];
            }

            point._cfgRequired = true;

            point.Instance.isDisplayable = false;
            point.Channel.isDisplayable = false;

            point["VAV Channel"].isDisplayable = false;
            point["VAV Channel"].ValueOptions = {
                "1 - Occupancy Override": 1,
                "2 - Occupancy Sensor": 2
            };

            point["Input Type"].isDisplayable = false;
            point["Momentary Delay"].isDisplayable = false;
            point["Poll Data Type"].isDisplayable = false;
            point["Poll Function"].isDisplayable = false;
            point["Poll Register"].isDisplayable = false;
            /*console.log(point._id);
             point["Latch Value"].isDisplayable = false;*/
            point["Supervised Input"].isDisplayable = false;

            // If Uknown, Central Device, MicroScan 5 xTalk, MicroScan 5 UNV, SCADA Vio
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"])) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 5 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // If SCADA Vio
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"]) {

                        point.Channel.isDisplayable = true;
                        point.Channel.Max = 9;
                        point.Channel.Min = 1;

                        point["Input Type"].isDisplayable = true;
                        point["Input Type"].ValueOptions = {
                            "Latch": 0,
                            "Momentary": 1,
                            "Pulse": 2
                        };

                        data.point = point;
                        point = this.applyBinaryInputTypeInputType(data); // Apply input type logic
                    }
                    // Must be MicroScan 5 UNV
                    else {

                        point.Channel.isDisplayable = true;
                        point.Channel.Max = 16;
                        point.Channel.Min = 1;

                        point["Input Type"].isDisplayable = true;
                        point["Input Type"].ValueOptions = {
                            "Latch": 0,
                            "Momentary": 1,
                            "Pulse": 2
                        };

                        data.point = point;
                        point = this.applyBinaryInputTypeInputType(data); // Apply input type logic
                    }
                }
                // RMU defined. If BACnet or N2,
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                }
                // If MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point.Channel.isDisplayable = true;
                    point.Channel.Max = 7;
                    point.Channel.Min = 0;

                    // point["Latch Value"].isDisplayable = true;
                    point["Supervised Input"].isDisplayable = true;
                }
                // If MS 4 VAV
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"]) {

                    point["VAV Channel"].isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan 4 UNV, MicroScan 4 xTalk, or MicroScan 4 Digital
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"])) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 4 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // If MicroScan 4 Digital
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"]) {

                        point.Channel.isDisplayable = true;
                        point.Channel.Max = 32;
                        point.Channel.Min = 1;

                        point["Input Type"].isDisplayable = true;
                        point["Input Type"].ValueOptions = {
                            "Latch": 0,
                            "Momentary": 1
                        };

                        data.point = point;
                        point = this.applyBinaryInputTypeInputType(data); // Apply input type logic
                    }
                    // Must be MicroScan 4 UNV
                    else {

                        point.Channel.isDisplayable = true;
                        point.Channel.Max = 16;
                        point.Channel.Min = 1;

                        point["Input Type"].isDisplayable = true;
                        point["Input Type"].ValueOptions = {
                            "Latch": 0,
                            "Momentary": 1
                        };

                        data.point = point;
                        point = this.applyBinaryInputTypeInputType(data); // Apply input type logic
                    }
                }
                // RMU defined. If BACnet or N2,
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                }
                // If MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point.Channel.isDisplayable = true;
                    point.Channel.Max = 7;
                    point.Channel.Min = 0;

                    //point["Latch Value"].isDisplayable = true;
                    point["Supervised Input"].isDisplayable = true;
                }
                // If MS 4 VAV
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"]) {

                    point["VAV Channel"].isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If BACnet Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["BACnet Interface Device"]["enum"]) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point.Channel.Value = 0; // Only one channel available (ch 0), do not show user the channel field

                    point["Supervised Input"].isDisplayable = true;
                }
                // RMU defined.  If BACnet
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) {

                    point.Instance.isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Sierra Steam Meter Device or Ingersol Rand Intellysis Device
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Sierra Steam Meter Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Ingersol Rand Intellysis Device"]["enum"])) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point.Channel.Value = 0; // Only one channel available (ch 0), do not show user the channel field
                }
                // If Sierra Steam Meter or Ingersol Rand Intellysis RMU
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"])) {

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan Interface Device"]["enum"]) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point.Channel.Value = 0; // Only one channel available (ch 0), do not show user the channel field
                }
                // RMU defined. If MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point.Channel.isDisplayable = true;
                    point.Channel.Max = 7;
                    point.Channel.Min = 0;

                    //point["Latch Value"].isDisplayable = true;
                    point["Supervised Input"].isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If N2 Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["N2 Interface Device"]["enum"]) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point.Channel.Value = 0; // Only one channel available (ch 0), do not show user the channel field
                }
                // RMU defined. If N2
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"]) {

                    point.Instance.isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Field Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Field Interface Device"]["enum"]) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point.Channel.Value = 0; // Only one channel available (ch 0), do not show user the channel field
                }
                // RMU defined. If IFC RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["IFC Remote Unit"]["enum"]) {

                    point.Channel.isDisplayable = true;
                    point.Channel.Max = 15;
                    point.Channel.Min = 0;

                    point["Supervised Input"].isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Armstrong SteamEye Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Armstrong SteamEye Device"]["enum"]) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point.Channel.Value = 0; // Only one channel available (ch 0), do not show user the channel field
                }
                // RMU defined. If ASE RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["ASE Remote Unit"]["enum"]) {

                    point.Channel.isDisplayable = true;
                    point.Channel.Max = 255;
                    point.Channel.Min = 0;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Staefa Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Staefa Interface Device"]["enum"]) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point.Channel.Value = 0; // Only one channel available (ch 0), do not show user the channel field
                }
                // RMU defined. If Smart II RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Smart II Remote Unit"]["enum"]) {

                    point.Channel.isDisplayable = true;
                    point.Channel.Max = 7;
                    point.Channel.Min = 0;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // Invalid device
            else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            }
            return point;
        },

        // TODO remove hard coded enum values
        applyBinaryOutputTypeFeedbackType: function(data) {
            var point = data.point;

            point["Close Channel"].isDisplayable = false;
            point["Open Channel"].isDisplayable = false;
            point["Close Polarity"].isDisplayable = false;
            point["Open Polarity"].isDisplayable = false;
            point["Feedback Channel"].isDisplayable = false;
            point["Feedback Polarity"].isDisplayable = false;
            obj.Utility.getPropertyObject("Feedback Point", point).isDisplayable = false;
            point["Verify Delay"].isDisplayable = false;

            // If a feedback point is defined
            if (obj.Utility.getPropertyObject("Feedback Point", point).Value !== 0) {

                // Since a feedback point is defined, we must force the feedback type to feedback point
                // (as opposed to feedback single/dual channel).  There is not a 'feedback type' parameter
                // downloaded to the field controllers. If the field controller sees a feedback point
                // feedback channels are ignored. So we force the UI to feedback point if one is used.
                // To use feedback channel the feedback point must first be removed.
                point["Feedback Type"].eValue = 3;
                point["Feedback Type"].Value = "Point";
                point["Verify Delay"].isDisplayable = true;
            }

            // If single channel feedback
            if (point["Feedback Type"].eValue === 1) {

                point["Feedback Channel"].isDisplayable = true;
                point["Feedback Polarity"].isDisplayable = true;
                point["Verify Delay"].isDisplayable = true;
            }
            // If dual channel feedback
            else if (point["Feedback Type"].eValue === 2) {

                point["Close Channel"].isDisplayable = true;
                point["Open Channel"].isDisplayable = true;

                point["Close Polarity"].isDisplayable = true;
                point["Open Polarity"].isDisplayable = true;
                point["Verify Delay"].isDisplayable = true;
            }
            // If data point feedback
            else if (point["Feedback Type"].eValue === 3) {

                obj.Utility.getPropertyObject("Feedback Point", point).isDisplayable = true;
                point["Feedback Polarity"].isDisplayable = true;
                point["Verify Delay"].isDisplayable = true;
            }

            return point;
        },

        applyBinaryOutputTypeOutputType: function(data) {
            var point = data.point;

            // If latch output type
            if (point["Output Type"].eValue === 0) {
                point["Channel"].isDisplayable = true;
                point["On Channel"].isDisplayable = false;
                point["Off Channel"].isDisplayable = false;
                point["Momentary Delay"].isDisplayable = false;
                // Momentary output
            } else {
                point["Channel"].isDisplayable = false;
                point["On Channel"].isDisplayable = true;
                point["Off Channel"].isDisplayable = true;
                point["Momentary Delay"].isDisplayable = true;
            }
            return point;
        },

        // TODO Coordinate with Rob to remove this routine
        applyBinaryOutputTypeFeedbackPoint: function(data) {},

        applyBinaryOutputTypeDevModel: function(data) {
            var point = data.point;

            // If Unknown or Central Device
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"])) {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            } else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"];
            }

            point._cfgRequired = true;

            point["Same State Test"].isDisplayable = false;

            point["VAV Channel"].isDisplayable = false;
            point["VAV Channel"].ValueOptions = {
                "3 - Lights": 3,
                "5 - Fan": 5,
                "6 - Digital Heat 1": 6,
                "7 - Digital Heat 2": 7,
                "8 - Digital Heat 3": 8
            };

            point["Supervised Input"].isDisplayable = false;
            point.Polarity.isDisplayable = false;
            point["Output Type"].isDisplayable = false;
            point.Channel.isDisplayable = false;
            point["On Channel"].isDisplayable = false;
            point["Off Channel"].isDisplayable = false;
            point["Momentary Delay"].isDisplayable = false;

            point["Feedback Type"].isDisplayable = true;
            point["Feedback Type"].ValueOptions = {
                "None": 0,
                "Single": 1,
                "Dual": 2,
                "Point": 3
            };

            point.Instance.isDisplayable = false;
            point["Poll Data Type"].isDisplayable = false;
            point["Poll Function"].isDisplayable = false;
            point["Poll Register"].isDisplayable = false;

            point["On Control Data Type"].isDisplayable = false;
            point["On Control Function"].isDisplayable = false;
            // point["On Control Register"].isDisplayable = false;
            point["On Control Value"].isDisplayable = false;

            point["Off Control Data Type"].isDisplayable = false;
            point["Off Control Function"].isDisplayable = false;
            point["Off Control Register"].isDisplayable = false;
            point["Off Control Value"].isDisplayable = false;

            // If Uknown, Central Device, MicroScan 5 xTalk, MicroScan 5 UNV, SCADA Vio
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"])) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 5 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // If SCADA Vio
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"]) {

                        point["Same State Test"].isDisplayable = true;
                        point.Polarity.isDisplayable = true;

                        point["Output Type"].isDisplayable = true;
                        point["Output Type"].ValueOptions = {
                            "Latch": 0,
                            "Momentary": 1
                        };

                        point.Channel.Max = 5;
                        point.Channel.Min = 1;

                        point["On Channel"].Max = 5;
                        point["On Channel"].Min = 1;

                        point["Off Channel"].Max = 5;
                        point["Off Channel"].Min = 1;

                        point["Feedback Channel"].Max = 9;
                        point["Feedback Channel"].Min = 1;

                        point["Open Channel"].Max = 9;
                        point["Open Channel"].Min = 1;

                        point["Close Channel"].Max = 9;
                        point["Close Channel"].Min = 1;

                        data.point = point;
                        point = this.applyBinaryOutputTypeOutputType(data); // Apply output type logic
                    }
                    // Must be MicroScan 5 UNV, unkown, or central
                    else {

                        point["Same State Test"].isDisplayable = true;
                        point.Polarity.isDisplayable = true;

                        point["Output Type"].isDisplayable = true;
                        point["Output Type"].ValueOptions = {
                            "Latch": 0,
                            "Momentary": 1
                        };

                        point.Channel.Max = 8;
                        point.Channel.Min = 1;

                        point["On Channel"].Max = 8;
                        point["On Channel"].Min = 1;

                        point["Off Channel"].Max = 8;
                        point["Off Channel"].Min = 1;

                        point["Feedback Channel"].Max = 16;
                        point["Feedback Channel"].Min = 1;

                        point["Open Channel"].Max = 16;
                        point["Open Channel"].Min = 1;

                        point["Close Channel"].Max = 16;
                        point["Close Channel"].Min = 1;

                        data.point = point;
                        point = this.applyBinaryOutputTypeOutputType(data); // Apply output type logic
                    }
                }
                // RMU defined.  If BACnet
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Point": 3,
                        "Remote": 4
                    };

                    point.Instance.isDisplayable = true;
                }
                // If N2
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"]) {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Single": 1,
                        "Point": 3
                    };

                    point["Feedback Channel"].Max = 255;
                    point["Feedback Channel"].Min = 0;

                    point.Instance.isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Point": 3
                    };

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;

                    point["On Control Data Type"].isDisplayable = true;
                    point["On Control Function"].isDisplayable = true;
                    point["On Control Register"].isDisplayable = true;
                    point["On Control Value"].isDisplayable = true;

                    point["Off Control Data Type"].isDisplayable = true;
                    point["Off Control Function"].isDisplayable = true;
                    point["Off Control Register"].isDisplayable = true;
                    point["Off Control Value"].isDisplayable = true;
                }
                // If MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point["Same State Test"].isDisplayable = true;
                    point.Polarity.isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Latch": 0,
                        "Momentary": 1
                    };

                    point.Channel.Max = 7;
                    point.Channel.Min = 0;

                    point["On Channel"].Max = 7;
                    point["On Channel"].Min = 0;

                    point["Off Channel"].Max = 7;
                    point["Off Channel"].Min = 0;

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Single": 1,
                        "Point": 3
                    };

                    point["Feedback Channel"].Max = 7;
                    point["Feedback Channel"].Min = 0;

                    data.point = point;
                    point = this.applyBinaryOutputTypeOutputType(data); // Apply output type logic
                }
                // If MS 4 VAV
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"]) {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0
                    };

                    point["VAV Channel"].isDisplayable = true;
                    point.Polarity.isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan 4 UNV, MicroScan 4 xTalk, or MicroScan 4 Digital
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"])) {

                // If no RMU
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 4 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // If MicroScan 4 Digital
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"]) {

                        point["Same State Test"].isDisplayable = true;
                        point.Polarity.isDisplayable = true;

                        point["Output Type"].isDisplayable = true;
                        point["Output Type"].ValueOptions = {
                            "Latch": 0,
                            "Momentary": 1
                        };

                        point.Channel.Max = 32;
                        point.Channel.Min = 1;

                        point["On Channel"].Max = 32;
                        point["On Channel"].Min = 1;

                        point["Off Channel"].Max = 32;
                        point["Off Channel"].Min = 1;

                        point["Feedback Channel"].Max = 32;
                        point["Feedback Channel"].Min = 1;

                        point["Open Channel"].Max = 32;
                        point["Open Channel"].Min = 1;

                        point["Close Channel"].Max = 32;
                        point["Close Channel"].Min = 1;

                        data.point = point;
                        point = this.applyBinaryOutputTypeOutputType(data); // Apply output type logic
                    }
                    // Must be MicroScan 4 UNV
                    else {

                        point["Same State Test"].isDisplayable = true;
                        point.Polarity.isDisplayable = true;

                        point["Output Type"].isDisplayable = true;
                        point["Output Type"].ValueOptions = {
                            "Latch": 0,
                            "Momentary": 1
                        };

                        point.Channel.Max = 8;
                        point.Channel.Min = 1;

                        point["On Channel"].Max = 8;
                        point["On Channel"].Min = 1;

                        point["Off Channel"].Max = 8;
                        point["Off Channel"].Min = 1;

                        point["Feedback Channel"].Max = 16;
                        point["Feedback Channel"].Min = 1;

                        point["Open Channel"].Max = 16;
                        point["Open Channel"].Min = 1;

                        point["Close Channel"].Max = 16;
                        point["Close Channel"].Min = 1;

                        data.point = point;
                        point = this.applyBinaryOutputTypeOutputType(data); // Apply output type logic
                    }
                }
                // RMU defined.  If BACnet
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Point": 3,
                        "Remote": 4
                    };

                    point.Instance.isDisplayable = true;
                }
                // If N2 RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"]) {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Single": 1,
                        "Point": 3
                    };

                    point["Feedback Channel"].Max = 255;
                    point["Feedback Channel"].Min = 0;

                    point.Instance.isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Point": 3
                    };

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;

                    point["On Control Data Type"].isDisplayable = true;
                    point["On Control Function"].isDisplayable = true;
                    point["On Control Register"].isDisplayable = true;
                    point["On Control Value"].isDisplayable = true;

                    point["Off Control Data Type"].isDisplayable = true;
                    point["Off Control Function"].isDisplayable = true;
                    point["Off Control Register"].isDisplayable = true;
                    point["Off Control Value"].isDisplayable = true;
                }
                // If MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point["Same State Test"].isDisplayable = true;
                    point.Polarity.isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Latch": 0,
                        "Momentary": 1
                    };

                    point.Channel.Max = 7;
                    point.Channel.Min = 0;

                    point["On Channel"].Max = 7;
                    point["On Channel"].Min = 0;

                    point["Off Channel"].Max = 7;
                    point["Off Channel"].Min = 0;

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Single": 1,
                        "Point": 3
                    };

                    point["Feedback Channel"].Max = 7;
                    point["Feedback Channel"].Min = 0;

                    data.point = point;
                    point = this.applyBinaryOutputTypeOutputType(data); // Apply output type logic
                }
                // If MS 4 VAV
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 4 VAV"]["enum"]) {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0
                    };

                    point["VAV Channel"].isDisplayable = true;
                    point.Polarity.isDisplayable = true;
                }
                // Invalid RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If BACnet Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["BACnet Interface Device"]["enum"]) {

                // If not a BACnet RMU, or no RMU defined
                if ((point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]) || (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0)) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // Valid RMU
                else {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Point": 3
                    };
                    point.Instance.isDisplayable = true;
                }
            }
            // If Ingersol Rand Intellysis Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Ingersol Rand Intellysis Device"]["enum"]) {

                // If not an Intersol Rand Intellysis RMU, or no RMU defined
                if ((point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]) || (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0)) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // Valid RMU
                else {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Point": 3
                    };

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;

                    point["On Control Data Type"].isDisplayable = true;
                    point["On Control Function"].isDisplayable = true;
                    point["On Control Register"].isDisplayable = true;
                    point["On Control Value"].isDisplayable = true;

                    point["Off Control Data Type"].isDisplayable = true;
                    point["Off Control Function"].isDisplayable = true;
                    point["Off Control Register"].isDisplayable = true;
                    point["Off Control Value"].isDisplayable = true;
                }
            }
            // If MicroScan Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan Interface Device"]["enum"]) {

                // If not an MS3 RT, MS3 EEPROM, MS3 Flash, or no RMU defined
                if (((point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]) || (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]) || (point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"])) || (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0)) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // Valid RMU
                else {

                    point["Same State Test"].isDisplayable = true;
                    point.Polarity.isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Latch": 0,
                        "Momentary": 1
                    };

                    point.Channel.Max = 7;
                    point.Channel.Min = 0;

                    point["On Channel"].Max = 7;
                    point["On Channel"].Min = 0;

                    point["Off Channel"].Max = 7;
                    point["Off Channel"].Min = 0;

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Single": 1,
                        "Point": 3
                    };

                    point["Feedback Channel"].Max = 7;
                    point["Feedback Channel"].Min = 0;

                    data.point = point;
                    point = this.applyBinaryOutputTypeOutputType(data); // Apply output type logic
                }
            }
            // If N2 Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["N2 Interface Device"]["enum"]) {

                // If not an N2 RMU or no RMU defined
                if ((point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]) || (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0)) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // Valid RMU
                else {

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Single": 1,
                        "Point": 3
                    };

                    point["Feedback Channel"].Max = 255;
                    point["Feedback Channel"].Min = 0;

                    point.Instance.isDisplayable = true;
                }
            }
            // If Field Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Field Interface Device"]["enum"]) {

                // If not an IFC RMU or no RMU defined
                if ((point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["IFC Remote Unit"]) || (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0)) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // Valid RMU
                else {

                    point["Same State Test"].isDisplayable = true;
                    point["Supervised Input"].isDisplayable = true;
                    point.Polarity.isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Latch": 0,
                        "Momentary": 1
                    };

                    point.Channel.Max = 15;
                    point.Channel.Min = 0;

                    point["On Channel"].Max = 15;
                    point["On Channel"].Min = 0;

                    point["Off Channel"].Max = 15;
                    point["Off Channel"].Min = 0;

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Single": 1,
                        "Point": 3
                    };

                    point["Feedback Channel"].Max = 15;
                    point["Feedback Channel"].Min = 0;

                    data.point = point;
                    point = this.applyBinaryOutputTypeOutputType(data); // Apply output type logic
                }
            }
            // If Staefa Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Staefa Interface Device"]["enum"]) {

                // If not a Smart II Remote Unit, or no RMU defined
                if ((point._rmuModel !== enumsTemplatesJson.Enums["Remote Unit Model Types"]["Smart II Remote Unit"]) || (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0)) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // Valid RMU
                else {

                    point["Same State Test"].isDisplayable = true;
                    point.Polarity.isDisplayable = true;

                    point["Output Type"].isDisplayable = true;
                    point["Output Type"].ValueOptions = {
                        "Latch": 0,
                        "Momentary": 1
                    };

                    point.Channel.Max = 7;
                    point.Channel.Min = 0;

                    point["On Channel"].Max = 7;
                    point["On Channel"].Min = 0;

                    point["Off Channel"].Max = 7;
                    point["Off Channel"].Min = 0;

                    point["Feedback Type"].ValueOptions = {
                        "None": 0,
                        "Single": 1,
                        "Point": 3
                    };

                    point["Feedback Channel"].Max = 7;
                    point["Feedback Channel"].Min = 0;

                    data.point = point;
                    point = this.applyBinaryOutputTypeOutputType(data); // Apply output type logic
                }
            }
            // Invalid Device
            else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            }
            data.point = point;
            data.point = this.applyBinaryOutputTypeFeedbackType(data); // Apply output type logic

            return data.point;
        },

        applyMultiStateValueTypeDevModel: function(data) {
            var point = data.point;

            // If Unknown or Central Device
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"])) {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            } else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"];
            }

            point._cfgRequired = true;

            point.Instance.isDisplayable = false;
            point["Input Type"].isDisplayable = false;
            point["Control Data Type"].isDisplayable = false;
            point["Control Function"].isDisplayable = false;
            point["Control Register"].isDisplayable = false;
            point["Poll Function"].isDisplayable = false;
            point["Poll Register"].isDisplayable = false;
            point["Poll Data Type"].isDisplayable = false;

            // If Uknown, Central Device, MicroScan 5 xTalk, MicroScan 5 UNV, SCADA Vio
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"])) {

                // If BACnet
                if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) {

                    point.Instance.isDisplayable = true;
                    point["Input Type"].isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Control Data Type"].isDisplayable = true;
                    point["Control Function"].isDisplayable = true;
                    point["Control Register"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                    point["Poll Data Type"].isDisplayable = true;
                }
                // For all other RMU's
                else if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan 4 UNV, MicroScan 4 xTalk, or MicroScan 4 Digital
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"])) {

                // If BACnet RMU
                if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) {

                    point.Instance.isDisplayable = true;
                    point["Input Type"].isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Control Data Type"].isDisplayable = true;
                    point["Control Function"].isDisplayable = true;
                    point["Control Register"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                    point["Poll Data Type"].isDisplayable = true;
                }
                // For all other RMU's
                else if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Staefa Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Staefa Interface Device"]["enum"]) {

                // If Smart II RMU
                if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Smart II Remote Unit"]["enum"]) {

                    point.Instance.isDisplayable = true;
                }
                // For all other RMU's
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst !== 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }

            // Invalid Device
            else {

                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            }
            return point;
        },

        applyAccumulatorTypeDevModel: function(data) {
            var point = data.point;

            // If Unkonwn or Central Device type
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"])) {
                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Device Model Type"]["enum"];
            } else
                point._relPoint = enumsTemplatesJson.Enums.Reliabilities["No Fault"]["enum"];

            point._cfgRequired = true;
            point.Instance.isDisplayable = false;
            point.Channel.isDisplayable = false;
            point["Fast Pulse"].isDisplayable = false;
            point["Poll Data Type"].isDisplayable = false;
            point["Poll Function"].isDisplayable = false;
            point["Poll Register"].isDisplayable = false;
            point["Rate Period"].isDisplayable = false;
            point["Pulse Weight"].isDisplayable = false;

            // If Uknown, Central Device, MicroScan 5 xTalk, MicroScan 5 UNV, SCADA Vio
            if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"].Unknown["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Central Device"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"])) {

                // If no RMU defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 5 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 5 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // If SCADA Vio
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["SCADA Vio"]["enum"]) {

                        point["Channel"].isDisplayable = true;
                        point["Channel"].Max = 9;
                        point["Channel"].Min = 6;
                        point["Fast Pulse"].isDisplayable = true;
                        point["Rate Period"].isDisplayable = true;
                        point["Pulse Weight"].isDisplayable = true;
                    }
                    // Must be MS5-UNV, Unknown, or Central
                    else {

                        point["Channel"].isDisplayable = true;
                        point["Channel"].Max = 16;
                        point["Channel"].Min = 1;
                        point["Fast Pulse"].isDisplayable = true;
                        point["Rate Period"].isDisplayable = true;
                        point["Pulse Weight"].isDisplayable = true;
                    }
                }
                // RMU defined. If BACnet or N2,
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                    point["Pulse Weight"].isDisplayable = true;
                }
                // If MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point["Channel"].isDisplayable = true;
                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;
                    point["Pulse Weight"].isDisplayable = true;
                }
                // For all other RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan 4 UNV, MicroScan 4 xTalk, or MicroScan 4 Digital
            else if ((point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 UNV"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) || (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"])) {

                // If no RMU defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    // If MicroScan 4 xTalk
                    if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 xTalk"]["enum"]) {

                        point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                    }
                    // If MicroScan 4 Digital
                    else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan 4 Digital"]["enum"]) {

                        point["Channel"].isDisplayable = true;
                        point["Channel"].Max = 32;
                        point["Channel"].Min = 1;
                        point["Rate Period"].isDisplayable = true;
                        point["Pulse Weight"].isDisplayable = true;
                    }
                    // Must be MS4-UNV, Unknown, or Central
                    else {

                        point["Channel"].isDisplayable = true;
                        point["Channel"].Max = 16;
                        point["Channel"].Min = 1;
                        point["Rate Period"].isDisplayable = true;
                        point["Pulse Weight"].isDisplayable = true;
                    }
                }
                // RMU defined. If BACnet or N2,
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["BACnet"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"])) {

                    point.Instance.isDisplayable = true;
                }
                // If Liebert, Sierra Steam Meter, Siemens Power Meter, Ingersol Rand Intellysis, PowerLogics 3000, Generic Modbus, PowerTraks 9000, Programmable Modbus
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Liebert"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Siemens Power Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Ingersol Rand Intellysis"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerLogic 3000 Meter"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Generic Modbus"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["PowerTraks 9000"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Programmable Modbus"]["enum"])) {

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                    point["Pulse Weight"].isDisplayable = true;
                }
                // If MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point["Channel"].isDisplayable = true;
                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;
                    point["Pulse Weight"].isDisplayable = true;
                }
                // For all other RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Sierra Steam Meter Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Sierra Steam Meter Device"]["enum"]) {

                // If no RMU defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined. If Sierra Steam Meter
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Sierra Steam Meter"]["enum"]) {

                    point["Poll Data Type"].isDisplayable = true;
                    point["Poll Function"].isDisplayable = true;
                    point["Poll Register"].isDisplayable = true;
                    point["Pulse Weight"].isDisplayable = true;
                }
                // For all other RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If MicroScan Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["MicroScan Interface Device"]["enum"]) {

                // If no RMU defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined. If MS3 RT, MS 3 EEPROM, MS 3 Flash
                else if ((point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS3 RT"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 EEPROM"]["enum"]) || (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["MS 3 Flash"]["enum"])) {

                    point["Channel"].isDisplayable = true;
                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;
                    point["Pulse Weight"].isDisplayable = true;
                }
                // For all other RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If N2 Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["N2 Interface Device"]["enum"]) {

                // If no RMU defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined. If N2
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["N2 Device"]["enum"]) {

                    point.Instance.isDisplayable = true;
                }
                // For all other RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Field Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Field Interface Device"]["enum"]) {

                // If no RMU defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined. If IFC RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["IFC Remote Unit"]["enum"]) {

                    point["Channel"].isDisplayable = true;
                    point["Channel"].Max = 15;
                    point["Channel"].Min = 0;
                    point["Pulse Weight"].isDisplayable = true;
                }
                // For all other RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            // If Staefa Interface Device
            else if (point._devModel === enumsTemplatesJson.Enums["Device Model Types"]["Staefa Interface Device"]["enum"]) {

                // If no RMU defined
                if (obj.Utility.getPropertyObject("Remote Unit Point", point).PointInst === 0) {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
                // RMU defined. If Smart II RMU
                else if (point._rmuModel === enumsTemplatesJson.Enums["Remote Unit Model Types"]["Smart II Remote Unit"]["enum"]) {

                    point["Channel"].isDisplayable = true;
                    point["Channel"].Max = 7;
                    point["Channel"].Min = 0;
                    point["Pulse Weight"].isDisplayable = true;
                }
                // For all other RMU
                else {

                    point._relPoint = enumsTemplatesJson.Enums.Reliabilities["Invalid Remote Unit Model Type"]["enum"];
                }
            }
            return data.point;
        }
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
        }
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

if (typeof window == 'undefined') {
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
        Applications: Config.Applications,
        Templates: Config.Templates,
        Utility: Config.Utility
        //Templates: enumsTemplatesJson.Templates
    };
}
