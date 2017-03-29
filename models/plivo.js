const plivo = require('plivo');
const config = require('config');

const authId = config.get('Plivo').authId;
const authToken = config.get('Plivo').authToken;
const src = config.get('Plivo').phoneNumber;

const client = plivo.RestAPI({
    authId: authId,
    authToken: authToken
});

const Plivo = class Plivo {
    sendText(toNumber, message, cb) {
        const notifierUtility = new NotifierUtility();
        toNumber = notifierUtility.fixPhoneNumbers(toNumber, 'Plivo');

        let params = {
            src: src,
            dst: toNumber,
            text: message,
            method: 'GET'
        };

        client.send_message(params, (code, response) => {
            let err = null;
            if (code >= 400) {
                err = {
                    code: code
                };
            }
            return cb(err, response);
        });
    }

    sendVoice(toNumber, message, cb) {
        const notifierUtility = new NotifierUtility();
        toNumber = notifierUtility.fixPhoneNumbers(toNumber, 'Plivo');
        let url = notifierUtility.buildVoiceUrl(message, 'Plivo');

        let params = {
            from: src,
            to: toNumber,
            'answer_url': url,
            'answer_method': 'GET'
        };

        client.make_call(params, (code, response) => {
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

module.exports = Plivo;
const NotifierUtility = require('./notifierutility');
