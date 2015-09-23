var db = require('../helpers/db');
var Utility = require('../models/utility');

module.exports = {

    getYear: function (data, cb) {
        var criteria = {
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
    },
    getSeason: function (data, cb) {
        var criteria = {
            query: {
                Name: "Preferences"
            },
            collection: 'System Info',
            limit: 1,
            fields: {
                _id: 0,
                "Current Season": 1
            }
        };

        Utility.get(criteria, cb);
    },
    updateSeason: function (data, cb) {
        var season = data["Current Season"],
            criteria = {
                query: {
                    Name: "Preferences"
                },
                updateObj: {
                    $set: {
                        "Current Season": season
                    }
                },
                collection: 'System Info',
                fields: {
                    _id: 0,
                    "Current Season": 1
                }
            };

        Utility.update(criteria, function (err, result) {
            return cb(err, 'success');
        });

    },
    newDate: function (data, cb) {

        var year = parseInt(data.year, 10);
        var dates = data.dates;

        dates.forEach(function (date) {
            date.month = parseInt(date.month, 10);
            date.date = parseInt(date.date, 10);
        });

        var query = {
            year: year
        };

        var updateObj = {
            $set: {
                dates: dates,
                year: year,
            }
        };

        var criteria = {
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
            if (err) return cb(err);

            if (new Date().getFullYear() === year) {

                criteria = {
                    collection: 'points',
                    query: {
                        "Point Type.Value": "Device"
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

                Utility.update(criteria, function (err, result) {
                    if (err) {
                        return cb(err);
                    } else {
                        return cb(null, yearResult);
                    }
                });
            } else {
                return cb(null, yearResult);
            }

        });
    }
};
