var winston = require('winston');
var moment = require('moment');

winston.emitErrs = true;

var logger = function(moduleName) {
  var label = '';
  var parts = moduleName.filename.split(/[\\\/]/);
  label = parts[parts.length - 2] + '/' + parts.pop();
  return new winston.Logger({
    transports: [
      new winston.transports.File({
        level: 'info',
        filename: './logs/all-logs.json',
        handleExceptions: false,
        json: true,
        maxsize: 5242880, //5MB
        maxFiles: 5,
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
      new winston.transports.File({
        filename: './logs/exceptions.json',
        handleExceptions: true,
        humanReadableUnhandledException: true,
        json: true,
        maxsize: 5242880, //5MB
        maxFiles: 5,
        label: label,
        colorize: false,
        timestamp: function() {
          return moment().format();
        }
      })/*,
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
};

module.exports = logger;
module.exports.stream = {
  write: function(message, encoding) {
    logger.info(message);
  }
};