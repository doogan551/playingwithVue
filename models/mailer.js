var nodemailer = require('nodemailer');
var config = require('config');

var serverConfig = require('os').hostname();
var toMail = config.get('Infoscan.location').email;


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
  sendEmail: function(to, msg, cb) {
    console.log(to, msg);
    nodemailer.mail({
      from: 'dorsett.alarms@gmail.com',
      to: to,
      subject: 'Alarm',
      text: msg
    });
    cb();
  }
};