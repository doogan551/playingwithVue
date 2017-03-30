const ObjectID = require('mongodb').ObjectID;

const Common = require('./common');
const utils = require('../helpers/utils');

const alarmsCollection = utils.CONSTANTS('alarmsCollection');

const Alarm = class Alarm extends Common {
    constructor() {
        super(alarmsCollection);
    }

    /////////////////////////////////////////////////////////////////////////////
    // Adds alarm windows to memory. Used by oplog when alarms are added to DB //
    /////////////////////////////////////////////////////////////////////////////
    maintainAlarmViews(socketid, view, data, common) {
        let openAlarms = common.openAlarms;

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        for (let i = 0; i < openAlarms.length; i++) {
            if (openAlarms[i].sockId === socketid && openAlarms[i].alarmView === view) {
                openAlarms[i].data = data;
                return;
            }
        }

        openAlarms.push({
            sockId: socketid,
            alarmView: view,
            data: data
        });
    }

    //////////////////////////////////////////////////////////////////
    // Queries for alarms that would show in a Recent Alarms window //
    //////////////////////////////////////////////////////////////////
    getRecentAlarms(data, callback) {
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        let alarmQuery = this.buildAlarmQuery(data, 'Recent');

        this.getWithSecurity({
            query: alarmQuery.query,
            sort: alarmQuery.sort,
            _skip: alarmQuery.skip,
            _limit: alarmQuery.numberItems,
            data: data
        }, (err, alarms, count) => {
            callback(err, alarms, count);
        });
    }

    getUnacknowledged(data, callback) {
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        let alarmQuery = this.buildAlarmQuery(data, 'Unacknowledged');

        this.getWithSecurity({
            query: alarmQuery.query,
            sort: alarmQuery.sort,
            _skip: alarmQuery.skip,
            _limit: alarmQuery.numberItems,
            data: data
        }, callback);
    }

    //////////////////////////////////////////////////
    // Used to acknowledge an alarm in the database //
    //////////////////////////////////////////////////
    acknowledgeAlarm(data, cb) {
        const activeAlarm = new ActiveAlarm();

        let ids = data.ids || [data._id];
        let username = data.username;
        let time = Math.floor(new Date().getTime() / 1000);
        let ackMethod = data.ackMethod || 'Console';

        for (let j = 0; j < ids.length; j++) {
            ids[j] = ObjectID(ids[j]);
        }

        let criteria = {
            query: {
                _id: {
                    $in: ids
                },
                ackStatus: this.getTemplateEnum('Acknowledge Statuses', 'Not Acknowledged')
            },
            updateObj: {
                $set: {
                    ackStatus: this.getTemplateEnum('Acknowledge Statuses', 'Acknowledged'),
                    ackUser: username,
                    ackMethod: ackMethod,
                    ackTime: time
                }
            }
        };

        this.updateAll(criteria, (err, result) => {
            activeAlarm.updateAll(criteria, (err2) => {
                if (!!cb) {
                    cb(err || err2, result);
                }
            });
        });
    }

    autoAcknowledgeAlarms(callback) {
        let now = Math.floor(Date.now() / 1000);
        let twentyFourHoursAgo = now - 86400;

        this.updateAll({
            query: {
                msgTime: {
                    $lte: twentyFourHoursAgo
                },
                ackStatus: 1
            },
            updateObj: {
                $set: {
                    ackUser: 'System',
                    ackTime: now,
                    ackStatus: this.getTemplateEnum('Acknowledge Statuses', 'Acknowledged')
                }
            }
        }, (err, result) => {
            callback(result);
        });
    }

    getAlarm(query, callback) {
        let criteria = {
            query: query
        };
        this.getOne(criteria, callback);
    }

};

module.exports = Alarm;
const ActiveAlarm = require('./activealarm');
