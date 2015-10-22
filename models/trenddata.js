var Utility = require('../models/utility');

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
            sort: sort,
            skip: skip
        };

        Utility.get(criteria, cb);
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

        Utility.aggregate(criteria, cb);
    }
};