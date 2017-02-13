let Utility = new(require('../models/utility'))();
let async = require('async');
let config = require('config');
let logger = require('../helpers/logger')(module);
let Config = require('../public/js/lib/config.js');
let ObjectID = require('mongodb').ObjectID;
let Notifier = new(require('../models/notifierutility'))();
let User = new(require('./user'))();
let UserGroups = new(require('./userGroup'))();
let Alarm = new(require('./alarm'))();
let serverName = require('os').hostname();

let notifier = new Notifier();

let infoscanConfig = config.get('Infoscan');
let alarmsEmailAccount = infoscanConfig.email.accounts.alarms;
let alarmsEmailAddress = alarmsEmailAccount + '@' + infoscanConfig.domains[0];

let enums = Config.Enums;
let revEnums = Config.revEnums;
let ackStatuses = enums['Acknowledge Statuses'];
let accessFlags = enums['Access Flags'];
let alarmClasses = enums['Alarm Classes'];

let emailHandler = {};
emailHandler[alarmsEmailAddress] = function (relayMessage) {
    // Our waterfall functions are defined after the waterfall callback
    async.waterfall([
        getUser,
        getAlarm,
        getGroups,
        checkUserPermissions,
        ackAlarm
    ], function (err, data) {
        let html = '',
            sendReply = true,
            replyObj = {},
            msgId,
            references,
            getHeader = function (name) {
                let headers = relayMessage.content.headers,
                    len = (headers && headers.length) || 0,
                    i;

                for (i = 0; i < len; i++) {
                    // Headers is an array of objects; each object has only 1 key-value pair. We're
                    // looking for the object that has the key equal to our name letiable
                    if (headers[i][name]) {
                        return headers[i][name];
                    }
                }
                return '';
            },
            par = function (content, noStyle) {
                if (noStyle) {
                    return '<p>' + content + '</p>';
                }
                return '<p style="font-family: Helvetica, Arial, sans-serif; font-size: 14px;">' + content + '</p>';
            },
            lnk = function (to, mailto) {
                if (mailto) {
                    return '<a href="mailto:' + to + '" style="color: #15C;">' + to + '</a>';
                }
                return '<a href=' + to + ' " style="color: #15C;">' + to + '</a>';
            };

        if (data.user) {
            html = par('Hi ' + data.user['First Name'].Value + ',');
        }

        if (err || data.err) {
            logger.error('Error processing received email', '/sparkpost/email', err || data.err, relayMessage);

            if (err) {
                html += par('An unexpected error occurred which prevented us from acknowledging this alarm. An error log is attached which you can forward to ' + lnk('engineering@dorsett-tech.com', true) + ' for support. We apologize for the error.');

                // Add error log attachment
                replyObj.attachments = [{
                    filename: 'errorLog.txt',
                    contents: JSON.stringify({
                        siteName: infoscanConfig.location.site,
                        serverName: serverName,
                        timestamp: new Date().toString(),
                        relayMessage: relayMessage,
                        error: err
                    })
                }];
            } else if (data.replyErr) {
                html += par(data.err);
            } else {
                sendReply = false;
            }
        } else {
            html += par('This alarm was successfully acknowledged.');
        }

        if (sendReply) {
            // Add our sig
            html += par('Thanks,<br />Your Dorsett Technologies InfoScan Team<br /><br />');
            // Quote the original email
            html += par('<hr>' + relayMessage.content.html, true);

            msgId = getHeader('Message-ID');
            references = getHeader('References');

            // If references key is present, suffix it with a space in preparation for appending the received message id
            if (references.length) {
                references += ' ' + msgId;
            } else {
                references = msgId;
            }

            // The following link was used as the basis for our 'inReplyTo' and 'references' object key values
            // http://wesmorgan.blogspot.com/2012/07/understanding-email-headers-part-ii.html
            replyObj.to = relayMessage.msg_from;
            replyObj.fromAccount = alarmsEmailAccount;
            replyObj.subject = relayMessage.content.subject;
            replyObj.html = html;
            replyObj.generateTextFromHTML = true;
            replyObj.inReplyTo = msgId;
            replyObj.references = references;

            notifier.sendEmail(replyObj);
        }
    });

    function getUser(cb) {
        let data = {};

        User.getUser({
            'Contact Info.Value.Value': relayMessage.msg_from
        }, function (err, user) {
            if (err) {
                return cb(err);
            }
            data.user = user;
            if (!user) {
                // We log this error but don't tell the user
                data.err = 'User not found';
            }
            cb(null, data);
        });
    }

    function getAlarm(data, cb) {
        if (data.err) {
            return cb(null, data);
        }

        // Our alarm id is in the email body sandwiched between 'handlebar' characters
        let text = relayMessage.content.text,
            alarmId;

        alarmId = text && text.split('{')[1];
        alarmId = alarmId && alarmId.split('}')[0];

        if (alarmId) {
            Alarm.getAlarm({
                _id: ObjectID(alarmId)
            }, function (err, alarm) {
                if (err) {
                    return cb(err);
                }
                data.alarm = alarm;

                if (!alarm) {
                    // We log this error but don't tell the user
                    data.err = 'Invalid alarm id';
                } else if (alarm.ackStatus === ackStatuses.Acknowledged.enum) {
                    data.err = 'This alarm was already acknowledged by ' + alarm.ackUser + '.';
                    // Tell the user what went wrong
                    data.replyErr = true;
                } else if (alarm.ackStatus !== ackStatuses['Not Acknowledged'].enum) {
                    // We log this error but don't tell the user
                    data.err = 'Alarm is not acknowledgable';
                }
                cb(null, data);
            });
        } else {
            // We log this error but don't tell the user
            data.err = 'Alarm id not found';
            cb(null, data);
        }
    }

    function getGroups(data, cb) {
        if (data.err || data.user['System Admin'].Value) {
            return cb(null, data);
        }

        UserGroups.getGroups(function (err, groups) {
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

    function checkUserPermissions(data, cb) {
        if (data.err || data.user['System Admin'].Value) {
            return cb(null, data);
        }

        let userId = data.user._id,
            security = data.alarm.Security,
            group,
            i, len;

        for (i = 0, len = security.length; i < len; i++) {
            group = data.groupsObj[security[i]];
            if (group && group.Users[userId]) {
                if (group._pAccess & accessFlags.Acknowledge.enum) {
                    return cb(null, data);
                }
            }
        }
        // If we arrived here our user doesn't have acknowledge permissions on this point
        data.err = 'You do not have sufficient permissions to acknowledge this alarm.';
        // Tell the user why we're not acking the alarm
        data.replyErr = true;
        cb(null, data);
    }

    function ackAlarm(data, cb) {
        if (data.err) {
            return cb(null, data);
        }

        let criteria = {
            ackMethod: 'Email',
            ids: [data.alarm._id],
            username: data.user.username
        };

        Alarm.acknowledgeAlarm(criteria, function (err, result) {
            data.result = result;
            cb(err, data);
        });
    }
};

let Inbound = class Inbound {
    sparkpost(data) {
        let _data = Array.isArray(data) ? data[0] : null,
            relayMessage = _data && _data.msys && _data.msys.relayMessage,
            content = relayMessage && relayMessage.content,
            to = content && content.to[0],
            handler = to && emailHandler[to];

        // If we have a handler for this 'mailbox'
        if (!!handler) {
            handler(relayMessage);
        }
    }
    twilioVoiceAlarmsAnswer(data, callback) {
        let sid = data && data.CallSid;

        if (!sid) {
            return done({
                err: 'Invalid request data',
                data: data
            });
        }

        async.waterfall([
            getNotifyLog,
            getAlarm
        ], done);

        // Waterfall functions
        function getNotifyLog(cb) {
            let info = {},
                criteria = {
                    collection: 'NotifyLogs',
                    query: {
                        'apiResult.sid': sid
                    }
                };

            Utility.getOne(criteria, function (err, notifyLog) {
                if (err) {
                    return cb(err);
                }
                info.notifyLog = notifyLog;

                if (!notifyLog) {
                    info.err = 'Notify log not found';
                }
                cb(null, info);
            });
        }

        function getAlarm(info, cb) {
            if (info.err) {
                return cb(null, info);
            }

            Alarm.getAlarm({
                _id: ObjectID(info.notifyLog.alarmId)
            }, function (err, alarm) {
                if (err) {
                    return cb(err);
                }
                info.alarm = alarm;

                if (!alarm) {
                    info.err = 'Alarm id not found';
                }
                cb(null, info);
            });
        }

        function done(err, info) {
            let ackIsAllowed,
                digits = data && data.Digits,
                human = data && (data.AnsweredBy === 'human'),
                alarmClassText = info.alarm && revEnums['Alarm Classes'][info.alarm.almClass],
                alarmIsAcknowledged = info.alarm && (info.alarm.ackStatus === ackStatuses.Acknowledged.enum),
                alarmNotAcknowledged = info.alarm && (info.alarm.ackStatus === ackStatuses['Not Acknowledged'].enum),
                xml = '<?xml version="1.0" encoding="UTF-8"?>',
                numberRepeats = 3,
                criteria,
                getAorAn = function (text) {
                    return !!~['a', 'e', 'i', 'o', 'u'].indexOf(text.charAt(0)) ? 'an' : 'a';
                },
                say = function (text) {
                    return '<Say voice="alice">' + text + '</Say>';
                },
                pause = function (length) {
                    let _length = length > 0 ? length : 1;
                    return '<Pause length="' + _length + '"/>';
                },
                // Not using the below function, but keeping in case we ever need to build
                // verbs into our notify message
                // getMessageXML = function (msg) {
                //  let letiables = {
                //          '{Pause}': pause(1)
                //      },
                //      msgXML = '',
                //      str = '',
                //      _char,
                //      i,
                //      j,
                //      len;

                //  for (i = 0, len = msg.length; i < len; i++) {
                //      _char = msg.charAt(i);

                //      if (_char === '{') {
                //          msgXML += say(str);
                //          j = msg.indexOf('}', i);
                //          if (!!~j) {
                //              msgXML += letiables[msg.slice(i, j+1)];
                //              i = j;
                //          }
                //          str = '';
                //      } else {
                //          str += _char;
                //      }
                //  }
                //  if (str.length) {
                //      msgXML += say(str);
                //  }
                //  return msgXML;
                // },
                sendResponse = function () {
                    callback(xml);
                };

            xml += '<Response>';

            if (err || info.err) {
                logger.error('Error processing post request', '/twilio/voice/alarms/answer', err || info.err);

                if (digits) { // Presence of digits indicates we're already in an established call with the user and he/she has supplied digits to ack the alarm
                    xml += say('We encountered an unexpected error and could not acknowledge the alarm at this time.');
                } else {
                    xml += say('Hello, this is a message from info-scan. We called to notify you about an alarm but we encountered an unexpected error and are unable to do so. Please log in to info-scan and check the alarms.');
                }
                xml += say('We apologize for the error. Thank you and goodbye.');

                xml += '</Response>';
                sendResponse();
            } else if (digits && ((digits === '1') || alarmIsAcknowledged)) {
                // Presence of digits indicates we're already in an established call with the user and he/she has supplied digits to ack the alarm
                // We fall into this case if user supplied the correct acknowledgement digit or if they didn't but the alarm has already been acknowledged by someone else during the call
                if (alarmIsAcknowledged) {
                    xml += say('This alarm was just acknowledged by user ' + info.alarm.ackUser + '.');
                    xml += say('Thank you and goodbye.');
                    xml += pause(1);
                    xml += '</Response>';
                    sendResponse();
                } else {
                    criteria = {
                        ackMethod: 'Voice',
                        ids: [info.alarm._id],
                        username: info.notifyLog.username
                    };

                    Alarm.acknowledgeAlarm(criteria, function (err) {
                        if (err) {
                            xml += say('We encountered an unexpected error and could not acknowledge the alarm at this time. We apologize for the error.');
                        } else {
                            xml += say('Alarm acknowledged.');
                        }

                        xml += say('Thank you and goodbye.');
                        xml += pause(1);
                        xml += '</Response>';
                        sendResponse();
                    });
                }
            } else {
                ackIsAllowed = info.notifyLog.userCanAck && alarmNotAcknowledged;

                // Presence of digits indicates we're already in an established call with the user and he/she has supplied incorrect digits to ack the alarm
                if (digits) {
                    xml += say(digits.split('').join(' ') + ' is an unrecognized input.');
                } else if (info.alarm.almClass === alarmClasses.Normal.enum) {
                    xml += say('Hello, this is a message from info-scan.');
                } else {
                    xml += say('Hello, this is ' + getAorAn(alarmClassText) + ' ' + alarmClassText + ' message from info-scan.');
                }

                if (human) {
                    if (ackIsAllowed) {
                        xml += '<Gather numDigits="1">';
                    }

                    while (numberRepeats-- > 0) {
                        xml += say(info.notifyLog.message);

                        if (ackIsAllowed) {
                            xml += say('Press 1 to acknowledge this alarm. Hangup to end this call without acknowledging this alarm.');
                        } else if (alarmIsAcknowledged) {
                            xml += say('This alarm was just acknowledged by user ' + info.alarm.ackUser);
                        }
                        if (numberRepeats > 0) {
                            xml += say('Stay on the line to hear this message again.');
                            xml += pause(2);
                        } else if (ackIsAllowed) {
                            xml += pause(2);
                        }
                    }

                    if (ackIsAllowed) {
                        xml += '</Gather>';
                    }
                } else {
                    xml += say(info.notifyLog.message);
                }

                xml += say('Thank you and goodbye.');
                xml += pause(1);
                xml += '</Response>';
                sendResponse();
            }
        }
    }
    twilioVoiceAlarmStatus(data) {
        let sid = data && data.CallSid,
            criteria;

        if (sid) {
            criteria = {
                collection: 'NotifyLogs',
                query: {
                    'apiResult.sid': sid
                },
                updateObj: {
                    '$push': {
                        'callStatus': data
                    }
                }
            };
            Utility.update(criteria, function (err) {
                if (err) {
                    logger.error('/twilio/voice/alarms/status', err);
                }
            });
        }
    }
};

module.exports = Inbound;
