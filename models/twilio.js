let https = require('https');
let async = require('async');
let xml2js = require('xml2js');
let config = require('config');
let logger = require('../helpers/logger')(module);
let accountSid = config.get('Twilio').accountSid;
let authToken = config.get('Twilio').authToken;
let phoneNumbers = config.get('Twilio').phoneNumbers;
let numNumbers = phoneNumbers.length;
let smsNumberIndex = 0;
let voiceNumberIndex = 0;

let client = require('twilio')(accountSid, authToken);

// https://api.twilio.com/2010-04-01/Accounts/
let Twilio = class Twilio {
    sendText(toNumber, message, cb) {
        let fromNumber = phoneNumbers[smsNumberIndex++];

        if (smsNumberIndex >= numNumbers) {
            smsNumberIndex = 0;
        }

        client.sendMessage({
            to: toNumber,
            from: fromNumber,
            body: message.toString()
        }, cb);
    }

    sendVoice(options, cb) {
        options.from = phoneNumbers[voiceNumberIndex++];

        if (voiceNumberIndex >= numNumbers) {
            voiceNumberIndex = 0;
        }

        client.makeCall(options, cb);
    }

    getLogs(type, cb) {
        let url = 'https://' + accountSid + ':' + authToken + '@api.twilio.com/2010-04-01/Accounts/' + accountSid + '/' + type;
        https.get(url, (res) => {
            let xml = '';
            res.on('data', (chunk) => {
                xml += chunk;
            });
            res.on('end', () => {
                self.parseXml(xml, (err, result) => {
                    if (!!result.TwilioResponse.RestException) {
                        return cb(result.TwilioResponse.RestException, null);
                    }
                    return cb(null, result.TwilioResponse);
                });
            });
        }).on('error', (error) => {
            logger.info('err', error);
        });
    }

    getMessages() {
        this.getLogs('Messages', (err, xml) => {
            if (err) {
                logger.error(err);
            }
            let messages = xml.Messages[0].Message;
            messages.forEach((msg) => {
                if (msg.To.indexOf('from') > -1) {
                    logger.info(msg.Body);
                }
            });
        });
    }

    getCalls() {
        this.getLogs('Callss', (err, xml) => {
            if (err) {
                logger.error(err);
            }
            let calls = xml.Calls[0].Call;
            logger.info(calls);
            calls.forEach((call) => {
                if (call.To.indexOf('from') > -1) {
                    logger.info(call);
                }
            });
        });
    }

    parseXml(xml, cb) {
        xml2js.parseString(xml, cb);
    }

    transferNumbers(data, cb) {
        // This transfers phone numbers between Twilio subaccounts, or between a subaccount and the master accoun=>t
        // data is expected to be an object with keys fromAccountSid (string), toAccountSid (string), and numberSids (array of strings)
        // cb is optional
        // Twilio's documentation for this API is here: https://www.twilio.com/docs/api/rest/subaccounts

        // !!!!!! The Twilio client must be authenticated using the master account credentials to perform this         //        The data object may optionally include the master account credential=>s

        let numberSids = Array.isArray(data.numberSids) && data.numberSids;
        let fromAccountSid = data.fromAccountSid;
        let toAccountSid = data.toAccountSid;
        let results = [];
        let localClient;
        let transfer = (numberSid, callback) => {
            let number = (localClient || client).accounts(fromAccountSid).incomingPhoneNumbers(numberSid);
            let msg;

            number.update({
                accountSid: toAccountSid
            }, (err, result) => {
                if (err) {
                    msg = 'The number associated with sid "' + numberSid + '" was NOT transferred due to an error';
                } else {
                    msg = 'Number ' + result.phone_number + ' transferred successfully';
                }
                logger.info(msg);

                results.push({
                    numberSid: numberSid,
                    msg: msg,
                    result: result,
                    err: err
                });

                // Callback with no error (continue transferring numbers even if we had an error)
                callback(null);
            });
        };

        // Make sure the callback is defined
        cb = cb || (() => {});

        if (!numberSids) {
            return cb('Property "numberSids is not present or invalid (should be an array)');
        }

        if (data.masterAccountSid && data.masterAuthToken) {
            localClient = require('twilio')(data.masterAccountSid, data.masterAuthToken);
        }

        async.each(numberSids, transfer, (err) => {
            return cb(null, results);
        });
    }
};

module.exports = Twilio;
