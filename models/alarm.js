let ObjectID = require('mongodb').ObjectID;

let Utility = new(require('./utility'))();
let ActiveAlarm = new(require('./activealarm'))();
let utils = require('../helpers/utils');
const alarmsCollection = utils.CONSTANTS('alarmsCollection');

let Alarm = class Alarm extends Utility {
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
        let currentPage, itemsPerPage, numberItems, startDate, endDate, query, sort;

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        currentPage = parseInt(data.currentPage, 10);
        itemsPerPage = parseInt(data.itemsPerPage, 10);
        startDate = (typeof parseInt(data.startDate, 10) === 'number') ? data.startDate : 0;
        endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;

        sort = {};

        if (!itemsPerPage) {
            itemsPerPage = 200;
        }
        if (!currentPage || currentPage < 1) {
            currentPage = 1;
        }

        numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

        query = {
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

        if (data.name1 !== undefined) {
            if (data.name1 !== null) {
                query.Name1 = new RegExp('^' + data.name1, 'i');
            } else {
                query.Name1 = '';
            }
        }
        if (data.name2 !== undefined) {
            if (data.name2 !== null) {
                query.Name2 = new RegExp('^' + data.name2, 'i');
            } else {
                query.Name2 = '';
            }
        }
        if (data.name3 !== undefined) {
            if (data.name3 !== null) {
                query.Name3 = new RegExp('^' + data.name3, 'i');
            } else {
                query.Name3 = '';
            }
        }
        if (data.name4 !== undefined) {
            if (data.name4 !== null) {
                query.Name4 = new RegExp('^' + data.name4, 'i');
            } else {
                query.Name4 = '';
            }
        }
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
            query.PointType = {
                $in: data.pointTypes
            };
        }

        sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

        this.getWithSecurity({
            query: query,
            sort: sort,
            _skip: (currentPage - 1) * itemsPerPage,
            _limit: numberItems,
            data: data
        }, (err, alarms, count) => {
            callback(err, alarms, count);
        });
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
            }
        };


        this.updateAll(criteria, (err, result) => {
            criteria.collection = 'ActiveAlarms';
            this.updateAll(criteria, (err2) => {
                cb(err || err2, result);
            });
        });
    }

    getUnacknowledged(data, callback) {
        let currentPage, itemsPerPage, numberItems, query, sort;

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        currentPage = parseInt(data.currentPage, 10);
        itemsPerPage = parseInt(data.itemsPerPage, 10);
        sort = {};

        if (!itemsPerPage) {
            itemsPerPage = 200;
        }
        if (!currentPage || currentPage < 1) {
            currentPage = 1;
        }

        numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

        query = {
            ackStatus: 1
        };

        if (data.name1 !== undefined) {
            if (data.name1 !== null) {
                query.Name1 = new RegExp('^' + data.name1, 'i');
            } else {
                query.Name1 = '';
            }
        }
        if (data.name2 !== undefined) {
            if (data.name2 !== null) {
                query.Name2 = new RegExp('^' + data.name2, 'i');
            } else {
                query.Name2 = '';
            }
        }
        if (data.name3 !== undefined) {
            if (data.name3 !== null) {
                query.Name3 = new RegExp('^' + data.name3, 'i');
            } else {
                query.Name3 = '';
            }
        }
        if (data.name4 !== undefined) {
            if (data.name4 !== null) {
                query.Name4 = new RegExp('^' + data.name4, 'i');
            } else {
                query.Name4 = '';
            }
        }

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
            query.PointType = {
                $in: data.pointTypes
            };
        }

        sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

        this.getWithSecurity({
            query: query,
            sort: sort,
            _skip: (currentPage - 1) * itemsPerPage,
            _limit: numberItems,
            data: data
        }, (err, alarms, count) => {
            if (err) {
                callback(err, null, null);
            }
            callback(err, alarms, count);
        });
    }

    getActiveAlarmsNew(data, callback) {
        let currentPage, itemsPerPage, numberItems, startDate, endDate, query, sort;

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        currentPage = parseInt(data.currentPage, 10);
        itemsPerPage = parseInt(data.itemsPerPage, 10);
        startDate = (typeof parseInt(data.startDate, 10) === 'number') ? data.startDate : 0;
        endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;

        sort = {};

        if (!itemsPerPage) {
            itemsPerPage = 200;
        }
        if (!currentPage || currentPage < 1) {
            currentPage = 1;
        }

        numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

        query = {
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

        if (data.name1 !== undefined) {
            if (data.name1 !== null) {
                query.Name1 = new RegExp('^' + data.name1, 'i');
            } else {
                query.Name1 = '';
            }
        }
        if (data.name2 !== undefined) {
            if (data.name2 !== null) {
                query.Name2 = new RegExp('^' + data.name2, 'i');
            } else {
                query.Name2 = '';
            }
        }
        if (data.name3 !== undefined) {
            if (data.name3 !== null) {
                query.Name3 = new RegExp('^' + data.name3, 'i');
            } else {
                query.Name3 = '';
            }
        }
        if (data.name4 !== undefined) {
            if (data.name4 !== null) {
                query.Name4 = new RegExp('^' + data.name4, 'i');
            } else {
                query.Name4 = '';
            }
        }
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
            query.PointType = {
                $in: data.pointTypes
            };
        }

        sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

        ActiveAlarm.getWithSecurity({
            query: query,
            sort: sort,
            _skip: (currentPage - 1) * itemsPerPage,
            _limit: numberItems,
            data: data
        }, (err, alarms, count) => {
            callback(err, alarms, count);
        });
    }

    autoAcknowledgeAlarms(callback) {
        let now, twentyFourHoursAgo;
        now = Math.floor(Date.now() / 1000);
        twentyFourHoursAgo = now - 86400;
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
                    ackStatus: 2
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
