// NODE MODULES
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');
var moment = require('moment');
var config = require('config');

// OTHERS
var NotifierUtility = require('../models/notifierutility');
var notifierUtility = new NotifierUtility();
var notifications = require('../models/notifications');
var scheduler = require('../helpers/scheduler');
var utils = require('../helpers/utils');
var Utility = require('../models/utility');
var Config = require('../public/js/lib/config.js');
var logger = require('../helpers/logger')(module);
var dbName = config.get('Infoscan.dbConfig').dbName;
var io;
var common;
var rooms = {};

var model;

module.exports = model = function(_common) {
    common = _common;
    var oplog = common.sockets.get().oplog;
    io = common.sockets.get().io;
    rooms = common.rooms;

    var checkAlarm = function(alarmData, alarm) {
        if (compareOplogNames(alarmData.name1, alarm.Name1)) {
            return false;
        }
        if (compareOplogNames(alarmData.name2, alarm.Name2)) {
            return false;
        }
        if (compareOplogNames(alarmData.name3, alarm.Name3)) {
            return false;
        }
        if (compareOplogNames(alarmData.name4, alarm.Name4)) {
            return false;
        }

        if (alarmData.msgCat !== undefined && alarmData.msgCat.indexOf(alarm.msgCat) < 0) {
            return false;
        }
        if (alarmData.almClass !== undefined && alarmData.almClass.indexOf(alarm.almClass) < 0) {
            return false;
        }
        if (alarmData.pointTypes !== undefined && alarmData.pointTypes.indexOf(alarm.PointType) < 0) {
            return false;
        }

        if (!checkUserAccess(alarmData.user, alarm)) {
            return false;
        }
        return true;
    }

    oplog.on('insert', function(doc) {

        var startDate, endDate;
        // join room (recent)
        // add key to room of upis with each request obj
        // match room with logic below
        // for each socketID in room, get obj from room.views[id]
        if (doc.ns === dbName + '.Alarms') {
            var recentViews = (rooms.hasOwnProperty('recentAlarms')) ? rooms.recentAlarms.views : {};
            for (var prop in recentViews) {
                if (!checkAlarm(recentViews[prop], doc.o)) {
                    continue;
                }
                startDate = (typeof parseInt(recentViews[prop].startDate, 10) === "number") ? recentViews[prop].startDate : 0;
                endDate = (parseInt(recentViews[prop].endDate, 10) === 0) ? Math.ceil(new Date().getTime() / 1000) + 10000 : recentViews[prop].endDate;
                if (doc.o.msgTime >= startDate && doc.o.msgTime <= endDate) {
                    io.to(prop).emit('newRecentAlarm', {
                        newAlarm: doc.o,
                        reqID: recentViews[prop].reqID
                    });
                }

            }

            var unackdViews = (rooms.hasOwnProperty('unacknowledged')) ? rooms.unacknowledged.views : {};
            for (var prop in unackdViews) {
                if (!checkAlarm(unackdViews[prop], doc.o)) {
                    continue;
                }
                if (doc.o.ackStatus === 1 && doc.o.msgCat !== Config.Enums['Alarm Categories'].Return.enum) {
                    io.to(prop).emit('newUnackAlarm', {
                        newAlarm: doc.o,
                        reqID: unackdViews[prop].reqID
                    });
                }

            }

            common.acknowledgePointAlarms(doc.o);
            notifications.processIncomingAlarm(doc.o);
        } else if (doc.ns === dbName + '.ActiveAlarms') {

            var activeViews = (rooms.hasOwnProperty('activeAlarms')) ? rooms.activeAlarms.views : {};
            for (var prop in activeViews) {
                if (!checkAlarm(activeViews[prop], doc.o)) {
                    continue;
                }
                io.to(prop).emit('addingActiveAlarm', {
                    newAlarm: doc.o,
                    reqID: activeViews[prop].reqID
                });
            }
        } else if (doc.ns === dbName + '.historydata') {
            // module.exports.updateDashboard(doc.o);
        } else if (doc.ns === dbName + '.Schedules') {
            scheduler.buildCron(doc.o, function(err, result) {});
        }
    });

    oplog.on('update', function(doc) {
        if (doc.ns === dbName + ".points" && doc.o.$set !== undefined) {
            var start = new Date();
            var updateArray;
            var updateValueFlag = false,
                updateReliabilityFlag = false,
                updateCurAlarmFlag = false,
                newValue = null,
                newReliability = null,
                newCurAlarm = null,
                updatePoint = {},
                fields = {
                    Value: 1,
                    "Alarm State": 1,
                    _cfgRequired: 1,
                    _relDevice: 1,
                    _relRMU: 1,
                    _relPoint: 1,
                    "Status Flags": 1,
                    "Alarms Off": 1,
                    "COV Enable": 1,
                    "Control Pending": 1,
                    "Quality Code Enable": 1,
                    Reliability: 1,
                    // _curAlmId: 1,
                    "Point Type": 1,
                    _actvAlmId: 1
                };

            updateArray = [];
            async.waterfall([
                    function(wfcb) {
                        Utility.getOne({
                            query: {
                                _id: doc.o2._id
                            },
                            collection: 'points',
                            fields: fields
                        }, function(err, point) {
                            wfcb(err, point);
                        });
                    },

                    function(point, wfcb) {
                        // logger.info(point._id + " " + doc.o2._id);
                        if (doc.o.$set !== undefined && (doc.o.$set.Value !== undefined ||
                                doc.o.$set["Value.Value"] !== undefined ||
                                doc.o.$set["Value.ValueOptions"] !== undefined ||
                                doc.o.$set["Value.eValue"] !== undefined)) {
                            var tempVal = _.cloneDeep(point.Value);

                            if (point.Value && point.Value.eValue !== undefined && point.Value.eValue !== null) {
                                var pv = point.Value;
                                for (var prop in pv.ValueOptions) {
                                    if (pv.ValueOptions[prop] === point.Value.eValue)
                                        point.Value.Value = prop;
                                }
                            }

                            if (point.Value.Value !== tempVal.Value) {
                                updateValueFlag = true;
                                newValue = point.Value;
                            }
                            wfcb(null, point);
                        } else {
                            wfcb(null, point);
                        }
                    },
                    function(point, wfcb) {
                        if (doc.o.$set._actvAlmId !== undefined) {
                            doCurAlarm(point, function(err) {
                                wfcb(err, point);
                            });
                        } else {
                            wfcb(null, point);
                        }
                    },
                    function(point, wfcb) {
                        if (doc.o.$set !== undefined && (doc.o.$set.Reliability !== undefined ||
                                doc.o.$set["Reliability.eValue"] !== undefined ||
                                doc.o.$set["Reliability.Value"] !== undefined ||
                                doc.o.$set._relDevice !== undefined ||
                                doc.o.$set._relRMU !== undefined ||
                                doc.o.$set._relPoint !== undefined)) {
                            updateReliability(point, function(err, point) {
                                wfcb(err, point);
                            });
                        } else {
                            wfcb(null, point);
                        }
                    },
                    function(point, wfcb) {

                        if (utils.checkDynamicProperties(doc.o.$set)) {
                            checkForPointTail(doc.o2._id, point, function() {
                                wfcb(null, point);
                            });
                        } else {
                            wfcb(null, point);
                        }
                    }
                ],
                function(err, result) {
                    if (updateValueFlag ||
                        updateReliabilityFlag
                        /*||
                        updateCurAlarmFlag*/
                    ) {
                        updateFromTail(doc.o2._id, newValue, newReliability /*, newCurAlarm*/ );
                    }
                    return;
                });
        } else if (doc.ns === dbName + ".Alarms") {
            if (doc.o.$set !== undefined && doc.o.$set.ackStatus === 2) {

                var unackdViews = (rooms.hasOwnProperty('unacknowledged')) ? rooms.unacknowledged.views : {};
                for (var prop in unackdViews) {
                    io.to(prop).emit('removingUnackAlarm', {
                        _id: doc.o2._id,
                        ackStatus: doc.o.$set.ackStatus,
                        ackUser: doc.o.$set.ackUser,
                        ackTime: doc.o.$set.ackTime,
                        reqID: unackdViews[prop].reqID
                    });
                }
            }
        } else if (doc.ns === dbName + ".SystemInfo") {
            var name = '';
            if (doc.o.$set !== undefined && doc.o.$set.Entries !== undefined) {
                if (doc.o.$set.Entries[0].hasOwnProperty("Priority Level")) {
                    name = "controlpriorities";
                } else if (doc.o.$set.Entries[0].hasOwnProperty("Quality Code")) {
                    name = "qualityCodes";
                } else if (doc.o.$set.Entries[0].hasOwnProperty("Controller Name")) {
                    name = "controllers";
                }

                if (name !== '') {
                    io.sockets.emit('updatedSystemInfo', {
                        name: name
                    });
                }
            }
        } else if (doc.ns === dbName + '.historydata') {
            Utility.getOne({
                collection: 'historydata',
                query: {
                    _id: doc.o2._id
                }
            }, function(err, historyPoint) {
                // module.exports.updateDashboard(historyPoint);
            });
        } else if (doc.ns === dbName + '.Schedules') {
            Utility.getOne({
                collection: 'Schedules',
                query: {
                    _id: doc.o2._id
                }
            }, function(err, schedule) {
                scheduler.buildCron(schedule, function(err, result) {

                });
            });
        }

        function updateReliability(point, callback) {
            if (point.Reliability !== undefined) {
                var tempRel = _.cloneDeep(point.Reliability);
                point = Config.EditChanges.applyReliability({
                    point: point
                });

                if (tempRel.Value !== point.Reliability.Value) {
                    updateReliabilityFlag = true;
                    newReliability = point.Reliability;
                }
            }
            if (doc.o.$set._relDevice !== undefined ||
                doc.o.$set._relRMU !== undefined) {
                doCurAlarm(point, function(err) {
                    callback(err, point);
                });
            } else {
                callback(null, point);
            }
        }

        function doCurAlarm(point, callback) {
            if ((!ObjectID("000000000000000000000000").equals(point._actvAlmId)) && (point["Point Type"].Value === "Device" ||
                    (point["Point Type"].Value === "Remote Unit" && point._relDevice === 0) ||
                    (point._relDevice === 0 && point._relRMU === 0))) {
                addActiveAlarm(ObjectID(point._actvAlmId), callback);
            } else {
                removeActiveAlarm(point._id, callback);
            }
            // updateCurAlarmFlag = true;
            // newCurAlarm = point._curAlmId;
            // callback(null);

        }
    });

    oplog.on('delete', function(doc) {
        if (doc.ns === dbName + '.ActiveAlarms') {
            var activeViews = (rooms.hasOwnProperty('activeAlarms')) ? rooms.activeAlarms.views : {};
            for (var prop in activeViews) {

                io.to(prop).emit('removingActiveAlarm', {
                    _id: doc.o._id,
                    reqID: activeViews[prop].reqID
                });
            }
        } else if (doc.ns === dbName + '.Schedules') {
            console.log('deleting schedule', doc);
            scheduler.stopSchedule(doc.o);
        }
    });
};

