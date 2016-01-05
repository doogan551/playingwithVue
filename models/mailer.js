var nodemailer = require('nodemailer');
var config = require('config');

var serverConfig = config.get('Infoscan.location').site;


module.exports = {
  sendError: function(msg) {
    nodemailer.mail({
      from: 'noreply@dorsett-tech.com',
      to: config.get('Infoscan.location').email,
      subject: 'Error: ' + serverConfig,
      text: msg
    });
  }
};