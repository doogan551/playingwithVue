var Notifications = function() {
  this.Twilio = require('./twilio');
  this.Plivo = require('./plivo');
};

Notifications.prototype.testText = function(number, message, cb) {
  this.Twilio.sendText(number, message, cb);
  this.Plivo.sendText(number, message, cb);
};

Notifications.prototype.fixPhoneNumbers = function(number, type) {
  number = number.toString();

  if (type === 'Twilio') {
    number = (number.search(/\+/) >= 0) ? number : '+' + number;
  }

  return number;
};

Notifications.prototype.buildVoiceUrl = function(message, type) {
  var talkVerb = (type === 'Twilio') ? 'Say' : 'Speak';
  message = message.split(' ').join('+');

  return 'http://twimlets.com/echo?Twiml=%3CResponse%3E%3C' + talkVerb + '%3E' + message + '%3C%2F' + talkVerb + '%3E%3C%2FResponse%3E';
};

module.exports = Notifications;