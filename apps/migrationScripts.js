// To run from command prompt, run from root infoscan folder as such: 'node apps/migrationScripts.js'
// if you do not wish to update the version in the DB, pass -n from command prompt
process.setMaxListeners(0);
let async = require('async');
let moment = require('moment');
let Utility = new(require('../models/Utility'))();
let db = require('../helpers/db');
let utils = require('../helpers/utils');
let config = require('config');
let Config = require('../public/js/lib/config.js');
let logger = require('../helpers/logger')(module);
let Point = require('../models/point');
let Import = require('../models/import');

let pjson = require('../package.json');
let compareVersions = require('compare-versions');
let commandLineArgs = require('command-line-args');

let cli = commandLineArgs([{
    name: 'noupdate',
    alias: 'n',
    type: Boolean
}]);

let options = cli.parse();

let curVersion = pjson.version;
let prevVersion = 0;

let dbConfig = config.get('Infoscan.dbConfig');
let connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName].join('');

let checkVersions = function (version) {
    console.log(version, prevVersion, curVersion);
    console.log(compareVersions(version, prevVersion), compareVersions(curVersion, version));
    if (prevVersion === 0 || (compareVersions(version, prevVersion) >= 0 && compareVersions(curVersion, version) >= 0)) {
        return true;
    }

    return false;
};

