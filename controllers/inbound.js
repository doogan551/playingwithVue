var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var utility = require('../models/utility');

router.post('/email', function (req, res, next) {
	// Our SMTP server relays incoming email to this url; this isn't a traditional
	// mailbox, but the server does utilize a short term queue mechanism in case 
	// delivery fails.

	// Coming soon we'll support alarm acknowledgment by email reply. Until then
	// we'll just acknowledge the http post

	return utils.sendResponse(res);

	/*
	var data = req.body;
	var getUser = function (email, cb) {
			var criteria = {
					collection: 'Users',
					query: {
						'Contact Info.Value.Value': email
					}
				};
			utility.getOne(criteria, cb);
		};
	
	if ((typeof data === 'object') && data.hasOwnProperty('msg_from')) {
		getUser(data.msg_from, function (err, user) {
			if (!!!err && !!user) {	// user is null if not found

			}
		});
	}
	*/
});

module.exports = router;