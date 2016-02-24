var policy = {
    name: 'WWTP',
    members: [],
    memberGroups: [],
    enabled: true,
    _currAlertID: 1,
    _currGroupID: 4,
    _currEscalationID: 4,
    _currThreadID: 1,
    alertConfigs: [{
        id: 1, // seeded from _currAlertID
        name: 'Off-Hours',
        isOnCall: true,
        rotateConfig: { // false/null if only 1?
            enabled: true,
            scale: 'week',
            time: '9:00',
            day: 'Friday'
        },
        groups: [{
            id: 1,// seeded from _currGroupID
            active: true,
            name: 'Group 1',
            alertDelay: 0,
            repeatConfig: {
                enabled: true,
                repeatCount: 0
            },
            escalations: [{
                id: 1, // seeded from _currEscalationID
                members: [],
                alertStyle: 'Sequenced', //FirstResponder, Everyone
                memberAlertDelay: 5,
                escalationDelay: 30,
                rotateConfig: { // false/null if unchecked?
                    enabled: true,// if retain the object
                    scale: 'week',
                    time: '9:00',
                    day: 'Friday'
                },
                repeatConfig: {
                    enabled: true,
                    repeatCount: 0
                }
            }]
        }]
    }],
    schedules: [{ // layer 1
        alertConfigs: [],
        schedules: [{// holidays
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
        id: 1,// on process, update these IDs, then remove these IDs
        triggeringUPI: 12345,
        triggeringAlarm: 'OH NO!',
        initialTimestamp: 123123123,
        lastNotify: [{
            alertConfigID: 1,
            timestamp: 123123123,
            groupID: 1,
            escalationID: 1,
            recipients: [], //ids of the members
            // method: 'text',// text/phone/email/etc
            groupRepeats: 0,
            escalationRepeats: 0 // increment to check rotateConfig
        }]
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
        reminder: 0
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

var NEW = 0,
    ACTIVE = 1,
    RECURRING = 2,
    ACKNOWLEDGE= 3,
    RETURN = 4;

var notificationEntries = [{
    type: NEW,
    policyID: 123123123,
    triggeringUPI: 12345,
    triggeringAlarm: 'Oh no',
    triggerTime: 123123123123
}, {
    type: ACKNOWLEDGE,
    triggeringUPI: 12345,
    triggerTime: 123123123123
}, {
    type: RETURN,
    triggeringUPI: 12345,
    triggerTime: 123123123
}, {
    // active just points to a policy every minute?  config resides on policy
    // in case things change, rather than having static action list
    // also for multiple actions, only want one entry
    type: ACTIVE,
    triggeringUPI: 12345,
    policyID: 123123123
}, {
    // recurring resides in collection since they could be long-term actions
    // what about editing?  go through all recurring for policy, see what was changed,
    // then rebuild the list?
    type: RECURRING,
    policyID: 123123123,
    triggeringUPI: 12345,
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