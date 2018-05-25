const TrendPlots = class TrendPlots {

    getPoints(data, cb) {
        const point = new Point();
        let DAY = 60 * 60 * 24;
        let upi = +data.id;
        let days = +data.numDays;
        let start = Math.floor(new Date().getTime() / 1000 - (days * DAY));

        let criteria = {
            query: {
                upi: upi,
                timestamp: {
                    $gt: start,
                    $lt: new Date().getTime() / 1000
                }
            },
            fields: {
                _id: 0,
                Value: 1,
                timestamp: 1
            }
        };

        point.getAll(criteria, (err, results) => {
            let c = results.length;
            let ret = [];
            let row;
            let ts;
            let prevDay;

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
    }

    getData(list, cb) {
        const point = new Point();
        if (list) {
            let criteria = {
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

            point.getAll(criteria, cb);
        } else {
            cb(null, []);
        }
    }
};

module.exports = TrendPlots;
const Point = require('./point');
