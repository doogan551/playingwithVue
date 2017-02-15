const async = require('async');
const moment = require('moment');
const csv = require('fast-csv');
const _ = require('lodash');
const fs = require('fs');
const tmp = require('tmp');

const Common = require('./common');
const ArchiveUtility = new(require('./archiveutility'))();
const Utilities = new(require('./utilities'))();
const utils = require('../helpers/utils');

const historyCollection = utils.CONSTANTS('historyCollection');
const dateFormat = 'ddd, MMM DD, YYYY HH: mm: ss ZZ ';

String.prototype.repeat = (num) => {
    return new Array(num + 1).join(this);
};

Array.prototype.equals = (array) => {
    // if the other array is a falsy value, return
    if (!array) {
        return false;
    }

    // compare lengths - can save a lot of time
    if (this.length !== array.length) {
        return false;
    }

    for (let i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i])) {
                return false;
            }
        } else if (this[i] !== array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};

// let formatRange = (range) => {
//     console.log(JSON.stringify({
//         start: moment.unix(range.start).format(),
//         end: moment.unix(range.end).format()
//     }));
// };

// let formatRanges = (ranges) => {
//     ranges.forEach(formatRange);
// };

const History = class History extends Common {
    constructor() {
        super(historyCollection);
    }
    buildOps(options) {
        let newOptions = [];

        let addOp = (operation) => {
            let op = {};
            for (let prop in operation) {
                if (['range', 'upis', 'secondUpis'].indexOf(prop) < 0) {
                    op[prop] = operation[prop];
                }
            }

            newOptions.push({
                range: operation.range,
                upis: operation.upis,
                secondUpis: operation.secondUpis,
                ops: [op]
            });
        };

        let loopOptions = () => {
            for (let i = 0; i < options.length; i++) {
                addOp(options[i]);
            }
        };
        loopOptions();
        return newOptions;
    }
    unbuildOps(options) {
        let newOptions = [];

        for (let i = 0; i < options.length; i++) {
            let option = options[i];
            for (let j = 0; j < option.ops.length; j++) {
                let operation = option.ops[j];
                let tempOption = {};
                let prop;
                for (prop in option) {
                    if (prop !== 'ops') {
                        tempOption[prop] = option[prop];
                    }
                }
                for (prop in operation) {
                    tempOption[prop] = operation[prop];
                }
                newOptions.push(tempOption);
            }
        }
        return newOptions;
    }
    editHistoryData(values, updateOptions, callback) {
        // updateOptions:
        // 1: insert missing data only
        // 2: overwrite user-supplied data only
        // 4: overwrite meter reported data only
        let updatedCount = 0;
        let criteria = {};

        async.eachSeries(values, (value, callback) => {
            value.upi = parseInt(value.upi, 10);
            value.timestamp = parseInt(value.timestamp, 10);
            value.Value = parseFloat(value.Value);
            value.statusflags = (!!value.statusflags) ? parseInt(value.statusflags, 10) : null;
            value.ValueType = (!!value.ValueType) ? parseInt(value.ValueType, 10) : null;
            let query = {
                upi: value.upi,
                timestamp: value.timestamp
            };

            if (isNaN(value.upi) || isNaN(value.timestamp)) {
                return callback('bad timestamp or upi');
            }

            criteria = {
                query: query
            };
            this.getOne(criteria, (err, point) => {
                if (!!point) {
                    if (point.userEdited) {
                        let updateObj = {
                            $set: {
                                Value: value.Value,
                                userEdited: true
                            }
                        };
                        updatedCount++;
                        criteria = {
                            query: query,
                            updateObj: updateObj
                        };
                        this.updateOne(criteria, callback);
                    } else {
                        //ignored
                        return callback();
                    }
                } else {
                    let month = moment.unix(value.timestamp).format('MM');
                    let year = moment.unix(value.timestamp).format('YYYY');
                    let table = 'History_' + year + month;
                    let selectStatement = 'Select UPI, TIMESTAMP, USEREDITED FROM ' + table + ' WHERE UPI=(?) AND TIMESTAMP=(?)';
                    //run select
                    criteria = {
                        year: moment.unix(value.timestamp).year(),
                        statement: selectStatement,
                        parameters: [value.upi, value.timestamp]
                    };
                    ArchiveUtility.get(criteria, (err, sPoint) => {
                        let bindings = {
                            $upi: value.upi,
                            $timestamp: value.timestamp,
                            $Value: value.Value
                        };

                        if ((updateOptions & 1 !== 0) && !sPoint) {
                            // only inserting new data
                            let insertStatement = 'INSERT INTO ' + table + ' (UPI, TIMESTAMP, VALUE, VALUETYPE, STATUSFLAGS, USEREDITED)';
                            insertStatement += 'VALUES ($upi, $timestamp, $Value, $ValueType, $statusflags, 1)';
                            bindings.$ValueType = (!!value.ValueType) ? value.ValueType : 1;
                            bindings.$statusflags = (!!value.statusflags) ? value.statusflags : 0;

                            criteria = {
                                year: moment.unix(value.timestamp).year(),
                                statement: insertStatement
                            };
                            ArchiveUtility.prepare(criteria, (stmt) => {
                                criteria = {
                                    year: moment.unix(value.timestamp).year(),
                                    statement: stmt,
                                    parameters: bindings
                                };
                                ArchiveUtility.runStatement(criteria, () => {
                                    ArchiveUtility.finalizeStatement(criteria, () => {
                                        if (err) {
                                            return callback(err);
                                        }
                                        updatedCount++;
                                        callback();
                                    });
                                });
                            });
                        } else if (((updateOptions & 2) !== 0 && sPoint.USEREDITED === 1) || ((updateOptions & 4) !== 0 && sPoint.USEREDITED === 0 && sPoint.VALUE !== value.Value)) {
                            // updating only existing user edited data
                            let updateStatement = 'UPDATE ' + table;
                            updateStatement += ' SET VALUE=$Value';
                            if (!!value.statusflags) {
                                bindings.$statusflags = value.statusflags;
                                updateStatement += ', STATUSFLAGS=$statusflags';
                            }

                            updateStatement += ', USEREDITED=1 WHERE';
                            updateStatement += ' UPI=$upi AND TIMESTAMP=$timestamp AND USEREDITED=' + sPoint.USEREDITED;

                            criteria = {
                                year: moment.unix(value.timestamp).year(),
                                statement: updateStatement
                            };
                            ArchiveUtility.prepare(criteria, (stmt) => {
                                criteria = {
                                    year: moment.unix(value.timestamp).year(),
                                    statement: stmt,
                                    parameters: bindings
                                };
                                ArchiveUtility.runStatement(criteria, () => {
                                    ArchiveUtility.finalizeStatement(criteria, () => {
                                        if (err) {
                                            return callback(err);
                                        }
                                        updatedCount++;
                                        callback();
                                    });
                                });
                            });
                        } else {
                            //ignored
                            return callback();
                        }
                    });
                }
            });
        }, (err) => {
            return callback(err, updatedCount);
        });
    }
    fillInData(options, rows, callback) {
        options.upis = options.upiMap.map((upi) => {
            return parseInt(upi.upi, 10);
        });
        options.ops = [{
            scale: 'month'
        }];
        this.getValues(options, (err, results) => {
            if (err) {
                return callback(err);
            }
            this.updateRows(results, options, rows, callback);
        });
    }
    updateRows(results, options, rows, callback) {
        let upis = options.upis;

        let start = parseInt(options.range.start, 10);
        let end = parseInt(options.range.end, 10);
        let m;
        let timeOffset = 30 * 60;

        let compare = (a, b) => {
            if (a.timestamp < b.timestamp) {
                return -1;
            }
            if (a.timestamp > b.timestamp) {
                return 1;
            }
            if (a.upi < b.upi) {
                return -1;
            }
            if (a.upi > b.upi) {
                return 1;
            }
            return 0;
        };

        results.sort(compare);
        for (let u = 0; u < upis.length; u++) {
            let workingTime = start + timeOffset;
            let r = 0;

            while (workingTime <= end) {
                for (m = 0; m < results.length; m++) {
                    if (results[m].timestamp === workingTime && results[m].upi === upis[u]) {
                        rows[r][u + 1] = parseFloat(results[m].value);
                        break;
                    }
                }
                workingTime += timeOffset;
                r++;
            }
        }
        callback(null, rows);
    }
    getValues(option, callback) {
        let findLatestPeak = (peakRanges, cb) => {
            let minutes = parseInt(moment().format('mm'), 10) % 30;
            let time = moment().subtract(minutes, 'minutes').seconds(0).unix();

            let compare = (a, b) => {
                if (a.timestamp < b.timestamp) {
                    return -1;
                }
                if (a.timestamp > b.timestamp) {
                    return 1;
                }

                return 0;
            };

            peakRanges.sort(compare);

            let latestPeriod = {
                end: 0,
                start: 0
            };

            for (let p = 0; p < peakRanges.length; p++) {
                let peakTime = peakRanges[p];
                if (time > peakTime.start && time <= peakTime.end) {
                    latestPeriod = {
                        end: time,
                        start: time - (30 * 60)
                    };
                    break;
                }
            }

            cb(null, latestPeriod);
        };

        let checkForLatest = (cb) => {
            let op = option.ops[0];
            let peakRanges = [];

            if (!!op.scale.match(/latest/)) {
                if (['on', 'off'].indexOf(op.peak) >= 0) {
                    this.buildPeakPeriods(op, (err, peakPeriods, holidays) => {
                        let minutes = parseInt(moment().format('mm'), 10) % 30;
                        let end = moment().subtract(minutes, 'minutes').seconds(0);
                        let start = moment(end).subtract(30, 'minutes');
                        let ranges = [{
                            start: start.unix(),
                            end: end.unix()
                        }];

                        async.eachSeries(ranges, (_range, rangeCB) => {
                            this.buildRanges(peakPeriods, holidays, op, _range, (err, _peakRanges) => {
                                peakRanges = peakRanges.concat(_peakRanges);
                                rangeCB();
                            });
                        }, (err) => {
                            findLatestPeak(peakRanges, cb);
                        });
                    });
                } else {
                    let minutes = parseInt(moment().format('mm'), 10) % 30;
                    let end = moment().subtract(minutes, 'minutes').seconds(0);
                    let start = moment(end).subtract(30, 'minutes');

                    cb(null, {
                        end: end.unix(),
                        start: start.unix()
                    });
                }
            } else {
                cb(null);
            }
        };

        checkForLatest((err, latestPeriod) => {
            if (!!latestPeriod) {
                option.range = latestPeriod;
            }
            this.getTables(option, (err, tables) => {
                this.findInSql(option, tables, (err, sResults) => {
                    if (err) {
                        console.log('error', err);
                        return callback(err);
                    }
                    // findInMongo(mdb, option, err, mResults) => {
                    this.fixResults(sResults, [], (err, results) => {
                        callback(err, results);
                    });
                    // });
                });
            });
        });
    }
    getTables(option, callback) {
        let tables = [];
        let range = option.range;
        let addTable = (table) => {
            if (tables.indexOf(table) < 0) {
                tables.push(table);
            }
        };
        let getMonths = (range, callback) => {
            let months = [];
            let monthStart = moment.unix(range.start).startOf('month').unix();
            let monthEnd = moment.unix(monthStart).add(1, 'month').unix();

            months.push({
                start: monthStart,
                end: monthEnd
            });

            while (monthEnd <= range.end) {
                monthStart = moment.unix(monthStart).add(1, 'month').unix();
                monthEnd = moment.unix(monthEnd).add(1, 'month').unix();
                months.push({
                    start: monthStart,
                    end: monthEnd
                });
            }
            callback(null, months);
        };

        let startString = 'History_';

        getMonths(range, (err, months) => {
            for (let m = 0; m < months.length; m++) {
                let month = months[m];
                let start = moment.unix(month.start);
                let table = startString + start.format('YYYY') + start.format('MM');
                addTable(table);
            }
            callback(err, tables);
        });
    }
    getMissingMetersPercentage(options, op, callback) {
        let missing = [];
        let upiGroups = options.upis;
        let _options = _.cloneDeep(options);

        async.eachSeries(upiGroups, (upis, cb) => {
            _options.upis = upis;
            this.getTables(_options, (err, tables) => {
                this.countInSql(_options, tables, (err, sqlCounts) => {
                    // countInMongo(_options, err, mongoCounts) => {
                    /*sqlCounts.push({
                    	count: mongoCounts
                    });*/
                    if (err) {
                        console.log('error', err);
                        return callback(err);
                    }
                    this.findMissing(sqlCounts, _options, (err, result) => {
                        missing.push({
                            upis: upis,
                            missingPercentage: result
                        });
                        return cb();
                    });
                    // });
                });
            });
        }, (err) => {
            callback(err, missing);
        });
    }
    buildPeakPeriods(option, callback) {
        Utilities.getUtility(option, (_err, util) => {
            let holidays = {};
            let thisYear = moment().year();
            let fiscalYear = parseInt(option.fiscalYear, 10) || thisYear;
            let rateCollectionName = option.rateCollectionName;
            let type = option.type;
            let periods = [];
            let groups = {};

            if (type !== undefined) {
                type = type.toLowerCase();
            }

            if (util.RateTables['Fiscal Year'] === fiscalYear) {
                holidays = util.RateTables['Additional Off Peak Days'];
            } else if (util.PreviousRateTables.hasOwnProperty(fiscalYear)) {
                holidays = util.PreviousRateTables[fiscalYear]['Additional Off Peak Days'];
            } else {
                holidays = [];
            }

            if (!option.rateCollectionName) {
                if (util.RateTables['Fiscal Year'] === fiscalYear) {
                    groups = util.RateTables;
                } else {
                    groups = util.PreviousRateTables[fiscalYear];
                }

                for (let prop in groups) {
                    if (groups[prop].hasOwnProperty('rates')) {
                        let groupPeriods = groups[prop].periods;

                        if (option.peak === 'off') {
                            periods = groupPeriods;
                        } else {
                            for (let p = 0; p < groupPeriods.length; p++) {
                                if (groupPeriods[p].rangeType !== 'transition') {
                                    if (periods.length === 0) {
                                        periods = groupPeriods;
                                    }
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            } else if (util.RateTables['Fiscal Year'] === fiscalYear) {
                periods = util.RateTables[rateCollectionName].periods;
            } else if (util.PreviousRateTables.hasOwnProperty(fiscalYear)) {
                periods = util.PreviousRateTables[fiscalYear][rateCollectionName].periods;
            } else {
                periods = [];
            }

            callback(null, periods, holidays);
        });
    }
    buildRanges(periods, holidays, op, _range, callback) {
        let start = parseInt(_range.start, 10);
        let end = parseInt(_range.end, 10);
        let peak = op.peak;
        // let lineItem = options.lineItem;

        let ranges = [];
        let offPeakMonth = false;

        let loopRanges = (period, currentRangeStart, currentRangeEnd) => {
            while (currentRangeStart.unix() < end) {
                addRange(period, currentRangeStart, currentRangeEnd);

                currentRangeStart.add(1, 'day');
                currentRangeEnd.add(1, 'day');
            }
        };

        let addRange = (period, currentRangeStart, currentRangeEnd) => {
            let range = {
                start: 0,
                end: 0
            };
            let isHoliday = false;

            let isWeekend = (_start, _end) => {
                return (period.days.length !== 0 && (period.days.indexOf(_start.format('ddd').toLowerCase()) < 0 || period.days.indexOf(_end.format('ddd').toLowerCase()) < 0));
            };

            for (let date in holidays) {
                if (holidays[date] === currentRangeStart.format('M-D-YYYY') || holidays[date] === currentRangeEnd.format('M-D-YYYY')) {
                    isHoliday = true;
                }
            }

            if (peak === 'off') {
                if (currentRangeEnd.unix() > end) {
                    currentRangeEnd = moment.unix(end);
                }

                if (isHoliday || isWeekend(currentRangeStart, currentRangeEnd) || offPeakMonth) {
                    range.start = moment(currentRangeStart).startOf('day').unix();
                    range.end = moment(currentRangeStart).startOf('day').add(1, 'day').unix();
                    ranges.push(range);
                } else {
                    range.start = moment(currentRangeStart).startOf('day').unix();
                    range.end = moment(currentRangeStart).unix();
                    ranges.push(range);
                    let newRange = {
                        start: 0,
                        end: 0
                    };
                    newRange.start = moment(currentRangeEnd).unix();
                    newRange.end = moment(currentRangeStart).startOf('day').add(1, 'day').unix();
                    ranges.push(newRange);
                }
            } else if (!isHoliday && (period.days.indexOf(currentRangeStart.format('ddd').toLowerCase()) > -1 || period.days.length === 0)) {
                if (currentRangeEnd.unix() > end) {
                    currentRangeEnd = moment.unix(end);
                }

                range.start = currentRangeStart.unix();
                range.end = currentRangeEnd.unix();

                ranges.push(range);
            }
        };

        for (let p = 0; p < periods.length; p++) {
            let period = periods[p];
            let periodStart = moment(period.start.date, 'M-D-YYYY').startOf('month').unix();
            let periodEnd = moment(period.end.date, 'M-D-YYYY').endOf('month').add(1, 'second').unix();

            let peakStart = null;
            let peakEnd = null;

            let currentRangeStart = moment.unix(start).startOf('day');
            let currentRangeEnd = moment.unix(start);

            if (start >= periodStart && end <= periodEnd) {
                peakStart = period.start.peak;
                peakEnd = period.end.peak;

                if (peakStart !== null && peakStart !== undefined && (period.rangeType !== 'transition' || (period.rangeType === 'transition' && !!period.enablePeakSelection))) {
                    let minutes = peakStart % 100;
                    let hours = peakStart / 100;
                    currentRangeStart.hour(hours).minute(minutes);

                    minutes = peakEnd % 100;
                    hours = peakEnd / 100;
                    currentRangeEnd.hour(hours).minute(minutes);
                } else {
                    if (peak === 'on') {
                        return callback(null, []);
                    }
                    offPeakMonth = true;
                    currentRangeEnd.add(1, 'day');
                }

                loopRanges(period, currentRangeStart, currentRangeEnd);
            }
        }

        let findLowest = (ranges) => {
            let lowest = ranges[0];
            for (let i = 0; i < ranges.length; i++) {
                if (ranges[i].start < lowest.start) {
                    lowest = ranges[i];
                }
            }

            return lowest;
        };

        let newRanges = [];

        let buildNewRanges = (ranges) => {
            let lowest = findLowest(ranges);
            for (let k = 0; k < ranges.length; k++) {
                if (lowest.start <= ranges[k].start && lowest.end >= ranges[k].start && lowest.end < ranges[k].end) {
                    lowest.end = ranges[k].end;
                }
            }
            newRanges.push(lowest);
            for (let m = 0; m < ranges.length; m++) {
                if (lowest.start <= ranges[m].start && lowest.end >= ranges[m].end) {
                    ranges.splice(m, 1);
                    m--;
                }
            }
            if (!!ranges.length) {
                buildNewRanges(ranges);
            }
        };

        if (ranges.length > 0) {
            // buildNewRanges(ranges);
        }
        newRanges = ranges;
        callback(null, newRanges);
    }
    getSums(operation, option, values, range, callback) {
        let ranges = operation.ranges;
        let scale = operation.scale;
        let sums;
        let compare = (a, b) => {
            if (a.start < b.start) {
                return -1;
            }
            if (a.start > b.start) {
                return 1;
            }
            return 0;
        };

        let getScaleSums = (scaleRanges) => {
            for (let s = 0; s < scaleRanges.length; s++) {
                let scaleRange = scaleRanges[s];
                let newResult = {
                    sum: 0,
                    range: {
                        start: scaleRange.start,
                        end: scaleRange.end
                    }
                };
                for (let r = 0; r < ranges.length; r++) {
                    let periodRange = ranges[r];
                    for (let v = 0; v < values.length; v++) {
                        let value = values[v];
                        if (option.ops[0].fx === 'weather') {
                            if (value.timestamp >= scaleRange.start && value.timestamp < scaleRange.end && value.timestamp >= periodRange.start && value.timestamp < periodRange.end) {
                                newResult.sum += value.Value;
                                values.splice(v, 1);
                                v--;
                            }
                        } else if (value.timestamp > scaleRange.start && value.timestamp <= scaleRange.end && value.timestamp > periodRange.start && value.timestamp <= periodRange.end) {
                            newResult.sum += value.value;
                            values.splice(v, 1);
                            v--;
                        }
                    }
                }

                sums.push(newResult);
            }
        };

        ranges = ranges.sort(compare);

        if (!!operation.splitUpis && operation.splitUpis.toString() === 'true') {
            sums = {};
            for (let u = 0; u < option.upis.length; u++) {
                sums[option.upis[u]] = {
                    sum: 0
                };
            }

            for (let m = 0; m < ranges.length; m++) {
                for (let n = 0; n < values.length; n++) {
                    if (values[n].timestamp > ranges[m].start && values[n].timestamp <= ranges[m].end) {
                        sums[values[n].upi].sum += values[n].value;
                    }
                }
            }
        } else {
            sums = [];
            if (scale !== 'half-hour') {
                getScaleSums(this.buildScaleRanges(range, scale));
            } else {
                sums = values;
            }
        }

        operation.results = {
            sums: sums
        };
        callback(null, sums);
    }
    getMax(operation, values, range, callback) {
        let ranges = operation.ranges;
        let scale = operation.scale;
        let maxes = [];

        let compare = (a, b) => {
            if (a.start < b.start) {
                return -1;
            }
            if (a.start > b.start) {
                return 1;
            }
            return 0;
        };

        let getScaleMaxes = (scaleRanges) => {
            for (let s = 0; s < scaleRanges.length; s++) {
                let scaleRange = scaleRanges[s];
                let newResult = {
                    max: undefined,
                    timestamp: 0,
                    range: {
                        start: scaleRange.start,
                        end: scaleRange.end
                    }
                };
                for (let r = 0; r < ranges.length; r++) {
                    let periodRange = ranges[r];
                    periodRange.start = parseInt(periodRange.start, 10);
                    periodRange.end = parseInt(periodRange.end, 10);

                    for (let v = 0; v < values.length; v++) {
                        let value = values[v];
                        if (!!operation.timestamp) {
                            if (value.timestamp === operation.timestamp) {
                                newResult.max = value.value;
                                newResult.timestamp = value.timestamp;
                                break;
                            }
                        } else if (value.timestamp > scaleRange.start && value.timestamp <= scaleRange.end && value.timestamp > periodRange.start && value.timestamp <= periodRange.end) {
                            if (newResult.max === undefined || value.value > newResult.max) {
                                newResult.max = value.value;
                                newResult.timestamp = value.timestamp;
                            }

                            values.splice(v, 1);
                            v--;
                        }
                    }
                }

                maxes.push(newResult);
            }
        };

        ranges = ranges.sort(compare);
        if (!!operation.scale.match(/latest/)) {
            getScaleMaxes(operation.ranges);
        } else if (operation.scale === 'half-hour') {
            // getScaleMaxes(operation.ranges);
            maxes = values;
        } else {
            getScaleMaxes(this.buildScaleRanges(range, scale));
        }

        operation.results = {
            maxes: maxes
        };

        callback(null, operation.results);
    }
    getDatastoreData(values, operation, option, callback) {
        // group by row (timestamp)
        // group of upis per row with value/missing flag
        let start = parseInt(option.range.start, 10);
        let end = parseInt(option.range.end, 10);
        let thirtyMinutes = 30 * 60;
        let rows = [];
        start += thirtyMinutes;

        while (start <= end) {
            let row = {
                timestamp: start,
                columns: []
            };
            for (let u = 0; u < option.upis.length; u++) {
                let upi = parseInt(option.upis[u], 10);
                let cell = {
                    upi: upi,
                    Value: 0,
                    missingData: true,
                    userEdited: false
                };

                for (let v = 0; v < values.length; v++) {
                    let value = values[v];
                    if (value.timestamp === start && value.upi === upi) {
                        cell.Value = value.value;
                        cell.userEdited = (value.useredited === 1) ? true : false;
                        cell.missingData = false;
                    }
                }

                row.columns.push(cell);
            }
            rows.push(row);
            start += thirtyMinutes;
        }
        operation.results = {
            datastore: rows
        };
        callback(null, rows);
    }
    getMinAndMax(values, op, option, callback) {
        let minsAndMaxes = [];
        let periods;
        if (!!op.scale.match(/latest/)) {
            periods = [option.range];
        } else {
            periods = this.buildScaleRanges(option.range, op.scale);
        }

        for (let i = 0; i < periods.length; i++) {
            let min = 'start';
            let max = 'start';
            let minDate = null;
            let maxDate = null;

            for (let r = 0; r < values.length; r++) {
                if (values[r].timestamp >= periods[i].start && values[r].timestamp <= periods[i].end) {
                    if (isNaN(min) || min > values[r].value) {
                        min = values[r].value;
                        minDate = values[r].timestamp;
                    }
                    if (isNaN(max) || max < values[r].value) {
                        max = values[r].value;
                        maxDate = values[r].timestamp;
                    }
                }
            }
            minsAndMaxes.push({
                min: min,
                minDate: minDate,
                max: max,
                maxDate: maxDate,
                range: periods[i]
            });
        }

        op.results = {
            tempRanges: minsAndMaxes
        };

        callback(null);
    }
    getMissingDatastore(operation, data, callback) {
        let previousRow = {};
        let missingRows = [];
        let missingData = [];

        for (let i = 0; i < data.length; i++) {
            let columns = data[i].columns;
            let badRow = false;

            for (let r = 0; r < columns.length; r++) {
                if (columns[r].missingData || columns[r].userEdited) {
                    badRow = true;
                }
            }

            if (badRow && i !== data.length - 1) {
                if (!!previousRow.timestamp) {
                    missingRows.push(previousRow);
                }
                missingRows.push(data[i]);
                previousRow = {};
            } else if (badRow && i === data.length - 1) {
                if (!!previousRow.timestamp) {
                    missingRows.push(previousRow);
                }
                missingRows.push(data[i]);
                missingData.push(missingRows);
            } else {
                if (!!missingRows.length) {
                    missingRows.push(data[i]);
                    missingData.push(missingRows);
                    missingRows = [];
                }
                previousRow = data[i];
            }
        }
        operation.results = {
            missingData: missingData
        };
        callback(null, missingData);
    }
    findInSql(options, tables, callback) {
        let upis = options.upis;
        let years = [];
        let results = [];

        let testFunctions = () => {
            return ['sum', 'max', 'reactiveCharge'].indexOf(options.ops[0].fx) >= 0 && (!options.ops[0].hasOwnProperty('splitUpis') || options.ops[0].splitUpis.toString() !== 'true');
        };

        for (let i = 0; i < tables.length; i++) {
            if (years.indexOf(tables[i].substring(8, 12)) < 0) {
                years.push(tables[i].substring(8, 12));
            }
        }

        async.eachSeries(years, (year, cb) => {
            let columns;
            if (testFunctions()) {
                columns = ['SUM(VALUE) as VALUE', 'TIMESTAMP', 'COUNT(UPI) as UPIS'];
            } else {
                columns = ['UPI', 'TIMESTAMP', 'VALUE', 'VALUETYPE', 'STATUSFLAGS', 'USEREDITED'];
            }

            let start = 'SELECT ' + columns.join(', ') + ' FROM';
            let WHERE = 'WHERE';
            let UNION = 'UNION';
            let statement = [];

            statement.push(start);

            for (let i = 0; i < tables.length; i++) {
                if (tables[i].substring(8, 12) === year) {
                    if (statement.length > 1) {
                        statement.push(UNION);
                        statement.push(start);
                    }

                    statement.push(tables[i]);
                    if (upis.length === 1) {
                        statement.push(WHERE);
                        statement.push('upi =');
                        statement.push(upis[0]);
                    } else if (upis.length > 1) {
                        statement.push(WHERE);
                        statement.push('upi IN');
                        statement.push('(' + upis.join(',') + ')');
                    }

                    if (['weather', 'history match', 'latest history', 'earliest history'].indexOf(options.ops[0].fx) >= 0) {
                        statement.push('AND TIMESTAMP >=');
                    } else {
                        statement.push('AND TIMESTAMP >');
                    }
                    statement.push(options.range.start);
                    if (options.ops[0].fx === 'latest history') {
                        statement.push('AND TIMESTAMP <');
                    } else {
                        statement.push('AND TIMESTAMP <=');
                    }
                    statement.push(options.range.end);
                    if (['history match'].indexOf(options.ops[0].fx) >= 0) {
                        statement.push('AND TIMESTAMP IN (');
                        statement.push(options.timestamps);
                        statement.push(')');
                    }
                    if (testFunctions()) {
                        statement.push('GROUP BY timestamp');
                    }
                }
            }
            if (['latest history'].indexOf(options.ops[0].fx) >= 0) {
                statement.push('ORDER BY TIMESTAMP DESC LIMIT 1');
            } else if (['earliest history'].indexOf(options.ops[0].fx) >= 0) {
                statement.push('ORDER BY TIMESTAMP ASC LIMIT 1');
            }

            statement = statement.join(' ');
            let criteria = {
                year: parseInt(year, 10),
                statement: statement
            };
            ArchiveUtility.all(criteria, (err, rows) => {
                results = results.concat(rows);
                cb(err);
            });
        }, (err) => {
            return callback(err, results);
        });
    }
    fixResults(sResults, mResults, callback) {
        // check for undefined results, throw error
        let m;
        let compare = (a, b) => {
            if (a.timestamp < b.timestamp) {
                return -1;
            }
            if (a.timestamp > b.timestamp) {
                return 1;
            }
            return 0;
        };

        if (!!sResults.length) {
            // JS logger.info("---- fixResults() --> sResults.length = " + sResults.length);
            // JS logger.info("---- fixResults() --> sResults = " + JSON.stringify(sResults));
            for (let a = 0; a < sResults.length; a++) {
                let sResult = sResults[a];
                if (!!sResult) {
                    // JS logger.info("---- fixResults() --> sResults[" + a + "] = " + sResult);
                    for (let prop in sResult) {
                        let lc = prop.toLowerCase();
                        sResult[lc] = sResult[prop];
                        delete sResult[prop];
                    }
                    sResult.value = parseFloat(sResult.value);
                    sResult.Value = parseFloat(sResult.value);
                    for (m = 0; m < mResults.length; m++) {
                        if (sResult.timestamp === mResults[m].timestamp) {
                            sResult.value += parseFloat(mResults[m].Value);
                            sResult.upis++;
                            mResults.splice(m, 1);
                            m--;
                        }
                    }
                }
            }
            for (let t = 0; t < mResults.length; t++) {
                sResults.push({
                    value: mResults[t].Value,
                    timestamp: mResults[t].timestamp,
                    upi: mResults[t].upi
                });
            }
        } else {
            for (m = 0; m < mResults.length; m++) {
                mResults[m].value = parseFloat(mResults[m].Value);
                delete mResults[m].Value;
                sResults.push(mResults[m]);
            }
            sResults = mResults;
        }

        sResults.sort(compare);
        callback(null, sResults);
    }
    countInSql(options, tables, callback) {
        let upis = options.upis;
        let results = [];
        let years = [];
        for (let i = 0; i < tables.length; i++) {
            if (years.indexOf(tables[i].substring(8, 12)) < 0) {
                years.push(tables[i].substring(8, 12));
            }
        }

        async.eachSeries(years, (year, cb) => {
            let WHERE = 'WHERE';
            let UNION = 'UNION';
            let statement = [];

            let buildStart = (tableName) => {
                return 'Select count(*) as count, "' + tableName + '" as TableName FROM';
            };

            for (let i = 0; i < tables.length; i++) {
                if (tables[i].substring(8, 12) === year) {
                    if (!statement.length) {
                        statement.push(buildStart(tables[i]));
                    }
                    if (statement.length > 1) {
                        statement.push(UNION);
                        statement.push(buildStart(tables[i]));
                    }

                    statement.push(tables[i]);
                    statement.push(WHERE);
                    statement.push('timestamp >');
                    statement.push(options.range.start);
                    statement.push('AND');
                    statement.push('timestamp <=');
                    statement.push(options.range.end);

                    if (upis.length === 1) {
                        statement.push('AND');
                        statement.push('upi =');
                        statement.push(upis[0]);
                    } else if (upis.length > 1) {
                        statement.push('AND');
                        statement.push('upi IN');
                        statement.push('(' + upis.join(',') + ')');
                    }
                }
            }
            statement = statement.join(' ');
            let criteria = {
                year: parseInt(year, 10),
                statement: statement
            };
            ArchiveUtility.all(criteria, (err, rows) => {
                results = results.concat(rows);
                cb(err);
            });
        }, (err) => {
            return callback(err, results);
        });
    }
    findMissing(counts, options, callback) {
        let count = 0;
        let start = options.range.start;
        let end = options.range.end;

        for (let i = 0; i < counts.length; i++) {
            count += counts[i].count;
        }
        let ranges = (end - start) / (30 * 60);
        let maxCount = options.upis.length * ranges;
        count = maxCount - count;
        let percentage = (count / maxCount) * 100;
        callback(null, percentage);
    }
    updateDashboards(results, callback) {
        /*let socket = require('../socket/socket.js');
        for (let r = 0; r < results.length; r++) {
        	if ((results[r].fx === 'sum' || results[r].fx === 'max') && !!results[r].socketid) {
        		socket.addDashboardDynamics(results[r]);
        	}
        }*/
        callback();
    }
    buildScaleRanges(range, scale) {
        let scaleRanges = [];
        let scaleStart;
        let scaleEnd;

        if (scale === 'half-hour') {
            scaleStart = moment.unix(range.start).startOf(scale).unix();
            scaleEnd = moment.unix(range.start).startOf(scale).add(30, 'minutes').unix();

            while (scaleEnd <= range.end) {
                scaleRanges.push({
                    start: scaleStart,
                    end: scaleEnd
                });
                scaleStart = moment.unix(scaleStart).add(30, 'minutes').unix();
                scaleEnd = moment.unix(scaleEnd).add(30, 'minutes').unix();
            }
        } else if (scale === 'year') {
            scaleRanges.push(range);
        } else {
            scaleStart = moment.unix(range.start).startOf(scale).unix();
            scaleEnd = moment.unix(range.start).startOf(scale).add(1, scale).unix();

            while (scaleEnd <= range.end) {
                scaleRanges.push({
                    start: scaleStart,
                    end: scaleEnd
                });
                scaleStart = moment.unix(scaleStart).add(1, scale).unix();
                scaleEnd = moment.unix(scaleEnd).add(1, scale).unix();
            }
        }

        return scaleRanges;
    }
    getUsage(options, callback) {
        async.eachSeries(options, (option, optionsCB) => {
            let firstOp = option.ops[0];
            if (firstOp.fx === 'missingPercentage') {
                this.getMissingMetersPercentage(option, firstOp, (err, result) => {
                    if (!err) {
                        firstOp.results = {
                            missingPercentage: result
                        };
                    }
                    optionsCB(err);
                });
            } else {
                option.upis = option.upis.filter((upi) => {
                    return !isNaN(parseInt(upi, 10));
                });
                option.upis = option.upis.map((upi) => {
                    return parseInt(upi, 10);
                });

                if (!!option.upis.length) {
                    this.getValues(option, (err, values) => {
                        let ops = option.ops;
                        async.eachSeries(ops, (op, operationsCB) => {
                            async.waterfall([(waterfallCB) => {
                                if (['on', 'off'].indexOf(op.peak) >= 0 && !op.scale.match(/latest/)) {
                                    let tempRanges = [];
                                    let rangeStart = moment.unix(option.range.start);
                                    let rangeEnd = moment.unix(option.range.end);

                                    if (rangeEnd.diff(rangeStart, 'months') > 1) {
                                        let _start = parseInt(option.range.start, 10);
                                        let _end = parseInt(option.range.end, 10);
                                        let tempEnd = moment.unix(_start).add(1, 'month').unix();
                                        while (tempEnd <= _end) {
                                            let tempRange = {
                                                start: _start,
                                                end: tempEnd
                                            };
                                            tempRanges.push(tempRange);
                                            _start = tempEnd;
                                            tempEnd = moment.unix(tempEnd).add(1, 'month').unix();
                                        }
                                        op.ranges = tempRanges;
                                    } else {
                                        op.ranges = [option.range];
                                    }

                                    let periodRanges = [];
                                    async.eachSeries(op.ranges, (range, rangesCB) => {
                                        this.buildPeakPeriods(op, (err, periods, holidays) => {
                                            this.buildRanges(periods, holidays, op, range, (err, peakPeriods) => {
                                                periodRanges = periodRanges.concat(peakPeriods);
                                                rangesCB(err);
                                            });
                                        });
                                    }, (err) => {
                                        op.ranges = periodRanges;
                                        waterfallCB(null);
                                    });
                                } else {
                                    op.ranges = [option.range];
                                    waterfallCB(null);
                                }
                            }, (waterfallCB) => {
                                // todo this was causing a problem and once fixed, can reuse buildops to combine like ops
                                // let _values = _.cloneDeep(values);
                                // let values = values;


                                if (['sum', 'weather'].indexOf(op.fx) >= 0) {
                                    this.getSums(op, option, values, option.range, waterfallCB);
                                } else if (op.fx === 'max') {
                                    this.getMax(op, values, option.range, waterfallCB);
                                } else if (op.fx === 'datastore') {
                                    this.getDatastoreData(values, op, option, waterfallCB);
                                } else if (op.fx === 'reactiveCharge') {
                                    this.getMax(op, values, option.range, (err, demand) => {
                                        op.results = [];
                                        async.eachSeries(demand.maxes, (demandMax, demandCB) => {
                                            let optionClone = _.cloneDeep(option);
                                            let operationClone = _.cloneDeep(op);
                                            optionClone.upis = optionClone.secondUpis;
                                            optionClone.range = demandMax.range;
                                            operationClone.fx = 'max';
                                            operationClone.timestamp = demandMax.timestamp;
                                            optionClone.ops = [operationClone];

                                            this.getUsage([optionClone], (err, reactive) => {
                                                op.results.push({
                                                    demand: demandMax,
                                                    reactive: reactive[0].ops[0].results.maxes[0]
                                                });
                                                demandCB(err);
                                            });
                                        }, (err) => {
                                            waterfallCB(err);
                                        });
                                    });
                                } else if (op.fx === 'tempRange') {
                                    this.getMinAndMax(values, op, option, waterfallCB);
                                } else if (op.fx === 'missingData') {
                                    this.getDatastoreData(values, op, option, (err, data) => {
                                        this.getMissingDatastore(op, data, waterfallCB);
                                    });
                                }
                            }], (err) => {
                                delete op.ranges;
                                operationsCB(null);
                            });
                        }, optionsCB);
                    });
                } else {
                    option.error = 'No valid upis supplied.';
                    optionsCB();
                }
            }
        }, (err) => {
            callback(err, options);
        });
    }
    addToSQLite(ranges, cb) {
        let criteria = {};
        let doMonth = (range, cb2) => {
            ArchiveUtility.serialize(range, () => {
                criteria = {
                    year: range.year,
                    statement: 'PRAGMA synchronous = OFF'
                };
                ArchiveUtility.exec(criteria, () => {
                    let tableName = 'History_' + range.year.toString() + range.month.toString();
                    criteria = {
                        year: range.year,
                        statement: 'BEGIN TRANSACTION'
                    };
                    ArchiveUtility.runDB(criteria, () => {
                        let batchSize = 100;
                        let count = 0;
                        let parameterPlaceholder = '?,?,?,?,?,?';
                        let additionalParameter = ',(' + parameterPlaceholder + ')';
                        let params = [];

                        let processPoint = (_cb) => {
                            let statement = 'INSERT INTO ' + tableName + ' (UPI, TIMESTAMP, VALUE, VALUETYPE, STATUSFLAGS, USEREDITED) VALUES  (' + parameterPlaceholder + ')' + additionalParameter.repeat(params.length / 6 - 1);

                            criteria = {
                                year: range.year,
                                statement: statement
                            };
                            ArchiveUtility.prepare(criteria, (stmt) => {
                                criteria = {
                                    year: range.year,
                                    statement: stmt,
                                    parameters: params
                                };
                                ArchiveUtility.runStatement(criteria, () => {
                                    ArchiveUtility.finalizeStatement(criteria, () => {
                                        params = [];
                                        return _cb();
                                    });
                                });
                            });
                        };

                        async.eachSeries(range.points, (point, callback) => {
                            let userEdited = (point.hasOwnProperty('userEdited')) ? point.userEdited : false;

                            params.push(point.upi, point.timestamp, point.Value, point.ValueType, point.statusflags, userEdited);
                            if (++count % batchSize === 0) {
                                processPoint(() => {
                                    callback();
                                });
                            } else {
                                callback();
                            }
                        }, (err) => {
                            if (!!params.length) {
                                processPoint(() => {
                                    criteria = {
                                        year: range.year,
                                        statement: 'END TRANSACTION'
                                    };
                                    ArchiveUtility.runDB(criteria, cb2);
                                });
                            } else {
                                criteria = {
                                    year: range.year,
                                    statement: 'END TRANSACTION'
                                };
                                ArchiveUtility.runDB(criteria, cb2);
                            }
                        });
                    });
                });
            });
        };


        async.eachSeries(ranges, (range, callback) => {
            console.log(range.year, range.month);
            doMonth(range, callback);
        }, (err) => {
            this.removeFromHistorydata(ranges, cb);
        });
    }
    removeFromHistorydata(ranges, cb) {
        // no longer removing data by mongo.remove()
        // keeping in case mongo.drop and ensureIndex needs to be added late=> r
        cb();
    }
    getUsage(data, cb) {
        let callback = (err, results) => {
            results = this.unbuildOps(results);

            this.updateDashboards(results, (_err) => {
                if (!!err || !!_err) {
                    return cb(err || _err);
                }
                return cb(null, results);
            });
        };

        let reqOptions = data.options;

        reqOptions.forEach((options) => {
            if (typeof options.ranges === 'string') {
                options.ranges = JSON.parse(options.ranges);
            }
            if (!(options.upis instanceof Array)) {
                options.upis = JSON.parse(options.upis);
            }
            return;
        });
        reqOptions = this.buildOps(reqOptions);
        this.getUsage(reqOptions, callback);
    }
    getMissingMeters(data, cb) {
        let options = data.options;
        let meters = options.meters;
        let missingMeters = [];
        let start = options.start;
        let end = options.end;

        let endOfPeriod = (end > moment().unix()) ? moment().unix() : end;

        async.each(meters, (meter, callback) => {
            meter.upis = meter.upis.map((upi) => {
                return parseInt(upi, 10);
            });

            let table = 'History_' + moment.unix(start).format('YYYY') + moment.unix(start).format('MM');
            let neededCount = Math.ceil((endOfPeriod - start) / (30 * 60)) * meter.upis.length;
            let statement = 'SELECT COUNT(*) AS COUNT FROM ' + table + ' WHERE UPI IN (' + meter.upis.toString() + ') AND TIMESTAMP >' + start + ' AND TIMESTAMP <= ' + end;

            let criteria = {
                year: moment.unix(start).year(),
                statement: statement
            };
            ArchiveUtility.get(criteria, (err, row) => {
                table = 'History_' + moment.unix(end).format('YYYY') + moment.unix(end).format('MM');
                statement = 'SELECT COUNT(*) AS COUNT FROM ' + table + ' WHERE UPI IN (' + meter.upis.toString() + ') AND TIMESTAMP >' + start + ' AND TIMESTAMP <= ' + end;

                criteria = {
                    year: moment.unix(end).year(),
                    statement: statement
                };
                ArchiveUtility.get(criteria, (err, row2) => {
                    if ((row.COUNT + row2.COUNT) < neededCount) {
                        missingMeters.push(meter);
                        return callback(err);
                    }
                    statement = 'SELECT COUNT(*) AS COUNT FROM ' + table + ' WHERE UPI IN (' + meter.upis.toString() + ') AND USEREDITED=1 AND TIMESTAMP >' + start + ' AND TIMESTAMP <= ' + end;

                    criteria = {
                        year: moment.unix(end).year(),
                        statement: statement
                    };
                    ArchiveUtility.get(criteria, (err, _row2) => {
                        table = 'History_' + moment.unix(start).format('YYYY') + moment.unix(start).format('MM');
                        statement = 'SELECT COUNT(*) AS COUNT FROM ' + table + ' WHERE UPI IN (' + meter.upis.toString() + ') AND USEREDITED=1 AND TIMESTAMP >' + start + ' AND TIMESTAMP <= ' + end;

                        criteria = {
                            year: moment.unix(start).year(),
                            statement: statement
                        };
                        ArchiveUtility.get(criteria, (err, _row) => {
                            if ((_row2.COUNT + _row.COUNT) > 0) {
                                missingMeters.push(meter);
                                return callback(err);
                            }
                            return callback(err);
                        });
                    });
                });
            });
        }, (err) => {
            cb(err, missingMeters);
        });
    }
    editDatastore(data, cb) {
        let values = data.values;

        if (!!values) {
            this.editHistoryData(values, 3, cb);
        } else {
            cb();
        }
    }
    importCSV(data, cb) {
        let options = data.options;
        let ranges = [];
        let path = options.path;
        let methods = options.methods;
        let upis = [];
        let pass = 0;


        fs.createReadStream(path)
            .pipe(csv())
            .on('data', (data) => {
                if (!(pass & 1)) {
                    for (let i = 1; i < data.length; i++) {
                        let upi = parseInt(data[i], 10);
                        if (!isNaN(data[i])) {
                            upis.push(upi);
                        }
                    }
                    pass |= 1;
                } else if (!(pass & 2)) {
                    pass |= 2;
                } else if (!(pass & 4)) {
                    pass |= 4;
                } else if (!!upis.length) {
                    for (let d = 1; d < data.length; d++) {
                        if (!!data[d]) {
                            let range = {
                                timestamp: moment(data[0], dateFormat).unix(),
                                upi: upis[d - 1],
                                Value: parseFloat(data[d])
                            };
                            ranges.push(range);
                        } else {
                            // skip
                        }
                    }
                }
            }).on('end', () => {
                this.editHistoryData(ranges, methods, (err, result) => {
                    fs.unlinkSync(path);
                    cb(err, result);
                });
            });
    }
    exportCSV(data, cb) {
        let options = data.options;
        let start = parseInt(options.range.start, 10);
        let end = parseInt(options.range.end, 10);

        let startDate = moment.unix(start).startOf('day').add(30, 'minutes');
        let endDate = moment.unix(end).startOf('day');

        let titles = [];
        let upis = [];

        let rows = [];

        titles.push(options.meterName);
        titles.push(options.upiMap[0].meterPointDesc);
        titles.push(options.upiMap[1].meterPointDesc);
        titles.push(options.upiMap[2].meterPointDesc);

        upis.push('');
        upis.push(options.upiMap[0].upi);
        upis.push(options.upiMap[1].upi);
        upis.push(options.upiMap[2].upi);

        let workingTime = moment(startDate);
        while (workingTime.unix() <= endDate.unix()) {
            rows.push([workingTime.format(dateFormat), '', '', '']);
            workingTime.add(30, 'minutes');
        }

        this.fillInData(options, rows, (err, rows) => {
            if (err) {
                return cb(err);
            }
            let csvStream = csv.createWriteStream();
            tmp.file({
                dir: __dirname + '/../tmp/',
                postfix: '.csv',
                prefix: startDate.format('YYYYMM-') + options.meterName + '-'
            }, (err, path) => {
                console.log(err, path);
                let writableStream = fs.createWriteStream(path);

                writableStream.on('finish', (err) => {
                    cb(err, path);
                });

                csvStream.pipe(writableStream);

                csvStream.write(upis);
                csvStream.write(titles);
                csvStream.write(['Date Time', '(Mlet)', '(MW)', '(MWh)']);
                for (let r = 0; r < rows.length; r++) {
                    csvStream.write(rows[r]);
                }
                csvStream.end();
            });
        });
    }
    uploadCSV(files, cb) {
        let path = __dirname + '\\..\\tmp\\uploads\\' + Date.now() + '.csv';
        if (!!files.csv.originalname.match(/\.csv/i)) {
            fs.writeFile(path, files.csv.buffer, (err) => {
                if (err) {
                    return cb({
                        err: err
                    });
                }
                return cb(null, path);
            });
        } else {
            return cb({
                err: true,
                message: 'The uploaded file is not in the correct format. Only CSV files are supported.'
            });
        }
    }
    findHistory(options, callback) {
        // find history based on upis and exact timestamps
        options.ops = [{
            fx: (!!options.fx) ? options.fx : 'history match'
        }];
        // JS console.log('%%%%%%%%%%%', JSON.stringify(options));
        this.getTables(options, (err, tables) => {
            this.findInSql(options, tables, (err, sResults) => {
                this.fixResults(sResults || [], [], (err, results) => {
                    callback(err, results);
                });
            });
        });
    }
    findLatest(options, callback) {
        // find most recent value based on upi and ts, build all months into one statement per year
        let range = options.range;

        options.ops = [{
            fx: 'latest history'
        }];
        range.start = moment.unix(range.end).startOf('year').unix();

        this.getTables(options, (err, tables) => {
            this.findInSql(options, tables, (err, sResults) => {
                this.fixResults(sResults || [], [], (err, results) => {
                    if (!results.length && moment.unix(range.start).year() > 2000) {
                        range.end = range.start - 1;
                        this.findLatest(options, callback);
                    } else {
                        return callback(err, results);
                    }
                });
            });
        });
    }
    findEarliest(options, callback) {
        // find oldest value based on upi and ts, build all months into one statement per year
        let range = options.range;

        options.ops = [{
            fx: 'earliest history'
        }];
        range.end = moment.unix(range.start).endOf('year').unix();

        this.getTables(options, (err, tables) => {
            this.findInSql(options, tables, (err, sResults) => {
                this.fixResults(sResults || [], [], (err, results) => {
                    if (!results.length && range.end <= moment().unix()) {
                        range.start = range.end + 1;
                        this.findEarliest(options, callback);
                    } else {
                        return callback(err, results);
                    }
                });
            });
        });
    }
    findEarliestAndLatest(options, callback) {
        options.range = {
            start: moment(2000, 'YYYY').unix()
        };

        self.findEarliest(options, (err, earliest) => {
            options.range.end = moment().unix();
            self.findLatest(options, (err2, latest) => {
                let min = earliest[0] || {
                    timestamp: 0
                };
                let max = latest[0] || {
                    timestamp: 0
                };

                callback(err || err2, {
                    min: min.timestamp,
                    max: max.timestamp
                });
            });
        });
    }
    doBackUp(upis, limitRange, cb) {
        let criteria = {};
        let dates = [];
        let query = {};
        let findRangeEnds = (callback) => {
            this.get({
                query: {},
                sort: {
                    timestamp: 1
                },
                limit: 1
            }, (err, first) => {
                this.get({
                    query: {},
                    sort: {
                        timestamp: -1
                    },
                    limit: 1
                }, (_err, last) => {
                    callback(err, {
                        start: !!first.length && first[0].timestamp || 0,
                        end: !!last.length && last[0].timestamp || 0
                    });
                });
            });
        };
        let buildDates = (range) => {
            let end = range.end;
            let tempTime = range.start;

            while (tempTime <= end) {
                let date = {};
                date.start = tempTime;
                tempTime = moment.unix(tempTime).add(1, 'month').unix();
                date.end = tempTime;
                dates.push(date);
            }
        };
        findRangeEnds((err, range) => {
            buildDates(range);
            async.eachSeries(dates, (date, callback) => {
                query = {
                    $and: [{
                        timestamp: {
                            $gte: date.start
                        }
                    }, {
                        timestamp: {
                            $lt: date.end
                        }
                    }]
                };

                criteria = {
                    query: query
                };

                this.get(criteria, (err, points) => {
                    buildTimeRanges(points);
                });

                let buildTimeRanges = (points) => {
                    let compare = (a, b) => {
                        if (a.timestamp < b.timestamp) {
                            return -1;
                        }
                        if (a.timestamp > b.timestamp) {
                            return 1;
                        }
                        return 0;
                    };

                    let upsertRange = (month, year, point) => {
                        let range = {
                            month: month,
                            year: year,
                            points: []
                        };
                        for (let j = 0; j < ranges.length; j++) {
                            if (ranges[j].year === year && ranges[j].month === month) {
                                ranges[j].points.push(point);
                                return;
                            }
                        }
                        range.points.push(point);
                        ranges.push(range);
                    };

                    let ranges = [];

                    points.sort(compare);

                    for (let i = 0; i < points.length; i++) {
                        let month = moment.unix(points[i].timestamp).format('MM');
                        let year = moment.unix(points[i].timestamp).format('YYYY');

                        upsertRange(month, year, points[i]);
                    }
                    console.log(ranges.length);
                    this.addToSQLite(ranges, callback);
                };
            }, (err) => {
                cb(err);
            });
        });
    }
    // buildOps: buildOps,
    // unbuildOps: unbuildOps,
    // getUsageCall: getUsage
    delete(data, cb) {
        let upi = data.upi;
        let query = {
            _id: upi
        };
        this.remove({
            query: query
        }, cb);
    }
    getAll(criteria, cb) {
        criteria.collection = this.collection;
        this.get(criteria, cb);
    }
};

module.exports = History;
