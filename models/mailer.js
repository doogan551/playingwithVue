var nodemailer = require('nodemailer');
var config = require('config');

var serverConfig = require('os').hostname();
var toMail = config.get('Infoscan.location').email;
// var defaultFromAddress = "'InfoScan' <infoscan@dorsett-tech.com>";
var defaultFromAddress = 'testing@sparkpostbox.com';

var OPEN = 1;
var CLOSED = 2;
var transportStatus = CLOSED;
var timeout = 300000; // 5 minutes
var smtpTransport;
var timeoutObj;
var smtpConfig = {
    host: "smtp.sparkpostmail.com", // hostname
    secureConnection: false, // connection is started in insecure plain text mode and later upgraded with STARTTLS
    port: 587, // port for secure SMTP
    auth: {
        user: "SMTP_Injection",
        pass: "843730326ae23dd0859cd9affe42744c701ee63b"
    }
  };

function closeTransport () {
  smtpTransport.close();
  transportStatus = CLOSED;
}

function getTransport () {
  clearTimeout(timeoutObj); // Clear the timeout
  timeoutObj = setTimeout(closeTransport, timeout); // Close the connection pool after <timeout> milliseconds of inactivity

  if (transportStatus === CLOSED) {
    smtpTransport = nodemailer.createTransport("SMTP", smtpConfig);
    transportStatus = OPEN;
  }
}

module.exports = {
  sendError: function(msg) {
    if (!!toMail) {
      nodemailer.mail({
        from: 'dorsett.alarms@gmail.com',
        to: toMail,
        subject: 'Error: ' + serverConfig,
        text: msg
      });
    }
  },
  sendEmail: function(options, cb) {
    getTransport();

    if (!!!options.from)
      options.from = defaultFromAddress;

    smtpTransport.sendMail(options, cb);
  }
};