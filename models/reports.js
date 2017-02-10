let fs = require('fs');

let async = require('async');
let moment = require('moment');
let ObjectID = require('mongodb').ObjectID;
let config = require('config');

let Utility = require('../models/utility');
let History = require('../models/history');
let utils = require('../helpers/utils.js');
let historyCollection = utils.CONSTANTS('HISTORYCOLLECTION'); // points to "historydata"
let Config = require('../public/js/lib/config');
let logger = require('../helpers/logger')(module);
let pageRender = require('../models/pagerender');
let mailer = require('../models/mailer');

let actLogsEnums = Config.Enums['Activity Logs'];
let activityLogCollection = utils.CONSTANTS('activityLogCollection');

module.exports = Rpt = {

    getMRT: function (data, cb) {
        let criteria = {
            query: {
                _id: utils.converters.convertType(data.id)
            },
            collection: 'points',
            fields: {
                'MRTData': 1
            }
        };

        Utility.get(criteria, function (err, result) {
            if (!err) {
                if (!result) {
                    return cb('No mrt file found');
                } else if (result.MRTData) {
                    return cb(null, result.MRTData);
                } 
                    return cb("No mrt file found");
                
            } else {
                return cb(err);
            }
        });
    },
    saveMRT: function (data, cb) {
        let criteria = {
            collection: 'points',
            query: {
                _id: utils.converters.convertType(data.id)
            },
            updateObj: {
                $set: {
                    'MRTData': data.MRTData
                }
            }
        };

        Utility.update(criteria, function (err, result) {
            if (!err) {
                return cb(null, {
                    _idd: null,
                    id: utils.converters.convertType(data.id),
                    data: 'Data has been saved successfully!!!'
                });
            } return cb(err);
        });
    },
    saveSVG: function (data, cb) {
        let criteria = {
            collection: 'points',
            query: {
                _id: utils.converters.convertType(data.id)
            },
            updateObj: {
                $set: {
                    'SVGData': data.SVGData
                }
            }
        };

        Utility.update(criteria, function (err, result) {
            if (!err) {
                return cb(null, {
                    data: 'Data has been saved successfully!!!'
                });
            } 
                return cb(err);
            
        });
    },
    saveReport: function (data, cb) {
        data['Point Type'] = {
            eValue: Config.Enums['Point Types'].Report.enum
        };

        let logData = {
            user: data.user,
            timestamp: Date.now(),
            point: data,
            activity: actLogsEnums['Report Edit'].enum,
            log: 'Report edited.'
        };

        let criteria = {
            collection: 'points',
            query: {
                _id: utils.converters.convertType(data._id)
            },
            updateObj: {
                $set: {
                    _pStatus: (!!data._pStatus ? data._pStatus : 0),
                    name1: data.name1,
                    name2: data.name2,
                    name3: data.name3,
                    name4: data.name4,
                    'Point Refs': data['Point Refs'],
                    'Report Config': data['Report Config']
                }
            }
        };

        let logObj = utils.buildActivityLog(logData);

        Utility.update(criteria, function (err, result) {
            Utility.insert({
                collection: activityLogCollection,
                insertObj: logObj
            }, function (err, result) {
                if (!err) {
                    return cb(err, {
                        data: 'Report has been saved successfully!!!'
                    });
                } 
                    return cb(err, null);
                
            });
        });
    },
    getSVG: function (data, cb) {
        let criteria = {
            query: {
                _id: utils.converters.convertType(data.id)
            },
            collection: 'points',
            fields: {
                'SVGData': 1
            }
        };

        Utility.get(criteria, function (err, result) {
            if (!err) {
                return cb(null, result.SVGData);
            } 
                return cb(err);
            
        });
    },
    getHistoryPoints: function (data, cb) {
        let criteria = {
            query: {},
            collection: 'historydata',
            field: 'upi',
            options: {
                limit: 50
            }
        };

        Utility.get(criteria, function (err, result) {
            if (!err) {
                if (!result) {
                    return cb('No results found');
                } 
                    getPoints(result, cb);
                
            } else
                {return cb(err);}
        });
    },
    historySearch: function (data, cb) {
        let startTime = data.startTime;
        let endTime = data.endTime;

        let upis = data.upis;

        let criteria = {
            query: {
                _id: {
                    $in: upis
                }
            },
            collection: 'points',
            fields: {
                'Value': 1,
                Name: 1
            }
        };

        Utility.get(criteria, function (err, points) {
            criteria = {
                query: [{
                    $match: {
                        timestamp: {
                            '$gte': startTime,
                            '$lte': endTime
                        },
                        upi: {
                            '$in': upis
                        }
                    }
                }, {
                    $sort: {
                        timestamp: -1
                    }
                }, {
                    $group: {
                        _id: '$upi',
                        data: {
                            $push: {
                                timestamp: '$timestamp',
                                Value: '$value'
                            }
                        }

                    }
                }, {
                    $project: {
                        _id: 0,
                        upi: '$_id',
                        data: '$data'
                    }
                }],
                collection: 'historydata'
            };

            Utility.aggregate(criteria, function (err, histPoints) {
                if (err)
                    {return cb(err);}

                for (let a = 0; a < histPoints.length; a++) {

                }
                async.eachSeries(histPoints, function (historyPoint, callback) {
                    if (historyPoint.data[historyPoint.data.length - 1].timestamp !== startTime) {
                        criteria = {
                            query: {
                                upi: historyPoint.upi,
                                timestamp: {
                                    $lt: startTime
                                }
                            },
                            collection: 'historydata',
                            fields: {
                                timestamp: 1,
                                value: 1
                            },
                            limit: 1,
                            sort: {
                                timestamp: -1
                            }
                        };

                        Utility.get(criteria, function (err, nextOldest) {
                            historyPoint.data.push(nextOldest);
                            fixHistoryData(historyPoint, points);
                            callback(err);
                        });
                    } else {
                        fixHistoryData(historyPoint, points);
                        callback(null);
                    }
                }, function (err) {
                    // JS console.log("historySearch()", new Date() - start);
                    return cb(err, histPoints);
                });
            });
        });

        function fixHistoryData(histPoint, points) {
            /*
             points - points from the 'points' collection that are represented in the historydata collection's query
             histPoints - points of history data that has been aggregated from the 'historydata' collection

             while iterating though the histPoints
             for each of the return points, when the historydata point's match has been found, check if the point's value is an enum.
             for every value in the historydata's data array, update the value to be the enum option from the point's valueoptions
             */

            for (b = 0; b < points.length; b++) {
                if (histPoint.upi === points[b]._id) {
                    if (points[b].Value.ValueType === 5) {
                        for (let c = 0; c < histPoint.data.length; c++) {
                            for (let option in points[b].Value.ValueOptions) {
                                if (points[b].Value.ValueOptions[option] === histPoint.data[c].Value) {
                                    histPoint.data[c].eValue = histPoint.data[c].Value;
                                    histPoint.data[c].Value = option;
                                }
                            }
                        }
                    }
                    histPoint.Name = points[b].Name;
                }
            }
            return;
        }
    },
    historyDataSearch: function (data, cb) {
        let reportConfig = data.reportConfig,
            checkForOldest = {},
            criteria = {},
            endTime = data.range.end,
            getNextOldest,
            intervalOptions = reportConfig.interval,
            returnLimit = (reportConfig.limit) ? reportConfig.limit : 200,
            noOlderTimes = [],
            returnObj = {},
            returnPoints = [],
            searchCriteria = {},
            startTime = data.range.start,
            timeSlotLimit = 200,
            timestamps,
            tooManyFlag = false,
            upis = data.upis,
            justUpis = [],
            i,
            qualityCodes = global.qualityCodes;

        let makeTimestamps = function (timestampObjects) {
            let timestamps = timestampObjects.map(function (ts) {
                return ts.start;
            });

            return timestamps;
        };

        //logger.info(" - historyDataSearch() data: " + JSON.stringify(data));
        for (i = 0; i < upis.length; i++) {
            if (upis[i] === 0) {
                upis.splice(i, 1);
                continue;
            }
            checkForOldest[upis[i]] = true;
        }

        justUpis = upis.map(function (res) {
            return res.upi;
        });

        // make timestamps as normal then convert to new id. find all between min/max and any that match
        //timestamps = buildTimestamps(startTime, endTime, interval, offset);
        timestamps = makeTimestamps(buildIntervals(data.range, intervalOptions));

        searchCriteria = {
            upi: {
                $in: justUpis
            },
            timestamp: {
                $in: timestamps
            },
            $and: [{
                timestamp: {
                    $gte: startTime
                }
            }, {
                timestamp: {
                    $lte: endTime
                }
            }]
        };

        // find points in points collection to get name and valueoptions if needed
        criteria = {
            query: {
                _id: {
                    $in: justUpis
                }
            },
            collection: 'points'
        };
        // logger.info("---------");
        // logger.info(" - historyDataSearch() criteria = " + JSON.stringify(criteria));
        // logger.info("---------");
        Utility.get(criteria, function (err, points) {
            if (err)
                {return cb(err, null);}

            criteria = {
                query: searchCriteria,
                collection: 'historydata',
                sort: {
                    timestamp: -1
                }
            };

            Utility.get(criteria, function (err, histPoints) {
                if (err) {
                    return cb(err, null);
                }
                History.findHistory({
                    upis: justUpis,
                    range: {
                        start: startTime,
                        end: endTime
                    },
                    timestamps: timestamps
                }, function (err, results) {
                    for (let h = 0; h < histPoints.length; h++) {
                        let hadTS = false;
                        for (let r = 0; r < results.length; r++) {
                            if (histPoints[h].upi === results[r].upi) {
                                if (histPoints[h].timestamp === results[r].timestamp) {
                                    hadTS = true;
                                }
                            }
                        }
                        if (!hadTS) {
                            results.push(histPoints[h]);
                        }
                    }
                    histPoints = results;
                    async.eachSeries(timestamps.reverse(), function (ts, callback1) {
                            //convert id to ts and upi
                        returnObj = {
                                timestamp: ts,
                                HistoryResults: []
                            };
                        async.eachSeries(justUpis, function (upi, callback2) {
                                if (noOlderTimes.indexOf(upi) !== -1) {
                                    for (let x = 0; x < points.length; x++) {
                                        if (points[x]._id === upi) {
                                            returnObj.HistoryResults.push({
                                                upi: upi,
                                                Name: points[x].Name
                                            });
                                        }
                                    }
                                    //setTimeout(function() {
                                    callback2(null);
                                    //}, 1);
                                } else {
                                    getNextOldest = true;
                                    for (let w = 0; w < histPoints.length; w++) {
                                        if (histPoints[w].timestamp === ts && histPoints[w].upi === upi) {
                                            for (let y = 0; y < points.length; y++) {
                                                if (points[y]._id === histPoints[w].upi) {
                                                    returnObj.HistoryResults.push(buildHistoryValue(points[y], histPoints[w]));
                                                }
                                            }
                                            getNextOldest = false;
                                        }
                                    }

                                    if (getNextOldest) {
                                        criteria = {
                                            query: {
                                                upi: upi,
                                                timestamp: {
                                                    $lt: ts //use id
                                                }
                                            },
                                            collection: historyCollection,
                                            sort: {
                                                timestamp: -1
                                            },
                                            limit: 1
                                        };
                                        Utility.get(criteria, function (err, nextOldest) {
                                            if (!!err) {
                                                return callback2(err);
                                            }

                                            History.findLatest({
                                                upis: [upi],
                                                range: {
                                                    end: ts
                                                }
                                            }, function (err, results) {
                                                if (!!results.length) {
                                                    if ((!!nextOldest.length && nextOldest[0].timestamp < results[0].timestamp) || !nextOldest.length) {
                                                        nextOldest = results;
                                                    }
                                                }
                                                for (let x = 0; x < points.length; x++) {
                                                    if (points[x]._id === upi) {
                                                        if (nextOldest.length > 0) {
                                                            if (nextOldest[0].upi === points[x]._id) {
                                                                returnObj.HistoryResults.push(buildHistoryValue(points[x], nextOldest[0]));
                                                            }
                                                        } else {
                                                            returnObj.HistoryResults.push({
                                                                upi: upi,
                                                                Name: points[x].Name,
                                                                Value: 'No Older Value'
                                                            });
                                                            noOlderTimes.push(upi);
                                                        }
                                                    }
                                                }
                                                callback2(err);
                                            });
                                        });
                                    } else {
                                        callback2(null);
                                    }
                                }
                            }, function (err) {
                                returnPoints.push(returnObj);
                                if (returnPoints.length % 500 === 0) {
                                    setTimeout(function () {
                                        callback1(err);
                                    }, 0);
                                } else {
                                    callback1(err);
                                }
                            });
                    },
                        function (err) {
                            return cb(err, {
                                truncated: tooManyFlag,
                                historyData: returnPoints.reverse()
                            });
                        });
                });
            });
        });

        function buildHistoryValue(point, historyPoint) {
            let tempObj = {};
            tempObj.upi = historyPoint.upi;
            tempObj.Name = point.Name;
            tempObj.statusflag = setStatusFlag(historyPoint.statusflags);
            tempObj.ValueType = point.Value.ValueType;

            if (historyPoint.timestamp === startTime) {
                checkForOldest[historyPoint.upi] = false;
            }

            if (historyPoint.ValueType === 5) {
                for (let key in point.Value.ValueOptions) {
                    if (point.Value.ValueOptions[key] === historyPoint.Value) {
                        tempObj.Value = key.toString();
                        tempObj.eValue = historyPoint.Value.toString();
                    }
                }
            } else {
                tempObj.Value = historyPoint.Value.toString();
            }
            // console.log(tempObj);
            return tempObj;
        }

        function setStatusFlag(statusflag) {
            //4 8 1 2

            if ((statusflag & Config.Enums['Status Flags Bits']['In Fault'].enum) !== 0) {
                return getStatusChar('Fault');
            } else if ((statusflag & Config.Enums['Status Flags Bits']['In Alarm'].enum) !== 0) {
                return getStatusChar('Abnormal');
            } else if ((statusflag & Config.Enums['Status Flags Bits']['Out of Service'].enum) !== 0) {
                return getStatusChar('Out of Service');
            } else if ((statusflag & Config.Enums['Status Flags Bits'].Override.enum) !== 0) {
                return getStatusChar('Override');
            } 
                return "";
            

            function getStatusChar(status) {
                for (let index in qualityCodes) {
                    if (qualityCodes[index]['Quality Code Label'] === status)
                        {return qualityCodes[index]["Quality Code"];}
                }
            }
        }

        function buildTimestamps(startTime, endTime, interval, offset) {
            let minute = 60,
                hour = minute * 60,
                day = hour * 24,
                week = day * 7,
                timestampInterval = 0,
                timestamps = [],
                prevTime = parseInt(startTime, 10);

            endTime = parseInt(endTime, 10);
            offset = (offset) ? parseInt(offset, 10) : 1;
            interval = (interval) ? parseInt(interval, 10) : 0;

            switch (interval) {
                case 0: //minute
                    timestampInterval = minute * offset;
                    break;
                case 1: //hour
                    timestampInterval = hour * offset;
                    break;
                case 2: //day
                    timestampInterval = day * offset;
                    break;
                case 3: //week
                    timestampInterval = week * offset;
                    break;
                case 4: // month
                    break;
                case 5: // year
                    break;
                default:
                    logger.info(' - - - - - - - - interval is DEFAULT');
                    break;
            }

            //logger.info(" - - - - - - - - interval = " + interval + "  timestampInterval = " + timestampInterval);

            if (timestampInterval !== 0) {
                //logger.info(" - - - - - prevTime = " + prevTime + "   - - endTime = " + endTime);
                while (prevTime <= endTime && timestamps.length < timeSlotLimit) {
                    //logger.info(" - - - - - prevTime = " + prevTime + "   - - endTime = " + endTime);
                    timestamps.push(prevTime);
                    prevTime += timestampInterval;
                }
            } else {
                let prevInterval;

                if (interval === 4) { //month
                    prevInterval = new Date(startTime * 1000).getMonth();

                    while (prevTime <= endTime && timestamps.length < timeSlotLimit) {
                        timestamps.push(prevTime);

                        if (prevInterval == 11) {
                            prevInterval = 0;
                            prevTime = Math.floor(new Date(new Date(prevTime * 1000).setMonth(prevInterval)).setFullYear(new Date(prevTime * 1000).getFullYear() + 1) / 1000);
                        } else {
                            prevTime = Math.floor(new Date(prevTime * 1000).setMonth(++prevInterval) / 1000);
                        }
                    }
                } else if (interval === 5) { //year
                    prevInterval = new Date(startTime * 1000).getFullYear();

                    while (prevTime <= endTime && timestamps.length < timeSlotLimit) {
                        timestamps.push(prevTime);
                        prevTime = Math.floor(new Date(prevTime * 1000).setFullYear(++prevInterval) / 1000);
                    }
                } else {
                    //bad interval
                }
            }

            tooManyFlag = (timestamps.length < timeSlotLimit);
            return timestamps;
        }
    },
    reportMain: function (data, cb) {
        let reportCriteria = {
                query: {
                    _id: utils.converters.convertType(data.id)
                },
                collection: 'points',
                data: data,
                limit: 1
            },
            scheduleCriteria = {
                query: {
                    _id: new ObjectID(data.scheduleID)
                },
                collection: 'Schedules',
                data: data,
                limit: 1
            },
            scheduled = (!!data.scheduleID),
            reportResults = {},
            reportRequestComplete = false,
            scheduleRequestComplete = false,
            reportData,
            getValueTypes = function (data) {
                'use strict';
                let i,
                    column,
                    filter;
                if (data['Report Config'].columns) {
                    for (i = 1; i < data['Report Config'].columns.length; i++) {
                        column = data['Report Config'].columns[i];
                        column.valueType = Config.Enums.Properties[column.colName].valueType;
                    }
                }

                if (data['Report Config'].filters) {
                    for (i = 0; i < data['Report Config'].filters.length; i++) {
                        filter = data['Report Config'].filters[i];
                        filter.valueType = Config.Enums.Properties[filter.filterName].valueType;
                    }
                }

                return data;
            },
            handleResults = function () {
                'use strict';
                if (scheduled) {
                    if (scheduleRequestComplete && reportRequestComplete) {
                        reportResults.scheduledConfig = JSON.stringify(reportResults.scheduledConfig); 
                        return cb(null, reportResults, reportData);
                    }
                } else {
                    return cb(null, reportResults, reportData);
                }
            };

        if (scheduled) {
            Utility.get(scheduleCriteria, function (err, scheduleData) {
                if (err) {
                    return cb(err);
                } 
                    scheduleData = scheduleData[0];
                    if (scheduleData === null) {
                        return cb();
                    } else {
                        reportResults.scheduledConfig = {};
                        reportResults.scheduledConfig.duration = scheduleData.optionalParameters.duration;
                        reportResults.scheduledConfig.interval = scheduleData.optionalParameters.interval;
                        reportResults.scheduledConfig.scheduledIncludeChart = data.scheduledIncludeChart;
                    }
                    scheduleRequestComplete = true;
                    handleResults();
                
            });
            Utility.get(reportCriteria, function (err, result) {
                if (err) {
                    return cb(err);
                } 
                    result = result[0];
                    if (!!result) {
                        if (result["Report Type"].Value === "Property") {
                            result = getValueTypes(result);
                        }
                        reportResults.id = data.id;
                        reportResults.point = JSON.stringify(result);

                        reportData = result;
                        reportRequestComplete = true;
                        handleResults();
                    } else {
                        return cb();    // error
                    }
                
            });
        } else {
            Utility.getWithSecurity(reportCriteria, function (err, result) {
                if (err) {
                    return cb(err);
                } 
                    result = result[0];
                    if (!!result) {
                        if (result["Report Type"].Value === "Property") {
                            result = getValueTypes(result);
                        }
                        reportResults.id = data.id;
                        reportResults.point = JSON.stringify(result);
                        reportData = result;
                        reportRequestComplete = true;
                        handleResults();
                    } else {
                        return cb();    // error
                    }
                
            });
        }
    },
    reportSearch: function (data, cb) {
        let reportConfig = data.reportConfig,
            reportType = data.reportType,
            pointRefs = data['Point Refs'],
            filters = reportConfig.filters,
            pointFilter = reportConfig.pointFilter,
            fields = {},
            getPointRefs = false,
            selectedPointTypes = (!!pointFilter.selectedPointTypes.length) ? pointFilter.selectedPointTypes : Config.Utility.pointTypes.getAllowedPointTypes().map(function (type) {
                return type.key;
            }),
            uniquePIDs = [],
            properties = reportConfig.columns,
            sort = data.Sort,
            sortObject = {},
            nameQuery,
            searchCriteria = {
                $and: []
            },
            returnLimit = utils.converters.convertType(reportConfig.returnLimit),
            parseNameField = function (paramsField, fieldName) {
                let parsedNameField = {};
                if (paramsField !== null && paramsField !== undefined) {
                    //logger.info("- - - - - - -------------- parseNameField() paramsField = [" + paramsField + "]");
                    if (paramsField === 'ISBLANK') {
                        parsedNameField[fieldName] = '';
                    } else {
                        parsedNameField[fieldName] = {
                            '$regex': '(?i)^' + paramsField
                        };
                    }
                }
                return parsedNameField;
            };

        //logger.info("- - - - - - - data = " + JSON.stringify(data));
        if (properties) {
            for (let k = 0; k < properties.length; k++) {
                // let p = properties[k].colName;
                let p = utils.getDBProperty(properties[k].colName);
                if (Config.Utility.getUniquePIDprops().indexOf(p) !== -1) {
                    fields['Point Refs'] = true;
                    uniquePIDs.push(p);
                    getPointRefs = true;
                } else {
                    fields[propertyCheckForValue(p)] = true;
                }
            }
            fields['Point Type.Value'] = true;
        }

        if (selectedPointTypes && selectedPointTypes.length > 0) {
            searchCriteria.$and.push({
                'Point Type.Value': {
                    $in: selectedPointTypes
                }
            });
        }

        for (let i = 1; i < 5; i++) {
            key = 'name' + i;
            if (pointFilter[key]) {
                nameQuery = parseNameField(pointFilter[key], ('name' + i));
                if (nameQuery) {
                    searchCriteria.$and.push(nameQuery);
                }
            }
        }

        if (filters && filters.length > 0) {
            searchCriteria.$and.push(Rpt.collectFilters(filters, pointRefs));
        }

        if (sort) {
            for (let key2 in sort) {
                sortObject[key2] = (sort[key2] == 'ASC') ? 1 : -1;
            }
        }

        if (searchCriteria.$and.length === 0) {
            searchCriteria = {};
        }

        //logger.info("--- Report Search Criteria = " + JSON.stringify(searchCriteria) + " --- fields = " + JSON.stringify(fields));
        let criteria = {
            query: searchCriteria,
            collection: 'points',
            limit: returnLimit,
            fields: fields
        };

        // logger.info("--- Report criteria = " + JSON.stringify(criteria));
        Utility.get(criteria, function (err, docs) {
            if (err) {
                return cb(err);
            }

            if (getPointRefs === true) {
                for (let i = 0; i < docs.length; i++) {
                    for (let m = 0; m < docs[i]['Point Refs'].length; m++) {
                        if (uniquePIDs.indexOf(docs[i]['Point Refs'][m].PropertyName) > -1 && docs[i][docs[i]['Point Refs'][m].PropertyName] === undefined) {
                            docs[i][docs[i]['Point Refs'][m].PropertyName] = docs[i]['Point Refs'][m];
                        }
                    }
                    delete docs[i]['Point Refs'];
                }
            }
            docs.forEach(function (doc) {
                for (let prop in doc) {
                    let newPropertyName = utils.getHumanProperty(prop);
                    if (prop !== newPropertyName) {
                        doc[newPropertyName] = utils.getHumanPropertyObj(prop, doc[prop]);
                        if (prop !== '_id') {
                            delete doc[prop];
                        }
                    }
                }
            });
            return cb(null, docs);
        });
    },
    collectFilters: function (theFilters, reportPointRefs) {
        let currentFilter,
            localSearchCriteria = {},
            andExpressions = [],
            orExpressions = [],
            currentIndex = 0,
            numberOfFilters = theFilters.length,
            getPointRefByAppIndex = function (appIndex) {
                let result,
                    i;

                for (i = 0; i < reportPointRefs.length; i++) {
                    if (reportPointRefs[i].AppIndex === appIndex) {
                        result = reportPointRefs[i];
                        break;
                    }
                }

                return result;
            },
            collectFilter = function (filter) {
                let searchQuery = {},
                    // change key to internal property if possible.
                    key = utils.getDBProperty(filter.filterName),
                    searchKey = key,
                    searchPart1 = {},
                    searchPart2 = {},
                    pointRef,
                    filterValueType = (Config.Enums.Properties.hasOwnProperty(key)) ? Config.Enums.Properties[key].valueType : null;

                if (Config.Utility.getUniquePIDprops().indexOf(key) !== -1) {
                    pointRef = getPointRefByAppIndex(filter.AppIndex);
                    switch (filter.operator) {
                        case 'EqualTo':
                            searchQuery = {
                                'Point Refs': {
                                    $elemMatch: {
                                        'PropertyName': key,
                                        'Value': (!!pointRef ? pointRef.Value : 0)
                                    }
                                }
                            };

                            break;
                        case 'NotEqualTo':
                            searchQuery = {
                                'Point Refs': {
                                    $elemMatch: {
                                        'PropertyName': key,
                                        'Value': {
                                            $ne: (!!pointRef ? pointRef.Value : 0)
                                        }
                                    }
                                }
                            };
                            break;
                    }
                } else {
                    switch (filter.operator) {
                        case 'Containing':
                            searchQuery[key] = {
                                $regex: '.*(?i)' + filter.value + '.*'
                            };
                            break;
                        case 'NotContaining':
                            let re = new RegExp(filter.value, i);
                            searchQuery[key] = {
                                $not: re
                            };
                            break;
                        case 'EqualTo':
                            if (filter.valueType === 'Enum' && utils.converters.isNumber(filter.evalue)) {
                                if (filter.evalue === -1) {
                                    searchQuery[propertyCheckForValue(key)] = {
                                        $eq: ''
                                    };
                                } else {
                                    if (filterValueType !== null) {
                                        searchKey = key + '.eValue';
                                    } else {
                                        searchKey = key;
                                    }
                                    searchQuery[searchKey] = filter.evalue;
                                }
                            } else if (filter.valueType === 'Bool') {
                                if (utils.converters.isNumber(filter.value)) {
                                    searchQuery[propertyCheckForValue(key)] = {
                                        $in: [utils.converters.convertType(filter.value, filter.valueType), (filter.value === 1)]
                                    };
                                } else {
                                    searchQuery[propertyCheckForValue(key)] = {
                                        $eq: filter.value
                                    };
                                }
                            } else if (utils.converters.isNumber(filter.value)) {
                                searchQuery[propertyCheckForValue(key)] = utils.converters.convertType(filter.value, filter.valueType);
                            } else if (filter.value.indexOf(',') > -1) {
                                let splitValues = filter.value.split(',');
                                //if (!searchCriteria.$or)
                                //    searchCriteria.$or = [];
                                let new$or = {};
                                new$or.$or = [];
                                for (let kk = 0; kk < splitValues.length; kk++) {
                                    let ppp = {};
                                    if (utils.converters.isNumber(splitValues[kk])) {
                                        ppp[key] = convertType(splitValues[kk]);
                                    } else {
                                        ppp[key] = splitValues[kk];
                                    }
                                    new$or.$or.push(ppp);
                                }
                            } else if (utils.converters.isNumber(filter.value)) {
                                    searchQuery[propertyCheckForValue(key)] = utils.converters.convertType(filter.value, filter.valueType);
                                } else {
                                    searchQuery[propertyCheckForValue(key)] = {
                                        $regex: '(?i)^' + filter.value
                                    };
                                }
                            break;
                        case 'NotEqualTo':
                            searchPart1[key] = {
                                $exists: true
                            };
                            searchQuery.$and = [];
                            searchQuery.$and.push(searchPart1);
                            if (filter.valueType === 'Enum' && utils.converters.isNumber(filter.evalue)) {
                                if (filter.evalue === -1) {
                                    searchPart2[propertyCheckForValue(key)] = {
                                        $ne: ''
                                    };
                                } else {
                                    if (filterValueType !== null) {
                                        searchKey = key + '.eValue';
                                    } else {
                                        searchKey = key;
                                    }
                                    searchPart2[searchKey] = {
                                        $ne: filter.evalue
                                    };
                                }
                            } else if (filter.valueType === "Bool") {
                                    if (utils.converters.isNumber(filter.value)) {
                                        searchPart2[propertyCheckForValue(key)] = {
                                            $nin: [utils.converters.convertType(filter.value, filter.valueType), (filter.value === 1)]
                                        };
                                    } else {
                                        searchPart2[propertyCheckForValue(key)] = {
                                            $ne: filter.value
                                        };
                                    }
                                } else if (utils.converters.isNumber(filter.value)) {
                                    searchPart2[propertyCheckForValue(key)] = {
                                        $ne: utils.converters.convertType(filter.value, filter.valueType)
                                    };
                                } else {
                                    searchPart2[propertyCheckForValue(key)] = {
                                        $regex: '(?i)^(?!' + filter.value + ")"
                                            //$ne: utils.converters.convertType(filter.value, filter.valueType)
                                    };
                                }

                            searchQuery.$and.push(searchPart2);
                            break;
                        case 'LessThan':
                            searchQuery[propertyCheckForValue(key)] = {
                                $lt: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'LessThanOrEqualTo':
                            searchQuery[propertyCheckForValue(key)] = {
                                $lte: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'GreaterThan':
                            searchQuery[propertyCheckForValue(key)] = {
                                $gt: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'GreaterThanOrEqualTo':
                            searchQuery[propertyCheckForValue(key)] = {
                                $gte: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'BeginningWith':
                            searchQuery[propertyCheckForValue(key)] = {
                                $regex: '^(?i)' + filter.value + '.*'
                            };
                            break;
                        case 'EndingWith':
                            searchQuery[propertyCheckForValue(key)] = {
                                $regex: '(?i)' + filter.value + '*$'
                            };
                            break;
                        case 'Between':
                            searchQuery[key] = {
                                $exists: true
                            };
                            searchQuery[propertyCheckForValue(key)] = {
                                $gte: utils.converters.convertType(filter.value, filter.valueType),
                                $lte: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'NotBetween':
                            searchQuery[key] = {
                                $exists: true
                            };
                            //{$nin:{$gte:2,$lt:5}}
                            searchQuery[propertyCheckForValue(key)] = {
                                $nin: {
                                    $gte: utils.converters.convertType(filter.value, filter.valueType),
                                    $lt: utils.converters.convertType(filter.value, filter.valueType)
                                }
                            };
                            break;
                    }
                }
                return searchQuery;
            },
            groupLogic = function (logicType) {
                let group = [],
                    sameGroup = true;

                while (currentFilter !== undefined && sameGroup) {
                    if (currentFilter.condition === logicType && group.length > 0) {
                        currentIndex--;
                        sameGroup = false;
                    } else {
                        group.push(collectFilter(currentFilter));
                        currentFilter = theFilters[currentIndex++];
                    }
                }
                done = (currentFilter === undefined);

                return Rpt.groupOrExpression(group);
            };

        localSearchCriteria.$or = [];
        while (currentIndex < numberOfFilters) {
            currentFilter = theFilters[currentIndex++];
            if (currentFilter === undefined) {
                break;
            } else {
                switch (currentFilter.condition) {
                    case '$and':
                        andExpressions.push(collectFilter(currentFilter));
                        break;
                    case '$or':
                        orExpressions.push(groupLogic('$or'));
                        break;
                    default:
                        break;
                }
            }

            //logger.info(" - - expressions = " + expressions);
            //logger.info(" - - andExpressions = " + andExpressions);
            //logger.info(" - - orExpressions = " + orExpressions);
        }

        if (andExpressions.length > 0) {
            localSearchCriteria.$or = localSearchCriteria.$or.concat({
                $and: andExpressions
            });
        }

        if (orExpressions.length > 0) {
            localSearchCriteria.$or = localSearchCriteria.$or.concat(orExpressions);
        }

        //logger.info(" - - collectFilter  localSearchCriteria = " + JSON.stringify(localSearchCriteria));
        return localSearchCriteria;
    },
    groupOrExpression: function (listOfExpressions) {
        let concatJSON = {},
            tempObj = {},
            i;

        for (i = 0; i < listOfExpressions.length; i++) {
            tempObj = listOfExpressions[i];
            for (let prop in tempObj) {
                if (tempObj.hasOwnProperty(prop)) {
                    concatJSON[prop] = tempObj[prop];
                }
            }
        }
        return concatJSON;
    },
    totalizerReport: function (data, cb) {
        //logger.info(" - totalizerReport() data: " + JSON.stringify(data));
        let points = data.upis;
        let reportConfig = data.reportConfig;
        let range = data.range;
        let intervalOptions = reportConfig.interval;

        let compare = function (a, b) {
            return a.timestamp - b.timestamp;
        };

        let findStarts = function (initial, history) {
            let totals = [];
            let previousValue = (initial.hasOwnProperty('Value')) ? initial.Value : 0;
            intervals.forEach(function (interval, index) {
                let starts = 0;
                let start = interval.start;
                let end = (moment().unix() < interval.end) ? moment().unix() : interval.end;

                let matches = history.filter(function (data) {
                    return data.timestamp > start && data.timestamp <= end;
                });

                for (let i = 0; i < matches.length; i++) {
                    if (previousValue === 0 && matches[i].Value !== 0) {
                        starts++;
                    }
                    previousValue = matches[i].Value;
                }

                let result = {
                    total: starts,
                    range: {
                        start: start,
                        end: end
                    }
                };

                totals.push(result);
            });

            return totals;
        };

        let findRuntime = function (initial, history) {
            let totals = [];
            let previousValue = (initial.hasOwnProperty('Value')) ? initial.Value : 0;

            intervals.forEach(function (interval, index) {
                // console.log(interval);
                let runtime = 0;
                let now = moment().unix();
                let intervalLonger = now < interval.end;
                let start = interval.start;
                let end = (!!intervalLonger) ? now : interval.end;

                let matches = history.filter(function (data) {
                    return data.timestamp > start && data.timestamp <= end;
                });

                if (!!matches.length) {
                    for (let i = 0; i < matches.length; i++) {
                        let currentValue = matches[i].Value;
                        if (previousValue !== 0 && currentValue === 0) {
                            runtime += matches[i].timestamp - start;
                        } else if (i === (matches.length - 1)) {
                            if (previousValue === 0 && currentValue !== 0) {
                                runtime += end - matches[i].timestamp;
                            } else if (previousValue !== 0 && currentValue !== 0) {
                                runtime += end - start;
                            }
                        }
                        if (previousValue === 0 && currentValue !== 0) {
                            start = matches[i].timestamp;
                        }
                        previousValue = currentValue;
                    }
                } else if (previousValue !== 0) {
                    runtime = end - start;
                } else {
                    runtime = 0;
                }

                let result = {
                    total: runtime,
                    range: interval
                };
                totals.push(result);
            });

            return totals;
        };

        let findTotal = function (initial, history) {
            let totals = [];
            let value = 0;
            let startValue = 0;
            if (!!history.length) {
                if (initial.hasOwnProperty('Value')) {
                    value = initial.Value;
                    startValue = (initial.Value > history[0].Value) ? 0 : history[0].Value - initial.Value;
                } else {
                    value = history[0].Value;
                }
            } else {
                value = 0;
            }

            intervals.forEach(function (interval, index) {
                let total = startValue;
                startValue = 0;
                let start = interval.start;
                let end = (moment().unix() < interval.end) ? moment().unix() : interval.end;

                let matches = history.filter(function (data) {
                    return data.timestamp > start && data.timestamp <= end;
                });
                for (let i = 0; i < matches.length; i++) {
                    if (matches[i].Value >= value) {
                        total += matches[i].Value - value;
                        value = matches[i].Value;
                    } else {
                        // total += matches[i].Value;
                        value = matches[i].Value;
                    }
                }

                let result = {
                    total: total,
                    range: {
                        start: start,
                        end: end
                    }
                };

                totals.push(result);
            });

            return totals;
        };


        let intervals = buildIntervals(range, intervalOptions);

        let getInitialDataMongo = function (point, callback) {
            let history = [];
            let criteria = { //find initial data per point
                collection: 'historydata',
                query: {
                    timestamp: {
                        $lte: range.start
                    },
                    upi: point.upi
                },
                sort: {
                    timestamp: -1
                },
                limit: 1
            };
            Utility.get(criteria, function (err, initial) {
                callback(err, point, initial[0]);
            });
        };
        let getInitialDataSql = function (point, initial, callback) {
            History.findLatest({
                upis: [point.upi],
                range: { // range object gets overwritten in function, pass new obj
                    end: range.start
                }
            }, function (err, results) {
                let latestSql = results[0];
                if (!initial || (!!latestSql && latestSql.timestamp >= initial.timestamp)) {
                    initial = latestSql;
                }
                callback(null, point, initial || {});
            });
        };
        let getRangeDataMongo = function (point, initial, callback) {
            let criteria = {
                collection: 'historydata',
                query: {
                    upi: point.upi,
                    $and: [{
                        timestamp: {
                            $gt: range.start
                        }
                    }, {
                        timestamp: {
                            $lte: range.end
                        }
                    }]
                }
            };

            Utility.get(criteria, function (err, history) {
                callback(null, point, initial, history);
            });
        };
        let getRangeDataSql = function (point, initial, history, callback) {
            let exists = false;

            History.findHistory({
                upis: [point.upi],
                range: {
                    start: range.start,
                    end: range.end
                },
                fx: 'history'
            }, function (err, results) {
                for (let h = 0; h < history.length; h++) {
                    exists = false;
                    for (let r = 0; r < results.length; r++) {
                        if (results[r].timestamp === history[h].timestamp) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        results.push(history[h]);
                    }
                }

                callback(null, point, initial, results);
            });
        };

        let buildTotal = function (point, initial, history, callback) {
            history.sort(compare);

            switch (point.op) {
                case 'starts':
                    point.totals = findStarts(initial, history);
                    break;
                case 'runtime':
                    point.totals = findRuntime(initial, history);
                    break;
                case 'total':
                    point.totals = findTotal(initial, history);
                    break;
            }

            return callback(null);
        };

        async.eachSeries(points, function (point, seriesCb) {
            async.waterfall([async.apply(getInitialDataMongo, point), getInitialDataSql, getRangeDataMongo, getRangeDataSql, buildTotal], seriesCb);
        }, function (err) {
            return cb(err, points);
        });
    },
    scheduledReport: function (data, cb) {
        let domain = 'http://' + (!!config.get('Infoscan.letsencrypt').enabled ? config.get('Infoscan.domains')[0] : 'localhost');
        let schedule = data.schedule;
        let upi = schedule.upi;
        let emails = [];

        Utility.getOne({
            collection: 'points',
            query: {
                _id: upi
            },
            fields: {
                Name: 1
            }
        }, function (err, point) {
            if (!!point) {
                let reportName = point.Name;
                let users = schedule.users.map(function (id) {
                    return ObjectID(id);
                });
                let date = moment().format('YYYY-MM-DD');
                let path = [__dirname, '/../tmp/', date, reportName.split(' ').join(''), '.pdf'].join('');
                let uri = [domain, '/scheduleloader/report/scheduled/', upi, '?scheduleID=', schedule._id].join('');
                console.log(uri, path);
                pageRender.renderPage(uri, path, function (err) {
                    console.log(1, err);
                    fs.readFile(path, function (err, data) {
                        console.log(2, err);
                        Utility.iterateCursor({
                            collection: 'Users',
                            query: {
                                _id: {
                                    $in: users
                                }
                            }
                        }, function (err, user, nextUser) {
                            // figure out date/time
                            emails = emails.concat(user['Contact Info'].Value.filter(function (info) {
                                return info.Type === 'Email';
                            }).map(function (email) {
                                return email.Value;
                            }));

                            nextUser();
                        }, function (err, count) {
                            emails = emails.concat(schedule.emails).join(',');
                            mailer.sendEmail({
                                to: emails,
                                fromAccount: 'infoscan',
                                subject: [reportName, ' for ', date].join(''),
                                html: '<html><body><h1>You\'re welcome!</h1></body></html>',
                                attachments: [{
                                    path: path,
                                    contentType: 'application/pdf',
                                    content: data
                                }]
                            }, function (err, info) {
                                console.log(err, info);
                                cb(err);
                            });
                        });
                    });
                    // }, 5000);
                });
            } else {
                logger.info('   - -  scheduledReport() schedule._id = ' + schedule._id + '  unable to find Report with UPI = ' + upi);
            }
        });
    }
};

let buildIntervals = function (range, interval) {
    let intervalPeriod = interval.period;
    let intervalValue = interval.value;
    let intervalRanges = [];
    let intervalStart;
    let intervalEnd;
    let fixLongerInterval = function () {
        if (intervalEnd > range.end && intervalStart < range.end) {
            intervalEnd = range.end;
        }
    };

    intervalStart = moment.unix(range.start).unix();
    intervalEnd = moment.unix(range.start).add(intervalValue, intervalPeriod).unix();
    fixLongerInterval();
    while (intervalEnd <= range.end && intervalEnd <= moment().add(intervalValue, intervalPeriod).startOf(intervalPeriod).unix()) {
        intervalRanges.push({
            start: intervalStart,
            end: intervalEnd
        });
        intervalStart = moment.unix(intervalStart).add(intervalValue, intervalPeriod).unix();
        intervalEnd = moment.unix(intervalEnd).add(intervalValue, intervalPeriod).unix();
        fixLongerInterval();
    }

    return intervalRanges;
};

let buildPointRef = function (key, regex) {
    return {
        'Point Refs': {
            $elemMatch: {
                'PropertyName': key,
                'Value': regex
            }
        }
    };
};

let propertyCheckForValue = function (prop) {
    if (prop.match(/^name/i) !== null || Config.Enums['Internal Properties'].hasOwnProperty(prop)) {
        return prop;
    } 
        return prop + ".Value";
    
};

let getPoints = function (pointsCol, cb) {
    let criteria = {
        query: {
            _id: {
                $in: pointsCol
            }
        },
        collection: 'points',
        fields: {
            Name: 1
        },
        limit: 50
    };

    Utility.get(criteria, cb);
};
