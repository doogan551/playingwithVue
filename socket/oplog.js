// change db

module.exports = function(common) {
    var oplog = common.sockets.get().oplog;
    var io = common.sockets.get().io;
    var openAlarms = common.openAlarms;
    var openDisplays = common.openDisplays;

    oplog.on('insert', function(doc) {
        var startDate, endDate;
        if (doc.ns === 'infoscan.Alarms' || doc.ns === 'infoscan.ActiveAlarms') {
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
                    if (doc.o.ackStatus === 1 && openAlarms[k].alarmView === "Unacknowledged" && doc.ns === 'infoscan.Alarms') {
                        io.sockets.socket(openAlarms[k].sockId).emit('newUnackAlarm', {
                            newAlarm: doc.o,
                            reqID: openAlarms[k].data.reqID
                        });
                    }

                    //recent
                    startDate = (typeof parseInt(openAlarms[k].data.startDate, 10) === "number") ? openAlarms[k].data.startDate : 0;
                    endDate = (parseInt(openAlarms[k].data.endDate, 10) === 0) ? Math.ceil(new Date().getTime() / 1000) + 10000 : openAlarms[k].data.endDate;
                    if (openAlarms[k].alarmView === "Recent" && doc.ns === 'infoscan.Alarms' && doc.o.msgTime >= startDate && doc.o.msgTime <= endDate) {
                        io.sockets.socket(openAlarms[k].sockId).emit('newRecentAlarm', {
                            newAlarm: doc.o,
                            reqID: openAlarms[k].data.reqID
                        });
                    }

                    // active
                    if (openAlarms[k].alarmView === "Active" && doc.ns === 'infoscan.ActiveAlarms') {

                        io.sockets.socket(openAlarms[k].sockId).emit('addingActiveAlarm', {
                            newAlarm: doc.o,
                            reqID: openAlarms[k].data.reqID
                        });
                    }
                }
            }

        }
        /* else if (doc.ns === 'infoscan.ActiveAlarms') {
                    console.log('insert active', doc);
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
        if (doc.ns === "infoscan.points" && doc.o.$set !== undefined) {
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
                    _relDevice: 1,
                    _relRMU: 1,
                    _relPoint: 1,
                    "Status Flags": 1,
                    "Alarms Off": 1,
                    "COV Enable": 1,
                    "Control Pending": 1,
                    "Quality Code Enable": 1,
                    Reliability: 1,
                    _curAlmId: 1,
                    "Point Type": 1,
                    _actvAlmId: 1
                };

            updateArray = [];
            async.waterfall([
                    function(wfcb) {
                        mydb.collection(pointsCollection).findOne({
                            _id: doc.o2._id
                        }, fields, function(err, point) {
                            wfcb(err, point);
                        });
                    },

                    function(point, wfcb) {
                        if (doc.o.$set !== undefined && (doc.o.$set.Value !== undefined || doc.o.$set["Value.Value"] !== undefined || doc.o.$set["Value.ValueOptions"] !== undefined || doc.o.$set["Value.eValue"] !== undefined)) {


                            var tempVal = _.clone(point.Value, true);
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
        } else if (doc.ns === "infoscan.Alarms") {
            if (doc.o.$set !== undefined && doc.o.$set.ackStatus === 2) {
                for (var k = 0; k < openAlarms.length; k++) {
                    if (openAlarms[k].alarmView === "Unacknowledged") {
                        io.sockets.socket(openAlarms[k].sockId).emit('removingUnackAlarm', {
                            _id: doc.o2._id,
                            ackStatus: doc.o.$set.ackStatus,
                            ackUser: doc.o.$set.ackUser,
                            ackTime: doc.o.$set.ackTime,
                            reqID: openAlarms[k].data.reqID
                        });
                    }
                }
            }
        } else if (doc.ns === "infoscan.SystemInfo") {
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
        }

        function updateReliability(point, callback) {
            if (point.Reliability !== undefined) {
                var tempRel = _.clone(point.Reliability, true);
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
            if ((!BSON.ObjectID("000000000000000000000000").equals(point._actvAlmId)) && (point["Point Type"].Value === "Device" || (point["Point Type"].Value === "Remote Unit" && point._relDevice === 0) || (point._relDevice === 0 && point._relRMU === 0))) {
                addActiveAlarm(BSON.ObjectID(point._actvAlmId), callback);
            } else {
                removeActiveAlarm(point._id, callback);
            }
            // updateCurAlarmFlag = true;
            // newCurAlarm = point._curAlmId;
            // callback(null);

        }
    });

    oplog.on('delete', function(doc) {
        console.log('delete', doc);
        if (doc.ns === 'infoscan.ActiveAlarms') {
            for (var n = 0; n < openAlarms.length; n++) {
                if (openAlarms[n].alarmView === "Active") {
                    io.sockets.socket(openAlarms[n].sockId).emit('removingActiveAlarm', {
                        _id: doc.o._id,
                        reqID: openAlarms[n].data.reqID
                    });
                }
            }
        }
    });
};

function addActiveAlarm(alarmId, callback) {
    mydb.collection(alarmsCollection).findOne({
        _id: alarmId
    }, function(err1, alarm) {
        if (alarm !== null) {
            mydb.collection('ActiveAlarms').insert(alarm, function(err2, result) {
                console.log('inserted', alarm.upi);
                callback(err1 /*|| err2*/ );
            });
        }
    });
}

function removeActiveAlarm(upi, callback) {
    mydb.collection('ActiveAlarms').remove({
        upi: upi
    }, function(err, result) {
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
        updateObj.$set._curAlmId = BSON.ObjectID(curAlarm);*/
    mydb.collection(pointsCollection).update({
        _id: _id
    }, updateObj, function(err, result) {

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
        point = setQualityLabel(point);
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
                        sendUpdate({
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

    mydb.collection(pointsCollection).findOne({
        _id: parseInt(id, 10)
    }, fields, function(err, point) {


        callback(point);
    });

}