var nodemailer = require('nodemailer');
var config = require('config');

var serverConfig = require('os').hostname();
var toMail = config.get('Infoscan.location').email;


module.exports = {
  sendError: function(msg) {
    if (!!toMail) {
      nodemailer.mail({
        from: 'noreply@dorsett-tech.com',
        to: toMail,
        subject: 'Error: ' + serverConfig,
        text: msg
      });
    }
  },
  sendEmail: function(to, msg, cb) {
    nodemailer.mail({
      from: 'robert.ian.kendall@gmail.com',
      to: to,
      subject: 'Alarm',
      text: msg
    });
    cb();
  }
};