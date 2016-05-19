var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var utility = require('../models/utility');
var async = require('async');
var config = require('config');
var logger = require('../helpers/logger')(module);
var Config = require('../public/js/lib/config.js');
var ObjectID = require('mongodb').ObjectID;
var Notifier = require('../models/notifierutility');
var alarmUtility = require('../models/alarm.js');

var notifier = new Notifier();

var infoscanConfig = config.get('Infoscan');
var alarmsEmailAccount = infoscanConfig.email.accounts.alarms;
var alarmsEmailAddress = alarmsEmailAccount + '@' + infoscanConfig.domains[0];

var enums = Config.Enums;
var ackStatuses = enums['Acknowledge Statuses'];
var accessFlags = enums['Access Flags'];

var handler = {
		email: {}
	};
handler.email[alarmsEmailAddress] = function (relay_message) {
	var getHeader = function (name) {
			var headers = relay_message.content.headers,
				len = (headers && headers.length) || 0,
				i,
				obj;

			for (i = 0; i < len; i++) {
				// Headers is an array of objects; each object has only 1 key-value pair. We're
				// looking for the object that has the key equal to our name variable
				if (headers[i][name]) {
					return headers[i][name];
				}
			}
			return '';
		};

	// Our waterfall functions are defined after the waterfall callback
	async.waterfall([
		getUser,
		getAlarm,
		getGroups,
		checkUserPermissions,
		ackAlarm
	], function (err, data) {
		var msgId = getHeader('Message-ID');

		if (err || data.err) {
		} else {
		}

		// http://wesmorgan.blogspot.com/2012/07/understanding-email-headers-part-ii.html
		notifier.sendEmail({
			to: relay_message.msg_from,
			fromAccount: alarmsEmailAccount,
			subject: 'RE: ' + relay_message.content.subject,
			html: 'Got your email! <hr> <p>' + relay_message.content.text + '</p>',
			generateTextFromHTML: true,
			inReplyTo: msgId,
			references: msgId
		});
	});

	function getUser (cb) {
		var data = {},
			criteria = {
				collection: 'Users',
				query: {
					'Contact Info.Value.Value': relay_message.msg_from
				}
			};

		utility.getOne(criteria, function (err, user) {
			if (err) {
				return cb(err);
			}
			data.user = user;
			if (!user) {
				data.err = 'Unauthorized';
			}
			cb(null, data);
		});
	}
	function getAlarm (data, cb) {
		if (data.err) {
			return cb(null, data);
		}

		// If we arrived here we have a valid user with sufficient permissions to acknowledge

		// Our alarm id is in the email body sandwiched between 'handlebar' characters
		var text = relay_message.content.text,
			criteria = {
				collection: 'Alarms'
			},
			alarmId;

		alarmId = text && text.split('{')[1];
		alarmId = alarmId && alarmId.split('}')[0];

		if (alarmId) {
			criteria.query = {
				_id: ObjectID(alarmId)
			};

			utility.getOne(criteria, function (err, alarm) {
				if (err) {
					return cb(err);
				}
				data.alarm = alarm;
				
				if (!alarm) {
					data.err = 'Invalid alarm id';
				} else if (alarm.ackStatus === ackStatuses.Acknowledged) {
					data.err = 'Alarm already acknowledged by ' + alarm.ackUser;
				} else if (alarm.ackStatus !== ackStatuses['Not Acknowledged']) {
					data.err = 'Alarm is not acknowledgable';
				}
				cb(null, data);
			});
		} else {
			data.err = 'Alarm id not found';
			cb(null, data);
		}
	}
	function getGroups (data, cb) {
		if (data.err || data.user['System Admin'].Value) {
			return cb(null, data);
		}
		
		var criteria = {
				collection: 'User Groups'
			};

		utility.get(criteria, function (err, groups) {
			if (err) {
				return cb(err);
			}
			data.groups = groups;
			
			// Generate a groups object
			data.groupsObj = {};
			groups.forEach(function (group) {
				data.groupsObj[group._id] = group;
			});

			cb(null, data);
		});
	}
	function checkUserPermissions (data, cb) {
		if (data.err || data.user['System Admin'].Value) {
			return cb(null, data);
		}

		var userId = data.user._id,
			security = data.alarm.Security,
			group,
			i, len;
			
		for (i = 0, len = security.length; i < len; i++) {
			group = data.groupsObj[security[i]];
			if (group && group.Users[userId]) {
				if (group._pAccess & accessFlags.Acknowledge) {
					return cb(null, data);
				}
			}
		}
		// If we arrived here our user doesn't have acknowledge permissions on this point
		data.err = 'Unauthorized';
		cb(null, data);
	}
	function ackAlarm (data, cb) {
		if (data.err) {
			return cb(null, data);
		}

		var criteria = {
			ids: [alarm._id],
			username: data.user.username
		};

		alarmUtility.acknowledgeAlarm(criteria, function (err, result) {
			cb(err, data);
		});
	}
};

router.post('/email', function (req, res, next) {
	// Our SMTP server relays incoming email to this url; the server isn't a traditional
	// mailbox in that it doesn't store our messages, but it does utilize a short term queue 
	// mechanism in case delivery fails. Again, our SMTP server is actually just a relay -
	// emails to our SMTP server are redirected to this url and our req.body object contains the
	// the email information

	// Always respond so our SMTP server doesn't resend this message
	utils.sendResponse(res);

	var body = req.body,
		data = Array.isArray(body) ? body[0]:null,
		relay_message = data && data.msys && data.msys.relay_message,
		content = relay_message && relay_message.content,
		to = content && content.to[0],
		_handler = to && handler.email[to];

	// If we have a handler for this 'mailbox'
	if (!!_handler) {
		_handler(relay_message);
	}
});

module.exports = router;
