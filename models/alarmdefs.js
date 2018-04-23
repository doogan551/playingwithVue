const Common = require('./common');
const ObjectId = require('mongodb').ObjectID;

const AlarmDefs = class AlarmDefs extends Common {

    constructor() {
        super('AlarmDefs');
    }
    getSystemAlarms(cb) {
        let criteria = {
            query: {
                isSystemMessage: true
            }
        };
        this.getAll(criteria, (err, data) => {
            if (err) {
                return cb(err.message);
            }

            let entries = data;
            return cb(null, entries);
        });
    }
    updateAlarmTemplate(data, cb) {
        const alarmDefs = new AlarmDefs();
        const activityLog = new ActivityLog();
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
                logData.log = 'Alarm Message with text "' + data.newObject.msgFormat + '" added.';
                activityLog.create(logData, () => {
                    return cb(err);
                });
            });
        } else if (!!data.updatedObject) {
            data.updatedObject._id = ObjectId(data.updatedObject._id);
            data.updatedObject.msgType = this.getNumber(data.updatedObject.msgType);
            data.updatedObject.msgCat = this.getNumber(data.updatedObject.msgCat);
            data.updatedObject.isSystemMessage = false;

            let query = {
                _id: data.updatedObject._id
            };

            alarmDefs.update({
                query,
                updateObj: data.updatedObject
            }, (err, result) => {
                logData.activity = 'Alarm Message Edit';
                logData.log = 'Alarm Message with text "' + data.updatedObject.msgFormat + '" updated.';
                activityLog.create(logData, () => {
                    return cb(err);
                });
            });
        } else {
            return cb('Incorrect property sent for save.');
        }
    }
    deleteAlarmTemplate(data, cb) {
        const alarmDefs = new AlarmDefs();
        const activityLog = new ActivityLog();
        const pointModel = new Point();
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
                        return alarms[i]._id.toString();
                    }
                }
            };
            alarmDefs.get({}, (err, alarmDefs) => {
                pointModel.iterateCursor({
                    query: {
                        'Alarm Messages.msgId': id
                    }
                }, (err, point, next) => {
                    point['Alarm Messages'].forEach((msg) => {
                        if (msg.msgId === id) {
                            msg.msgId = findAlarmDef(msg.msgType, alarmDefs);
                        }
                    });
                    pointModel.update({
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
};

module.exports = AlarmDefs;
const ActivityLog = require('./activitylog');
const Point = require('./point');
