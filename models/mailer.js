var nodemailer = require('nodemailer');
var config = require('config');

var serverConfig = require('os').hostname();
var toMail = config.get('Infoscan.location').email;

var defaultFromAddress = "'InfoScan' <dorsett.alarms@gmail.com>";

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
    if (!!!options.from)
      options.from = defaultFromAddress;

    nodemailer.mail(options);
    cb(null, {
      to: options.to,
      from: options.from,
      status: 'sent'
    });
  }
};