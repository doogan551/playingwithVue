const Common = require('./common');
const ActivityLog = require('./activitylog');
const Point = require('./point');
const utils = require('../helpers/utils');

const calendarCollection = utils.CONSTANTS('calendarCollection');

const Calendar = class Calendar extends Common {

    constructor() {
        super(calendarCollection);
    }

    getYear(data, cb) {
        let criteria = {
            query: {
                year: parseInt(data.year, 10)
            },
            fields: {
                _id: 0
            }
        };

        this.getOne(criteria, cb);
    }

    newDate(data, cb) {
        const activityLog = new ActivityLog();
        const pointModel = new Point();
        let year = parseInt(data.year, 10);
        let dates = data.dates;

        dates.forEach((date) => {
            date.month = parseInt(date.month, 10);
            date.date = parseInt(date.date, 10);
        });

        let query = {
            year: year
        };

        let updateObj = {
            $set: {
                dates: dates,
                year: year
            }
        };

        let criteria = {
            query: query,
            updateObj: updateObj,
            sort: [],
            options: {
                new: true,
                upsert: true
            }
        };

        this.findAndModify(criteria, (err, yearResult) => {
            if (err) {
                return cb(err);
            }
            let logData = {
                user: data.user,
                timestamp: Date.now(),
                activity: 'Calendar Year Edit',
                log: 'Calendar for year ' + year + ' updated.'
            };
            activityLog.create(logData, (err) => {});

            if (new Date().getFullYear() === year) {
                criteria = {
                    query: {
                        'Point Type.Value': 'Device'
                    },
                    updateObj: {
                        $set: {
                            _updPoint: true
                        }
                    }
                };

                pointModel.updateAll(criteria, (err) => {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, yearResult);
                });
            } else {
                return cb(null, yearResult);
            }
        });
    }
};

module.exports = Calendar;
