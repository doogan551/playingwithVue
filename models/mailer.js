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
  }
};