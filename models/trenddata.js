var moment = require('moment');

var Utility = require('../models/utility');
var History = require('../models/history');
var logger = require('../helpers/logger')(module);

module.exports = {

    viewTrendOld: function(data, cb) {
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
        var pageAbs = Math.abs(page);
        skip = (pageAbs * limit) - limit;

        var criteria = {
            query: query,
            collection: 'historydata',
            limit: limit,
            sort: {
                timestamp: sort
            }
            /*,
                        skip: skip*/
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

        var limitMongo = function(criteria, callback) {

        };

        var limitSql = function(options, callback) {
            // options.results.sort(compareTS);
            var range = {};

            if (page >= 0) {
                range.end = options.startTime;
                range.start = moment.unix(options.startTime).startOf('month').unix();
            } else {
                range.start = options.startTime;
                range.end = moment.unix(options.startTime).endOf('month').unix();
            }
            History.findHistory({
                upis: [upi],
                range: range,
                fx: 'history'
            }, function(err, sqlResults) {
                var results = sqlResults.concat(options.results);
                results.sort(compareTS);
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
            var skipped = 0;
            results.sort(compareTS);
            results.forEach(function(result) {

            })
            if (!!results.length) {
                if (skip > 0) {
                    while (skipped < skip && !!results.length) {
                        results.shift();
                        skipped++;
                    }
                }
                if (limit < results.length) {
                    results.splice(limit, results.length - limit);
                }
            }
            return results;
        };

        limitMongo(criteria, function(err, mongoResults) {
            limitSql({
                results: mongoResults,
                startTime: startTime
            }, function(err, results) {
                fixResults(results);
                cb(err, results);
            });
        });
    },
    viewTrend: function(data, cb) {
        var startTime = (!!data.startTime) ? parseInt(data.startTime, 10) : Math.floor(Date.now() / 1000);
        var limit = (!!data.limit) ? parseInt(data.limit, 10) : 200;
        var direction = (!!data.direction) ? parseInt(data.direction, 10) : 1;
        var upi = parseInt(data.upi, 10);
        var query = {};
        var range = {};

        if (!upi) {
            return cb('No point provided');
        }

        query.upi = upi;

        if (direction > 0) {
            query.timestamp = {
                $lte: startTime
            };
            range = {
                start: moment.unix(startTime).startOf('month').unix(),
                end: startTime
            };
        } else {
            query.timestamp = {
                $gte: startTime
            };
            range = {
                start: startTime,
                end: moment.unix(startTime).endOf('month').unix()
            };
        }
        var criteria = {
            query: query,
            collection: 'historydata',
            limit: limit,
            sort: {
                timestamp: direction * -1
            }
        };
        var compareTS = function(a, b) {
            if (a.timestamp < b.timestamp)
                return 1;
            if (a.timestamp > b.timestamp)
                return -1;
            return 0;
        };

        var limitSql = function(options, callback) {
            History.findHistory({
                upis: [upi],
                range: range,
                fx: 'history'
            }, function(err, sqlResults) {
                options.results = sqlResults.concat(options.results);
                if (options.results.length < limit && range.start > options.stopAt) {
                    if (direction > 0) {
                        range.end = range.start - 1;
                        range.start = moment.unix(range.end).startOf('month').unix();
                    } else {
                        range.start = range.end + 1;
                        range.end = moment.unix(range.start).endOf('month').unix();
                    }
                    limitSql(options, callback);
                } else {
                    callback(err, options.results);
                }
            });
        };
        var fixResults = function(results) {
            var skipped = 0;
            results.sort(compareTS);
            if (!!results.length) {
                if (limit < results.length) {
                    results.splice(limit, results.length - limit);
                }
            }
            return results;
        };

        Utility.get(criteria, function(err, mongoResults) {
            var stopAt = 0;
            mongoResults.sort(compareTS);
            if (direction > 1) {
                stopAt = (!!mongoResults.length) ? mongoResults[mongoResults.length - 1].timestamp : moment('2000', 'YYYY').unix();
            } else {
                stopAt = (!!mongoResults.length) ? mongoResults[0].timestamp : moment().unix()
            }
            limitSql({
                results: [],
                stopAt: stopAt
            }, function(err, results) {
                results = results.concat(mongoResults);
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
            if (!!mongoResults.length) {
                mongoResults = mongoResults[0];
            } else {
                mongoResults = {
                    min: moment().unix(),
                    max: moment().unix()
                };
            }
            History.findEarliestAndLatest({
                upis: [upi],
                range: {
                    start: moment(2000, 'YYYY').unix()
                }
            }, function(err, sqlResults) {
                mongoResults.max = (sqlResults.max === 0 || mongoResults.max > sqlResults.max) ? mongoResults.max : sqlResults.max;
                mongoResults.min = (sqlResults.min === 0 || mongoResults.min < sqlResults.min) ? mongoResults.min : sqlResults.min;
                cb(err, mongoResults);
            });
        });
    }
};