model.addDashboardDynamics = function(data) {
    for (var i = 0; i < openDashboards.length; i++) {
        if (!!openDashboards[i].socketid && openDashboards[i].touid === data.touid && openDashboards[i].socketid === data.socketid) {
            return;
        }
    }
    openDashboards.push(data);
};

model.updateDashboard = function(doc, callback) {
    var history = require('../controllers/history.js');
    var startTime = new Date();

    async.each(openDashboards, function(dashboard, cb) {
        dashboard.upis = dashboard.upis.map(function(upi) {
            return parseInt(upi, 10);
        });
        dashboard.range = {
            start: parseInt(dashboard.range.start, 10),
            end: parseInt(dashboard.range.end, 10)
        };
        if (dashboard.upis.indexOf(doc.upi) > -1 && ((doc.timestamp >= dashboard.range.start && doc.timestamp <= dashboard.range.end) ||
                (dashboard.scale.match(/latest/)))) {
            if (dashboard.fx === 'missingData') {
                /*history.getMissing(dashboard, function(err, results) {
                    dashboard.result = results;
                    io.sockets.socket(dashboard.socketid).emit('updateDashboard', dashboard);
                    return cb();
                });*/
                return cb();
            } else {
                var dashboards = history.buildOps([dashboard]);
                history.getUsageCall(dashboards, function(err, results) {
                    results = history.unbuildOps(results);
                    io.sockets.connected[dashboard.socketid].emit('updateDashboard', results);
                    return cb();
                });
            }
        } else {
            return cb();
        }
    }, function(err) {

        if (typeof callback === 'function') {
            return callback(err);
        } else {
            return;
        }
    });
};

