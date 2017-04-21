// CORE MODULES
let fs = require('fs');

// NPM MODULES
let _ = require('lodash');
let async = require('async');
let tmp = require('tmp');
let config = require('config');

// OTHERS
let Config = require('../public/js/lib/config');
let compiler = require('../helpers/scriptCompiler');
let logger = require('../helpers/logger')(module);
let zmq = require('../helpers/zmq');

let controlPriorities = [];

let io = {};
let rooms = {};
let common = {};

module.exports = function socketio(_common) {
    common = _common;
    io = _common.sockets.get().io;
    rooms = _common.rooms;
    controlPriorities = _common.controlPriorities;

    io.on('connection', function (sock) {
        logger.info('socket connected');
        let socket, user;
        socket = sock;
        sock.emit('test', 'test');
        user = sock.request.user;
        // Checked
        sock.on('getStatus', function () {
            sock.emit('statusUpdate', 'serverdown');
            zmq.sendCommand(JSON.stringify({
                'Command Type': 19
            }), function (err, msg) {
                if (!!err) {
                    err = err.ApduErrorMsg || err.msg;
                    sock.emit('statusUpdate', {
                        err: err
                    });
                } else {
                    sock.emit('statusUpdate', msg);
                }
            });
        });

        sock.on('dynamics', function (data) {
            let upis = [];
            data['Point Refs'].forEach(function (ref) {
                if (ref.Value !== 0) {
                    socket.join(ref.Value);
                    upis.push(ref.Value);
                }
            });

            getVals(upis);
        });

        sock.on('disconnect', function () {
            //
        });
        // Checked
        sock.on('getRecentAlarms', function (data) {
            const alarm = new Alarm();
            logger.debug('getRecentAlarms');
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            data.user = user;

            socket.join('recentAlarms');
            if (!rooms.recentAlarms.hasOwnProperty('views')) {
                rooms.recentAlarms.views = {};
            }
            rooms.recentAlarms.views[socket.id] = data;

            alarm.getRecentAlarms(data, function (err, alarms, count) {
                sock.emit('recentAlarms', {
                    alarms: alarms,
                    count: count,
                    reqID: data.reqID
                });
            });
        });
        // Checked
        sock.on('getUnacknowledged', function (data) {
            const alarm = new Alarm();
            logger.debug('getUnacknowledged');
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            data.user = user;
            socket.join('unacknowledged');
            if (!rooms.unacknowledged.hasOwnProperty('views')) {
                rooms.unacknowledged.views = {};
            }
            rooms.unacknowledged.views[socket.id] = data;

            alarm.getUnacknowledged(data, function (err, alarms, count) {
                sock.emit('unacknowledged', {
                    alarms: alarms,
                    count: count,
                    reqID: data.reqID
                });
            });
        });
        // Checked
        sock.on('getActiveAlarms', function (data) {
            const activeAlarm = new ActiveAlarm();
            logger.debug('getActiveAlarms');
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            data.user = user;
            socket.join('activeAlarms');
            if (!rooms.activeAlarms.hasOwnProperty('views')) {
                rooms.activeAlarms.views = {};
            }
            rooms.activeAlarms.views[socket.id] = data;

            activeAlarm.getActiveAlarms(data, function (err, alarms, count) {
                sock.emit('activeAlarms', {
                    alarms: alarms,
                    count: count,
                    reqID: data.reqID
                });
            });
        });
        // NOT CHECKED - Broken front?
        sock.on('sendAcknowledge', function (data) {
            const alarm = new Alarm();
            logger.debug('sendAcknowledge');
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            alarm.acknowledgeAlarm(data, function (err, result) {
                sock.emit('acknowledgeResponse', {
                    result: result.result.nModified,
                    reqID: data.reqID
                });
            });
        });
        // Checked
        sock.on('fieldCommand', function (data) {
            const activityLog = new ActivityLog();
            logger.debug('fieldCommand');
            let jsonData = JSON.parse(data);
            let logData, i;
            //data = JSON.stringify(data);
            if (jsonData['Command Type'] === 7) {
                logData = {
                    user: jsonData.logData.user,
                    timestamp: Date.now(),
                    point: jsonData.logData.point,
                    activity: 'Point Control',
                    prop: 'Value'
                };

                if (jsonData.Relinquish === 0) {
                    logData.newValue = {
                        Value: jsonData.logData.newValue.Value
                    };
                    if (jsonData.logData.newValue.eValue !== undefined) {
                        logData.newValue.eValue = jsonData.logData.newValue.eValue;
                    }
                    logData.log = 'Control to ' + logData.newValue.Value;
                    if (jsonData.hasOwnProperty('Priority')) {
                        for (i = 0; i < controlPriorities.length; i++) {
                            if (controlPriorities[i]['Priority Level'] === jsonData.Priority) {
                                logData.log += ' at priority ' + controlPriorities[i]['Priority Text'];
                            }
                        }
                    }
                } else if (logData.point['Point Type'].eValue === 128) {
                    logData.newValue = {
                        Value: jsonData.logData.newValue.Value
                    };
                    logData.log = 'Value reset to ' + logData.newValue.Value;
                } else {
                    for (i = 0; i < controlPriorities.length; i++) {
                        if (controlPriorities[i]['Priority Level'] === jsonData.Priority) {
                            logData.log = 'Control relinquished at priority ' + controlPriorities[i]['Priority Text'];
                        }
                    }
                }
            } else if (jsonData['Command Type'] === 2) {
                logData = {
                    user: jsonData.logData.user,
                    timestamp: Date.now(),
                    point: jsonData.logData.point
                };
                if (jsonData.state === 1) {
                    logData.activity = 'Warm Restart';
                    logData.log = 'Warm Restart sent';
                } else {
                    logData.activity = 'Reset';
                    logData.log = 'Reset sent';
                }
            }

            delete jsonData.logData;
            data = JSON.stringify(jsonData);

            if ([2, 7].indexOf(jsonData['Command Type']) > -1) {
                activityLog.create(logData, function (err, result) {});
            }
            logger.info('fieldCommand', data);
            zmq.sendCommand(data, function (err, msg) {
                if (!!err) {
                    err = err.ApduErrorMsg || err.msg;
                    sock.emit('returnFromField', {
                        err: err
                    });
                } else {
                    sock.emit('returnFromField', msg);
                }
            });
        });
        // Checked
        sock.on('firmwareLoader', function (data) {
            const activityLog = new ActivityLog();
            logger.debug('firmwareLoader');

            let filePath,
                logData = {
                    user: data.logData.user,
                    timestamp: Date.now(),
                    point: data.logData.point,
                    activity: 'Firmware Load',
                    log: data.logData.point['Firmware Version'] + ' Firmware \'' + data.fileName + '\' loaded'
                },
                sendCommand = function (filePath) {
                    let command = {
                        'Command Type': 11,
                        'devices': data.devices,
                        'remotes': data.remotes,
                        'cardtype': data.model,
                        'firmwarefile': filePath
                    };
                    command = JSON.stringify(command);

                    zmq.sendCommand(command, function (err, msg) {
                        if (!!err) {
                            err = err.ApduErrorMsg || err.msg;
                            sock.emit('returnFromLoader', {
                                err: err
                            });
                        } else {
                            sock.emit('returnFromLoader', msg);
                        }
                    });
                },
                logMessage = function (logData) {
                    activityLog.create(logData, function (err, result) {});
                };

            if (data.uploadFile !== undefined) {
                filePath = config.get('Infoscan.files').firmwareLocation + data.model + '/' + data.fileName;
                logMessage(logData);
                fs.writeFile(filePath, data.uploadFile, function (err) {
                    sendCommand(filePath);
                    if (false) {
                        fs.unlink(filePath, function (err) {

                        });
                    }
                });
            } else {
                filePath = config.get('Infoscan.files').firmwareLocation + data.model + '/' + data.fileName;
                logMessage(logData);
                sendCommand(filePath);
            }
        });
        // NOT CHECKED - will check on 88
        sock.on('startbackup', function (data) {
            logger.debug('startbackup');
            sock.emit('returnfrombackup', {
                message: 'done'
            });
        });
        // Checked
        sock.on('checkPropertiesForOne', function (data) {
            logger.debug('checkPropertiesForOne');
            checkProperties(data, function (propData) {
                sock.emit('returnProperties', propData); // Handle the received results
            });
        });
        // NOT CHECKED
        sock.on('getBlockTypes', function () {
            logger.debug('getBlockTypes');
            getBlockTypes(function (result) {
                sock.emit('gplTypes', result);
            });
        });
        // Checked
        sock.on('doRefreshSequence', function (data) {
            logger.debug('doRefreshSequence');
            doRefreshSequence(data, sock);
        });
        // Checked
        sock.on('updateSequence', function (data) {
            data.user = user;
            logger.debug('updateSequence');
            doUpdateSequence(data, function (result) {
                socket.emit('sequenceUpdateMessage', result);
            });
        });
        // Checked
        sock.on('doPointPackage', function (data) {
            data.user = user;
            const pointModel = new Point();
            logger.debug('doPointPackage');
            pointModel.doPointPackage(data, function (err, returnPoints) {
                if (err) {
                    sock.emit('pointPackage', {
                        err: err
                    });
                } else {
                    sock.emit('pointPackage', {
                        message: 'success',
                        points: returnPoints
                    });
                }
            });
        });
        // NOT CHECKED - will check on 88
        sock.on('compileScript', function (data) {
            logger.debug('compileScript');
            compileScript(data, function (response) {
                sock.emit('compiledScript', response);
            });
        });
        // Checked
        sock.on('updatePoint', function (data) {
            logger.debug('updatePoint');
            const pointModel = new Point();
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            pointModel.newUpdate(data.oldPoint, data.newPoint, {
                method: 'update',
                from: 'ui',
                path: (data.hasOwnProperty('path')) ? data.path : null
            }, user, function (response, point) {
                if (response.err) {
                    if (response.err.code === 11000) {
                        sock.emit('pointUpdated', {
                            err: 'Name already exists.',
                            point: (point) ? point : null
                        });
                    } else {
                        sock.emit('pointUpdated', {
                            err: response.err,
                            point: (point) ? point : null
                        });
                    }
                } else {
                    sock.emit('pointUpdated', {
                        message: response.message,
                        point: point
                    });
                }
            });
        });
        // Checked
        sock.on('updateSequencePoints', function (data) {
            logger.debug('updateSequencePoints');
            const pointModel = new Point();
            let returnPoints = [];

            async.waterfall([
                function (callback) {
                    pointModel.bulkAdd(data.adds, user, null, function (response, updatedPoint) {
                        callback(response.err, updatedPoint);
                    });
                },

                function (returnPoints, callback) {
                    async.mapSeries(data.updates, function (point, mapCallback) {
                        pointModel.newUpdate(point.oldPoint, point.newPoint, {
                            method: 'update',
                            from: 'ui'
                        }, user, function (response, updatedPoint) {
                            mapCallback(response.err, updatedPoint);
                        });
                    }, function (err, newPoints) {
                        callback(err, returnPoints.concat(newPoints));
                    });
                },

                function (returnPoints, callback) {
                    async.mapSeries(data.deletes, function (upi, mapCallback) {
                        pointModel.deletePoint(upi, 'hard', user, null, function (response) {
                            mapCallback(response.err);
                        });
                    }, function (err, newPoints) {
                        callback(err, returnPoints);
                    });
                }
            ], function (err, returnPoints) {
                if (err) {
                    sock.emit('sequencePointsUpdated', {
                        err: err
                    });
                } else {
                    sock.emit('sequencePointsUpdated', {
                        message: 'success',
                        points: returnPoints
                    });
                }
            });
        });
        // Checked
        sock.on('addPoint', function (data) {
            const point = new Point();
            logger.debug('addPoint');
            point.bulkAdd(data, user, null, function (response, points) {
                if (response.err) {
                    sock.emit('pointUpdated', {
                        err: response.err
                    });
                } else {
                    sock.emit('pointUpdated', {
                        message: response.msg,
                        points: points
                    });
                }
            });
        });
        // Checked
        sock.on('deletePoint', function (data) {
            logger.debug('deletePoint');
            const pointModel = new Point();
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            pointModel.deletePoint(data.upi, data.method, user, null, function (msg) {
                msg.reqID = data.reqID;
                msg.operation = 'deletePoint';
                msg.method = data.method;
                sock.emit('pointUpdated', JSON.stringify(msg));
            });
        });
        // Checked
        sock.on('restorePoint', function (data) {
            logger.debug('restorePoint');
            const pointModel = new Point();
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            pointModel.restorePoint(data.upi, user, function (msg) {
                msg.reqID = data.reqID;
                msg.operation = 'restorePoint';
                sock.emit('pointUpdated', JSON.stringify(msg));
            });
        });
        // NOT CHECKED - check on 88
        sock.on('updateSchedules', function (data) {
            logger.debug('updateSchedules');
            data.user = user;
            updateSchedules(data, function (err) {
                if (err) {
                    sock.emit('scheduleUpdated', {
                        err: err
                    });
                } else {
                    sock.emit('scheduleUpdated', {
                        message: 'success'
                    });
                }
            });
        });
        // Checked
        sock.on('getScheduleEntries', function (data) {
            logger.debug('getScheduleEntries');
            getScheduleEntries(data, function (err, entries) {
                sock.emit('returnEntries', {
                    err: err,
                    entries: entries
                });
            });
        });
        // NOT CHECKED - just added
        sock.on('getUsage', function (data) {
            const history = new History();
            let reqOptions = data.options;

            reqOptions.forEach(function (options) {
                if (typeof options.ranges === 'string') {
                    options.ranges = JSON.parse(options.ranges);
                }
                if (!(options.upis instanceof Array)) {
                    options.upis = JSON.parse(options.upis);
                }
                return;
            });

            reqOptions = history.buildOps(reqOptions);

            history.getUsageCall(reqOptions, function (err, results) {
                results = history.unbuildOps(results);
                sock.emit('returnUsage', {
                    err: err,
                    results: results
                });
            });
        });
        sock.on('getLogs', function (data) {
            logger.query({
                from: new Date() - 24 * 60 * 60 * 1000,
                limit: 10,
                start: -1,
                order: 'desc',
                fields: ['label', 'timestamp', 'message']
            }, function (err, results) {
                sock.emit('newLog', results);
            });
            logger.stream({
                from: new Date(),
                fields: ['label', 'timestamp', 'message']
            }).on('log', function (log) {
                sock.emit('newLog', log);
            });
        });
    });
};

