var async = require('async');
var Utility = require('../models/utility');
var History = require('../models/history');
var utils = require('../helpers/utils.js');
var historyCollection = utils.CONSTANTS("HISTORYCOLLECTION");  // points to "historydata"
var Config = require('../public/js/lib/config');
var logger = require('../helpers/logger')(module);

module.exports = Rpt = {

    getMRT: function (data, cb) {
        var criteria = {
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
                    return cb("No mrt file found");
                } else if (result.MRTData) {
                    return cb(null, result.MRTData);
                } else {
                    return cb("No mrt file found");
                }
            } else {
                return cb(err);
            }
        });
    },
    saveMRT: function (data, cb) {
        var criteria = {
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
                    data: "Data has been saved successfully!!!"
                });
            } else
                return cb(err);
        });
    },
    saveSVG: function (data, cb) {
        var criteria = {
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
                    data: "Data has been saved successfully!!!"
                });
            } else {
                return cb(err);
            }
        });
    },
    saveReport: function (data, cb) {
        var criteria = {
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

        Utility.get(criteria, function (err, result) {
            if (!err) {
                return cb(null, {
                    data: "Data has been saved successfully!!!"
                });
            } else {
                return cb(err);
            }
        });
    },
    getSVG: function (data, cb) {
        var criteria = {
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
            } else {
                return cb(err);
            }
        });
    },
    getHistoryPoints: function (data, cb) {
        var criteria = {
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
                    return cb("No results found");
                } else {
                    getPoints(result, cb);
                }

            } else
                return cb(err);
        });
    },
    historySearch: function (data, cb) {
        var startTime = data.startTime;
        var endTime = data.endTime;

        var upis = data.upis;

        var criteria = {
            query: {
                _id: {
                    $in: upis
                }
            },
            collection: 'points',
            fields: {
                "Value": 1,
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
                        upi: "$_id",
                        data: "$data"
                    }
                }],
                collection: 'historydata'
            };

            Utility.aggregate(criteria, function (err, histPoints) {
                if (err)
                    return cb(err);

                for (var a = 0; a < histPoints.length; a++) {

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
                    console.log("historySearch()", new Date() - start);
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
                        for (var c = 0; c < histPoint.data.length; c++) {
                            for (var option in points[b].Value.ValueOptions) {
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
        var checkForOldest = {},
            criteria = {},
            endTime = data.endTime,
            getNextOldest,
            interval = data.interval,
            limit = (data.limit) ? data.limit : 0,
            noOlderTimes = [],
            offset = data.offset,
            returnObj = {},
            returnPoints = [],
            searchCriteria = {},
            startTime = data.startTime,
            timeSlotLimit = 200,
            timestamps,
            tooManyFlag = false,
            upis = data.upis,
            qualityCodes = data.qualityCodes; // wrong way to access this

        logger.info(" - historyDataSearch() data: " + JSON.stringify(data));
        for (var i = 0; i < upis.length; i++) {
            if (upis[i] === 0) {
                upis.splice(i, 1);
                continue;
            }
            checkForOldest[upis[i]] = true;
        }
        // make timestamps as normal then convert to new id. find all between min/max and any that match
        timestamps = buildTimestamps(startTime, endTime, interval, offset);

        searchCriteria = {
            upi: {
                $in: upis
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
                upi: {
                    $in: upis
                }
            },
            collection: 'points'
        };

        Utility.get(criteria, function (err, points) {
            if (err)
                return cb(err, null);

            criteria = {
                query: searchCriteria,
                collection: 'points',
                sort: {
                    timestamp: 1
                }
            };
            Utility.get(criteria, function (err, histPoints) {
                if (err) {
                    return cb(err, null);
                }
                History.findHistory({
                    upis: upis,
                    range: {
                        start: startTime,
                        end: endTime
                    },
                    timestamps: timestamps
                }, function (err, results) {
                    for (var h = 0; h < histPoints.length; h++) {
                        var hadTS = false;
                        for (var r = 0; r < results.length; r++) {
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
                            async.eachSeries(upis, function (upi, callback2) {
                                if (noOlderTimes.indexOf(upi) !== -1) {
                                    for (var x = 0; x < points.length; x++) {
                                        if (points[x]._id === upi)
                                            returnObj.HistoryResults.push({
                                                upi: upi,
                                                Name: points[x].Name
                                            });
                                    }
                                    //setTimeout(function() {
                                    callback2(null);
                                    //}, 1);
                                } else {
                                    getNextOldest = true;
                                    for (var w = 0; w < histPoints.length; w++) {
                                        if (histPoints[w].timestamp === ts && histPoints[w].upi === upi) {
                                            for (var y = 0; y < points.length; y++) {
                                                if (points[y]._id === histPoints[w].upi)
                                                    returnObj.HistoryResults.push(buildHistoryValue(points[y], histPoints[w]));
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
                                                timestamp: 1
                                            },
                                            limit: 1
                                        };
                                        Utility.get(criteria, function (err, nextOldest) {
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

                                                if ((upi && nextOldest[0]) && (upi === nextOldest[0].upi)) {
                                                    for (var x = 0; x < points.length; x++) {
                                                        if (nextOldest.length > 0) {
                                                            returnObj.HistoryResults.push(buildHistoryValue(points[x], nextOldest[0]));
                                                        } else {
                                                            returnObj.HistoryResults.push({
                                                                upi: upi,
                                                                Name: points[x].Name,
                                                                Value: "No Older Value"
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
            var tempObj = {};
            tempObj.upi = historyPoint.upi;
            tempObj.Name = point.Name;
            tempObj.statusflag = setStatusFlag(historyPoint.statusflags);

            if (historyPoint.timestamp === startTime)
                checkForOldest[historyPoint.upi] = false;

            if (historyPoint.ValueType === 5) {
                for (var key in point.Value.ValueOptions) {
                    if (point.Value.ValueOptions[key] === historyPoint.Value) {
                        tempObj.Value = key.toString();
                        tempObj.eValue = historyPoint.Value.toString();
                    }
                }
            } else {
                tempObj.Value = historyPoint.Value.toString();
            }
            //console.log(tempObj);
            return tempObj;
        }

        function setStatusFlag(statusflag) {
            //4 8 1 2

            if ((statusflag & Config.Enums["Status Flags Bits"]["In Fault"].enum) !== 0) {
                return getStatusChar("Fault");
            } else if ((statusflag & Config.Enums["Status Flags Bits"]["In Alarm"].enum) !== 0) {
                return getStatusChar("Abnormal");
            } else if ((statusflag & Config.Enums["Status Flags Bits"]["Out of Service"].enum) !== 0) {
                return getStatusChar("Out of Service");
            } else if ((statusflag & Config.Enums["Status Flags Bits"]["Override"].enum) !== 0) {
                return getStatusChar("Override");
            } else {
                return "";
            }

            function getStatusChar(status) {
                for (var index in qualityCodes) {
                    if (qualityCodes[index]["Quality Code Label"] === status)
                        return qualityCodes[index]["Quality Code"];
                }
            }
        }

        function buildTimestamps(startTime, endTime, interval, offset) {
            var minute = 60,
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
                case 0:     //minute
                    timestampInterval = minute * offset;
                    break;
                case 1:     //hour
                    timestampInterval = hour * offset;
                    break;
                case 2:     //day
                    timestampInterval = day * offset;
                    break;
                case 3:     //week
                    timestampInterval = week * offset;
                    break;
                case 4:     // month
                    break;
                case 5:     // year
                    break;
                default:
                    logger.info(" - - - - - - - - interval is DEFAULT");
                    break;
            }

            logger.info(" - - - - - - - - interval = " + interval + "  timestampInterval = " + timestampInterval);

            if (timestampInterval !== 0) {
                //logger.info(" - - - - - prevTime = " + prevTime + "   - - endTime = " + endTime);
                while (prevTime <= endTime && timestamps.length < timeSlotLimit) {
                    //logger.info(" - - - - - prevTime = " + prevTime + "   - - endTime = " + endTime);
                    timestamps.push(prevTime);
                    prevTime += timestampInterval;
                }
            } else {
                var prevInterval;

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
        var criteria = {
            query: {
                _id: utils.converters.convertType(data.id)
            },
            collection: 'points'
        };

        Utility.getOne(criteria, function (err, result) {
            if (err) {
                return cb(err);
            } else {
                if (result === null) {
                    return cb();
                } else {
                    return cb(null, {
                        id: data.id,
                        isOld: result["Report Config"] !== undefined,
                        point: JSON.stringify(result),
                        title: result.Name
                    }, result);
                }
            }
        });
    },
    reportSearch: function (data, cb) {
        logger.info("- - - reportSearch() called");
        var filters = data.filters,
            searchCriteria = {},
            fields = {},
            getPointRefs = false,
            selectedPointTypes = data.selectedPointTypes,
            uniquePIDs = [],
            properties = data.columns,
            sort = data.Sort,
            sortObject = {},
            nameQuery,
            returnLimit = utils.converters.convertType(data.limit),
            parseNameField = function (paramsField, fieldName) {
                var parsedNameField = {};
                //logger.info(" - -  paramsField = "  + paramsField + "   fieldName = " + fieldName);
                if (paramsField !== null && paramsField !== undefined) {
                    parsedNameField[fieldName] = {
                        '$regex': '(?i)^' + paramsField
                    };
                }
                //logger.info(" - -  parsedNameField = "  + JSON.stringify(parsedNameField));
                return parsedNameField;
            };
        //logger.info(" - - -  reportSearch()  data = " + JSON.stringify(data));
        searchCriteria.$or = [];

        if (properties) {
            for (var k = 0; k < properties.length; k++) {
                var p = properties[k].colName;
                if (Config.Utility.getUniquePIDprops().indexOf(p) !== -1) {
                    if (getPointRefs === false) {
                        fields["Point Refs"] = 1;
                        uniquePIDs.push(p);
                        getPointRefs = true;
                    }
                } else {
                    fields[propertyCheckForValue(p)] = 1;
                }
            }
            fields["Point Type.Value"] = 1;
            fields["Point Instance.Value"] = 1;
        }

        if (filters && filters.length > 0) {
            //console.log("filters", filters);
            searchCriteria = Rpt.collectFilters(filters);
        }

        logger.info("--------------");
        logger.info(" ---------- searchCriteria 1 = " + JSON.stringify(searchCriteria));
        logger.info("--------------");

        for (var i = 1; i < 5; i++) {
            key = "name" + i;
            if (data[key]) {
                nameQuery = parseNameField(data[key], key);
                if (nameQuery) {
                    searchCriteria.$or[0].$and.push(nameQuery);
                }
            }
        }

        //logger.info(" ---------- selectedPointTypes = " + JSON.stringify(selectedPointTypes));
        if (selectedPointTypes && selectedPointTypes.length > 0) {
            searchCriteria.$or[0].$and.push({
                "Point Type.Value": {
                    $in: selectedPointTypes
                }
            });
        }
        logger.info("--------------");
        logger.info(" ---------- searchCriteria 2 = " + JSON.stringify(searchCriteria));
        logger.info("--------------");

        if (sort) {
            for (var key2 in sort) {
                sortObject[key2] = (sort[key2] == "ASC") ? 1 : -1;
            }
        }
        logger.info("--- Report Search Criteria = " + JSON.stringify(searchCriteria) + " --- fields = " + JSON.stringify(fields));

        var criteria = {
            query: searchCriteria,
            collection: 'points',
            limit: returnLimit,
            fields: fields
        };

        Utility.get(criteria, function (err, docs) {

            if (err) {
                return cb(err);
            }
            if (getPointRefs === true) {
                for (var i = 0; i < docs.length; i++) {
                    for (var m = 0; m < docs[i]["Point Refs"].length; m++) {
                        if (uniquePIDs.indexOf(docs[i]["Point Refs"][m].PropertyName) > -1 && docs[i][docs[i]["Point Refs"][m].PropertyName] === undefined) {
                            docs[i][docs[i]["Point Refs"][m].PropertyName] = docs[i]["Point Refs"][m];
                        }
                    }
                    delete docs[i]["Point Refs"];
                }
            }

            return cb(null, docs);
        });
    },
    collectFilters: function (theFilters) {
        var grouping = "$and",
            currentFilter,
            localSearchCriteria = {},
            andExpressions = [],
            orExpressions = [],
            expressions = [],
            currentIndex = 0,
            numberOfFilters = theFilters.length,
            groupLogic = function (logicType) {
                var group = [],
                    sameGroup = true;

                while (currentFilter !== undefined && sameGroup) {
                    if (currentFilter.condition === logicType && group.length > 0) {
                        currentIndex--;
                        sameGroup = false;
                    } else {
                        group.push(Rpt.collectFilter(currentFilter));
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
                    case "$and":
                        andExpressions.push(Rpt.collectFilter(currentFilter));
                        break;
                    case "$or":
                        orExpressions.push(groupLogic("$or"));
                        break;
                    default:
                        break;
                }
            }

            //logger.info(" - - expressions = " + expressions);
            //logger.info(" - - andExpressions = " + andExpressions);
            //logger.info(" - - orExpressions = " + orExpressions);
        }

        if (expressions.length > 0) {
            if (grouping === "$or") {
                orExpressions.push(Rpt.groupOrExpression(expressions));
            } else if (grouping === "$and") {
                andExpressions = andExpressions.concat(expressions);
            }
        }

        if (andExpressions.length > 0) {
            localSearchCriteria.$or = localSearchCriteria.$or.concat({$and : andExpressions});
        }

        if (orExpressions.length > 0) {
            localSearchCriteria.$or = localSearchCriteria.$or.concat(orExpressions);
        }

        //logger.info(" - - collectFilter  localSearchCriteria = " + JSON.stringify(localSearchCriteria));
        return localSearchCriteria;
    },
    collectFilter: function (filter) {
        var searchQuery = {},
            key = filter.column,
            filterValueType = Config.Enums["Properties"][key].valueType;

        if (Config.Utility.getUniquePIDprops().indexOf(key) !== -1) {
            switch (currentFilter.operator) {
                case "EqualTo":
                    searchQuery = {
                        "Point Refs": {
                            $elemMatch: {
                                "PropertyName": key,
                                "Value": utils.converters.convertType(filter.value, filter.valueType)
                            }
                        }
                    };

                    break;
                case "NotEqualTo":
                    searchQuery[propertyCheckForValue(key)] = {
                        $ne: utils.converters.convertType(filter.value, filter.valueType)
                    };
                    searchQuery = {
                        "Point Refs": {
                            $elemMatch: {
                                "PropertyName": key,
                                "Value": {
                                    $ne: utils.converters.convertType(filter.value, filter.valueType)
                                }
                            }
                        }
                    };
                    break;
            }
        } else {
            switch (filter.operator) {
                case "Containing":
                    searchQuery[key] = {
                        $regex: '.*(?i)' + filter.value + '.*'
                    };
                    break;
                case "NotContaining":
                    var re = new RegExp(filter.value, i);
                    searchQuery[key] = {
                        $not: re
                    };
                    break;
                case "EqualTo":
                    if (filter.value === "False") {
                        searchQuery[propertyCheckForValue(key)] = false;
                    } else if (filter.value === "True") {
                        searchQuery[propertyCheckForValue(key)] = true;
                    } else if (utils.converters.isNumber(filter.value)) {
                        searchQuery[propertyCheckForValue(key)] = utils.converters.convertType(filter.value, filterValueType);
                    } else if (filter.value.indexOf(",") > -1) {
                        var splitValues = filter.value.split(",");
                        //if (!searchCriteria.$or)
                        //    searchCriteria.$or = [];
                        var new$or = {};
                        new$or.$or = [];
                        for (var kk = 0; kk < splitValues.length; kk++) {
                            var ppp = {};
                            if (utils.converters.isNumber(splitValues[kk])) {
                                ppp[key] = convertType(splitValues[kk]);
                            } else {
                                ppp[key] = splitValues[kk];
                            }
                            new$or.$or.push(ppp);
                        }
                    } else {
                        if (utils.converters.isNumber(filter.value))
                            searchQuery[propertyCheckForValue(key)] = utils.converters.convertType(filter.value, filterValueType);
                        else
                            searchQuery[propertyCheckForValue(key)] = {
                                $regex: '(?i)^' + filter.value
                            };
                    }
                    break;
                case "NotEqualTo":
                    //searchQuery[key] = {
                    //    $exists: true
                    //};
                    if (utils.converters.isNumber(filter.value)) {
                        searchQuery[propertyCheckForValue(key)] = {
                            $ne: utils.converters.convertType(filter.value, filterValueType)
                        };
                    } else {
                        searchQuery[propertyCheckForValue(key)] = {
                            $regex: '(?i)^(?!' + filter.value + ")"
                            //$ne: utils.converters.convertType(filter.value, filterValueType)
                        };
                    }
                    break;
                case "LessThan":
                    searchQuery[propertyCheckForValue(key)] = {
                        $lt: utils.converters.convertType(filter.value, filterValueType)
                    };
                    break;
                case "LessThanOrEqualTo":
                    searchQuery[propertyCheckForValue(key)] = {
                        $lte: utils.converters.convertType(filter.value, filterValueType)
                    };
                    break;
                case "GreaterThan":
                    searchQuery[propertyCheckForValue(key)] = {
                        $gt: utils.converters.convertType(filter.value, filterValueType)
                    };
                    break;
                case "GreaterThanOrEqualTo":
                    searchQuery[propertyCheckForValue(key)] = {
                        $gte: utils.converters.convertType(filter.value, filterValueType)
                    };
                    break;
                case "BeginningWith":
                    searchQuery[propertyCheckForValue(key)] = {
                        $regex: '^(?i)' + filter.value + '.*'
                    };
                    break;
                case "EndingWith":
                    searchQuery[propertyCheckForValue(key)] = {
                        $regex: '(?i)' + filter.value + '*$'
                    };
                    break;
                case "Between":
                    searchQuery[key] = {
                        $exists: true
                    };
                    searchQuery[propertyCheckForValue(key)] = {
                        $gte: utils.converters.convertType(filter.value, filterValueType),
                        $lte: utils.converters.convertType(filter.value, filterValueType)
                    };
                    break;
                case "NotBetween":
                    searchQuery[key] = {
                        $exists: true
                    };
                    //{$nin:{$gte:2,$lt:5}}
                    searchQuery[propertyCheckForValue(key)] = {
                        $nin: {
                            $gte: utils.converters.convertType(filter.value, filterValueType),
                            $lt: utils.converters.convertType(filter.value, filterValueType)
                        }
                    };
                    break;
            }
        }
        return searchQuery;
    },
    groupOrExpression: function (listOfExpressions) {
        var concatJSON = {},
            tempObj = {},
            i;

        for (i = 0; i < listOfExpressions.length; i++) {
            tempObj = listOfExpressions[i];
            for (var prop in tempObj) {
                if (tempObj.hasOwnProperty(prop)) {
                    concatJSON[prop] = tempObj[prop];
                }
            }
        }
        return concatJSON;
    },
    pointInvolvement: function (data, cb) {
        var criteria = {
            query: {
                "Name": "Point Involvement"
            },
            collection: 'CannedReports'
        };

        Utility.getOne(criteria, function (err, result) {
            if (err) {
                return cb(err);
            } else {

                return cb(null, {
                    id: result._id,
                    isOld: true,
                    point: JSON.stringify(result),
                    title: result.Name
                });

            }
        });
    }
};

var buildPointRef = function (key, regex) {
    return {
        "Point Refs": {
            $elemMatch: {
                "PropertyName": key,
                "Value": regex
            }
        }
    };
};

var propertyCheckForValue = function (prop) {
    if (prop.match(/^name/i) !== null) {
        return prop;
    } else {
        return prop + ".Value";
    }
};

var getPoints = function (pointsCol, cb) {
    var criteria = {
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