var bcrypt = require('bcrypt-nodejs');
var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);
var utils = require('../helpers/utils');

module.exports = {

	saveWorkspace: function(data, cb) {
		var workspace = data.Workspace;
		var id = new BSON.ObjectID(data.userid);

		var criteria = {
			collection: 'Users',
			query: {
				_id: id
			},
			updateObj: {
				$set: {
					Workspace: workspace
				}
			}
		};

		Utility.update(criteria, cb);
	},

	resetPassword: function(data, cb) {
		var username = data.username;
		var oldPass = data.oldPass;
		var newPass = utils.encrypt(data.newPass);

		var criteria = {
			collection: 'Users',
			query: {
				username: {"$regex": new RegExp(['^', username, '$'].join(''), 'i')}
			}
		};

		Utility.getOne(criteria, function(err, user) {
			if (!user) {
				return cb('User not found');
			}
			if (!!err) {
				return cb(err);
			}

			bcrypt.compare(oldPass, user.Password.Value, function(err, result) {
				if (!!err) {
					return cb(err);
				}
				if (!result) {
					return cb("Current password and old password do not match");
				} else {
					criteria = {
						collection: 'Users',
						query: {
							username: {"$regex": new RegExp(['^', username, '$'].join(''), 'i')}
						},
						updateObj: {
							$set: {
								"Password.Value": newPass,
								"Password Reset.Value": false
							}
						}
					};
					Utility.update(criteria, cb);
				}
			});
		});
	}
};