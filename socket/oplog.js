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
var Utility = require('../models/utility');
var Config = require('../public/js/lib/config.js');
var logger = require('../helpers/logger')(module);
var dbName = config.get('Infoscan.dbConfig').dbName;
var openAlarms = [];
var openDisplays = [];
var io;
var common;

module.exports = function(_common) {
    common = _common;
    var oplog = common.sockets.get().oplog;
    io = common.sockets.get().io;
    openAlarms = common.openAlarms;
    openDisplays = common.openDisplays;

    oplog.on('insert', function(doc) {

        var startDate, endDate;
        if (doc.ns === dbName + '.Alarms' || doc.ns === dbName + '.ActiveAlarms') {
            var userHasAccess = false;

            // recent and unack
            // compare saved filter against new point
            for (var k = 0; k < openAlarms.length; k++) {

                if (openAlarms[k].alarmView === "Recent" || openAlarms[k].alarmView === "Unacknowledged" || openAlarms[k].alarmView === "Active") {

                    if (compareOplogNames(openAlarms[k].data.name1, doc.o.Name1)) {
                        continue;
                    }
                    if (compareOplogNames(openAlarms[k].data.name2, doc.o.Name2)) {
                        continue;
                    }
                    if (compareOplogNames(openAlarms[k].data.name3, doc.o.Name3)) {
                        continue;
                    }
                    if (compareOplogNames(openAlarms[k].data.name4, doc.o.Name4)) {
                        continue;
                    }

                    if (openAlarms[k].data.msgCat !== undefined && openAlarms[k].data.msgCat.indexOf(doc.o.msgCat) < 0) {
                        continue;
                    }
                    if (openAlarms[k].data.almClass !== undefined && openAlarms[k].data.almClass.indexOf(doc.o.almClass) < 0) {
                        continue;
                    }
                    if (openAlarms[k].data.pointTypes !== undefined && openAlarms[k].data.pointTypes.indexOf(doc.o.PointType) < 0) {
                        continue;
                    }

                    if (!checkUserAccess(openAlarms[k].data.user, doc.o.Security)) {
                        continue;
                    }

                    // unack
                    if (doc.o.ackStatus === 1 && openAlarms[k].alarmView === "Unacknowledged" && doc.ns === dbName + '.Alarms' && doc.o.msgCat !== Config.Enums['Alarm Categories'].Return.enum) {
                        io.sockets.connected[openAlarms[k].sockId].emit('newUnackAlarm', {
                            newAlarm: doc.o,
                            reqID: openAlarms[k].data.reqID
                        });
                    }

                    //recent
                    startDate = (typeof parseInt(openAlarms[k].data.startDate, 10) === "number") ? openAlarms[k].data.startDate : 0;
                    endDate = (parseInt(openAlarms[k].data.endDate, 10) === 0) ? Math.ceil(new Date().getTime() / 1000) + 10000 : openAlarms[k].data.endDate;
                    if (openAlarms[k].alarmView === "Recent" && doc.ns === dbName + '.Alarms' && doc.o.msgTime >= startDate && doc.o.msgTime <= endDate) {
                        io.sockets.connected[openAlarms[k].sockId].emit('newRecentAlarm', {
                            newAlarm: doc.o,
                            reqID: openAlarms[k].data.reqID
                        });
                    }

                    // active
                    if (openAlarms[k].alarmView === "Active" && doc.ns === dbName + '.ActiveAlarms') {

                        io.sockets.connected[openAlarms[k].sockId].emit('addingActiveAlarm', {
                            newAlarm: doc.o,
                            reqID: openAlarms[k].data.reqID
                        });
                    }
                }
            }

            if (doc.ns === dbName + '.Alarms') {
                common.acknowledgePointAlarms(doc.o);
                notifications.processIncomingAlarm(doc.o);
            }

        } else if (doc.ns === dbName + '.historydata') {
            // module.exports.updateDashboard(doc.o);
        } else if (doc.ns === dbName + '.Schedules') {
            scheduler.buildCron(doc.o, function(err, result) {

            });
        }
        /* else if (doc.ns === dbName+'.ActiveAlarms') {
                    var alarm = doc.o;
                    for (var m = 0; m < openAlarms.length; m++) {
                        if (openAlarms[m].alarmView === "Active" && ((openAlarms[m].pointTypes !== undefined) ? openAlarms[m].pointTypes.indexOf(alarm.PointType) > -1 : true) && checkUserAccess(openAlarms[m].data.user, alarm.Security)) {
                            io.sockets.socket(openAlarms[m].sockId).emit('addingActiveAlarm', {
                                newAlarm: doc.o,
                                reqID: openAlarms[m].data.reqID
                            });
                        }
                    }
                }*/
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
                        if (doc.o.$set !== undefined && (doc.o.$set.Value !== undefined || doc.o.$set["Value.Value"] !== undefined || doc.o.$set["Value.ValueOptions"] !== undefined || doc.o.$set["Value.eValue"] !== undefined)) {
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
                        if (doc.o.$set !== undefined && (doc.o.$set.Reliability !== undefined || doc.o.$set["Reliability.eValue"] !== undefined || doc.o.$set["Reliability.Value"] !== undefined || doc.o.$set._relDevice !== undefined || doc.o.$set._relRMU !== undefined || doc.o.$set._relPoint !== undefined)) {

                            updateReliability(point, function(err, point) {
                                wfcb(err, point);
                            });
                        } else {
                            wfcb(null, point);
                        }
                    },
                    function(point, wfcb) {

                        for (var i = 0; i < openDisplays.length; i++) {
                            if (openDisplays[i].display["Screen Objects"]) {
                                for (var j = 0; j < openDisplays[i].display["Screen Objects"].length; j++) {
                                    if ((openDisplays[i].display["Screen Objects"][j].isGplSocket === true || openDisplays[i].display["Screen Objects"][j]["Screen Object"] === 0 || openDisplays[i].display["Screen Objects"][j]["Screen Object"] === "0") && updateArray.indexOf(openDisplays[i].display["Screen Objects"][j].upi) === -1) {
                                        updateArray.push(openDisplays[i].display["Screen Objects"][j].upi);
                                    }
                                }
                            }
                        }

                        if (updateArray.indexOf(doc.o2._id) !== -1 && checkDynamicProperties(doc.o.$set)) {
                            checkForPointTail(doc.o2._id, point, function() {
                                /*if (updateValueFlag || updateReliabilityFlag) {
                                    updateFromTail(doc.o2._id, newValue, newReliability);
                                }*/
                                wfcb(null, point);
                            });
                        } else {
                            /*if (updateValueFlag || updateReliabilityFlag) {
                                updateFromTail(doc.o2._id, newValue, newReliability);
                            }*/
                            wfcb(null, point);
                        }
                    }
                ],
                function(err, result) {
                    if (updateValueFlag || updateReliabilityFlag /*|| updateCurAlarmFlag*/ ) {
                        updateFromTail(doc.o2._id, newValue, newReliability /*, newCurAlarm*/ );
                    }
                    return;
                });
        } else if (doc.ns === dbName + ".Alarms") {
            if (doc.o.$set !== undefined && doc.o.$set.ackStatus === 2) {
                for (var k = 0; k < openAlarms.length; k++) {
                    if (openAlarms[k].alarmView === "Unacknowledged") {
                        io.sockets.connected[openAlarms[k].sockId].emit('removingUnackAlarm', {
                            _id: doc.o2._id,
                            ackStatus: doc.o.$set.ackStatus,
                            ackUser: doc.o.$set.ackUser,
                            ackTime: doc.o.$set.ackTime,
                            reqID: openAlarms[k].data.reqID
                        });
                    }
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
            if (doc.o.$set._relDevice !== undefined || doc.o.$set._relRMU !== undefined) {
                doCurAlarm(point, function(err) {
                    callback(err, point);
                });
            } else {
                callback(null, point);
            }
        }

        function doCurAlarm(point, callback) {
            if ((!ObjectID("000000000000000000000000").equals(point._actvAlmId)) && (point["Point Type"].Value === "Device" || (point["Point Type"].Value === "Remote Unit" && point._relDevice === 0) || (point._relDevice === 0 && point._relRMU === 0))) {
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
            for (var n = 0; n < openAlarms.length; n++) {
                if (openAlarms[n].alarmView === "Active") {
                    io.sockets.connected[openAlarms[n].sockId].emit('removingActiveAlarm', {
                        _id: doc.o._id,
                        reqID: openAlarms[n].data.reqID
                    });
                }
            }
        } else if (doc.ns === dbName + '.Schedules') {
            scheduler.stopSchedule(doc);
        }
    });
};

