// threads: [{
	//     id: 123123123,
	//     trigger: {
	//         upi: 12345,
	//         alarmId: 123123123,
	//         msgCat: 1,
	//         msgType: 1,
	//         msgText: '',
	//         timestamp: 123123123,
	//         almClass: 1
	//     },
	//     returnNormal: { // only present if status.isReturnedNormal is true
	//         message: '',
	//         timestamp: 123123123
	//     },
	//     status: {
	//         isAcknowledged: false,
	//         isReturnedNormal: false,
	//         isWaitingReturnNormal: false
	//     },
	//     notifyQueue: [{
	//         userId: 123456789,
	//         nextAction: 1231231234,
	//         type: SMS,
	//         info: '3366792126'
	//     }, {
	//         userId: 123456789,
	//         nextAction: 1212121,
	//         type: VOICE,
	//         info: '3366792126'
	//     }],
	//     alertGroups: [{
	//         counter: 0,
	//         repeatTime: 0,
	//         repeatConfig: {
	//             enabled: true,
	//             repeatCount: 0
	//         },
	//         escalations: [{
	//             counter: 0,
	//             lastAction: 0,
	//             nextAction: 0,
	//             recepients: [], // list of user id's
	//             alertStyle: 'Sequenced',
	//             recepientIndex: 0,
	//             recepientAlertDelay: 0,
	//             escalationDelay: 0,
	//             repeatConfig: {
	//                 enabled: false,
	//                 count: 0
	//             }
	//         }]
	//     }],
	//     recepientHistory: [{
	//         userId: 12c45a9f7,
	//         type: SMS,
	//         info: 3366792126
	//     }, {
	//         userId: 12c45a9f7,
	//         type: EMAIL,
	//         info: support@dorsett-tech.com
	//     }, {
	//         userId: 321a35b21,
	//         type: SMS,
	//         info: 3366792122
	//     }],
	//     notifyReturnNormal: false
	// }]













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
		utility.getOne({
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
var async = require('async'),
	utility = require('../models/utility'),
	utils = require('../helpers/utils'),
	calendar = require('../models/calendar'),
	Config = require('../public/js/lib/config.js'),
	cronJob = require('../models/cronjob'),
	// oplog = require('../socket/oplog.js'),
	ObjectId = require('mongodb').ObjectID,
	logger = require("../helpers/logger")(module);

var alarmsCollection = utils.CONSTANTS("alarmsCollection");

var	enums = Config.Enums,
	revEnums = Config.revEnums,
	alarmClassRevEnums = revEnums['Alarm Classes'],
	alarmClassEnums = enums['Alarm Classes'],
	alarmCategoryEnums = enums['Alarm Categories'],
	maintenanceCategoryEnum = alarmCategoryEnums.Maintenance.enum,
	ackStatusEnums = enums['Acknowledge Statuses'],
	isAcknowledgedEnum = ackStatusEnums.Acknowledged.enum,
	alarmTypesEnums = enums['Alarm Types'],
	returnToNormalEnumsObj = (function () {
		var returnCat = alarmCategoryEnums.Return.enum,
			obj = {},
			entry,
			alarmType;
		for (alarmType in alarmTypesEnums) {
			entry = alarmTypesEnums[alarmType];
			if (entry.cat === returnCat)
				obj[entry.enum] = alarmType;
		}
		return obj;
	})();

var	ADDED = 1,		// Thread states
	UPDATED = 2,
	DELETED = 3,
	NEW = 1,		// Queue entry types
	RETURN = 2,
	SMS = 1,		// Notification types
    EMAIL = 2,
    VOICE = 3,
	MSPM = 60000;	// Number of milliseconds per minute

var daysOfWeek = ['sun', 'mon', 'tues', 'wed', 'thur', 'fri', 'sat']; // Entries correspond to Date().getDay()

var dbAlarmQueueLocked = false,
	lastCronRun = 0,
	lastCronProcessingTime = 0,
	tempAlarmQueue = [],
	actions = {
		calendar: {
			dbGetHolidaysObj: function (cb) {
				// TEST
				if (selfTest.enabled && !selfTest.useDb.holidays) {
					return cb(null, selfTest.holidays);
				}
				// end TEST

				var query = {
						year: new Date().getFullYear()
					};
				calendar.getYear(query, function (err, result) {
					if (err) {
						return cb(err);
					}
					var obj = {},
						key,
						entry,
						dates;
					dates = (result[0] && result[0].dates) || [];
					for (var i = 0, len = dates.length; i < len; i++) {
						entry = dates[i];
						key = [entry.month, entry.date].join('-');
						obj[key] = entry.comment;
					}
					cb(null, obj);
				});
			},
			isHoliday: function (info) {
				// info is an object with keys: policy, queueEntry, and data
				var date = info.data.date,
					todaysDate = [date.getMonth()+1, date.getDate()].join('-');
				return (info.data.holidaysObj.hasOwnProperty(todaysDate));
			}
		},
		scheduledTasks: {
			dbGetAll: function (cb) {
				// TEST
				if (selfTest.enabled && !selfTest.useDb.scheduledTasks) {
					return cb(null, selfTest.sceduledTasks);
				}
				// end TEST

				var query = {
						collection: 'NotifyScheduledTasks'
					};
				utility.get(query, cb);
			},
			dbUpdate: function (data, cb) {
				// TODO

			},
			process: function () {
				// TODO

			}
		},
		policies: {
			dbGet: function (idList, cb) {
				// TEST
				if (selfTest.enabled && !selfTest.useDb.policies) {
					return cb(null, selfTest.policies.filter(function (policy) {
						return !!~idList.indexOf(policy._id);
					}));
				}
				// end TEST

				var objectIdList = idList.map(function (id) {
						return ObjectId(id);
					}),
					criteria = {
						collection: 'NotifyPolicies',
						query: {
							_id: {
								$in: objectIdList
							}
						}
					};
				utility.get(criteria, cb);
			},
			dbGetAll: function (cb) {
				// TEST
				if (selfTest.enabled && !selfTest.useDb.policies) {
					return cb(null, selfTest.policies);
				}
				// end TEST
				var criteria = {
						collection: 'NotifyPolicies',
					};
				utility.get(criteria, cb);
			},
			dbUpdate: function (data, cb) {
				// TEST
				if (selfTest.enabled && !selfTest.useDb.policies) {
					return cb(null, data);
				}
				// end TEST

				// TODO
				cb(null, data);

			},
			process: function (data, cb) {
				actions.utility.log('policies.process'); // DEBUG
				function processPolicy (policy, policyCB) {
					function processThread (thread, threadCB) {
						var info = {
							policy: policy,
							thread: thread,
							data: data
						};
						actions.policies.processThread(info, threadCB);
					}

					async.each(policy.threads, processThread, function (err) {
						policyCB(err);
					});
				}

				async.each(data.policies, processPolicy, function (err) {
					// actions.utility.log(data); // DEBUG
					cb(err, data);
				});
			},
			getAlertConfig: function (policy, id) {
				var alertConfigs = policy.alertConfigs,
					len = alertConfigs.length,
					i;

				for (i = 0; i < len; i++) {
					if (alertConfigs[i].id === id)
						return alertConfigs[i];
				}
				return null;
			},
			getActiveAlertConfigIds: function (info) {
				// info is an object with keys: policy, thread, queueEntry, and data
				var activeAlertConfigIds = [],
					added = {};

				actions.policies.getActiveScheduleLayers(info).forEach(function (scheduleLayer) {
					scheduleLayer.alertConfigs.forEach(function (id) {
						if (!added[id]) {
							added[id] = true;
							activeAlertConfigIds.push(id);
						}
					});
				});
				return activeAlertConfigIds;
			},
			getActiveScheduleLayers: function (info) {
				// info is an object with keys: policy, thread, queueEntry, and data
				var activeScheduleLayers = [],
					date = info.data.date,
					todayIsHoliday = actions.calendar.isHoliday(info),
					curDay = daysOfWeek[date.getDay()],
					getMinutes = function () {
						var minutes = date.getMinutes();
						return ((minutes < 10) ? '0' + minutes : minutes);
					},
					inScheduledTime = function (schedule) {
						var startTime = schedule.startTime,
							endTime = schedule.endTime;

						if (schedule.allDay) {
							return true;
						} else if (startTime > endTime) {
							if (curTime > startTime || curTime < endTime)
								return true;
						} else if (startTime < endTime) {
							if (curTime > startTime && curTime < endTime)
								return true;
						}
						return false;
					},
					curTime = parseInt([date.getHours(), getMinutes()].join(''), 10);

				info.policy.scheduleLayers.forEach(function (scheduleLayer) {
					var found = false,
						schedule;
					for (var i = 0, len = scheduleLayer.schedules.length; i < len && !found; i++) {
						schedule = scheduleLayer.schedules[i];

						if (todayIsHoliday) {
							if (schedule.holidays && inScheduledTime(schedule)) {
								found = true;
							}
						} else if (!!~schedule.days.indexOf(curDay) && inScheduledTime(schedule)) {
							found = true;
						}
						if (found) {
							activeScheduleLayers.push(scheduleLayer);
						}
					}
				});
				return activeScheduleLayers;
			},
			// Not used
			getPolicy: function (policies, id) {
				var len = policies.length,
					i;
				for (i = 0; i < len; i++) {
					if (policies[i]._id === id) {
						return policies[i];
					}
				}
				return null;
			},
			getPolicyLookupTable: function (policies) {
				var obj = {},
					len = policies.length,
					policy,
					i;
				for (i = 0; i < len; i++) {
					policy = policies[i];
					obj[policy._id] = policy;
				}
				return obj;
			},
			// Thread functions
			processThread: function (info, cb) {
				// info is an object with keys: policy, thread, data
				var thread = info.thread,
					isUpdated = false,
					recepientHistoryLength = thread.recepientHistory.length,
					now = info.data.now,
					notifyLookup = null,
					doNotifyReturnNormal = false,
					doNotifyAlarmMutated = false,
					notifyAlarmStateChange = function (change) {
						var i,
							history,
							key;

						// If the alarm changed state (return to normal or a new alarm state), we immediately notify 
						// this thread's recepient history of the state change using all of the methods by which they have 
						// already been notified
						for (i = 0; i < recepientHistoryLength; i++) {
							history = thread.recepientHistory[i];
							key = [history.userId, history.type, history.info].join('');
							
							// We'll only alert the user of the alarm state change if they
							// don't already have a notification of this type in the queue,
							// or if they do but it's not scheduled until later
							if (!(notifyLookup.hasOwnProperty(key)) || notifyLookup[key].nextAction > now) {
								thread.notifyQueue.push({
									userId: history.userId,
									nextAction: now,
									type: history.type, // email, voice, sms
									info: history.info, // phone number or email
									change: change
								});
								isUpdated = true;
							}
						}
					},
					getNotifyLookup = function () {
						var notifyQueue = thread.notifyQueue,
							key,
							notify,
							obj = {};
						for (var i = 0, len = notifyQueue.length; i < len; i++) {
							notify = notifyQueue[i];
							key = [notify.userId, notify.type, notify.info].join('');
							obj[key] = notify;
						}
						return obj;
					},
					addNotifications = function (userIds) {
						var len = userIds.length,
							alarmClassName = alarmClassRevEnums[thread.trigger.almClass],
							i,
							j,
							jlen,
							userId,
							user,
							userAlerts,
							userAlert,
							key,
							notification;

						for (i = 0; i < len; i++) {
							userId = userIds[i];
							user = info.data.usersObj[userId];
							userAlerts = (user && user.alerts[alarmClassName] || user.alerts.Normal) || [];

							for (j = 0, jlen = userAlerts.length; j < jlen; j++) {
								userAlert = userAlerts[j];
								key = [userId, userAlert.type, userAlert.info].join('');
								
								// If we don't already have a notification like this queued up
								if (!notifyLookup.hasOwnProperty(key)) {
									notification = {
										userId: userId,
										nextAction: actions.utility.getTimestamp(info, userAlert.delay),
										type: userAlert.type, // email, voice, sms
										info: userAlert.info // phone number or email
									};
									thread.notifyQueue.push(notification);
									notifyLookup[key] = notification;
									isUpdated = true;
								}
							}
						}
					},
					processEscalation = function (escalation) {
						if (escalation.alertStyle === 'Everyone') {
							addNotifications(escalation.recepients);
							escalation.counter--;
						} else if (escalation.alertStyle === 'FirstResponder') {
							addNotifications([escalation.recepients[0]]);
							escalation.counter--;
						} else {	// Sequenced
							addNotifications([escalation.recepients[escalation.recepientIndex]]);
							
							if (++escalation.recepientIndex >= escalation.recepients.length) {
								escalation.counter--;
								escalation.recepientIndex = 0;
							}
						}

						if (escalation.counter > 0) {
							escalation.nextAction += actions.utility.getTimestamp(info, escalation.recepientAlertDelay);
						} else if (escalation.reset) {
							escalation.reset = false;
							escalation.counter = actions.policies.getThreadCounter(escalation.repeatConfig);
							escalation.nextAction = actions.utility.getTimestamp(info, escalation.reverseEscalationDelay) - now - escalation.resetTimestamp;
						}

						isUpdated = true;
						escalation.lastAction = now;
					},
					processAlertGroup = function (alertGroup) {
						var resetEscalations = false;

						// If the alert group is ready to repeat
						if (alertGroup.counter && now >= alertGroup.repeatTimestamp) {
							resetEscalations = true;
							if (--alertGroup.counter) {
								alertGroup.repeatTimestamp = actions.thread.getTimestamp(info, alertGroup.repeatConfig.repeatTime);
							}
							isUpdated = true;
						}

						alertGroup.escalations.forEach(function (escalation, index) {
							// If the alert group has escalated through all escalations
							if (resetEscalations) {
								// If the escalation is finished (an escalation can can continue spinning while the alert continues to escalate)
								if (escalation.counter === 0) {
									// Reset the escalation counter and nextAction so it will begin notifying again
									escalation.counter = actions.policies.getThreadCounter(escalation.repeatConfig);
									escalation.nextAction = actions.utility.getTimestamp(info, escalation.reverseEscalationDelay);
								} else { // Escalation is still running
									// We'll let the escalation continue to run; the escalation will look @ the
									// reset flag when it finishes and update it's own counter and nextAction
									escalation.reset = true;
									escalation.resetTimestamp = now;
								}
							}
							// Process if counter is non-zero (escalation NOT finished), and it's time to process it
							if (escalation.counter && (escalation.nextAction >= now)) {
								processEscalation(escalation);
							}
						});
					};

				// Return if thread was deleted
				if (thread._state === DELETED) {
					return cb();
				}
				// Return if waiting for normal
				if (thread.status.isWaitingReturnNormal) {
					if (thread.status.isReturnedNormal) {
						doNotifyReturnNormal = true;
						actions.policies.setThreadState(thread, DELETED);
						thread._notifyReturnBeforeDelete = true;
					}
					return cb();
				}

				notifyLookup = getNotifyLookup();

				// See if we need to notify recepients of a return to normal condition
				if (thread.notifyReturnNormal && thread.status.isReturnedNormal) {
					thread.notifyReturnNormal = false;
					doNotifyReturnNormal = true;
					isUpdated = true;
				}
				// See if we need to notify recepients of an alarm mutation (going from one alarm state to another)
				if (thread._notifyAlarmMutated) {
					thread._notifyAlarmMutated = false;
					doNotifyAlarmMutated = true;
					isUpdated = true;
				}

				// Get thread acknowledged status & process accordingly
				actions.policies.isThreadAcknowledged(info, function (err, isAcknowledged) {
					if (err) {
						return cb(err);
					}

					if (isAcknowledged) {
						// If the thread doesn't require return normal notification, or if it does but it hasn't happened yet
						if (thread.notifyReturnNormal && recepientHistoryLength) {
							thread.status.isWaitingReturnNormal = true;
							isUpdated = true;
						} else {
							actions.policies.setThreadState(thread, DELETED);
							if (doNotifyReturnNormal) {
								thread._notifyReturnBeforeDelete = true;
							}
						}
					} else {
						// Thread is not acknowledged, process the alert groups
						thread.alertGroups.forEach(processAlertGroup);
					}

					if (recepientHistoryLength) {
						// These notifications need to be added last to ensure we don't double notify someone of the same thing. Ex: 
						// '4473_Temperature Return to normal (3/1 @ 12:30PM)'
						// immediately followed by:
						// '4473_Temperature greater than high limit of 95 (3/1 @ 12:15PM). It returned to normal on 3/1 @ 12:30PM.'
						if (doNotifyReturnNormal) {
							notifyAlarmStateChange('return');
						}
						if (doNotifyAlarmMutated) {
							notifyAlarmStateChange('mutated');
						}
					}

					if (isUpdated) {
						actions.policies.setThreadState(thread, UPDATED);
					}

					return cb();
				});
			},
			createThread: function (info) {
				// info is an object with keys: policy, data, and queueEntry; it may also have 'thread' but it's irrelevant
				var alertConfigIds = actions.policies.getActiveAlertConfigIds(info),
					numberOfAlertConfigIds = alertConfigIds.length,
					queueEntry = info.queueEntry,
					getGroupRepeatTime = function (group) {
						if (!group.repeatConfig.enabled)
							return 0;

						var escalations = group.escalations,
							len = escalations.length,
							time = group.alertDelay,
							i;

						for (i = 0; i < len; i++) {
							time += escalations[i].escalationDelay;
						}
						return time;
					},
					getRecepients = function (members) {
						// members is an array of user ids
						var recepients = [],
							id,
							member,
							memberAlerts;
						for (var i = 0, len = members.length; i < len; i++) {
							id = members[i];
							member = info.data.usersObj[id];
							memberAlerts = member.alerts[alarmClassRevEnums[queueEntry.almClass]] || member.alerts.Normal;
							if (member && member.notificationsEnabled && memberAlerts.length) {
								recepients.push(id);
							}
						}
						return recepients;
					},
					getEscalations = function (group) {
						var escalations = [],
							len = group.escalations.length,
							time = group.alertDelay,
							i,
							recepients,
							groupEscalation;
						
						for (i = 0; i < len; i++) {
							groupEscalation = group.escalations[i];
							recepients = getRecepients(groupEscalation.members);
							if (recepients.length) {
								escalations.push({
									counter: actions.policies.getThreadCounter(groupEscalation.repeatConfig),
									lastAction: 0, // ms
									nextAction: actions.utility.getTimestamp(info, time), // ms
									recepients: recepients,
									alertStyle: groupEscalation.alertStyle,
									recepientIndex: 0,
									recepientAlertDelay: groupEscalation.memberAlertDelay,
									escalationDelay: groupEscalation.escalationDelay, // minutes
									repeatConfig: groupEscalation.repeatConfig,
									reverseEscalationDelay: time - group.alertDelay, // minutes
									reset: false,
									resetTimestamp: 0 // ms
								});
								time += groupEscalation.escalationDelay;
							}
						}
						return escalations;
					},
					getAlertGroups = function () {
						var groups = [],
							alertConfig,
							i,
							j,
							jlen,
							activeAlertGroup,
							getActiveGroupConfig = function (alertConfig) {
								var groups = alertConfig.groups,
									len = groups.length,
									i;
								for (i = 0; i < len; i++) {
									if (groups[i].active) {
										return groups[i];
									}
								}
							},
							getAlertGroup = function (group) {
								var repeatTime;
								// Get the initial repeat time
								repeatTime = getGroupRepeatTime(group); // minutes
								// Add the non-initial repeat time to the repeatConfig object (repeats do not include the initial alert delay)
								group.repeatConfig.repeatTime = repeatTime - group.alertDelay; // minutes
								// Add the group
								return {
									counter: actions.policies.getThreadCounter(group.repeatConfig, true),
									repeatTimestamp: actions.utility.getTimestamp(info, repeatTime), // ms
									repeatConfig: group.repeatConfig,
									escalations: getEscalations(group)
								};
							};

						for (i = 0; i < numberOfAlertConfigIds; i++) {
							alertConfig = actions.policies.getAlertConfig(info.policy, alertConfigIds[i]);
							groups.push(getAlertGroup(getActiveGroupConfig(alertConfig)));
						}
						return groups;
					};

				if (numberOfAlertConfigIds > 0) {
					return {
						id: queueEntry.alarmId, // this will server as our unique id for the lifetime of the thread (even if it mutates)
						trigger: {
							upi: queueEntry.upi,
							alarmId: queueEntry.alarmId,
							msgCat: queueEntry.msgCat,
							msgText: queueEntry.msgText,
							msgType: queueEntry.msgType,
							almClass: queueEntry.almClass,
							timestamp: queueEntry.msgTime * 1000,
							Name1: queueEntry.Name1,
							Name2: queueEntry.Name2,
							Name3: queueEntry.Name3,
							Name4: queueEntry.Name4,
							pointType: queueEntry.pointType,
							Security: queueEntry.Security
						},
						status: {
							isAcknowledged: false,
							isReturnedNormal: false,
							isWaitingReturnNormal: false
						},
						alertGroups: getAlertGroups(),
						notifyQueue: [],
						recepientHistory: [],
						notifyReturnNormal: queueEntry.notifyReturnNormal,
						_state: ADDED,
						_isNew: true
					};
				}
				return null;
			},
			updateThread: function (info) {
				// info is an object with keys: policy, thread, data, and queueEntry
				var thread = info.thread,
					queueEntry = info.queueEntry,
					trigger = thread.trigger,
					status = thread.status,
					key;

				if (thread._state !== ADDED) {
					// Copy trigger to previousTriggers array before we update the trigger
					if (!!!thread.previousTriggers) {
						thread.previousTriggers = [];
					}
					thread.previousTriggers.push({
						timestamp: trigger.timestamp,
						alarmId: trigger.alarmId,
						msgText: trigger.msgText
					});
				}

				// Remove and reset return normal info
				delete thread.returnNormal;
				thread.notifyReturnNormal = info.queueEntry.notifyReturnNormal;

				// Update the trigger
				trigger.alarmId = queueEntry.alarmId;
				trigger.msgText = queueEntry.msgText;
				trigger.msgCat = queueEntry.msgCat;
				trigger.msgType = queueEntry.msgType;
				trigger.almClass = queueEntry.almClass;
				trigger.timestamp = queueEntry.msgTime * 1000;

				// Reset the status flags
				status.isAcknowledged = false;
				status.isReturnedNormal = false;
				status.isWaitingReturnNormal = false;
			},
			mutateThread: function (info) {
				// info is an object with keys: policy, thread, data, and queueEntry

				// The mutated flag is a temporary flag that tells us to notify the recepient history of the new alarm state
				// Delete 'notifyAlarmMutated' key from the thread before writing back out to the database
				info.thread._notifyAlarmMutated = true;
				actions.policies.updateThread(info);
			},
			setThreadState: function (thread, requestedState) {
				var _state = thread._state;
				
				if ((_state === DELETED) || ((requestedState === UPDATED) && (_state === ADDED))) {
					return thread._state;
				}
				thread._state = requestedState;

				return thread._state;
			},
			isThreadActive: function (thread) {
				return ((thread._state !== DELETED) && (thread.trigger.msgCat !== maintenanceCategoryEnum));
			},
			isThreadAcknowledged: function (info, cb) {
				// info is an object with keys policy, thread, data, and sometimes queueEntry
				var thread = info.thread,
					id = thread.alarmId,
					policiesAckList = info.data.policiesAckList,
					query = {
						_id: id
					},
					fields = {
						ackStatus: 1
					};

				if (thread.status.isAcknowledged === true) {
					return cb(null, true);
				}

				if (policiesAckList.hasOwnProperty(id)) {
					return cb(null, policiesAckList[id] === isAcknowledgedEnum);
				}

				// TEST
				if (selfTest.enabled && !selfTest.useDb.alarmAcks) {
					return cb(null, false);
				}
				// end TEST

				utility.getOne({
					collection: alarmsCollection,
					query: query,
					fields: fields
				}, function(err, alarm) { // alarm is null if not found
					var ackStatus = (alarm && alarm.ackStatus) || isAcknowledgedEnum, // If we can't find the alarm (shouldn't happen), we treat it like it has been acknowledged
						isAcknowledged = (ackStatus === isAcknowledgedEnum);
					
					// Save the ack status so we don't search for it again this cycle
					policiesAckList[id] = ackStatus;
					// Update the thread's ackStatus
					thread.status.isAcknowledged = isAcknowledged;

					return cb(err, isAcknowledged);
				});
			},
			getThreadCounter: function (repeatConfig, isGroupConfig) {
				var counter = 1,
					repeatCount = repeatConfig.repeatCount;
				
				if (repeatConfig.enabled) {
					// Group repeats are treated differently than escalation repeats (0 = repeat forever)
					if (isGroupConfig && repeatCount === 0) {
						counter += 999999;	// ~2 years worth @ 1 minute repeat interval
					} else {
						counter += repeatCount;
					}
				}
				return counter;
			},
			getActiveThread: function (threads, upi) {
				var len = threads.length,
					thread,
					i;

				for (i = 0; i < len; i++) {
					thread = threads[i];
					if ((thread.upi === upi) && actions.policies.isThreadActive(thread) === true) {
						return thread;
					}
				}
				return null;
			}
		},
		alarmQueue: {
			dbGetAll: function (cb) {
				// TEST
				if (selfTest.enabled && !selfTest.useDb.alarmQueue) {
					return cb(null, selfTest.alarmQueue);
				}
				// end TEST

				var query = {
						collection: 'NotifyAlarmQueue'
					};
				utility.get(query, cb);
			},
			dbInsert: function (queueEntries, cb) {
				// TEST
				if (selfTest.enabled && !selfTest.useDb.alarmQueue) {
					Array.prototype.push.apply(selfTest.alarmQueue, queueEntries);
					return cb(null);
				}
				// end TEST
				utility.insert(queueEntries, cb);
			},
			dbRemoveAll: function (data, cb) {
				// TEST
				if (selfTest.enabled && !selfTest.useDb.alarmQueue) {
					selfTest.alarmQueue.length = 0;
					data.alarmQueue.length = 0;
					return cb(null, data);
				}
				// end TEST
				
				var criteria = {
						collection: 'NotifyAlarmQueue',
						query: {}
					};
				utility.remove(criteria, cb);
			},
			process: function (data, cb) {
				actions.utility.log(['alarmQueue.processing ', data.alarmQueue.length, ' items'].join('')); // DEBUG
				var policyLookup = actions.policies.getPolicyLookupTable(data.policies);
				
				function alarmQueueIteratee (queueEntry, queueCB) {
					function policyIdsIteratee (policyId, policyCB) {
						var policy = policyLookup[policyId],
							info = {
								queueEntry: queueEntry,
								policy: policy,
								data: data
							};

						if (!!policy) {
							if (queueEntry.type === RETURN) {
								actions.alarmQueue.processReturn(info, policyCB);
							} else if (queueEntry.type === NEW) {
								actions.alarmQueue.processNew(info, policyCB);
							}
						} else {
							policyCB();
						}
					}

					async.eachSeries(queueEntry.policyIds, policyIdsIteratee, function (err) {
						queueCB(err);
					});
				}

				// Process the queue
				async.eachSeries(data.alarmQueue, alarmQueueIteratee, function (err) {
					// actions.utility.log(data); // DEBUG
					cb(err, data);
				});
			},
			processTempAlarmQueue: function (data, cb) {
				cb(null, data);

			},
			processNew: function (info, cb) {
				// info is an object with keys: policy, queueEntry, and data
				var queueEntry = info.queueEntry,
					policy = info.policy,
					thread,
					createNewThread = function () {
						thread = actions.policies.createThread(info);
						if (!!thread) {
							policy.threads.push(thread);
						}
					};

				thread = actions.policies.getActiveThread(policy.threads, queueEntry.upi);
				if (!!thread) {
					// Add the thread to our info object
					info.thread = thread;

					if (thread._state === ADDED) {
						actions.policies.updateThread(info);
						return cb();
					}

					// This is an existing thread. If the alarm has been acknowledged we'll delete this 
					// thread and create another. If the alarm has NOT been acknowledged, we'll mutate
					// the thread.

					// Get isAcknowledged status
					actions.policies.isThreadAcknowledged(info, function (err, isAcknowledged) {
						if (isAcknowledged) {
							actions.policies.setThreadState(info.thread, DELETED);
							createNewThread();
						} else {
							actions.policies.mutateThread(info);
						}
						return cb(err);
					});
				} else {
					createNewThread();
					return cb();
				}
			},
			processReturn: function (info, cb) {
				// info is an object with keys: policy, queueEntry, and data
				var queueEntry = info.queueEntry,
					policy = info.policy,
					thread;

				thread = actions.policies.getActiveThread(policy.threads, queueEntry.upi);
				if (!!thread) {
					thread.status.isReturnedNormal = true;
					thread.returnNormal = {
						timestamp: queueEntry.timestamp,
						msgText: queueEntry.msgText,
						msgType: queueEntry.msgType,
						msgCat: queueEntry.msgCat
					};
				}
				return cb();
			}
		},
		notifications: {
			buildNotifyList: function (data, cb) {
				var policy,
					thread,
					notifyQueue,
					notification,
					isUpdated,
					i, j, k,
					ilen, jlen, klen,
					key,
					getReturnNormals = function (notification) {
						return notification.change === 'return';
					};

				for (i = 0, ilen = data.policies.length; i < ilen; i++) {
					policy = data.policies[i];

					for (j = 0, jlen = policy.threads.length; j < jlen; j++) {
						thread = policy.threads[j];

						// If this thread is slated for delete, we skip it unless we should notify of a return normal before it's deleted
						if ((thread._state === DELETED) && !thread._notifyReturnBeforeDelete)
							continue; // Skip this thread

						if (thread._state === DELETED) {
							// If we arrive here our thread has been deleted, and the only notifications we should do
							// are return to normals
							notifyQueue = thread.notifyQueue.filter(getReturnNormals);
						} else {
							notifyQueue = thread.notifyQueue;
						}

						isUpdated = false;
						for (k = 0, klen = notifyQueue.length; k < klen; k++) {
							notification = notifyQueue[k];

							if (data.now >= notification.nextAction) {
								isUpdated = true;

								// We're going to add thread and policy to our notification object so we don't have to look it up when it is
								// needed later. But we don't want to alter the notification object because this object is part of the thread
								// and is saved to the db.

								// Add it to our notify list
								data.notifyList.push({
									notification: notification,
									policy: policy,
									thread: thread
								});

								// Remove the notification & update our looping variables
								if (thread._state !== DELETED) {
									notifyQueue.splice(k, 1);
									k--;
									klen = thread.notifyQueue.length;
								}
							} else {
								actions.utility.log('type: ' + notification.type + '; nextAction: ' + notification.nextAction);
							}
						}

						if (isUpdated) {
							actions.policies.setThreadState(thread, UPDATED);
						}
					}
				}
				actions.utility.log(['notifications.buildNotifyList:', data.notifyList.length, 'items'].join(' ')); // DEBUG
				cb(null, data);
			},
			sendNotifications: function (data, cb) {
				actions.utility.log('notifications.sendNotifications'); // DEBUG
				// data.notifyList is of the form:
				// [{
				//	notification: {
				//		userId: *,
				//		nextAction: *,
				//		type: *,	// EMAIL, VOICE, SMS
				//		info: *,	// Phone number or email
				//		change: *,	// may or may not be present
				//	},
				//	policy: *,	// object
				//	thread: *	// object
				// }]
				//
				// thread.trigger is of the form:
				// {
				//	upi: queueEntry.upi,
				//	alarmId: queueEntry.alarmId,
				//	msgCat: queueEntry.msgCat,
				//	msgText: queueEntry.msgText,
				//	msgType: queueEntry.msgType,
				//	almClass: queueEntry.almClass,
				//	timestamp: queueEntry.msgTime * 1000,
				//	Name1: queueEntry.Name1,
				//	Name2: queueEntry.Name2,
				//	Name3: queueEntry.Name3,
				//	Name4: queueEntry.Name4,
				//	pointType: queueEntry.pointType,
				//	Security: queueEntry.Security
				// },

				var len = data.notifyList.length,
					userNotifyList = {},
					notifyEntry,
					notification,
					notifyMsg,
					i,
					getNotifyTypeText = function (type) {
						var text;
						if (type === SMS)
							text = 'SMS';
						else if (type === VOICE)
							text = 'VOICE';
						else
							text = 'EMAIL';
						return text;
					},
					formatMinutes = function (minutes) {
						return minutes < 0 ? ('0'+minutes):minutes;
					},
					formatHours = function (hours) {
						return hours > 12 ? (hours - 12):hours;
					},
					getPeriod = function (hours) {
						return hours > 12 ? 'PM':'AM';
					},
					getVoiceMsgDate = function (timestamp) {
						var date = new Date(timestamp);

						if ((date.getMonth() === data.date.getMonth()) && (date.getDate() === data.date.getDate())) {
							return 'occurred today';
						} else {
							return ['occurred on', date.getMonth() + '/' + date.getDate()];
						}
					},
					getMsgDate = function (timestamp, type) {
						var date = new Date(timestamp);
						return [date.getMonth()+1, '/', date.getDate()].join('');
					},
					getMsgTime = function (timestamp) {
						var date = new Date(timestamp),
							hours = date.getHours(),
							minutes = date.getMinutes();
						return [formatHours(hours), ':', formatMinutes(minutes), getPeriod(hours)].join('');
					},
					getAorAn = function (text) {
						return !!~['a', 'e', 'i', 'o', 'u'].indexOf(text.charAt(0)) ? 'an':'a';
					},
					getMessage = function (notifyEntry) {
						var notification = notifyEntry.notification,
							thread = notifyEntry.thread,
							trigger = thread.trigger,
							isNormalAlarmClass = trigger.almClass === alarmClassEnums.Normal.enum,
							alarmClassText = alarmClassRevEnums[trigger.almClass],
							msg = '',
							obj;

						if (notification.type === VOICE) {
							if (!isNormalAlarmClass) {
								msg = ["Hello, this is" + getAorAn(alarmClassText) + alarmClassText + "message from info-scan."].join(' ');
							} else {
								msg = "Hello, this is a message from info-scan.";
							}

							if (!!notification.change && notification.change === 'return') {
								obj = thread.returnNormal;
							} else {
								obj = thread.trigger;
							}
							msg = [msg, obj.msgText, 'occurred', getMsgDate(obj.timestamp), 'at', getMsgTime(obj.timestamp) + '.', 'Thank you and goodbye.'].join(' ');
						} else { // SMS or EMAIL
							if (!isNormalAlarmClass) {
								msg = alarmClassRevEnums[trigger.almClass] + ':';
							}
							msg = [msg, trigger.msgText, '(' + getMsgDate(trigger.timestamp), getMsgTime(trigger.timestamp) + ')'].join(' ');
						}
						return msg;
					};

				for (i = 0; i < len; i++) {
					notifyEntry = data.notifyList[i];
					// Each notifyEntry is of the form
					// {
					//	notification: {}, // Has keys: userId, nextAction, type, info
					//	policy: {},
					//	thread: {}
					// }
					// Keep in mind that notifyEntry.notification is actually a pointer to the notification object on the thread, and any modifications
					// made to this object will be stored in the db. So best not to modify it to make sure it stays slim and trim.
					notification = notifyEntry.notification;

					// We'll also collect notifications by user which can be used to prevent overwhelming the user
					// with too many pages at one time (ex: we could combine messages or simply tell the user he/she has x new alarms to review)
					if (!userNotifyList.hasOwnProperty(notification.userId)) {
						userNotifyList[notification.userId] = [];
					}
					userNotifyList[notification.userId].push(notifyEntry);

					// Get our notify message
					notifyMsg = getMessage(notifyEntry);
					// Save our message for the activity log
					notifyEntry.log = notifyMsg;

					actions.utility.log('\t' + getNotifyTypeText(notification.type) + ' ' + notification.info + ': ' + notifyMsg); // DEBUG
				}
				cb(null, data);
			}
		},
		utility: {
			getTimestamp: function (info, offset) {
				// info is an object with keys: policy, thread, data and probably more
				// info.data.now is in milliseconds; offset is in minutes
				return (info.data.now + (offset * MSPM));
			},
			log: function () {
				for (var i = 0; i < arguments.length; i++) {
					console.log(arguments[i]);
				}
			}
		},
		dbGetAllUsersObj: function (cb) {
			// TEST
			if (selfTest.enabled && !selfTest.useDb.users) {
				return cb(null, selfTest.usersObj);
			}
			// end TEST

			var query = {
					collection: 'Users',
					fields: {
						'First Name': true,
						'Last Name': true,
						'username': true,
						'alerts': true,
						'notificationsEnabled': true,
						'notifyOnAcknowledge': true
					}
				};

			utility.get(query, function (err, users) {
				if (err) {
					return cb(err);
				}
				var user,
					obj = {};

				for (var i = 0, len = users.length; i < len; i++) {
					obj[users[i]._id] = users[i];
				}
				cb(null, obj);
			});
		},
		processIncomingAlarm: function (alarm) {
			actions.utility.log('processing incoming alarm');
			if (!alarm.almNotify) {
				return;
			}

			function getPoint (cb) {
				actions.utility.log('getting point');
				var criteria = {
						collection: 'points',
						query: {
							_id: alarm.upi
						}
					};
				utility.getOne(criteria, function (err, point) {
					cb(err, point);
				});
			}
			function getPointPolicies (point, cb) {
				actions.utility.log('getting point policies');
				var info = {
						point: point,
						policyIds: [],
						policies: {}
					},
					i,
					len,
					policy;
				// TODO learn how policies are stored on the point
				if (point.notifyPolicies.length) {
					actions.policies.get(point.notifyPolicies, function (err, policies) {
						if (err) {
							cb(err);
						}
						for (i = 0, len = policies.length; i < len; i++) {
							policy = policies[i];
							if (policy.enabled) {
								info.policyIds.push(policy._id);
								info.policies[policy._id] = policy;
							}
						}
						return cb(null, info);
					});
				} else {
					return cb(null, info);
				}
			}
			function processPointPolicies (info, cb) {
				actions.utility.log('processing point policies');
				if (info.policyIds.length === 0) {
					cb(null);
				}

				var queueEntry,
					getNotifyReturnNormal = function (alarmMessages) {
						// Maintenance alarms never return normal so we never set the return to normal flag
						// regardless of the point setting
						if (alarm.msgCat === maintenanceCategoryEnum) {
							return false;
						}

						var len = alarmMessages.length,
							alarmMessage,
							i;
						// There can exist more than one 'return to normal' alarm message type on a point,
						// but they should all either be on or off
						for (i = 0; i < len; i++) {
							alarmMessage = alarmMessages[i];
							if (returnToNormalEnumsObj.hasOwnProperty(alarmMessage.msgType)) {
								return alarmMessage.notify; // Return the point's notify setting
							}
						}
						return false; // We shouldn't ever get here
					};

				// We need to determine if this alarm should notify immediately or if we can add it to
				// the queue for later processing. By standard practive, 'immediate' notifies are few and far between.
				// Let's walk all of the policy's alert groups and see if any of them have a delay of 0 (immediate).
				// If any of them do, we'll do further processing to determine if immediate notify is required.

				// TODO check for immediate

				// For now let's assume nothing is immediate
				queueEntry = {
					type: NEW,
					policyIds: info.policyIds,
					upi: alarm.upi,
					alarmId: alarm._id,
					msgCat: alarm.msgCat,
					msgText: alarm.msgText,
					msgType: alarm.msgType,
					almClass: alarm.almClass,
					timestamp: alarm.msgTime * 1000,
					Name1: alarm.Name1,
					Name2: alarm.Name2,
					Name3: alarm.Name3,
					Name4: alarm.Name4,
					pointType: alarm.pointType,
					Security: alarm.Security,
					notifyReturnNormal: getNotifyReturnNormal(info.point['Alarm Messages'])
				};

				if (dbAlarmQueueLocked) {
					actions.utility.log('adding alarmQueue entry to tempAlarmQueue');
					tempAlarmQueue.push(queueEntry);
					return cb(null);
				} else {
					actions.utility.log('adding alarmQueue entry to db');
					actions.alarmQueue.dbInsert(queueEntry, function (writeResult) {
						var err = writeResult && writeResult.writeConcernError;
						if (!!err) {
							return cb(err.errmsg);
						} else {
							return cb(null);
						}
					});
				}
			}

			async.waterfall([
				getPoint,
				getPointPolicies,
				processPointPolicies
			], function (err, info) {
				if (err) {
					// TODO log error?
					actions.utility.log(err); // DEBUG
				}
			});
		},
		processImmediate: function () {

		}
	};

function run () {
	var date = new Date(),
		logError = function (err) {
			// TODO
			logger.debug(err);
		},
		terminate = function (err) {
			logError(err);
			dbAlarmQueueLocked = false;
		};

	actions.utility.log(['RUNNING CRON JOB, ', date.getHours(), ':', date.getMinutes(), ', ', date.getTime()].join('')); // DEBUG

	// Do scheduled task stuff

	dbAlarmQueueLocked = true;

	// Preprocess tasks
	async.parallel({
		policies: actions.policies.dbGetAll,
		alarmQueue: actions.alarmQueue.dbGetAll,
		holidaysObj: actions.calendar.dbGetHolidaysObj,
		usersObj: actions.dbGetAllUsersObj
	}, function (err, data) {
		var start = function (cb) {
				cb(null, data);
			};

		if (err) {
			return terminate(err);
		}

		data.policiesAckList = {};
		data.notifyList = [];
		data.date = date;
		data.now = date.setSeconds(0); // This sets the seconds in our date object to 0, and assigns the corresponding timestamp to data.now
		// We reserve the 'data' variable name so that anytime you see it you can be sure it is of the form:
		// {
		//		policies: [],
		//		alarmQueue: [],
		//		holidaysObj: {"1-1": "New Year's Day", etc.},
		//		usersObj: {_id: {}},
		//		policiesAckList: {},
		//		notifyList: [],
		//		date: date object
		//		now: unix epoch in milliseconds
		// }

		// Processing tasks
		async.waterfall([
			start,
			actions.alarmQueue.process,
			actions.policies.process,
			actions.notifications.buildNotifyList,
			actions.notifications.sendNotifications,
			actions.policies.dbUpdate,
			actions.alarmQueue.dbRemoveAll
		], function (err) {
			if (err) {
				return terminate(err);
			}

			// We're finished processing the alarm queue so unlock it
			dbAlarmQueueLocked = false;

			// Post-processing
			actions.alarmQueue.processTempAlarmQueue(data, function (err, data) {
				if (err) {
					return logError(err);
				}
				actions.utility.log('DONE \n'); // DEBUG
				// actions.utility.log(data); // DEBUG
			});
		});
	});
}

module.exports = {
	run: run,
	actions: actions,
	processIncomingAlarm: actions.processIncomingAlarm
};

new cronJob('00 * * * * *', run);	// Run notifications once per minute






/////////////////////////////////// TEST ////////////////////////////////////////
var selfTest = {
		enabled: false,
		opLogConnect: true,
		dbConnect: false,
		useDb: {
			policies: true,
			alarmQueue: true,
			holidays: false,
			users: false,
			alarmAcks: false
		},
		policies: [{
			_id: "1a5c",
			name: 'WWTP',
			members: ['1abc' , '2abc', '3abc'],
			memberGroups: [],
			enabled: true,
			_currAlertID: 1,
			_currGroupID: 4,
			_currEscalationID: 7,
			alertConfigs: [{
				id: 1, // seeded from _currAlertID
				name: 'Off-Hours',
				isOnCall: true,
				rotateConfig: { // false/null if only 1?
					enabled: false,
					scale: 'week',
					time: '9:00',
					day: 'Friday'
				},
				groups: [{
					id: 4,// seeded from _currGroupID
					active: true,
					name: 'Group 1',
					alertDelay: 1,
					repeatConfig: {
						enabled: false,
						repeatCount: 0
					},
					escalations: [{
						id: 7, // seeded from _currEscalationID
						members: ['1abc'],
						alertStyle: 'Everyone', //FirstResponder, Everyone, Sequenced
						escalationDelay: 30,
						memberAlertDelay: 5,
						rotateConfig: { // false/null if unchecked?
							enabled: true,// if retain the object
							scale: 'week',
							time: '9:00',
							day: 'Friday'
						},
						repeatConfig: {
							enabled: false,
							repeatCount: 0
						}
					}]
				}]
			}],
			scheduleLayers: [{ // layer 1
				alertConfigs: [1],
				schedules: [{// holidays
					holidays: false, // precedence, if layer 2 holiday match, does layer 1 run?
					days: ['mon', 'tues', 'wed', 'thurs', 'fri'], //'weekdays' will be translated in UI
					startTime: 800,
					endTime: 1700,
					allDay: false
				}, {
					holidays: false,
					days: ['sat', 'sun'],
					startTime: null,
					endTime: null,
					allDay: true
				}]
			}],
			threads: []
		}],
		usersObj: {
			'1abc': {
				_id: '1abc',
				alerts: {
					Normal: [{
						type: SMS,
						info: '1111110000',
						delay: 0
					}, {
						type: EMAIL,
						info: 'user1@dorsett-tech.com',
						delay: 1
					}, {
						type: VOICE,
						info: '1111110001',
						delay: 3
					}],
					Emergency: null,
					Critical: null,
					Urgent: null
				},
				notificationsEnabled: true
			},
			'2abc': {
				_id: '2abc',
				alerts: {
					Normal: [{
						type: SMS,
						info: '2222220000',
						delay: 0
					}, {
						type: EMAIL,
						info: 'user2@dorsett-tech.com',
						delay: 2
					}, {
						type: VOICE,
						info: '2222220001',
						delay: 20
					}],
					Emergency: null,
					Critical: null,
					Urgent: null
				},
				notificationsEnabled: true
			},
			'3abc': {
				_id: '3abc',
				alerts: {
					Normal: [{
						type: SMS,
						info: '3333330000',
						delay: 0
					}, {
						type: EMAIL,
						info: 'user3@dorsett-tech.com',
						delay: 3
					}, {
						type: VOICE,
						info: '3333330001',
						delay: 30
					}],
					Emergency: null,
					Critical: null,
					Urgent: null
				},
				notificationsEnabled: true
			},
			'4abc': {
				_id: '4abc',
				alerts: {
					Normal: [{
						type: SMS,
						info: '4444440000',
						delay: 0
					}, {
						type: EMAIL,
						info: 'user4@dorsett-tech.com',
						delay: 4
					}, {
						type: VOICE,
						info: '4444440001',
						delay: 40
					}],
					Emergency: null,
					Critical: null,
					Urgent: null
				},
				notificationsEnabled: true
			}
		},
		holidays: {
			'1-1': 'New Years'
		},
		alarmQueue: [{
			type: NEW,
			policyIds: ["1a5c"],
			upi: 1111,
			alarmId: 111111111111111,
			msgCat: alarmCategoryEnums.Alarm.enum,
			msgText: 'Eeek - 1111 in alarm!',
			msgType: alarmTypesEnums.Open.enum,
			almClass: Config.Enums['Alarm Classes'].Normal.enum, // comes from the point
			msgTime: Math.round(new Date().getTime() / 1000, 0),
			Name1: 'Test Point 1',
			Name2: '',
			Name3: '',
			Name4: '',
			pointType: 3, // binary input
			notifyReturnNormal: true, // comes from the point
			Security: []
		}]
	};

// Test definitions
if (selfTest.enabled) {
	var testInfo = {
			policy: selfTest.policies[0],
			queueEntry: selfTest.alarmQueue[0],
			data: {
				policies: selfTest.policies,
				alarmQueue: selfTest.alarmQueue,
				usersObj: selfTest.usersObj,
				holidays: selfTest.holidays,
				policiesAckList: {},
				date: new Date(),
				now: new Date().setSeconds(0)
			}
		};

	actions.selfTest = {
		runNotifications: false,
		getActiveAlertConfigIds: {
			run: false,
			fn: function () {
				actions.utility.log('testing getActiveAlertConfigIds');
				actions.utility.log(actions.policies.getActiveAlertConfigIds(testInfo));
			}
		},
		createThread: {
			run: false,
			fn: function () {
				actions.utility.log('testing createThread');
				actions.utility.log(actions.policies.createThread(testInfo));
			}
		},
		dbGetHolidaysObj: {
			run: false,
			fn: function (cb) {
				actions.calendar.dbGetHolidaysObj(function (err, data) {
					return cb(err, data);
				});
			}
		},
		dbGetAllNotifyPolicies: {
			run: false,
			fn: function (cb) {
				actions.policies.dbGetAll(function (err, data) {
					return cb(err, data);
				});
			}
		},
		dbGetNotifyPolicies: {
			run: true,
			fn: function (cb) {
				actions.policies.dbGet(["56d75ff6e98d941f89fc6ff5"], function (err, data) {
					return cb(err, data);
				});
			}
		},
		dbGetAllUsersObj: {
			run: false,
			fn: function (cb) {
				actions.dbGetAllUsersObj(function (err, data) {
					return cb(err, data);
				});
			}
		},
		processAlarmQueue: {
			run: false,
			fn: function (cb) {
				actions.utility.log('Testing processAlarmQueue');
				actions.alarmQueue.process(testInfo.data, function (err, data) {
					cb(null, data.policies[0].threads);
				});
			}
		},
		processPolicies: {
			run: false,
			fn: function (cb) {
				actions.utility.log('Testing processPolicies');
				actions.policies.process(testInfo.data, function (err, data) {
					cb(null, data.policies[0].threads);
				});
			}
		},
		template: {
			run: false,
			fn: function (cb) {
				cb(null, 'data');
			}
		}
	};
}


// DB connect
if (selfTest.dbConnect) {
	var db = require('../helpers/db'),
		config = require('config'),
		dbConfig = config.get('Infoscan.dbConfig'),
		socketConfig = config.get('Infoscan.socketConfig'),
		opLogConnectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', socketConfig.oplogDb].join(''),
		connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName].join('');

	if (selfTest.opLogConnect) {
		var opLogState = require('mongo-oplog')(opLogConnectionString, {ns:'oplog.rs'}).tail();
	}
	
	db.connect(connectionString, function(err) {
		if (err) {
			logger.debug(err);
			return;
		} else if (selfTest.enabled) {
			doTest();
		}
	});
} else if (selfTest.enabled) {
	doTest();
}

function doTest () {
	var key,
		testObj,
		cb = function (err, result) {
			actions.utility.log(err || result);
			// logger.debug(err || result);
		};
	for (key in actions.selfTest) {
		testObj = actions.selfTest[key];
		if (testObj.run) {
			testObj.fn(cb);
		}
	}

	if (actions.selfTest.runNotifications) {
		run();
	}
}
//////////////////////////////// END TEST //////////////////////////////////////
