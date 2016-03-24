var winston = require('winston');
var moment = require('moment');
var dailyFile = require('winston-daily-rotate-file');

winston.emitErrs = true;

var logger = function(moduleName) {
  var label = '';
  var parts = moduleName.filename.split(/[\\\/]/);
  label = parts[parts.length - 2] + '/' + parts.pop();
  return new winston.Logger({
    transports: [
      new dailyFile({
        prepend: true,
        level: 'info',
        filename: './logs/all-logs.json',
        handleExceptions: false,
        json: true,
        maxsize: 1242880, //~1MB
        maxFiles: 10,
        label: label,
        colorize: false,
        timestamp: function() {
          return moment().format();
        }
      }),
      new winston.transports.Console({
        level: 'debug',
        handleExceptions: false,
        json: false,
        colorize: true,
        label: label,
        timestamp: function() {
          return moment().format();
        }
      })
    ],
    exceptionHandlers: [
      new dailyFile({
        prepend: true,
        filename: './logs/exceptions.json',
        handleExceptions: true,
        humanReadableUnhandledException: true,
        json: true,
        maxsize: 5242880, //5MB
        maxFiles: 10,
        label: label,
        colorize: false,
        timestamp: function() {
          return moment().format();
        }
      }),
      new winston.transports.Console({
        handleExceptions: true,
        json: true,
        colorize: true,
        label: label,
        timestamp: function() {
          return moment().format();
        }
      })
    ],
    exitOnError: false
  });
};

module.exports = logger;
module.exports.stream = {
  write: function(message, encoding) {
    logger.info(message);
  }
};