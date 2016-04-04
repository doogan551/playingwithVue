var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var utility = require('../models/utility');

router.get('/twilioAlarmXml', function (req, res, next) {
	// This route is called with URL parameters 'policyId', 'threadId', 'userId'
	var query = req.query,
		id = query && query.id,
		xml = '<?xml version="1.0" encoding="UTF-8"?>';

	// res.redirect('https://demo.twilio.com/welcome/voice/');

	if (!!id) {
		res.set('Content-Type', 'text/xml'); // or application/xml??
		// TODO create the xml
		res.send(xml);
	}
});

module.exports = router;