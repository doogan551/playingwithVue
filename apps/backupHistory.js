var mongo = require('mongodb');
var BSON = mongo.BSONPure;
var async = require('async');
var Config = require('../public/js/lib/config.js');
var Utils = require('../helpers/utils.js');
var db = require('../helpers/db');
var numLong = mongo.Long;
var fs = require('fs');
var moment = require('moment');
var config = require('config');
var logger = require('../helpers/logger')(module);

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

var conn = 'mongodb://localhost/infoscan';

// process.env.driveLetter = "D";
// process.env.archiveLocation = "/InfoScan/Archive/History/";
var History = require('../models/history.js');
var ArchiveUtility = require('../models/archiveutility.js');
var Utility = require('../models/utility.js');

var logFilePath = "D:/InfoScan/PowerData/PowerMeterDataXfer.log";

var logToFile = function(msg) {
    var timestamp = moment().format();
    var data = '\n' + timestamp + ' ' + msg;
    fs.appendFileSync(logFilePath, data);
};

var lowTempUpi = 41312;
var hiTempUpi = 41313;
var hddUpi = 41324;
var cddUpi = 41336;
var oatUpi = 65696;
var setPoint = 65;

var upis = {
    'demand': [918918, 918919, 918920, 918921, 918922, 918923, 918924, 918925, 918926, 918927, 918928, 918929, 918930, 918931, 918932, 918933, 918934, 918935, 918936, 918937, 918938, 918939, 918940, 918941, 918942, 918943, 918944, 918945, 918947, 918949, 918950, 918951, 918952, 918953],
    'consumption': [918990, 918991, 918992, 918993, 918994, 918995, 918996, 918997, 918998, 918999, 919000, 919001, 919002, 919003, 919004, 919005, 919006, 919007, 919008, 919009, 919010, 919011, 919012, 919013, 919014, 919015, 919016, 919017, 919018, 919019, 919020, 919021, 919022, 919023],
    'reactive': [918956, 918957, 918958, 918959, 918960, 918961, 918962, 918963, 918964, 918965, 918966, 918967, 918968, 918969, 918970, 918971, 918972, 918973, 918974, 918975, 918976, 918977, 918978, 918979, 918980, 918981, 918982, 918983, 918984, 918985, 918986, 918987, 918988, 918989],
    all: [],
    wS: [lowTempUpi, hiTempUpi, hddUpi, cddUpi, oatUpi]
};

function getMeterUpis(mdb, cb) {
    mdb.collection('Utilities').find({}, {
        'Meters': 1,
        _id: 0
    }).toArray(function(err, meters) {
        for (var i = 0; i < meters.length; i++) {
            for (var m = 0; m < meters[i].Meters.length; m++) {
                var meter = meters[i].Meters[m];
                for (var p = 0; p < meter.meterPoints.length; p++) {
                    var point = meter.meterPoints[p];
                    if (upis.all.indexOf(point.upi) < 0) {
                        upis.all.push(point.upi);
                    }
                }
            }
        }
        upis.all = upis.all.concat(upis.wS);
        cb(err);
    });
}

function calculateWeather(mdb, cb) {
    var removals = [lowTempUpi, hiTempUpi, hddUpi, cddUpi];
    var results = [];

    mdb.collection('historydata').remove({
        upi: {
            $in: removals
        }
    }, function(err, _result) {
        if (err) {
            return cb(err);
        }
        mdb.collection('historydata').find({
            upi: oatUpi
        }, {
            _id: 0
        }).sort({
            timestamp: 1
        }).toArray(function(err, data) {
            if (err) {
                return cb(err);
            }
            if (data.length === 0) {
                return cb('no data found in mongo');
            }
            // var endTime = moment.unix(data[data.length - 1].timestamp).endOf('day').unix();
            var endTime = moment().startOf('day').unix();
            var workingTime = moment.unix(data[0].timestamp).startOf('day').unix();

            async.whilst(function() {
                return workingTime < endTime;
            }, function(callback) {
                var endOfDay = moment.unix(workingTime).add(1, 'day').unix();
                var hdd = {
                    Value: 0,
                    timestamp: workingTime,
                    ValueType: 1,
                    upi: hddUpi
                };
                var cdd = {
                    Value: 0,
                    timestamp: workingTime,
                    ValueType: 1,
                    upi: cddUpi
                };
                var hiTemp = {
                    timestamp: workingTime,
                    ValueType: 1,
                    upi: hiTempUpi
                };
                var lowTemp = {
                    timestamp: workingTime,
                    ValueType: 1,
                    upi: lowTempUpi
                };

                for (var i = 0; i < data.length; i++) {
                    if (data[i].timestamp >= workingTime && data[i].timestamp < endOfDay) {
                        if (!hiTemp.hasOwnProperty('Value') || data[i].Value > hiTemp.Value) {
                            hiTemp.Value = data[i].Value;
                        }
                        if (!lowTemp.hasOwnProperty('Value') || data[i].Value < lowTemp.Value) {
                            lowTemp.Value = data[i].Value;
                        }
                    }
                }
                if (hiTemp.hasOwnProperty('Value') && lowTemp.hasOwnProperty('Value')) {
                    var avg = (hiTemp.Value + lowTemp.Value) / 2;

                    if (avg > setPoint) {
                        cdd.Value = avg - setPoint;
                    } else {
                        hdd.Value = setPoint - avg;
                    }
                    results.push(hdd);
                    results.push(cdd);
                    results.push(lowTemp);
                    results.push(hiTemp);
                } else {
                    logToFile("Value not entered: " + moment.unix(workingTime).format(), hiTemp.hasOwnProperty('Value'), lowTemp.hasOwnProperty('Value'));
                }
                workingTime = endOfDay;
                callback();
            }, function(err) {
                console.log(results.length);
                mdb.collection('historydata').insert(results, function(err, result) {
                    return cb(err);
                });
            });
        });
    });
}

function backUp() {
    mongo.connect(conn, function(err, mdb) {
        calculateWeather(mdb, function(err) {
            if (err) {
                logToFile('getMeterUpis Error: ' + err);
            }
            getMeterUpis(mdb, function(err) {
                if (err) {
                    logToFile('getMeterUpis Error: ' + err);
                }
                history.setupDB(mdb, null);
                logToFile('Starting SQLite backup.');
                history.doBackUp(mdb, upis.all, false, function(err) {
                    if (err) {
                        logToFile('doBackUp Error: ' + err);
                    }
                    logToFile('Finished with SQLite backup');
                    setTimeout(function() {
                        mdb.dropCollection('historydata', function(err, result) {
                            if (err) {
                                logToFile('dropCollection Error: ' + err);
                            }
                            mdb.collection('historydata').ensureIndex({
                                upi: 1,
                                timestamp: 1
                            }, {
                                unique: true
                            }, function(err, result) {
                                if (err) {
                                    logToFile('ensureIndex Error: ' + err);
                                }
                                logToFile('backupHistory completed. Exiting.');
                                process.exit(0);
                            });
                        });
                    }, 2000);
                });
            });
        });
    });
}
// backUp();

function newBackup() {
    db.connect(connectionString.join(''), function(err) {
        History.doBackUp(upis.all, false, function(err) {
            console.log('done');
        });
    });
}
newBackup();