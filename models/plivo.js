var plivo = require('plivo');
var config = require('config');
var authId = config.get('Plivo').authId;
var authToken = config.get('Plivo').authToken;
var src = config.get('Plivo').phoneNumber;

var NotifierUtility = require('./notifierutility');
var notifierUtility = new NotifierUtility();

var client = plivo.RestAPI({
  authId: authId,
  authToken: authToken
});

module.exports = {
  sendText: function(toNumber, message, cb) {
    toNumber = notifierUtility.fixPhoneNumbers(toNumber, 'Plivo');

    var params = {
      src: src,
      dst: toNumber,
      text: message,
      method: 'GET'
    };

    client.send_message(params, function(code, response) {
      var err = null;
      if (code >= 400) {
        err = {
          code: code
        };
      }
      return cb(err, response);
    });
  },

  sendVoice: function(toNumber, message, cb) {
    toNumber = notifierUtility.fixPhoneNumbers(toNumber, 'Plivo');
    var url = notifierUtility.buildVoiceUrl(message, 'Plivo');

    var params = {
      from: src,
      to: toNumber,
      answer_url: url,
      answer_method: 'GET'
    };

    client.make_call(params, function(code, response) {
      var err = null;
      if (code >= 400) {
        err = {
          code: code
        };
      }
      return cb(err, response);
    });
  }
};