let Utility = require('./utility');
let ActivityLog = new(require('./activitylog'))();
let utils = require('../helpers/utils');
const calendarCollection = utils.CONSTANTS('calendarCollection');

let Calendar = class Calendar {

    constructor() {
        this.collection = calendarCollection;
    }

    getYear(data, cb) {
        let criteria = {
            query: {
                year: parseInt(data.year, 10)
            },
            collection: this.collection,
            limit: 1,
            fields: {
                _id: 0
            }
        };

        Utility.get(criteria, cb);
    }

    newDate(data, cb) {
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
            collection: this.collection,
            sort: [],
            options: {
                new: true,
                upsert: true
            }
        };

        Utility.findAndModify(criteria, (err, yearResult) => {
            if (err) {
                return cb(err);
            }
            let logData = {
                user: data.user,
                timestamp: Date.now(),
                activity: 'Calendar Year Edit',
                log: 'Calendar for year ' + year + ' updated.'
            };
            ActivityLog.create(logData, (err) => {});

            if (new Date().getFullYear() === year) {
                criteria = {
                    collection: 'points',
                    query: {
                        'Point Type.Value': 'Device'
                    },
                    updateObj: {
                        $set: {
                            _updPoint: true
                        }
                    },
                    options: {
                        multi: true
                    }
                };

                Utility.update(criteria, (err) => {
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
