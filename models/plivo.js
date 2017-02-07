let plivo = require('plivo');
let config = require('config');
let authId = config.get('Plivo').authId;
let authToken = config.get('Plivo').authToken;
let src = config.get('Plivo').phoneNumber;

let NotifierUtility = require('./notifierutility');
let notifierUtility = new NotifierUtility();

let client = plivo.RestAPI({
    authId: authId,
    authToken: authToken
});

module.exports = {
    sendText: function (toNumber, message, cb) {
        toNumber = notifierUtility.fixPhoneNumbers(toNumber, 'Plivo');

        let params = {
            src: src,
            dst: toNumber,
            text: message,
            method: 'GET'
        };

        client.send_message(params, function (code, response) {
            let err = null;
            if (code >= 400) {
                err = {
                    code: code
                };
            }
            return cb(err, response);
        });
    },

    sendVoice: function (toNumber, message, cb) {
        toNumber = notifierUtility.fixPhoneNumbers(toNumber, 'Plivo');
        let url = notifierUtility.buildVoiceUrl(message, 'Plivo');

        let params = {
            from: src,
            to: toNumber,
            'answer_url': url,
            'answer_method': 'GET'
        };

        client.make_call(params, function (code, response) {
            let err = null;
            if (code >= 400) {
                err = {
                    code: code
                };
            }
            return cb(err, response);
        });
    }
};
