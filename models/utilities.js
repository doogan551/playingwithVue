var fs = require('fs');
var pug = require('pug');

var Utility = require('./utility');
var System = require('./system');
var logger = require('../helpers/logger')(module);

var getRates = function(cb) {
    var criteria = {
        collection: 'Utilities',
        query: {
            "Point Type.Value": "Utility"
        },
        fields: {
            "Point Type": 0,
            _id: 0
        },
        sort: {
            _id: 1
        }
    };

    Utility.get(criteria, cb);
};

module.exports = {

    index: function(data, cb) {
        var utilities;
        var html;
        var weatherPoints;
        var completed = 0;
        var complete = function() {
            completed++;
            if (completed === fns.length) {
                return cb(null, {
                    utilities: JSON.stringify(utilities),
                    rawUtilities: utilities,
                    content: html,
                    weatherPoints: JSON.stringify(weatherPoints)
                });
            }
        };
        var getWeatherPoints = function() {
            System.weather(function(err, data) {
                weatherPoints = err || data;
                complete();
            });
        };
        var callGetRates = function() {
            getRates(function(err, rawUtilities) {
                utilities = err || rawUtilities;
                complete();
            });
        };
        var getUtilityMarkup = function() {
            module.exports.getUtilityMarkup('Electricity', function(markup) {
                html = markup;
                complete();
            });
        };

        var fns = [getWeatherPoints, callGetRates, getUtilityMarkup];

        fns.forEach(function(fn) {
            fn();
        });
    },

    getUtility: function(data, cb) {
        var criteria = {
            query: {
                'UtilityName': data.UtilityName
            },
            collection: 'Utilities'
        };

        Utility.getOne(criteria, cb);
    },

    saveUtility: function(_data, cb) {
        var utility = _data.utility;
        var path = utility.path;
        var data = utility.data;
        var remove = utility.remove.toString();
        var updateObj;

        if (remove === 'true' && !!path) {
            updateObj = {
                $unset: {}
            };
            updateObj['$unset'][path] = 1;

        } else {
            updateObj = {
                $set: {}
            };
            if (!!path) {
                updateObj['$set'][path] = data;
            } else {
                delete updateObj.path;
                for (var prop in data) {
                    updateObj['$set'][prop] = data[prop];
                }
            }
        }

        Utility.update({
            collection: 'Utilities',
            query: {
                "utilityName": utility.utilityName
            },
            updateObj: updateObj,
            options: {
                upsert: true
            }
        }, cb);
    },

    uploadBackground: function(data, cb) {
        var c,
            path = [__dirname, '..', 'public', 'img', 'dashboard', 'backgrounds', ''].join('/'),
            uploadedFile = data.file;
        fs.writeFile(path + uploadedFile.originalname, uploadedFile.buffer, cb);
    },

    getMarkup: function(data, cb) {
        var type = data.type;
        module.exports.getUtilityMarkup(type, cb);
    },

    getUtilityMarkup: function(type, cb) {
        var filename = __dirname + '/../views/dashboard/utility_' + type + '.pug';
        fs.readFile(filename, 'utf8', function(err, data) {
            var fn,
                html;

            fn = pug.compile(data, {
                filename: filename
            });

            html = fn({});

            cb(html, err);
        });
    },

    removeUtility: function(data, cb) {
        var criteria = {
            collection: 'Utilities',
            query: {
                utilityName: data.utilityName
            }
        };
        Utility.remove(criteria, cb);
    }

};