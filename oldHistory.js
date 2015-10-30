var Utils = require('../lib/utils.js');
var mongo = require('mongodb');
var csv = require('fast-csv');
var gm = require('gm');
var moment = require('moment');
var sqlite3 = require('sqlite3').verbose();
var _ = require('lodash');
var fs = require('fs');
var tmp = require('tmp');
var rimraf = require('rimraf');
var sdb = {}; // make object
var mdb = null;

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

var async = require('async');

var BSON = mongo.BSONPure;
var historyCollection = Utils.CONSTANTS("historyCollection");
var dateFormat = 'ddd, MMM DD, YYYY HH:mm:ss';

String.prototype.repeat = function(num) {
	return new Array(num + 1).join(this);
};

var exports = module.exports = {


	'getUsage': [
		function(req, res, next) {
			mdb = req.database;

			var callback = function(err, results) {
				results = unbuildOps(results);
				updateDashboards(results, function(err) {
					if (err) {
						return Utils.sendResponse(res, {
							err: err
						});
					} else {
						return Utils.sendResponse(res, results);
					}
				});
			};

			var reqOptions = req.body.options;

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

		}
	],

};

/*var getMissing = function(options, callback) {
	var _results = [];
	var upiGroups = options.upis;

	async.forEachSeries(upiGroups, function(upiGroup, cb) {
		var _options = _.cloneDeep(options);
		_options.upis = upiGroup;

		getUsage(_options, function(err, results) {
			_results.push(results);
			cb(err);
		});
	}, function(err) {
		return callback(err, _results);
	});

};*/

/*var buildPeriods = function(options, callback) {
	var ranges = options.ranges;
	var scale = options.scale;
	var peak = options.peak;
	var chunks = [];
	var chunkStart;
	var chunkEnd;
	var lastScaleEnd;
	var lastScaleStart;
	var earliestTime = 0;

	var addChunks = function(start, end) {
		chunks.push({
			start: start,
			end: end
		});
	};

	var getEndPeak = function(start, nextTime) {
		if (start >= nextTime) {
			return nextTime;
		} else {
			return start;
		}
	};

	var periodForLatestHalf = function(lSS, lSE) {

		if (!lSS) {
			timeFromHalf = parseInt(moment().format('mm'), 10) % 30;
			lastScaleStart = moment().subtract(timeFromHalf + 30, 'minutes').seconds(0).unix();
		}
		if (!lSE) {
			lastScaleEnd = moment.unix(lastScaleStart).add(30, 'minutes').unix();
		}

		for (var i = 0; i < ranges.length; i++) {

			if (lastScaleEnd <= ranges[i].end && lastScaleStart >= ranges[i].start) {
				addChunks(lastScaleStart, lastScaleEnd);
				return;
			}
		}

		lastScaleEnd = moment.unix(lastScaleStart).unix();
		lastScaleStart = moment.unix(lastScaleEnd).subtract(30, 'minutes').unix();

		if (ranges[0].start < lastScaleStart) {
			periodForLatestHalf(lastScaleStart, lastScaleEnd);
		}
	};

	var periodForLatest = function(_scale, lSS, lSE) {
		var periodScale = _scale.split(' ');
		periodScale = periodScale[periodScale.length - 1];

		if (!lSS) {
			lastScaleStart = moment().subtract(1, periodScale).startOf(periodScale).unix();
		}
		if (!lSE) {
			lastScaleEnd = moment.unix(lastScaleStart).add(1, periodScale).unix();
		}

		for (var i = 0; i < ranges.length; i++) {
			if (lastScaleEnd <= ranges[i].end && lastScaleStart >= ranges[i].start) {
				addChunks(lastScaleStart, lastScaleEnd);
				// return;
			} else if (ranges[i].start >= lastScaleStart && ranges[i].end <= lastScaleEnd) {
				addChunks(ranges[i].start, ranges[i].end);
				// return;
			} else if (ranges[i].start <= lastScaleStart && ranges[i].end >= lastScaleStart && ranges[i].end <= lastScaleEnd) {
				addChunks(lastScaleStart, ranges[i].end);
				// return;
			} else if (ranges[i].start >= lastScaleStart && ranges[i].start <= lastScaleEnd && ranges[i].end >= lastScaleEnd) {
				addChunks(ranges[i].end, lastScaleEnd);
				// return;
			}
		}

		lastScaleEnd = moment.unix(lastScaleStart).unix();
		lastScaleStart = moment.unix(lastScaleEnd).subtract(1, periodScale).unix();

		if (ranges[0].start < lastScaleStart) {
			periodForLatest(_scale, lastScaleStart, lastScaleEnd);
		}
	};

	async.forEachSeries(ranges, function(range, cb) {
		range.start = parseInt(range.start, 10);
		range.end = parseInt(range.end, 10);
		if (scale === 'half-hour') {
			endWindow = 0;
			startHalf = parseInt(moment.unix(range.start).format('mm'), 10) % 30;

			if (startHalf !== 0) {
				range.start = moment.unix(range.start).subtract(startHalf, 'minutes').second(0).unix();
			}
			endWindow = moment.unix(range.start).add(30, 'minutes').unix();

			while (endWindow < range.end) {
				endWindow = moment.unix(endWindow).add(30, 'minutes').unix();
			}
			range.end = endWindow;

			chunkStart = moment.unix(range.start).add(30, 'minutes').unix();
			chunkEnd = moment.unix(chunkStart).add(30, 'minutes').unix();
			addChunks(chunkStart, chunkEnd);
			while (chunkEnd <= range.end) {
				chunkStart = moment.unix(chunkEnd).unix();
				chunkEnd = moment.unix(chunkStart).add(30, 'minutes').unix();
				addChunks(chunkStart, chunkEnd);
			}
		} else if (['on', 'off'].indexOf(peak) > -1) {
			var scaleEnd;
			if (['day', 'month', 'week', 'year'].indexOf(scale) > -1) {
				chunkStart = moment.unix(range.start).add(30, 'minutes').unix();
				scaleEnd = moment.unix(chunkStart).add(1, scale).startOf(scale).unix();
				if (scaleEnd < range.end) {
					chunkEnd = scaleEnd;
					// addChunks(chunkStart, chunkEnd);
					while (chunkEnd <= range.end) {
						chunkStart = moment.unix(chunkEnd).unix();
						scaleEnd = moment.unix(chunkStart).add(1, scale).unix();

						if (scaleEnd <= range.end) {
							chunkEnd = scaleEnd;
							addChunks(chunkStart, chunkEnd);
						} else {
							chunkEnd = range.end;
							addChunks(chunkStart, chunkEnd);
							break;
						}
					}
				} else {
					chunkEnd = range.end;
					addChunks(chunkStart, chunkEnd);
				}
			} else if (scale === 'latest half') {
				periodForLatestHalf();
				return cb('break');
			} else if (scale === 'latest day') {
				periodForLatest(scale);
				return cb('break');
			} else if (scale === 'latest month') {
				periodForLatest(scale);
				return cb('break');
			}

		} else {
			// Make sure start and end times are logically correct
			if (['day', 'month', 'week', 'year'].indexOf(scale) > -1) {
				// range.end = moment.unix(range.end).unix();
				// range.start = moment.unix(range.start).startOf(scale).unix();
			} else if (scale === 'latest half') {
				timeFromHalf = parseInt(moment().format('mm'), 10) % 30;
				lastHalf = moment().subtract(timeFromHalf, 'minutes').second(0);
				range.start = lastHalf.unix();
				range.end = lastHalf.unix();
			} else if (scale === 'latest day') {
				lastDay = moment().startOf('day');
				range.end = lastDay.unix();
				range.start = lastDay.subtract(1, 'day').add(30, 'minutes').unix();
			} else if (scale === 'latest month') {
				lastMonth = moment().startOf('month');
				range.end = lastMonth.unix();
				range.start = lastMonth.subtract(1, 'month').add(30, 'minutes').unix();
			}

			if (['day', 'month', 'week', 'year'].indexOf(scale) > -1) {
				chunkStart = moment.unix(range.start).add(30, 'minutes').unix();
				chunkEnd = moment.unix(range.start).add(1, scale).unix();
				addChunks(chunkStart, chunkEnd);
				while (chunkEnd < range.end) {
					chunkStart = moment.unix(chunkEnd).add(30, 'minutes').unix();
					chunkEnd = moment.unix(chunkStart).add(1, scale).startOf(scale).unix();
					addChunks(chunkStart, chunkEnd);
				}
			} else if (['latest half', 'latest day', 'latest month'].indexOf(scale) > -1) {
				addChunks(range.start, range.end);
			}
		}
		return cb();
	}, function(err) {
		return callback(null, chunks);
	});
};*/


