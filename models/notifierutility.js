var NotifierUtility = function() {
  this.Twilio = require('./twilio');
  this.Plivo = require('./plivo');
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
  var url = 'http://www.infoscanweb.com:85/'+type+'/xml?say='+message+'&gather';
  console.log(url);
  return url;
  // return 'http://twimlets.com/echo?Twiml=%3CResponse%3E%3C' + talkVerb + '%3E' + message + '%3C%2F' + talkVerb + '%3E%3C%2FResponse%3E';
};

NotifierUtility.prototype.sendText = function(number, message, cb) {
  var errors = [];
  this.Twilio.sendText(number, message, function(err, response) {
    if (!!err) {
      errors.push(err);
      this.Plivo.sendText(number, message, function(err, response) {
        if (!!err) {
          errors.push(err);
          return cb(errors);
        } else {
          return cb(null, response);
        }
      });
    } else {
      return cb(null, response);
    }
  });
};

NotifierUtility.prototype.sendVoice = function(number, message, cb) {
  var errors = [];
  this.Twilio.sendVoice(number, message, function(err, response) {
    if (!!err) {
      errors.push(err);
      this.Plivo.sendVoice(number, message, function(err, response) {
        if (!!err) {
          errors.push(err);
          return cb(errors);
        } else {
          return cb(null, response);
        }
      });
    } else {
      return cb(null, response);
    }
  });
};

module.exports = NotifierUtility;