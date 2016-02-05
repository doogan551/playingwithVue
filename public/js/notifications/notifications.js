var policy = {
    name: 'WWTP',
    members: [],
    memberGroups: [],
    enabled: true,
    alertConfigs: [{
        _id: 1,
        _currGroupID: 4,
        _currEscalationID: 4,
        name: 'Off-Hours',
        isOnCall: true,
        rotateConfig: { // false/null if only 1?
            active: true,
            scale: 'week',
            time: '9:00',
            day: 'Friday'
        },
        groups: [{
            _id: 1,// seeded from _currGroupID
            name: 'Group 1',
            alertDelay: 0,
            escalationDelay: 30,
            escalations: [{
                _id: 1, // seeded from _currEscalationID
                members: [],
                alertStyle: 'Sequenced', //FirstResponder, Everyone
                memberAlertDelay: 5,
                rotateConfig: { // false/null if unchecked?
                    active: true,// if retain the object
                    scale: 'week',
                    time: '9:00',
                    day: 'Friday'
                },
                repeatConfig: {
                    active: true,
                    repeatCount: 0
                }
            }]
        }]
    }],
    schedules: [{ // layer 1
        alertConfigs: [],
        schedules: [{// holidays
            configs: [1],// _id from group
            holidays: true, // precedence, if layer 2 holiday match, does layer 1 run?
            days: ['mon', 'tues', 'wed', 'thurs', 'fri'], //'weekdays' will be translated in UI
            startTime: 1700,
            endTime: 800,
            allDay: false
        }, {
            holidays: false,
            days: ['sat', 'sun'],
            startTime: null,
            endTime: null,
            allDay: true
        }],
        temporarySchedules: [{
            days: [],
            startTime: 1700,
            endTime: 800,
            allDay: false,
            startDate: '8-1-2016',
            endDate: '8-2-2016'
        }]
    }],
    threads: [{
        triggeringUPI: 12345,
        triggeringAlarm: 'OH NO!',
        initialTimestamp: 123123123,
        lastNotify: {
            timestamp: 123123123,
            groupID: 1,
            escalationID: 1,
            method: 'text',// text/phone/email/etc
            escalationRepeats: 0 // increment to check rotateConfig
        }
    }]
};

var TEXT = 1,
    EMAIL = 3,
    VOICE = 5;

var user = {
    _id: 123123123,// get name on load?  or embed
    notificationsEnabled: true,
    alerts: {
        default: [{
            type: TEXT,
            info: '1234567890',
            delay: 0
        }, {
            type: EMAIL,
            info: 'strent@dorsett-tech.com',
            delay: 0
        }, {
            type: VOICE,
            info: '1234567890',
            delay: 10
        }],
        emergency: null,
        critical: null,
        urgent: null
    },
    onCallConfig: [{ // when cron job cycles on and off call, check users and notify
        type: TEXT,
        info: '1234567890',
        delay: 0
    }],
    notifyOnAcknowledge: true // if gets notified, add to 'listen to alarm' queue, with action 'alert on acknowledge'
};


//called once the alarm hits and we get its policy
var getActiveSchedules = function (policy) {
    var isHoliday = false,
        schedules = [];

    policy.schedules.forEach(function (schedule) {
        if (isHoliday) { // get holiday schedules
            if (schedule.holidays) {
                schedules.push(schedule);
                return;// if only one schedule
            }
        } else {

        }
    });
};

var actions = {
    replaceMember: function (config) {

    },
    rotateMembers: function (config) {

    },
    escalateAlert: function (config) {

    },
    sendNotification: function (config) {

    },
    getAlertRecipients: function (config) {

    }
    // etc
};

var ACTIVE = 1,
    RECURRING = 2;

var notificationEntries = [{
    // active just points to a policy every minute?  config resides on policy
    // in case things change, rather than having static action list
    // also for multiple actions, only want one entry
    type: ACTIVE,
    policyID: 123123123
}, {
    // recurring resides in collection since they could be long-term actions
    // what about editing?  go through all recurring for policy, see what was changed,
    // then rebuild the list?
    type: RECURRING,
    policyID: 123123123,
    // rounded to minute
    // instead of interval/day/hour?  precalculate
    // if downtime, or during ping, 'get all recurring where nextAction <= nowInMinutes'
    lastAction: 123123123123,
    nextAction: 123321123123,
    interval: 21, // days, for calculations
    day: 5, // sun-sat, 0-6
    hour: 9,
    //below are specific to action
    action: 'rotateMembers',
    config: {
        groupID: 1,
        escalationID: 1
    }
}];