// To run from command prompt, run from root infoscan folder as such: 'node apps/migrationScripts.js'
process.setMaxListeners(0);
var async = require('async');
var utility = require('../models/utility');
var db = require('../helpers/db');
var config = require('config');
var Config = require('../public/js/lib/config.js');
var logger = require('../helpers/logger')(module);

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName].join('');

var scripts = {
    // 0.3.10 - TOU Phase 2 - updates committed bills by adding the rate element properties from rate table to the committed bills
    updateCommittedBills: function (callback) {
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            results = [],
            findBillCollection = function (bill, collectionName) {
                var collections = bill.collections,
                    len = collections.length,
                    i;
                for (i = 0; i < len; i++) {
                    if (collections[i].name === collectionName)
                        return collections[i];
                }
            },
            findBillRow = function (collection, rowName) {
                var rows = collection.rows,
                    len = rows.length,
                    i;
                for (i = 0; i < len; i++) {
                    if (rows[i].name.displayValue === rowName)
                        return rows[i];
                }
            },
            processRateTable = function (rateTable, touUtility) {
                var changes = {},
                    title,
                    collection,
                    collectionName,
                    period,
                    date,
                    end,
                    season,
                    billCollection,
                    billRow,
                    rateName,
                    i, len,
                    j, jlen;

                for (collectionName in rateTable) {
                    collection = rateTable[collectionName];
                    cnt = 0;

                    if (!collection.periods) {
                        continue;
                    }

                    for (i = 0, len = collection.periods.length; i < len; i++) {
                        period = collection.periods[i];
                        date = new Date(period.start.date);
                        end = new Date(period.end.date);
                        season = [period.rangeType.charAt(0).toUpperCase(), period.rangeType.slice(1)].join('');

                        do {
                            title = months[date.getMonth()] + ', ' + date.getFullYear();
                            committedBill = touUtility.Billing.committedBills[title];
                            if (committedBill) {
                                for (j = 0, jlen = collection.rates.length; j < jlen; j++) {
                                    rateName = collection.rates[j].name.replace('{Season}', season);
                                    billCollection = findBillCollection(committedBill, collectionName);
                                    if (billCollection) {
                                        billRow = findBillRow(billCollection, rateName);
                                        if (billRow && !billRow.rateElement) {
                                            // Add the rate table's rate element to the billing row
                                            billRow.rateElement = collection.rates[j];

                                            if (!changes[title]) {
                                                changes[title] = 0;
                                            }
                                            changes[title]++;
                                        }
                                    }
                                }
                            }
                            date.setMonth(date.getMonth() + 1);
                        } while (date < end);
                    }
                }

                if (Object.keys(changes).length) {
                    for (title in changes) {
                        results.push(changes[title] + ' changes made to "' + title + '"');
                    }
                }
            },
            doCallback = function (err, results) {
                callback(null, {
                    fn: 'updateCommittedBills',
                    errors: err,
                    results: results
                });
            };

        utility.get({
            collection: 'Utilities'
        }, function (err, utilities) {
            if (err) {
                return doCallback(err);
            }

            async.eachSeries(utilities, function processUtility(touUtility, cb) {
                var criteria = {
                    collection: 'Utilities',
                    query: {
                        _id: touUtility._id
                    },
                    updateObj: {
                        $set: {
                            'Billing.committedBills': touUtility.Billing.committedBills
                        }
                    }
                };

                if (Object.keys(touUtility.Billing.committedBills).length === 0) {
                    return cb();
                }
                for (var year in touUtility.PreviousRateTables) {
                    processRateTable(touUtility.PreviousRateTables[year], touUtility);
                }
                processRateTable(touUtility.RateTables, touUtility);
                utility.update(criteria, cb);
            }, function allDone(err) {
                return doCallback(err, results);
            });
        });
    },

    // 0.3.10 - GPL Point Ref PropertyEnum Update.  Updated GPLBlock PropertyEnum to be 439 instead of (placeholder) 0
    updateGPLBlockPointRefEnum: function (callback) {
        utility.iterateCursor({
            collection: 'points',
            query: {
                'Point Type.Value': 'Sequence'
            }
        }, function processSequence(err, doc, cb) {
            var list = doc['Point Refs'];

            list.forEach(function processPointRefs(ref) {
                if (ref.PropertyName === 'GPLBlock') {
                    ref.PropertyEnum = 439;
                }
            });

            logger.info('updating sequence:', doc._id);

            utility.update({
                collection: 'points',
                query: {
                    _id: doc._id
                },
                updateObj: doc
            }, function updatedSequenceHandler(err) {
                if (err) {
                    logger.debug('Update err:', err);
                }

                cb(null);
            });

        }, function finishUpdatingSequences(err) {
            logger.info('Finished with updateGPLBlockPointRefEnum');
            callback(null, {
                fn: 'updateGPLBlockPointRefEnum',
                errors: err
            });
        });
    },

    updateGenerateGPLPointRefs: function (callback) {
        utility.iterateCursor({
            collection: "points",
            query: {
                // "_id" : 67275,
                "Point Type.Value": "Sequence"
            }
        }, function processSequence(err, sequence, cb) {
            var sequenceNeedsSaving = false;

            // logger.info('processSequence() sequence = ', sequence);
            if (!!sequence && !!sequence.SequenceData && !!sequence.SequenceData.sequence && !!sequence.SequenceData.sequence.block) {
                logger.info("- - updating sequence:", sequence._id);
                var blocks = sequence.SequenceData.sequence.block,
                    dynamics = (!!sequence.SequenceData.sequence.dynamic ? sequence.SequenceData.sequence.dynamic : []),
                    pointRef,
                    pRefs = sequence["Point Refs"],
                    deviceId = !!pRefs[0] ? pRefs[0].PointInst : null,
                    saveSequence = function () {
                        if (sequenceNeedsSaving) {
                            // logger.info("   ___ sequenceNeedsSaving ___");
                            sequenceNeedsSaving = false;

                            utility.update({
                                collection: "points",
                                query: {
                                    _id: sequence._id
                                },
                                updateObj: sequence
                            }, function updatedSequenceHandler(err) {
                                if (err) {
                                    logger.debug("Update err:", err);
                                }

                                cb(null);
                            });
                        } else {
                            cb(null);
                        }
                    },
                    adjustSequence = function () {
                        adjustBlocksAndDynamics();
                    },
                    adjustBlocksAndDynamics = function () {
                        // logger.info("- blocks.length:", blocks.length);
                        async.eachSeries(blocks, function processBlocks(block, seriesCallback) {
                            if (block.upi > 0 || block.pointRefIndex !== undefined) {
                                sequenceNeedsSaving = true;

                                // logger.info("block.upi:" + block.upi + "   block.pointRefIndex:" + block.pointRefIndex);
                                pointRef = getPointReference(block, "GPLBlock");

                                // logger.info("pointRef.AppIndex = " + (!!pointRef ? pointRef.AppIndex : null));
                                if (pointRef !== undefined && pointRef !== null) {
                                    block.pointRefIndex = pointRef.AppIndex;
                                    delete block.upi;
                                    return seriesCallback();
                                } else {
                                    createPointRef(block, "GPLBlock", 439, seriesCallback);
                                }
                            } else {
                                return seriesCallback();
                            }
                        }, function allDone(err) {
                            // logger.info("- dynamics.length:", dynamics.length);
                            adjustDynamics();
                        });
                    },
                    adjustDynamics = function () {
                        async.eachSeries(dynamics, function processDynamics(dynamic, seriesCallback) {
                            if (dynamic.upi > 0 || dynamic.pointRefIndex !== undefined) {
                                sequenceNeedsSaving = true;

                                // logger.info("dynamic.upi:" + dynamic.upi + "   dynamic.pointRefIndex:" + dynamic.pointRefIndex);
                                pointRef = getPointReference(dynamic, "GPLDynamic");

                                // logger.info("pointRef.AppIndex = " + (!!pointRef ? pointRef.AppIndex : null));
                                if (pointRef !== undefined && pointRef !== null) {
                                    dynamic.pointRefIndex = pointRef.AppIndex;
                                    delete dynamic.upi;
                                    return seriesCallback();
                                } else {
                                    createPointRef(dynamic, "GPLDynamic", 440, seriesCallback);
                                }
                            } else {
                                return seriesCallback();
                            }
                        }, function allDone(err) {
                            saveSequence();
                        });
                    },
                    getGplBlockObject = function (upi, cb2) {
                        var criteria = {
                            collection: 'points',
                            query: {
                                _id: upi
                            },
                            fields: {
                                _id: 1,
                                Name: 1,
                                Value: 1,
                                "Point Type": 1
                            }
                        };

                        // logger.info("criteria = " + criteria);
                        utility.getOne(criteria, function (err, referencedObj) {
                            if (err) {
                                logger.info("utility.getOne err = " + err);
                                return cb2(err);
                            } else {
                                // logger.info("getGplBlockObject()  referencedObj = " + referencedObj);
                                if (referencedObj === null) {
                                    logger.info("        - - UPI Not Found: " + upi);
                                    cb2(null, referencedObj);
                                } else {
                                    // logger.info("utility.getOne found it = " + referencedObj);
                                    cb2(null, referencedObj);
                                }
                            }
                        });
                    },
                    getPointReference = function (gplobject, refType) {
                        var answer = null;

                        // logger.info('gplobject.upi:'+ gplobject.upi + '   gplobject.pointRefIndex:' + gplobject.pointRefIndex);
                        if (gplobject.pointRefIndex !== undefined && gplobject.pointRefIndex !== null) {
                            answer = getPointRefByAppindex(gplobject.pointRefIndex, refType);
                        } else if (gplobject.upi !== undefined && gplobject.upi !== null) {
                            answer = getPointRefByUpi(gplobject.upi, refType);
                        }

                        // logger.info('getPointReference()  answer =  ' + answer);
                        return answer;
                    },
                    createPointRef = function (gplobject, refType, refEnum, createCallBack) {
                        var createNewPointRef = function (err, referencedPoint) {
                            var objRef,
                                thePointRef = null;
                            if (err) {
                                logger.info("err = " + err);
                                return createCallBack(err);
                            } else {
                                if (referencedPoint !== null) {
                                    objRef = {
                                        upi: referencedPoint._id,
                                        name: referencedPoint.Name,
                                        pointType: referencedPoint["Point Type"].Value
                                    };
                                    thePointRef = makePointRef(objRef, deviceId, refType, refEnum);
                                    if (!!thePointRef) {
                                        gplobject.pointRefIndex = thePointRef.AppIndex;
                                        delete gplobject.upi;
                                    }
                                }
                                // logger.info(" createNewPointRef() thePointRef = " + thePointRef);
                                return createCallBack(null, thePointRef);
                            }
                        };

                        // logger.info(" createNewPointRef() gplobject.upi = " + gplobject.upi);
                        if (gplobject.upi !== undefined && gplobject.upi !== null) {
                            getGplBlockObject(gplobject.upi, createNewPointRef);
                        } else {
                            return createCallBack(null);
                        }
                    },
                    getPointRefByAppindex = function (pointRefIndex, referenceType) {
                        var answer;
                        if (!!pointRefIndex) {
                            answer = pRefs.filter(function (pointRef) {
                                return pointRef.AppIndex === pointRefIndex && pointRef.PropertyName === referenceType;
                            });

                            answer = (!!answer && answer.length > 0 ? answer[0] : null);
                        }
                        return answer;
                    },
                    getPointRefByUpi = function (upi, referenceType) {
                        var answer;
                        if (!!upi && !isNaN(upi)) {
                            answer = pRefs.filter(function (pointRef) {
                                return pointRef.PointInst === upi && pointRef.PropertyName === referenceType;
                            });
                            answer = (!!answer && answer.length > 0 ? answer[0] : null);
                        }
                        return answer;
                    },
                    getNextAppIndex = function () {
                        var answer = 0,
                            i;
                        for (i = 0; i < pRefs.length; i++) {
                            if (answer < pRefs[i].AppIndex) {
                                answer = pRefs[i].AppIndex;
                            }
                        }
                        return answer + 1;
                    },
                    makePointRef = function (theBlock, devInst, referenceType, referenceEnum) {
                        var pointRef = {
                            "PropertyName": referenceType,
                            "PropertyEnum": referenceEnum,
                            "Value": theBlock.upi,
                            "AppIndex": getNextAppIndex(),
                            "isDisplayable": true,
                            "isReadOnly": true,
                            "PointName": theBlock.name,
                            "PointInst": theBlock.upi,
                            "DevInst": devInst,   // TODO   what about external references?
                            "PointType": Config.Enums['Point Types'][theBlock.pointType].enum
                        };

                        pRefs.push(pointRef);
                        return pointRef;
                    };

                if (!!pRefs[0]) {
                    pRefs[0].PropertyName = "Device Point";
                }

                adjustSequence();

            } else {
                cb();
            }
        }, function (err) {
            logger.info("Finished with updateGenerateGPLPointRefs");
            callback(null, {
                fn: "updateGenerateGPLPointRefs",
                errors: err
            });
        });
    },

    // 0.3.10 - new Report fields
    updateExistingReports: function (callback) {
        logger.info("     - - - updateExistingReports() called - - - ");
        var collectionName = 'points',
            query = {
                'Point Type.Value': 'Report'
            },
            reportUpdateCounter = 0,
            processDoc = function (reportDoc, cb) {
                var reportConfig = reportDoc["Report Config"],
                    columns,
                    updateDoc = false,
                    updateReport = function (docToUpdate, cb) {
                        // logger.info("Updating report ._id = " + docToUpdate._id);
                        utility.update({
                            collection: 'points',
                            query: {
                                _id: docToUpdate._id
                            },
                            updateObj: docToUpdate
                        }, function (err) {
                            if (!!err) {
                                logger.info('Update err:' + err);
                                cb(err);
                            } else {
                                // logger.info("    Report updated");
                                reportUpdateCounter++;
                                cb(null);
                            }
                        });
                    },
                    getMaxAppIndexUsed = function () {
                        var answer = 0,
                            i;
                        for (i = 0; i < reportDoc["Point Refs"].length; i++) {
                            if (answer < reportDoc["Point Refs"][i].AppIndex) {
                                answer = reportDoc["Point Refs"][i].AppIndex;
                            }
                        }
                        return answer;
                    },
                    getPointRef = function (item, referenceType) {
                        var result,
                            upi = item.upi;

                        if (!!upi) {
                            result = reportDoc["Point Refs"].filter(function (pointRef) {
                                return pointRef.Value === upi && pointRef.PropertyName === referenceType;
                            });
                        }

                        return (result.length === 0 ? null : result[0]);
                    },
                    updateColumnFromPointRefs = function (column) {
                        var property = "Column Point",
                            setColumn = function (theCol, pRef) {
                                updateDoc = true;
                                theCol.AppIndex = pRef.AppIndex;
                                // theCol.upi = pRef.Value;
                                theCol.colName = pRef.PointName;
                                delete theCol.upi;
                            },
                            pushNewPointRef = function (refPointID) {
                                if (!!refPointID) {
                                    var tempRef;
                                    tempRef = {};
                                    tempRef.PropertyEnum = Config.Enums.Properties["Column Point"].enum;
                                    tempRef.PropertyName = property;
                                    tempRef.Value = refPointID;
                                    tempRef.AppIndex = getMaxAppIndexUsed() + 1;
                                    tempRef.isDisplayable = true;
                                    tempRef.isReadOnly = false;
                                    tempRef.PointName = column.colName;
                                    // tempRef.PointType = Config.Enums["Point Types"][pointType].enum;
                                    tempRef.PointType = 0;
                                    reportDoc["Point Refs"].push(tempRef);
                                    setColumn(column, tempRef);
                                } else {
                                    logger.info("ERROR - updateColumnFromPointRefs() could not locate Point Ref for upi = " + column.upi);
                                    logger.info("         ------- reportDoc._id = " + reportDoc._id + "   reportDoc.Name = " + reportDoc.Name);
                                    logger.info("---------------------------------------------------------------");
                                }
                            },
                            existingPointRef = getPointRef(column, property);

                        if (!!existingPointRef) {
                            if (existingPointRef.AppIndex !== column.AppIndex) {
                                setColumn(column, existingPointRef);
                            }
                        } else {
                            pushNewPointRef(column.upi);
                        }
                    };

                if (!!reportConfig) {
                    columns = (!!reportConfig ? reportConfig.columns : []);
                    if (!!columns) {
                        columns.forEach(function processColumns(col) {
                            if (col.multiplier === undefined) {
                                col.multiplier = 1;
                                updateDoc = true;
                            }
                            if (col.includeInChart === undefined) {
                                col.includeInChart = false;
                                updateDoc = true;
                            }
                            if (col.yaxisGroup === undefined) {
                                col.yaxisGroup = "A";
                                updateDoc = true;
                            }

                            if (!!col.upi && col.upi > 0) {
                                updateColumnFromPointRefs(col);
                            }
                        });

                        // logger.info("- - - - - updateDoc = " + updateDoc + "     reportDoc._id = " + reportDoc._id);
                        if (updateDoc) {
                            updateReport(reportDoc, cb);
                        } else {
                            cb(null);
                        }
                    } else {
                        logger.info("- - - - - No 'columns'  reportDoc._id = " + reportDoc._id);
                        cb(null);
                    }
                } else {
                    logger.info("- - - - No 'reportConfig'  reportDoc._id = " + reportDoc._id + "  Report Name = '" + reportDoc.Name + "'");
                    cb(null);
                }
            };

        utility.iterateCursor({
            collection: collectionName,
            query: query
        }, function processReport(err, doc, cb) {
            if (!!err) {
                logger.info(" ERROR  err = " + err);
                callback(err);
            } else {
                processDoc(doc, cb);
            }

        }, function finishUpdatingReports(err) {
            logger.info('Finished with updateExistingReports updated ' + reportUpdateCounter + ' reports');
            callback(null, {
                fn: 'updateExistingReports',
                errors: err
            });
        });
    },

    // 0.3.10
    updateDevices: function (callback) {
        var criteria = {
            collection: 'points',
            query: {
                'Point Type.Value': 'Device'
            }
        };
        utility.iterateCursor(criteria, function (err, doc, cb) {
            doc['Firmware 2 Version'] = Config.Templates.getTemplate("Device")["Firmware 2 Version"];
            if ([Config.Enums['Device Model Types']['MicroScan 5 UNV'].enum, Config.Enums['Device Model Types']['SCADA Vio'].enum].indexOf(doc['Model Type'].eValue) >= 0) {
                doc['Firmware 2 Version'].isDisplayable = true;
            } else {
                doc['Firmware 2 Version'].isDisplayable = false;
            }

            doc['Ethernet IP Port'].isReadOnly = false;
            doc['Ethernet IP Port'].isDisplayable = false;
            doc['Downlink IP Port'].isReadOnly = false;
            doc['Downlink IP Port'].isDisplayable = false;

            utility.update({
                collection: 'points',
                query: {
                    _id: doc._id
                },
                updateObj: doc
            }, cb);
        }, function (err, count) {
            logger.info('Firmware 2 Version added to ', count, ' devices');
            callback(err);
        });
    },

    // 0.3.10
    removePointInstance: function (callback) {
        var criteria = {
            collection: 'points',
            query: {},
            updateObj: {
                $unset: {
                    'Point Instance': 1
                }
            },
            options: {
                multi: true
            }
        };
        utility.update(criteria, function (err, results) {
            logger.info('Point Instance removed from points');
            callback(err);
        });
    }
};


db.connect(connectionString, function (err) {
    if (err) {
        return logger.debug(err);
    }
    // Array of tasks that should be run
    var tasks = [scripts.updateCommittedBills, scripts.updateGPLBlockPointRefEnum, scripts.updateGenerateGPLPointRefs, scripts.updateExistingReports, scripts.updateDevices, scripts.removePointInstance];

    // Each task is provided a callback argument which should be called once the task completes.
    // The task callback should be called with two arguments: err, result

    // If the callback is called with an error, all remaining tasks are skipped and we jump
    // immediately to our 'done' function. If an error occurs, but it should not stop downstream
    // tasks from running, it should be included in the return result.

    // The result callback should take the following form:
    // {
    //	fn: 'functionName',
    //	errors: null or error(s),
    //	results: null or result(s)
    // }

    async.series(tasks, function done(err, results) {
        if (err) {
            logger.info("Error: ", err);
        }
        logger.info("Results: ", results);

        //added a clean exit for when scripts are done
        process.exit();
    });
});