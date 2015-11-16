var winston = require('winston');
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
        colorize: false
      }),
      new winston.transports.Console({
        level: 'debug',
        handleExceptions: false,
        json: false,
        colorize: true,
        label: label,
        timestamp: true
      })
    ],
    exceptionHandlers:[
      new winston.transports.File({
        filename: './logs/exceptions.json',
        handleExceptions: true,
        json: true,
        maxsize: 5242880, //5MB
        maxFiles: 5,
        label: label,
        colorize: false
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