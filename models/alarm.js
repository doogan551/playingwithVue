let ObjectID = require('mongodb').ObjectID;

let Utility = require('./utility');
const Common = new(require('./common'))();
let Model = require('./model');

let Alarm = class Alarm extends Model {
    constructor(args) {
        super(args);
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
    getRecentAlarms(data, cb) {
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        let currentPage = parseInt(data.currentPage, 10);
        let itemsPerPage = parseInt(data.itemsPerPage, 10);
        let startDate = (typeof parseInt(data.startDate, 10) === 'number') ? data.startDate : 0;
        let endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;
        let sort = {};

        if (!itemsPerPage) {
            itemsPerPage = 200;
        }
        if (!currentPage || currentPage < 1) {
            currentPage = 1;
        }

        let numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

        let query = {
            $and: [{
                msgTime: {
                    $gte: startDate
                }
            }, {
                msgTime: {
                    $lte: endDate
                }
            }]
        };

        Common.addNamesToQuery(data, query, 'name1');
        Common.addNamesToQuery(data, query, 'name2');
        Common.addNamesToQuery(data, query, 'name3');
        Common.addNamesToQuery(data, query, 'name4');

        if (data.msgCat) {
            query.msgCat = {
                $in: data.msgCat
            };
        }
        if (data.almClass) {
            query.almClass = {
                $in: data.almClass
            };
        }

        if (data.pointTypes) {
            if (data.pointTypes.length > 0) {
                query.pointType = {
                    $in: data.pointTypes
                };
            }
        }

        sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

        let criteria = {
            collection: 'Alarms',
            query: query,
            _skip: (currentPage - 1) * itemsPerPage,
            _limit: numberItems,
            sort: sort,
            data: data
        };

        Utility.getWithSecurity(criteria, cb);
    }

    //////////////////////////////////////////////////
    // Used to acknowledge an alarm in the database //
    //////////////////////////////////////////////////
    acknowledgeAlarm(data, cb) {
        let ids;
        let username;
        let time;
        let ackMethod;

        ids = data.ids;
        username = data.username;
        time = Math.floor(new Date().getTime() / 1000);
        ackMethod = data.ackMethod || 'Console';

        for (let j = 0; j < ids.length; j++) {
            ids[j] = ObjectID(ids[j]);
        }

        let criteria = {
            collection: 'Alarms',
            query: {
                _id: {
                    $in: ids
                },
                ackStatus: 1
            },
            updateObj: {
                $set: {
                    ackStatus: 2,
                    ackUser: username,
                    ackMethod: ackMethod,
                    ackTime: time
                }
            },
            options: {
                multi: true
            }
        };


        Utility.update(criteria, function (err, result) {
            criteria.collection = 'ActiveAlarms';
            Utility.update(criteria, function (err2) {
                cb(err || err2, result);
            });
        });
    }
};

module.exports = Alarm;
