let bcrypt = require('bcrypt-nodejs');
let Config = require('../public/js/lib/config');
let Enums = Config.Enums;

let Utils = {
    // buildNameSegmentQuery: function(segment, name) {
    //   let beginStr, nameStr;
    //   beginStr = '';
    //   nameStr = '';

    //   if (req.body[searchTypeString] == 'begin') {
    //   beginStr = '^';
    //   endStr = '';
    //   } else if (req.body[searchTypeString] == 'contain') {
    //   beginStr = '.*';
    //   endStr = '.*';
    //   } else if (req.body[searchTypeString] == 'end') {
    //   beginStr = '';
    //   endStr = '$';
    //   }
    //   if (req.body[segment].value !== null && req.body[segment].value !== undefined) {
    //   nameStr = req.body[segment].value;
    //   } else {
    //   nameStr = req.body[segment];
    //   }

    //   return {
    //   '$regex': '(?i)' + beginStr + name1str + endStr
    //   };
    // },
    checkDynamicProperties: function (obj) {
        if (obj._cfgRequired !== undefined ||
            obj.Value !== undefined ||
            obj['Value.Value'] !== undefined ||
            obj['Value.ValueOptions'] !== undefined ||
            obj['Reliability.Value'] !== undefined ||
            (obj.Reliability !== undefined && obj.Reliability.Value !== undefined) ||
            obj['Alarm State.Value'] !== undefined ||
            (obj['Alarm State'] !== undefined && obj['Alarm State'].Value !== undefined) ||
            obj['Status Flags.Value'] !== undefined ||
            (obj['Status Flags'] !== undefined && obj['Status Flags'].Value !== undefined) ||
            obj['Alarms Off.Value'] !== undefined ||
            (obj['Alarms Off'] !== undefined && obj['Alarms Off'].Value !== undefined) ||
            obj['COV Enable.Value'] !== undefined ||
            (obj['COV Enable'] !== undefined && obj['COV Enable'].Value !== undefined) ||
            obj['Control Pending.Value'] !== undefined ||
            (obj['Control Pending'] !== undefined && obj['Control Pending'].Value !== undefined) ||
            obj['Quality Code Enable.Value'] !== undefined ||
            (obj['Quality Code Enable'] !== undefined && obj['Quality Code Enable'].Value !== undefined)) {
            return true;
        }
        return false;
    },
    CONSTANTS: function (constant) {
        constant = constant.toUpperCase();
        let constants = {
            'READ': 1,
            'CONTROL': 2,
            'ACKNOWLEDGE': 4,
            'WRITE': 8,
            'POINTSCOLLECTION': 'points',
            'USERSCOLLECTION': 'Users',
            'ALARMSCOLLECTION': 'Alarms',
            'CALENDARCOLLECTION': 'Holiday',
            'SYSTEMINFOPROPERTIES': 'SystemInfo',
            'SCHEDULESCOLLECTION': 'Schedules',
            'HISTORYCOLLECTION': 'historydata',
            'USERGROUPSCOLLECTION': 'User Groups',
            'ACTIVITYLOGCOLLECTION': 'Activity Logs',
            'UPIS': 'upis'
        };

        constants.UPISCOLLECTIONS = [constants.ACTIVITYLOGCOLLECTION, constants.ALARMSCOLLECTION, constants.HISTORYCOLLECTION, constants.SCHEDULESCOLLECTION];

        return constants[constant];
    },
    converters: {
        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        isBool: function (n) {
            if (this.isNumber(n)) {
                return false;
            }

            return (n.toLowerCase() === 'true') ? true : (n.toLowerCase() === 'false') ? true : false;
        },

        convertBool: function (n) {
            return (this.isBool(n)) ? (n.toLowerCase() === 'true') : n;
        },

        convertNumber: function (n) {
            return (this.isNumber(n)) ? parseFloat(n) : n;
        },

        convertType: function (n, type) {
            switch (type) {
                case 'String':
                    return n.toString();
                case 'Unsigned':
                case 'UniquePID':
                case 'BitString':
                    return this.convertNumber(n);
                default:
                    return this.convertBool(this.convertNumber(n));
            }
        }
    },
    getDBProperty: function (property) {
        if (Enums.Properties[property].hasOwnProperty('intLink')) {
            return Enums.Properties[property].intLink;
        }
        return property;
    },
    getHumanProperty: function (property) {
        if (Enums['Internal Properties'] && Enums['Internal Properties'].hasOwnProperty(property)) {
            for (let prop in Enums.Properties) {
                if (Enums.Properties[prop].hasOwnProperty('intLink') && Enums.Properties[prop].intLink === property) {
                    return prop;
                }
            }
        } else {
            return property;
        }
    },
    getHumanPropertyObj: function (property, value) {
        if (Enums['Internal Properties'] && Enums['Internal Properties'].hasOwnProperty(property)) {
            for (let prop in Enums.Properties) {
                if (Enums.Properties[prop].hasOwnProperty('intLink') && Enums.Properties[prop].intLink === property) {
                    let obj = {};
                    let enumSet = Enums[Enums.Properties[prop].enumsSet];
                    if (Enums.Properties[prop].valueType === 'Enum') {
                        obj = {
                            Value: 'Invalid',
                            eValue: value,
                            ValueType: Enums['Value Types'].Enum.enum
                        };
                        for (let prop2 in enumSet) {
                            if (enumSet[prop2].enum === value) {
                                obj.Value = prop2;
                            }
                        }
                    } else {
                        obj = {
                            Value: value,
                            ValueType: Enums['Value Types'][Enums.Properties[prop].valueType].enum
                        };
                    }
                    return obj;
                }
            }
        } else {
            return value;
        }
    },
    // when data is returned from the db, check internal properties for enum types and return a string
    encrypt: function (pass) {
        let salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(pass, salt);
    },
    FileLocationsForControllers: function (file) {
        file = file.toLowerCase();

        let locations = {

            underscore: '../public/js/lib/underscore.js',
            config: '../public/js/lib/config.js',
            filters: '../lib/filters',
            infoscanstore: '../lib/infoScanStore'

        };

        return locations[file];
    },
    getRegex: function (str, options) {
        let regex = '';
        let len = str.length;

        options = options || {};

        if (str.charAt(0) === '\'' && str.charAt(len - 1) === '\'') {
            regex = '^' + str.substring(1, len - 1) + '$';
        } else {
            if (options.matchBeginning) {
                regex = '^';
            }
            regex += Utils.convertRegexString(str);
        }

        return new RegExp(regex);
    },
    convertRegexString: function (string) {
        return string.split('').map(function (char) {
            return Utils.convertRegexChar(char);
        }).join('');
    },
    convertRegexChar: function (char) {
        let characters = ['+', '(', ')', '[', ']'];
        if (!!~characters.indexOf(char)) {
            return '\\' + char;
        } else if (char === '*') {
            return '.*';
        }
        return char;
    },
    sendResponse: function (res, data) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        return res.json(data);
    },
    setChannelOptions: function (point) {
        let pointTypes = ['Analog Input', 'Analog Output', 'Binary Input', 'Binary Output', 'Accumulator'];
        let properties = ['Channel', 'Close Channel', 'Feedback Channel', 'Open Channel', 'On Channel', 'Off Channel'];

        if (!!~pointTypes.indexOf(point['Point Type'].Value)) {
            properties.forEach(function (prop) {
                if (point.hasOwnProperty(prop) && !point[prop].hasOwnProperty('ValueOptions')) {
                    point[prop].ValueOptions = {
                        '1': 1
                    };
                }
                if (point.hasOwnProperty(prop) && !point[prop].hasOwnProperty('eValue')) {
                    point[prop].eValue = 1;
                }
            });
        }
    },
    setupNonFieldPoints: function (point) {
        if (Config.Utility.getPropertyObject('Device Point', point) === null) {
            point._cfgRequired = false;
            point._devModel = 0;
        }
    },
    updateNetworkAndAddress: function (point) {
        let propertyNetwork = point['Uplink Port'].Value + ' Network';
        let propertyAddress = point['Uplink Port'].Value + ' Address';

        point['Network Segment'].Value = point[propertyNetwork].Value;
        point['Device Address'].Value = point[propertyAddress].Value.toString();
    }
};

module.exports = Utils;