let scripts = {
    // 0.3.10 - TOU Phase 2 - updates committed bills by adding the rate element properties from rate table to the committed bills
    updateCommittedBills: function (callback) {
        let afterVersion = '0.3.10';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateCommittedBills',
                errors: null,
                results: null
            });
        }
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            results = [],
            findBillCollection = function (bill, collectionName) {
                let collections = bill.collections,
                    len = collections.length,
                    i;
                for (i = 0; i < len; i++) {
                    if (collections[i].name === collectionName) {
                        return collections[i];
                    }
                }
            },
            findBillRow = function (collection, rowName) {
                let rows = collection.rows,
                    len = rows.length,
                    i;
                for (i = 0; i < len; i++) {
                    if (rows[i].name.displayValue === rowName) {
                        return rows[i];
                    }
                }
            },
            processRateTable = function (rateTable, touUtility) {
                let changes = {},
                    title,
                    collection,
                    collectionName,
                    period,
                    date,
                    end,
                    season,
                    billCollection,
                    committedBill,
                    billRow,
                    rateName,
                    i, len,
                    j, jlen;

                for (collectionName in rateTable) {
                    collection = rateTable[collectionName];

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

        Utility.get({
            collection: 'Utilities'
        }, function (err, utilities) {
            if (err) {
                return doCallback(err);
            }

            async.eachSeries(utilities, function processUtility(touUtility, cb) {
                let criteria = {
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
                for (let year in touUtility.PreviousRateTables) {
                    processRateTable(touUtility.PreviousRateTables[year], touUtility);
                }
                processRateTable(touUtility.RateTables, touUtility);
                Utility.update(criteria, cb);
            }, function allDone(err) {
                return doCallback(err, results);
            });
        });
    },

    // 0.4.1 - GPL Point Ref PropertyEnum Update.  Updated GPLBlock PropertyEnum to be 439 instead of (placeholder) 0
    updateGPLBlockPointRefEnum: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateGPLBlockPointRefEnum',
                errors: null,
                results: null
            });
        }
        Utility.iterateCursor({
            collection: 'points',
            query: {
                'Point Type.Value': 'Sequence'
            }
        }, function processSequence(err, doc, cb) {
            let list = doc['Point Refs'];

            list.forEach(function processPointRefs(ref) {
                if (ref.PropertyName === 'GPLBlock') {
                    ref.PropertyEnum = 439;
                }
            });

            // logger.info('updating sequence:', doc._id);

            Utility.update({
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
    // 0.4.1
    updateGenerateGPLPointRefs: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateGenerateGPLPointRefs',
                errors: null,
                results: null
            });
        }
        Utility.iterateCursor({
            collection: 'points',
            query: {
                // "_id" : 67275,
                'Point Type.Value': 'Sequence'
            }
        }, function processSequence(err, sequence, cb) {
            let sequenceNeedsSaving = false;

            // logger.info('processSequence() sequence = ', sequence);
            if (!!sequence && !!sequence.SequenceData && !!sequence.SequenceData.sequence && !!sequence.SequenceData.sequence.block) {
                // logger.info("- - updating sequence:", sequence._id);
                let blocks = sequence.SequenceData.sequence.block,
                    dynamics = (!!sequence.SequenceData.sequence.dynamic ? sequence.SequenceData.sequence.dynamic : []),
                    pointRef,
                    pRefs = sequence['Point Refs'],
                    deviceId = !!pRefs[0] ? pRefs[0].PointInst : null,
                    saveSequence = function () {
                        if (sequenceNeedsSaving) {
                            // logger.info("   ___ sequenceNeedsSaving ___");
                            sequenceNeedsSaving = false;

                            Utility.update({
                                collection: 'points',
                                query: {
                                    _id: sequence._id
                                },
                                updateObj: sequence
                            }, function updatedSequenceHandler(err) {
                                if (err) {
                                    logger.debug('Update err:', err);
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
                                pointRef = getPointReference(block, 'GPLBlock');

                                // logger.info("pointRef.AppIndex = " + (!!pointRef ? pointRef.AppIndex : null));
                                if (pointRef !== undefined && pointRef !== null) {
                                    block.pointRefIndex = pointRef.AppIndex;
                                    delete block.upi;
                                    return seriesCallback();
                                }
                                createPointRef(block, 'GPLBlock', 439, seriesCallback);
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
                                pointRef = getPointReference(dynamic, 'GPLDynamic');

                                // logger.info("pointRef.AppIndex = " + (!!pointRef ? pointRef.AppIndex : null));
                                if (pointRef !== undefined && pointRef !== null) {
                                    dynamic.pointRefIndex = pointRef.AppIndex;
                                    delete dynamic.upi;
                                    return seriesCallback();
                                }
                                createPointRef(dynamic, 'GPLDynamic', 440, seriesCallback);
                            } else {
                                return seriesCallback();
                            }
                        }, function allDone(err) {
                            saveSequence();
                        });
                    },
                    getGplBlockObject = function (upi, cb2) {
                        let criteria = {
                            collection: 'points',
                            query: {
                                _id: upi
                            },
                            fields: {
                                _id: 1,
                                Name: 1,
                                Value: 1,
                                'Point Type': 1
                            }
                        };

                        // logger.info("criteria = " + criteria);
                        Utility.getOne(criteria, function (err, referencedObj) {
                            if (err) {
                                logger.info('Utility.getOne err = ' + err);
                                return cb2(err);
                            }
                            // logger.info("getGplBlockObject()  referencedObj = " + referencedObj);
                            if (referencedObj === null) {
                                // logger.info("        - - UPI Not Found: " + upi);
                                cb2(null, referencedObj);
                            } else {
                                // logger.info("Utility.getOne found it = " + referencedObj);
                                cb2(null, referencedObj);
                            }
                        });
                    },
                    getPointReference = function (gplobject, refType) {
                        let answer = null;

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
                        let createNewPointRef = function (err, referencedPoint) {
                            let objRef,
                                thePointRef = null;
                            if (err) {
                                logger.info('err = ' + err);
                                return createCallBack(err);
                            }
                            if (referencedPoint !== null) {
                                objRef = {
                                    upi: referencedPoint._id,
                                    name: referencedPoint.Name,
                                    pointType: referencedPoint['Point Type'].Value
                                };
                                thePointRef = makePointRef(objRef, deviceId, refType, refEnum);
                                if (!!thePointRef) {
                                    gplobject.pointRefIndex = thePointRef.AppIndex;
                                    // delete gplobject.upi;  // TODO to clear out duplicate data (point ref contains the UPI)
                                }
                            }
                            // logger.info(" createNewPointRef() thePointRef = " + thePointRef);
                            return createCallBack(null, thePointRef);
                        };

                        // logger.info(" createNewPointRef() gplobject.upi = " + gplobject.upi);
                        if (gplobject.upi !== undefined && gplobject.upi !== null) {
                            getGplBlockObject(gplobject.upi, createNewPointRef);
                        } else {
                            return createCallBack(null);
                        }
                    },
                    getPointRefByAppindex = function (pointRefIndex, referenceType) {
                        let answer;
                        if (pointRefIndex > -1) {
                            answer = pRefs.filter(function (pointRef) {
                                return pointRef.AppIndex === pointRefIndex && pointRef.PropertyName === referenceType;
                            });

                            answer = (!!answer && answer.length > 0 ? answer[0] : null);
                        }
                        return answer;
                    },
                    getPointRefByUpi = function (upi, referenceType) {
                        let answer;
                        if (!!upi && !isNaN(upi)) {
                            answer = pRefs.filter(function (pointRef) {
                                return pointRef.PointInst === upi && pointRef.PropertyName === referenceType;
                            });
                            answer = (!!answer && answer.length > 0 ? answer[0] : null);
                        }
                        return answer;
                    },
                    getNextAppIndex = function () {
                        let answer = 0,
                            i;
                        for (i = 0; i < pRefs.length; i++) {
                            if (answer < pRefs[i].AppIndex) {
                                answer = pRefs[i].AppIndex;
                            }
                        }
                        return answer + 1;
                    },
                    makePointRef = function (theBlock, devInst, referenceType, referenceEnum) {
                        let pointRef = {
                            'PropertyName': referenceType,
                            'PropertyEnum': referenceEnum,
                            'Value': theBlock.upi,
                            'AppIndex': getNextAppIndex(),
                            'isDisplayable': true,
                            'isReadOnly': true,
                            'PointName': theBlock.name,
                            'PointInst': theBlock.upi,
                            'DevInst': devInst, // TODO   what about external references?
                            'PointType': Config.Enums['Point Types'][theBlock.pointType].enum
                        };

                        pRefs.push(pointRef);
                        return pointRef;
                    };

                if (!!pRefs[0]) {
                    pRefs[0].PropertyName = 'Device Point';
                }

                adjustSequence();
            } else {
                cb();
            }
        }, function (err) {
            logger.info('Finished with updateGenerateGPLPointRefs');
            callback(null, {
                fn: 'updateGenerateGPLPointRefs',
                errors: err
            });
        });
    },
    // 0.4.1
    updateGenerateDisplayPointRefs: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateGenerateDisplayPointRefs',
                errors: null,
                results: null
            });
        }
        Utility.iterateCursor({
            collection: 'points',
            query: {
                // "_id" : 54349,
                'Point Type.Value': 'Display'
            }
        }, function processDisplay(err, display, cb) {
            let displayNeedsSaving = false,
                prop;

            // logger.info('processDisplay() display = ', display);
            if (!!display && !!display['Screen Objects']) {
                // logger.info("- - updating display:", display._id);
                let screenObjects = display['Screen Objects'],
                    pointRef,
                    pRefs = display['Point Refs'],
                    deviceId = 0,
                    reIndexAppIndex = function () {
                        let i,
                            appIndex = 0;
                        for (i = 0; i < pRefs.length; i++) {
                            pRefs[i].AppIndex = appIndex++;
                        }
                    },
                    getScreenObjectType = function (screenObjectType) {
                        let propEnum = 0,
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
                    saveDisplay = function () {
                        if (displayNeedsSaving) {
                            // logger.info("   ___ displayNeedsSaving ___");
                            displayNeedsSaving = false;

                            Utility.update({
                                collection: 'points',
                                query: {
                                    _id: display._id
                                },
                                updateObj: display
                            }, function updatedDisplayHandler(err) {
                                if (err) {
                                    logger.debug('Update err:', err);
                                }

                                cb(null);
                            });
                        } else {
                            cb(null);
                        }
                    },
                    adjustScreenObjects = function () {
                        reIndexAppIndex(); // existing point refs have invalid AppIndex values.

                        // logger.info("- screenObjects.length:", screenObjects.length);
                        async.eachSeries(screenObjects, function processDisplays(screenObject, seriesCallback) {
                            if (screenObject.upi > 0 || screenObject.pointRefIndex !== undefined) {
                                displayNeedsSaving = true;
                                prop = getScreenObjectType(screenObject['Screen Object']);

                                //logger.info("screenObject.upi:" + screenObject.upi + "   screenObject.pointRefIndex:" + screenObject.pointRefIndex);
                                pointRef = getPointReference(screenObject, prop.name);

                                //logger.info("pointRef.AppIndex = " + (!!pointRef ? pointRef.AppIndex : null));
                                if (pointRef !== undefined && pointRef !== null) {
                                    screenObject.pointRefIndex = pointRef.AppIndex;
                                    // delete screenObject.upi; // TODO remove UPI and reference pointRefIndex instead
                                    return seriesCallback();
                                }
                                createPointRef(screenObject, prop.name, prop.enum, seriesCallback);
                            } else {
                                return seriesCallback();
                            }
                        }, function allDone(err) {
                            // logger.info("- dynamics.length:", dynamics.length);
                            saveDisplay();
                        });
                    },
                    getDisplayReferencedObject = function (upi, cb2) {
                        let criteria = {
                            collection: 'points',
                            query: {
                                _id: upi
                            },
                            fields: {
                                _id: 1,
                                Name: 1,
                                Value: 1,
                                'Point Type': 1
                            }
                        };

                        // logger.info("criteria = " + criteria);
                        Utility.getOne(criteria, function (err, referencedObj) {
                            if (err) {
                                logger.info('Utility.getOne err = ' + err);
                                return cb2(err);
                            }
                            // logger.info("getDisplayReferencedObject()  referencedObj = " + referencedObj);
                            if (referencedObj === null) {
                                // logger.info("        - - UPI Not Found: " + upi);
                                cb2(null, referencedObj);
                            } else {
                                // logger.info("Utility.getOne found it = " + referencedObj);
                                cb2(null, referencedObj);
                            }
                        });
                    },
                    getPointReference = function (screenObject, refType) {
                        let answer = null;

                        // logger.info('screenObject.upi:'+ screenObject.upi + '   screenObject.pointRefIndex:' + screenObject.pointRefIndex);
                        if (screenObject.pointRefIndex !== undefined && screenObject.pointRefIndex !== null) {
                            answer = getPointRefByAppindex(screenObject.pointRefIndex, refType);
                        } else if (screenObject.upi !== undefined && screenObject.upi !== null) {
                            answer = getPointRefByUpi(screenObject.upi, refType);
                        }

                        // logger.info('getPointReference()  answer =  ' + answer);
                        return answer;
                    },
                    createPointRef = function (screenObject, refType, refEnum, createCallBack) {
                        let createNewPointRef = function (err, referencedPoint) {
                            let objRef,
                                thePointRef = null;
                            if (err) {
                                logger.info('err = ' + err);
                                return createCallBack(err);
                            }
                            if (referencedPoint !== null) {
                                objRef = {
                                    upi: referencedPoint._id,
                                    name: referencedPoint.Name,
                                    pointType: referencedPoint['Point Type'].Value
                                };
                                thePointRef = makePointRef(objRef, deviceId, refType, refEnum);
                                if (!!thePointRef) {
                                    screenObject.pointRefIndex = thePointRef.AppIndex;
                                    //delete screenObject.upi;  // TODO remove UPI and reference pointRefIndex instead
                                }
                            }
                            // logger.info(" createNewPointRef() thePointRef = " + thePointRef);
                            return createCallBack(null, thePointRef);
                        };

                        // logger.info(" createNewPointRef() screenObject.upi = " + screenObject.upi);
                        if (screenObject.upi !== undefined && screenObject.upi !== null) {
                            getDisplayReferencedObject(screenObject.upi, createNewPointRef);
                        } else {
                            return createCallBack(null);
                        }
                    },
                    getPointRefByAppindex = function (pointRefIndex, referenceType) {
                        let answer;
                        if (pointRefIndex > -1) {
                            answer = pRefs.filter(function (pointRef) {
                                return pointRef.AppIndex === pointRefIndex && pointRef.PropertyName === referenceType;
                            });

                            answer = (!!answer && answer.length > 0 ? answer[0] : null);
                        }
                        return answer;
                    },
                    getPointRefByUpi = function (upi, referenceType) {
                        let answer;
                        if (!!upi && !isNaN(upi)) {
                            answer = pRefs.filter(function (pointRef) {
                                return pointRef.PointInst === upi && pointRef.PropertyName === referenceType;
                            });
                            answer = (!!answer && answer.length > 0 ? answer[0] : null);
                        }
                        return answer;
                    },
                    getNextAppIndex = function () {
                        let answer = 0,
                            i;
                        for (i = 0; i < pRefs.length; i++) {
                            if (answer < pRefs[i].AppIndex) {
                                answer = pRefs[i].AppIndex;
                            }
                        }
                        return answer + 1;
                    },
                    makePointRef = function (theObject, devInst, referenceType, referenceEnum) {
                        let pointRef = {
                            'PropertyName': referenceType,
                            'PropertyEnum': referenceEnum,
                            'Value': theObject.upi,
                            'AppIndex': getNextAppIndex(),
                            'isDisplayable': true,
                            'isReadOnly': true,
                            'PointName': theObject.name,
                            'PointInst': theObject.upi,
                            'DevInst': devInst, // TODO   what about external references?
                            'PointType': Config.Enums['Point Types'][theObject.pointType].enum
                        };

                        pRefs.push(pointRef);
                        return pointRef;
                    };

                adjustScreenObjects();
            } else {
                cb();
            }
        }, function (err) {
            logger.info('Finished with updateGenerateDisplayPointRefs');
            callback(null, {
                fn: 'updateGenerateDisplayPointRefs',
                errors: err
            });
        });
    },
    // 0.5.1 - GPL precision moving to object...
    updateGPLBlockPrecision: function (callback) {
        let afterVersion = '0.5.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateGPLBlockPrecision',
                errors: null,
                results: null
            });
        }
        Utility.iterateCursor({
            collection: 'points',
            query: {
                'Point Type.Value': 'Sequence'
            }
        }, function processSequence(err, doc, cb) {
            let blocks = doc.SequenceData && doc.SequenceData.sequence && doc.SequenceData.sequence.block,
                oldPrecision,
                chars,
                decimals,
                updateMe = false;

            if (!!blocks) {
                // logger.info("working on " + doc.Name );
                blocks.forEach(function processPrecision(block) {
                    if (block.presentValueVisible !== undefined) { // convert to Bool
                        block.presentValueVisible = (block.presentValueVisible === true || block.presentValueVisible === 1);
                        updateMe = true;
                    }

                    if (block.presentvalueVisible !== undefined) {
                        block.presentValueVisible = (block.presentvalueVisible === true || block.presentvalueVisible === 1);
                        delete block.presentvalueVisible;
                        updateMe = true;
                    }

                    if (block.labelVisible !== undefined) { // convert to Bool
                        block.labelVisible = (block.labelVisible === true || block.labelVisible === 1);
                        updateMe = true;
                    }

                    // logger.info('block.precision:', block.precision);
                    if (block.precision !== undefined && block.precision !== null && (typeof block.precision !== 'object')) {
                        oldPrecision = block.precision;
                        chars = 3; // defaults
                        decimals = 1; // defaults
                        block.precision = {};
                        updateMe = true;

                        if (!isNaN(oldPrecision)) {
                            if (String(oldPrecision).indexOf('.') > -1) {
                                if (!isNaN(String(oldPrecision).split('.')[0])) {
                                    chars = parseInt(String(oldPrecision).split('.')[0], 10);
                                }
                                if (!isNaN(String(oldPrecision).split('.')[1])) {
                                    decimals = parseInt(String(oldPrecision).split('.')[1], 10);
                                }
                            } else {
                                chars = oldPrecision;
                                decimals = 0;
                            }
                        }
                        block.precision.characters = chars;
                        block.precision.decimals = decimals;
                        // logger.info('block.precision:', JSON.stringify(block.precision));
                    }
                });

                // logger.info('updating sequence:', doc._id);

                if (updateMe) {
                    Utility.update({
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
                } else {
                    logger.info('nothing change for ' + doc.Name);
                    cb(null);
                }
            } else {
                logger.info('no SequenceData for ' + doc.Name);
                cb(null);
            }
        }, function finishUpdatingSequences(err) {
            logger.info('Finished with updateGPLBlockPrecision');
            callback(null, {
                fn: 'updateGPLBlockPrecision',
                errors: err
            });
        });
    },
    // 0.5.1 - GPL X-Or moving to XOr...
    updateGPLDigitalLogicXORBlock: function (callback) {
        var afterVersion = '0.5.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateGPLDigitalLogicXORBlock',
                errors: null,
                results: null
            });
        }
        Utility.iterateCursor({
            collection: 'points',
            query: {
                $or: [{
                    'Calculation Type.Value': 'X-Or'
                }, {
                    'Calculation Type.ValueOptions.X-Or': 2
                }]
            }
        }, function processSequence(err, doc, cb) {
            var calcType = doc['Calculation Type'],
                updateMe = false;

            if (!!calcType) {
                // logger.info("working on " + doc.Name );
                updateMe = true;

                if (calcType.Value === 'X-Or') {
                    calcType.Value = 'XOr';
                }

                if (!!calcType.ValueOptions && !!calcType.ValueOptions['X-Or']) {
                    delete calcType.ValueOptions['X-Or'];
                } else {
                    // logger.info("calcType.ValueOptions = " + JSON.stringify(calcType.ValueOptions));
                }

                calcType.ValueOptions.XOr = 2;

                // logger.info("calcType = " + JSON.stringify(calcType) + "    valueOptions = " + JSON.stringify(calcType.ValueOptions));

                if (updateMe) {
                    // logger.info('updating Digital Logic:', doc._id);
                    Utility.update({
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
                } else {
                    logger.info('nothing change for ' + doc.Name);
                    cb(null);
                }
            } else {
                logger.info('no SequenceData for ' + doc.Name);
                cb(null);
            }
        }, function finishUpdatingSequences(err) {
            logger.info('Finished with updateGPLDigitalLogicXORBlock');
            callback(null, {
                fn: 'updateGPLDigitalLogicXORBlock',
                errors: err
            });
        });
    },

    // 0.4.2 - Report schema change   Property Reports do NOT need duration or interval
    updateReportsDurationInterval: function (callback) {
        var afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateReportsDurationInterval',
                errors: null,
                results: null
            });
        }
        logger.info('     - - - updateReportsDurationInterval() called - - - ');
        let collectionName = 'points',
            query = {
                'Point Type.Value': 'Report',
                'Report Type.Value': {
                    $ne: 'Property'
                }
            },
            reportUpdateCounter = 0,
            processDoc = function (reportDoc, cb) {
                let reportConfig = reportDoc['Report Config'],
                    duration,
                    interval,
                    updateReport = function (docToUpdate, cb) {
                        // logger.info("Updating report ._id = " + docToUpdate._id);
                        Utility.update({
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
                    };

                if (!!reportConfig) {
                    duration = reportConfig.duration;
                    interval = reportConfig.interval;
                    if (!!duration && !!interval) {
                        delete duration.duration; // removing a reference
                        interval.period = interval.period || interval.text || 'Day';
                        if (!!interval.text) {
                            delete interval.text; // removing a reference
                        }

                        updateReport(reportDoc, cb);
                    } else {
                        logger.info('- - - - - No \'duration\' and/or No \'interval\'  reportDoc._id = ' + reportDoc._id);
                        cb(null);
                    }
                } else {
                    logger.info('- - - - No \'reportConfig\'  reportDoc._id = ' + reportDoc._id + '  Report Name = \'' + reportDoc.Name + '\'');
                    cb(null);
                }
            };

        Utility.iterateCursor({
            collection: collectionName,
            query: query
        }, function processReport(err, doc, cb) {
            if (!!err) {
                logger.info(' ERROR  err = ' + err);
                cb(err);
            } else {
                processDoc(doc, cb);
            }
        }, function finishUpdatingReports(err) {
            logger.info('Finished with updateReportsDurationInterval updated ' + reportUpdateCounter + ' reports');
            callback(null, {
                fn: 'updateReportsDurationInterval',
                errors: err
            });
        });
    },

    // 0.3.10 - new Report fields
    updateExistingReports: function (callback) {
        let afterVersion = '0.3.10';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateExistingReports',
                errors: null,
                results: null
            });
        }
        logger.info('     - - - updateExistingReports() called - - - ');
        let collectionName = 'points',
            query = {
                'Point Type.Value': 'Report'
            },
            reportUpdateCounter = 0,
            processDoc = function (reportDoc, cb) {
                let reportConfig = reportDoc['Report Config'],
                    columns,
                    updateDoc = false,
                    updateReport = function (docToUpdate, cb) {
                        // logger.info("Updating report ._id = " + docToUpdate._id);
                        Utility.update({
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
                        let answer = 0,
                            i;
                        for (i = 0; i < reportDoc['Point Refs'].length; i++) {
                            if (answer < reportDoc['Point Refs'][i].AppIndex) {
                                answer = reportDoc['Point Refs'][i].AppIndex;
                            }
                        }
                        return answer;
                    },
                    getPointRef = function (item, referenceType) {
                        let result,
                            upi = item.upi;

                        if (!!upi) {
                            result = reportDoc['Point Refs'].filter(function (pointRef) {
                                return pointRef.Value === upi && pointRef.PropertyName === referenceType;
                            });
                        }

                        return (result.length === 0 ? null : result[0]);
                    },
                    updateColumnFromPointRefs = function (column) {
                        let property = 'Column Point',
                            setColumn = function (theCol, pRef) {
                                updateDoc = true;
                                theCol.AppIndex = pRef.AppIndex;
                                // theCol.upi = pRef.Value;
                                theCol.colName = pRef.PointName;
                                delete theCol.upi;
                            },
                            pushNewPointRef = function (refPointID) {
                                if (!!refPointID) {
                                    let tempRef;
                                    tempRef = {};
                                    tempRef.PropertyEnum = Config.Enums.Properties['Column Point'].enum;
                                    tempRef.PropertyName = property;
                                    tempRef.Value = refPointID;
                                    tempRef.AppIndex = getMaxAppIndexUsed() + 1;
                                    tempRef.isDisplayable = true;
                                    tempRef.isReadOnly = false;
                                    tempRef.PointName = column.colName;
                                    // tempRef.PointType = Config.Enums["Point Types"][pointType].enum;
                                    tempRef.PointType = 0;
                                    reportDoc['Point Refs'].push(tempRef);
                                    setColumn(column, tempRef);
                                } else {
                                    logger.info('ERROR - updateColumnFromPointRefs() could not locate Point Ref for upi = ' + column.upi);
                                    logger.info('         ------- reportDoc._id = ' + reportDoc._id + '   reportDoc.Name = ' + reportDoc.Name);
                                    logger.info('---------------------------------------------------------------');
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
                                col.yaxisGroup = 'A';
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
                        logger.info('- - - - - No \'columns\'  reportDoc._id = ' + reportDoc._id);
                        cb(null);
                    }
                } else {
                    logger.info('- - - - No \'reportConfig\'  reportDoc._id = ' + reportDoc._id + '  Report Name = \'' + reportDoc.Name + '\'');
                    cb(null);
                }
            };

        Utility.iterateCursor({
            collection: collectionName,
            query: query
        }, function processReport(err, doc, cb) {
            if (!!err) {
                logger.info(' ERROR  err = ' + err);
                cb(err);
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
        let afterVersion = '0.5.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateDevices',
                errors: null,
                results: null
            });
        }
        let criteria = {
            collection: 'points',
            query: {
                'Point Type.Value': 'Device'
            }
        };
        Utility.iterateCursor(criteria, function (err, doc, cb) {
            doc['Firmware 2 Version'] = Config.Templates.getTemplate('Device')['Firmware 2 Version'];
            if ([Config.Enums['Device Model Types']['MicroScan 5 UNV'].enum, Config.Enums['Device Model Types']['SCADA Vio'].enum].indexOf(doc['Model Type'].eValue) >= 0) {
                doc['Firmware 2 Version'].isDisplayable = true;
            } else {
                doc['Firmware 2 Version'].isDisplayable = false;
            }

            doc['Ethernet IP Port'].isReadOnly = false;
            doc['Ethernet IP Port'].isDisplayable = false;
            doc['Downlink IP Port'].isReadOnly = false;
            doc['Downlink IP Port'].isDisplayable = false;
            doc['Ethernet Gateway'] = Config.Templates.getTemplate('Device')['Ethernet Gateway'];
            doc['Ethernet Subnet'] = Config.Templates.getTemplate('Device')['Ethernet Subnet'];

            Utility.update({
                collection: 'points',
                query: {
                    _id: doc._id
                },
                updateObj: doc
            }, function (err, results) {
                cb(err);
            });
        }, function (err, count) {
            logger.info('Firmware 2 Version added to ', count, ' devices');
            callback(null, {
                fn: 'updateDevices',
                errors: err
            });
        });
    },

    // 0.3.10
    removePointInstance: function (callback) {
        let afterVersion = '0.3.10';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'removePointInstance',
                errors: null,
                results: null
            });
        }
        let criteria = {
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
        Utility.update(criteria, function (err, results) {
            logger.info('Point Instance removed from points');
            callback(null, {
                fn: 'removePointInstance',
                errors: err
            });
        });
    },

    // 0.4.1
    updateGatewayReadOnlyRouterAddress: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateGatewayReadOnlyRouterAddress',
                errors: null,
                results: null
            });
        }
        let criteria = {
            collection: 'points',
            query: {
                'Point Type.eValue': {
                    $in: [144]
                },
                'Gateway': {
                    $exists: false
                }
            },
            updateObj: {
                $set: {
                    'Gateway': {
                        'isDisplayable': true,
                        'isReadOnly': false,
                        'ValueType': 7,
                        'Value': false
                    },
                    'Router Address': {
                        'isDisplayable': true,
                        'isReadOnly': false,
                        'ValueType': 2,
                        'Value': '0'
                    }
                }
            },
            options: {
                multi: true
            }
        };

        Utility.update(criteria, function (err, results) {
            logger.info('Gateway and Router Address added to Remote Units.');
            criteria = {
                collection: 'points',
                query: {
                    'Point Type.eValue': {
                        $in: [128, 0, 1, 2, 3, 4, 5, 142]
                    },
                    'Read Only': {
                        $exists: false
                    }
                },
                updateObj: {
                    $set: {
                        'Read Only': {
                            'isDisplayable': true,
                            'isReadOnly': false,
                            'ValueType': 7,
                            'Value': false
                        }
                    }
                },
                options: {
                    multi: true
                }
            };

            Utility.update(criteria, function (err, results) {
                logger.info('Read Only added to I/O points.');
                callback(null, {
                    fn: 'updateGatewayReadOnlyRouterAddress',
                    errors: err
                });
            });
        });
    },

    // 0.4.1
    updateNetworkProps: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateNetworkProps',
                errors: null,
                results: null
            });
        }
        let criteria = {
            collection: 'points',
            query: {},
            updateObj: {
                $unset: {
                    'Port 1 Network.Min': 1,
                    'Port 1 Network.Max': 1,
                    'Port 2 Network.Min': 1,
                    'Port 2 Network.Max': 1,
                    'Port 3 Network.Min': 1,
                    'Port 3 Network.Max': 1,
                    'Port 4 Network.Min': 1,
                    'Port 4 Network.Max': 1
                }
            },
            options: {
                multi: true
            }
        };
        Utility.update(criteria, function (err, results) {
            logger.info('Network Properties updated.');
            criteria = {
                collection: 'SystemInfo',
                query: {
                    'Name': 'Preferences'
                }
            };
            Utility.getOne(criteria, function (err, prefs) {
                let netConfig = [{
                    isDefault: true,
                    'IP Network Segment': prefs['IP Network Segment'],
                    'IP Port': prefs['IP Port']
                }];
                criteria.updateObj = {
                    $set: {
                        'Network Configuration': netConfig
                    }
                };
                Utility.update(criteria, function (err, results) {
                    logger.info('System Info updated.');
                    callback(null, {
                        fn: 'updateNetworkProps',
                        errors: err
                    });
                });
            });
        });
    },

    // 0.4.1
    fixDorsDB: function (callback) {
        let afterVersion = '0.0.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'fixDorsDB',
                errors: null,
                results: null
            });
        }
        let criteria = {
            collection: 'points',
            query: {},
            updateObj: {
                $rename: {
                    'Sensor I/O Device': 'Sensor IO Device',
                    'Sensor I/O Type': 'Sensor IO Type'
                }
            },
            options: {
                multi: true
            }
        };
        Utility.update(criteria, function (err, results) {
            logger.info('Network Properties updated.');
            criteria = {
                collection: 'Users',
                query: {}
            };
            Utility.get(criteria, function (err, users) {
                async.eachSeries(users, function (user, cb) {
                    updateControllers('add', user.username, function (err) {
                        cb(err);
                    });
                }, function (err, result) {
                    callback(null, {
                        fn: 'fixDorsDB',
                        errors: err
                    });
                });
            });

            function updateControllers(op, username, cb) {
                let criteria = {
                    collection: 'SystemInfo',
                    query: {
                        Name: 'Controllers'
                    }
                };
                Utility.getOne(criteria, function (err, controllers) {
                    if (op === 'add') {
                        let id = 0,
                            ids = [],
                            maxId = 0;

                        for (let a = 0; a < controllers.Entries.length; a++) {
                            ids.push(controllers.Entries[a]['Controller ID']);
                            maxId = (controllers.Entries[a]['Controller ID'] > maxId) ? controllers.Entries[a]['Controller ID'] : maxId;
                        }

                        for (let i = 0; i < ids.length; i++) {
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
                        criteria.updateObj = {
                            $set: {
                                Entries: controllers.Entries
                            }
                        };
                        Utility.update(criteria, function (err, result) {
                            cb(err);
                        });
                    } else {
                        for (let j = 0; j < controllers.Entries.length; j++) {
                            if (controllers.Entries[j]['Controller Name'] === username) {
                                controllers.Entries.splice(j, 1);
                                break;
                            }
                        }
                        criteria.updateObj = {
                            $set: {
                                Entries: controllers.Entries
                            }
                        };

                        Utility.update(criteria, function (err, result) {
                            cb(err);
                        });
                    }
                });
            }
        });
    },

    fixSequenceDevicePropertyName: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'fixSequenceDevicePropertyName',
                errors: null,
                results: null
            });
        }
        Utility.iterateCursor({
            collection: 'points',
            query: {
                'Point Type.Value': 'Sequence',
                'Point Refs.PropertyName': 'Sequence Device'
            }
        }, function processSequence(err, doc, cb) {
            let list = doc['Point Refs'];

            list.forEach(function processPointRefs(ref) {
                if (ref.PropertyName === 'Sequence Device') {
                    ref.PropertyName = 'Device Point';
                }
            });

            // logger.info('updating sequence:', doc._id);

            Utility.update({
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
            logger.info('Finished with fixSequenceDevicePropertyName');
            callback(null, {
                fn: 'fixSequenceDevicePropertyName',
                errors: err
            });
        });
    },

    addDownlinkProtocol: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'addDownlinkProtocol',
                errors: null,
                results: null
            });
        }
        Utility.iterateCursor({
            collection: 'points',
            query: {
                'Point Type.Value': 'Device'
            }
        }, function (err, doc, cb) {
            doc['Downlink Protocol'] = Config.Templates.getTemplate(doc['Point Type'].Value)['Downlink Protocol'];
            if (doc['Downlink Network'].Value !== 0) {
                doc['Downlink Protocol'].Value = 'IP';
                doc['Downlink Protocol'].eValue = Config.Enums['Ethernet Protocols'].IP.enum;
            }

            Utility.update({
                collection: 'points',
                query: {
                    _id: doc._id
                },
                updateObj: doc
            }, function (err) {
                if (err) {
                    logger.debug('Update err:', err);
                }

                cb(null);
            });
        }, function (err) {
            logger.info('Finished with addDownlinkProtocol');
            callback(null, {
                fn: 'addDownlinkProtocol',
                errors: err
            });
        });
    },

    switchModbusOrder: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'switchModbusOrder',
                errors: null,
                results: null
            });
        }
        Utility.update({
            collection: 'points',
            query: {
                'Point Type.Value': {
                    $in: ['Analog Input', 'Analog Output', 'Accumulator', 'Binary Input', 'Binary Output', 'MultiState Value']
                }
            },
            updateObj: {
                $set: {
                    'Modbus Order': {
                        'isDisplayable': false,
                        'isReadOnly': false,
                        'ValueType': 5,
                        'Value': 'Both',
                        'eValue': 3
                    }
                }
            },
            options: {
                multi: true
            }
        }, function (err, results) {
            Utility.update({
                collection: 'points',
                query: {
                    $or: [{
                        'Point Type.Value': 'Analog Input',
                        'Input Type.eValue': {
                            $ne: 0
                        }
                    }, {
                        'Point Type.Value': 'Analog Output',
                        'Output Type.eValue': {
                            $ne: 0
                        }
                    }]
                },
                updateObj: {
                    $set: {
                        'Modbus Order': {
                            'isDisplayable': false,
                            'isReadOnly': false,
                            'ValueType': 5,
                            'Value': 'Bytes',
                            'eValue': 2
                        }
                    }
                },
                options: {
                    multi: true
                }
            }, function (err, results) {
                Utility.update({
                    collection: 'points',
                    query: {
                        'Point Type.Value': 'Remote Unit'
                    },
                    updateObj: {
                        $unset: {
                            'Modbus Order': 1
                        },
                        $set: {
                            'Modbus Unit Id': Config.Templates.getTemplate('Remote Unit')['Modbus Unit Id']
                        }
                    },
                    options: {
                        multi: true
                    }
                }, function (err, results) {
                    logger.info('Finished with switchModbusOrder');
                    callback(null, {
                        fn: 'switchModbusOrder',
                        errors: err
                    });
                });
            });
        });
    },

    updateSecurity: function (callback) {
        let afterVersion = '0.5.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'updateSecurity',
                errors: null,
                results: null
            });
        }
        Utility.update({
            collection: 'points',
            query: {},
            updateObj: {
                $set: {
                    _pAccess: 0,
                    'Security': []
                }
            }
        }, function (err) {
            Utility.update({
                collection: 'User Groups',
                query: {},
                updateObj: {
                    $set: {
                        Points: {}
                    }
                }
            }, function (err) {
                logger.info('Finished with updateSecurity');
                callback(null, {
                    fn: 'updateSecurity',
                    errors: err
                });
            });
        });
    },

    addMissingProperties: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'addMissingProperties',
                errors: null,
                results: null
            });
        }

        let properties = [{
            key: '_pAccess',
            val: 0
        }];
        async.eachSeries(properties, function (property, cb) {
            let query = {};
            let updateObj = {
                $set: {}
            };

            query[property.key] = {
                $exists: 0
            };
            updateObj.$set[property.key] = property.val;

            Utility.update({
                collection: 'points',
                query: query,
                updateObj: updateObj,
                options: {
                    multi: true
                }
            }, cb);
        }, function (err) {
            logger.info('Finished with addMissingProperties');
            callback(null, {
                fn: 'addMissingProperties',
                errors: err
            });
        });
    },

    removeProperties: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'removeProperties',
                errors: null,
                results: null
            });
        }

        let properties = ['VAV Channel', 'Port 1 Timeout', 'Port 2 Timeout', 'Port 3 Timeout', 'Port 4 Timeout', 'Channel.Min', 'Channel.Max',
            'Close Channel.Min', 'Close Channel.Max', 'Open Channel.Min', 'Open Channel.Max', 'Feedback Channel.Min', 'Feedback Channel.Max',
            'On Channel.Min', 'On Channel.Max', 'Off Channel.Min', 'Off Channel.Max', 'Device Address.Min', 'Device Address.Max', 'Repeat Count.Min', 'Repeat Count.Max',
            'Modbus Order.ValueOptions', {
                pointType: 'Remote Unit',
                prop: 'Modbus Order'
            }
        ];
        async.eachSeries(properties, function (property, cb) {
            let query = {};
            let updateObj = {
                $unset: {}
            };
            if (typeof property === 'string') {
                query[property] = {
                    $exists: 1
                };
                updateObj.$unset[property] = 1;
            } else {
                query[property.prop] = {
                    $exists: 1
                };
                query['Point Type.Value'] = property.pointType;
                updateObj.$unset[property.prop] = 1;
            }

            Utility.update({
                collection: 'points',
                query: query,
                updateObj: updateObj,
                options: {
                    multi: true
                }
            }, cb);
        }, function (err) {
            logger.info('Finished with removeProperties');
            callback(null, {
                fn: 'removeProperties',
                errors: err
            });
        });
    },

    applyDevModel: function (callback) {
        let afterVersion = '0.4.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'applyDevModel',
                errors: null,
                results: null
            });
        }
        Utility.iterateCursor({
            collection: 'points',
            query: {
                'Point Type.Value': {
                    $in: ['Analog Input', 'Analog Output', 'Binary Input', 'Binary Output', 'Accumulator']
                }
            }
        }, function (err, doc, cb) {
            Config.Utility.updDevModel({
                point: doc
            });
            utils.setChannelOptions(doc);
            Utility.update({
                collection: 'points',
                query: {
                    _id: doc._id
                },
                updateObj: doc
            }, function (err, result) {
                cb(err);
            });
        }, function (err, count) {
            logger.info('Finished with applyDevModel');
            callback(null, {
                fn: 'applyDevModel',
                errors: err
            });
        });
    },

    addFeedbackInstance: function (callback) {
        let afterVersion = '0.5.1';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'addFeedbackInstance',
                errors: null,
                results: null
            });
        }
        Utility.iterateCursor({
            collection: 'points',
            query: {
                'Point Type.Value': 'Binary Output'
            }
        }, function (err, doc, cb) {
            doc['Feedback Instance'] = Config.Templates.getTemplate('Binary Output')['Feedback Instance'];
            doc['Feedback Instance'].Value = doc['Feedback Channel'].eValue;
            doc = Config.EditChanges.applyBinaryOutputTypeFeedbackType({
                point: doc
            });
            Utility.update({
                collection: 'points',
                query: {
                    _id: doc._id
                },
                updateObj: doc
            }, function (err, result) {
                cb(err);
            });
        }, function (err, count) {
            logger.info('Finished with addFeedbackInstance');
            callback(null, {
                fn: 'addFeedbackInstance',
                errors: err
            });
        });
    },
    convertSQLiteDB: function (callback) {
        let afterVersion = '0.6.0';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'convertSQLiteDB',
                errors: null,
                results: null
            });
        }
        let startYear = 2012;
        let maxYear = 2020;
        const ArchiveUtility = require('../models/archiveutility');
        let History = require('../models/history');
        let historyModel = new History();
        async.whilst(() => {
            return startYear <= maxYear;
        }, (cb) => {
            let oldLocation = config.get('Infoscan.files').archiveLocation + config.get('Infoscan.dbConfig').dbName + '/';
            let oldArchive = new ArchiveUtility(oldLocation, 'History_' + startYear);
            let month = 1;
            async.whilst(() => {
                return month <= 12;
            }, (cb2) => {
                let oldHistory = oldArchive.define('History_' + startYear + '' + ((month < 10) ? '0' + month : month), {
                    upi: {
                        type: ArchiveUtility.INTEGER,
                        primaryKey: true
                    },
                    timestamp: {
                        type: ArchiveUtility.INTEGER,
                        primaryKey: true
                    },
                    value: {
                        type: ArchiveUtility.REAL
                    },
                    valueType: {
                        type: ArchiveUtility.INTEGER
                    },
                    statusFlags: {
                        type: ArchiveUtility.INTEGER,
                        defaultValue: 0
                    },
                    userEdited: {
                        type: ArchiveUtility.INTEGER,
                        defaultValue: 0
                    }
                });
                month++;
                oldHistory.sync().then(() => {
                    return oldHistory.findAll({
                        attributes: [
                            ['upi', 'upi'],
                            ['timestamp', 'timestamp'],
                            ['value', 'value'],
                            ['valueType', 'valueType'],
                            ['statusFlags', 'statusFlags'],
                            ['userEdited', 'userEdited']
                        ],
                        raw: true
                    });
                }).then((points) => {
                    historyModel.addToSQLite(points, cb2);
                }).catch(cb2);
            }, function (err) {
                startYear++;
                cb(err);
            });
        }, (err) => {
            logger.info('Finished with convertSQLiteDB');
            callback(null, {
                fn: 'convertSQLiteDB',
                errors: err
            });
        });
    },
    convertUpis: function (callback) {
        let afterVersion = '0.6.0';
        if (!checkVersions(afterVersion)) {
            return callback(null, {
                fn: 'convertUpis',
                errors: null,
                results: null
            });
        }

        let importApp = new Import();

        importApp.changeUpis((err) => {
            importApp.updateHistory((err) => {
                importApp.cleanupDB((err) => {
                    logger.info('Finished with convertUpis');
                    callback(null, {
                        fn: 'convertUpis',
                        errors: null
                    });
                });
            });
        });
    }
};


db.connect(connectionString, function (err) {
    if (err) {
        return logger.debug(err);
    }
    // Array of tasks that should be run
    let tasks = [];
    for (let task in scripts) {
        tasks.push(scripts[task]);
    }

    tasks = [scripts.convertUpis];

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
    Utility.getOne({
        collection: 'SystemInfo',
        query: {
            'Name': 'Preferences'
        },
        fields: {
            'InfoscanJS Version': 1
        }
    }, function (err, prefVersion) {
        prevVersion = prefVersion['InfoscanJS Version'] || 0;
        async.series(tasks, function done(err, results) {
            if (err) {
                logger.info('Error: ', err);
            }
            console.log('Results: ', results);

            if (!!options.noupdate) {
                logger.info('not updating db version.');
                //added a clean exit for when scripts are done
                process.exit(0);
            } else {
                Utility.update({
                    collection: 'SystemInfo',
                    query: {
                        'Name': 'Preferences'
                    },
                    updateObj: {
                        $set: {
                            'InfoscanJS Version': curVersion
                        }
                    }
                }, function (err, result) {
                    process.exit(0);
                });
            }
        });
    });
});
