let Utility = require('./utility');
let ActivityLog = new(require('./activitylog'))();
let Config = require('../public/js/lib/config');
let utils = require('../helpers/utils');
let actLogsEnums = Config.Enums['Activity Logs'];

let Calendar = class Calendar {

    getYear(data, cb) {
        let criteria = {
            query: {
                year: parseInt(data.year, 10)
            },
            collection: 'Holiday',
            limit: 1,
            fields: {
                _id: 0
            }
        };

        Utility.get(criteria, cb);
    }

    getSeason(data, cb) {
        let criteria = {
            query: {
                Name: 'Preferences'
            },
            collection: 'SystemInfo',
            limit: 1,
            fields: {
                _id: 0,
                'Current Season': 1
            }
        };

        Utility.get(criteria, cb);
    }

    updateSeason(data, cb) {
        let logData = {
            user: data.user,
            timestamp: Date.now()
        };
        let season = data['Current Season'];
        let criteria = {
            query: {
                Name: 'Preferences'
            },
            updateObj: {
                $set: {
                    'Current Season': season
                }
            },
            collection: 'SystemInfo',
            fields: {
                _id: 0,
                'Current Season': 1
            }
        };

        Utility.update(criteria, function (err) {
            logData.activity = actLogsEnums['Season Change'].enum;
            logData.log = 'Season changed to ' + season + '.';
            logData = utils.buildActivityLog(logData);
            ActivityLog.create(logData, (err) => {
                return cb(null, 'success');
            });
        });
    }

    newDate(data, cb) {
        let year = parseInt(data.year, 10);
        let dates = data.dates;

        dates.forEach(function (date) {
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
            collection: 'Holiday',
            sort: [],
            options: {
                new: true,
                upsert: true
            }
        };

        Utility.findAndModify(criteria, function (err, yearResult) {
            if (err) {
                return cb(err);
            }
            let logData = {
                user: data.user,
                timestamp: Date.now(),
                activity: actLogsEnums['Calendar Year Edit'].enum,
                log: 'Calendar for year ' + year + ' updated.'
            };
            logData = utils.buildActivityLog(logData);
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

                Utility.update(criteria, function (err) {
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