function getInitialVals(id, callback) {
    const commonModel = new Common();
    const point = new Point();
    let fields = {
        Value: 1,
        Name: 1,
        eValue: 1,
        'Alarm State': 1,
        _cfgRequired: 1,
        _relDevice: 1,
        _relRMU: 1,
        _relPoint: 1,
        'Status Flags': 1,
        'Alarms Off': 1,
        'COV Enable': 1,
        'Control Pending': 1,
        'Quality Code Enable': 1
    };

    point.getOne({
        query: {
            _id: parseInt(id, 10)
        },
        fields: fields
    }, function (err, point) {
        if (point) {
            point = commonModel.setQualityLabel(point);
        }

        callback(point);
    });
}

function getBlockTypes(cb) {
    const point = new Point();
    point.getAll({
        query: {
            SequenceData: {
                $exists: true
            }
        },
        updateObj: {
            'SequenceData.Sequence.Block': 1
        }
    }, function (err, results) {
        let c,
            cc,
            len = results.length,
            row,
            blockType,
            blockTypes = {};

        for (c = 0; c < len; c++) {
            row = results[c].SequenceData.Sequence.Block;
            for (cc = 0; cc < row.length; cc++) {
                blockType = row[cc].data.BlockType;
                blockTypes[blockType] = blockTypes[blockType] || true;
            }
        }

        cb({
            err: err,
            types: blockTypes
        });
    });
}

