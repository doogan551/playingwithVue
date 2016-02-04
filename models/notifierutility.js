var async = require('async');
var moment = require('moment');

var NotifierUtility = function() {
  this.Twilio = require('./twilio');
  this.Plivo = require('./plivo');
  this.Mailer = require('./mailer');
  this.Notifications = require('./notifications');
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
  var self = this;

  console.log(number, message);
  self.Twilio.sendText(number, message, function(err, response) {
    if (!!err) {
      return cb(err);
    } else {
      return cb(null);
    }
  });

};

NotifierUtility.prototype.sendVoice = function(number, message, cb) {
  var errors = [];
  this.Twilio.sendVoice(number, message, function(err, response) {
    if (!!err) {
      return cb(err);
    } else {
      return cb(null);
    }
  });
};

NotifierUtility.prototype.sendEmail = function(email, message, cb) {
  this.Mailer.sendEmail(email, message, cb);
};

NotifierUtility.prototype.sendNotification = function(alarm, cb) {
  var self = this;

  if (!!alarm.almNotify) {
    self.Notifications.checkPolicies(alarm, function(err, notifications) {
      async.each(notifications, function(notification, callback) {
        async.waterfall([function(wfcb) {
          if (notification.type & 1) { //voice
            self.sendVoice(notification.number, self.makeMessage(alarm, notification), wfcb);
          } else {
            wfcb(null);
          }
        }, function(wfcb) {
          if (notification.type & 2) { // sms
            self.sendText(notification.number, self.makeMessage(alarm, notification), wfcb);
          } else {
            wfcb(null);
          }
        }, function(wfcb) {
          if (notification.type & 4) {
            self.sendEmail(notification.email, self.makeMessage(alarm, notification), wfcb);
          } else {
            wfcb(null);
          }
        }], callback);
      }, cb);
    });
  } else {
    return cb();
  }
};

NotifierUtility.prototype.makeMessage = function(alarm, notification) {
  var makeAckString = function() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var string = '';
    for (var i = 0; i < 4; i++) {
      string += chars[Math.floor(Math.random() * chars.length)];
    }
    return string;
  };
  var message = 'Alarm: "' + alarm.msgText + '" at ' + moment.unix(alarm.msgTime).format('MM/DD/YYYY HH:mm:ss') + '.';
  if (!!notification.ack) {
    message += ' Reply with ' + makeAckString() + ' to acknowledge';
    //update alarm
  }
  return message;
};

module.exports = NotifierUtility;