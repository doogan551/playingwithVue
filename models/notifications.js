let async = require('async'),
    config = require('config'),
    Config = require('../public/js/lib/config.js'),
    appConfig = require('config'),
    CronJob = require('./cronjob'),
    ObjectID = require('mongodb').ObjectID,
    logger = require('../helpers/logger')(module),
    Utility = new(require('./utility'))(),
    Calendar = new(require('./calendar'))(),
    Notifier = new(require('./notifierutility'))(),
    User = new(require('./user'))(),
    UserGroup = new(require('./usergroup'))(),
    Point = new(require('./point'))(),
    Alarm = new(require('./alarm'))();

let siteConfig = config.get('Infoscan'),
    siteDomain = siteConfig.domains[0],
    alarmsEmailAccount = siteConfig.email.accounts.alarms;

let notifier = new Notifier();

let enums = Config.Enums,
    revEnums = Config.revEnums,
    alarmClassRevEnums = revEnums['Alarm Classes'],
    alarmClassEnums = enums['Alarm Classes'],
    alarmCategoryEnums = enums['Alarm Categories'],
    accessFlagsEnums = enums['Access Flags'],
    alarmCategoryRevEnums = revEnums['Alarm Categories'],
    eventCategoryEnum = alarmCategoryEnums.Event.enum,
    maintenanceCategoryEnum = alarmCategoryEnums.Maintenance.enum,
    returnCategoryEnum = alarmCategoryEnums.Return.enum,
    ackStatusEnums = enums['Acknowledge Statuses'],
    isAcknowledgedEnum = ackStatusEnums.Acknowledged.enum,
    alarmTypesEnums = enums['Alarm Types'],
    returnToNormalEnumsObj = (() => {
        let obj = {},
            entry,
            alarmType;
        for (alarmType in alarmTypesEnums) {
            entry = alarmTypesEnums[alarmType];
            if (entry.cat === returnCategoryEnum) {
                obj[entry.enum] = alarmType;
            }
        }
        return obj;
    })();

let ADDED = 1, // Thread states
    UPDATED = 2,
    DELETED = 3,
    NEW = 'NEW', // Queue entry types
    RETURN = 'RETURN',
    SMS = 'SMS', // Notification types
    EMAIL = 'Email',
    VOICE = 'Voice',
    RECURRING = 'RECURRING', // Scheduled task types
    ONETIME = 'ONETIME',
    MSPM = 60000, // Number of milliseconds per minute
    RUNINTERVAL = MSPM; // How often the CRON task runs

let notifierFnLookup = {};
notifierFnLookup[SMS] = 'sendText';
notifierFnLookup[VOICE] = 'sendVoice';
notifierFnLookup[EMAIL] = 'sendEmail';

let daysOfWeek = ['sun', 'mon', 'tues', 'wed', 'thur', 'fri', 'sat']; // Entries correspond to Date().getDay()

