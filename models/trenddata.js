const moment = require('moment');

const History = require('./history');

const TrendData = class TrendData {

    viewTrend(data, cb) {
        let startTime = (!!data.startTime) ? parseInt(data.startTime, 10) : Math.floor(Date.now() / 1000);
        let limit = (!!data.limit) ? parseInt(data.limit, 10) : 200;
        let direction = (!!data.direction) ? parseInt(data.direction, 10) : 1;
        let upi = parseInt(data.upi, 10);
        let query = {};
        let range = {};

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
        let criteria = {
            query: query,
            limit: limit,
            sort: {
                timestamp: direction * -1
            }
        };
        let compareTS = (a, b) => {
            if (a.timestamp < b.timestamp) {
                return 1;
            }
            if (a.timestamp > b.timestamp) {
                return -1;
            }
            return 0;
        };

        let limitSql = (options, callback) => {
            History.findHistory({
                upis: [upi],
                range: range,
                fx: 'history'
            }, (err, sqlResults) => {
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
        let fixResults = (results) => {
            results.sort(compareTS);
            if (!!results.length) {
                if (limit < results.length) {
                    results.splice(limit, results.length - limit);
                }
            }
            return results;
        };

        History.getAll(criteria, (err, mongoResults) => {
            let stopAt = 0;
            mongoResults.sort(compareTS);
            if (direction > 1) {
                stopAt = (!!mongoResults.length) ? mongoResults[mongoResults.length - 1].timestamp : moment('2000', 'YYYY').unix();
            } else {
                stopAt = (!!mongoResults.length) ? mongoResults[0].timestamp : moment().unix();
            }
            limitSql({
                results: [],
                stopAt: stopAt
            }, (err, results) => {
                results = results.concat(mongoResults);
                fixResults(results);
                cb(err, results);
            });
        });
    }
    getTrendLimits(data, cb) {
        let upi = parseInt(data.upi, 10);

        let query = [{
            $match: {
                upi: upi
            }
        }, {
            $group: {
                _id: '$upi',
                max: {
                    $max: '$timestamp'
                },
                min: {
                    $min: '$timestamp'
                }
            }
        }, {
            $project: {
                _id: 0,
                max: '$max',
                min: '$min'
            }
        }];

        if (!upi) {
            return cb('No point provided');
        }

        let criteria = {
            query: query
        };

        History.aggregate(criteria, (err, mongoResults) => {
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
            }, (err, sqlResults) => {
                mongoResults.max = (sqlResults.max === 0 || mongoResults.max > sqlResults.max) ? mongoResults.max : sqlResults.max;
                mongoResults.min = (sqlResults.min === 0 || mongoResults.min < sqlResults.min) ? mongoResults.min : sqlResults.min;
                cb(err, mongoResults);
            });
        });
    }
};

module.exports = TrendData;
