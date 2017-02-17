const fs = require('fs');

const pug = require('pug');

const Common = require('./common');
const System = require('./system');
const system = new System();

const Utilities = class Utilities extends Common {
    constructor() {
        super('Utilities');
    }
    getRates(cb) {
        let criteria = {
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

        this.getAll(criteria, cb);
    }
    index(data, cb) {
        let utilities;
        let html;
        let weatherPoints;
        let completed = 0;
        let complete = () => {
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
        let getWeatherPoints = () => {
            system.weather((err, data) => {
                weatherPoints = err || data;
                complete();
            });
        };
        let callGetRates = () => {
            this.getRates((err, rawUtilities) => {
                utilities = err || rawUtilities;
                complete();
            });
        };
        let getUtilityMarkup = () => {
            module.exports.getUtilityMarkup('Electricity', (markup) => {
                html = markup;
                complete();
            });
        };

        let fns = [getWeatherPoints, callGetRates, getUtilityMarkup];

        fns.forEach((fn) => { // TODO change this to be async.series
            fn();
        });
    }

    getUtility(data, cb) {
        let criteria = {
            query: {
                'UtilityName': data.UtilityName
            }
        };

        this.getOne(criteria, cb);
    }

    saveUtility(_data, cb) {
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

        this.updateOne({
            query: {
                'utilityName': utility.utilityName
            },
            updateObj: updateObj,
            options: {
                upsert: true
            }
        }, cb);
    }

    uploadBackground(data, cb) {
        let path = [__dirname, '..', 'public', 'img', 'dashboard', 'backgrounds', ''].join('/'),
            uploadedFiles = data.files,
            list = Object.keys(uploadedFiles),
            obj = uploadedFiles[list[0]];

        fs.writeFile(path + obj.originalname, obj.buffer, cb);
    }

    getMarkup(data, cb) {
        let type = data.type;
        module.exports.getUtilityMarkup(type, cb);
    }

    getUtilityMarkup(type, cb) {
        let filename = __dirname + '/../views/dashboard/utility_' + type + '.pug';
        fs.readFile(filename, 'utf8', (err, data) => {
            let fn,
                html;

            fn = pug.compile(data, {
                filename: filename
            });

            html = fn({});

            cb(html, err);
        });
    }

    removeUtility(data, cb) {
        let criteria = {
            query: {
                utilityName: data.utilityName
            }
        };
        this.remove(criteria, cb);
    }
};

module.exports = Utilities;
