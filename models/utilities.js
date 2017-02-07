let fs = require('fs');
let pug = require('pug');

let Utility = require('./utility');
let System = require('./system');

let getRates = function (cb) {
    let criteria = {
        collection: 'Utilities',
        query: {
            'Point Type.Value': 'Utility'
        },
        fields: {
            'Point Type': 0,
            _id: 0
        },
        sort: {
            _id: 1
        }
    };

    Utility.get(criteria, cb);
};

module.exports = {

    index: function (data, cb) {
        let utilities;
        let html;
        let weatherPoints;
        let completed = 0;
        let complete = function () {
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
        let getWeatherPoints = function () {
            System.weather(function (err, data) {
                weatherPoints = err || data;
                complete();
            });
        };
        let callGetRates = function () {
            getRates(function (err, rawUtilities) {
                utilities = err || rawUtilities;
                complete();
            });
        };
        let getUtilityMarkup = function () {
            module.exports.getUtilityMarkup('Electricity', function (markup) {
                html = markup;
                complete();
            });
        };

        let fns = [getWeatherPoints, callGetRates, getUtilityMarkup];

        fns.forEach(function (fn) {
            fn();
        });
    },

    getUtility: function (data, cb) {
        let criteria = {
            query: {
                'UtilityName': data.UtilityName
            },
            collection: 'Utilities'
        };

        Utility.getOne(criteria, cb);
    },

    saveUtility: function (_data, cb) {
        let utility = _data.utility;
        let path = utility.path;
        let data = utility.data;
        let remove = utility.remove.toString();
        let updateObj;

        if (remove === 'true' && !!path) {
            updateObj = {
                $unset: {}
            };
            updateObj.$unset[path] = 1;
        } else {
            updateObj = {
                $set: {}
            };
            if (!!path) {
                updateObj.$set[path] = data;
            } else {
                delete updateObj.path;
                for (let prop in data) {
                    updateObj.$set[prop] = data[prop];
                }
            }
        }

        Utility.update({
            collection: 'Utilities',
            query: {
                'utilityName': utility.utilityName
            },
            updateObj: updateObj,
            options: {
                upsert: true
            }
        }, cb);
    },

    uploadBackground: function (data, cb) {
        let path = [__dirname, '..', 'public', 'img', 'dashboard', 'backgrounds', ''].join('/'),
            uploadedFiles = data.files,
            list = Object.keys(uploadedFiles),
            obj = uploadedFiles[list[0]];

        fs.writeFile(path + obj.originalname, obj.buffer, cb);
    },

    getMarkup: function (data, cb) {
        let type = data.type;
        module.exports.getUtilityMarkup(type, cb);
    },

    getUtilityMarkup: function (type, cb) {
        let filename = __dirname + '/../views/dashboard/utility_' + type + '.pug';
        fs.readFile(filename, 'utf8', function (err, data) {
            let fn,
                html;

            fn = pug.compile(data, {
                filename: filename
            });

            html = fn({});

            cb(html, err);
        });
    },

    removeUtility: function (data, cb) {
        let criteria = {
            collection: 'Utilities',
            query: {
                utilityName: data.utilityName
            }
        };
        Utility.remove(criteria, cb);
    }

};
