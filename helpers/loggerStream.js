var winston = require('winston');
var moment = require('moment');
winston.emitErrs = true;

var logger = new winston.Logger({
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: './logs/all-logs.json',
      handleExceptions: true,
      json: true,
      maxsize: 5242880, //5MB
      maxFiles: 5,
      colorize: false,
      timestamp: function() {
        return moment().format();
      }
    }),
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      prettyPrint: true,
      colorize: true,
      timestamp: function() {
        return moment().format();
      }
    })
  ],
  exitOnError: false
});

module.exports = logger;
module.exports.stream = {
  write: function(message, encoding) {
    message = message.substr(0, message.length - 1);
    logger.info(message);
  }
};