module.exports.addDashboardDynamics = function(data) {
    for (var i = 0; i < openDashboards.length; i++) {
        if (!!openDashboards[i].socketid && openDashboards[i].touid === data.touid && openDashboards[i].socketid === data.socketid) {
            return;
        }
    }
    openDashboards.push(data);
};

module.exports.updateDashboard = function(doc, callback) {
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
        if (dashboard.upis.indexOf(doc.upi) > -1 && ((doc.timestamp >= dashboard.range.start && doc.timestamp <= dashboard.range.end) || (dashboard.scale.match(/latest/)))) {
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
                    callback(err1 /*|| err2*/ );
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

function checkDynamicProperties(obj) {
    if (obj.Value !== undefined || obj["Value.Value"] !== undefined || obj["Value.ValueOptions"] !== undefined || obj["Reliability.Value"] !== undefined || (obj.Reliability !== undefined && obj.Reliability.Value !== undefined) || obj['Alarm State.Value'] !== undefined || (obj['Alarm State'] !== undefined && obj['Alarm State'].Value !== undefined) || obj['Status Flags.Value'] !== undefined || (obj['Status Flags'] !== undefined && obj['Status Flags'].Value !== undefined) || obj['Alarms Off.Value'] !== undefined || (obj['Alarms Off'] !== undefined && obj['Alarms Off'].Value !== undefined) || obj['COV Enable.Value'] !== undefined || (obj['COV Enable'] !== undefined && obj['COV Enable'].Value !== undefined) || obj['Control Pending.Value'] !== undefined || (obj['Control Pending'] !== undefined && obj['Control Pending'].Value !== undefined) || obj['Quality Code Enable.Value'] !== undefined || (obj['Quality Code Enable'] !== undefined && obj['Quality Code Enable'].Value !== undefined)) {
        return true;
    }
    return false;
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

        for (var i = 0; i < openDisplays.length; i++) {
            if (openDisplays[i].display["Screen Objects"]) {
                for (var j = 0; j < openDisplays[i].display["Screen Objects"].length; j++) {
                    if (parseInt(openDisplays[i].display["Screen Objects"][j].upi, 10) === point._id && (openDisplays[i].display["Screen Objects"][j].Value !== point.Value.Value || isRelDiff(openDisplays[i].display["Screen Objects"][j]["Quality Label"], point))) {
                        openDisplays[i].display["Screen Objects"][j].Value = point.Value.Value;
                        openDisplays[i].display["Screen Objects"][j].eValue = point.Value.eValue;
                        openDisplays[i].display["Screen Objects"][j]["Quality Label"] = point["Quality Label"];
                        common.sendUpdate({
                            sock: openDisplays[i].sockId,
                            upi: point._id,
                            dyn: {
                                Value: point.Value.Value,
                                eValue: point.Value.eValue,
                                "Quality Label": point["Quality Label"]
                            }
                        });
                        break;
                    }
                }
            }
        }

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

function checkUserAccess(user, pointSecurity) {

    if (user["System Admin"].Value === true)
        return true;
    else {
        for (var i = 0; i < user.groups.length; i++) {
            if (pointSecurity.indexOf(user.groups[i]._id) !== -1)
                return true;
        }
        return false;
        // iterate over pointSecurity's groups and check if user is in any of them
        // return true, else return false when done iterating
    }
}