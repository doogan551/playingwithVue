var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

module.exports = {

    getPoints: function(data, cb) {
        var DAY = 60 * 60 * 24;
        var upi = +data.id;
        var rows = +data.rows || 1000;
        var days = +data.numDays;
        var start = Math.floor(new Date().getTime() / 1000 - (days * DAY));
        var startReq = new Date();
        var end = +data.end;

        var criteria = {
            query: {
                upi: upi,
                timestamp: {
                    $gt: start,
                    $lt: new Date().getTime() / 1000
                }
            },
            collection: 'historydata',
            fields: {
                _id: 0,
                Value: 1,
                timestamp: 1
            }
        };

        Utility.get(criteria, function(err, results) {
            var c = results.length;
            var ret = [];
            var row;
            var ts;
            var prevDay;
            var started = new Date();

            results.reverse();

            while (c--) {
                ts = Math.floor(results[c].timestamp / DAY); //new Date(results[c].timestamp * 1000).getDate();
                if (ts !== prevDay) {
                    row = results[c];
                    row.date = ts;
                    // row.low = row.Value * 0.8;
                    row.high = row.Value * (Math.random() / 8 + 1);
                    ret.push(row);
                    prevDay = ts;
                }
            }

            ret.reverse();

            return cb(err, ret);
        });
    },

    getData: function(list, cb) {
        if (list) {

            var criteria = {
                collection: 'historydata',
                query: {
                    _id: {
                        $in: list
                    }
                },
                fields: {
                    _id: 1,
                    'Point Type.Value': 1,
                    'Minimum Value.Value': 1,
                    'Maximum Value.Value': 1,
                    Name: 1
                }
            };

            Utility.get(criteria, cb);
        } else {
            cb(null, []);
        }
    }
};