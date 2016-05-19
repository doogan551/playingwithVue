var nodemailer = require('nodemailer');
var config = require('config');

var serverName = require('os').hostname();
var siteConfig = config.get('Infoscan');
var siteDomain = siteConfig.domains[0];
var siteName = siteConfig.location.site;
var defaultAccount = siteConfig.email.accounts.default;
var smtpAuth = config.get('SparkPost').smtpAuth;

var OPEN = 1;
var CLOSED = 2;
var TIMEOUT = 30000; // 30 seconds

// Initially we used a 5min 30sec timeout. Often, our transport object would receive our email requests but the emails 
// were never sent and our callback was never called. It appears the transport was prematurely closing due to a problem with 
// our version of the nodemailer or one of it's dependencies as described here: https://github.com/nodemailer/nodemailer/issues/260. 
// Apparently this issue was resolved in a later release of Nodemailer, but at the time of this writing we cannot upgrade 
// because the later releases are ES6, and our version of Node is ES5.

// Our workaround is to use a timeout of 30 seconds. This is based on the fact that notifications.js is the only application
// currently sending email, and it runs once per minute. Setting our timeout to 30s guarantees we'll create a new transport
// object for sending emails when the notification task runs.

// In the future, other InfoScan applications may send email (automated reports, etc.); then we can no longer guarantee that a
// transport will be created each time emails are sent (because it could be requested before our transport is closed). To test
// how our workaround performs, a test script was created to send an email every 20s (to continually extend the life of the 
// transport and prevent it from closing). In total, 49 emails were successfully sent over the course of 13+ minutes. Only one 
// email was not received in the targeted inbox, and subsequent emails continued to flow in, indicating the lost email was not
// a result of the transport issue previously seen.

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
  var fromName = options.fromName || 'InfoScan',
      fromAcnt = options.from || defaultAccount;

  getTransport();
  options.from = fromName + ' <' + fromAcnt + '>';
  smtpTransport.sendMail(options, cb);
}

module.exports = {
  sendError: function(msg) {
    var options;

    if (siteConfig.email.onError.enabled) {
      options = {
        to: siteConfig.email.onError.to,
        subject: 'Error: ' + serverName + ' (Site: ' + siteName + ')',
        text: ['Site: ' + siteName, 'Time: ' + new Date().toString(), '', msg].join('\n')
      };
      sendEmail(options, function () {});
    }
  },
  sendEmail: function(options, cb) {
    sendEmail(options, cb);
  }
};