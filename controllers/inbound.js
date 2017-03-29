let express = require('express');
let router = express.Router();
let utils = require('../helpers/utils.js');
let config = require('config');
let Inbound = new(require('../models/inbound'))();

let twilioConfig = config.get('Twilio');

router.post('/sparkpost', function (req, res, next) {
    // Our SMTP server relays incoming email to this url; the server isn't a traditional
    // mailbox in that it doesn't store our messages, but it does utilize a short term queue
    // mechanism in case delivery fails.

    // Always respond so our SMTP server doesn't resend this message
    utils.sendResponse(res);
    // Process the email
    Inbound.sparkpost(req.body);
});

router.post(twilioConfig.voice.alarms.Url, function (req, res, next) {
    Inbound.twilioVoiceAlarmsAnswer(req.body, function (xmlResponse) {
        res.set('Content-Type', 'text/xml');
        res.send(xmlResponse);
    });
});

router.post(twilioConfig.voice.alarms.StatusCallback, function (req, res, next) {
    // We always positively respond to this request regardless of the operation outcome
    // (Twilio logs an error in our account if this URL is unreachable)
    utils.sendResponse(res);
    // Process the status update
    Inbound.twilioVoiceAlarmStatus(req.body);
});

module.exports = router;
