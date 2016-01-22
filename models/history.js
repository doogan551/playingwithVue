var async = require('async');
var moment = require('moment');
var csv = require('fast-csv');
var _ = require('lodash');
var fs = require('fs');
var tmp = require('tmp');

var logger = require('../helpers/logger')(module);
var Utility = require('../models/utility');
var ArchiveUtility = require('../models/archiveutility');
var Config = require('../public/js/lib/config');
var dateFormat = 'ddd, MMM DD, YYYY HH:mm:ss ZZ';

String.prototype.repeat = function(num) {
	return new Array(num + 1).join(this);
};

Array.prototype.equals = function(array) {
	// if the other array is a falsy value, return
	if (!array)
		return false;

	// compare lengths - can save a lot of time 
	if (this.length != array.length)
		return false;

	for (var i = 0, l = this.length; i < l; i++) {
		// Check if we have nested arrays
		if (this[i] instanceof Array && array[i] instanceof Array) {
			// recurse into the nested arrays
			if (!this[i].equals(array[i]))
				return false;
		} else if (this[i] != array[i]) {
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
			return false;
		}
	}
	return true;
};

var formatRange = function(range) {
	console.log(JSON.stringify({
		start: moment.unix(range.start).format(),
		end: moment.unix(range.end).format()
	}));
};

var formatRanges = function(ranges) {
	ranges.forEach(formatRange);
};

var buildOps = function(options) {
	var newOptions = [];

	var compareRanges = function(a, b) {
		var makeNumbers = function(obj) {
			for (var prop in obj) {
				obj[prop] = parseInt(obj[prop], 10);
			}
		};

		makeNumbers(a);
		makeNumbers(b);
		if (a.start === b.start && a.end === b.end) {
			return true;
		}
		return false;
	};

	var addOp = function(operation) {
		var op = {};
		for (var prop in operation) {
			if (['range', 'upis', 'secondUpis'].indexOf(prop) < 0) {
				op[prop] = operation[prop];
			}
		}

		/*for (var n = 0; n < newOptions.length; n++) {
			if (['sum', 'max'].indexOf(op.fx) >= 0 && newOptions[n].upis.equals(operation.upis) && !!operation.range && compareRanges(newOptions[n].range, operation.range)) {
				newOptions[n].ops.push(op);
				return;
			}
		}*/

		newOptions.push({
			range: operation.range,
			upis: operation.upis,
			secondUpis: operation.secondUpis,
			ops: [op]
		});
	};

	var loopOptions = function() {
		for (var i = 0; i < options.length; i++) {
			addOp(options[i]);
		}
	};
	loopOptions();
	return newOptions;
};