function doRefreshSequence(data, socket) {
    const point = new Point();
    let _id = data.sequenceID;

    point.updateOne({
        query: {
            _id: _id
        },
        updateObj: {
            $set: {
                '_pollTime': new Date().getTime()
            }
        }
    }, function (err, updated) {
        if (err) {
            logger.error('err', err);
        }
    });
}

function doUpdateSequence(data, cb) {
    const point = new Point();
    let name = data.sequenceName,
        sequenceData = data.sequenceData,
        pointRefs = data.pointRefs;

    point.updateOne({
        query: {
            'Name': name
        },
        updateObj: {
            $set: {
                'SequenceData': sequenceData,
                'Point Refs': pointRefs
            }
        }
    }, function (updateErr, updateRecords) {
        if (updateErr) {
            cb('Error: ' + updateErr.err);
        } else {
            return cb('success');
        }
    });
}

function getVals(upis) {
    upis.forEach(function (upi) {
        getInitialVals(upi, function (point) {
            if (point) {
                if (point.Value && point.Value.eValue !== undefined && point.Value.eValue !== null) {
                    let pv = point.Value;

                    for (let prop in pv.ValueOptions) {
                        if (pv.ValueOptions[prop] === point.Value.eValue) {
                            point.Value.Value = prop;
                        }
                    }
                }


                let dyn = {
                    upi: point._id
                };
                if (point.Value) {
                    dyn.Value = point.Value.Value;
                    dyn.eValue = point.Value.eValue;
                    // openDisplays[i].display["Screen Objects"][j].Value = point.Value.Value;
                    // openDisplays[i].display["Screen Objects"][j].eValue = point.Value.eValue;
                    // openDisplays[i].display["Screen Objects"][j]["Quality Label"] = point["Quality Label"];
                }

                dyn['Quality Label'] = point['Quality Label'];
                dyn.Name = point.Name;
                common.sendUpdate(dyn);
            }
        });
    });
}

