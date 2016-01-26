var plivo = require('plivo');
var config = require('config');
var authId = config.get('Plivo').authId;
var authToken = config.get('Plivo').authToken;
var src = config.get('Plivo').phoneNumber;

var Notifications = require('./notifications');
var notifications = new Notifications();


var client = plivo.RestAPI({
  authId: authId,
  authToken: authToken
});

module.exports = {
  sendText: function(toNumber, message, cb) {
    toNumber = notifications.fixPhoneNumbers(toNumber, 'Plivo');

    var params = {
      src: src,
      dst: toNumber,
      text: message,
      method: 'GET'
    };

    client.send_message(params, cb);
  },

  sendVoice: function(toNumber, message, cb) {
    toNumber = notifications.fixPhoneNumbers(toNumber, 'Plivo');
    var url = notifications.buildVoiceUrl(message, 'Plivo');

    var params = {
      from: src,
      to: toNumber,
      answer_url: url,
      answer_method: 'GET'
    };

    client.make_call(params, cb);
  }
};