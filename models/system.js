const async = require('async');
const ObjectId = require('mongodb').ObjectID;

const Common = require('./common');
const Config = require('../public/js/lib/config');
const ActivityLog = require('./activitylog');
const Alarm = require('./alarm');
const AlarmDefs = require('./alarmdefs');
const Point = require('./point');

const activityLog = new ActivityLog();
const alarm = new Alarm();
const alarmDefs = new AlarmDefs();

const System = class System extends Common {
    constructor() {
        super('SystemInfo');
    }

    getSeason(data, cb) {
        let criteria = {
            query: {
                Name: 'Preferences'
            },
            fields: {
                _id: 0,
                'Current Season': 1
            }
        };

        this.getOne(criteria, cb);
    }

    updateSeason(data, cb) {
        let logData = {
            user: data.user,
            timestamp: Date.now()
        };
        let season = data['Current Season'];
        let criteria = {
            query: {
                Name: 'Preferences'
            },
            updateObj: {
                $set: {
                    'Current Season': season
                }
            },
            fields: {
                _id: 0,
                'Current Season': 1
            }
        };

        this.updateOne(criteria, (err) => {
            logData.activity = 'Season Change';
            logData.log = 'Season changed to ' + season + '.';
            activityLog.create(logData, (err) => {
                return cb(null, 'success');
            });
        });
    }

    getSystemInfoByName(name, cb) {
        let criteria = {
            query: {
                Name: name
            }
        };

        this.getOne(criteria, cb);
    }
    getCounts(type, cb) {
        let query = {};
        let criteria = {};

        if (!!Config.Enums['Alarm Classes'][type]) {
            query = {
                almClass: Config.Enums['Alarm Classes'][type].enum
            };
        }

        criteria.query = query;
        alarm.count(criteria, cb);
    }
    updateControlPriorities(data, cb) {
        let searchCriteria = {
            'Name': 'Control Priorities'
        };

        let entries = (data.Entries) ? data.Entries : [];

        if (entries.length < 0) {
            return cb('Please send array for entries');
        }

        entries.forEach((entry) => {
            entry['Priority Level'] = parseInt(entry['Priority Level'], 10);
        });

        let updateCriteria = {
            $set: {
                Entries: entries
            }
        };

        let criteria = {
            query: searchCriteria,
            updateObj: updateCriteria
        };

        this.updateOne(criteria, (err, result) => {
            let logData = {
                user: data.user,
                timestamp: Date.now(),
                activity: 'Control Priority Labels Edit',
                log: 'Control priorities edited.'
            };
            activityLog.create(logData, () => {});
            return cb(err, result);
        });
    }
    getQualityCodes(data, cb) {
        let criteria = {
            query: {
                Name: {
                    $in: ['Quality Codes', 'Preferences']
                }
            }
        };

        this.getAll(criteria, (err, result) => {
            if (err) {
                return cb(err);
            }

            let returnObj = {
                Entries: [],
                'Quality Code Enable': {}
            };

            for (let i = 0; i < result.length; i++) {
                if (result[i].Name === 'Preferences') {
                    returnObj['Quality Code Enable'] = {
                        Override: result[i]['Quality Code Default Mask'] & Config.Enums['Quality Code Enable Bits'].Override.enum,
                        'COV Enable': result[i]['Quality Code Default Mask'] & Config.Enums['Quality Code Enable Bits']['COV Enable'].enum,
                        'Alarms Off': result[i]['Quality Code Default Mask'] & Config.Enums['Quality Code Enable Bits']['Alarms Off'].enum,
                        'Command Pending': result[i]['Quality Code Default Mask'] & Config.Enums['Quality Code Enable Bits']['Command Pending'].enum
                    };
                } else if (result[i].Name === 'Quality Codes') {
                    returnObj.Entries = result[i].Entries;
                }
            }

            return cb(null, returnObj);
        });
    }
    updateQualityCodes(data, cb) {
        let codesSearch = {
            'Name': 'Quality Codes'
        };

        let maskSearch = {
            'Name': 'Preferences'
        };

        let entries = (data.Entries) ? data.Entries : [];
        let codesUpdate = {
            $set: {
                Entries: entries
            }
        };

        let qualityMask = data['Quality Code Enable'];

        let maskUpdate = 0;

        maskUpdate = (qualityMask.Override * 1 !== 0) ? maskUpdate | Config.Enums['Quality Code Enable Bits'].Override.enum : maskUpdate;
        maskUpdate = (qualityMask['COV Enable'] * 1 !== 0) ? maskUpdate | Config.Enums['Quality Code Enable Bits']['COV Enable'].enum : maskUpdate;
        maskUpdate = (qualityMask['Alarms Off'] * 1 !== 0) ? maskUpdate | Config.Enums['Quality Code Enable Bits']['Alarms Off'].enum : maskUpdate;
        maskUpdate = (qualityMask['Command Pending'] * 1 !== 0) ? maskUpdate | Config.Enums['Quality Code Enable Bits']['Command Pending'].enum : maskUpdate;

        maskUpdate = (maskUpdate === 15) ? 255 : maskUpdate;

        let prefUpdate = {
            $set: {
                'Quality Code Default Mask': maskUpdate
            }
        };

        let criteria = {
            query: codesSearch,
            updateObj: codesUpdate
        };

        this.updateOne(criteria, (err, data) => {
            if (err) {
                return cb(err.message);
            }

            criteria = {
                query: maskSearch,
                updateObj: prefUpdate
            };
            this.updateOne(criteria, (err, result) => {
                let logData = {
                    user: data.user,
                    timestamp: Date.now(),
                    activity: 'Quality Code Edit',
                    log: 'Quality Codes edited.'
                };
                activityLog.create(logData, () => {});
                return cb(err, result);
            });
        });
    }
    updateControllers(data, cb) {
        let ID = 'Controller ID';
        let searchCriteria = {
            'Name': 'Controllers'
        };

        let entries = (data.Entries) ? data.Entries : [];
        let row;
        let c;

        for (c = 0; c < entries.length; c++) {
            row = entries[c];
            row[ID] = parseInt(row[ID], 10);
            row.isUser = (row.isUser === 'true');
        }

        if (entries.length < 0) {
            return cb('Please send array for entries');
        }

        let updateCriteria = {
            $set: {
                Entries: entries
            }
        };

        let criteria = {
            query: searchCriteria,
            updateObj: updateCriteria
        };

        this.updateOne(criteria, (err, result) => {
            let logData = {
                user: data.user,
                timestamp: Date.now(),
                activity: 'Controllers Edit',
                log: 'Controllers edited.'
            };
            activityLog.create(logData, () => {});
            return cb(err, result);
        });
    }
    updateNetworks(point, networks, callback) {
        async.eachSeries(networks, (network, acb) => {
            let criteria = {
                query: {},
                updateObj: {},
                options: {
                    multi: true
                }
            };
            let updates = [{
                query: {
                    'Point Type.Value': 'Device',
                    'Ethernet Network.Value': network['IP Network Segment']
                },
                updateObj: {
                    $set: {
                        'Ethernet IP Port.Value': network['IP Port']
                    }
                }
            }, {
                query: {
                    'Point Type.Value': 'Device',
                    'Downlink Network.Value': network['IP Network Segment']
                },
                updateObj: {
                    $set: {
                        'Downlink IP Port.Value': network['IP Port']
                    }
                }
            }, {
                query: {
                    'Point Type.Value': 'Remote Unit',
                    'Model Type.Value': 'BACnet',
                    'Network Segment.Value': network['IP Network Segment'],
                    $or: [{
                        'Gateway.isDisplayable': false
                    }, {
                        'Gateway.Value': false
                    }]
                },
                updateObj: {
                    $set: {
                        'Ethernet IP Port.Value': network['IP Port']
                    }
                }
            }];
            async.eachSeries(updates, (update, acb2) => {
                criteria.query = update.query;
                criteria.updateObj = update.updateObj;
                point.update(criteria, acb2);
            }, acb);
        }, callback);
    }
    updateTelemetry(data, cb) {
        const point = new Point();
        let ipSegment = parseInt(data['IP Network Segment'], 10);
        let ipPort = parseInt(data['IP Port'], 10);
        let netConfig = data['Network Configuration'];

        for (let n = 0; n < netConfig.length; n++) {
            netConfig[n]['IP Network Segment'] = parseInt(netConfig[n]['IP Network Segment'], 10);
            netConfig[n]['IP Port'] = parseInt(netConfig[n]['IP Port'], 10);
            netConfig[n].isDefault = (netConfig[n].isDefault === 'true');
        }

        let searchCriteria = {
            'Name': 'Preferences'
        };

        let updateCriteria = {
            $set: {
                'IP Network Segment': ipSegment,
                'APDU Timeout': parseInt(data['APDU Timeout'], 10),
                'APDU Retries': parseInt(data['APDU Retries'], 10),
                'Public IP': data['Public IP'],
                'IP Port': ipPort,
                'Time Zone': parseInt(data['Time Zone'], 10),
                'Network Configuration': netConfig
            }
        };

        let criteria = {
            query: searchCriteria,
            updateObj: updateCriteria
        };
        this.getOne({
            query: {
                Name: 'Preferences'
            }
        }, (err, _data) => {
            let centralUpi = _data['Central Device UPI'];
            point.updateOne({
                query: {
                    _id: centralUpi
                },
                updateObj: {
                    $set: {
                        'Ethernet IP Port.Value': ipPort
                    }
                }
            }, (err) => {
                this.updateOne(criteria, (err) => {
                    if (err) {
                        return cb(err.message);
                    }
                    this.updateNetworks(point, netConfig, (err, result) => {
                        let logData = {
                            user: data.user,
                            timestamp: Date.now(),
                            activity: 'Telemetry Settings Edit',
                            log: 'Telemetry Settings edited.'
                        };
                        activityLog.create(logData, () => {});
                        return cb(err, result);
                    });
                });
            });
        });
    }
    getStatus(data, cb) {
        let ackStatus = false;

        let criteria = {
            query: {
                ackStatus: 1
            },
            fields: {
                _id: 1
            }
        };
        alarm.getOne(criteria, (err, alarm) => {
            if (err) {
                return cb(err);
            }
            ackStatus = (!!alarm) ? true : false;
            return cb(null, {
                ackStatus: ackStatus,
                serverStatus: true
            });
        });
    }
    getCustomColors(data, cb) {
        let searchCriteria = {
            'Name': 'Custom Colors'
        };
        let criteria = {
            query: searchCriteria
        };
        this.getOne(criteria, (err, data) => {
            if (err) {
                return cb(err.message);
            }

            let entries = data['HTML Colors'];
            return cb(null, entries);
        });
    }
    updateCustomColors(data, cb) {
        let codesSearch = {
            'Name': 'Custom Colors'
        };

        let colorsUpdate = {
            $set: {
                'HTML Colors': data.colorsArray
            }
        };

        let criteria = {
            query: codesSearch,
            updateObj: colorsUpdate
        };

        this.updateOne(criteria, cb);
    }
    getAlarmTemplates(data, cb) {
        let searchCriteria = {};
        let criteria = {
            query: searchCriteria
        };
        this.get(criteria, (err, data) => {
            if (err) {
                return cb(err.message);
            }

            let entries = data;
            return cb(null, entries);
        });
    }
    updateAlarmTemplate(data, cb) {
        let criteria;
        let logData = {
            user: data.user,
            timestamp: Date.now()
        };

        if (!!data.newObject) {
            let alarmTemplateNew = {
                '_id': new ObjectId(),
                'isSystemMessage': false,
                'msgType': parseInt(data.newObject.msgType, 10),
                'msgCat': parseInt(data.newObject.msgCat, 10),
                'msgTextColor': data.newObject.msgTextColor,
                'msgBackColor': data.newObject.msgBackColor,
                'msgName': data.newObject.msgName,
                'msgFormat': data.newObject.msgFormat
            };

            criteria = {
                saveObj: alarmTemplateNew
            };

            alarmDefs.save(criteria, (err) => {
                logData.activity = 'Alarm Message Edit';
                logData.log = 'Alarm Message with text "' + data.updatedObject.msgFormat + '" updated.';
                activityLog.create(logData, () => {});
            });
        }
    }
    deleteAlarmTemplate(data, cb) {
        const point = new Point();
        let logData = {
            user: data.user,
            timestamp: Date.now()
        };
        let searchCriteria = {
            '_id': ObjectId(data.deleteObject._id)
        };
        let criteria = {
            query: searchCriteria
        };

        let fixPoints = (id, cb) => {
            let findAlarmDef = (type, alarms) => {
                for (let i = 0; i < alarms.length; i++) {
                    if (!!alarms[i].isSystemMessage && type === alarms[i].msgType) {
                        console.log(typeof alarms[i]._id);
                        return alarms[i]._id.toString();
                    }
                }
            };
            alarmDefs.get({}, (err, alarmDefs) => {
                point.iterateCursor({
                    query: {
                        'Alarm Messages.msgId': id
                    }
                }, (err, point, next) => {
                    point['Alarm Messages'].forEach((msg) => {
                        if (msg.msgId === id) {
                            msg.msgId = findAlarmDef(msg.msgType, alarmDefs);
                        }
                    });
                    point.update({
                        query: {
                            _id: point._id
                        },
                        updateObj: point
                    }, (err) => {
                        next(err);
                    });
                }, cb);
            });
        };

        alarmDefs.remove(criteria, (err, _data) => {
            if (err) {
                return cb(err.message);
            }
            fixPoints(data.deleteObject._id, (err) => {
                let entries = _data;
                logData.activity = 'Alarm Message Delete';
                logData.log = 'Alarm Message with text "' + data.deleteObject.msgFormat + '" removed from the system.';
                activityLog.create(logData, () => {
                    return cb(null, entries);
                });
            });
        });
    }
    weather(cb) {
        const point = new Point();
        let returnData;
        let upiMatrix = {};
        let weatherPointData = {};
        let weatherPointUpis = [];
        let getWeather = (callback) => {
            let search = {
                Name: 'Weather'
            };
            let fields = {
                _id: 0,
                Name: 0
            };

            let criteria = {
                query: search,
                fields: fields
            };

            this.getOne(criteria, (err, _data) => {
                let upi;
                let key;
                // Our data structure is like this:
                // {
                //    OAT: upi #,
                //    HDD: upi #,
                //    CDD: upi #
                // }
                for (key in _data) {
                    upi = _data[key];
                    // Save the upi and data object
                    weatherPointUpis.push(upi);
                    // Init our weather point
                    weatherPointData[key] = null;
                    // Save the key reference by upi
                    upiMatrix[upi] = key;
                }
                callback(err);
            });
        };
        let getPoints = (callback) => {
            let search = {
                _id: {
                    $in: weatherPointUpis
                }
            };
            let fields = {
                _id: 1,
                _pStatus: 1,
                Name: 1,
                'Point Type': 1
            };
            let criteria = {
                query: search,
                fields: fields
            };

            point.getAll(criteria, (err, _data) => {
                for (let i = 0, len = _data.length, point; i < len; i++) {
                    point = _data[i];
                    weatherPointData[upiMatrix[point._id]] = point;
                }
                returnData = weatherPointData;
                callback(err);
            });
        };

        let executeFns = [getWeather, getPoints];

        async.waterfall(executeFns, (err) => {
            if (err) {
                return cb(err.message);
            }

            return cb(null, returnData);
        });
    }
    updateWeather(data, cb) {
        let search = {
            Name: 'Weather'
        };
        let update = {
            $set: {}
        };
        let $set = update.$set;
        let getSetData = (upi) => {
            if (upi === 'null') {
                upi = null;
            } else {
                upi = parseInt(upi, 10);
            }
            return upi;
        };

        for (let key in data) {
            $set[key] = getSetData(data[key]);
        }

        let criteria = {
            query: search,
            updateObj: update
        };

        this.update(criteria, cb);
    }
    getVersions(data, cb) {
        let pjson = require('../package.json');
        let versions = {
            infoscanjs: pjson.version
        };
        let criteria = {
            query: {
                Name: 'Preferences'
            }
        };

        this.getOne(criteria, (err, result) => {
            if (err) {
                return cb(err);
            }
            versions.Processes = result['Server Version'];
            return cb(null, versions);
        });
    }
};

module.exports = System;
