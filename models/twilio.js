var config = require('config');
var accountSid = config.get('Twilio').accountSid;
var authToken = config.get('Twilio').authToken;
var from = config.get('Twilio').phoneNumber;

var client = require('twilio')(accountSid, authToken);

var Notifications = require('./notifications');
var notifications = new Notifications();

module.exports = {
  sendText: function(toNumber, message, cb) {
    toNumber = notifications.fixPhoneNumbers(toNumber, 'Twilio');

    client.sendMessage({
      to: toNumber,
      from: from,
      body: message.toString()
    }, cb);
  },

  sendVoice: function(toNumber, message, cb) {
    toNumber = notifications.fixPhoneNumbers(toNumber, 'Twilio');
    var url = notifications.buildVoiceUrl(message, 'Twilio');

    client.makeCall({
      to: toNumber,
      from: from,
      url: url
    }, cb);
  }
};