var findInMongo = function(mdb, options, callback) {
	var range = options.range;
	var upis = options.upis;
	var testFunctions = function() {
		return ['sum', 'max', 'reactiveCharge'].indexOf(options.ops[0].fx) >= 0 && (!options.ops[0].hasOwnProperty('splitUpis') || options.ops[0].splitUpis.toString() !== 'true');
	};

	if (testFunctions()) {
		var group = {
			keys: [
				'timestamp'
			],
			cond: {
				upi: {
					$in: upis
				},
				timestamp: {
					$lte: parseInt(range.end, 10),
					$gt: parseInt(range.start, 10)
				}
			},
			reduce: function(curr, result) {
				result.Value += curr.Value;
			},
			initial: {
				'Value': 0
			}
		};
		// console.log('???query', group);
		mdb.collection('historydata').group(group.keys, group.cond, group.initial, group.reduce, function(err, mPoints) {
			callback(err, mPoints);
		});
	} else {
		var query = {
			upi: {
				$in: upis
			},
			timestamp: {
				$lte: range.end,
				$gt: range.start
			}
		};
		mdb.collection('historydata').find(query).toArray(function(err, mPoints) {
			callback(err, mPoints);
		});
	}



};


var countInMongo = function(options, callback) {
	var upis = options.upis;
	var results = [];

	var query = {
		$and: [{
			timestamp: {
				$gt: options.range.start
			}
		}, {
			timestamp: {
				$lte: options.range.end
			}
		}],
		upi: {
			$in: upis
		}
	};

	mdb.collection('historydata').count(query, callback);
};



exports.doBackUp = runBackUp;
exports.addToSQLite = addToSQLite;
exports.removeFromHistorydata = removeFromHistorydata;
exports.getUsageCall = getUsage;
exports.getMissing = getMissing;
exports.editHistoryData = editHistoryData;
exports.addData = addData;
exports.buildOps = buildOps;
exports.unbuildOps = unbuildOps;
exports.getMissingMetersCall = getMissingMeters;
exports.getSdb = getSdb;

exports.setupDB = function(_mdb, file) {
	mdb = _mdb;

	if (!!file) {
		// sdb = new sqlite3.Database(file);
	}
};