var unbuildOps = function(options) {
	var newOptions = [];

	for (var i = 0; i < options.length; i++) {
		var option = options[i];
		for (var j = 0; j < option.ops.length; j++) {
			var operation = option.ops[j];
			var tempOption = {};
			var prop;
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
};

var editHistoryData = function(values, updateOptions, callback) {
	// updateOptions:
	// 1: insert missing data only
	// 2: overwrite user-supplied data only
	// 4: overwrite meter reported data only
	var count = 0;
	var updatedCount = 0;
	var criteria = {};

	async.eachSeries(values, function(value, callback) {
		value.upi = parseInt(value.upi, 10);
		value.timestamp = parseInt(value.timestamp, 10);
		value.Value = parseFloat(value.Value);
		value.statusflags = (!!value.statusflags) ? parseInt(value.statusflags, 10) : null;
		value.ValueType = (!!value.ValueType) ? parseInt(value.ValueType, 10) : null;
		var query = {
			upi: value.upi,
			timestamp: value.timestamp
		};
		var stmt;
		if (isNaN(value.upi) || isNaN(value.timestamp)) {
			return callback('bad timestamp or upi');
		}

		criteria = {
			collection: 'historydata',
			query: query
		};
		Utility.getOne(criteria, function(err, point) {

			if (!!point) {
				if (point.userEdited) {
					var updateObj = {
						$set: {
							Value: value.Value,
							userEdited: true
						}
					};
					count++;
					updatedCount++;
					criteria = {
						collection: 'historydata',
						query: query,
						updateObj: updateObj
					};
					Utility.update(criteria, callback);
				} else {
					//ignored
					return callback();
				}
			} else {
				var month = moment.unix(value.timestamp).format('MM');
				var year = moment.unix(value.timestamp).format('YYYY');
				var table = "History_" + year + month;
				var selectStatement = 'Select UPI, TIMESTAMP, USEREDITED FROM ' + table + ' WHERE UPI=(?) AND TIMESTAMP=(?)';
				//run select
				criteria = {
					year: moment.unix(value.timestamp).year(),
					statement: selectStatement,
					parameters: [value.upi, value.timestamp]
				};
				ArchiveUtility.get(criteria, function(err, sPoint) {
					var bindings = {
						$upi: value.upi,
						$timestamp: value.timestamp,
						$Value: value.Value
					};

					if ((updateOptions & 1 !== 0) && !sPoint) {
						// only inserting new data
						updateDashboard = true;
						var insertStatement = 'INSERT INTO ' + table + ' (UPI, TIMESTAMP, VALUE, VALUETYPE, STATUSFLAGS, USEREDITED)';
						insertStatement += 'VALUES ($upi, $timestamp, $Value, $ValueType, $statusflags, 1)';
						bindings['$ValueType'] = (!!value.ValueType) ? value.ValueType : 1;
						bindings['$statusflags'] = (!!value.statusflags) ? value.statusflags : 0;

						criteria = {
							year: moment.unix(value.timestamp).year(),
							statement: insertStatement
						};
						ArchiveUtility.prepare(criteria, function(stmt) {

							criteria = {
								year: moment.unix(value.timestamp).year(),
								statement: stmt,
								parameters: bindings
							};
							ArchiveUtility.runStatement(criteria, function() {
								ArchiveUtility.finalizeStatement(criteria, function() {
									if (err) {
										return callback(err);
									} else {
										updatedCount++;
										callback();
									}
								});
							});
						});
					} else if (((updateOptions & 2) !== 0 && sPoint.USEREDITED === 1) || ((updateOptions & 4) !== 0 && sPoint.USEREDITED === 0 && sPoint.VALUE !== value.Value)) {
						// updating only existing user edited data
						var updateStatement = 'UPDATE ' + table;
						updateStatement += ' SET VALUE=$Value';
						if (!!value.statusflags) {
							bindings['$statusflags'] = value.statusflags;
							updateStatement += ', STATUSFLAGS=$statusflags';
						}

						updateStatement += ', USEREDITED=1 WHERE';
						updateStatement += ' UPI=$upi AND TIMESTAMP=$timestamp AND USEREDITED=' + sPoint.USEREDITED;

						criteria = {
							year: moment.unix(value.timestamp).year(),
							statement: updateStatement
						};
						ArchiveUtility.prepare(criteria, function(stmt) {

							criteria = {
								year: moment.unix(value.timestamp).year(),
								statement: stmt,
								parameters: bindings
							};
							ArchiveUtility.runStatement(criteria, function() {
								ArchiveUtility.finalizeStatement(criteria, function() {
									if (err) {
										return callback(err);
									} else {
										updatedCount++;
										callback();
									}
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
	}, function(err) {
		return callback(err, updatedCount);
	});
};

var fillInData = function(options, rows, callback) {
	options.upis = options.upiMap.map(function(upi) {
		return parseInt(upi.upi, 10);
	});
	options.ops = [{
		scale: 'month'
	}];
	getValues(options, function(err, results) {
		if (err) {
			return callback(err);
		}
		updateRows(results, options, rows, callback);
	});
};

var updateRows = function(results, options, rows, callback) {
	var upis = options.upis;

	var start = parseInt(options.range.start, 10);
	var end = parseInt(options.range.end, 10);
	var columns = [];
	var i, m;
	var timeOffset = 30 * 60;

	var compare = function(a, b) {
		if (a.timestamp < b.timestamp)
			return -1;
		if (a.timestamp > b.timestamp)
			return 1;
		if (a.upi < b.upi)
			return -1;
		if (a.upi > b.upi)
			return 1;
		return 0;
	};

	results.sort(compare);
	var startTime = new Date();
	var offset = 0;
	for (var u = 0; u < upis.length; u++) {
		var workingTime = start + timeOffset;
		var r = 0;

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
};

var runBackUp = function(upis, limitRange, cb) {
	var criteria = {};
	var today = moment().startOf('day').unix();
	var dates = [{
		start: moment('01/01/2000', 'MM/DD/YYYY'),
		end: moment('01/01/2012', 'MM/DD/YYYY')
	}, {
		start: moment('01/01/2012', 'MM/DD/YYYY'),
		end: moment('01/01/2013', 'MM/DD/YYYY')
	}, {
		start: moment('01/01/2013', 'MM/DD/YYYY'),
		end: moment('01/01/2014', 'MM/DD/YYYY')
	}, {
		start: moment('01/01/2014', 'MM/DD/YYYY'),
		end: moment('01/01/2015', 'MM/DD/YYYY')
	}, {
		start: moment('01/01/2015', 'MM/DD/YYYY'),
		end: moment('01/01/2016', 'MM/DD/YYYY')
	}];

	var query = {
		/*timestamp: {
			$lt: today
		}*/
	};
	async.eachSeries(dates, function(date, callback) {

		if (!limitRange) {
			query = {
				/*upi: {
					$in: upis
				}*/
			};
		} else {
			query = {
				$and: [{
					timestamp: {
						$gte: date.start.unix()
					}
				}, {
					timestamp: {
						$lt: date.end.unix()
					}
				}]
			};
		}
		criteria = {
			collection: 'historydata',
			query: query,
			limit: 0
		};
		Utility.get(criteria, function(err, points) {
			// JS console.log(err, points.length);
			buildTimeRanges(points);
		});

		var buildTimeRanges = function(points) {
			var compare = function(a, b) {
				if (a.timestamp < b.timestamp)
					return -1;
				if (a.timestamp > b.timestamp)
					return 1;
				return 0;
			};

			var upsertRange = function(month, year, point) {
				var range = {
					month: month,
					year: year,
					points: []
				};
				for (var j = 0; j < ranges.length; j++) {
					if (ranges[j].year === year && ranges[j].month === month) {
						ranges[j].points.push(point);
						return;
					}
				}
				range.points.push(point);
				ranges.push(range);
			};

			var ranges = [];
			// var ptsSubset = [];

			points.sort(compare);

			// var start = moment().year(year).month(month).startOf('month').unix();
			// var end = moment().year(year).month(month).endOf('month').unix();

			for (var i = 0; i < points.length; i++) {
				// points[i].timestamp -= 60 * 60;
				var month = moment.unix(points[i].timestamp).format('MM');
				var year = moment.unix(points[i].timestamp).format('YYYY');

				upsertRange(month, year, points[i]);
				// ptsSubset.push(points[i]);
			}
			if (!limitRange) {
				addToSQLite(ranges, function(err) {
					callback(err || 'finishing early');
				});
			} else {
				addToSQLite(ranges, callback);
			}

		};
	}, function(err) {
		cb(err);
	});
};

var getValues = function(option, callback) {

	var findLatestPeak = function(peakRanges, cb) {
		var minutes = parseInt(moment().format('mm'), 10) % 30;
		var time = moment().subtract(minutes, 'minutes').seconds(0).unix();

		var compare = function(a, b) {
			if (a.timestamp < b.timestamp)
				return -1;
			if (a.timestamp > b.timestamp)
				return 1;

			return 0;
		};

		peakRanges.sort(compare);

		var latestPeriod = {
			end: 0,
			start: 0
		};

		for (var p = 0; p < peakRanges.length; p++) {
			var peakTime = peakRanges[p];
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

	var checkForLatest = function(cb) {
		var op = option.ops[0];
		var peakRanges = [];

		if (!!op.scale.match(/latest/)) {
			if (['on', 'off'].indexOf(op.peak) >= 0) {
				buildPeakPeriods(op, function(err, peakPeriods, holidays) {
					var minutes = parseInt(moment().format('mm'), 10) % 30;
					var end = moment().subtract(minutes, 'minutes').seconds(0);
					var start = moment(end).subtract(30, 'minutes');
					var ranges = [{
						start: start.unix(),
						end: end.unix()
					}];

					async.eachSeries(ranges, function(_range, rangeCB) {
						buildRanges(peakPeriods, holidays, op, _range, function(err, _peakRanges) {
							peakRanges = peakRanges.concat(_peakRanges);
							rangeCB();
						});
					}, function(err) {
						findLatestPeak(peakRanges, cb);
					});
				});
			} else {
				var minutes = parseInt(moment().format('mm'), 10) % 30;
				var end = moment().subtract(minutes, 'minutes').seconds(0);
				var start = moment(end).subtract(30, 'minutes');

				cb(null, {
					end: end.unix(),
					start: start.unix()
				});

			}
		} else {
			cb(null);
		}
	};

	checkForLatest(function(err, latestPeriod) {
		if (!!latestPeriod) {
			option.range = latestPeriod;
		}
		getTables(option, function(err, tables) {
			findInSql(option, tables, function(err, sResults) {
				if (err) {
					console.log('error', err);
					return callback(err);
				}
				// console.log('sql', sResults.length);
				// findInMongo(mdb, option, function(err, mResults) {
				// console.log('mongo', err, mResults.length);
				fixResults(sResults, [], function(err, results) {
					callback(err, results);
				});
				// });
			});
		});
	});
};

var getTables = function(option, callback) {
	var tables = [];
	var range = option.range;
	var addTable = function(table) {
		if (tables.indexOf(table) < 0) {
			tables.push(table);
		}
	};
	var getMonths = function(range, callback) {
		var months = [];
		var monthStart = moment.unix(range.start).startOf('month').unix();
		var monthEnd = moment.unix(monthStart).add(1, 'month').unix();

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

	var startString = "History_";

	getMonths(range, function(err, months) {
		for (var m = 0; m < months.length; m++) {
			var month = months[m];
			var start = moment.unix(month.start);
			var end = moment.unix(month.end).unix();
			var table = startString + start.format('YYYY') + start.format('MM');
			addTable(table);
		}
		callback(err, tables);
	});
};

var getMissingMetersPercentage = function(options, op, callback) {
	var missing = [];
	var upiGroups = options.upis;
	var scale = op.scale;
	var _options = _.cloneDeep(options);

	async.eachSeries(upiGroups, function(upis, cb) {
		_options.upis = upis;
		getTables(_options, function(err, tables) {
			countInSql(_options, tables, function(err, sqlCounts) {
				// countInMongo(_options, function(err, mongoCounts) {
				/*sqlCounts.push({
					count: mongoCounts
				});*/
				if (err) {
					console.log('error', err);
					return callback(err);
				}
				findMissing(sqlCounts, _options, function(err, result) {
					missing.push({
						upis: upis,
						missingPercentage: result
					});
					return cb();
				});
				// });
			});
		});
	}, function(err) {
		callback(err, missing);
	});
};

var buildPeakPeriods = function(option, callback) {
	var criteria = {
		collection: 'Utilities',
		query: {
			'utilityName': option.utilityName
		},
		fields: {
			'RateTables': 1,
			'PreviousRateTables': 1
		}
	};

	Utility.getOne(criteria, function(_err, util) {
		var holidays = {};
		var thisYear = moment().year();
		var fiscalYear = parseInt(option.fiscalYear, 10) || thisYear;
		var rateCollectionName = option.rateCollectionName;
		var type = option.type;
		var periods = [];
		var groups = {};

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

			for (var prop in groups) {
				if (groups[prop].hasOwnProperty('rates')) {

					var groupPeriods = groups[prop].periods;

					if (option.peak === 'off') {
						periods = groupPeriods;
					} else {
						for (var p = 0; p < groupPeriods.length; p++) {
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
};

var buildRanges = function(periods, holidays, op, _range, callback) {
	var start = parseInt(_range.start, 10);
	var end = parseInt(_range.end, 10);
	var peak = op.peak;
	var scale = op.scale;
	// var lineItem = options.lineItem;

	var ranges = [];
	var previousEnd;
	var offPeakMonth = false;

	var loopRanges = function(period, currentRangeStart, currentRangeEnd) {
		while (currentRangeStart.unix() < end) {
			addRange(period, currentRangeStart, currentRangeEnd);

			currentRangeStart.add(1, 'day');
			currentRangeEnd.add(1, 'day');
		}
	};

	var addRange = function(period, currentRangeStart, currentRangeEnd) {
		var range = {
			start: 0,
			end: 0
		};
		var isHoliday = false;

		var isWeekend = function(_start, _end) {
			return (period.days.length !== 0 && (period.days.indexOf(_start.format('ddd').toLowerCase()) < 0 || period.days.indexOf(_end.format('ddd').toLowerCase()) < 0));
		};

		for (var date in holidays) {
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
				var newRange = {
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

	for (var p = 0; p < periods.length; p++) {
		var period = periods[p];
		var periodStart = moment(period.start.date, 'M-D-YYYY').startOf('month').unix();
		var periodEnd = moment(period.end.date, 'M-D-YYYY').endOf('month').add(1, 'second').unix();

		var peakStart = null;
		var peakEnd = null;

		var currentRangeStart = moment.unix(start).startOf('day');
		var currentRangeEnd = moment.unix(start);

		if (start >= periodStart && end <= periodEnd) {
			peakStart = period.start.peak;
			peakEnd = period.end.peak;

			if (peakStart !== null && peakStart !== undefined) {
				var minutes = peakStart % 100;
				var hours = peakStart / 100;
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

	var findLowest = function(ranges) {
		var lowest = ranges[0];
		for (var i = 0; i < ranges.length; i++) {
			if (ranges[i].start < lowest.start) {
				lowest = ranges[i];
			}
		}

		return lowest;
	};

	var newRanges = [];

	var buildNewRanges = function(ranges) {
		var lowest = findLowest(ranges);
		for (var k = 0; k < ranges.length; k++) {
			if (lowest.start <= ranges[k].start && lowest.end >= ranges[k].start && lowest.end < ranges[k].end) {
				lowest.end = ranges[k].end;
			}
		}
		newRanges.push(lowest);
		for (var m = 0; m < ranges.length; m++) {
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
};

var getSums = function(operation, option, values, range, callback) {

	var ranges = operation.ranges;
	var scale = operation.scale;
	var sums;
	var compare = function(a, b) {
		if (a.start < b.start)
			return -1;
		if (a.start > b.start)
			return 1;
		return 0;
	};

	var getScaleSums = function(scaleRanges) {
		for (var s = 0; s < scaleRanges.length; s++) {
			var scaleRange = scaleRanges[s];
			var newResult = {
				sum: 0,
				range: {
					start: scaleRange.start,
					end: scaleRange.end
				}
			};
			for (var r = 0; r < ranges.length; r++) {
				var periodRange = ranges[r];
				for (var v = 0; v < values.length; v++) {
					var value = values[v];
					if (option.fx === 'weather') {
						if (value.timestamp >= scaleRange.start && value.timestamp < scaleRange.end && value.timestamp >= periodRange.start && value.timestamp < periodRange.end) {
							newResult.sum += value.Value;
							values.splice(v, 1);
							v--;
						}
					} else {
						if (value.timestamp > scaleRange.start && value.timestamp <= scaleRange.end && value.timestamp > periodRange.start && value.timestamp <= periodRange.end) {
							newResult.sum += value.value;
							values.splice(v, 1);
							v--;
						}
					}
				}
			}

			sums.push(newResult);
		}

	};

	ranges = ranges.sort(compare);

	if (!!operation.splitUpis && operation.splitUpis.toString() === 'true') {
		sums = {};
		var rangeCount = 0;
		for (var u = 0; u < option.upis.length; u++) {
			sums[option.upis[u]] = {
				sum: 0
			};
		}

		for (var m = 0; m < ranges.length; m++) {
			rangeCount += (ranges[m].end - ranges[m].start) / (30 * 60);
			for (var n = 0; n < values.length; n++) {
				if (values[n].timestamp > ranges[m].start && values[n].timestamp <= ranges[m].end) {
					sums[values[n].upi].sum += values[n].value;
				}
			}
		}
	} else {
		sums = [];
		if (scale !== 'half-hour') {
			getScaleSums(buildScaleRanges(range, scale));
		} else {
			sums = values;
		}
	}

	operation.results = {
		sums: sums
	};
	callback(null, sums);
};

var getMax = function(operation, values, range, callback) {
	var ranges = operation.ranges;
	var scale = operation.scale;
	var maxes = [];

	var compare = function(a, b) {
		if (a.start < b.start)
			return -1;
		if (a.start > b.start)
			return 1;
		return 0;
	};

	var getScaleMaxes = function(scaleRanges) {
		for (var s = 0; s < scaleRanges.length; s++) {
			var scaleRange = scaleRanges[s];
			var newResult = {
				max: undefined,
				timestamp: 0,
				range: {
					start: scaleRange.start,
					end: scaleRange.end
				}
			};
			for (var r = 0; r < ranges.length; r++) {
				var periodRange = ranges[r];
				periodRange.start = parseInt(periodRange.start, 10);
				periodRange.end = parseInt(periodRange.end, 10);

				for (var v = 0; v < values.length; v++) {
					var value = values[v];
					if (!!operation.timestamp) {
						if (value.timestamp === operation.timestamp) {
							newResult.max = value.value;
							newResult.timestamp = value.timestamp;
							break;
						}
					} else {
						if (value.timestamp > scaleRange.start && value.timestamp <= scaleRange.end && value.timestamp > periodRange.start && value.timestamp <= periodRange.end) {
							if (newResult.max === undefined || value.value > newResult.max) {
								newResult.max = value.value;
								newResult.timestamp = value.timestamp;
							}

							values.splice(v, 1);
							v--;
						}
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
		getScaleMaxes(buildScaleRanges(range, scale));
	}

	operation.results = {
		maxes: maxes
	};

	callback(null, operation.results);
};

var getDatastoreData = function(values, operation, option, callback) {
	// group by row (timestamp)
	// group of upis per row with value/missing flag
	var start = parseInt(option.range.start, 10);
	var end = parseInt(option.range.end, 10);
	var thirtyMinutes = 30 * 60;
	var rows = [];
	start += thirtyMinutes;

	while (start <= end) {
		var row = {
			timestamp: start,
			columns: []
		};
		for (var u = 0; u < option.upis.length; u++) {
			var upi = parseInt(option.upis[u], 10);
			var cell = {
				upi: upi,
				Value: 0,
				missingData: true,
				userEdited: false
			};

			for (var v = 0; v < values.length; v++) {
				var value = values[v];
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
};

var getMinAndMax = function(values, op, option, callback) {
	var minsAndMaxes = [];
	var periods;
	if (!!op.scale.match(/latest/)) {
		periods = [option.range];
	} else {
		periods = buildScaleRanges(option.range, op.scale);
	}

	for (var i = 0; i < periods.length; i++) {
		var min = 'start';
		var max = 'start';
		for (var r = 0; r < values.length; r++) {
			if (values[r].timestamp >= periods[i].start && values[r].timestamp <= periods[i].end) {
				min = (isNaN(min) || min > values[r].value) ? values[r].value : min;
				max = (isNaN(max) || max < values[r].value) ? values[r].value : max;
			}
		}
		minsAndMaxes.push({
			min: min,
			max: max,
			range: periods[i]
		});
	}

	op.results = {
		tempRanges: minsAndMaxes
	};

	callback(null);
};

var getMissingDatastore = function(operation, data, callback) {
	var previousRow = {};
	var lastRow = {};
	var missingRows = [];
	var missingData = [];

	for (var i = 0; i < data.length; i++) {
		var columns = data[i].columns;
		var badRow = false;

		for (var r = 0; r < columns.length; r++) {
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
};

var findInSql = function(options, tables, callback) {
	var upis = options.upis;
	var years = [];
	var results = [];

	var testFunctions = function() {
		return ['sum', 'max', 'reactiveCharge'].indexOf(options.ops[0].fx) >= 0 && (!options.ops[0].hasOwnProperty('splitUpis') || options.ops[0].splitUpis.toString() !== 'true');
	};

	for (var i = 0; i < tables.length; i++) {
		if (years.indexOf(tables[i].substring(8, 12)) < 0) {
			years.push(tables[i].substring(8, 12));
		}
	}

	async.eachSeries(years, function(year, cb) {
		var columns;
		if (testFunctions()) {
			columns = ['SUM(VALUE) as VALUE', 'TIMESTAMP', 'COUNT(UPI) as UPIS'];
		} else {
			columns = ['UPI', 'TIMESTAMP', 'VALUE', 'VALUETYPE', 'STATUSFLAGS', 'USEREDITED'];
		}

		var start = 'SELECT ' + columns.join(', ') + ' FROM';
		var WHERE = 'WHERE';
		var UNION = 'UNION';
		var statement = [];

		statement.push(start);

		for (var i = 0; i < tables.length; i++) {

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

				if (['weather', 'history match', 'latest history'].indexOf(options.ops[0].fx) >= 0) {
					statement.push('AND TIMESTAMP >=');
				} else {
					statement.push('AND TIMESTAMP >');
				}
				statement.push(options.range.start);
				statement.push('AND TIMESTAMP <=');
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
		}

		statement = statement.join(' ');
		// console.log('!!!statement', statement, year, _sdb);
		criteria = {
			year: parseInt(year, 10),
			statement: statement
		};
		ArchiveUtility.all(criteria, function(err, rows) {
			results = results.concat(rows);
			cb(err);
		});
	}, function(err) {
		return callback(err, results);
	});
};

var fixResults = function(sResults, mResults, callback) {
	// check for undefined results, throw error
	var m;
	var compare = function(a, b) {
		if (a.timestamp < b.timestamp)
			return -1;
		if (a.timestamp > b.timestamp)
			return 1;
		return 0;
	};
	if (!!sResults.length) {
		// JS logger.info("---- fixResults() --> sResults.length = " + sResults.length);
		// JS logger.info("---- fixResults() --> sResults = " + JSON.stringify(sResults));
		for (var a = 0; a < sResults.length; a++) {
			var sResult = sResults[a];
			if (!!sResult) {
				// JS logger.info("---- fixResults() --> sResults[" + a + "] = " + sResult);
				for (var prop in sResult) {
					var lc = prop.toLowerCase();
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
		for (var t = 0; t < mResults.length; t++) {
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
};

var countInSql = function(options, tables, callback) {
	var upis = options.upis;
	var results = [];
	var years = [];
	for (var i = 0; i < tables.length; i++) {
		if (years.indexOf(tables[i].substring(8, 12)) < 0) {
			years.push(tables[i].substring(8, 12));
		}
	}

	async.eachSeries(years, function(year, cb) {
		var WHERE = 'WHERE';
		var UNION = 'UNION';
		var statement = [];

		var buildStart = function(tableName) {
			return 'Select count(*) as count, "' + tableName + '" as TableName FROM';
		};

		for (var i = 0; i < tables.length; i++) {
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
		// console.log('???count', statement);
		criteria = {
			year: parseInt(year, 10),
			statement: statement
		};
		ArchiveUtility.all(criteria, function(err, rows) {
			results = results.concat(rows);
			cb(err);
		});
	}, function(err) {
		return callback(err, results);
	});
};

var findMissing = function(counts, options, callback) {
	var count = 0;
	var start = options.range.start;
	var end = options.range.end;

	for (var i = 0; i < counts.length; i++) {
		count += counts[i].count;
	}
	var initCount = count;
	var ranges = (end - start) / (30 * 60);
	var maxCount = options.upis.length * ranges;
	count = maxCount - count;
	var percentage = (count / maxCount) * 100;
	callback(null, percentage);
};

var updateDashboards = function(results, callback) {
	/*var socket = require('../socket/socket.js');
	for (var r = 0; r < results.length; r++) {
		if ((results[r].fx === 'sum' || results[r].fx === 'max') && !!results[r].socketid) {
			socket.addDashboardDynamics(results[r]);
		}
	}*/
	callback();
};

var buildScaleRanges = function(range, scale) {
	var scaleRanges = [];
	var scaleStart;
	var scaleEnd;

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
};

var getUsage = function(options, callback) {
	async.eachSeries(options, function(option, optionsCB) {

		var firstOp = option.ops[0];
		if (firstOp.fx === 'missingPercentage') {
			getMissingMetersPercentage(option, firstOp, function(err, result) {
				if (!err) {
					firstOp.results = {
						missingPercentage: result
					};
				}
				optionsCB(err);
			});
		} else {

			option.upis = option.upis.filter(function(upi) {
				return !isNaN(parseInt(upi, 10));
			});
			option.upis = option.upis.map(function(upi) {
				return parseInt(upi, 10);
			});

			if (!!option.upis.length) {
				getValues(option, function(err, values) {
					var ops = option.ops;
					async.eachSeries(ops, function(op, operationsCB) {
						async.waterfall([function(waterfallCB) {
							if (['on', 'off'].indexOf(op.peak) >= 0 && !op.scale.match(/latest/)) {
								var tempRanges = [];
								var rangeStart = moment.unix(option.range.start);
								var rangeEnd = moment.unix(option.range.end);

								if (rangeEnd.diff(rangeStart, 'months') > 1) {
									var _start = parseInt(option.range.start, 10);
									var _end = parseInt(option.range.end, 10);
									var tempEnd = moment.unix(_start).add(1, 'month').unix();
									while (tempEnd <= _end) {
										var tempRange = {
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

								var periodRanges = [];
								async.eachSeries(op.ranges, function(range, rangesCB) {
									buildPeakPeriods(op, function(err, periods, holidays) {
										buildRanges(periods, holidays, op, range, function(err, peakPeriods) {
											periodRanges = periodRanges.concat(peakPeriods);
											rangesCB(err);
										});
									});
								}, function(err) {
									op.ranges = periodRanges;
									waterfallCB(null);
								});

							} else {
								op.ranges = [option.range];
								waterfallCB(null);
							}
						}, function(waterfallCB) {
							// todo this was causing a problem and once fixed, can reuse buildops to combine like ops
							// var _values = _.cloneDeep(values);
							// var values = values;


							if (['sum', 'weather'].indexOf(op.fx) >= 0) {
								getSums(op, option, values, option.range, waterfallCB);
							} else if (op.fx === 'max') {
								getMax(op, values, option.range, waterfallCB);
							} else if (op.fx === 'datastore') {
								getDatastoreData(values, op, option, waterfallCB);
							} else if (op.fx === 'reactiveCharge') {
								getMax(op, values, option.range, function(err, demand) {
									op.results = [];
									async.eachSeries(demand.maxes, function(demandMax, demandCB) {

										var optionClone = _.cloneDeep(option);
										var operationClone = _.cloneDeep(op);
										optionClone.upis = optionClone.secondUpis;
										optionClone.range = demandMax.range;
										operationClone.fx = 'max';
										operationClone.timestamp = demandMax.timestamp;
										optionClone.ops = [operationClone];

										getUsage([optionClone], function(err, reactive) {
											op.results.push({
												demand: demandMax,
												reactive: reactive[0].ops[0].results.maxes[0]
											});
											demandCB(err);
										});
									}, function(err) {
										waterfallCB(err);
									});
								});
							} else if (op.fx === 'tempRange') {
								getMinAndMax(values, op, option, waterfallCB);
							} else if (op.fx === 'missingData') {
								getDatastoreData(values, op, option, function(err, data) {
									getMissingDatastore(op, data, waterfallCB);
								});
							}
						}], function(err, result) {
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
	}, function(err) {
		callback(err, options);
	});
};

var addToSQLite = function(ranges, cb) {
	var criteria = {};
	var doMonth = function(range, cb2) {
		ArchiveUtility.serialize(function() {
			criteria = {
				year: range.year,
				statement: 'PRAGMA synchronous = OFF'
			};
			ArchiveUtility.exec(criteria, function() {
				var tableName = 'History_' + range.year.toString() + range.month.toString();

				criteria = {
					year: range.year,
					statement: 'BEGIN TRANSACTION'
				};
				ArchiveUtility.run(criteria, function() {
					var batchSize = 100;
					var count = 0;
					var parameterPlaceholder = '?,?,?,?,?,?';
					var additionalParameter = ',(' + parameterPlaceholder + ')';
					var params = [];

					var startInsert = new Date();
					var processPoint = function(_cb) {
						var statement = 'INSERT INTO ' + tableName + ' (UPI, TIMESTAMP, VALUE, VALUETYPE, STATUSFLAGS, USEREDITED) VALUES  (' + parameterPlaceholder + ')' + additionalParameter.repeat(params.length / 6 - 1);

						criteria = {
							year: range.year,
							statement: statement
						};
						ArchiveUtility.prepare(criteria, function(stmt) {

							criteria = {
								year: range.year,
								statement: stmt,
								parameters: params
							};
							ArchiveUtility.runStatement(criteria, function() {
								ArchiveUtility.finalizeStatement(criteria, function() {
									params = [];
									return _cb();
								});
							});
						});
					};

					async.eachSeries(range.points, function(point, callback) {

						var userEdited = (point.hasOwnProperty('userEdited')) ? point.userEdited : false;

						params.push(point.upi, point.timestamp, point.Value, point.ValueType, point.statusflags, userEdited);
						if (++count % batchSize === 0) {
							processPoint(function() {
								callback();
							});
						} else {
							callback();
						}
					}, function(err) {
						if (!!params.length) {
							processPoint(function() {
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


	async.eachSeries(ranges, function(range, callback) {
		doMonth(range, callback);
	}, function(err) {
		removeFromHistorydata(mdb, ranges, cb);
	});
};

var removeFromHistorydata = function(mdb, ranges, cb) {
	// no longer removing data by mongo.remove()
	// keeping function in case mongo.drop and ensureIndex needs to be added later
	cb();
};

module.exports = historyModel = {
	getMeters: function(data, cb) {
		var upis = data.upis;

		if (!(upis instanceof Array)) {
			upis = JSON.parse(upis);
		}
		upis = upis.map(function(upi) {
			return parseInt(upi, 10);
		});

		var criteria = {
			query: {
				_id: {
					$in: upis
				}
			},
			fields: {
				Name: 1
			},
			collection: 'points'
		};

		Utility.get(criteria, cb);
	},
	getUsage: function(data, cb) {
		var callback = function(err, results) {
			results = unbuildOps(results);

			updateDashboards(results, function(_err) {
				if (!!err || !!_err) {
					return cb(err || _err);
				} else {
					return cb(null, results);
				}
			});
		};

		var reqOptions = data.options;

		reqOptions.forEach(function(options) {
			if (typeof options.ranges === 'string') {
				options.ranges = JSON.parse(options.ranges);
			}
			if (!(options.upis instanceof Array)) {
				options.upis = JSON.parse(options.upis);
			}
			return;
		});
		reqOptions = buildOps(reqOptions);
		getUsage(reqOptions, callback);
	},
	getMissingMeters: function(data, cb) {
		var options = data.options;
		var meters = options.meters;
		var missingMeters = [];
		var start = options.start;
		var end = options.end;

		var endOfPeriod = (end > moment().unix()) ? moment().unix() : end;

		async.each(meters, function(meter, callback) {
			meter.upis = meter.upis.map(function(upi) {
				return parseInt(upi, 10);
			});

			var table = 'History_' + moment.unix(start).format('YYYY') + moment.unix(start).format('MM');
			var neededCount = Math.ceil((endOfPeriod - start) / (30 * 60)) * meter.upis.length;
			var statement = 'SELECT COUNT(*) AS COUNT FROM ' + table + ' WHERE UPI IN (' + meter.upis.toString() + ') AND TIMESTAMP >' + start + ' AND TIMESTAMP <= ' + end;

			criteria = {
				year: moment.unix(start).year(),
				statement: statement
			};
			ArchiveUtility.get(criteria, function(err, row) {
				table = 'History_' + moment.unix(end).format('YYYY') + moment.unix(end).format('MM');
				statement = 'SELECT COUNT(*) AS COUNT FROM ' + table + ' WHERE UPI IN (' + meter.upis.toString() + ') AND TIMESTAMP >' + start + ' AND TIMESTAMP <= ' + end;

				criteria = {
					year: moment.unix(end).year(),
					statement: statement
				};
				ArchiveUtility.get(criteria, function(err, row2) {
					if ((row.COUNT + row2.COUNT) < neededCount) {
						missingMeters.push(meter);
						return callback(err);
					} else {
						statement = 'SELECT COUNT(*) AS COUNT FROM ' + table + ' WHERE UPI IN (' + meter.upis.toString() + ') AND USEREDITED=1 AND TIMESTAMP >' + start + ' AND TIMESTAMP <= ' + end;

						criteria = {
							year: moment.unix(end).year(),
							statement: statement
						};
						ArchiveUtility.get(criteria, function(err, _row2) {
							table = 'History_' + moment.unix(start).format('YYYY') + moment.unix(start).format('MM');
							statement = 'SELECT COUNT(*) AS COUNT FROM ' + table + ' WHERE UPI IN (' + meter.upis.toString() + ') AND USEREDITED=1 AND TIMESTAMP >' + start + ' AND TIMESTAMP <= ' + end;

							criteria = {
								year: moment.unix(start).year(),
								statement: statement
							};
							ArchiveUtility.get(criteria, function(err, _row) {
								if ((_row2.COUNT + _row.COUNT) > 0) {
									missingMeters.push(meter);
									return callback(err);
								} else {
									return callback(err);
								}
							});
						});
					}
				});
			});
		}, function(err) {
			cb(err, missingMeters);
		});
	},
	editDatastore: function(data, cb) {
		var values = data.values;

		if (!!values) {
			editHistoryData(values, 3, cb);
		} else {
			cb();
		}
	},
	importCSV: function(data, cb) {
		var options = data.options;
		var titles;
		var blanks;
		var ranges = [];
		var upiMap = options.upiMap;
		var path = options.path;
		var methods = options.methods;
		var upis = [];
		var pass = 0;


		fs.createReadStream(path)
			.pipe(csv())
			.on('data', function(data) {
				if (!(pass & 1)) {
					for (var i = 1; i < data.length; i++) {
						var upi = parseInt(data[i], 10);
						if (!isNaN(data[i])) {
							upis.push(upi);
						}
					}
					pass = pass | 1;
				} else if (!(pass & 2)) {
					pass = pass | 2;
				} else if (!(pass & 4)) {
					pass = pass | 4;
				} else if (!!upis.length) {
					for (var d = 1; d < data.length; d++) {
						if (!!data[d]) {
							var range = {
								timestamp: moment(data[0], dateFormat).unix(),
								upi: upis[d - 1],
								Value: parseFloat(data[d])
							};
							ranges.push(range);
						} else {}
					}

				}
			}).on('end', function() {
				editHistoryData(ranges, methods, function(err, result) {
					fs.unlinkSync(path);
					cb(err, result);
				});
			});
	},
	exportCSV: function(data, cb) {
		var options = data.options;
		var start = parseInt(options.range.start, 10);
		var end = parseInt(options.range.end, 10);

		var startDate = moment.unix(start).startOf('day').add(30, 'minutes');
		var workingDate = moment.unix(start);
		var endDate = moment.unix(end).startOf('day');

		var titles = [];
		var upis = [];

		var rows = [];

		titles.push(options.meterName);
		titles.push(options.upiMap[0].meterPointDesc);
		titles.push(options.upiMap[1].meterPointDesc);
		titles.push(options.upiMap[2].meterPointDesc);

		upis.push('');
		upis.push(options.upiMap[0].upi);
		upis.push(options.upiMap[1].upi);
		upis.push(options.upiMap[2].upi);

		var workingTime = moment(startDate);
		while (workingTime.unix() <= endDate.unix()) {
			rows.push([workingTime.format(dateFormat), '', '', '']);
			workingTime.add(30, 'minutes');
		}

		fillInData(options, rows, function(err, rows) {
			if (err) {
				return cb(err);
			}
			var csvStream = csv.createWriteStream();
			tmp.file({
				dir: __dirname + "/../tmp/",
				postfix: '.csv',
				prefix: startDate.format('YYYYMM-') + options.meterName + '-'
			}, function(err, path, fd, _cleanupCallback) {
				console.log(err, path);
				var writableStream = fs.createWriteStream(path);

				writableStream.on('finish', function(err, data) {
					cb(err, path);
				});

				csvStream.pipe(writableStream);

				csvStream.write(upis);
				csvStream.write(titles);
				csvStream.write(['Date Time', '(MVAR)', '(MW)', '(MWh)']);
				for (var r = 0; r < rows.length; r++) {
					csvStream.write(rows[r]);
				}
				csvStream.end();
			});

		});
	},
	uploadCSV: function(files, cb) {
		var path = __dirname + '\\..\\tmp\\uploads\\' + Date.now() + '.csv';
		if (!!files.csv.originalname.match(/\.csv/i)) {
			fs.writeFile(path, files.csv.buffer, function(err) {
				if (err) {
					return cb({
						err: err
					});
				} else {
					return cb(null, path);
				}

			});
		} else {
			return cb({
				err: true,
				message: 'The uploaded file is not in the correct format. Only CSV files are supported.'
			});
		}
	},
	findHistory: function(options, callback) {
		// find history based on upis and exact timestamps
		options.ops = [{
			fx: (!!options.fx) ? options.fx : 'history match'
		}];
		// JS console.log('%%%%%%%%%%%', JSON.stringify(options));
		getTables(options, function(err, tables) {
			findInSql(options, tables, function(err, sResults) {
				// JS console.log('***********', err, sResults);
				fixResults(sResults || [], [], function(err, results) {
					callback(err, results);
				});
			});
		});
	},
	findLatest: function(options, callback) {
		// find most recent value based on upi and ts, build all months into one statement per year
		var range = options.range;

		options.ops = [{
			fx: 'latest history'
		}];
		range.start = moment.unix(range.end).startOf('year').unix();

		getTables(options, function(err, tables) {
			findInSql(options, tables, function(err, sResults) {
				// console.log(err);
				fixResults(sResults || [], [], function(err, results) {
					if (!results.length && moment.unix(range.start).year() > 2000) {
						range.end = range.start - 1;
						historyModel.findLatest(options, callback);
					} else {
						// console.log(options.upis, moment.unix(range.end).format(), moment.unix(results[0].timestamp).format());
						return callback(err, results);
					}
				});
			});
		});
	},
	doBackUp: runBackUp,
	buildOps: buildOps,
	unbuildOps: unbuildOps,
	getUsageCall: getUsage
};