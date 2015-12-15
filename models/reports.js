var Utility = require('../models/utility');
var History = require('../models/history');
var utils = require('../helpers/utils.js');
var Config = require('../public/js/lib/config');
var logger = require('../helpers/logger')(module);

module.exports = {

    getMRT: function(data, cb) {
        var criteria = {
            query: {
                _id: utils.converters.convertType(data.id)
            },
            collection: 'points',
            fields: {
                'MRTData': 1
            }
        };

        Utility.get(criteria, function(err, result) {
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
    reportSearch: function(data, cb) {
        var params = data.Params;
        var query = {};
        var searchCriteria = {};
        var fields = {};
        var getPointRefs = false;
        var uniquePIDs = [];
        //numberComparators = [];
        //stringComparators = [];
        //orIndex = -1;

        var qualifiers = params.Qualifiers;
        var properties = params.Properties;
        var sort = params.Sort;
        var returnLimit = utils.converters.convertType(params.Limit);

        searchCriteria.$and = [];

        if (params.name1) {
            if (params.name1SearchType == 'begin' || params.name1.searchType == 'begin') {
                beginStr = '^';
                endStr = '';
            } else if (params.name1SearchType == 'contain' || params.name1.searchType == 'contain') {
                beginStr = '.*';
                endStr = '.*';
            } else if (params.name1SearchType == 'end' || params.name1.searchType == 'end') {
                beginStr = '';
                endStr = '$';
            }
            if (params.name1.value !== null) {
                name1str = params.name1.value;
            } else {
                name1str = params.name1;
            }
            searchCriteria.$and.push({
                'name1': {
                    '$regex': '(?i)' + beginStr + name1str + endStr
                }
            });

        }

        if (params.name2) {
            if (params.name2SearchType == 'begin' || params.name2.searchType == 'begin') {
                beginStr = '^';
                endStr = '';
            } else if (params.name2SearchType == 'contain' || params.name2.searchType == 'contain') {
                beginStr = '.*';
                endStr = '.*';
            } else if (params.name2SearchType == 'end' || params.name2.searchType == 'end') {
                beginStr = '';
                endStr = '$';
            }
            if (params.name2.value !== null) {
                name2str = params.name2.value;
            } else {
                name2str = params.name2;
            }
            searchCriteria.$and.push({
                'name2': {
                    '$regex': '(?i)' + beginStr + name2str + endStr
                }
            });
            //    searchCriteria.name2 = { '$regex': '(?i)' + beginStr + name2str + endStr };
        }

        if (params.name3) {
            if (params.name3SearchType == 'begin' || params.name3.searchType == 'begin') {
                beginStr = '^';
                endStr = '';
            } else if (params.name3SearchType == 'contain' || params.name3.searchType == 'contain') {
                beginStr = '.*';
                endStr = '.*';
            } else if (params.name3SearchType == 'end' || params.name3.searchType == 'end') {
                beginStr = '';
                endStr = '$';
            }
            if (params.name3.value !== null) {
                name3str = params.name3.value;
            } else {
                name3str = params.name3;
            }
            //searchCriteria.name3 = { '$regex': '(?i)' + beginStr + name3str + endStr };
            searchCriteria.$and.push({
                'name3': {
                    '$regex': '(?i)' + beginStr + name3str + endStr
                }
            });
        }

        if (params.name4) {
            if (params.name4SearchType == 'begin' || params.name4.searchType == 'begin') {
                beginStr = '^';
                endStr = '';
            } else if (params.name4SearchType == 'contain' || params.name4.searchType == 'contain') {
                beginStr = '.*';
                endStr = '.*';
            } else if (params.name4SearchType == 'end' || params.name4.searchType == 'end') {
                beginStr = '';
                endStr = '$';
            }
            if (params.name4.value !== null) {
                name4str = params.name4.value;
            } else {
                name4str = params.name4;
            }
            //searchCriteria.name4 = { '$regex': '(?i)' + beginStr + name4str + endStr };
            searchCriteria.$and.push({
                'name4': {
                    '$regex': '(?i)' + beginStr + name4str + endStr
                }
            });
        }

        var hasValue = false,
            tempSearchValue = {
                $or: []
            };

        if (properties) {
            for (var k = 0; k < properties.length; k++) {
                var p = properties[k].replace(/_+/gi, " ");
                if (Config.Utility.getUniquePIDprops().indexOf(p) !== -1) {
                    if (getPointRefs === false) {
                        fields["Point Refs"] = 1;
                        uniquePIDs.push(p);
                        getPointRefs = true;
                    }
                } else {
                    fields[p] = 1;
                }

            }
        }

        if (qualifiers && qualifiers.length > 0) {
            console.log("qualifiers", qualifiers);
            var previousQualifiers = [],
                tempOR = [];
            for (var i = 0; i < qualifiers.length; i++) {
                var searchValue = {};

                for (var key in qualifiers[i]) {
                    if (i === 0) {
                        delete qualifiers[0][key].condition;
                    }
                    if (Config.Utility.getUniquePIDprops().indexOf(key) !== -1) {

                        switch (qualifiers[i][key].comparator) {
                            case "EqualTo":

                                searchValue = {
                                    "Point Refs": {
                                        $elemMatch: {
                                            "PropertyName": key,
                                            "Value": utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType)
                                        }
                                    }
                                };

                                searchCriteria.$and.push(searchValue);
                                break;
                            case "NotEqualTo":

                                searchValue[propertyCheckForValue(key)] = {
                                    $ne: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType)
                                };
                                searchValue = {
                                    "Point Refs": {
                                        $elemMatch: {
                                            "PropertyName": key,
                                            "Value": {
                                                $ne: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType)
                                            }
                                        }
                                    }
                                };
                                searchCriteria.$and.push(searchValue);
                                break;
                        }
                    } else {

                        // this may not work with two different properties in the same or statement
                        /*if (qualifiers[i][key].condition == "OR") {
                            searchCriteria.$or = [];
                            searchValue[key] = {
                                $exists: true
                            };
                            searchCriteria.$or.push(searchValue);
                        } else {
                            
                        }*/



                        switch (qualifiers[i][key].comparator) {
                            case "Containing":
                                searchValue[propertyCheckForValue(key)] = {
                                    $regex: '.*(?i)' + qualifiers[i][key].Value + '.*'
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "NotContaining":
                                var re = new RegExp(qualifiers[i][key].Value, i);
                                searchValue[propertyCheckForValue(key)] = {
                                    $not: re
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "EqualTo":
                                if (qualifiers[i][key].Value === "False") {
                                    searchValue[propertyCheckForValue(key)] = false;
                                    //searchCriteria.$and.push(searchValue);
                                } else if (qualifiers[i][key].Value === "True") {
                                    searchValue[propertyCheckForValue(key)] = true;
                                    //searchCriteria.$and.push(searchValue);
                                } else if (utils.converters.isNumber(qualifiers[i][key].Value)) {
                                    searchValue[propertyCheckForValue(key)] = utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType);
                                    //searchCriteria.$and.push(searchValue);
                                } else if (qualifiers[i][key].Value.indexOf(",") > -1) {
                                    var splitValues = qualifiers[i][key].Value.split(",");
                                    //if (!searchCriteria.$or)
                                    //    searchCriteria.$or = [];
                                    var new$or = {};
                                    new$or.$or = [];
                                    for (var kk = 0; kk < splitValues.length; kk++) {
                                        var ppp = {};
                                        if (utils.converters.isNumber(splitValues[kk])) {
                                            ppp[propertyCheckForValue(key)] = utils.converters.convertType(splitValues[kk]);
                                        } else {
                                            ppp[propertyCheckForValue(key)] = splitValues[kk];
                                        }
                                        new$or.$or.push(ppp);
                                    }
                                    searchCriteria.$and.push(new$or);
                                } else {
                                    searchValue[propertyCheckForValue(key)] = qualifiers[i][key].Value;
                                    //if (utils.converters.isNumber(qualifiers[i][key].Value))
                                    //    searchValue[propertyCheckForValue(key)] = utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType);
                                    //else
                                    searchValue[propertyCheckForValue(key)] = qualifiers[i][key].Value;
                                    //searchCriteria.$and.push(searchValue);
                                }
                                break;
                            case "NotEqualTo":
                                searchValue[key] = {
                                    $exists: true
                                };
                                searchValue[propertyCheckForValue(key)] = {
                                    $ne: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType)
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "LessThan":
                                searchValue[propertyCheckForValue(key)] = {
                                    $lt: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType)
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "LessThanOrEqualTo":
                                searchValue[propertyCheckForValue(key)] = {
                                    $lte: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType)
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "GreaterThan":
                                searchValue[propertyCheckForValue(key)] = {
                                    $gt: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType)
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "GreaterThanOrEqualTo":
                                searchValue[propertyCheckForValue(key)] = {
                                    $gte: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType)
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "BeginningWith":
                                searchValue[propertyCheckForValue(key)] = {
                                    $regex: '^(?i)' + qualifiers[i][key].Value + '.*'
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "EndingWith":
                                searchValue[propertyCheckForValue(key)] = {
                                    $regex: '(?i)' + qualifiers[i][key].Value + '*$'
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "Between":
                                searchValue[key] = {
                                    $exists: true
                                };
                                searchValue[propertyCheckForValue(key)] = {
                                    $gte: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType1),
                                    $lte: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType2)
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                            case "NotBetween":
                                searchValue[key] = {
                                    $exists: true
                                };
                                //{$nin:{$gte:2,$lt:5}}
                                searchValue[propertyCheckForValue(key)] = {
                                    $nin: {
                                        $gte: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType1),
                                        $lt: utils.converters.convertType(qualifiers[i][key].Value, qualifiers[i][key].ValueType2)
                                    }
                                };
                                //searchCriteria.$and.push(searchValue);
                                break;
                        }

                        if (qualifiers[i][key].condition === undefined || qualifiers[i][key].condition === '' || qualifiers[i][key].condition === "AND") {
                            if (tempOR.length > 0) {
                                searchCriteria.$and.push({
                                    $or: tempOR
                                });
                                tempOR = [];
                            }
                            if (previousQualifiers.length > 0) {
                                searchCriteria.$and.push(previousQualifiers[0]);
                                previousQualifiers = [];
                            }
                            previousQualifiers.push(searchValue);
                        } else {
                            if (previousQualifiers.length > 0) {
                                tempOR = tempOR.concat(previousQualifiers);
                                previousQualifiers = [];
                            }
                            tempOR.push(searchValue);
                        }


                    }
                }
            }
            if (previousQualifiers.length > 0) {
                searchCriteria.$and.push(previousQualifiers[0]);
            }
            if (tempOR.length > 0) {
                searchCriteria.$and.push({
                    $or: tempOR
                });
            }

        } else {
            //searchCriteria.$and.push({});
        }

        if (hasValue) {
            searchCriteria.$and.push({
                "Value.Value": {
                    $type: 1
                }
            });
        }

        var sortObject = {};

        if (sort) {
            for (var key2 in sort) {
                sortObject[key2] = (sort[key2] == "ASC") ? 1 : -1;
            }
        }

        console.log("Report Search Criteria", JSON.stringify(searchCriteria), fields, returnLimit);

        var criteria = {
            query: searchCriteria,
            collection: 'points',
            limit: returnLimit,
            fields: fields
        };

        Utility.get(criteria, function(err, docs) {

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
    saveMRT: function(data, cb) {
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

        Utility.update(criteria, function(err, result) {

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
    saveSVG: function(data, cb) {
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

        Utility.update(criteria, function(err, result) {

            if (!err) {
                return cb(null, {
                    data: "Data has been saved successfully!!!"
                });
            } else {
                return cb(err);
            }
        });
    },
    saveReport: function(data, cb) {
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

        Utility.get(criteria, function(err, result) {
            if (!err) {
                return cb(null, {
                    data: "Data has been saved successfully!!!"
                });
            } else {
                return cb(err);
            }
        });
    },
    getSVG: function(data, cb) {
        var criteria = {
            query: {
                _id: utils.converters.convertType(data.id)
            },
            collection: 'points',
            fields: {
                'SVGData': 1
            }
        };

        Utility.get(criteria, function(err, result) {
            if (!err) {
                return cb(null, result.SVGData);
            } else {
                return cb(err);
            }
        });
    },
    getHistoryPoints: function(data, cb) {
        var criteria = {
            query: {},
            collection: 'historydata',
            field: 'upi',
            options: {
                limit: 50
            }
        };

        Utility.get(criteria, function(err, result) {
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
    historySearch: function(data, cb) {
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

        Utility.get(criteria, function(err, points) {

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

            Utility.aggregate(criteria, function(err, histPoints) {
                if (err)
                    return cb(err);

                for (var a = 0; a < histPoints.length; a++) {

                }
                async.eachSeries(histPoints, function(historyPoint, callback) {

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

                        Utility.get(criteria, function(err, nextOldest) {
                            historyPoint.data.push(nextOldest);
                            fixHistoryData(historyPoint, points);
                            callback(err);
                        });
                    } else {
                        fixHistoryData(historyPoint, points);
                        callback(null);
                    }
                }, function(err) {
                    console.log("historyDataSearch", new Date() - start);
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
    historyDataSearch: function(data, cb) {
        var qualityCodes = data.qualityCodes; // wrong way to access this
        var startTime;
        var endTime;
        var getNextOldest;
        var returnPoints = [];
        var returnObj = {};
        var checkForOldest = {};
        var noOlderTimes = [];
        var tooManyFlag = false;

        for (var f = 0; f < data.Params.Qualifiers.length; f++) {
            if (data.Params.Qualifiers[f]["Start Date"] !== undefined) {
                startTime = data.Params.Qualifiers[f]["Start Date"].Value;
            }
            if (data.Params.Qualifiers[f]["End Date"] !== undefined) {
                endTime = data.Params.Qualifiers[f]["End Date"].Value;
                if (endTime > Date.now() / 1000) {
                    endTime = Date.now() / 1000;
                }
            }
        }

        var limit = (data.limit) ? data.limit : 0;
        var query = {};
        var searchCriteria = {};
        var upis = data.Params.points;
        limit = (data.Params.Limit !== undefined) ? data.Params.Limit : 0;

        for (var i = 0; i < upis.length; i++) {
            if (upis[i] === 0) {
                upis.splice(i, 1);
                continue;
            }
            checkForOldest[upis[i]] = true;
        }
        // make timestamps as normal then convert to new id. find all between min/max and any that match
        var timestamps = buildTimestamps(startTime, endTime, data.Params.interval, data.Params.offset);

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
        var criteria = {
            query: {
                $in: upis
            },
            collection: 'points'
        };

        Utility.get(criteria, function(err, points) {
            if (err)
                return cb(err, null);

            criteria = {
                query: searchCriteria,
                collection: 'points',
                sort: {
                    timestamp: 1
                }
            };
            Utility.get(criteria, function(err, histPoints) {
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
                }, function(err, results) {
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
                    for (var x = 0; x < histPoints.length; x++) {
                        histPoints[x] = utils.convertHistoryObject.convertHistory(histPoints[x], null);
                    }
                    async.achSeries(timestamps.reverse(), function(ts, callback1) {
                            //convert id to ts and upi
                            returnObj = {
                                timestamp: ts,
                                HistoryResults: []
                            };
                            async.eachSeries(upis, function(upi, callback2) {
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
                                        Utility.get(criteria, function(err, nextOldest) {
                                            History.findLatest({
                                                upis: [upi],
                                                range: {
                                                    end: ts
                                                }
                                            }, function(err, results) {
                                                if (!!results.length) {
                                                    if ((!!nextOldest.length && nextOldest[0].timestamp < results[0].timestamp) || !nextOldest.length) {
                                                        nextOldest = results;
                                                    }
                                                }

                                                if (upi === nextOldest[0].upi) {
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
                            }, function(err) {
                                returnPoints.push(returnObj);
                                if (returnPoints.length % 500 === 0) {
                                    setTimeout(function() {
                                        callback1(err);
                                    }, 0);
                                } else {
                                    callback1(err);
                                }
                            });
                        },
                        function(err) {
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
                prevTime = startTime;

            offset = (offset) ? offset : 1;

            if (interval === 0) { //minute
                timestampInterval = minute * offset;
            } else if (interval === 1) { //hour
                timestampInterval = hour * offset;
            } else if (interval === 2) { //day
                timestampInterval = day;
            } else if (interval === 3) { //week
                timestampInterval = week;
            }

            if (timestampInterval !== 0) {
                while (prevTime <= endTime) {
                    if (timestamps.length < 10000) {
                        timestamps.push(prevTime);
                    } else {
                        tooManyFlag = true;
                        return timestamps;
                    }
                    prevTime += timestampInterval;
                }
            } else {
                var prevInterval;

                if (interval === 4) { //month
                    prevInterval = new Date(startTime * 1000).getMonth();

                    while (prevTime <= endTime) {
                        if (timestamps.length < 10000) {
                            timestamps.push(prevTime);
                        } else {
                            tooManyFlag = true;
                            return timestamps;
                        }
                        if (prevInterval == 11) {
                            prevInterval = 0;
                            prevTime = Math.floor(new Date(new Date(prevTime * 1000).setMonth(prevInterval)).setFullYear(new Date(prevTime * 1000).getFullYear() + 1) / 1000);
                        } else {
                            prevTime = Math.floor(new Date(prevTime * 1000).setMonth(++prevInterval) / 1000);
                        }
                    }
                    /*for (var i = 0; i < timestamps.length; i++) {
                console.log(new Date(timestamps[i] * 1000).toISOString());
            }*/
                } else if (interval === 5) { //year
                    prevInterval = new Date(startTime * 1000).getFullYear();

                    while (prevTime <= endTime) {
                        if (timestamps.length < 10000) {
                            timestamps.push(prevTime);
                        } else {
                            tooManyFlag = true;
                            return timestamps;
                        }
                        prevTime = Math.floor(new Date(prevTime * 1000).setFullYear(++prevInterval) / 1000);
                    }

                } else {
                    //bad interval
                }
            }
            return timestamps;
        }
    },
    reportMain: function(data, cb) {
        var criteria = {
            query: {
                _id: utils.converters.convertType(data.id)
            },
            collection: 'points'
        };

        Utility.getOne(criteria, function(err, result) {
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
    pointInvolvement: function(data, cb) {
        var criteria = {
            query: {
                "Name": "Point Involvement"
            },
            collection: 'CannedReports'
        };

        Utility.getOne(criteria, function(err, result) {
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

var buildPointRef = function(key, regex) {
    return {
        "Point Refs": {
            $elemMatch: {
                "PropertyName": key,
                "Value": regex
            }
        }
    };
};

var propertyCheckForValue = function(prop) {
    if (prop.match(/^name/i) !== null) {
        return prop;
    } else {
        return prop + ".Value";
    }
};

var getPoints = function(pointsCol, cb) {
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