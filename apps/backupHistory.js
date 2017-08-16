var async = require('async');
var db = require('../helpers/db');
var fs = require('fs');
var moment = require('moment');
var config = require('config');

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

// process.env.driveLetter = "D";
// process.env.archiveLocation = "/InfoScan/Archive/History/";
var History = require('../models/history.js');
var Utilities = require('../models/utilities');
var Point = require('../models/point');

var logFilePath = config.get('Infoscan.files').driveLetter + ':/InfoScanJS/apps/backup.log';

var logToFile = (msg) => {
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

let calculateWeather = (cb) => {
    let historyModel = new History();
    var removals = [lowTempUpi, hiTempUpi, hddUpi, cddUpi];
    var results = [];

    historyModel.remove({
        query: {
            upi: {
                $in: removals
            }
        }
    }, (err, _result) => {
        if (err) {
            return cb(err);
        }
        historyModel.get({
            query: {
                upi: oatUpi
            },
            fields: {
                _id: 0
            },
            sort: {
                timestamp: 1
            }
        }, (err, data) => {
            if (err) {
                return cb(err);
            }
            if (data.length === 0) {
                return cb('no data found in mongo');
            }
            // var endTime = moment.unix(data[data.length - 1].timestamp).endOf('day').unix();
            var endTime = moment().startOf('day').unix();
            var workingTime = moment.unix(data[0].timestamp).startOf('day').unix();

            async.whilst(() => {
                return workingTime < endTime;
            }, (callback) => {
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
                    logToFile('Value not entered: ' + moment.unix(workingTime).format(), hiTemp.hasOwnProperty('Value'), lowTemp.hasOwnProperty('Value'));
                }
                workingTime = endOfDay;
                callback();
            }, (err) => {
                console.log(results.length);
                historyModel.insert({
                    collection: 'historydata',
                    insertObj: results
                }, (err, result) => {
                    return cb(err);
                });
            });
        });
    });
};

let loadUpis = (cb) => {
    let utilitiesModel = new Utilities();
    let pointModel = new Point();
    let getNewTemp = (oldTemp, callback) => {
        // necessary because we currently have no tracking of what the hi and low temp points are
        pointModel.getOne({
            query: {
                _oldUpi: oldTemp
            }
        }, (err, newTemp) => {
            return callback(err, newTemp);
        });
    };

    getNewTemp(lowTempUpi, (err, newLowTemp) => {
        lowTempUpi = newLowTemp;
        getNewTemp(hiTempUpi, (err, newHiTemp) => {
            hiTempUpi = newHiTemp;

            utilitiesModel.getOne({
                query: {
                    Name: 'Weather'
                }
            }, (err, weatherPoints) => {
                hddUpi = weatherPoints['Heating Degree Days Point'];
                cddUpi = weatherPoints['Cooling Degree Days Point'];
                oatUpi = weatherPoints['Outside Air Temperature Point'];
                cb();
            });
        });
    });
};

let convertOldHistoryUpis = (cb) => {
    let historyModel = new History();
    let pointModel = new Point();
    let currentUpi = 0;
    let newUpi = 0;

    let getNewUpi = (_currentUpi, callback) => {
        pointModel.getOne({
            query: {
                _oldUpi: _currentUpi
            }
        }, (err, point) => {
            callback(err, point._id);
        });
    };

    let addWithNewUpi = (oldHistory, callback) => {
        historyModel.insert({
            insertObj: oldHistory
        }, callback);
    };

    historyModel.iterateCursor({
        collection: 'oldhistorydata',
        sort: {
            upi: 1
        }
    }, (err, oldHistory, nextHistory) => {
        if (oldHistory.upi !== currentUpi) {
            currentUpi = oldHistory.upi;
            getNewUpi(currentUpi, (err, _newUpi) => {
                newUpi = _newUpi;
                oldHistory.upi = newUpi;
                addWithNewUpi(oldHistory, (err, result) => {
                    nextHistory(err);
                });
            });
        } else {
            oldHistory.upi = newUpi;
            addWithNewUpi(oldHistory, (err, result) => {
                nextHistory(err);
            });
        }
    }, cb);
};

let backUp = () => {
    db.connect(connectionString.join(''), (err) => {
        convertOldHistoryUpis((err) => {
            loadUpis((err) => {
                console.log(upis);
                if (err) {
                    logToFile('loadUpis Error: ' + err);
                }
                calculateWeather((err) => {
                    if (err) {
                        logToFile('calculateWeather Error: ' + err);
                    }

                    logToFile('Starting SQLite backup.');
                    History.doBackUp(upis.all, false, (err) => {
                        if (err) {
                            logToFile('doBackUp Error: ' + err);
                        }
                        logToFile('Finished with SQLite backup');
                        /*setTimeout() => {
                            Utility.dropCollection({
                                collection: 'historydata'
                            }, err, result) => {
                                if (err) {
                                    logToFile('dropCollection Error: ' + err);
                                }
                                Utility.ensureIndex({
                                        collection: 'historydata',
                                        index: {
                                            upi: 1,
                                            timestamp: 1
                                        },
                                        options: {
                                            unique: true
                                        }
                                    },
                                    err, result) => {
                                        Utility.ensureIndex({
                                                collection: 'historydata',
                                                index: {
                                                    timestamp: -1
                                                }
                                            },
                                            err, result) => {
                                                if (err) {
                                                    logToFile('ensureIndex Error: ' + err);
                                                }
                                                logToFile('backupHistory completed. Exiting.');
                                            });
                                    });
                            });
                        }, 2000);*/
                        process.exit(0);
                    });
                });
            });
        });
    });
};
// backUp();


let newBackup = () => {
    let historyModel = new History();
    db.connect(connectionString.join(''), (err) => {
        historyModel.doBackUp(upis.all, (err) => {
            if (err) {
                console.log('doBackUp Error: ' + JSON.stringify(err));
            }
            console.log('Finished with SQLite backup');
            process.exit(0);
            // setTimeout(() => {
            //     historyModel.dropCollection({}, (err, result) => {
            //         if (err) {
            //             console.log('dropCollection Error: ' + err);
            //         }
            //         historyModel.ensureIndex({
            //             index: {
            //                 upi: 1,
            //                 timestamp: 1
            //             },
            //             options: {
            //                 unique: true
            //             }
            //         }, (err, result) => {
            //             historyModel.ensureIndex({
            //                 index: {
            //                     timestamp: -1
            //                 }
            //             }, (err, result) => {
            //                 if (err) {
            //                     console.log('ensureIndex Error: ' + err);
            //                 }
            //                 console.log('backupHistory completed. Exiting.');
            //                 process.exit(0);
            //             });
            //         });
            //     });
            // }, 2000);
        });
    });
};
newBackup();

// dont change power meters collection if c++ uses it
// c++ puts data with old upis in separate coll
// take data, change upis and put in historydata
// clean collection
// do normal (get upis from PowerMeters)
