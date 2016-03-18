var moment = require('moment');

var Utility = require('../models/utility');
var History = require('../models/history');
var logger = require('../helpers/logger')(module);

module.exports = {

    viewTrend: function(data, cb) {
        var startTime = (!!data.startTime) ? parseInt(data.startTime, 10) : Math.floor(Date.now() / 1000);
        var page = (!!data.page) ? parseInt(data.page, 10) : 1;
        var limit = (!!data.limit) ? parseInt(data.limit, 10) : 200;
        var upi = parseInt(data.upi, 10);
        var query = {};
        var sort = -1;
        var skip = 0;

        if (!upi) {
            return cb('No point provided');
        }

        query.upi = upi;

        if (page >= 0) {
            query.timestamp = {
                $lte: startTime
            };
        } else {
            query.timestamp = {
                $gte: startTime
            };
            sort = 1;
        }
        page = Math.abs(page);
        skip = (page * limit) - limit;

        var criteria = {
            query: query,
            collection: 'historydata',
            limit: limit,
            sort: {
                timestamp: sort
            },
            skip: skip
        };
        var compareTS = function(a, b) {
            if (a.timestamp < b.timestamp)
                return -1 * sort;
            if (a.timestamp > b.timestamp)
                return 1 * sort;
            return 0;
            /*if (sort === 1) {
                return a.timestamp > b.timestamp;
            } else {
                return b.timestamp > a.timestamp;
            }*/
        };

        var limitSql = function(options, callback) {
            console.log(page, moment.unix(options.startTime).format());
            // options.results.sort(compareTS);
            // console.log('start results', options.results.length);
            var range = {};

            if (page >= 0) {
                range.end = options.startTime;
                range.start = moment.unix(options.startTime).startOf('month').unix();
            } else {
                range.start = options.startTime;
                range.end = moment.unix(options.startTime).endOf('month').unix();
            }
            // console.log('range', range);
            History.findHistory({
                upis: [upi],
                range: range,
                fx: 'history'
            }, function(err, sqlResults) {
                var results = sqlResults.concat(options.results);
                // console.log('after concat', sqlResults.length, options.results.length, results.length);
                // console.log('r1', moment.unix(results[0].timestamp).format(), moment.unix(results[1].timestamp).format(), moment.unix(results[results.length - 2].timestamp).format(), moment.unix(results[results.length - 1].timestamp).format());
                results.sort(compareTS);
                // console.log('r2', moment.unix(results[0].timestamp).format(), moment.unix(results[1].timestamp).format(), moment.unix(results[results.length - 2].timestamp).format(), moment.unix(results[results.length - 1].timestamp).format());
                console.log(results[results.length - 1].timestamp < range.start, results[results.length - 1].timestamp, range.start);
                if (results.length < limit || (!!results.length && results[results.length - 1].timestamp < range.start)) {
                    limitSql({
                        results: results,
                        startTime: (page >= 0) ? range.start - 1 : range.end + 1
                    }, callback);
                } else {
                    callback(err, results);
                }
            });
        };
        var fixResults = function(results) {
            // console.log('results.length', results.length);
            var skipped = 0;
            results.sort(compareTS);
            results.forEach(function(result) {

                // console.log(result.timestamp, moment.unix(result.timestamp).format());
            })
            if (!!results.length) {
                if (skip > 0) {
                    while (skipped < skip && !!results.length) {
                        results.shift();
                        skipped++;
                    }
                }
                // console.log('skipped', skipped);
                // console.log('r1', results[0], results[1], results[results.length - 2], results[results.length - 1]);
                if (limit < results.length) {
                    results.splice(limit, results.length - limit);
                }
                // console.log('r2', results[0], results[1], results[results.length - 2], results[results.length - 1]);
                // console.log('length', results.length);
            }
            return results;
        };

        Utility.get(criteria, function(err, mongoResults) {
            limitSql({
                results: mongoResults,
                startTime: startTime
            }, function(err, results) {
                fixResults(results);
                cb(err, results);
            });
        });
    },

    getTrendLimits: function(data, cb) {
        var upi = parseInt(data.upi, 10);

        var query = [{
            $match: {
                upi: upi
            }
        }, {
            $group: {
                _id: "$upi",
                max: {
                    $max: "$timestamp"
                },
                min: {
                    $min: "$timestamp"
                }
            }
        }, {
            $project: {
                _id: 0,
                max: "$max",
                min: "$min"
            }
        }];

        if (!upi) {
            return cb('No point provided');
        }

        var criteria = {
            collection: 'historydata',
            query: query
        };

        Utility.aggregate(criteria, function(err, mongoResults) {
            mongoResults = mongoResults[0];
            History.findEarliestAndLatest({
                upis: [upi],
                range: {
                    start: moment(2000, 'YYYY').unix()
                }
            }, function(err, sqlResults) {
                mongoResults.max = (mongoResults.max > sqlResults.max) ? mongoResults.max : sqlResults.max;
                mongoResults.min = (mongoResults.min < sqlResults.min) ? mongoResults.min : sqlResults.min;
                cb(err, mongoResults);
            });
        });
    }
};