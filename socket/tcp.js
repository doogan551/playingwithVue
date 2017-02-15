// CORE MODULES
let fs = require('fs');

let Config = require('../public/js/lib/config');
let Point = new(require('../models/point'))();
let logger = require('../helpers/logger')(module);
let zmq = require('../helpers/zmq');

let common;
let io;

module.exports = function (_common) {
    common = _common;
    io = _common.sockets.get().io;
    let tcp = common.sockets.get().tcp;

    tcp.on('connection', function (socket) {
        // logger.info("connected tcpServer");
        socket.setEncoding('utf8');

        socket.on('data', function (buf) {
            logger.info(buf);
            let jbuf = JSON.parse(buf);

            if (jbuf.msg === 'newtod') {
                let date = new Date(),
                    dateString = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDay() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

                runScheduleEntry(jbuf.point, function (err, point) {
                    err = (err) ? err : 'Success';
                    let nameString = (point.name1) ? (point.name2) ? (point.name3) ? (point.name4) ? point.name1 + '_' + point.name2 + '_' + point.name3 + '_' + point.name4 : point.name1 + '_' + point.name2 + '_' + point.name3 : point.name1 + '_' + point.name2 : point.name1 : '';
                    writeToLogs(dateString + ' -  ToD Schedule - ' + point._id + ' - ' + nameString + ' - ' + err + '\n', function (err) {
                        // logger.info(err);
                    });
                });
            } else if (jbuf.msg === 'serverup' || jbuf.msg === 'serverdown') {
                io.sockets.emit('statusUpdate', jbuf.msg);
            }
        });
        socket.on('close', function (data) {
            logger.info('closing tcpServer', data);
        });
        socket.on('error', function (error) {
            logger.error('error on tcpServer', error);
        });
    });
};

function writeToLogs(msg, callback) {
    fs.appendFile('./logs/activitylogs.txt', msg, function (err) {
        callback(err);
    });
}

function runScheduleEntry(entryUpi, callback) {
    // get control point
    // get props allowed based on point type value
    // if pass
    // switch on control property

    Point.getOne({
        query: {
            _id: parseInt(entryUpi._id, 10)
        }
    }, function (err, scheduleEntry) {
        Point.getOne({
            query: {
                _id: Config.Utility.getPropertyObject('Control Point', scheduleEntry).Value,
                _pStatus: 0
            }
        }, function (err, point) {
            if (err) {
                return callback(err, scheduleEntry);
            } else if (!point) {
                return callback('No point found', scheduleEntry);
            }
            let controlProperty = scheduleEntry['Control Property'].Value;
            if (Config.Enums['Point Types'][point['Point Type'].Value].schedProps.indexOf(controlProperty) !== -1) {
                if (controlProperty === 'Execute Now') {
                    Point.updateOne({
                        query: {
                            _id: point._id
                        },
                        updateObj: {
                            $set: {
                                'Execute Now.Value': true
                            }
                        }
                    }, function (err, result) {
                        common.signalExecTOD(true, function (err, msg) {
                            callback(err, scheduleEntry);
                        });
                    });
                } else if (['Analog Output', 'Analog Value', 'Binary Output', 'Binary Value', 'Accumulator', 'MultiState Value'].indexOf(point['Point Type'].Value) !== -1 && controlProperty === 'Value') {
                    let control = {
                        'Command Type': 7,
                        'upi': point._id,
                        'Controller': scheduleEntry.Controller.eValue,
                        'Priority': scheduleEntry['Control Priority'].eValue,
                        'Relinquish': (scheduleEntry['Active Release'].Value === true) ? 1 : 0,
                        'OvrTime': 0
                    };

                    control.Value = (scheduleEntry['Control Value'].ValueType === 5) ? scheduleEntry['Control Value'].eValue : scheduleEntry['Control Value'].Value;

                    control = JSON.stringify(control);

                    zmq.sendCommand(control, function (err, msg) {
                        if (!!err) {
                            callback(err, scheduleEntry);
                        } else {
                            callback(null, scheduleEntry);
                        }
                    });
                } else {
                    let oldPoint = _.cloneDeep(point);
                    point[controlProperty].Value = scheduleEntry['Control Value'].Value;
                    point._actvAlmId = oldPoint._actvAlmId;
                    let result = Config.Update.formatPoint({
                        oldPoint: oldPoint,
                        point: point,
                        property: controlProperty,
                        refPoint: null
                    });
                    if (result.err) {
                        callback(result.err, scheduleEntry);
                    } else {
                        common.newUpdate(oldPoint, point, {
                            method: 'update',
                            from: 'updateToD'
                        }, {
                            username: 'ToD Schedule'
                        }, function (response, point) {
                            callback(response.err, scheduleEntry);
                        });
                    }
                }
            } else {
                callback(null, scheduleEntry);
            }
        });
    });
}
