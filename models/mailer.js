var nodemailer = require('nodemailer');
var config = require('config');

var serverName = require('os').hostname();
var siteConfig = config.get('Infoscan');
var siteDomain = siteConfig.domains[0];
var siteName = siteConfig.location.site;
var defaultFromUser = siteConfig.email.from.default;
var smtpAuth = config.get('SparkPost').smtpAuth;

var OPEN = 1;
var CLOSED = 2;
var TIMEOUT = 330000; // 5 minutes, 30 seconds
var transportStatus = CLOSED;
var smtpTransport;
var timeoutObj;
var smtpConfig = {
    host: "smtp.sparkpostmail.com", // hostname
    secureConnection: false, // connection is started in insecure plain text mode and later upgraded with STARTTLS
    port: 587, // port for secure SMTP
    auth: smtpAuth
  };

function closeTransport () {
  smtpTransport.close();
  transportStatus = CLOSED;
}

function getTransport () {
  clearTimeout(timeoutObj); // Clear the timeout
  timeoutObj = setTimeout(closeTransport, TIMEOUT); // Close the connection pool after <timeout> milliseconds of inactivity

  if (transportStatus === CLOSED) {
    smtpTransport = nodemailer.createTransport("SMTP", smtpConfig);
    transportStatus = OPEN;
  }
}

function sendEmail (options, cb) {
  getTransport();

  if (!options.fromUser) {
    options.fromUser = defaultFromUser;
  }
  options.from = options.fromUser + '@' + siteDomain;
  delete options.fromUser; // Shouldn't matter but remove custom key just to be safe

  if (!options.fromName) {
    options.fromName = 'InfoScan';
  }
  options.from = options.fromName + ' <' + options.from + '>';
  delete options.fromName; // Shouldn't matter but remove custom key just to be safe

  smtpTransport.sendMail(options, cb);
}

module.exports = {
  sendError: function(msg) {
    var options;

    if (siteConfig.email.onError.enabled) {
      options = {
        to: siteConfig.email.onError.to,
        subject: 'Error: ' + serverName + ' (Site: ' + siteName + ')',
        text: ['Site: ' + siteName, 'Time: ' + new Date().toString(), msg].join('\n')
      };
      sendEmail(options, function () {});
    }
  },
  sendEmail: function(options, cb) {
    sendEmail(options, cb);
  }
};