function compileScript(data, callback) {
    let script, fileName, filepath, re;

    re = new RegExp('"(.*), ');

    fileName = data.upi;
    script = data.script;

    tmp.dir({
        dir: __dirname + '/../scripts/'
    }, function _tempDirCreated(err, path, cleanupCallback) {
        filepath = path + '/' + fileName + '.dsl';
        fs.writeFile(filepath, script, function (err) {
            compiler.compile(filepath, path + '/' + fileName, function (err) {
                fs.readFile(path + '/' + fileName + '.err', function (err, data) {
                    logger.debug(err);
                    if (!!data && data.length > 0) {
                        return callback({
                            err: data.toString().replace(re, '')
                        });
                    }
                    return callback({
                        path: path
                    });
                });
            });
        });
    });
}

function updateSchedules(data, callback) {
    const activityLog = new ActivityLog();
    const point = new Point();
    let oldPoints, updateScheds, newScheds, cancelScheds, hardScheds, schedule, oldPoint, user, options,
        devices = [],
        signalTOD = false,
        logData,
        ctrlPoint;

    user = data.user;

    oldPoints = (data.oldPoints) ? data.oldPoints : [];
    updateScheds = (data.updateScheds) ? data.updateScheds : [];
    newScheds = (data.newScheds) ? data.newScheds : [];
    cancelScheds = (data.cancelScheds) ? data.cancelScheds : [];
    hardScheds = (data.hardScheds) ? data.hardScheds : [];
    schedule = (data.schedule) ? data.schedule : null;

    async.waterfall([

        function (wfCB) {
            async.eachSeries(updateScheds, function (updateSched, feCB) {
                logData = {
                    timestamp: Date.now(),
                    user: user
                };
                let updateObj = {
                    $set: {}
                };
                for (let i = 0; i < oldPoints.length; i++) {
                    if (oldPoints[i]._id === updateSched._id) {
                        oldPoint = oldPoints[i];
                        break;
                    }
                }
                for (let prop in updateSched) {
                    if (!_.isEqual(updateSched[prop], oldPoint[prop])) {
                        updateObj.$set[prop] = updateSched[prop];
                    }
                }

                if (updateSched['Host Schedule'].Value === true || oldPoint['Host Schedule'].Value === true) {
                    signalTOD = true;
                }
                if (updateSched['Host Schedule'].Value === false || oldPoint['Host Schedule'].Value === false) {
                    point.addToDevices(updateSched, devices, oldPoint);
                }

                if (!_.isEmpty(updateObj.$set)) {
                    point.updateOne({
                        query: {
                            _id: updateSched._id
                        },
                        updateObj: updateObj
                    }, function (err, result) {
                        if (err) {
                            feCB(err);
                        }

                        ctrlPoint = Config.Utility.getPropertyObject('Control Point', updateSched);
                        point.getOne({
                            query: {
                                _id: ctrlPoint.Value
                            }
                        }, function (err, point) {
                            logData.point = point;
                            logData.activity = 'Schedule Entry Edit';
                            logData.log = 'Schedule entry edited';
                            activityLog.create(logData, function (err, result) {
                                feCB(err);
                            });
                        });
                    });
                } else {
                    feCB(null);
                }
            }, function (err) {
                wfCB(err);
            });
        },
        function (wfCB) {
            async.eachSeries(newScheds, function (newSched, feCB) {
                logData = {
                    timestamp: Date.now(),
                    user: user
                };
                if (newSched['Host Schedule'].Value === true) {
                    signalTOD = true;
                } else {
                    point.addToDevices(newSched, devices);
                }
                options = {
                    from: 'updateSchedules',
                    schedule: schedule
                };

                for (let i = 0; i < oldPoints.length; i++) {
                    if (oldPoints[i]._id === newSched._id) {
                        oldPoint = oldPoints[i];
                        break;
                    }
                }

                point.bulkAdd([{
                    newPoint: newSched,
                    oldPoint: oldPoint
                }], user, options, function (returnData) {
                    if (returnData.err) {
                        feCB(returnData.err);
                    }

                    ctrlPoint = Config.Utility.getPropertyObject('Control Point', newSched);
                    point.getOne({
                        query: {
                            _id: ctrlPoint.Value
                        }
                    }, function (err, point) {
                        logData.point = point;
                        logData.activity = 'Schedule Entry Add';
                        logData.log = 'Schedule entry added';
                        activityLog.create(logData, function (err, result) {
                            feCB(err);
                        });
                    });
                });
            }, function (err) {
                wfCB(err);
            });
        },
        function (wfCB) {
            async.eachSeries(cancelScheds, function (cancelSched, feCB) {
                logData = {
                    timestamp: Date.now(),
                    user: user
                };

                point.deletePoint(cancelSched._id, 'hard', user, null, function (returnData) {
                    if (returnData.err) {
                        feCB(returnData.err);
                    }
                    if (cancelSched._pStatus !== 0) {
                        return feCB(null);
                    }
                    ctrlPoint = Config.Utility.getPropertyObject('Control Point', cancelSched);
                    point.getOne({
                        query: {
                            _id: ctrlPoint.Value
                        }
                    }, function (err, point) {
                        logData.point = point;
                        logData.activity = 'Schedule Entry Delete';
                        logData.log = 'Schedule entry deleted';
                        activityLog.create(logData, function (err, result) {
                            feCB(err);
                        });
                    });
                });
            }, function (err) {
                wfCB(err);
            });
        },
        function (wfCB) {
            async.eachSeries(hardScheds, function (hardSched, feCB) {
                logData = {
                    timestamp: Date.now(),
                    user: user
                };
                options = {
                    from: 'updateSchedules',
                    schedule: schedule
                };
                if (hardSched['Host Schedule'].Value === true) {
                    signalTOD = true;
                } else {
                    point.addToDevices(hardSched, devices);
                }

                point.deletePoint(hardSched._id, 'hard', user, options, function (returnData) {
                    if (returnData.err) {
                        feCB(returnData.err);
                    }
                    if (hardSched._pStatus !== 0) {
                        return feCB(null);
                    }

                    ctrlPoint = Config.Utility.getPropertyObject('Control Point', hardSched);
                    point.getOne({
                        query: {
                            _id: ctrlPoint.Value
                        }
                    }, function (err, point) {
                        logData.point = point;
                        logData.activity = 'Schedule Entry Delete';
                        logData.log = 'Schedule entry deleted';
                        activityLog.create(logData, function (err, result) {
                            feCB(err);
                        });
                    });
                });
            }, function (err) {
                wfCB(err);
            });
        }
    ], function (err) {
        point.signalHostTOD(signalTOD, function (err) {
            if (err) {
                return callback(err);
            }
            point.updateDeviceToDs(devices, function (err) {
                return callback((err !== null) ? err : 'success');
            });
        });
    });
}

