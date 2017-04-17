var mongo = require('mongodb');
var async = require('async');
var util = require('util');
var lodash = require('lodash');
var moment = require('moment');
var config = require('config');

var logger = require('../helpers/logger')(module);
var Config = require('../public/js/lib/config');
var utils = require('../helpers/utils');
var Common = require('../models/common');
var importconfig = require('../apps/importconfig');

var localTZ = config.get('Infoscan.location').timezone;
var ObjectID = mongo.ObjectID;
var pointsCollection = 'points';
var systemInfoCollection = 'SystemInfo';
var xmlPath = importconfig.xmlPath;

let Import = class Import extends Common {
    constructor() {
        super();
    }
    start() {
        var limit = 2000,
            skip = 0;
        logger.info('starting', new Date());
        this.doGplImport(xmlPath, (err) => {
            this.initImport((err) => {
                this.updateIndexes((err) => {
                    this.convertHistoryReports((err) => {
                        this.convertTotalizerReports((err) => {
                            this.convertScheduleEntries((err) => {
                                this.updateAllProgramPoints((err) => {
                                    this.updateAllSensorPoints((err) => {
                                        this.innerLoop(limit, skip);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    innerLoop(limit, skip) {
        logger.info('innerLoop');
        var count = 0;
        var criteria = {
            collection: pointsCollection,
            query: {
                _Name: {
                    $exists: 0
                }
            }
        };

        this.iterateCursor(criteria, (err, doc, cb) => {
            // logger.info("retrieved", err);
            // logger.info("doc.id = " + doc._id);
            this.importPoint(doc, (err) => {
                count++;
                if (count % 10000 === 0) {
                    logger.info(count);
                }
                cb(err);
            });
        }, (err) => {
            logger.info('innerLoop cursor done', err);
            this.updateGPLReferences((err) => {
                this.fixPowerMeters((err, count) => {
                    logger.info('number of powermeters changed:', count);
                    logger.info('before changeUpis', err, new Date());
                    this.changeUpis((err) => {
                        this.updateHistory((err) => {
                            logger.info('finished updateHistory', err);
                            this.cleanupDB((err) => {
                                if (err) {
                                    logger.info('updateGPLReferences err:', err);
                                }
                                logger.info('done', err, new Date());
                                process.exit(0);
                            });
                        });
                    });
                });
            });
        });
    }

    importPoint(point, cb) {
        this.updateNameSegments(point, (err) => {
            if (err) {
                logger.info('updateNameSegments', err);
            }
            this.updateSequences(point, (err) => {
                if (err) {
                    logger.info('updateSequences', err);
                }
                this.updateTaglist(point, (err) => {
                    if (err) {
                        logger.info('updateTaglist', err);
                    }
                    this.updateCfgRequired(point, (err) => {
                        if (err) {
                            logger.info('updateCfgRequired', err);
                        }
                        this.updateOOSValue(point, (err) => {
                            if (err) {
                                logger.info('updateOOSValue', err);
                            }
                            this.addTrendProperties(point, (err) => {
                                if (err) {
                                    logger.info('addTrendProperties', err);
                                }
                                this.updateScriptPoint(point, (err) => {
                                    if (err) {
                                        logger.info('updateScriptPoint', err);
                                    }
                                    /*this.updateProgramPoints(point, db, function(err) {
                                        if (err)
                                          logger.info("updateProgramPoints", err);*/
                                    this.updateMultiplexer(point, (err) => {
                                        if (err) {
                                            logger.info('updateMultiplexer', err);
                                        }
                                        this.updateGPLBlocks(point, (err) => {
                                            if (err) {
                                                logger.info('updateGPLBlocks', err);
                                            }
                                            /*this.updateSensorPoints(point, function(err) {
                                              if (err)
                                                logger.info("updateSensorPoints", err);*/
                                            this.updateReferences(point, (err) => {
                                                if (err) {
                                                    logger.info('updateReferences', err);
                                                }
                                                // needs to be done after point refs is added to point
                                                utils.setupNonFieldPoints(point);

                                                utils.setChannelOptions(point);
                                                this.updateTimeZones(point, (err) => {
                                                    if (err) {
                                                        logger.info('updateTimeZones', err);
                                                    }
                                                    this.updateDevices(point, (err) => {
                                                        if (err) {
                                                            logger.info('updateDevices', err);
                                                        }
                                                        this.updateModels(point, (err) => {
                                                            if (err) {
                                                                logger.info('updateModels', err);
                                                            }
                                                            this.updateAlarmMessages(point, (err) => {
                                                                if (err) {
                                                                    logger.info('updateAlarmMessages', err);
                                                                }
                                                                this.addBroadcastPeriod(point, (err) => {
                                                                    if (err) {
                                                                        logger.info('addBroadcastPeriod', err);
                                                                    }
                                                                    this.updateTrend(point, (err) => {
                                                                        if (err) {
                                                                            logger.info('updateTrend', err);
                                                                        }
                                                                        this.rearrangeProperties(point, (err) => {
                                                                            if (err) {
                                                                                logger.info('rearrangeProperties', err);
                                                                            }
                                                                            if (point._id === 85161) {
                                                                                logger.info(point['Point Refs'][2]);
                                                                            }
                                                                            this.updatePoint(point, (err) => {
                                                                                if (err) {
                                                                                    logger.info('updatePoint', err);
                                                                                }
                                                                                cb(null);
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
            // });
            //});
        });
    }

    updatePoint(point, cb) {
        this.update({
            collection: pointsCollection,
            query: {
                _id: point._id
            },
            updateObj: point
        }, cb);
    }
    addDefaultUser(cb) {
        this.get({
            collection: 'Users',
            query: {}
        }, (err, users) => {
            async.eachSeries(users, (user, callback) => {
                updateControllers('add', user.username, (err) => {
                    callback(err);
                });
            }, cb);
        });

        let updateControllers = (op, username, callback) => {
            var searchCriteria = {
                Name: 'Controllers'
            };

            this.getOne({
                collection: systemInfoCollection,
                query: searchCriteria
            }, (err, controllers) => {
                if (op === 'add') {
                    var id = 0,
                        ids = [],
                        maxId = 0;

                    for (var a = 0; a < controllers.Entries.length; a++) {
                        ids.push(controllers.Entries[a]['Controller ID']);
                        maxId = (controllers.Entries[a]['Controller ID'] > maxId) ? controllers.Entries[a]['Controller ID'] : maxId;
                    }

                    for (var i = 0; i < ids.length; i++) {
                        if (ids[i] !== i + 1) {
                            id = i + 1;

                            if (ids.indexOf(id) === -1) {
                                break;
                            } else {
                                id = 0;
                            }
                        }
                    }

                    if (id === 0) {
                        id = maxId + 1;
                    }
                    controllers.Entries.push({
                        'Controller ID': id,
                        'Controller Name': username,
                        'Description': username,
                        isUser: true
                    });
                    this.update({
                        collection: systemInfoCollection,
                        query: searchCriteria,
                        updateObj: {
                            $set: {
                                Entries: controllers.Entries
                            }
                        }
                    }, callback);
                } else {
                    for (var j = 0; j < controllers.Entries.length; j++) {
                        if (controllers.Entries[j]['Controller Name'] === username) {
                            controllers.Entries.splice(j, 1);
                            break;
                        }
                    }

                    this.update({
                        collection: systemInfoCollection,
                        query: searchCriteria,
                        updateObj: {
                            $set: {
                                Entries: controllers.Entries
                            }
                        }
                    }, callback);
                }
            });
        };
    }
    setupCfgRequired(callback) {
        logger.info('setupCfgRequired');
        this.update({
            collection: pointsCollection,
            query: {
                $or: [{
                    'Point Type.Value': 'Device'
                }, {
                    'Point Refs.PropertyName': 'Device Point'
                }]
            },
            updateObj: {
                $set: {
                    _cfgRequired: true
                }
            },
            options: {
                multi: true
            }
        }, callback);
    }
    createEmptyCollections(callback) {
        var collections = ['Alarms', 'Users', 'User Groups', 'historydata', 'versions', 'dev'];
        async.forEach(collections, (coll, cb) => {
            this.createCollection({
                collection: coll
            }, cb);
        }, callback);
    }
    setupDevCollection(callback) {
        this.insert({
            collection: 'dev',
            insertObj: {
                'item': 'distinct',
                'values': []
            }
        }, callback);
    }
    setupSystemInfo(callback) {
        var pjson = require('../package.json');
        var curVersion = pjson.version;
        var timezones = importconfig.timeZones;

        this.insert({
            collection: systemInfoCollection,
            insertObj: timezones
        }, (err, result) => {
            this.update({
                collection: systemInfoCollection,
                query: {
                    Name: 'Preferences'
                },
                updateObj: {
                    $set: {
                        'Time Zone': localTZ,
                        'InfoscanJS Version': curVersion
                    }
                }
            }, callback);
        });
    }
    setupPointRefsArray(callback) {
        logger.info('setupPointRefsArray');
        this.update({
            collection: pointsCollection,
            query: {
                'Point Type.Value': {
                    $nin: ['Imux']
                },
                'Point Refs': {
                    $exists: false
                }
            },
            updateObj: {
                $set: {
                    'Point Refs': []
                }
            },
            options: {
                multi: true
            }
        }, (err, result) => {
            callback(err);
        });
    }
    fixPowerMeters(callback) {
        var objs = {
            DemandInUpi: {
                name3: 'W3P SUM',
                newProp: 'DemandSumUpi'
            },
            UsageInUpi: {
                name3: 'WH3P SUM',
                newProp: 'UsageSumUpi'
            },
            KVARInUpi: {
                name3: 'MVR3 SUM',
                newProp: 'KVARSumUpi'
            }
        };

        var splitName = (meter) => {
            return meter.Name.split('_');
        };

        this.iterateCursor({
            collection: 'PowerMeters',
            query: {}
        }, (err, meter, cb) => {
            var names = {
                name1: splitName(meter)[0],
                name2: splitName(meter)[1],
                name4: splitName(meter)[3]
            };
            async.waterfall([(wfCb) => {
                this.getOne({
                    collection: 'points',
                    query: {
                        name1: names.name1,
                        name2: names.name2,
                        name4: names.name4,
                        name3: objs.DemandInUpi.name3
                    }
                }, (err, point) => {
                    if (!!point) {
                        var updateObj = {
                            $set: {}
                        };
                        updateObj.$set[objs.DemandInUpi.newProp] = point._id;
                        this.update({
                            collection: 'PowerMeters',
                            query: {
                                _id: meter._id
                            },
                            updateObj: updateObj
                        }, (err, result) => {
                            wfCb();
                        });
                    } else {
                        wfCb();
                    }
                });
            }, (wfCb) => {
                this.getOne({
                    collection: 'points',
                    query: {
                        name1: names.name1,
                        name2: names.name2,
                        name4: names.name4,
                        name3: objs.UsageInUpi.name3
                    }
                }, (err, point) => {
                    if (!!point) {
                        var updateObj = {
                            $set: {}
                        };
                        updateObj.$set[objs.UsageInUpi.newProp] = point._id;
                        this.update({
                            collection: 'PowerMeters',
                            query: {
                                _id: meter._id
                            },
                            updateObj: updateObj
                        }, (err, result) => {
                            wfCb();
                        });
                    } else {
                        wfCb();
                    }
                });
            }, (wfCb) => {
                this.getOne({
                    collection: 'points',
                    query: {
                        name1: names.name1,
                        name2: names.name2,
                        name4: names.name4,
                        name3: objs.KVARInUpi.name3
                    }
                }, (err, point) => {
                    if (!!point) {
                        var updateObj = {
                            $set: {}
                        };
                        updateObj.$set[objs.KVARInUpi.newProp] = point._id;
                        this.update({
                            collection: 'PowerMeters',
                            query: {
                                _id: meter._id
                            },
                            updateObj: updateObj
                        }, (err, result) => {
                            wfCb();
                        });
                    } else {
                        wfCb();
                    }
                });
            }], cb);
        }, (err, count) => {
            callback(err, count);
        });
    }
    changeUpis(callback) {
        const counterModel = new Counter();
        // rename schedule entries
        // drop pointinst and devinst indexes
        var centralDeviceUPI = 0;
        var newPoints = 'new_points';
        var points = 'points';

        var updateDependencies = (oldId, newId, collection, cb) => {
            this.iterateCursor({
                collection: collection,
                query: {
                    $or: [{
                        'Point Refs.Value': oldId
                    }, {
                        'Point Refs.PointInst': oldId
                    }, {
                        'Point Refs.DevInst': oldId
                    }]
                }
            }, (err, dep, cb2) => {
                var refs = dep['Point Refs'];
                for (var i = 0; i < refs.length; i++) {
                    if (refs[i].Value === oldId) {
                        // logger.info('changing Value', oldId, collection);
                        refs[i].Value = newId;
                    }
                    if (refs[i].PointInst === oldId) {
                        // logger.info('changing PointInst', oldId, collection);
                        refs[i].PointInst = newId;
                    }
                    if (refs[i].DevInst === oldId) {
                        // logger.info('changing DevInst', oldId, collection);
                        refs[i].DevInst = newId;
                    }
                }
                // logger.info(dep['Point Refs']);
                this.update({
                    collection: collection,
                    updateObj: dep,
                    query: {
                        _id: dep._id
                    }
                }, cb2);
            }, cb);
        };

        this.getOne({
            collection: 'SystemInfo',
            query: {
                Name: 'Preferences'
            }
        }, (err, sysinfo) => {
            centralDeviceUPI = sysinfo['Central Device UPI'];
            this.iterateCursor({
                collection: points,
                query: {},
                sort: {
                    _id: 1
                }
            }, (err, doc, cb) => {
                doc._oldUpi = doc._id;
                counterModel.getUpiForPointType(doc['Point Type'].eValue, (err, newUpi) => {
                    if (doc._id === centralDeviceUPI) {
                        centralDeviceUPI = newUpi;
                    }

                    doc._newUpi = newUpi;
                    this.update({
                        query: {
                            _id: doc._oldUpi
                        },
                        updateObj: doc,
                        collection: points
                    }, (err, result) => {
                        cb();
                    });
                });
            }, (err, count) => {
                this.update({
                    collection: 'SystemInfo',
                    query: {
                        Name: 'Preferences'
                    },
                    updateObj: {
                        $set: {
                            'Central Device UPI': centralDeviceUPI
                        }
                    }
                }, (err, sysinfo) => {
                    this.iterateCursor({
                        collection: points,
                        query: {}
                    }, (err, doc, cb) => {
                        doc._id = doc._newUpi;

                        this.insert({
                            collection: newPoints,
                            insertObj: doc
                        }, (err) => {
                            cb(err);
                        });
                    }, (err, count) => {
                        logger.info('count', err, count);
                        this.iterateCursor({
                            collection: newPoints,
                            query: {}
                        }, (err, doc, cb) => {
                            updateDependencies(doc._oldUpi, doc._newUpi, newPoints, (err, count) => {
                                cb(err);
                            });
                        }, (err, count) => {
                            callback(err);
                        });
                    });
                });
            });
        });
    }
    convertHistoryReports(callback) {
        logger.info('converting history reports');
        this.iterateCursor({
            collection: 'OldHistLogs',
            query: {}
        }, (err, point, next) => {
            var guide = importconfig.reportGuide,
                template = Config.Templates.getTemplate('Report'),
                report = lodash.merge(template, guide);

            report['Report Type'].Value = 'History';
            report['Report Type'].eValue = Config.Enums['Report Types'].History.enum;
            report['Point Refs'] = [];
            report._pStatus = 0;
            report._id = point._id;
            report.Name = point.Name;
            //report._Name = point.Name.toLowerCase();
            delete report._Name;

            var names = report.Name.split('_'),
                index = 0;

            for (var i = 1; i <= names.length; i++) {
                report['name' + i] = names[i - 1];
                report['_name' + i] = names[i - 1].toLowerCase();
            }
            report['Report Config'].reportTitle = report.Name;

            report['Report Config'].interval.period = 'Minute';
            report['Report Config'].interval.value = Math.floor(point.Interval / 60);
            report['Report Config'].duration.selectedRange = 'Today';

            async.forEachSeries(point.upis, (upi, cb) => {
                this.getOne({
                    collection: pointsCollection,
                    query: {
                        _id: upi
                    },
                    fields: {
                        Name: 1,
                        Value: 1,
                        'Point Type': 1,
                        'Point Refs': 1,
                        'Engineering Units': 1
                    }
                }, (err, ref) => {
                    if (!!ref) {
                        report['Report Config'].columns.push({
                            'colName': ref.Name,
                            'colDisplayName': ref.Name,
                            'valueType': 'None',
                            'operator': '',
                            'calculation': [],
                            'canCalculate': true,
                            'includeInReport': true,
                            'includeInChart': true,
                            'multiplier': 1,
                            'precision': 5,
                            'pointType': ref['Point Type'].Value,
                            'units': !!ref['Engineering Units'] ? ref['Engineering Units'].Value : '',
                            'canBeCharted': true,
                            'yaxisGroup': 'A',
                            'AppIndex': index + 1
                        });
                        report['Point Refs'].push({
                            'PropertyName': 'Column Point',
                            'PropertyEnum': 131,
                            'AppIndex': index + 1,
                            'isDisplayable': true,
                            'isReadOnly': false,
                            'Value': ref._id,
                            'PointName': '',
                            'PointType': 0,
                            'PointInst': 0,
                            'DevInst': 0
                        });
                        report = Config.EditChanges.applyUniquePIDLogic({
                            point: report,
                            refPoint: ref
                        }, index);
                        report._actvAlmId = ObjectID('000000000000000000000000');
                        index++;
                    }
                    cb(null);
                });
            }, (err) => {
                this.insert({
                    collection: pointsCollection,
                    insertObj: report
                }, next);
            });
        }, callback);
    }
    convertTotalizerReports(callback) {
        logger.info('converting totalizer reports');
        const counterModel = new Counter();
        var criteria = {
            collection: 'Totalizers',
            query: {}
        };
        this.iterateCursor(criteria, (err, doc, cb) => {
            var guide = importconfig.reportGuide;
            var template = Config.Templates.getTemplate('Report');
            var report = lodash.merge(template, guide);
            var refIds = [];

            report['Report Type'].Value = 'Totalizer';
            report['Report Type'].eValue = Config.Enums['Report Types'].Totalizer.enum;
            report['Point Refs'] = [];
            report._pStatus = 0;
            report.Name = doc.Name;
            //report._Name = point.Name.toLowerCase();
            delete report._Name;

            var names = report.Name.split('_');

            for (var i = 1; i <= names.length; i++) {
                report['name' + i] = names[i - 1];
                report['_name' + i] = names[i - 1].toLowerCase();
            }
            report['Report Config'].reportTitle = report.Name;

            switch (doc['Reset Interval']) {
                case 'Year':
                    report['Report Config'].interval.period = 'Month';
                    report['Report Config'].interval.value = 1;
                    report['Report Config'].duration.selectedRange = 'This Year';
                    break;
                case 'Month':
                    report['Report Config'].interval.period = 'Day';
                    report['Report Config'].interval.value = 1;
                    report['Report Config'].duration.selectedRange = 'This Month';
                    break;
                case 'Day':
                case 'Hour':
                case 'None':
                    report['Report Config'].interval.period = 'Hour';
                    report['Report Config'].interval.value = 1;
                    report['Report Config'].duration.selectedRange = 'Last 7 Days';
                    break;
            }

            async.forEachSeries(doc.Monitors, (monitor, cb2) => {
                var monitorCriteria = {
                    collection: 'points',
                    query: {
                        _id: monitor['Monitor upi']
                    },
                    fields: {
                        Name: 1,
                        Value: 1,
                        'Point Type': 1,
                        'Point Refs': 1,
                        'Engineering Units': 1
                    }
                };

                this.getOne(monitorCriteria, (err, ref) => {
                    if (!!ref) {
                        if (refIds.indexOf(ref._id) < 0) {
                            refIds.push(ref._id);

                            report['Point Refs'].push({
                                'PropertyName': 'Column Point',
                                'PropertyEnum': 131,
                                'AppIndex': report['Point Refs'].length + 1,
                                'isDisplayable': true,
                                'isReadOnly': false,
                                'Value': monitor['Monitor upi'],
                                'PointName': '',
                                'PointType': 0,
                                'PointInst': 0,
                                'DevInst': 0
                            });
                        }
                        report['Report Config'].columns.push({
                            'colName': ref.Name,
                            'colDisplayName': ref.Name,
                            'valueType': 'None',
                            'operator': monitor['Monitor Property'],
                            'calculation': [],
                            'canCalculate': true,
                            'includeInReport': true,
                            'includeInChart': true,
                            'multiplier': 1,
                            'precision': 3,
                            'pointType': ref['Point Type'].Value,
                            'units': !!ref['Engineering Units'] ? ref['Engineering Units'].Value : '',
                            'canBeCharted': true,
                            'yaxisGroup': 'A',
                            'AppIndex': refIds.indexOf(ref._id)
                        });
                        report = Config.EditChanges.applyUniquePIDLogic({
                            point: report,
                            refPoint: ref
                        }, refIds.indexOf(ref._id));
                        report._actvAlmId = ObjectID('000000000000000000000000');
                    }
                    cb2(null);
                });
            }, (err) => {
                counterModel.getUpiForPointType(report['Point Type'].eValue, (err, newUpi) => {
                    report._id = newUpi;
                    this.insert({
                        collection: pointsCollection,
                        insertObj: report
                    }, cb);
                });
            });
        }, (err, count) => {
            logger.info('convertTotalizerReports', err, count);
            callback(err);
        });
    }
    convertScheduleEntries(callback) {
        logger.info('convertScheduleEntries');
        const counterModel = new Counter();
        // get sched entry template & set pstatus to 0
        // get all schedule entries from SE collection
        // get _id from upi's collection
        // set _parentUpi to SE's _schedUPI
        // set name1 "Schedule Entry", name2 = _id
        // if _parentUpi is 0, create new scedule point with control point's value for id, name from Point Name
        // if name is 3 or fewer segments, the next available segment is "Segment", if 4 segments, last segment is "XYZ Segment"
        var scheduleEntryTemplate = Config.Templates.getTemplate('Schedule Entry');
        var scheduleTemplate = Config.Templates.getTemplate('Schedule');

        scheduleEntryTemplate._pStatus = 0;
        scheduleEntryTemplate._cfgRequired = false;
        scheduleTemplate._pStatus = 0;
        scheduleTemplate._cfgRequired = false;

        this.get({
            collection: 'ScheduleEntries',
            query: {}
        }, (err, oldScheduleEntries) => {
            logger.info('results', oldScheduleEntries.length);
            async.forEachSeries(oldScheduleEntries, (oldScheduleEntry, forEachCallback) => {
                /*if (oldScheduleEntry["Control Value"].eValue !== undefined) {
                  scheduleEntryTemplate["Control Value"].ValueOptions = refPoint.Value.ValueOptions;
                }*/

                counterModel.getUpiForPointType(scheduleEntryTemplate['Point Type'].eValue, (err, newUpi) => {
                    scheduleEntryTemplate._id = newUpi;
                    scheduleEntryTemplate._parentUpi = oldScheduleEntry._schedUpi;
                    scheduleEntryTemplate.name1 = 'Schedule Entry';
                    scheduleEntryTemplate.name2 = newUpi.toString();
                    scheduleEntryTemplate.Name = scheduleEntryTemplate.name1 + '_' + scheduleEntryTemplate.name2;
                    /*scheduleEntryTemplate._name1 = scheduleEntryTemplate.name1.toLowerCase();
                    scheduleEntryTemplate._name2 = scheduleEntryTemplate.name2.toLowerCase();
                    scheduleEntryTemplate._Name = scheduleEntryTemplate.Name.toLowerCase();*/

                    scheduleEntryTemplate['Control Point'] = oldScheduleEntry['Control Point'];
                    scheduleEntryTemplate['Host Schedule'].Value = oldScheduleEntry.hostEntry;

                    for (var prop in oldScheduleEntry) {
                        if (scheduleEntryTemplate.hasOwnProperty(prop) && prop !== '_id') {
                            scheduleEntryTemplate[prop] = oldScheduleEntry[prop];
                        }
                    }

                    scheduleEntryTemplate['Point Refs'] = [];

                    delete scheduleEntryTemplate._Name;
                    if (scheduleEntryTemplate['Control Point'].Value !== scheduleEntryTemplate._parentUpi) {
                        this.insertScheduleEntry(scheduleEntryTemplate, (err) => {
                            forEachCallback(err);
                        });
                    } else {
                        logger.info('not inserting SE', scheduleEntryTemplate._id);
                        forEachCallback();
                    }
                });
            }, (err) => {
                logger.info('convertScheduleEntries err', err);
                return callback(err);
            });
        });
    }
    insertScheduleEntry(scheduleEntry, callback) {
        this.insert({
            collection: pointsCollection,
            insertObj: scheduleEntry
        }, callback);
    }
    cleanupDB(callback) {
        this.dropCollection({
            collection: pointsCollection
        }, () => {
            this.update({
                collection: 'new_points',
                query: {
                    _newUpi: {
                        $exists: 1
                    }
                },
                updateObj: {
                    $unset: {
                        _newUpi: 1
                    }
                },
                options: {
                    multi: true
                }
            }, (err, result) => {
                this.rename({
                    from: 'new_points',
                    to: 'points'
                }, () => {
                    this.dropCollection({
                        collection: 'ScheduleEntries'
                    }, () => {
                        this.dropCollection({
                            collection: 'OldHistLogs'
                        }, () => {
                            this.dropCollection({
                                collection: 'Totalizers'
                            }, callback);
                        });
                    });
                });
            });
        });
    }
    updateGPLReferences(callback) {
        logger.info('starting updateGPLReferences');
        this.get({
            collection: pointsCollection,
            query: {
                'gplLabel': {
                    $exists: 1
                }
            }
        }, (err, gplBlocks) => {
            logger.info('gplBlocks.length = ' + gplBlocks.length);
            async.eachSeries(gplBlocks, (gplBlock, cb) => {
                gplBlock.name4 = gplBlock.gplLabel;
                gplBlock.Name = gplBlock.name1 + '_' + gplBlock.name2 + '_' + gplBlock.name3 + '_' + gplBlock.name4;

                gplBlock._name4 = gplBlock.name4.toLowerCase();
                gplBlock._Name = gplBlock.Name.toLowerCase();
                delete gplBlock.gplLabel;
                this.update({
                    collection: pointsCollection,
                    query: {
                        _id: gplBlock._id
                    },
                    updateObj: gplBlock
                }, (err, result) => {
                    if (err) {
                        logger.info('updateGPLReferences1 err', err);
                    }

                    this.get({
                        collection: pointsCollection,
                        query: {
                            'Point Refs.Value': gplBlock._id,
                            'Point Type.Value': 'Sequence'
                        },
                        fields: {
                            'Point Refs': 1
                        }
                    }, (err, gplRefs) => {
                        async.forEachSeries(gplRefs, (gplRef, cb2) => {
                            for (var m = 0; m < gplRef['Point Refs'].length; m++) {
                                if (gplRef['Point Refs'][m].Value === gplBlock._id) {
                                    gplRef['Point Refs'][m].PointName = gplBlock.Name;
                                }
                            }
                            logger.info(1, gplRef['Point Refs']);
                            this.update({
                                collection: pointsCollection,
                                query: {
                                    _id: gplBlock._id
                                },
                                updateObj: {
                                    $set: {
                                        'Point Refs': gplRef['Point Refs']
                                    }
                                }
                            }, (err, result) => {
                                if (err) {
                                    logger.info('updateGPLReferences2 err', err);
                                }
                                cb2(null);
                            });
                        }, (err) => {
                            cb(null);
                        });
                    });
                });
            }, (err) => {
                callback(null);
            });
        });
    }
    updateGPLRefs(callback) {
        this.get({
            collection: pointsCollection,
            query: {
                'Point Type.Value': 'Sequence',
                'SequenceData': {
                    $exists: 1
                }
            }
        }, (err, sequences) => {
            async.forEachSeries(sequences, (sequence, cb) => {
                this.addReferencesToSequencePointRefs(sequence, () => {
                    this.update({
                        collection: pointsCollection,
                        query: {
                            _id: sequence._id
                        },
                        updateObj: sequence
                    }, cb);
                });
            }, callback);
        });
    }
    initImport(callback) {
        // remove name
        // remove VAV
        // model type property set isreadonly to false
        this.createEmptyCollections((err) => {
            this.setupDevCollection((err) => {
                this.setupSystemInfo((err) => {
                    this.setupCounters((err) => {
                        this.setupPointRefsArray((err) => {
                            this.addDefaultUser((err) => {
                                this.setupCfgRequired((err) => {
                                    this.setupProgramPoints((err) => {
                                        callback(null);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    updateIndexes(callback) {
        var indexes = [{
            index: {
                name1: 1,
                name2: 1,
                name3: 1,
                name4: 1
            },
            options: {
                name: 'name1-4'
            },
            collection: pointsCollection
        }, {
            index: {
                _name1: 1,
                _name2: 1,
                _name3: 1,
                _name4: 1
            },
            options: {
                name: '_name1-4'
            },
            collection: pointsCollection
        }, {
            index: {
                Name: 1
            },
            options: {
                unique: true
            },
            collection: pointsCollection
        }, {
            index: {
                _pStatus: 1
            },
            options: {},
            collection: pointsCollection
        }, {
            index: {
                'Point Refs.Value': 1
            },
            options: {},
            collection: pointsCollection
        }, {
            index: {
                'Point Refs.DevInst': 1
            },
            options: {},
            collection: pointsCollection
        }, {
            index: {
                'Point Refs.PointInst': 1
            },
            options: {},
            collection: pointsCollection
        }, {
            index: {
                'Point Refs.PropertyName': 1
            },
            options: {},
            collection: pointsCollection
        }, {
            index: {
                'Point Refs.PropertyEnum': 1
            },
            options: {},
            collection: pointsCollection
        }, {
            index: {
                'Point Refs.PointInst': 1,
                'Point Refs.PropertyEnum': 1
            },
            options: {},
            collection: pointsCollection
        }, {
            index: {
                'Point Type.Value': 1,
                'name1': 1,
                'name2': 1,
                'name3': 1,
                'name4': 1
            },
            options: {
                name: 'Pt, name1-4'
            },
            collection: pointsCollection
        }, {
            index: {
                'Point Type.Value': 1,
                'Network Segment.Value': 1
            },
            options: {},
            collection: pointsCollection
        }, {
            index: {
                'Point Type.Value': 1,
                _name1: 1,
                _name2: 1,
                _name3: 1,
                _name4: 1
            },
            options: {
                name: 'PT, _name1-4'
            },
            collection: pointsCollection
        }, {
            index: {
                name1: 1,
                name2: 1,
                name3: 1,
                name4: 1
            },
            options: {
                name: 'name1-4'
            },
            collection: 'new_points'
        }, {
            index: {
                _name1: 1,
                _name2: 1,
                _name3: 1,
                _name4: 1
            },
            options: {
                name: '_name1-4'
            },
            collection: 'new_points'
        }, {
            index: {
                Name: 1
            },
            options: {
                unique: true
            },
            collection: 'new_points'
        }, {
            index: {
                _pStatus: 1
            },
            options: {},
            collection: 'new_points'
        }, {
            index: {
                'Point Refs.Value': 1
            },
            options: {},
            collection: 'new_points'
        }, {
            index: {
                'Point Refs.DevInst': 1
            },
            options: {},
            collection: 'new_points'
        }, {
            index: {
                'Point Refs.PointInst': 1
            },
            options: {},
            collection: 'new_points'
        }, {
            index: {
                'Point Refs.PropertyName': 1
            },
            options: {},
            collection: 'new_points'
        }, {
            index: {
                'Point Refs.PropertyEnum': 1
            },
            options: {},
            collection: 'new_points'
        }, {
            index: {
                'Point Refs.PointInst': 1,
                'Point Refs.PropertyEnum': 1
            },
            options: {},
            collection: 'new_points'
        }, {
            index: {
                'Point Type.Value': 1,
                'name1': 1,
                'name2': 1,
                'name3': 1,
                'name4': 1
            },
            options: {
                name: 'Pt, name1-4'
            },
            collection: 'new_points'
        }, {
            index: {
                'Point Type.Value': 1,
                'Network Segment.Value': 1
            },
            options: {},
            collection: 'new_points'
        }, {
            index: {
                'Point Type.Value': 1,
                _name1: 1,
                _name2: 1,
                _name3: 1,
                _name4: 1
            },
            options: {
                name: 'PT, _name1-4'
            },
            collection: 'new_points'
        }, {
            index: {
                'msgTime': 1
            },
            options: {},
            collection: 'Alarms'
        }, {
            index: {
                'msgCat': 1
            },
            options: {},
            collection: 'Alarms'
        }, {
            index: {
                'almClass': 1
            },
            options: {},
            collection: 'Alarms'
        }, {
            index: {
                'Name1': 1
            },
            options: {},
            collection: 'Alarms'
        }, {
            index: {
                'Name2': 1
            },
            options: {},
            collection: 'Alarms'
        }, {
            index: {
                'Name3': 1
            },
            options: {},
            collection: 'Alarms'
        }, {
            index: {
                'Name4': 1
            },
            options: {},
            collection: 'Alarms'
        }, {
            index: {
                'ackStatus': 1,
                'msgTime': 1
            },
            options: {},
            collection: 'Alarms'
        }, {
            index: {
                'Users': 1
            },
            options: {},
            collection: 'User Groups'
        }, {
            index: {
                username: 1
            },
            options: {
                unique: true
            },
            collection: 'Users'
        }, {
            index: {
                'upi': 1
            },
            options: {},
            collection: 'historydata'
        }, {
            index: {
                'timestamp': -1
            },
            options: {},
            collection: 'historydata'
        }, {
            index: {
                'upi': 1,
                'timestamp': 1
            },
            options: {
                unique: true
            },
            collection: 'historydata'
        }];

        async.forEachSeries(indexes, (index, indexCB) => {
            this.ensureIndex({
                collection: index.collection,
                index: index.index,
                options: index.options
            }, (err, IndexName) => {
                logger.info(IndexName, 'err:', err);
                indexCB(null);
            });
        }, (err) => {
            logger.info('done with indexes');
            callback(err);
        });
    }
    updateMultiplexer(point, callback) {
        if (point['Point Type'].Value === 'Multiplexer') {
            point['Select State'].eValue = 1;
            point['Select State'].Value = 'On';
        }
        return callback(null);
    }
    updateGPLBlocks(point, callback) {
        var parentUpi = point._parentUpi;
        var pointTypes = ['Alarm Status', 'Analog Selector', 'Average', 'Binary Selector', 'Comparator', 'Delay', 'Digital Logic', 'Economizer', 'Enthalpy', 'Logic', 'Math', 'Multiplexer', 'Proportional', 'Ramp', 'Select Value', 'Setpoint Adjust', 'Totalizer'];
        if (pointTypes.indexOf(point['Point Type'].Value) !== -1) {
            for (var prop in point) {
                if (point[prop].ValueType === 8) {
                    if (parentUpi !== 0) {
                        point[prop].isReadOnly = true;
                    } else {
                        point[prop].isReadOnly = false;
                    }
                }
            }

            if (point['Shutdown Point'].Value === 0) {
                point['Shutdown Control'].Value = true;
            }

            switch (point['Point Type'].Value) {
                case 'Proportional':
                case 'Binary Selector':
                case 'Analog Selector':
                    point['Setpoint Value'].isReadOnly = (parentUpi !== 0) ? true : false;
                    break;
                case 'Math':
                case 'Multiplexer':
                    point['Input 1 Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
                    point['Input 2 Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
                    break;
                case 'Delay':
                    point['Trigger Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
                    break;
                case 'Comparator':
                    point['Input 2 Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
                    break;
                case 'Totalizer':
                    point['Reset Time'].Value *= 60;
                    break;
            }

            /*point.name4 = point.gplNameSegment;
            point.Name = point.name1 + "_" + point.name2 + "_" + point.name3 + "_" + point.name4;
            point._name4 = point.name4.toLowerCase();
            point._Name = point.Name.toLowerCase();
            delete point.gplNameSegment;*/

            /*db.collection(pointsCollection).update({
              _id: point._id
            }, point, function(err, result) {*/

            callback(null);
            // });
        } else {
            callback(null);
        }
    }
    updateTimeZones(point, cb) {
        if (!point.hasOwnProperty('Time Zone') && point['Point Type'].Value === 'Device') {
            var timezones = Config.Enums['Time Zones'];

            point['Time Zone'] = Config.Templates.getTemplate('Device')['Time Zone'];
            point['Time Zone'].eValue = localTZ;

            for (var prop in timezones) {
                if (timezones[prop].enum === localTZ) {
                    point['Time Zone'].Value = prop;
                }
            }
        }
        cb(null);
    }
    updateModels(point, cb) {
        Config.Utility.updDevModel({
            point: point
        });
        cb();
    }
    updateCfgRequired(point, callback) {
        if (['Schedule', 'Schedule Entry'].indexOf(point['Point Type'].Value) > -1) {
            point._cfgRequired = false;
        }
        callback(null);
    }
    updateOOSValue(point, callback) {
        var pointTemplate = Config.Templates.getTemplate(point['Point Type'].Value);
        //logger.info(point["Point Type"].Value, pointTemplate["Point Type"].Value);
        if (pointTemplate.Value !== undefined && pointTemplate.Value.oosValue !== undefined) {
            point.Value.oosValue = (point.Value.eValue !== undefined) ? point.Value.eValue : point.Value.Value;
        }
        callback(null);
    }
    addTrendProperties(point, callback) {
        var pt = point['Point Type'].Value;
        if (pt === 'Optimum Start') {
            point['Trend Enable'] = Config.Templates.getTemplate(pt)['Trend Enable'];
            point['Trend Interval'] = Config.Templates.getTemplate(pt)['Trend Interval'];
            point['Trend Last Status'] = Config.Templates.getTemplate(pt)['Trend Last Status'];
            point['Trend Last Value'] = Config.Templates.getTemplate(pt)['Trend Last Value'];
            point['Trend Samples'] = Config.Templates.getTemplate(pt)['Trend Samples'];
        }
        callback(null);
    }
    updateScriptPoint(point, callback) {
        if (point['Point Type'].Value === 'Script') {
            point._cfgRequired = false;
            if (!point.hasOwnProperty('Development Source File')) {
                point['Development Source File'] = '';
            }
            delete point['Script Filename'];
        }
        callback(null);
    }
    updateSensorPoints(point, callback) {
        if (point['Point Type'].Value === 'Sensor') {
            var sensorTemplate = Config.Templates.getTemplate(point['Point Type'].Value),
                updateProps = () => {
                    for (var prop in sensorTemplate) {
                        if (!point.hasOwnProperty(prop) || prop === 'Point Refs') {
                            point[prop] = sensorTemplate[prop];
                        }
                    }
                };

            point._cfgRequired = false;

            if (!!point.Remarks) {
                point.name1 = 'Sensor';
                point.name2 = '';
                point.name3 = '';
                point.name4 = '';

                for (var i = 0; i < point.Remarks.Value.length; i++) {
                    if (Config.Utility.isPointNameCharacterLegal(point.Remarks.Value[i])) {
                        point.name2 += point.Remarks.Value[i];
                    }
                }
                point.Name = point.name1 + '_' + point.name2;
                delete point.Remarks;
                this.updateNameSegments(point, (err) => {
                    this.get({
                        collection: pointsCollection,
                        query: {
                            _name1: point._name1,
                            _name2: point._name2
                        },
                        fields: {
                            _name1: 1,
                            _name2: 1,
                            _name3: 1,
                            _name4: 1
                        }
                    }, (err, points) => {
                        var nextNum = 1,
                            name3Number;
                        for (var j = 0; j < points.length; j++) {
                            name3Number = parseInt(points[j]._name3, 10);
                            if (nextNum < name3Number) {
                                nextNum = name3Number + 1;
                            }
                        }
                        if (nextNum > 1) {
                            point.name3 = nextNum.toString();
                            point.Name += '_' + point.name3;
                        }
                        this.updateNameSegments(point, (err) => {
                            delete point._Name;
                            updateProps();
                            this.update({
                                collection: pointsCollection,
                                query: {
                                    _id: point._id
                                },
                                updateObj: point
                            }, callback);
                        });
                    });
                });
            } else {
                updateProps();
                this.update({
                    collection: pointsCollection,
                    query: {
                        _id: point._id
                    },
                    updateObj: point
                }, callback);
            }
        } else {
            callback(null);
        }
    }
    updateProgramPoints(point, cb) {
        if (point['Point Type'].Value === 'Script') {
            this.update({
                collection: pointsCollection,
                query: {
                    'Point Type.Value': 'Program',
                    $or: [{
                        'Script Point.Value': point._id
                    }, {
                        'Point Refs': {
                            $elemMatch: {
                                Value: point._id,
                                PropertyEnum: 270
                            }
                        }
                    }]
                },
                updateObj: {
                    $set: {
                        'Boolean Register Names': point['Boolean Register Names'],
                        'Integer Register Names': point['Integer Register Names'],
                        'Point Register Names': point['Point Register Names'],
                        'Real Register Names': point['Real Register Names']
                    }
                },
                options: {
                    multi: true
                }
            }, cb);
        } else {
            cb(null);
        }
    }
    addReferencesToSlideShowPointRefs(point, cb) {
        var referencedSlides = point.Slides,
            upiList = [],
            c,
            pRefAppIndex = 1, // skipping 0 for "Device Point"
            matchUpisToPointRefs = () => {
                var setPointRefIndex = (slides) => {
                    var slide;
                    var pRef;
                    var filterPointRefs = (pointRef) => {
                        return pointRef.Value === slide.display && pointRef.PropertyName === 'Slide Display';
                    };

                    if (!!slides) {
                        for (c = 0; c < slides.length; c++) {
                            slide = slides[c];
                            if (!!slide.display) {
                                pRef = point['Point Refs'].filter(filterPointRefs);

                                pRef = (!!pRef && pRef.length > 0 ? pRef[0] : null);

                                if (!!pRef) {
                                    slide.pointRefIndex = pRef.AppIndex;
                                    // delete slide.display; // TODO to clear out duplicate data (point ref contains the UPI)
                                }
                            }
                        }
                    }
                };

                setPointRefIndex(referencedSlides);
                cb();
            },
            makePointRef = (refPoint) => {
                var pointType = refPoint['Point Type'].Value,
                    baseRef = {
                        'PropertyName': 'Slide Display',
                        'PropertyEnum': Config.Enums.Properties['Slide Display'].enum,
                        'Value': refPoint._id,
                        'AppIndex': pRefAppIndex++,
                        'isDisplayable': true,
                        'isReadOnly': false,
                        'PointName': refPoint.Name,
                        'PointInst': (refPoint._pStatus !== 2) ? refPoint._id : 0,
                        'DevInst': (Config.Utility.getPropertyObject('Device Point', refPoint) !== null) ? Config.Utility.getPropertyObject('Device Point', refPoint).Value : 0,
                        'PointType': Config.Enums['Point Types'][pointType].enum || 0
                    };

                return baseRef;
            },
            setPointData = () => {
                var pushPointObjectsUPIs = (slides) => {
                    var slide;

                    if (!!slides) {
                        for (c = 0; c < slides.length; c++) {
                            slide = slides[c];

                            if (!!slide.display && slide.display > 0) {
                                if (upiList.indexOf(slide.display) === -1) {
                                    upiList.push(slide.display);
                                }
                            }
                        }
                    }
                };

                pushPointObjectsUPIs(referencedSlides);

                if (!!upiList && upiList.length > 0) {
                    this.get({
                        collection: pointsCollection,
                        query: {
                            _id: {
                                $in: upiList
                            }
                        }
                    }, (err, points) => {
                        var referencedPoint;
                        if (!!points) {
                            for (c = 0; c < points.length; c++) {
                                referencedPoint = points[c];
                                point['Point Refs'].push(makePointRef(referencedPoint));
                            }
                        }
                        matchUpisToPointRefs();
                    });
                } else {
                    cb();
                }
            };

        setPointData();
    }
    addReferencesToDisplayPointRefs(point, cb) {
        var screenObjectsCollection = point['Screen Objects'],
            upiList = [],
            upiCrossRef = [],
            c,
            pRefAppIndex = 0,
            getScreenObjectType = (screenObjectType) => {
                var propEnum = 0,
                    propName = '';

                switch (screenObjectType) {
                    case 0:
                        propEnum = Config.Enums.Properties['Display Dynamic'].enum;
                        propName = 'Display Dynamic';
                        break;
                    case 1:
                        propEnum = Config.Enums.Properties['Display Button'].enum;
                        propName = 'Display Button';
                        break;
                    case 3:
                        propEnum = Config.Enums.Properties['Display Animation'].enum;
                        propName = 'Display Animation';
                        break;
                    case 7:
                        propEnum = Config.Enums.Properties['Display Trend'].enum;
                        propName = 'Display Trend';
                        break;
                    default:
                        propEnum = 0;
                        propName = '';
                        break;
                }

                return {
                    name: propName,
                    enum: propEnum
                };
            },
            getCrossRefByUPIandName = (upi, propertyName) => {
                return upiCrossRef.filter((ref) => {
                    return ref.upi === upi && ref.PropertyName === propertyName;
                });
            },
            getCrossRefByUPI = (upi) => {
                return upiCrossRef.filter((ref) => {
                    return ref.upi === upi;
                });
            },
            matchUpisToPointRefs = () => {
                var setPointRefIndex = (screenObjects) => {
                    var screenObject;
                    var prop;
                    var pRef;
                    var filterPointRefs = (pointRef) => {
                        return pointRef.Value === screenObject.upi && pointRef.PropertyName === prop.name;
                    };

                    if (!!screenObjects) {
                        for (c = 0; c < screenObjects.length; c++) {
                            screenObject = screenObjects[c];
                            if (!!screenObject.upi) {
                                prop = getScreenObjectType(screenObject['Screen Object']);
                                pRef = point['Point Refs'].filter(filterPointRefs);

                                pRef = (!!pRef && pRef.length > 0 ? pRef[0] : null);

                                if (!!pRef) {
                                    screenObject.pointRefIndex = pRef.AppIndex;
                                    // delete screenObject.upi; // TODO to clear out duplicate data (point ref contains the UPI)
                                }
                            }
                        }
                    }
                };

                setPointRefIndex(screenObjectsCollection);
                cb();
            },
            makePointRef = (refPoint, propName, propType) => {
                var pointType = refPoint['Point Type'].Value,
                    //pointRef.DevInst =
                    baseRef = {
                        'PropertyName': propName,
                        'PropertyEnum': propType,
                        'Value': refPoint._id,
                        'AppIndex': pRefAppIndex++,
                        'isDisplayable': true,
                        'isReadOnly': false,
                        'PointName': refPoint.Name,
                        'PointInst': (refPoint._pStatus !== 2) ? refPoint._id : 0,
                        'DevInst': (Config.Utility.getPropertyObject('Device Point', refPoint) !== null) ? Config.Utility.getPropertyObject('Device Point', refPoint).Value : 0,
                        'PointType': Config.Enums['Point Types'][pointType].enum || 0
                    };

                return baseRef;
            },
            setDisplayPointData = () => {
                var pushScreenObjectsUPIs = (screenObjects) => {
                    var screenObject,
                        prop;

                    if (!!screenObjects) {
                        for (c = 0; c < screenObjects.length; c++) {
                            screenObject = screenObjects[c];
                            prop = getScreenObjectType(screenObject['Screen Object']);

                            if (!!screenObject.upi && screenObject.upi > 0) {
                                if (upiList.indexOf(screenObject.upi) === -1) {
                                    upiList.push(screenObject.upi);
                                }

                                if (getCrossRefByUPIandName(screenObject.upi, prop.name).length === 0) {
                                    upiCrossRef.push({
                                        upi: screenObject.upi,
                                        name: prop.name,
                                        type: prop.enum
                                    });
                                }
                            }
                        }
                    }
                };

                pushScreenObjectsUPIs(screenObjectsCollection);

                if (!!upiList && upiList.length > 0) {
                    this.get({
                        collection: pointsCollection,
                        query: {
                            _id: {
                                $in: upiList
                            }
                        }
                    }, (err, points) => {
                        var referencedPoint,
                            neededRefs,
                            i;
                        if (!!points) {
                            for (c = 0; c < points.length; c++) {
                                referencedPoint = points[c];
                                neededRefs = getCrossRefByUPI(referencedPoint._id); // all types of screen objects
                                for (i = 0; i < neededRefs.length; i++) {
                                    point['Point Refs'].push(makePointRef(referencedPoint, neededRefs[i].name, neededRefs[i].enum));
                                }
                            }
                        }
                        matchUpisToPointRefs();
                    });
                } else {
                    cb();
                }
            };

        setDisplayPointData();
    }
    addReferencesToSequencePointRefs(point, cb) {
        var blocks = point.SequenceData && point.SequenceData.sequence && point.SequenceData.sequence.block,
            dynamics = point.SequenceData && point.SequenceData.sequence && point.SequenceData.sequence.dynamic,
            upiList = [],
            upiCrossRef = [],
            skipTypes = ['Constant'],
            c,
            pRefAppIndex = 1,
            getCrossRefByUPIandName = (upi, propertyName) => {
                return upiCrossRef.filter((ref) => {
                    return ref.upi === upi && ref.PropertyName === propertyName;
                });
            },
            getCrossRefByUPI = (upi) => {
                return upiCrossRef.filter((ref) => {
                    return ref.upi === upi;
                });
            },
            matchUpisToPointRefs = () => {
                var setPointRefIndex = (gplObjects, propertyName) => {
                    var gplObject;
                    var pRef;
                    var filterPointRefs = (pointRef) => {
                        return pointRef.Value === gplObject.upi && pointRef.PropertyName === propertyName;
                    };

                    if (!!gplObjects) {
                        for (c = 0; c < gplObjects.length; c++) {
                            gplObject = gplObjects[c];
                            if (gplObject.upi && skipTypes.indexOf(gplObject.blockType) === -1) {
                                if (!!gplObject.upi) {
                                    pRef = point['Point Refs'].filter(filterPointRefs);

                                    pRef = (!!pRef && pRef.length > 0 ? pRef[0] : null);

                                    if (!!pRef) {
                                        gplObject.pointRefIndex = pRef.AppIndex;
                                        // delete gplObject.upi; // TODO to clear out duplicate data (point ref contains the UPI)
                                    }
                                }
                            }
                        }
                    }
                };

                setPointRefIndex(blocks, 'GPLBlock');
                setPointRefIndex(dynamics, 'GPLDynamic');
                cb();
            },

            makePointRef = (refPoint, propName, propType) => {
                var pointType = refPoint['Point Type'].Value;
                var baseRef = {
                    'PropertyName': propName,
                    'PropertyEnum': propType,
                    'Value': refPoint._id,
                    'AppIndex': pRefAppIndex++,
                    'isDisplayable': true,
                    'isReadOnly': true,
                    'PointName': refPoint.Name,
                    'PointInst': (refPoint._pStatus !== 2) ? refPoint._id : 0,
                    'DevInst': (Config.Utility.getPropertyObject('Device Point', refPoint) !== null) ? Config.Utility.getPropertyObject('Device Point', refPoint).Value : 0,
                    'PointType': Config.Enums['Point Types'][pointType].enum || 0
                };

                return baseRef;
            },
            setGPLPointData = () => {
                var pushGPLObjectUPIs = (gplObjects, propName, propType) => {
                    var gplObject;
                    if (!!gplObjects) {
                        for (c = 0; c < gplObjects.length; c++) {
                            gplObject = gplObjects[c];
                            if (gplObject.upi && skipTypes.indexOf(gplObject.blockType) === -1) {
                                if (upiList.indexOf(gplObject.upi) === -1) {
                                    upiList.push(gplObject.upi);
                                }

                                if (getCrossRefByUPIandName(gplObject.upi, propName).length === 0) {
                                    upiCrossRef.push({
                                        upi: gplObject.upi,
                                        name: propName,
                                        type: propType
                                    });
                                }
                            }
                        }
                    }
                };

                pushGPLObjectUPIs(blocks, 'GPLBlock', 439);
                pushGPLObjectUPIs(dynamics, 'GPLDynamic', 440);

                if (!!upiList && upiList.length > 0) {
                    this.get({
                        collection: pointsCollection,
                        query: {
                            _id:
                                /*{
                                             $in: upiList
                                           }*/
                                85161
                        }
                    }, (err, points) => {
                        var referencedPoint,
                            neededRefs,
                            i;
                        if (!!points) {
                            for (c = 0; c < points.length; c++) {
                                referencedPoint = points[c];
                                neededRefs = getCrossRefByUPI(referencedPoint._id); // gets both Blocks and Dynamics refs
                                for (i = 0; i < neededRefs.length; i++) {
                                    point['Point Refs'].push(makePointRef(referencedPoint, neededRefs[i].name, neededRefs[i].type));
                                    logger.info(4, point['Point Refs']);
                                }
                            }
                        }
                        matchUpisToPointRefs();
                    });
                } else {
                    cb();
                }
            };

        setGPLPointData();
    }
    updateReferences(point, mainCallback) {
        var uniquePID = (pointRefs) => {
            var index = 0;
            var prop;

            async.forEachSeries(pointRefs, (pointRef, cb) => {
                if (pointRef.Value !== 0) {
                    this.getOne({
                        collection: pointsCollection,
                        query: {
                            _id: pointRef.Value
                        }
                    }, (err, refPoint) => {
                        if (err) {
                            return cb(err);
                        }

                        if (pointRef.PropertyName === 'GPLBlock') {
                            prop = index;
                        } else {
                            prop = pointRef.PropertyName;
                        }
                        prop = index;
                        refPoint = Config.EditChanges.applyUniquePIDLogic({
                            point: point,
                            refPoint: refPoint
                        }, prop);

                        index++;

                        cb(null);
                    });
                } else {
                    cb(null);
                }
            }, (err) => {
                mainCallback(err);
            });
        };
        if (point['Point Refs'].length === 0) {
            var properties = [],
                pointTemplate = Config.Templates.getTemplate(point['Point Type'].Value);

            for (var i = 0; i < pointTemplate['Point Refs'].length; i++) {
                properties.push(pointTemplate['Point Refs'][i].PropertyName);
            }

            if (point['Point Type'].Value === 'Slide Show') {
                this.addReferencesToSlideShowPointRefs(point, () => {
                    uniquePID(point['Point Refs']);
                });
            } else if (point['Point Type'].Value === 'Display') {
                if (point['Screen Objects'] !== undefined) {
                    this.addReferencesToDisplayPointRefs(point, () => {
                        uniquePID(point['Point Refs']);
                    });
                } else {
                    point['Screen Objects'] = [];
                    /*db.collection(pointsCollection).update({
                        _id: point._id
                      }, {
                        $set: {
                          "Screen Objects": []
                        }
                      }, function(err, result) {*/
                    uniquePID(point['Point Refs']);
                    //});
                }
            } else if (point['Point Type'].Value === 'Program') {
                async.waterfall([

                    (wfcb) => {
                        async.forEachSeries(properties, (prop, callback) => {
                            if (point[prop] !== null && (point[prop].ValueType === 8)) {
                                var propName = prop;
                                var propEnum = Config.Enums.Properties[prop].enum;
                                var appIndex = 0;

                                var pointRef = {
                                    PropertyName: propName,
                                    PropertyEnum: propEnum,
                                    Value: point[prop].Value,
                                    AppIndex: appIndex,
                                    isDisplayable: point[prop].isDisplayable,
                                    isReadOnly: point[prop].isReadOnly,
                                    PointName: point[prop].PointName,
                                    PointInst: point[prop].PointInst,
                                    DevInst: point[prop].DevInst,
                                    PointType: point[prop].PointType
                                };

                                point['Point Refs'].push(pointRef);
                                delete point[prop];
                                callback(null);
                            } else {
                                callback(null);
                            }
                        }, (err) => {
                            wfcb(err);
                        });
                    },
                    (wfcb) => {
                        var tempRefsArray = [],
                            index, appIndexes = {};

                        for (var i = 0; i < point['Point Registers'].length; i++) {
                            appIndexes[point['Point Registers'][i]] = [];
                        }

                        for (var prop in appIndexes) {
                            index = point['Point Registers'].indexOf(parseInt(prop, 10));
                            while (index !== -1) {
                                appIndexes[prop].push(index + 1);
                                index = point['Point Registers'].indexOf(parseInt(prop, 10), index + 1);
                            }
                        }

                        async.forEachSeries(point['Point Registers'], (register, propCb) => {
                            this.getOne({
                                collection: pointsCollection,
                                query: {
                                    _id: register
                                }
                            }, (err, registerPoint) => {
                                if (err) {
                                    propCb(err);
                                }
                                var pointRef = {};

                                pointRef.PropertyEnum = Config.Enums.Properties['Point Register'].enum;
                                pointRef.PropertyName = 'Point Register';
                                pointRef.isDisplayable = true;
                                pointRef.AppIndex = appIndexes[register].shift();
                                pointRef.isReadOnly = false;
                                pointRef.DevInst = (Config.Utility.getPropertyObject('Device Point', registerPoint) !== null) ? Config.Utility.getPropertyObject('Device Point', registerPoint).Value : 0;

                                if (registerPoint !== null) {
                                    pointRef.Value = registerPoint._id;
                                    pointRef.PointName = registerPoint.Name;
                                    pointRef.PointType = registerPoint['Point Type'].eValue;
                                    pointRef.PointInst = (registerPoint._pStatus !== 2) ? registerPoint._id : 0;
                                } else {
                                    pointRef.Value = 0;
                                    pointRef.PointName = '';
                                    pointRef.PointType = 0;
                                    pointRef.PointInst = 0;
                                }
                                tempRefsArray.push(pointRef);
                                propCb(null);
                            });
                        }, (err) => {
                            tempRefsArray.sort((a, b) => {
                                return (a.AppIndex > b.AppIndex) ? 1 : ((b.AppIndex > a.AppIndex) ? -1 : 0);
                            });
                            for (var a = 0; a < tempRefsArray.length; a++) {
                                point['Point Refs'].push(tempRefsArray[a]);
                            }
                            wfcb(err);
                        });
                    }
                ], (err) => {
                    /*db.collection(pointsCollection).update({
                        _id: point._id
                      }, point, function(err, result) {*/
                    uniquePID(point['Point Refs']);
                    //});
                });
            } else {
                async.forEachSeries(properties, (prop, callback) => {
                    /*if (prop === "Sequence Device")
                      prop = "Device Point";*/

                    if (point[prop] !== null && (point[prop].ValueType === 8)) {
                        var propName = prop;
                        var propEnum = Config.Enums.Properties[prop].enum;
                        var appIndex = 0;

                        if ((prop === 'Device Point' || prop === 'Remote Unit Point') && point._parentUpi === 0) {
                            point[prop].isReadOnly = false;
                        }

                        /*if (point["Point Type"].Value === "Sequence" && prop === "Device Point") {
                          propName = "Sequence Device";
                          propEnum = Config.Enums.Properties[propName].enum;
                        }*/

                        var pointRef = {
                            PropertyName: propName,
                            PropertyEnum: propEnum,
                            Value: point[prop].Value,
                            AppIndex: appIndex,
                            isDisplayable: point[prop].isDisplayable,
                            isReadOnly: point[prop].isReadOnly,
                            PointName: point[prop].PointName,
                            PointInst: point[prop].PointInst,
                            DevInst: point[prop].DevInst,
                            PointType: point[prop].PointType
                        };

                        //logger.info("pushing", pointRef);
                        point['Point Refs'].push(pointRef);
                        delete point[prop];
                        callback(null);
                    } else {
                        callback(null);
                    }
                }, (err) => {
                    // compare size of point register's name array to the number of point registers in the points ref array and add any Value
                    /*db.collection(pointsCollection).update({
                        _id: point._id
                      }, point, function(err, result) {*/

                    if (point['Point Type'].Value === 'Sequence') {
                        this.addReferencesToSequencePointRefs(point, () => {
                            uniquePID(point['Point Refs']);
                        });
                    } else {
                        uniquePID(point['Point Refs']);
                    }
                    //});
                });
            }
        } else {
            uniquePID(point['Point Refs']);
        }
    }
    updateDevices(point, callback) {
        if (point['Point Type'].Value === 'Device') {
            point['Serial Number'] = Config.Templates.getTemplate('Device')['Serial Number'];
            point['Device Address'] = Config.Templates.getTemplate('Device')['Device Address'];
            point['Network Segment'] = Config.Templates.getTemplate('Device')['Network Segment'];
            point['Firmware 2 Version'] = Config.Templates.getTemplate('Device')['Firmware 2 Version'];
            point['Ethernet Gateway'] = Config.Templates.getTemplate('Device')['Ethernet Gateway'];
            point['Ethernet Subnet'] = Config.Templates.getTemplate('Device')['Ethernet Subnet'];
            point['Ethernet IP Port'].isReadOnly = true;

            if (typeof point['Ethernet Address'].Value !== 'string') {
                point['Ethernet Address'].Value = '0.0.0.0';
                point['Ethernet Address'].ValueType = 2;
            }

            utils.updateNetworkAndAddress(point);

            point._cfgDevice = true;
            point['Stop Scan'].Value = true;
            point['Device Status'].Value = 'Stop Scan';
            point['Device Status'].eValue = 66;
        } else if (point['Point Type'].Value === 'Remote Unit') {
            point['Device Address'].ValueType = 2;
            if (typeof point['Device Address'].Value !== 'string') {
                point['Device Address'].Value = point['Device Address'].Value.toString();
            }
            point['Router Address'].ValueType = 2;
            if (typeof point['Router Address'].Value !== 'string') {
                point['Router Address'].Value = point['Router Address'].Value.toString();
            }
            point['Device Status'].Value = 'Stop Scan';
            point['Device Status'].eValue = 66;
        }
        // set all devices/rmus and possible points on those to Stop Scan
        if (!!point.hasOwnProperty('Reliability')) {
            point._relDevice = 129;
            point.Reliability.Value = 'Stop Scan';
            point.Reliability.eValue = 129;
        }
        callback(null);
    }
    updateAlarmMessages(point, callback) {
        //logger.info("updateAlarmMessages");
        var alarmClasses = ['Emergency', 'Critical'];
        if (point.hasOwnProperty('Alarm Messages')) {
            point['Notify Policies'] = [];
        }

        if (point['Alarm Class'] !== undefined && alarmClasses.indexOf(point['Alarm Class'].Value) !== -1) {
            for (var i = 0; i < point['Alarm Messages'].length; i++) {
                point['Alarm Messages'][i].ack = true;
            }
            /*db.collection(pointsCollection).update({
              _id: point._id
            }, {
              $set: {
                "Alarm Messages": point["Alarm Messages"]
              }
            }, function(err, result) {*/

            callback(null);
            //});
        } else {
            callback(null);
        }
    }
    addBroadcastPeriod(point, callback) {
        if (point['Broadcast Enable'] !== undefined) {
            point['Broadcast Period'] = {
                'isDisplayable': point['Broadcast Enable'].Value,
                'isReadOnly': false,
                'ValueType': 13,
                'Value': 15
            };
        }
        callback(null);
    }
    updateTrend(point, callback) {
        if (point.hasOwnProperty('Trend Enable')) {
            point['Trend Last Status'] = Config.Templates.getTemplate(point['Point Type'].Value)['Trend Last Status'];
            point['Trend Last Value'] = Config.Templates.getTemplate(point['Point Type'].Value)['Trend Last Value'];
        }
        callback(null);
    }
    rearrangeProperties(point, callback) {
        var compare = (a, b) => {
            var _a = a.toLowerCase();
            var _b = b.toLowerCase();
            if (_a === '_id') {
                return -1;
            } else if (_b === '_id') {
                return 1;
            }
            if (_a.match(/^name|^_/) && _b.match(/^name|^_/)) {
                if (_a > _b) {
                    return -1;
                } else if (a < _b) {
                    return 1;
                }
            } else if (!_a.match(/^name|^_/) && !_b.match(/^name|^_/)) {
                if (_a > _b) {
                    return 1;
                } else if (a < _b) {
                    return -1;
                }
            } else if (_a.match(/^name|^_/)) {
                return -1;
            } else if (_b.match(/^name|^_/)) {
                return 1;
            }
            return 0;
        };
        var arr = [];
        var o = {};
        for (var prop in point) {
            arr.push(prop);
        }
        arr.sort(compare);
        for (var i = 0; i < arr.length; i++) {
            o[arr[i]] = point[arr[i]];
        }
        point = o;
        callback(null);
    }
    updateNameSegments(point, callback) {
        //logger.info("updateNameSegments");
        //var updObj = {};

        point._name1 = point.name1.toLowerCase();
        point._name2 = point.name2.toString().toLowerCase();
        point._name3 = point.name3.toLowerCase();
        point._name4 = point.name4.toLowerCase();
        point._Name = point.Name.toLowerCase();
        /*db.collection(pointsCollection).update({
          _id: point._id
        }, {
          $set: updObj
        }, function(err, result) {*/

        // });
        callback(null);
    }
    updateSequences(point, callback) {
        if (point['Point Type'].Value === 'Sequence') {
            point._parentUpi = 0;
        }
        callback();
    }
    updateTaglist(point, callback) {
        for (var i = 0; i < point.taglist.length; i++) {
            point.taglist[i] = point.taglist[i].toLowerCase();
        }
        callback();
    }
    setupProgramPoints(callback) {
        this.update({
            collection: pointsCollection,
            query: {
                'Point Type.Value': 'Program'
            },
            updateObj: {
                $set: {
                    /*"Boolean Register Names": [],
                    "Integer Register Names": [],
                    "Point Register Names": [],
                    "Real Register Names": [],*/
                    'Last Report Time': {
                        'isDisplayable': true,
                        'isReadOnly': true,
                        'ValueType': 11,
                        'Value': 0
                    }
                }
            },
            options: {
                multi: true
            }
        }, (err, result) => {
            callback(err);
        });
    }
    updateAllProgramPoints(callback) {
        this.get({
            collection: pointsCollection,
            query: {
                'Point Type.Value': 'Script'
            }
        }, (err, scripts) => {
            async.forEachSeries(scripts, (script, cb) => {
                this.updateProgramPoints(script, (err) => {
                    if (err) {
                        logger.info('updateProgramPoints', err);
                    }
                    cb(err);
                });
            }, (err) => {
                callback(err);
            });
        });
    }
    updateAllSensorPoints(callback) {
        logger.info('starting updateAllSensorPoints');
        this.get({
            collection: pointsCollection,
            query: {
                'Point Type.Value': 'Sensor'
            }
        }, (err, sensors) => {
            async.forEachSeries(sensors, (sensor, cb) => {
                this.updateSensorPoints(sensor, (err) => {
                    if (err) {
                        logger.info('updateSensorPoints', err);
                    }
                    cb(err);
                });
            }, (err) => {
                callback(err);
            });
        });
    }
    doGplImport(xmlPath, cb) {
        var fs = require('fs'),
            count = 0,
            max = 0,
            start = new Date(),
            xml2js = require('xml2js'),
            parser = new xml2js.Parser({
                trim: false,
                explicitArray: false,
                mergeAttrs: true,
                tagNameProcessors: [

                    (name) => {
                        return name.charAt(0).toLowerCase() + name.substring(1);
                    }
                ],
                attrNameProcessors: [

                    (name) => {
                        if (name === 'UPI') {
                            return 'upi';
                        }
                        return name.charAt(0).toLowerCase() + name.substring(1);
                    }
                ]
            }),
            convertStrings = (obj) => {
                var key,
                    prop,
                    type,
                    c,
                    propsToRemove = {
                        // 'xp:Value': true
                    },
                    booleans = {
                        LabelVisible: true,
                        PresentValueVisible: true
                    },
                    matrix = {
                        object: (o) => {
                            return convertStrings(o);
                        },
                        string: (o) => {
                            var ret;
                            if (booleans[key]) {
                                ret = !!o;
                            } else if (!o.match(/[^\d.]/g)) { //no characters, must be number
                                if (o.indexOf('.') > -1) {
                                    ret = parseFloat(o);
                                } else {
                                    ret = parseInt(o, 10);
                                }
                            } else {
                                ret = o;
                            }
                            return ret;
                        },
                        array: (o) => {
                            var arr = [];
                            for (c = 0; c < o.length; c++) {
                                arr[c] = convertStrings(o[c]);
                            }
                            return arr;
                        }
                    };

                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (!propsToRemove[key]) {
                            prop = obj[key];
                            type = typeof prop;
                            if (type === 'object') {
                                if (util.isArray(prop)) {
                                    type = 'array';
                                }
                            }
                            if (matrix[type]) {
                                obj[key] = matrix[type](prop);
                            }
                        } else {
                            delete obj[key];
                        }
                    }
                }
                return obj;
            },
            complete = (cb) => {
                count++;
                // logger.info('count:', count, 'max:', max);
                if (count === max) {
                    logger.info('GPLIMPORT: complete');
                    // socket.emit('gplImportComplete', {});
                }
                cb();
            },
            update = (json, name, cb) => {
                var blocks = (json.sequence || {}).block,
                    skipTypes = ['Output', 'Input', 'Constant'],
                    upiMap = [],
                    block,
                    label,
                    c,
                    upi,
                    saveSequence = () => {
                        //logger.info('GPLIMPORT: saving sequence', name);
                        this.getOne({
                            collection: pointsCollection,
                            query: {
                                'Name': name
                            },
                            fields: {
                                '_id': 1
                            }
                        }, (err, result) => {
                            if (result) {
                                var _id = result._id;

                                if (!err) {
                                    this.update({
                                        collection: pointsCollection,
                                        query: {
                                            _id: _id
                                        },
                                        updateObj: {
                                            $set: {
                                                'SequenceData': json
                                            }
                                        }
                                    }, (updateErr, updateRecords) => {
                                        /*if (updateErr) {
                                          socket.emit('gplImportMessage', {
                                            type: 'error',
                                            message: updateErr.err,
                                            name: name
                                          });
                                        } else {
                                          socket.emit('gplImportMessage', {
                                            type: 'success',
                                            message: 'success',
                                            name: name
                                          });
                                        }*/
                                        complete(cb);
                                    });
                                } else {
                                    /*socket.emit('gplImportMessage', {
                                      type: 'error',
                                      message: err.err,
                                      name: name
                                    });*/
                                    complete(cb);
                                }
                            } else {
                                /*socket.emit('gplImportMessage', {
                                  type: 'empty',
                                  message: 'empty',
                                  name: name
                                });*/
                                complete(cb);
                            }
                        });
                    },
                    doNext = () => {
                        var upi,
                            label,
                            row,
                            done = () => {
                                if (c >= upiMap.length) {
                                    saveSequence();
                                } else {
                                    c++;
                                    doNext();
                                }
                            };

                        row = upiMap[c];

                        if (row) {
                            upi = row.upi;
                            label = row.label;

                            this.update({
                                collection: pointsCollection,
                                query: {
                                    _id: upi
                                },
                                updateObj: {
                                    $set: {
                                        gplLabel: label
                                    }
                                }
                            }, (err, records) => {
                                /*if (err) {
                                  socket.emit('gplImportMessage', {
                                    type: 'error',
                                    message: 'Error: ' + err,
                                    name: upi
                                  });
                                  done();
                                } else {
                                  socket.emit('gplImportMessage', {
                                    type: 'success',
                                    message: 'Added gplLabel to upi: ' + upi,
                                    name: upi
                                  });*/
                                done();
                                // }
                            });
                        } else {
                            done();
                        }
                    };

                if (blocks) {
                    for (c = 0; c < blocks.length; c++) {
                        block = blocks[c];
                        if (skipTypes.indexOf(block.blockType) === -1) {
                            upi = block.upi;
                            label = block.label;
                            if (upi && label) {
                                upiMap.push({
                                    upi: upi,
                                    label: label
                                });
                            }
                        }
                    }
                }

                c = 0;

                doNext();
            };

        fs.readdir(xmlPath, (err, files) => {
            var filename,
                xmls = [],
                filedata,
                c,
                cleanup = (str) => {
                    if (str.sequence['xd:Dynamics']) {
                        // logger.info('copying dynamics');
                        str.sequence.dynamic = str.sequence['xd:Dynamics']['xd:Dynamic'];
                        // logger.info(str.sequence['xd:Dynamics']['xd:Dynamic']);
                        // logger.info(str.sequence.dynamic);
                        delete str.sequence['xd:Dynamics'];
                    }
                    var st = JSON.stringify(str);
                    st = st.replace(/\"(f|F)alse\"/g, 'false');
                    st = st.replace(/\"(t|T)rue\"/g, 'true');
                    st = st.replace(/xp:Value/g, 'value');
                    st = st.replace('Value', 'value');
                    // st = st.replace(/xd:Dynamics/g, 'dynamic');
                    // st = st.replace(/xd:Dynamic/g, 'dynamic');
                    return JSON.parse(st);
                },
                doNext = () => {
                    if (c < max) {
                        filename = xmls[c];
                        filedata = fs.readFileSync(xmlPath + '\\' + filename, {
                            encoding: 'utf8'
                        });
                        parser.parseString(filedata, handler(filename));
                    } else {
                        logger.info('GPLIMPORT: finished xmls in', ((new Date() - start) / 1000), 'seconds');
                        if (cb) {
                            cb();
                        }
                        // socket.emit('gplImportComplete', {});
                    }
                },
                handler = (name) => {
                    return (err, result) => {
                        var json = cleanup(result),
                            newName = name.replace('.xml', '');

                        while (newName.slice(-1) === '_') {
                            newName = newName.slice(0, -1);
                        }

                        json = convertStrings(json);

                        // json = convertSequence(json);
                        // logger.info('GPLIMPORT: sending', name, 'to update');
                        update(json, newName, () => {
                            c++;
                            doNext();
                        });
                    };
                };

            for (c = 0; c < files.length; c++) {
                filename = files[c];
                if (filename.match('.xml')) {
                    xmls.push(filename);
                }
            }

            max = xmls.length;
            logger.info('Processing', xmls.length, 'XML files');

            c = 0;

            doNext();

            /*for (c = 0; c < xmls.length; c++) {
              filename = xmls[c];
              filedata = fs.readFileSync(dir + '\\' + filename, {
                encoding: 'utf8'
              });
              parser.parseString(filedata, handler(filename));
            }*/
        });
    }
    updateHistory(cb) {
        var History = require('../models/history');
        let historyModel = new History();

        logger.info('starting updateHistory upis');
        this.get({
            collection: 'new_points',
            query: {},
            fields: {
                _oldUpi: 1
            },
            sort: {
                _id: 1
            }
        }, (err, results) => {
            async.eachSeries(results, (doc, callback) => {
                historyModel.updateArchive({
                    upi: doc._id
                }, {
                    upi: doc._oldUpi
                }, callback);
            }, (err) => {
                cb(err);
            });
        });
    }
    setupCounters(callback) {
        let pointTypes = Config.Enums['Point Types'];
        let counters = [];
        for (var type in pointTypes) {
            let typeId = type.toLowerCase().split(' ');
            typeId = typeId.join('');
            counters.push({
                _id: typeId,
                count: (type === 'Device') ? 3145727 : 0,
                enum: pointTypes[type].enum
            });
        }
        counters.push({
            _id: 'hierarchy',
            counter: 0
        });
        this.insert({
            collection: 'counters',
            insertObj: counters
        }, callback);
    }
};

module.exports = Import;
var Counter = require('../models/counter');
