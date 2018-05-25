var winston = require('winston');
var moment = require('moment');
var DailyFile = require('winston-daily-rotate-file');
var WinstonMongo = require('winston-mongodb').MongoDB;
const db = require('../helpers/db');

winston.emitErrs = true;

var logger = function (moduleName) {
    var label = '';
    var parts = moduleName.filename.split(/[\\\/]/);
    label = parts[parts.length - 2] + '/' + parts.pop();
    let winstonModel = new winston.Logger({
        transports: [
            new DailyFile({
                prepend: true,
                level: 'info',
                filename: './logs/all-logs.json',
                handleExceptions: false,
                json: true,
                maxsize: 1242880, //~1MB
                maxFiles: 10,
                label: label,
                colorize: false,
                timestamp: function () {
                    return moment().format();
                }
            }),
            new winston.transports.Console({
                level: 'debug',
                handleExceptions: false,
                json: false,
                colorize: true,
                label: label,
                timestamp: function () {
                    return moment().format();
                }
            })
        ],
        exceptionHandlers: [
            new DailyFile({
                prepend: true,
                filename: './logs/exceptions.json',
                handleExceptions: true,
                humanReadableUnhandledException: true,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 10,
                label: label,
                colorize: false,
                timestamp: function () {
                    return moment().format();
                }
            })
            /*,
                  new winston.transports.Console({
                    handleExceptions: true,
                    json: true,
                    colorize: true,
                    label: label,
                    timestamp: function() {
                      return moment().format();
                    }
                  })*/
        ],
        exitOnError: false
    });
    // winstonModel.add(WinstonMongo, {
    //     level: 'info',
    //     silent: false,
    //     db: db.get(),
    //     collection: 'logs',
    //     label: label,
    //     timestamp: function () {
    //         return moment().format();
    //     }
    // });
    return winstonModel;
};

module.exports = logger;
module.exports.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
};