let dbAlarmQueueLocked = false,
    tempAlarmQueue = [],
    actions = {
        calendar: {
            dbGetHolidaysObj: (cb) => {
                let query = {
                    year: new Date().getFullYear()
                };
                Calendar.getYear(query, (err, result) => {
                    if (!!err) {
                        return cb(err);
                    }
                    let obj = {},
                        key,
                        entry,
                        dates;
                    dates = (result[0] && result[0].dates) || [];
                    for (let i = 0, len = dates.length; i < len; i++) {
                        entry = dates[i];
                        key = [entry.month, entry.date].join('-');
                        obj[key] = entry.comment;
                    }
                    cb(null, obj);
                });
            },
            isHoliday: (info) => {
                // info is an object with keys: policy, queueEntry, and data
                let date = info.data.date,
                    todaysDate = [date.getMonth() + 1, date.getDate()].join('-');
                return (info.data.holidaysObj.hasOwnProperty(todaysDate));
            }
        },
        scheduledTasks: {
            dbGetAll: (cb) => {
                let query = {
                    collection: 'NotifyScheduledTasks'
                };
                Utility.get(query, cb);
            },
            dbUpdate: (data, cb) => {
                actions.utility.log('actions.scheduledTasks.dbUpdate');

                let updates = [],
                    deleteIds = [],
                    updateTasks = (updateCB) => {
                        actions.utility.log('\tUpdating ' + updates.length + ' task(s)');
                        async.each(updates, doUpdate, updateCB);
                    },
                    doUpdate = (task, doUpdateCB) => {
                        let criteria = {
                            collection: 'NotifyScheduledTasks',
                            query: {
                                _id: task._id
                            },
                            updateObj: task
                        };
                        Utility.update(criteria, doUpdateCB);
                    },
                    deleteTasks = (deleteCB) => {
                        actions.utility.log('\tDeleting ' + deleteIds.length + ' task(s)');
                        let criteria = {
                            collection: 'NotifyScheduledTasks',
                            query: {
                                _id: {
                                    '$in': deleteIds
                                }
                            }
                        };
                        Utility.remove(criteria, deleteCB);
                    };

                data.scheduledTasks.forEach((task) => {
                    if (task._state === UPDATED) {
                        updates.push(task);
                        delete task._state;
                    } else if (task._state === DELETED) {
                        deleteIds.push(task._id);
                    }
                });

                if (!updates.length && !deleteIds.length) {
                    return cb(null, data);
                }
                async.parallel([
                    updateTasks,
                    deleteTasks
                ], (err) => {
                    cb(err, data);
                });
            },
            process: (data, cb) => {
                actions.utility.log('actions.scheduledTasks.process');
                let rotateMembers = (task) => {
                        let policy = actions.policies.getPolicy(data.policies, task.policyID),
                            alertConfig = policy && actions.policies.getAlertConfig(policy.alertConfigs, task.config.alertConfigID),
                            group = alertConfig && actions.policies.getGroup(alertConfig.groups, task.config.groupID),
                            escalation = group && actions.policies.getEscalation(group.escalations, task.config.escalationID),
                            members = escalation && escalation.members,
                            memberId;

                        if (!!escalation) {
                            actions.utility.log('\tRotating members');
                            if (members.length) {
                                // Yadkinville rotates the first person to the bottom of the list instead of the last person to the top of the list
                                // Keeping for now because we may add a UI option to control the rotation style
                                // memberId = members.pop();	// Pop off the last member in the array
                                // members.unshift(memberId);	// Put him/her @ the first of the array
                                memberId = members.shift(); // Pop off the first member in the array
                                members.push(memberId); // Put him/her @ the end of the array

                                data.policyConfigUpdates[policy._id] = policy;
                            }
                        } else {
                            actions.utility.log('\tEscalation not found - setting task status to deleted');
                            task._state = DELETED;
                        }
                    },
                    rotateGroup = (task) => {
                        let policy = actions.policies.getPolicy(data.policies, task.policyID),
                            alertConfig = policy && actions.policies.getAlertConfig(policy.alertConfigs, task.config.alertConfigID),
                            groups = alertConfig && alertConfig.groups,
                            done = false,
                            group,
                            len,
                            i;

                        if (!!groups) {
                            actions.utility.log('\tRotating group');
                            for (i = 0, len = groups.length; i < len && !done; i++) {
                                group = groups[i];
                                if (group.active === true) {
                                    if (++i >= len) {
                                        i = 0;
                                    }
                                    group.active = false;
                                    groups[i].active = true;
                                    data.policyConfigUpdates[policy._id] = policy;
                                    done = true;
                                }
                            }
                        } else {
                            actions.utility.log('\tGroup not found - setting task status to deleted');
                            task._state = DELETED;
                        }
                    };

                // Create a temporary key-value on our data object to tell us the policies that have
                // config changes. Our actions.policies.dbUpdateConfigs routine will delete this key
                // after it's finished
                data.policyConfigUpdates = {};

                data.scheduledTasks.forEach((task) => {
                    let nextAction;
                    if (data.now >= task.nextAction) {
                        if (task.type === RECURRING) {
                            nextAction = new Date(task.nextAction);
                            nextAction = nextAction.setDate(nextAction.getDate() + task.interval);
                            task.lastAction = task.nextAction;
                            task.nextAction = nextAction;
                            task._state = UPDATED;
                        } else if (task.type === ONETIME) {
                            task._state = DELETED;
                        }

                        if (task.action === 'rotateMembers') {
                            rotateMembers(task);
                        } else if (task.action === 'rotateGroup') {
                            rotateGroup(task);
                        }
                    }
                });

                cb(null, data);
            }
        },
        policies: {
            dbGet: (idList, cb) => {
                let objectIdList = idList.map((id) => {
                        return new ObjectID(id);
                    }),
                    criteria = {
                        collection: 'NotifyPolicies',
                        query: {
                            _id: {
                                $in: objectIdList
                            }
                        }
                    };
                Utility.get(criteria, cb);
            },
            dbGetAll: (cb) => {
                let criteria = {
                    collection: 'NotifyPolicies'
                };
                Utility.get(criteria, cb);
            },
            dbUpdateConfigs: (data, cb) => {
                let numberOfUpdates = Object.keys(data.policyConfigUpdates).length;

                actions.utility.log('actions.policies.dbUpdateConfigs');
                actions.utility.log('\tUpdating ' + numberOfUpdates + ' item(s)');

                if (numberOfUpdates === 0) {
                    delete data.policyConfigUpdates;
                    return cb(null, data);
                }

                async.forEachOf(data.policyConfigUpdates, doUpdate, (err) => {
                    delete data.policyConfigUpdates;
                    return cb(err, data);
                });

                let doUpdate = (policy, policyId, doUpdateCB) => {
                    let criteria = {
                        collection: 'NotifyPolicies',
                        query: {
                            _id: new ObjectID(policyId)
                        },
                        updateObj: {
                            $set: {
                                enabled: policy.enabled,
                                alertConfigs: policy.alertConfigs
                            }
                        }
                    };
                    Utility.update(criteria, doUpdateCB);
                };
            },
            dbUpdateThreads: (data, cb) => {
                actions.utility.log('policies.dbUpdateThreads');

                let updates = [],
                    inserts = {},
                    deletes = {},
                    collection = 'NotifyPolicies',
                    updateThreads = (updateThreadsCB) => {
                        async.each(updates, doUpdate, updateThreadsCB);
                    },
                    insertThreads = (insertThreadsCB) => {
                        async.forEachOf(inserts, doInsert, insertThreadsCB);
                    },
                    deleteThreads = (deleteThreadsCB) => {
                        async.forEachOf(deletes, doDelete, deleteThreadsCB);
                    },
                    doUpdate = (update, doUpdateCB) => {
                        let criteria = {
                            collection: collection,
                            query: {
                                '_id': new ObjectID(update.policyId),
                                'threads.id': update.thread.id
                            },
                            updateObj: {
                                '$set': {
                                    'threads.$': update.thread
                                }
                            }
                        };
                        Utility.update(criteria, doUpdateCB);
                    },
                    doInsert = (threads, policyId, doInsertCB) => {
                        let criteria = {
                            collection: collection,
                            query: {
                                '_id': new ObjectID(policyId)
                            },
                            updateObj: {
                                '$push': {
                                    'threads': {
                                        '$each': threads
                                    }
                                }
                            }
                        };
                        Utility.update(criteria, doInsertCB);
                    },
                    doDelete = (deleteIds, policyId, doDeleteCB) => {
                        let criteria = {
                            collection: collection,
                            query: {
                                '_id': new ObjectID(policyId)
                            },
                            updateObj: {
                                '$pull': {
                                    'threads': {
                                        'id': {
                                            $in: deleteIds
                                        }
                                    }
                                }
                            }
                        };
                        Utility.update(criteria, doDeleteCB);
                    },
                    getPolicyThreadChanges = (policy) => {
                        let policyId = policy._id,
                            _numberOfDeletes = 0,
                            _numberOfInserts = 0,
                            _numberOfUpdates = 0,
                            processThread = (thread) => {
                                if (!thread.hasOwnProperty('_state')) {
                                    return;
                                }

                                if (thread._state === UPDATED) {
                                    updates.push({
                                        policyId: policyId,
                                        thread: thread
                                    });
                                    _numberOfUpdates++;
                                } else if (thread._state === ADDED) {
                                    if (!inserts[policyId]) {
                                        inserts[policyId] = [];
                                    }
                                    inserts[policyId].push(thread);
                                    _numberOfInserts++;
                                } else if ((thread._state === DELETED) && !thread._isNew) {
                                    if (!deletes[policyId]) {
                                        deletes[policyId] = [];
                                    }
                                    deletes[policyId].push(thread.id);
                                    _numberOfDeletes++;
                                }

                                // Remove all temporary keys from the thread
                                delete thread._state;
                                delete thread._isNew;
                                delete thread._notifyAlarmMutated;
                                delete thread._notifyReturnBeforeDelete;
                            };
                        policy.threads.forEach(processThread);
                        actions.utility.log(['\tPolicy', policy.name, '- #Updates:', _numberOfUpdates, ', #Inserts:', _numberOfInserts, ', #Deletes:', _numberOfDeletes].join(' '));
                    };

                data.policies.forEach(getPolicyThreadChanges);

                async.parallel([
                    updateThreads,
                    insertThreads,
                    deleteThreads
                ], (err) => {
                    cb(err, data);
                });
            },
            dbRemoveThreads: (policyId, cb) => {
                actions.utility.log('policies.dbRemoveThreads');
                actions.utility.log('\tRemoving threads for policy id: ' + policyId);
                let criteria = {
                    collection: 'NotifyPolicies',
                    query: {
                        _id: new ObjectID(policyId)
                    },
                    updateObj: {
                        '$set': {
                            'threads': []
                        }
                    }
                };
                Utility.update(criteria, cb);
            },
            process: (data, cb) => {
                actions.utility.log('policies.process');

                let processPolicy = (policy, policyCB) => {
                    let processThread = (thread, threadCB) => {
                        let info = {
                            policy: policy,
                            thread: thread,
                            data: data
                        };
                        actions.policies.processThread(info, threadCB);
                    };
                    actions.utility.log('\tPolicy ' + policy.name + ' - ' + policy.threads.length + ' thread(s)');

                    async.each(policy.threads, processThread, (err) => {
                        policyCB(err);
                    });
                };

                async.each(data.policies, processPolicy, (err) => {
                    cb(err, data);
                });
            },
            getActiveAlertConfigIds: (info) => {
                // info is an object with keys: policy, thread, queueEntry, and data
                let activeAlertConfigIds = [],
                    added = {};

                actions.policies.getActiveScheduleLayers(info).forEach((scheduleLayer) => {
                    scheduleLayer.alertConfigs.forEach((id) => {
                        if (!added[id]) {
                            added[id] = true;
                            activeAlertConfigIds.push(id);
                        }
                    });
                });
                return activeAlertConfigIds;
            },
            getActiveScheduleLayers: (info) => {
                // info is an object with keys: policy, thread, queueEntry, and data
                let activeScheduleLayers = [],
                    date = info.data.date,
                    todayIsHoliday = actions.calendar.isHoliday(info),
                    curDay = daysOfWeek[date.getDay()],
                    getMinutes = () => {
                        let minutes = date.getMinutes();
                        return ((minutes < 10) ? '0' + minutes : minutes);
                    },
                    inScheduledTime = (schedule) => {
                        let startTime = schedule.startTime,
                            endTime = schedule.endTime;

                        if (schedule.allDay) {
                            return true;
                        } else if (startTime > endTime) {
                            if (curTime > startTime || curTime < endTime) {
                                return true;
                            }
                        } else if (startTime < endTime) {
                            if (curTime > startTime && curTime < endTime) {
                                return true;
                            }
                        }
                        return false;
                    },
                    curTime = parseInt([date.getHours(), getMinutes()].join(''), 10);

                info.policy.scheduleLayers.forEach((scheduleLayer) => {
                    let found = false,
                        schedule;
                    for (let i = 0, len = scheduleLayer.schedules.length; i < len && !found; i++) {
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
            getPolicyLookupTable: (policies) => {
                let obj = {},
                    len = policies.length,
                    policy,
                    i;
                for (i = 0; i < len; i++) {
                    policy = policies[i];
                    obj[policy._id] = policy;
                }
                return obj;
            },
            getPolicy: (policies, id) => {
                let len = policies.length,
                    i;
                for (i = 0; i < len; i++) {
                    // policy._id is a Mongo Object ID which is a weird object thingy. 'id' is a string matching
                    // the policy._id string value. Must do a == compare else this will alwyays be false
                    if (policies[i]._id == id) {
                        return policies[i];
                    }
                }
                return null;
            },
            getAlertConfig: (alertConfigs, id) => {
                for (let i = 0, len = alertConfigs.length; i < len; i++) {
                    // Use == compare because IDK if id is a string or number
                    if (alertConfigs[i].id == id) {
                        return alertConfigs[i];
                    }
                }
                return null;
            },
            getGroup: (groups, id) => {
                for (let i = 0, len = groups.length; i < len; i++) {
                    // Use == compare because IDK if id is a string or number
                    if (groups[i].id == id) {
                        return groups[i];
                    }
                }
                return null;
            },
            getEscalation: (escalations, id) => {
                for (let i = 0, len = escalations.length; i < len; i++) {
                    // Use == compare because IDK if id is a string or number
                    if (escalations[i].id == id) {
                        return escalations[i];
                    }
                }
                return null;
            },
            getUserAlerts: (user, alarmClassName) => {
                let alerts = [];

                if (!!user) {
                    if (user.notificationsEnabled) {
                        // If user has alert preferences defined for this alarm class
                        // notificationOptions is of the form: {
                        //   Emergency : false,
                        //   Critical : false,
                        //   Urgent : false,
                        //   notifyOnAck : false
                        // }
                        if (user.notificationOptions[alarmClassName] === true) {
                            alerts = user.alerts[alarmClassName];
                        } else {
                            // Normal class serves as default
                            alerts = user.alerts.Normal;
                        }
                    }
                }
                return alerts;
            },
            // Thread=>
            processThread: (info, cb) => {
                // info is an object with keys: policy, thread, data
                let thread = info.thread,
                    isUpdated = false,
                    recepientHistoryLength = thread.recepientHistory.length,
                    now = info.data.now,
                    doNotifyReturnNormal = false,
                    doNotifyAlarmMutated = false,
                    notifyLookup = (() => {
                        let notifyQueue = thread.notifyQueue,
                            key,
                            notify,
                            obj = {};
                        for (let i = 0, len = notifyQueue.length; i < len; i++) {
                            notify = notifyQueue[i];
                            key = [notify.userId, notify.Type, notify.Value].join('');
                            obj[key] = notify;
                        }
                        return obj;
                    })(),
                    getUserPermissions = (userId) => {
                        // This routine returns a _pAccess value for the userId associated with the notifying point
                        let user = info.data.usersObj[userId],
                            security = thread.trigger.Security, // Array of group ids
                            _pAccess = 0, // Assume no permissions
                            group;

                        if (user) {
                            if (user['System Admin'].Value === true) {
                                _pAccess = accessFlagsEnums.All;
                            } else {
                                security.forEach((groupId) => {
                                    group = info.data.groupsObj[groupId];

                                    // If our user is a member of this group
                                    if (group.Users[userId]) {
                                        _pAccess |= group._pAccess; // Add group permissions
                                    }
                                });
                            }
                        }
                        return _pAccess;
                    },
                    notifyAlarmStateChange = (change) => {
                        let i,
                            history,
                            userId,
                            key;

                        // If the alarm changed state (return to normal or a new alarm state), we immediately notify
                        // this thread's recepient history of the state change using all of the methods by which they have
                        // already been notified
                        for (i = 0; i < recepientHistoryLength; i++) {
                            history = thread.recepientHistory[i];
                            userId = history.userId;
                            key = [userId, history.Type, history.Value].join('');

                            // We'll only alert the user of the alarm state change if they
                            // don't already have a notification of this type in the queue,
                            // or if they do but it's not scheduled until later
                            if (!(notifyLookup.hasOwnProperty(key)) || notifyLookup[key].nextAction > now) {
                                thread.notifyQueue.push({
                                    userId: userId,
                                    userCanAck: !!(getUserPermissions(userId) & accessFlagsEnums.Acknowledge.enum),
                                    nextAction: now,
                                    Type: history.Type, // email, voice, sms
                                    Value: history.Value, // phone number or email
                                    change: change
                                });
                                isUpdated = true;
                            }
                        }
                    },
                    addNotifications = (userIds) => {
                        let len = userIds.length,
                            alarmClassName = alarmClassRevEnums[thread.trigger.almClass],
                            i,
                            j,
                            jlen,
                            userId,
                            userAlerts,
                            userAlert,
                            key,
                            notification;

                        for (i = 0; i < len; i++) {
                            userId = userIds[i];

                            // Returns an empty array if user not found
                            userAlerts = actions.policies.getUserAlerts(info.data.usersObj[userId], alarmClassName);

                            for (j = 0, jlen = userAlerts.length; j < jlen; j++) {
                                userAlert = userAlerts[j];
                                key = [userId, userAlert.Type, userAlert.Value].join('');

                                // If we don't already have a notification like this queued up
                                // If the thread is brand new we always queue up all the user's desired alerts
                                if (!notifyLookup.hasOwnProperty(key) || thread._state === ADDED) {
                                    notification = {
                                        userId: userId,
                                        userCanAck: !!(getUserPermissions(userId) & accessFlagsEnums.Acknowledge.enum),
                                        nextAction: actions.utility.getTimestamp(info, userAlert.delay),
                                        Type: userAlert.Type, // email, voice, sms
                                        Value: userAlert.Value // phone number or email
                                    };
                                    thread.notifyQueue.push(notification);
                                    notifyLookup[key] = notification;
                                    isUpdated = true;
                                }
                            }
                        }
                    },
                    processEscalation = (escalation) => {
                        let recepients;
                        if (escalation.alertStyle === 'Everyone') {
                            recepients = escalation.recepients;
                            escalation.counter--;
                        } else if (escalation.alertStyle === 'FirstResponder') {
                            recepients = [escalation.recepients[0]];
                            escalation.counter--;
                        } else { // Sequenced
                            recepients = [escalation.recepients[escalation.recepientIndex]];
                            if (++escalation.recepientIndex >= escalation.recepients.length) {
                                escalation.counter--;
                                escalation.recepientIndex = 0;
                            }
                        }
                        addNotifications(recepients);

                        if (escalation.counter > 0) {
                            escalation.nextAction = actions.utility.getTimestamp(info, escalation.recepientAlertDelay);
                        } else if (escalation.reset) {
                            escalation.reset = false;
                            escalation.counter = actions.policies.getThreadCounter(escalation.repeatConfig);
                            escalation.nextAction = actions.utility.getTimestamp(info, escalation.reverseEscalationDelay) - now - escalation.resetTimestamp;
                        }

                        isUpdated = true;
                        escalation.lastAction = now;
                    },
                    processAlertGroup = (alertGroup) => {
                        let resetEscalations = false;

                        // If the alert group is ready to repeat
                        if ((alertGroup.counter > 0) && now >= alertGroup.repeatTimestamp) {
                            if (--alertGroup.counter) {
                                resetEscalations = true;
                                alertGroup.repeatTimestamp = actions.utility.getTimestamp(info, alertGroup.repeatConfig.repeatTime);
                                isUpdated = true;
                            }
                        }

                        alertGroup.escalations.forEach((escalation) => {
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
                            if ((escalation.counter > 0) && (now >= escalation.nextAction)) {
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
                        notifyAlarmStateChange('return');
                        actions.policies.setThreadState(thread, DELETED);
                        thread._notifyReturnBeforeDelete = true;
                    }
                    return cb();
                }

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
                actions.policies.isThreadAcknowledged(info, (err, isAcknowledged) => {
                    if (!!err) {
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
            createThread: (info) => {
                // info is an object with keys: policy, data, and queueEntry; it may also have 'thread' but it's irrelevant
                let alertConfigIds = actions.policies.getActiveAlertConfigIds(info),
                    numberOfAlertConfigIds = alertConfigIds.length,
                    queueEntry = info.queueEntry,
                    trigger = {},
                    key,
                    getGroupRepeatTime = (group) => {
                        if (!group.repeatConfig.enabled) {
                            return 0;
                        }

                        let escalations = group.escalations,
                            len = escalations.length,
                            time = parseInt(group.alertDelay, 10),
                            i;

                        for (i = 0; i < len; i++) {
                            time += parseInt(escalations[i].escalationDelay, 10);
                        }
                        return time;
                    },
                    getRecepients = (members) => {
                        // members is an array of user ids
                        let recepients = [],
                            id,
                            memberAlerts,
                            alarmClassName = alarmClassRevEnums[queueEntry.almClass];
                        for (let i = 0, len = members.length; i < len; i++) {
                            id = members[i];
                            memberAlerts = actions.policies.getUserAlerts(info.data.usersObj[id], alarmClassName);
                            if (memberAlerts.length) {
                                recepients.push(id);
                            }
                        }
                        return recepients;
                    },
                    getEscalations = (group) => {
                        let escalations = [],
                            len = group.escalations.length,
                            time = parseInt(group.alertDelay, 10),
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
                                    recepientAlertDelay: parseInt(groupEscalation.memberAlertDelay, 10),
                                    escalationDelay: parseInt(groupEscalation.escalationDelay, 10), // minutes
                                    repeatConfig: groupEscalation.repeatConfig,
                                    reverseEscalationDelay: time - group.alertDelay, // minutes
                                    reset: false,
                                    resetTimestamp: 0 // ms
                                });
                                time += parseInt(groupEscalation.escalationDelay, 10);
                            }
                        }
                        return escalations;
                    },
                    getAlertGroups = () => {
                        let groups = [],
                            alertConfig,
                            i,
                            activeAlertGroup,
                            getActiveGroupConfig = (alertConfig) => {
                                let groups = alertConfig.groups,
                                    len = groups.length,
                                    i;
                                for (i = 0; i < len; i++) {
                                    if (groups[i].active) {
                                        return groups[i];
                                    }
                                }
                            },
                            getAlertGroup = (group) => {
                                let repeatTime;
                                // Get the initial repeat time
                                repeatTime = getGroupRepeatTime(group); // minutes
                                // Add the non-initial repeat time to the repeatConfig object (repeats do not include the initial alert delay)
                                group.repeatConfig.repeatTime = repeatTime - parseInt(group.alertDelay, 10); // minutes
                                // Add the group
                                return {
                                    counter: actions.policies.getThreadCounter(group.repeatConfig, true),
                                    repeatTimestamp: actions.utility.getTimestamp(info, repeatTime), // ms
                                    repeatConfig: group.repeatConfig,
                                    escalations: getEscalations(group)
                                };
                            };

                        for (i = 0; i < numberOfAlertConfigIds; i++) {
                            alertConfig = actions.policies.getAlertConfig(info.policy.alertConfigs, alertConfigIds[i]);
                            activeAlertGroup = getActiveGroupConfig(alertConfig);
                            // We should always have an active alert group but just in case
                            if (!!activeAlertGroup) {
                                groups.push(getAlertGroup(activeAlertGroup));
                            }
                        }
                        return groups;
                    };

                if (numberOfAlertConfigIds > 0) {
                    for (key in queueEntry) {
                        trigger[key] = queueEntry[key];
                    }
                    delete trigger.type; // Delete the queue type (NEW/RETURN) copied from the queue entry
                    delete trigger.policyIds; // Delete the policyIds array list copied from the queue entry
                    delete trigger._id; // Delete the _id copied from the queue entry
                    delete trigger.notifyReturnNormal; // Delete the notifyReturnNormal flag copied from the queue entry

                    return {
                        id: queueEntry.alarmId, // this will server as our unique id for the lifetime of the thread (even if it mutates)
                        notifyReturnNormal: queueEntry.notifyReturnNormal,
                        trigger: trigger,
                        previousTriggers: [],
                        status: {
                            isAcknowledged: false,
                            isReturnedNormal: false,
                            isWaitingReturnNormal: false
                        },
                        config: {
                            notifyReturnNormal: queueEntry.notifyReturnNormal
                        },
                        alertGroups: getAlertGroups(),
                        notifyQueue: [],
                        recepientHistory: [],
                        _state: ADDED, // Temporary key (removed before the thread is pushed to the db)
                        _isNew: true // Temporary key
                    };
                }
                return null;
            },
            updateThread: (info) => {
                // info is an object with keys: policy, thread, data, and queueEntry
                let thread = info.thread,
                    queueEntry = info.queueEntry,
                    trigger = thread.trigger,
                    status = thread.status;

                if (thread._state !== ADDED) {
                    actions.policies.setThreadState(info.thread, UPDATED);
                    // Copy trigger to previousTriggers array before we update the trigger
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
                trigger.timestamp = queueEntry.timestamp;

                // Reset the status flags
                status.isAcknowledged = false;
                status.isReturnedNormal = false;
                status.isWaitingReturnNormal = false;
            },
            mutateThread: (info) => {
                // info is an object with keys: policy, thread, data, and queueEntry

                // The mutated flag is a temporary flag that tells us to notify the recepient history of the new alarm state
                // Delete 'notifyAlarmMutated' key from the thread before writing back out to the database
                info.thread._notifyAlarmMutated = true;
                actions.policies.updateThread(info);
            },
            setThreadState: (thread, requestedState) => {
                let _state = thread._state;

                if ((_state === DELETED) || ((requestedState === UPDATED) && (_state === ADDED))) {
                    return thread._state;
                }
                thread._state = requestedState;

                return thread._state;
            },
            isThreadActive: (thread) => {
                return ((thread._state !== DELETED) && (thread.trigger.msgCat !== maintenanceCategoryEnum));
            },
            isThreadAcknowledged: (info, cb) => {
                // info is an object with keys policy, thread, data, and sometimes queueEntry
                let thread = info.thread,
                    alarmId = thread.trigger.alarmId,
                    policiesAckList = info.data.policiesAckList,
                    query = {
                        _id: new ObjectID(alarmId)
                    },
                    fields = {
                        ackStatus: 1
                    };

                if (thread.status.isAcknowledged === true) {
                    return cb(null, true);
                }

                if (policiesAckList.hasOwnProperty(alarmId)) {
                    return cb(null, policiesAckList[alarmId] === isAcknowledgedEnum);
                }

                Alarm.getAlarm({
                    query: query,
                    fields: fields
                }, (err, alarm) => { // alarm is null if not found
                    let ackStatus = (alarm && alarm.ackStatus) || isAcknowledgedEnum, // If we can't find the alarm (shouldn't happen), we treat it like it has been acknowledged
                        isAcknowledged = (ackStatus === isAcknowledgedEnum);

                    // Save the ack status so we don't search for it again this cycle
                    policiesAckList[alarmId] = ackStatus;
                    // Update the thread's ackStatus
                    thread.status.isAcknowledged = isAcknowledged;

                    return cb(err, isAcknowledged);
                });
            },
            getThreadCounter: (repeatConfig, isGroupConfig) => {
                let counter = 1,
                    repeatCount = parseInt(repeatConfig.repeatCount, 10);

                if (repeatConfig.enabled) {
                    // Group repeats are treated differently than escalation repeats (0 = repeat forever)
                    if (isGroupConfig && repeatCount === 0) {
                        counter += 999999; // ~2 years worth @ 1 minute repeat interval
                    } else {
                        counter += repeatCount;
                    }
                }
                return counter;
            },
            getActiveThread: (threads, upi) => {
                let len = threads.length,
                    thread,
                    i;

                for (i = 0; i < len; i++) {
                    thread = threads[i];
                    if ((thread.trigger.upi === upi) && actions.policies.isThreadActive(thread) === true) {
                        return thread;
                    }
                }
                return null;
            }
        },
        alarmQueue: {
            dbGetAll: (cb) => {
                let query = {
                    collection: 'NotifyAlarmQueue'
                };
                Utility.get(query, cb);
            },
            dbInsert: (queueEntries, cb) => {
                let criteria = {
                    collection: 'NotifyAlarmQueue',
                    insertObj: queueEntries
                };
                Utility.insert(criteria, cb);
            },
            dbRemoveAll: (data, cb) => {
                actions.utility.log('alarmQueue.dbRemoveAll');

                // If the alarm queue was empty there's nothing for us to do
                if (!data.alarmQueue.length) {
                    return cb(null, data);
                }

                let criteria = {
                    collection: 'NotifyAlarmQueue',
                    query: {}
                };

                // We could just dump the database alarm queue, but the following guarantees we do not miss any alarms
                // due to the CRON job firing up. Ex sequence:
                // 1. CRON runs
                // 2. An alarm comes in, checks dbAlarmQueueLocked and reads false
                // 3. CRON sets dbAlarmQueueLocked true and gets alarmQueue
                // 4. The alarm that came in finishes inserting into the alarmQueue db collection
                async.waterfall([
                    actions.alarmQueue.dbGetAll,
                    (alarmQueue, validateCB) => {
                        if (alarmQueue.length > data.alarmQueue.length) {
                            for (let i = data.alarmQueue.length; i < alarmQueue.length; i++) {
                                tempAlarmQueue.push(alarmQueue[i]);
                            }
                        }
                        validateCB(null);
                    },
                    (removeCB) => {
                        Utility.remove(criteria, removeCB);
                    }
                ], (err) => {
                    cb(err, data);
                });
            },
            lock: (data, cb) => {
                dbAlarmQueueLocked = true;
                if (cb) {
                    cb(null, data);
                }
            },
            unlock: (data, cb) => {
                dbAlarmQueueLocked = false;
                if (cb) {
                    cb(null, data);
                }
            },
            process: (data, cb) => {
                actions.utility.log('alarmQueue.processing', '\t' + data.alarmQueue.length + ' item(s) in queue');
                let policyLookup = actions.policies.getPolicyLookupTable(data.policies);

                let alarmQueueIteratee = (queueEntry, queueCB) => {
                    let policyIdsIteratee = (policyId, policyCB) => {
                        let policy = policyLookup[policyId],
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
                            actions.utility.log('\tPolicy not found');
                            policyCB();
                        }
                    };

                    async.eachSeries(queueEntry.policyIds, policyIdsIteratee, (err) => {
                        queueCB(err);
                    });
                };

                // Process the queue
                async.eachSeries(data.alarmQueue, alarmQueueIteratee, (err) => {
                    cb(err, data);
                });
            },
            processNew: (info, cb) => {
                actions.utility.log('\tProcessing new alarm entry from NotifyAlarmQueue');
                // info is an object with keys: policy, queueEntry, and data
                let queueEntry = info.queueEntry,
                    policy = info.policy,
                    thread,
                    createNewThread = () => {
                        thread = actions.policies.createThread(info);
                        if (!!thread) {
                            actions.utility.log('\tAdded new thread to policy ' + policy.name);
                            policy.threads.push(thread);
                        } else {
                            actions.utility.log('\tA thread was not added to policy ' + policy.name + '; discarding new alarm');
                        }
                    };

                thread = actions.policies.getActiveThread(policy.threads, queueEntry.upi);
                if (!!thread) {
                    actions.utility.log('\tFound existing thread matching the alarm UPI');
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
                    actions.policies.isThreadAcknowledged(info, (err, isAcknowledged) => {
                        if (!!err) {
                            return cb(err);
                        }

                        if (isAcknowledged) {
                            actions.utility.log('\tExisting thread was acknowledged. Creating new thread.');
                            actions.policies.setThreadState(info.thread, DELETED);
                            createNewThread();
                        } else {
                            actions.utility.log('\tExisting thread has not been acknowledged');
                            // This is an existing thread. We have two options:
                            // a) Mutate the thread
                            // b) Update the thread
                            // The difference between an update and a mutate is that a mutate will also notify the thread's
                            // recepient history (all recepients and all received types [voice, email, sms]), of the
                            // new alarm condition.
                            //
                            // There is one exception when we don't want to do this: if the thread doesn't notify of return to normal
                            // and the new alarm type is the same as the old alarm type, i.e. Open alarm to open alarm
                            // For example, consider this sequence:
                            // Tank level high alarm - Notify peeps
                            // Tank level returns normal - We don't notify (notify return setting tells us not to notify)
                            // Tank level high alarm - So here, we don't need to tell the recepient history the point is in high alarm
                            // again because they've never been notified otherwise.

                            // If the alarm category is different (ex: high warning -> high alarm), or if this thread notifies return normal and it has been sent out
                            if ((thread.trigger.msgCat !== queueEntry.msgCat) || (thread.config.notifyReturnNormal && !thread.notifyReturnNormal)) {
                                actions.utility.log('\tMutating existing thread');
                                actions.policies.mutateThread(info);
                            } else {
                                actions.utility.log('\tUpdating existing thread');
                                actions.policies.updateThread(info);
                            }
                        }
                        return cb(null);
                    });
                } else {
                    actions.utility.log('\tAn existing thread matching the alarm UPI was not found; attempting to create new thread.');
                    createNewThread();
                    return cb();
                }
            },
            processReturn: (info, cb) => {
                actions.utility.log('\tProcessing new return entry from NotifyAlarmQueue');
                // info is an object with keys: policy, queueEntry, and data
                let queueEntry = info.queueEntry,
                    policy = info.policy,
                    thread;

                thread = actions.policies.getActiveThread(policy.threads, queueEntry.upi);
                if (!!thread) {
                    actions.utility.log('\tFound thread matching the return UPI; adding & updating thread\'s return normal information.');
                    thread.status.isReturnedNormal = true;
                    thread.returnNormal = {
                        timestamp: queueEntry.timestamp,
                        msgText: queueEntry.msgText,
                        msgType: queueEntry.msgType,
                        msgCat: queueEntry.msgCat
                    };
                } else {
                    actions.utility.log('\tA thread matching the return UPI was not found; discarding return');
                }
                return cb();
            },
            processTempAlarmQueue: (data, cb) => {
                actions.utility.log('alarmQueue.processTempAlarmQueue', '\t' + tempAlarmQueue.length + ' item(s) in temp queue');

                let tempAlarmQueueLength = tempAlarmQueue.length;

                if (!tempAlarmQueueLength) {
                    return cb(null, data);
                }

                // Save the temp alarm queue to the database & empty the temp alarm queue
                actions.alarmQueue.dbInsert(tempAlarmQueue, (err) => {
                    if (!!err) {
                        return cb(err);
                    }
                    // We could just clear the tempAlarmQueue but the following guarantees we do not miss any entries @ the
                    // dbAlarmQueueLocked transition; see comments in actions.alarmQueue.dbRemoveAll for a thorough explanation
                    if (tempAlarmQueue.length > tempAlarmQueueLength) {
                        actions.alarmQueue.dbInsert(tempAlarmQueue.splice(tempAlarmQueueLength, tempAlarmQueue.length), (err) => {
                            if (!!err) {
                                return cb(err);
                            }
                            // Clear the array; this is a better method than "tempAlarmQueue.length = []" (https://davidwalsh.name/empty-array)
                            tempAlarmQueue.length = 0;
                            return cb(null, data);
                        });
                    }
                    tempAlarmQueue.length = 0;
                    return cb(null, data);
                });
            }
        },
        notifications: {
            buildNotifyList: (data, cb) => {
                actions.utility.log('notifications.buildNotifyList');

                let policy,
                    thread,
                    _numberOfQueuedItems,
                    notifyQueue,
                    notification,
                    isUpdated,
                    i, j, k,
                    ilen, jlen, klen,
                    getReturnNormals = (notification) => {
                        return notification.change === 'return';
                    };

                for (i = 0, ilen = data.policies.length; i < ilen; i++) {
                    policy = data.policies[i];
                    _numberOfQueuedItems = 0;

                    for (j = 0, jlen = policy.threads.length; j < jlen; j++) {
                        thread = policy.threads[j];

                        // If this thread is slated for delete, we skip it unless we should notify of a return normal before it's deleted
                        if ((thread._state === DELETED) && !thread._notifyReturnBeforeDelete) {
                            continue;
                        } // Skip this thread

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

                                // Remove the notification & update our looping letiables
                                if (thread._state !== DELETED) {
                                    notifyQueue.splice(k, 1);
                                    k--;
                                    klen--;
                                }
                            } else {
                                _numberOfQueuedItems++;
                            }
                        }

                        if (isUpdated) {
                            actions.policies.setThreadState(thread, UPDATED);
                        }
                    }
                    actions.utility.log('\tPolicy ' + policy.name + ' - ' + _numberOfQueuedItems + ' item(s) in notify queue');
                }
                cb(null, data);
            },
            sendNotifications: (data, cb) => {
                actions.utility.log('notifications.sendNotifications', '\t' + data.notifyList.length + ' item(s) for delivery now');
                // data.notifyList is of the form:
                // [{
                //	notification: {
                //		userId: *,
                //		nextAction: *,
                //		userCanAck: *,	// Boolean indicates if user can acknowledge this alarm
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
                //	PointType: queueEntry.PointType,
                //	Security: queueEntry.Security
                // },

                let len = data.notifyList.length,
                    userNotifyList = {},
                    notifyEntry,
                    notifyMsg,
                    notifyParams,
                    notification,
                    thread,
                    key,
                    i,
                    to,
                    notifyingReturnNormal,
                    showReplyToAckMsg,
                    recepientHistoryLookup = (() => {
                        let obj = {},
                            thread,
                            history,
                            recepientHistory,
                            j;
                        for (i = 0; i < len; i++) { // len is initialized above our fn declaration
                            notifyEntry = data.notifyList[i];
                            thread = notifyEntry.thread;
                            recepientHistory = thread.recepientHistory;

                            if (!obj[thread.id]) {
                                obj[thread.id] = {};
                            }

                            for (j = 0; j < recepientHistory.length; j++) {
                                history = recepientHistory[j];
                                key = [history.userId, history.Type, history.Value].join('');
                                obj[thread.id][key] = true;
                            }
                        }
                        return obj;
                    })(),
                    formatMinutes = (minutes) => {
                        return minutes < 10 ? ('0' + minutes) : minutes;
                    },
                    formatHours = (hours) => {
                        return hours > 12 ? (hours - 12) : hours;
                    },
                    getPeriod = (hours) => {
                        return hours > 12 ? 'PM' : 'AM';
                    },
                    getVoiceMsgDate = (timestamp) => {
                        let date = new Date(timestamp);

                        if ((date.getMonth() === data.date.getMonth()) && (date.getDate() === data.date.getDate())) {
                            return 'today';
                        }
                        return ['on', date.getMonth() + '/' + date.getDate()];
                    },
                    getMsgDate = (timestamp) => {
                        let date = new Date(timestamp);
                        return [date.getMonth() + 1, '/', date.getDate()].join('');
                    },
                    getMsgTime = (timestamp) => {
                        let date = new Date(timestamp),
                            hours = date.getHours(),
                            minutes = date.getMinutes();
                        return [formatHours(hours), ':', formatMinutes(minutes), ' ', getPeriod(hours)].join('');
                    },
                    getVoiceReturnNormalMessage = (timestamp) => {
                        return ['It returned normal' + getVoiceMsgDate(timestamp), 'at', getMsgTime(timestamp) + '.'].join(' ');
                    },
                    getReturnNormalMessage = (timestamp) => {
                        return ['It has since returned normal', '(' + getMsgDate(timestamp), getMsgTime(timestamp) + ').'].join(' ');
                    },
                    getEmailSubject = () => {
                        // thread letiables were set before this routine was called
                        let isNormalAlarmClass = thread.trigger.almClass === alarmClassEnums.Normal.enum,
                            alarmClassText = alarmClassRevEnums[thread.trigger.almClass],
                            subject = '';

                        if (!isNormalAlarmClass) {
                            subject = alarmClassText + ': ';
                        }
                        return subject + thread.trigger.Name;
                    },
                    getColor = () => {
                        // notifyingReturnNormal letiable was set before this routine was called
                        let color;
                        if (notifyingReturnNormal) {
                            color = '#008000'; // Green
                        } else {
                            color = '#FF0000'; // Red
                        }
                        return color;
                    },
                    getMessage = () => {
                        // thread, notification, and notifyingReturnNormal letiables were set before this routine was called
                        let trigger = thread.trigger,
                            msg = '',
                            timestamp,
                            obj;

                        if (notifyingReturnNormal) {
                            obj = thread.returnNormal;
                        } else {
                            obj = trigger;
                        }
                        timestamp = obj.timestamp;

                        if (notification.Type === VOICE) {
                            msg = [obj.msgText + '.', 'This alarm occurred', getVoiceMsgDate(timestamp), 'at', getMsgTime(timestamp) + '.'].join(' ');

                            if (thread.status.isReturnedNormal && !notifyingReturnNormal) {
                                msg += ' ' + getVoiceReturnNormalMessage(thread.returnNormal.timestamp);
                            }
                        } else { // SMS or EMAIL
                            if (trigger.almClass !== alarmClassEnums.Normal.enum) {
                                msg = alarmClassRevEnums[trigger.almClass] + ': ';
                            }
                            msg += [obj.msgText, '(' + getMsgDate(timestamp), getMsgTime(timestamp) + ')'].join(' ');

                            if (thread.status.isReturnedNormal && !notifyingReturnNormal) {
                                msg += '. ' + getReturnNormalMessage(thread.returnNormal.timestamp);
                            }
                        }
                        return msg;
                    },
                    createCallback = (notifyEntry) => {
                        let notification = notifyEntry.notification,
                            policy = notifyEntry.policy,
                            trigger = notifyEntry.thread.trigger,
                            userObj = data.usersObj[notification.userId],
                            log = {
                                policyId: policy._id.toString(),
                                policyName: policy.name,
                                userId: notification.userId,
                                username: userObj && userObj.username,
                                userFirstName: userObj && userObj['First Name'].Value,
                                userLastName: userObj && userObj['Last Name'].Value,
                                userCanAck: notification.userCanAck,

                                upi: trigger.upi,
                                alarmCat: trigger.msgCat,
                                alarmText: trigger.msgText,
                                alarmType: trigger.msgType,
                                alarmId: trigger.alarmId,
                                alarmClass: trigger.almClass,
                                alarmTimestamp: trigger.timestamp,

                                Name1: trigger.Name1,
                                Name2: trigger.Name2,
                                Name3: trigger.Name3,
                                Name4: trigger.Name4,
                                Name: trigger.Name,
                                PointType: trigger.PointType,
                                Security: trigger.Security,

                                notifyType: notification.Type,
                                timestamp: new Date().getTime(),
                                to: notification.Value,
                                message: notifyEntry.notifyMsg
                            },
                            criteria = {
                                collection: 'NotifyLogs',
                                insertObj: log
                            };

                        return (err, result) => {
                            log.err = err;
                            log.apiResult = result;

                            Utility.insert(criteria, (err) => {
                                if (!!err) {
                                    actions.utility.sendError(err);
                                }
                            });
                        };
                    };

                for (i = 0; i < len; i++) {
                    notifyingReturnNormal = false;
                    notifyEntry = data.notifyList[i];
                    // Each notifyEntry is of the form
                    // {
                    //	notification: {}, // Has keys: userId, userCanAck, nextAction, type, Value
                    //	policy: {},
                    //	thread: {}
                    // }
                    // Keep in mind that notifyEntry.notification is actually a pointer to the notification object on the thread, and any modifications
                    // made to this object will be stored in the db. So best not to modify it to make sure it stays slim and trim.
                    notification = notifyEntry.notification;
                    to = notification.Value;
                    thread = notifyEntry.thread;

                    if (!!notification.change && notification.change === 'return') {
                        notifyingReturnNormal = true;
                    }
                    // We'll also collect notifications by user which can be used to prevent overwhelming the user
                    // with too many pages at one time (ex: we could combine messages or simply tell the user he/she has x new alarms to review)
                    if (!userNotifyList.hasOwnProperty(notification.userId)) {
                        userNotifyList[notification.userId] = [];
                    }
                    userNotifyList[notification.userId].push(notifyEntry);

                    // Get our notify message
                    notifyMsg = getMessage(notifyEntry);
                    // Save our message for the notify log
                    notifyEntry.notifyMsg = notifyMsg;

                    // Add recepient to our recepient history
                    key = [notification.userId, notification.Type, notification.Value].join('');
                    if (!recepientHistoryLookup[thread.id]) {
                        recepientHistoryLookup[thread.id] = {};
                    }
                    if (!recepientHistoryLookup[thread.id][key]) {
                        recepientHistoryLookup[thread.id][key] = true;
                        thread.recepientHistory.push({
                            userId: notification.userId,
                            Type: notification.Type,
                            Value: notification.Value
                        });
                    }

                    actions.utility.log('\tPolicy ' + notifyEntry.policy.name + ' - ' + notification.Type + ' ' + notification.Value + ': ' + notifyMsg);

                    // Send notification
                    if (notification.Type === EMAIL) {
                        showReplyToAckMsg = !notifyingReturnNormal && !thread.status.isAcknowledged && notification.userCanAck;

                        // Beautify our email message
                        notifyMsg = '<span style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: ' + getColor() + '">' + notifyMsg + '</span>';

                        if (showReplyToAckMsg) {
                            notifyMsg += '<p style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-style: italic;">Reply to this email to acknowledge this alarm.</p>';
                        }

                        notifyMsg += '<p style="font-family: Helvetica, Arial, sans-serif; font-size: 14px;">Thanks,<br />';
                        notifyMsg += 'Your Dorsett Technologies InfoScan Team<br />';
                        notifyMsg += '800-331-7605<br/>';
                        notifyMsg += '<a href="http://www.dorsett-tech.com" style="color: #15C;">www.dorsett-tech.com</a>';
                        notifyMsg += '</p><br />';

                        notifyMsg += '<table cellpadding=”0″ cellspacing=”0″ style="font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #666; background-color: #EEE; border: 1px solid #CCC; border-collapse: collapse"><tr><td style="padding: 10px;">';
                        notifyMsg += 'You are receiving this email at the account <a href="mailto:' + to + '" style="color: #15C;">' + to + '</a> because you are subscribed to alarm notifications on InfoScan. ';
                        notifyMsg += 'To stop receiving these emails, please log in to InfoScan at <a href="http://' + siteDomain + '" style="color: #15C;">' + siteDomain + '</a> and change your alarm notification settings.';

                        if (showReplyToAckMsg) {
                            notifyMsg += '<br /><br />Do not edit or remove anything below this line when replying to this message.<br />{' + thread.trigger.alarmId + '}';
                        }
                        notifyMsg += '</td></tr></table>';

                        notifyParams = [{
                            to: to,
                            fromAccount: alarmsEmailAccount,
                            subject: getEmailSubject(),
                            html: notifyMsg,
                            generateTextFromHTML: true
                        }, createCallback(notifyEntry)];
                    } else if (notification.Type === VOICE) {
                        notifyParams = [{
                            app: 'alarms',
                            to: to
                        }, createCallback(notifyEntry)];
                    } else {
                        notifyParams = [to, notifyMsg, createCallback(notifyEntry)];
                    }
                    notifier[notifierFnLookup[notification.Type]].apply(notifier, notifyParams);
                }
                cb(null, data);
            }
        },
        utility: {
            getTimestamp: (info, offset) => {
                // info is an object with keys: policy, thread, data and probably more
                // info.data.now is in milliseconds; offset is in minutes
                return (parseInt(info.data.now + (offset * MSPM), 10));
            },
            log: () => {
                for (let i = 0; i < arguments.length; i++) {
                    console.log(arguments[i]);
                }
            },
            sendError: (err) => {
                let siteName = siteConfig.location.site,
                    text = [
                        'Site: ' + siteName,
                        'Timestamp: ' + new Date().getTime(),
                        '',
                        err
                    ].join('\n');

                notifier.sendEmail({
                    to: 'johnny.dr@gmail.com',
                    subject: 'Error: Notifications (Site: ' + siteName + ')',
                    text: text
                });
                notifier.sendText('13364690900', 'Notifications error @ customer site. Check gmail for details.', () => {});
            }
        },
        dbGetAllUsersObj: (cb) => {
            User.getUsers((err, users) => {
                if (!!err) {
                    return cb(err);
                }
                let obj = {};

                for (let i = 0, len = users.length; i < len; i++) {
                    obj[users[i]._id] = users[i];
                }
                cb(null, obj);
            });
        },
        dbGetAllGroupsObj: (cb) => {
            UserGroup.getAll((err, groups) => {
                if (!!err) {
                    return cb(err);
                }
                let obj = {};

                for (let i = 0, len = groups.length; i < len; i++) {
                    obj[groups[i]._id] = groups[i];
                }
                cb(null, obj);
            });
        },
        processIncomingAlarm: (alarm) => {
            if (!appConfig.runNotifications) {
                return;
            }

            let startTime = new Date().getTime(),
                name = (() => {
                    let str = alarm.Name1;
                    if (alarm.Name2) {
                        str += '_' + alarm.Name2;
                        if (alarm.Name3) {
                            str += '_' + alarm.Name3;
                        }
                        if (alarm.Name4) {
                            str += '_' + alarm.Name4;
                        }
                    }
                    return str;
                })();

            actions.utility.log('INCOMING ' + alarmCategoryRevEnums[alarm.msgCat].toUpperCase() + ' - ' + name);

            if (!alarm.almNotify || alarm.msgCat === eventCategoryEnum) {
                actions.utility.log('\tDiscarding ' + alarmCategoryRevEnums[alarm.msgCat], 'DONE');
                return;
            }

            let dateFloored = new Date();
            // Floor the dateFloored object
            dateFloored.setSeconds(0);
            dateFloored.setMilliseconds(0);

            async.waterfall([
                getPoint,
                getNotifyPolicies,
                getNotifyIdsByUrgency,
                getQueueEntryObj,
                processImmediates,
                insertNotifyAlarmQueue
            ], (err) => {
                if (!!err) {
                    actions.utility.sendError(err);
                }
                actions.utility.log('DONE (' + (new Date().getTime() - startTime) + ' ms)');
            });


            let getPoint = (cb) => {
                Point.getPointById({
                    _id: alarm.upi
                }, (err, point) => {
                    cb(err, point);
                });
            };

            let getNotifyPolicies = (point, cb) => {
                let info = {
                        point: point,
                        policyIds: [],
                        policies: [],
                        policiesObj: {}
                    },
                    notifyPolicies = point['Notify Policies'],
                    i,
                    len,
                    policy;

                if (notifyPolicies && notifyPolicies.length) {
                    actions.policies.dbGet(point['Notify Policies'], (err, policies) => {
                        if (!!err) {
                            cb(err);
                        }
                        for (i = 0, len = policies.length; i < len; i++) {
                            policy = policies[i];
                            if (policy.enabled) {
                                info.policyIds.push(policy._id);
                                info.policiesObj[policy._id] = policy;
                                info.policies.push(policy);
                            }
                        }
                        return cb(null, info);
                    });
                } else {
                    return cb(null, info);
                }
            };

            let getNotifyIdsByUrgency = (info, cb) => {
                // info is an object with keys: point, policyIds, policies, and policiesObj
                let getScheduledAlertConfigIdsObj = (policy) => {
                        let alertConfigIdsObj = {},
                            i,
                            len;
                        policy.scheduleLayers.forEach((scheduleLayer) => {
                            len = scheduleLayer.alertConfigs.length;
                            for (i = 0; i < len; i++) {
                                alertConfigIdsObj[scheduleLayer.alertConfigs[i]] = true;
                            }
                        });
                        return alertConfigIdsObj;
                    },
                    isImmediate = (policyId) => {
                        let policy = info.policiesObj[policyId],
                            threadExists = !!actions.policies.getActiveThread(policy.threads, alarm.upi);

                        // If we already have a thread for this UPI it goes on the queue (otherwise there is a slight
                        // risk we could screw up the thread in the database if this alarm came in while our
                        // CRON job was running or was about to run)
                        if (threadExists) {
                            return false;
                        }

                        let scheduledAlertConfigIdsObj = getScheduledAlertConfigIdsObj(policy),
                            alertConfig,
                            len, jlen,
                            i, j;

                        // Let's walk all of the policy's alert groups and see if any of them have a delay of 0
                        // If any of them do, we'll assume we need to process immediately
                        len = policy.alertConfigs.length;
                        for (i = 0; i < len; i++) {
                            alertConfig = policy.alertConfigs[i];
                            // If this alert configuration isn't in the schedule we should skip it
                            if (!scheduledAlertConfigIdsObj[alertConfig.id]) {
                                continue;
                            }

                            jlen = alertConfig.groups.length;
                            for (j = 0; j < jlen; j++) {
                                // Using == compare in case the alertDelay is saved as a string (seen this happen from time to time)
                                if (parseInt(alertConfig.groups[j].alertDelay, 10) === 0) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    };

                // Add id arrays to our info object for immediate and delayed (queued) delivery
                info.immediatePolicyIds = [];
                info.delayedPolicyIds = [];

                info.policyIds.forEach((policyId) => {
                    if (isImmediate(policyId)) {
                        info.immediatePolicyIds.push(policyId);
                    } else {
                        info.delayedPolicyIds.push(policyId);
                    }
                });

                cb(null, info);
            };

            let getQueueEntryObj = (info, cb) => {
                let getNotifyReturnNormal = (alarmMessages) => {
                    // Maintenance alarms never return normal so we never set the return to normal flag
                    // regardless of the point setting
                    if (alarm.msgCat === maintenanceCategoryEnum) {
                        return false;
                    }

                    let len = alarmMessages.length,
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

                info.queueEntry = {
                    type: alarm.msgCat === returnCategoryEnum ? RETURN : NEW,
                    policyIds: null, // We'll add this later
                    upi: alarm.upi,
                    alarmId: alarm._id.toString(),
                    msgCat: alarm.msgCat,
                    msgText: alarm.msgText,
                    msgType: alarm.msgType,
                    almClass: alarm.almClass,
                    timestamp: parseInt(alarm.msgTime * 1000, 10),
                    Name1: alarm.Name1,
                    Name2: alarm.Name2,
                    Name3: alarm.Name3,
                    Name4: alarm.Name4,
                    Name: name,
                    PointType: alarm.PointType,
                    Security: alarm.Security,
                    notifyReturnNormal: getNotifyReturnNormal(info.point['Alarm Messages'])
                };
                cb(null, info);
            };

            let processImmediates = (info, cb) => {
                if (!info.immediatePolicyIds.length) {
                    return cb(null, info);
                }

                actions.utility.log('PROCESSING IMMEDIATE ALARM NOTIFICATION');

                info.queueEntry.policyIds = info.immediatePolicyIds;

                async.parallel({
                    holidaysObj: actions.calendar.dbGetHolidaysObj,
                    usersObj: actions.dbGetAllUsersObj,
                    groupsObj: actions.dbGetAllGroupsObj
                }, (err, data) => {
                    if (!!err) {
                        return cb(err);
                    }

                    // Remove all existing policy threads so we don't inadvertantly update or delete them
                    info.policies.forEach((policy) => {
                        policy.threads.length = 0;
                    });

                    data.policies = info.policies;
                    data.alarmQueue = [info.queueEntry];
                    data.policiesAckList = {};
                    data.notifyList = [];
                    data.date = dateFloored;

                    data.now = dateFloored.getTime();
                    // If we're currently mid-minute
                    if (new Date().getSeconds() > 0) {
                        // Set our 'now' timestamp to the next closest CRON run. We do this to ensure
                        // that the next member or escalation delay is AT LEAST as much time as configured.
                        // t0m0s	----------------------
                        // t0m30s	Incoming immediate alarm
                        //			Send notification; the next scheduled notify is 1m later; 'now' is set to 1m,
                        //			so the next notification will actually be 1m30s from here (2m mark)
                        // t1m0s	----------------------
                        // t2m0s	Send notification
                        data.now += RUNINTERVAL;
                    }

                    // Processing tasks
                    async.waterfall([
                        (cb) => {
                            cb(null, data);
                        },
                        actions.alarmQueue.process,
                        actions.policies.process,
                        actions.notifications.buildNotifyList,
                        actions.notifications.sendNotifications,
                        actions.policies.dbUpdateThreads
                    ], (err) => {
                        if (!!err) {
                            return cb(err);
                        }

                        return cb(null, info);
                    });
                });
            };

            let insertNotifyAlarmQueue = (info, cb) => {
                if (!info.delayedPolicyIds.length) {
                    return cb(null, info);
                }

                info.queueEntry.policyIds = info.delayedPolicyIds;

                if (dbAlarmQueueLocked) {
                    actions.utility.log('\tAdding to tempAlarmQueue');
                    tempAlarmQueue.push(info.queueEntry);
                    return cb(null, info);
                }
                actions.utility.log('\tAdding to NotifyAlarmQueue');
                actions.alarmQueue.dbInsert(info.queueEntry, (err) => {
                    if (!!err) {
                        return cb(err);
                    }

                    return cb(null, info);
                });
            };
        }
    };

let run = () => {
    let date = new Date(),
        startTime = date.getTime(),
        startMessage = ['RUNNING CRON JOB, ', date.getHours(), ':', date.getMinutes(), ', ', date.getTime()].join('');
    let terminate = (err) => {
        actions.alarmQueue.unlock();
        actions.utility.sendError(err);
    };

    date.setSeconds(0); // This should match the CRON run interval (i.e. if CRON runs every 30s, setSeconds(30))
    date.setMilliseconds(0); // This should always be 0

    actions.utility.log('\n' + startMessage);
    logger.info(startMessage);

    // Do scheduled task stuff
    actions.alarmQueue.lock();

    // Preprocess tasks
    async.parallel({
        policies: actions.policies.dbGetAll,
        alarmQueue: actions.alarmQueue.dbGetAll,
        holidaysObj: actions.calendar.dbGetHolidaysObj,
        usersObj: actions.dbGetAllUsersObj,
        groupsObj: actions.dbGetAllGroupsObj,
        scheduledTasks: actions.scheduledTasks.dbGetAll
    }, (err, data) => {
        if (!!err) {
            return terminate(err);
        }

        let start = (cb) => {
            cb(null, data);
        };

        data.policiesAckList = {};
        data.notifyList = [];
        data.date = date;
        data.now = date.getTime();
        // We reserve the 'data' letiable name so that anytime you see it you can be sure it is of the form:
        // {
        //		policies: [],
        //		alarmQueue: [],
        //		holidaysObj: {"1-1": "New Year's Day", etc.},
        //		usersObj: {_id: {}},
        //		groupsObj: {_id: {}},
        //		policiesAckList: {},
        //		notifyList: [],
        //		date: date object
        //		now: unix epoch in milliseconds
        // }

        // Processing tasks
        async.waterfall([
            start,
            actions.scheduledTasks.process,
            actions.scheduledTasks.dbUpdate,
            actions.policies.dbUpdateConfigs,
            actions.alarmQueue.process,
            actions.policies.process,
            actions.notifications.buildNotifyList,
            actions.notifications.sendNotifications,
            actions.policies.dbUpdateThreads,
            actions.alarmQueue.dbRemoveAll,
            actions.alarmQueue.unlock,
            actions.alarmQueue.processTempAlarmQueue
        ], (err) => {
            if (!!err) {
                actions.utility.sendError(err);
            }
            actions.utility.log('DONE (' + (new Date().getTime() - startTime) + ' ms)');
        });
    });
};

module.exports = {
    run: run,
    actions: actions,
    removeThreads: actions.policies.dbRemoveThreads,
    processIncomingAlarm: actions.processIncomingAlarm
};

if (appConfig.runNotifications) {
    // Run notifications once per minute; if this ever changes, we need to update RUNINTERVAL
    // Also, date.setSeconds(0) near the top of 'run' may have to be removed; it's just CYA
    // anyway - seconds should always be 0 if the CRON fires and we execute on time
    new CronJob('00 * * * * *', run);
}