function addActiveAlarm(alarmId, callback) {
    Utility.getOne({
            query: {
                _id: alarmId
            },
            collection: 'Alarms'
        },
        function(err1, alarm) {
            if (alarm !== null) {
                Utility.insert({
                    collection: 'ActiveAlarms',
                    insertObj: alarm
                }, function(err2, result) {
                    callback(err1
                        /*||
                        err2*/
                    );
                });
            }
        });
}

function removeActiveAlarm(upi, callback) {
    Utility.remove({
            query: {
                upi: upi
            },
            collection: 'ActiveAlarms'
        },
        function(err, result) {
            callback(err);
        });
}

function updateFromTail(_id, value, reliability) {
    var updateObj = {
        $set: {}
    };

    if (value !== undefined && value !== null)
        updateObj.$set["Value.Value"] = value.Value;
    if (reliability !== undefined && reliability !== null) {
        updateObj.$set["Reliability.Value"] = reliability.Value;
        updateObj.$set["Reliability.eValue"] = reliability.eValue;
    }
    /*if (curAlarm !== undefined && curAlarm !== null)
        updateObj.$set._curAlmId = ObjectID(curAlarm);*/
    Utility.update({
            query: {
                _id: _id
            },
            updateObj: updateObj,
            collection: 'points'
        },
        function(err, result) {

        });
}


