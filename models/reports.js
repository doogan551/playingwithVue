const fs = require('fs');

const async = require('async');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const config = require('config');
const RETURNLIMIT = 3000;

const Report = class Report {
    saveSVG(data, cb) {
        const point = new Point();
        let criteria = {
            query: {
                _id: utils.converters.convertType(data.id)
            },
            updateObj: {
                $set: {
                    'SVGData': data.SVGData
                }
            }
        };
        point.updateOne(criteria, (err, result) => {
            if (!err) {
                return cb(null, {
                    data: 'Data has been saved successfully!!!'
                });
            }
            return cb(err);
        });
    }
    saveReport(data, cb) {
        const activityLog = new ActivityLog();
        const point = new Point();
        data['Point Type'] = {
            eValue: Config.Enums['Point Types'].Report.enum
        };

        let logData = {
            user: data.user,
            timestamp: Date.now(),
            point: data,
            activity: 'Report Edit',
            log: 'Report edited.'
        };

        let criteria = {
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

        point.updateOne(criteria, (err, result) => {
            activityLog.create(logData, (err, result) => {
                if (!err) {
                    return cb(err, {
                        data: 'Report has been saved successfully!!!'
                    });
                }
                return cb(err, null);
            });
        });
    }
    getSVG(data, cb) {
        const point = new Point();
        point.getPointById({
            _id: utils.converters.convertType(data.id)
        }, (err, result) => {
            if (!err) {
                return cb(null, result.SVGData);
            }
            return cb(err);
        });
    }
    historyDataSearch(data, cb) {
        const history = new History();
        const point = new Point();
        let reportConfig = data.reportConfig,
            checkForOldest = {},
            criteria = {},
            endTime = data.range.end,
            getNextOldest,
            intervalOptions = reportConfig.interval,
            noOlderTimes = [],
            returnObj = {},
            returnPoints = [],
            searchCriteria = {},
            startTime = data.range.start,
            timestamps,
            tooManyFlag = false,
            upis = data.upis,
            justUpis = [],
            i,
            qualityCodes = global.qualityCodes;

        let makeTimestamps = (timestampObjects) => {
            let timestamps = timestampObjects.map((ts) => {
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

        justUpis = upis.map((res) => {
            return res.upi;
        });

        // make timestamps as normal then convert to new id. find all between min/max and any that match
        //timestamps = buildTimestamps(startTime, endTime, interval, offset);
        timestamps = makeTimestamps(this.buildIntervals(data.range, intervalOptions));

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
            }
        };
        point.getAll(criteria, (err, points) => {
            if (err) {
                return cb(err, null);
            }

            criteria = {
                query: searchCriteria,
                sort: {
                    timestamp: -1
                }
            };
            history.getAll(criteria, (err, histPoints) => {
                if (err) {
                    return cb(err, null);
                }
                history.findHistory({
                    upis: justUpis,
                    range: {
                        start: startTime,
                        end: endTime
                    },
                    timestamps: timestamps
                }, (err, results) => {
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
                    async.eachSeries(timestamps.reverse(), (ts, callback1) => {
                        //convert id to ts and upi
                        returnObj = {
                            timestamp: ts,
                            HistoryResults: []
                        };
                        async.eachSeries(justUpis, (upi, callback2) => {
                            if (noOlderTimes.indexOf(upi) !== -1) {
                                for (let x = 0; x < points.length; x++) {
                                    if (points[x]._id === upi) {
                                        returnObj.HistoryResults.push({
                                            upi: upi,
                                            Name: points[x].Name
                                        });
                                    }
                                }
                                //setTimeout() => {
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
                                        sort: {
                                            timestamp: -1
                                        },
                                        limit: 1
                                    };
                                    history.getAll(criteria, (err, nextOldest) => {
                                        if (!!err) {
                                            return callback2(err);
                                        }

                                        history.findLatest({
                                            upis: [upi],
                                            range: {
                                                end: ts
                                            }
                                        }, (err, results) => {
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
                        }, (err) => {
                            returnPoints.push(returnObj);
                            if (returnPoints.length % 500 === 0) {
                                setTimeout(() => {
                                    callback1(err);
                                }, 0);
                            } else {
                                callback1(err);
                            }
                        });
                    }, (err) => {
                        return cb(err, {
                            truncated: tooManyFlag,
                            historyData: returnPoints.reverse()
                        });
                    });
                });
            });
        });

        let buildHistoryValue = (point, historyPoint) => {
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
        };

        let setStatusFlag = (statusflag) => {
            //4 8 1 2

            let getStatusChar = (status) => {
                for (let index in qualityCodes) {
                    if (qualityCodes[index]['Quality Code Label'] === status) {
                        return qualityCodes[index]['Quality Code'];
                    }
                }
            };

            if ((statusflag & Config.Enums['Status Flags Bits']['In Fault'].enum) !== 0) {
                return getStatusChar('Fault');
            } else if ((statusflag & Config.Enums['Status Flags Bits']['In Alarm'].enum) !== 0) {
                return getStatusChar('Abnormal');
            } else if ((statusflag & Config.Enums['Status Flags Bits']['Out of Service'].enum) !== 0) {
                return getStatusChar('Out of Service');
            } else if ((statusflag & Config.Enums['Status Flags Bits'].Override.enum) !== 0) {
                return getStatusChar('Override');
            }
            return '';
        };

        // buildTimestamps(startTime, endTime, interval, offset) => {
        //     let minute = 60,
        //         hour = minute * 60,
        //         day = hour * 24,
        //         week = day * 7,
        //         timestampInterval = 0,
        //         timestamps = [],
        //         prevTime = parseInt(startTime, 10);

        //     endTime = parseInt(endTime, 10);
        //     offset = (offset) ? parseInt(offset, 10) : 1;
        //     interval = (interval) ? parseInt(interval, 10) : 0;

        //     switch (interval) {
        //         case 0: //minute
        //             timestampInterval = minute * offset;
        //             break;
        //         case 1: //hour
        //             timestampInterval = hour * offset;
        //             break;
        //         case 2: //day
        //             timestampInterval = day * offset;
        //             break;
        //         case 3: //week
        //             timestampInterval = week * offset;
        //             break;
        //         case 4: // month
        //             break;
        //         case 5: // year
        //             break;
        //         default:
        //             logger.info(' - - - - - - - - interval is DEFAULT');
        //             break;
        //     }

        //     //logger.info(" - - - - - - - - interval = " + interval + "  timestampInterval = " + timestampInterval);

        //     if (timestampInterval !== 0) {
        //         //logger.info(" - - - - - prevTime = " + prevTime + "   - - endTime = " + endTime);
        //         while (prevTime <= endTime && timestamps.length < timeSlotLimit) {
        //             //logger.info(" - - - - - prevTime = " + prevTime + "   - - endTime = " + endTime);
        //             timestamps.push(prevTime);
        //             prevTime += timestampInterval;
        //         }
        //     } else {
        //         let prevInterval;

        //         if (interval === 4) { //month
        //             prevInterval = new Date(startTime * 1000).getMonth();

        //             while (prevTime <= endTime && timestamps.length < timeSlotLimit) {
        //                 timestamps.push(prevTime);

        //                 if (prevInterval == 11) {
        //                     prevInterval = 0;
        //                     prevTime = Math.floor(new Date(new Date(prevTime * 1000).setMonth(prevInterval)).setFullYear(new Date(prevTime * 1000).getFullYear() + 1) / 1000);
        //                 } else {
        //                     prevTime = Math.floor(new Date(prevTime * 1000).setMonth(++prevInterval) / 1000);
        //                 }
        //             }
        //         } else if (interval === 5) { //year
        //             prevInterval = new Date(startTime * 1000).getFullYear();

        //             while (prevTime <= endTime && timestamps.length < timeSlotLimit) {
        //                 timestamps.push(prevTime);
        //                 prevTime = Math.floor(new Date(prevTime * 1000).setFullYear(++prevInterval) / 1000);
        //             }
        //         } else {
        //             //bad interval
        //         }
        //     }

        //     tooManyFlag = (timestamps.length < timeSlotLimit);
        //     return timestamps;
        // }
    }
    reportMain(data, cb) {
        const point = new Point();
        const schedule = new Schedule();
        let reportCriteria = {
                id: utils.converters.convertType(data.id),
                data: data
            },
            scheduleCriteria = {
                query: {
                    _id: new ObjectID(data.scheduleID)
                },
                data: data
            },
            scheduled = (!!data.scheduleID),
            reportResults = {},
            reportData,
            resolveColumnsPointNames = (columns) => {
                let i,
                    column;

                if (columns) {
                    //
                    // for (i = 1; i < columns.length; i++) {
                    //     column = columns[i];
                    //     point.getOne({
                    //         query: {
                    //             _id: upi
                    //         },
                    //         fields: {
                    //             path: 1
                    //         }
                    //     }, (err, point) => {
                    //         if (!!point) {
                    //             let reportName = point.Name;
                    //         }
                    //
                    //     });
                    // }
                }
            },
            getValueTypes = (data) => {
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
            handleResults = () => {
                if (scheduled) {
                    schedule.getOne(scheduleCriteria, (err, scheduleData) => {
                        if (err) {
                            return cb(err);
                        }
                        if (scheduleData === null) {
                            return cb();
                        }
                        reportResults.scheduledConfig = {};
                        reportResults.scheduledConfig.duration = scheduleData.optionalParameters.duration;
                        reportResults.scheduledConfig.interval = scheduleData.optionalParameters.interval;
                        reportResults.scheduledConfig.scheduledIncludeChart = data.scheduledIncludeChart;

                        reportResults.scheduledConfig = JSON.stringify(reportResults.scheduledConfig);
                        return cb(null, reportResults, reportData);
                    });
                } else {
                    return cb(null, reportResults, reportData);
                }
            };

        // this is weird. change it to be nested instead of relying on flags in handlResults()
        point.getPointById(reportCriteria.data, (err, message, result) => {
            if (err) {
                return cb(err, {id: data.id});
            }

            if (!!result) {
                if (result['Report Config'].columns) {
                    if (result['Report Type'].Value === 'Property') {
                        result = getValueTypes(result);
                    } else {
                        resolveColumnsPointNames(result['Report Config'].columns);
                    }
                }

                reportResults.id = data.id;
                reportResults.point = JSON.stringify(result);

                reportData = result;
                handleResults();
            } else {
                return cb(message, {id: data.id}); // error
            }
        });
    }
    reportSearch(data, cb) {
        const point = new Point();
        let reportConfig = data.reportConfig,
            pointRefs = data['Point Refs'],
            filters = reportConfig.filters,
            pointFilter = reportConfig.pointFilter,
            fields = {},
            getPointRefs = false,
            selectedPointTypes = (!!pointFilter.selectedPointTypes.length) ? pointFilter.selectedPointTypes : Config.Utility.pointTypes.getAllowedPointTypes().map((type) => {
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
            // returnLimit = RETURNLIMIT,
            parseNameField = (paramsField, fieldName) => {
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
                    fields[this.propertyCheckForValue(p)] = true;
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
            let key = 'name' + i;
            if (pointFilter[key]) {
                nameQuery = parseNameField(pointFilter[key], ('name' + i));
                if (nameQuery) {
                    searchCriteria.$and.push(nameQuery);
                }
            }
        }

        if (filters && filters.length > 0) {
            searchCriteria.$and.push(this.collectFilters(filters, pointRefs));
        }

        if (sort) {
            for (let key2 in sort) {
                sortObject[key2] = (sort[key2] === 'ASC') ? 1 : -1;
            }
        }

        if (searchCriteria.$and.length === 0) {
            searchCriteria = {};
        }

        //logger.info("--- Report Search Criteria = " + JSON.stringify(searchCriteria) + " --- fields = " + JSON.stringify(fields));
        let criteria = {
            query: searchCriteria,
            limit: RETURNLIMIT,
            fields: fields
        };
        point.getAll(criteria, (err, docs) => {
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
            docs.forEach((doc) => {
                let pointType = doc["Point Type"].Value,
                    pointTemplate = Config.Templates.getTemplate(pointType);
                for (let prop in doc) {
                    let newPropertyName = utils.getHumanProperty(prop),
                        isDisplayable = (!!pointTemplate[prop] && pointTemplate[prop].isDisplayable == false ? false : true);
                    if (!isDisplayable) {
                        //JEFF TODO doc[prop].Value = null;
                    }
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
    }
    collectFilters(theFilters, reportPointRefs) {
        let currentFilter,
            localSearchCriteria = {},
            andExpressions = [],
            orExpressions = [],
            currentIndex = 0,
            numberOfFilters = theFilters.length,
            getPointRefByAppIndex = (appIndex) => {
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
            collectFilter = (filter) => {
                let searchQuery = {},
                    // change key to internal property if possible.
                    key = utils.getDBProperty(filter.filterName),
                    searchKey = key,
                    searchKeyExists = {},
                    searchKeyIsDisplayable = {},
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
                            let re = new RegExp(filter.value, 'i');
                            searchQuery[key] = {
                                $not: re
                            };
                            break;
                        case 'EqualTo':
                            searchKeyIsDisplayable[key + ".isDisplayable"] = {
                                $eq: true
                            };
                            searchQuery.$and = [];
                            searchQuery.$and.push(searchKeyIsDisplayable);
                            if (filter.valueType === 'Enum' && utils.converters.isNumber(filter.evalue) && filter.valueList.length > 0) {
                                if (filter.evalue === -1) {
                                    searchPart2[this.propertyCheckForValue(key)] = {
                                        $in: ['', null]
                                    };
                                } else {
                                    if (filterValueType !== null) {
                                        searchKey = key + '.eValue';
                                    } else {
                                        searchKey = key;
                                    }
                                    searchPart2[searchKey] = filter.evalue;
                                }
                            } else if (filter.valueType === 'Bool') {
                                if (utils.converters.isNumber(filter.value)) {
                                    searchPart2[this.propertyCheckForValue(key)] = {
                                        $in: [utils.converters.convertType(filter.value, filter.valueType), (filter.value === 1)]
                                    };
                                } else {
                                    searchPart2[this.propertyCheckForValue(key)] = {
                                        $eq: filter.value
                                    };
                                }
                            } else if (utils.converters.isNumber(filter.value)) {
                                searchPart2[this.propertyCheckForValue(key)] = utils.converters.convertType(filter.value, filter.valueType);
                            } else if (filter.value.indexOf(',') > -1) {
                                let splitValues = filter.value.split(',');
                                //if (!searchCriteria.$or)
                                //    searchCriteria.$or = [];
                                let new$or = {};
                                new$or.$or = [];
                                for (let kk = 0; kk < splitValues.length; kk++) {
                                    let ppp = {};
                                    if (utils.converters.isNumber(splitValues[kk])) {
                                        ppp[key] = utils.converters.convertType(splitValues[kk]);
                                    } else {
                                        ppp[key] = splitValues[kk];
                                    }
                                    new$or.$or.push(ppp);
                                }
                            } else if (utils.converters.isNumber(filter.value)) {
                                searchPart2[this.propertyCheckForValue(key)] = utils.converters.convertType(filter.value, filter.valueType);
                            } else {
                                searchPart2[this.propertyCheckForValue(key)] = {
                                    $regex: '(?i)^' + filter.value
                                };
                            }
                            searchQuery.$and.push(searchPart2);
                            break;
                        case 'NotEqualTo':
                            searchKeyExists[key] = {
                                $exists: true
                            };
                            searchKeyIsDisplayable[key + ".isDisplayable"] = {
                                $eq: true
                            };
                            searchQuery.$and = [];
                            searchQuery.$and.push(searchKeyExists);
                            searchQuery.$and.push(searchKeyIsDisplayable);
                            if (filter.valueType === 'Enum' && utils.converters.isNumber(filter.evalue) && filter.valueList.length > 0) {
                                if (filter.evalue === -1) {
                                    searchPart2[this.propertyCheckForValue(key)] = {
                                        $nin: ['', null]
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
                            } else if (filter.valueType === 'Bool') {
                                if (utils.converters.isNumber(filter.value)) {
                                    searchPart2[this.propertyCheckForValue(key)] = {
                                        $nin: [utils.converters.convertType(filter.value, filter.valueType), (filter.value === 1)]
                                    };
                                } else {
                                    searchPart2[this.propertyCheckForValue(key)] = {
                                        $ne: filter.value
                                    };
                                }
                            } else if (utils.converters.isNumber(filter.value)) {
                                searchPart2[this.propertyCheckForValue(key)] = {
                                    $ne: utils.converters.convertType(filter.value, filter.valueType)
                                };
                            } else {
                                searchPart2[this.propertyCheckForValue(key)] = {
                                    $regex: '(?i)^(?!' + filter.value + ')'
                                    //$ne: utils.converters.convertType(filter.value, filter.valueType)
                                };
                            }

                            searchQuery.$and.push(searchPart2);
                            break;
                        case 'LessThan':
                            searchQuery[this.propertyCheckForValue(key)] = {
                                $lt: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'LessThanOrEqualTo':
                            searchQuery[this.propertyCheckForValue(key)] = {
                                $lte: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'GreaterThan':
                            searchQuery[this.propertyCheckForValue(key)] = {
                                $gt: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'GreaterThanOrEqualTo':
                            searchQuery[this.propertyCheckForValue(key)] = {
                                $gte: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'BeginningWith':
                            searchQuery[this.propertyCheckForValue(key)] = {
                                $regex: '^(?i)' + filter.value + '.*'
                            };
                            break;
                        case 'EndingWith':
                            searchQuery[this.propertyCheckForValue(key)] = {
                                $regex: '(?i)' + filter.value + '*$'
                            };
                            break;
                        case 'Between':
                            searchQuery[key] = {
                                $exists: true
                            };
                            searchQuery[this.propertyCheckForValue(key)] = {
                                $gte: utils.converters.convertType(filter.value, filter.valueType),
                                $lte: utils.converters.convertType(filter.value, filter.valueType)
                            };
                            break;
                        case 'NotBetween':
                            searchQuery[key] = {
                                $exists: true
                            };
                            //{$nin:{$gte:2,$lt:5}}
                            searchQuery[this.propertyCheckForValue(key)] = {
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
            groupLogic = (logicType) => {
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

                return this.groupOrExpression(group);
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
    }
    groupOrExpression(listOfExpressions) {
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
    }
    totalizerReport(data, cb) {
        //logger.info(" - totalizerReport() data: " + JSON.stringify(data));
        const historyInstance = new History();
        let points = data.upis;
        let reportConfig = data.reportConfig;
        let range = data.range;
        let intervalOptions = reportConfig.interval;

        let compare = (a, b) => {
            return a.timestamp - b.timestamp;
        };

        let findStarts = (initial, history) => {
            let totals = [];
            let previousValue = (initial.hasOwnProperty('Value')) ? initial.Value : 0;
            intervals.forEach((interval, index) => {
                let starts = 0;
                let start = interval.start;
                let end = (moment().unix() < interval.end) ? moment().unix() : interval.end;

                let matches = history.filter((data) => {
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

        let findRuntime = (initial, history) => {
            let totals = [];
            let previousValue = (initial.hasOwnProperty('Value')) ? initial.Value : 0;

            intervals.forEach((interval, index) => {
                // console.log(interval);
                let runtime = 0;
                let now = moment().unix();
                let intervalLonger = now < interval.end;
                let start = interval.start;
                let end = (!!intervalLonger) ? now : interval.end;

                let matches = history.filter((data) => {
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

        let findTotal = (initial, history) => {
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

            intervals.forEach((interval, index) => {
                let total = startValue;
                startValue = 0;
                let start = interval.start;
                let end = (moment().unix() < interval.end) ? moment().unix() : interval.end;

                let matches = history.filter((data) => {
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


        let intervals = this.buildIntervals(range, intervalOptions);

        let getInitialDataMongo = (point, callback) => {
            let criteria = { //find initial data per point
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

            historyInstance.getAll(criteria, (err, initial) => {
                callback(err, point, initial[0]);
            });
        };
        let getInitialDataSql = (point, initial, callback) => {
            historyInstance.findLatest({
                upis: [point.upi],
                range: { // range object gets overwritten in  pass new ob=> j
                    end: range.start
                }
            }, (err, results) => {
                let latestSql = results[0];
                if (!initial || (!!latestSql && latestSql.timestamp >= initial.timestamp)) {
                    initial = latestSql;
                }
                callback(null, point, initial || {});
            });
        };
        let getRangeDataMongo = (point, initial, callback) => {
            let criteria = {
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

            historyInstance.getAll(criteria, (err, history) => {
                callback(null, point, initial, history);
            });
        };
        let getRangeDataSql = (point, initial, history, callback) => {
            let exists = false;

            historyInstance.findHistory({
                upis: [point.upi],
                range: {
                    start: range.start,
                    end: range.end
                },
                fx: 'history'
            }, (err, results) => {
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

        let buildTotal = (point, initial, history, callback) => {
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

        async.eachSeries(points, (point, seriesCb) => {
            async.waterfall([async.apply(getInitialDataMongo, point), getInitialDataSql, getRangeDataMongo, getRangeDataSql, buildTotal], seriesCb);
        }, (err) => {
            return cb(err, points);
        });
    }
    scheduledReport(data, cb) {
        const mailer = new Mailer();
        const pageRender = new PageRender();
        const chromePageRender = new ChromePageRender();
        const point = new Point();
        const user = new User();
        let domain = 'http://' + (!!config.get('Infoscan.letsencrypt').enabled ? config.get('Infoscan.domains')[0] : 'localhost');
        let schedule = data.schedule;
        let upi = schedule.upi;
        let emails = [];

        point.getOne({
            query: {
                _id: upi
            },
            fields: {
                Name: 1
            }
        }, (err, point) => {
            if (!!point) {
                let reportName = point.Name;
                let users = schedule.users.map((id) => {
                    return ObjectID(id);
                });
                let date = moment().format('YYYY-MM-DD');
                let path = [__dirname, '/../tmp/', date, reportName.split(' ').join(''), '.pdf'].join('');
                let uri = [domain, '/scheduleloader/report/scheduled/', upi, '?scheduleID=', schedule._id].join('');
                pageRender.renderPage(uri, path, (err) => {
                    fs.readFile(path, (err, data) => {
                        user.iterateCursor({
                            query: {
                                _id: {
                                    $in: users
                                }
                            }
                        }, (err, user, nextUser) => {
                            // figure out date/time
                            emails = emails.concat(user['Contact Info'].Value.filter((info) => {
                                return info.Type === 'Email';
                            }).map((email) => {
                                return email.Value;
                            }));

                            nextUser();
                        }, (err, count) => {
                            emails = emails.concat(schedule.emails).join(',');
                            if (!emails.length) {
                                return cb('No recipients provided.');
                            }
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
                            }, (err, info) => {
                                console.log(err, info);
                                return cb(err);
                            });
                        });
                    });
                });
                // chromePageRender.renderPage(uri, path, (err, stdout, stderr) => {
                //     fs.readFile(path, (err, data) => {
                //         user.iterateCursor({
                //             query: {
                //                 _id: {
                //                     $in: users
                //                 }
                //             }
                //         }, (err, user, nextUser) => {
                //             // figure out date/time
                //             emails = emails.concat(user['Contact Info'].Value.filter((info) => {
                //                 return info.Type === 'Email';
                //             }).map((email) => {
                //                 return email.Value;
                //             }));
                //
                //             nextUser();
                //         }, (err, count) => {
                //             emails = emails.concat(schedule.emails).join(',');
                //             if (!emails.length) {
                //                 return cb('No recipients provided.');
                //             }
                //             mailer.sendEmail({
                //                 to: emails,
                //                 fromAccount: 'infoscan',
                //                 subject: [reportName, ' for ', date].join(''),
                //                 html: '<html><body><h1>You\'re welcome!</h1></body></html>',
                //                 attachments: [{
                //                     path: path,
                //                     contentType: 'application/pdf',
                //                     content: data
                //                 }]
                //             }, (err, info) => {
                //                 console.log(err, info);
                //                 return cb(err);
                //             });
                //         });
                //     });
                // });
            } else {
                logger.info('   - -  scheduledReport() schedule._id = ' + schedule._id + '  unable to find Report with UPI = ' + upi);
            }
        });
    }

    buildIntervals(range, interval) {
        let intervalPeriod = interval.period;
        let intervalValue = interval.value;
        let intervalRanges = [];
        let intervalStart;
        let intervalEnd;
        let fixLongerInterval = () => {
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
    }

    propertyCheckForValue(prop) {
        if (prop.match(/^name/i) !== null || Config.Enums['Internal Properties'].hasOwnProperty(prop)) {
            return prop;
        }
        return prop + '.Value';
    }
};

module.exports = Report;
const utils = require('../helpers/utils.js');
const Config = require('../public/js/lib/config');
const logger = require('../helpers/logger')(module);
const PageRender = require('./pagerender');
const ChromePageRender = require('./chromepagerender');
const Mailer = require('./mailer');
const Schedule = require('./schedule');
const History = require('./history');
const Point = require('./point');
const User = require('./user');
const ActivityLog = require('./activitylog');