function getScheduleEntries(data, callback) {
    const point = new Point();
    let isSchedule = data.isSchedule,
        upi = data.upi;

    if (isSchedule) {
        point.getAll({
            query: {
                'Point Type.Value': 'Schedule Entry'
            }
        }, callback);
    } else {
        point.getAll({
            query: {
                'Point Type.Value': 'Schedule Entry',
                'Point Refs': {
                    $elemMatch: {
                        'Value': upi,
                        'PropertyName': 'Control Point'
                    }
                }
            }
        }, callback);
    }
}

function checkProperties(data, callback) {
    const point = new Point();
    // Override Config so we get the latest version - this allows us to see the affects of changes to our enumsTemplates.json file
    // without having to restart the server
    let _Config = require('../public/js/lib/config.js');
    let template = _Config.Templates.getTemplate(data.pointType), // Template object
        skipProperties = {
            'Trend Last Status': 1,
            'Trend Last Value': 1,
            'Filter Data': 1,
            'Column Data': 1,
            'Control Array': 1,
            'Report Config': 1
        },
        skipRefProperties = {
            'Point Register': 1,
            'Display Dynamic': 1,
            'Display Animation': 1,
            'Display Trend': 1,
            'Display Button': 1,
            'Slide Display': 1,
            'Column Point': 1,
            'Qualifier Point': 1,
            'GPLBlock': 1
        },
        skipDeepPropertyCheck = {
            '_actvAlmId': 1
        },
        // skipKeys is on a per-point basis
        skipKeys = {
            'Schedule Entry': {
                'Control Value': ['eValue']
            },
            'Comparator': {
                'Input 2 Constant': ['eValue', 'ValueOptions']
            }
        };

    data.results = []; // Add some keys to data
    data.err = false;
    data.errMsg = '';

    if (template !== undefined) {
        point.iterateCursor({
            query: {
                'Point Type.Value': data.pointType
            }
        }, function (recsErr, rec, next) {
            let prop, // Work vars
                key,
                subKey,
                propName,
                propertyObject;

            // Check for operation error
            if (recsErr) {
                // TODO change summary to error. Verify viewModel looks @ error key
                data.err = true;
                data.errMsg = 'INTERNAL ERROR: dbResult.toArray() failed.'; // Push the 'problems found object' onto our results array
                next(recsErr, true); // Perform the callback
            } else {
                // Itterate through mongo result set
                // Initialize temporary object which contains the problems found for this point (also stores identifying info)
                let tempObj = {
                    _id: rec._id,
                    Name: rec.Name,
                    Problems: []
                };

                // Find template properties that do not exist in the database
                for (prop in template) {
                    if (skipProperties.hasOwnProperty(prop)) {
                        continue; // Go to next property
                    }

                    // If the template property doesn't exist in the database
                    if (rec[prop] === undefined) {
                        // Log the problem
                        tempObj.Problems.push('Property \'' + prop + '\' exists in template but not in DB.');
                    } else if ((typeof template[prop] === 'object') && (template[prop] !== null)) {
                        // Property exists in database. If the template property's value is actually an object, check the keys, i.e.
                        //          point {
                        //              prop_name_1: prop_value,
                        //              prop_name_2: prop_value,
                        //              prop_name_3: {
                        //                  key_name_1: key_value,  <~~~ in the following loop we're checking for matching key names
                        //                  key_name_2: key_Value        (not the key value mind you, the key name)
                        //              }
                        //          }
                        //
                        // If the prop_value is actually an object

                        // The template does not define the keys for some properties because they are different for every point, so we skip 'em!
                        if (skipDeepPropertyCheck.hasOwnProperty(prop)) {
                            continue; // Go to next property
                        } else if ((_Config.Enums.Properties[prop].valueType === 'Array') && (prop !== 'Point Refs')) {
                            continue;
                        } else if (Array.isArray(template[prop]) && template[prop].length === 0) {
                            continue;
                        }

                        // Find template property keys that do not exist in the database.
                        for (key in template[prop]) {
                            if (prop === 'Point Refs') {
                                propName = template[prop][key].PropertyName;

                                if (skipRefProperties.hasOwnProperty(propName)) {
                                    continue;
                                } else if ((propertyObject = _Config.Utility.getPropertyObject(propName, rec)) === null) {
                                    tempObj.Problems.push('Reference property \'' + propName + '\' exists in template but not in DB.');
                                } else {
                                    for (subKey in template[prop][key]) {
                                        if (propertyObject[subKey] === undefined) {
                                            tempObj.Problems.push('Key \'' + subKey + '\' for reference property \'' + propName + '\' exists in template but not in DB.');
                                        } else {
                                            delete propertyObject[subKey]; // No problems found. Delete the subKey out of the db record so we don't re-evaluate it again
                                        }
                                    }
                                }
                            } else if (rec[prop][key] === undefined) { // If the template key doesn't exist in the database
                                // Log the problem
                                tempObj.Problems.push('Key \'' + key + '\' for property \'' + prop + '\' exists in template but not in DB.');
                            } else {
                                delete rec[prop][key]; // No problems found. Delete the key out of the db record so we don't re-evaluate it again
                            }
                        }
                    } else {
                        delete rec[prop]; // No problems found. Delete the property out of the db record so we don't re-evaluate it again
                    }
                }

                // Find database properties that do not exist in the template
                for (prop in rec) {
                    if (skipProperties.hasOwnProperty(prop)) {
                        continue; // Go to next property
                    }

                    // If the database property doesn't exist in the template
                    if (template[prop] === undefined) {
                        // Log the problem
                        tempObj.Problems.push('Property \'' + prop + '\' exists in DB but not in template.');
                    } else if ((typeof rec[prop] === 'object') && (rec[prop] !== null)) {
                        // Property exists in template. If the database property's value is actually an object, check the keys, i.e.
                        //          point {
                        //              prop_name_1: prop_value,
                        //              prop_name_2: prop_value,
                        //              prop_name_3: {
                        //                  key_name_1: key_value,  <~~~ in the following loop we're checking for matching key names
                        //                  key_name_2: key_Value        (not the key value mind you, the key name)
                        //              }
                        //          }
                        //
                        // If the prop_value is actually an object

                        // The template does not define the keys for some properties because they are different for every point, so we skip 'em!
                        if (skipDeepPropertyCheck.hasOwnProperty(prop)) {
                            continue; // Go to next property
                        } else if ((_Config.Enums.Properties[prop].valueType === 'Array') && (prop !== 'Point Refs')) {
                            continue;
                        }

                        // Find database property keys that do not exist in the template.
                        for (key in rec[prop]) {
                            if (prop === 'Point Refs') {
                                if (_.isEmpty(rec[prop][key])) {
                                    continue;
                                }

                                propName = rec[prop][key].PropertyName;

                                if (skipRefProperties.hasOwnProperty(propName)) {
                                    continue;
                                } else if ((propertyObject = _Config.Utility.getPropertyObject(propName, template)) === null) {
                                    tempObj.Problems.push('Reference property \'' + propName + '\' exists in DB but not in template.');
                                } else {
                                    for (subKey in rec[prop][key]) {
                                        if (propertyObject[subKey] === undefined) {
                                            tempObj.Problems.push('Key \'' + subKey + '\' for reference property \'' + propName + '\' exists in template but not in DB.');
                                        }
                                    }
                                }
                            } else if (skipKeys[data.pointType] && skipKeys[data.pointType][prop] && skipKeys[data.pointType][prop].indexOf(key) !== -1) {
                                continue;
                            } else if (template[prop][key] === undefined) { // If the database key doesn't exist in the template
                                // Log the problem
                                tempObj.Problems.push('Key \'' + key + '\' for property \'' + prop + '\' exists in DB but not in template.');
                            }
                        }
                    }
                }

                // If we found at least one problem
                if (tempObj.Problems.length !== 0) {
                    data.results.push(tempObj); // Push the 'problems found object' onto our results array
                }
                if (data.results.length >= 25) { // Limit number of reported points with problems to 25
                    next(null, true); // Do not process any more points
                } else {
                    process.nextTick(function () {
                        next(); // Perform the callback
                    });
                }
            }
        }, function (err, count) {
            setTimeout(function () {
                callback(data);
            }, 100);
        });

        // Could not find point type in template
    } else {
        // TODO change summary to error. Verify viewModel looks @ error key
        data.err = true;
        data.errMsg = 'Error! Point type \'' + data.pointType + '\' was not found in the template.'; // Log this error

        callback(data); // Perform the callback
    }
}

let History = require('../models/history');
let Common = require('../models/common');
let Alarm = require('../models/alarm');
let ActivityLog = require('../models/activitylog');
let ActiveAlarm = require('../models/activealarm');
let Point = require('../models/point');
