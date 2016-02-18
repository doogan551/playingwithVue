var Utility = require('../models/utility');

var cronRunning = false,
	tempAlarmQueue = [],
	actions = {
		scheduledTasks: {
			getAll: function (callback) {
				var query = {
						collection: 'NotifyScheduledTasks'
					};
				Utility.get(query, callback);
			},
			update: function () {

			},
			process: function () {

			}
		},
		policies: {
			get: function (idList, callback) {
				var query = {
						collection: 'NotifyPolicies',
						_id: {
							$in: idList
						}
					};
				Utility.get(query, callback);
			},
			getAll: function (callback) {
				var query = {
						collection: 'NotifyPolicies'
					};
				Utility.get(query, callback);
			},
			update: function () {

			},
			process: function () {

			},
			findPolicy: function (id, policies) {
				for (var i, len = policies.length; i < len; i++) {
					if (policies[i].id === id) {
						return policies[i];
					}
				}
			},
			processThread: function () {

			}
		},
		alarmQueue: {
			getAll: function (callback) {
				var query = {
						collection: 'NotifyAlarmQueue'
					};
				Utility.get(query, callback);
			},
			add: function () {

			},
			removeAll: function () {

			},
			process: function (data) {
				var pLookup,
					entry,
					processNew = function (policyID) {
						var policy = pLookup[policyID],
							thread = !!policy && actions.common.processNew(entry, policy);
						// 'thread' will be a thread object or a boolean false indicating do not add to policy
						if (!!thread) {
							policy.threads.push(thread);
						}
					},
					processReturn = function (policyID) {
						var policy = pLookup[policyID];
						if (!!policy) {
							actions.alarmQueue.processReturn(entry, policy);
						}
					};

				// Build policy lookup table
				pLookup = actions.common.buildPolicyLookupTable(data.policies);

				// Process the queue
				data.alarmQueue.forEach(function (_entry) {
					entry = _entry;
					if (entry.type === "return") {
						entry.policyIDs.forEach(processReturn);
					} else if (entry.type === "new") {
						// An entry can have multiple policies - process all of them
						entry.policyIDs.forEach(processNew);
					}
				});
			},
			processReturn: function () {

			}
		},
		// common or non-categorized
		common: {
			processIncomingAlarm: function () {

			},
			processNew: function () {

			},
			processImmediate: function () {

			},
			doNotifications: function () {

			},
			buildPolicyLookupTable: function (policies) {
				var len = policies.length,
					obj = {},
					policy,
					i;
				for (i = 0; i < len; i++) {
					policy = policies[i];
					obj[policy.id] = policy;
				}
				return obj;
			}
		}
	};

function notifyManager () {
	var tbd = null,
		terminate = function (err) {
			// logs
			cronRunning = false;
		};

	// Do scheduled task stuff

	cronRunning = true;

	async.series({
		policies: actions.policies.getAll,
		alarmQueue: actions.alarmQueue.getAll
	}, function (err, data) {
		if (err) {
			terminate(err);
			return;
		}
		actions.alarmQueue.process(data);
		actions.policies.process(data.policies);

		// all done
		terminate(null);
	});
}

module.exports = {

};


/*
getScheduledTasks = function (callback) {
	actions.scheduledTasks.getAll(function (err, results) {
		scheduledTasks = results;
		callback(err);
	});
},
getPolicies = function (callback) {
	actions.policies.getAll(function (err, results) {
		policies = results;
		callback(err);
	});
},
getAlarmQueue = function (callback) {
	actions.alarmQueue.getAll(function (err, results) {
		alarmQueue = results;
		callback(err);
	});
};
*/

/*
module.exports = {
	hasNotifications: function(alarm, cb) {
		var doSend = false;
		Utility.getOne({
			collection: 'points',
			query: {
				_id: alarm.upi
			}
		}, function(err, point) {
			var pointAlarms = point['Alarm Messages'];
			for (var i = 0; i < pointAlarms.length; i++) {
				if (alarm.msgType === pointAlarms[i].msgType && !!pointAlarms[i].notify) {
					doSend = true;
				}
			}
			return cb(err, doSend);
		});
	},
	checkPolicies: function(alarm, callback) {
		var policies = [{
			number: '13364694547',
			type: 6,
			ack: true,
			email: 'rkendall@dorsett-tech.com'
		}, {
			number: '13364690900',
			type: 0,
			ack: true,
			email: 'jroberts@dorsett-tech.com'
		}];

		callback(null, policies);
	}
};
*/