function compareOplogNames(queryNameSegment, alarmName) {
    /*if (queryNameSegment !== undefined)
        return true;*/
    if (!queryNameSegment)
        return false;
    if (queryNameSegment.length > 0 && alarmName.match(new RegExp("^" + queryNameSegment, 'i')) === null)
        return true;
    return false;
}

function checkForPointTail(upi, point, callback) {
    if (!point) {
        getChangedVals(upi, function(point) {
            updateValsTail(point, function() {
                callback(null);
            });
        });
    } else {
        updateValsTail(point, function() {
            callback(null);
        });
    }
}

function updateValsTail(point, finalCB) {

    if (point) {
        point = common.setQualityLabel(point);
        if (point.Value && point.Value.eValue !== undefined && point.Value.eValue !== null) {
            var pv = point.Value;
            for (var prop in pv.ValueOptions) {
                if (pv.ValueOptions[prop] === point.Value.eValue)
                    point.Value.Value = prop;
            }
        }

        common.sendUpdate({
            upi: point._id,
            Value: point.Value.Value,
            eValue: point.Value.eValue,
            "Quality Label": point["Quality Label"]
        });

    }

    finalCB(null);
}

function isRelDiff(dynRel, point) {
    if (dynRel !== point["Quality Label"])
        return true;
    else return false;
}

function getChangedVals(id, callback) {
    var fields = {
        Value: 1,
        "Alarm State": 1,
        _relDevice: 1,
        _relRMU: 1,
        _relPoint: 1,
        "Status Flags": 1,
        "Alarms Off": 1,
        "COV Enable": 1,
        "Control Pending": 1,
        "Quality Code Enable": 1
    };
    Utility.getOne({
        query: {
            _id: parseInt(id, 10)
        },
        fields: fields,
        collection: 'points'
    }, function(err, point) {
        callback(point);
    });
}

function checkUserAccess(user, point) {
    var identifier = null;
    identifier = (point.hasOwnProperty('upi')) ? 'upi' : '_id';

    if (user["System Admin"].Value === true) {
        point._pAccess = 15;
        return true;
    } else {
        point._pAccess = 0 | user.permissions[point[identifier]];
        return user.permissions.hasOwnProperty(point[identifier]);
    }
}