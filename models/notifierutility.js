var async = require('async');
var moment = require('moment');

var NotifierUtility = function() {
  this.Twilio = require('./twilio');
  this.Plivo = require('./plivo');
  this.Mailer = require('./mailer');
};

NotifierUtility.prototype.testText = function(number, message, cb) {
  this.Twilio.sendText(number, message, cb);
  this.Plivo.sendText(number, message, cb);
};

NotifierUtility.prototype.fixPhoneNumbers = function(number, type) {
  number = number.toString();

  if (type === 'Twilio') {
    number = (number.search(/\+/) >= 0) ? number : '+' + number;
  }

  return number;
};

NotifierUtility.prototype.buildVoiceUrl = function(message, type) {
  var talkVerb = (type === 'Twilio') ? 'Say' : 'Speak';
  message = message.split(' ').join('+');
  var url = 'http://www.infoscanweb.com:85/' + type + '/xml?say=' + message + '&gather';
  console.log(url);
  return url;
  // return 'http://twimlets.com/echo?Twiml=%3CResponse%3E%3C' + talkVerb + '%3E' + message + '%3C%2F' + talkVerb + '%3E%3C%2FResponse%3E';
};

NotifierUtility.prototype.sendText = function(number, message, cb) {
  this.Twilio.sendText(number, message, function(err, response) {
    if (cb)
      return cb(err, response);
  });
};

NotifierUtility.prototype.sendVoice = function(number, message, cb) {
  this.Twilio.sendVoice(number, message, function(err, response) {
    if (cb)
      return cb(err, response);
  });
};

NotifierUtility.prototype.sendEmail = function(options, cb) {
  // All mailer options (see https://github.com/nodemailer/nodemailer) are exposed with one exception:
  // Our 'from' address is always built from two optional parameters: 'fromAccount' and 'fromUser'
  // If your options object has a 'from' key, it will be overwritten; options.from is created from the 'fromAccount' and 'fromUser' keys.
  // If not used, 'fromAccount' defaults to 'infoscan', and 'fromUser' defaults to 'InfoScan', combining to yield a from address of:
  // '"InfoScan" <infoscan@[domain]>', where domain is the site domain defined in the config file
  // Typically, the 'fromAccount' will be sourced from one listed in the config file (Infoscan.email.accounts)
  this.Mailer.sendEmail(options, function(err, response) {
    if (cb)
      cb(err, response);
  });
};

module.exports = NotifierUtility;