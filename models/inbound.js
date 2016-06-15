var utility = require('../models/utility');
var async = require('async');
var config = require('config');
var logger = require('../helpers/logger')(module);
var Config = require('../public/js/lib/config.js');
var ObjectID = require('mongodb').ObjectID;
var Notifier = require('../models/notifierutility');
var alarmUtility = require('../models/alarm.js');
var serverName = require('os').hostname();

var notifier = new Notifier();

var infoscanConfig = config.get('Infoscan');
var alarmsEmailAccount = infoscanConfig.email.accounts.alarms;
var alarmsEmailAddress = alarmsEmailAccount + '@' + infoscanConfig.domains[0];

var enums = Config.Enums;
var revEnums = Config.revEnums;
var ackStatuses = enums['Acknowledge Statuses'];
var accessFlags = enums['Access Flags'];
var alarmClasses = enums['Alarm Classes'];

var emailHandler = {};
emailHandler[alarmsEmailAddress] = function (relay_message) {
    // Our waterfall functions are defined after the waterfall callback
    async.waterfall([
        getUser,
        getAlarm,
        getGroups,
        checkUserPermissions,
        ackAlarm
    ], function (err, data) {
        var html = '',
            sendReply = true,
            replyObj = {},
            msgId,
            references,
            getHeader = function (name) {
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
            },
            par = function (content, noStyle) {
                if (noStyle) {
                    return '<p>' + content + '</p>';
                } else {
                    return '<p style="font-family: Helvetica, Arial, sans-serif; font-size: 14px;">' + content + '</p>';
                }
            },
            lnk = function (to, mailto) {
                if (mailto) {
                    return '<a href="mailto:' + to + '" style="color: #15C;">' + to + '</a>';
                } else {
                    return '<a href=' + to + ' " style="color: #15C;">' + to + '</a>';
                }
            };

        if (data.user) {
            html =  par('Hi ' + data.user['First Name'].Value + ',');
        }

        if (err || data.err) {
            logger.error('Error processing received email', '/sparkpost/email', err || data.err, relay_message);

            if (err) {
                html += par("An unexpected error occurred which prevented us from acknowledging this alarm. An error log is attached which you can forward to " + lnk('engineering@dorsett-tech.com', true) + " for support. We apologize for the error.");

                // Add error log attachment
                replyObj.attachments = [{
                    filename: 'errorLog.txt',
                    contents: JSON.stringify({
                        siteName: infoscanConfig.location.site,
                        serverName: serverName,
                        timestamp: new Date().toString(),
                        relay_message: relay_message,
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
            html += par('<hr>' + relay_message.content.html, true);

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
            replyObj.to = relay_message.msg_from;
            replyObj.fromAccount = alarmsEmailAccount;
            replyObj.subject = relay_message.content.subject;
            replyObj.html = html;
            replyObj.generateTextFromHTML = true;
            replyObj.inReplyTo = msgId;
            replyObj.references = references;

            notifier.sendEmail(replyObj);
        }
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
                // We log this error but don't tell the user
                data.err = 'User not found';
            }
            cb(null, data);
        });
    }
    function getAlarm (data, cb) {
        if (data.err) {
            return cb(null, data);
        }

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
    function ackAlarm (data, cb) {
        if (data.err) {
            return cb(null, data);
        }

        var criteria = {
            ids: [data.alarm._id],
            username: data.user.username
        };

        alarmUtility.acknowledgeAlarm(criteria, function (err, result) {
            data.result = result;
            cb(err, data);
        });
    }
};

module.exports = {
    sparkpost: function (data) {
        var _data = Array.isArray(data) ? data[0]:null,
            relay_message = _data && _data.msys && _data.msys.relay_message,
            content = relay_message && relay_message.content,
            to = content && content.to[0],
            handler = to && emailHandler[to];

        // If we have a handler for this 'mailbox'
        if (!!handler) {
            handler(relay_message);
        }
    },
    twilio: {
        voice: {
            alarms: {
                answer: function (data, callback) {
                    var sid = data && data.CallSid;

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
                    function getNotifyLog (cb) {
                        var info = {},
                            criteria = {
                                collection: 'NotifyLogs',
                                query: {
                                    'apiResult.sid': sid
                                }
                            };

                        utility.getOne(criteria, function (err, notifyLog) {
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
                    function getAlarm (info, cb) {
                        if (info.err) {
                            return cb(null, info);
                        }

                        var criteria = {
                                collection: 'Alarms',
                                query: {
                                    _id: ObjectID(info.notifyLog.alarmId)
                                }
                            };

                        utility.getOne(criteria, function (err, alarm) {
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
                    function done (err, info) {
                        var ackIsAllowed,
                            digits = data && data.Digits,
                            human = data && (data.AnsweredBy === 'human'),
                            alarmClassText = info.alarm && revEnums['Alarm Classes'][info.alarm.almClass],
                            alarmIsAcknowledged = info.alarm && (info.alarm.ackStatus === ackStatuses.Acknowledged.enum),
                            alarmNotAcknowledged = info.alarm && (info.alarm.ackStatus === ackStatuses['Not Acknowledged'].enum),
                            xml = '<?xml version="1.0" encoding="UTF-8"?>',
                            numberRepeats = 3,
                            ackedBy,
                            criteria,
                            getAorAn = function (text) {
                                return !!~['a', 'e', 'i', 'o', 'u'].indexOf(text.charAt(0)) ? 'an':'a';
                            },
                            say = function (text) {
                                return '<Say voice="alice">' + text + '</Say>';
                            },
                            pause = function (length) {
                                var _length = length > 0 ? length:1;
                                return '<Pause length="' + _length + '"/>';
                            },
                            // Not using the below function, but keeping in case we ever need to build
                            // verbs into our notify message
                            // getMessageXML = function (msg) {
                            //  var variables = {
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
                            //              msgXML += variables[msg.slice(i, j+1)];
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
                            logger.error('Error processing post request', '/twilio/voice/alarms/answer', err || info.err, req);

                            if (digits) { // Presence of digits indicates we're already in an established call with the user and he/she has supplied digits to ack the alarm
                                xml += say("We encountered an unexpected error and could not acknowledge the alarm at this time.");
                            } else {
                                xml += say("Hello, this is a message from info-scan. We called to notify you about an alarm but we encountered an unexpected error and are unable to do so. Please log in to info-scan and check the alarms.");
                            }
                            xml += say("We apologize for the error. Thank you and goodbye.");

                            xml += '</Response>';
                            sendResponse();
                        }
                        // Presence of digits indicates we're already in an established call with the user and he/she has supplied digits to ack the alarm
                        // We fall into this case if user supplied the correct acknowledgement digit or if they didn't but the alarm has already been acknowledged by someone else during the call
                        else if (digits && ((digits === "1") || alarmIsAcknowledged)) {
                            if (alarmIsAcknowledged) {
                                xml += say("This alarm was just acknowledged by user " + info.alarm.ackUser + ".");
                                xml += say("Thank you and goodbye.");
                                xml += pause(1);
                                xml += '</Response>';
                                sendResponse();
                            } else {
                                criteria = {
                                    ids: [info.alarm._id],
                                    username: info.notifyLog.username
                                };

                                alarmUtility.acknowledgeAlarm(criteria, function (err, result) {
                                    if (err) {
                                        xml += say("We encountered an unexpected error and could not acknowledge the alarm at this time. We apologize for the error.");
                                    } else {
                                        xml += say("Alarm acknowledged.");
                                    }

                                    xml += say("Thank you and goodbye.");
                                    xml += pause(1);
                                    xml += '</Response>';
                                    sendResponse();
                                });
                            }
                        } else {
                            ackIsAllowed = info.notifyLog.userCanAck && alarmNotAcknowledged;
                            
                            // Presence of digits indicates we're already in an established call with the user and he/she has supplied incorrect digits to ack the alarm
                            if (digits) {
                                xml += say(digits.split('').join(' ') + " is an unrecognized input.");
                            } else {
                                if (info.alarm.almClass === alarmClasses.Normal.enum) {
                                    xml += say("Hello, this is a message from info-scan.");
                                } else {
                                    xml += say("Hello, this is " + getAorAn(alarmClassText) + " " + alarmClassText + " message from info-scan.");
                                }
                            }

                            if (human) {
                                if (ackIsAllowed) {
                                    xml += '<Gather numDigits="1">';
                                }

                                while (numberRepeats-- > 0) {
                                    xml += say(info.notifyLog.message);

                                    if (ackIsAllowed) {
                                        xml += say("Press 1 to acknowledge this alarm. Hangup to end this call without acknowledging this alarm.");
                                    } else if (alarmIsAcknowledged) {
                                        xml += say("This alarm was just acknowledged by user " + info.alarm.ackUser);
                                    }
                                    if (numberRepeats > 0) {
                                        xml += say("Stay on the line to hear this message again.");
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

                            xml += say("Thank you and goodbye.");
                            xml += pause(1);
                            xml += '</Response>';
                            sendResponse();
                        }
                    }
                },
                status: function (data) {
                    var sid = data && data.CallSid,
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
                        utility.update(criteria, function (err, result) {
                            if (err) {
                                logger.error('/twilio/voice/alarms/status', err);
                            }
                        });
                    }
                }
            }
        }
    }
};
