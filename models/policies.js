var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');
var moment = require('moment');

var Policies = function () {
    this.get = function (data, cb) {
        var criteria = {
            collection: 'NotifyPolicies',
            query: data.data || {}
        };
        Utility.get(criteria, cb);
    };
    this.save = function (data, cb) {
        var newID;
        var callback = function (err, points) {
            cb(err, {
                points: points,
                id: newID.toString()
            });
        };
        var convertStrings = function (obj) {
            var key,
                prop,
                type,
                c,
                propsToRemove = {
                    // 'xp:Value': true
                },
                matrix = {
                    object: function (o) {
                        return convertStrings(o);
                    },
                    string: function (o) {
                        var ret;

                        if (!o.match(/[^\d.]/g)) { //no characters, must be number
                            if (o.indexOf('.') > -1) {
                                ret = parseFloat(o);
                            } else {
                                ret = parseInt(o, 10);
                            }
                        } else {
                            ret = o;
                        }

                        return ret;
                    },
                    array: function (o) {
                        var arr = [];
                        for (c = 0; c < o.length; c++) {
                            arr[c] = convertStrings(o[c]);
                        }
                        return arr;
                    }
                };

            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    prop = obj[key];
                    type = typeof prop;
                    if (type === 'object') {
                        if (Array.isArray(prop)) {
                            type = 'array';
                        }
                    }
                    if (matrix[type]) {
                        obj[key] = matrix[type](prop);
                    }
                }
            }
            return obj;
        };
        var doUpdate = function () {
            var criteria = {
                collection: 'NotifyPolicies',
                query: {
                    _id: data._id
                },
                options: {
                    upsert: true
                },
                updateObj: {
                    $set: data || {}
                }
            };

            Utility.update(criteria, callback);
        };

        data = convertStrings(data);

        if (data._new === true) { //typeof data._id === 'string' && data._id.length === 24) {
            //new policy
            delete data._new;
            newID = new ObjectID();
            data._id = newID;
            // data.threads = [];
            // data.members = data.members || [];
            // data.memberGroups = data.memberGroups || [];
            // data.alertConfigs = data.alertConfigs || [];
            // data.scheduleLayers = data.scheduleLayers || [];
        } else {
            newID = new ObjectID(data._id);
            delete data.threads;
            data._id = newID;
        }

        this.processScheduledTasks(data, doUpdate);
    };

    this.delete = function (data, cb) {
        var criteria = {
            collection: 'NotifyPolicies',
            query: {
                _id: data._id
            }
        };
        var updatePoints = function (err) {
            if (err) {
                return cb(err);
            }
            var criteria = {
                collection: 'points',
                query: {
                    'Notify Policies': data._id.toString()
                },
                updateObj: {
                    $pull: {
                        'Notify Policies': data._id.toString()
                    }
                }
            };
            Utility.update(criteria, cb);
        };
        Utility.remove(criteria, updatePoints);
    };

    this.processRotateConfig = function (data, config, task) {
        var criteria = {
                collection: 'NotifyScheduledTasks',
                query: {
                    policyID: data.policyID.toString(),
                    'config.alertConfigID': data.alertConfigID,
                    'config.groupID': data.groupID,
                    'config.escalationID': data.escalationID
                }
            },
            taskTemplate = {
                type : 'RECURRING',
                action : task,
                policyID : data.policyID.toString(),
                nextAction : null,
                interval : config.scale * 7,
                config : {
                    alertConfigID : data.alertConfigID,
                    groupID : data.groupID,
                    escalationID : data.escalationID
                },
                lastAction : null
            },
            cfg = {
                day: 'Friday',
                enabled: true,
                scale: 1,
                time: 1700
            };

        Utility.get(criteria, function (err, docs) {
            var nextAction,
                now = moment(),
                taskList = [],
                insertTask = function (task) {

                },
                setLastAction = function (last) {
                    var nextMinute;

                    console.log();

                    if (last) {
                        nextMinute = moment().seconds(0).milliseconds(0).add(1, 'm');
                        nextAction = moment(last);
                        console.log('Previous Action', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));
                        console.log();
                        nextAction.add(config.scale, 'w');
                        while(nextAction.isBefore(now)) {
                            //do rotate
                            taskTemplate.nextAction = nextAction.valueOf();
                            taskTemplate.type = 'ONETIME';
                            taskList.push(JSON.parse(JSON.stringify(taskTemplate)));
                            console.log('Run Task--added', config.scale, 'week', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));
                            nextAction.add(config.scale, 'w');
                        }
                    } else {
                        nextAction = moment();
                    }

                    // console.log(JSON.stringify(taskList, null, 3));

                    nextAction.day(config.day);

                    if (nextAction.isBefore(moment())) {
                        nextAction.add(1, 'w');
                    }

                    nextAction.hour(config.time / 100).minute(config.time % 100).seconds(0);
                    console.log();
                    console.log('Next Action:', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));
                };

            if (err) {
                console.log(err);
            }

            console.log('------');

            console.log(config);

            console.log(docs.length, 'found');

            if (docs.length === 0) {
                //no deletes needed
                //no updates
                setLastAction();
            } else {
                _.each(docs, function (doc) {
                    // if (doc) {
                        setLastAction(doc.lastAction);
                        // taskTemplate.nextAction = nextAction.add(config.scale, 'w');
                        // console.log('found', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));
                    // } else {
                    //     setLastAction();
                    //     console.log('new', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));
                    // }
                });
            }

            // if (doc) {
            //     setLastAction(doc.lastAction);
            //     // taskTemplate.nextAction = nextAction.add(config.scale, 'w');
            //     console.log('found', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));
            // } else {
            //     setLastAction();
            //     console.log('new', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));
            // }
        });
    };

    this.processScheduledTasks = function (policy, cb) {
        var self = this;

        _.each(policy.alertConfigs, function (alertConfig) {
            var data = {
                    policyID: policy._id,
                    alertConfigID: alertConfig.id,
                    groupID: null,
                    escalationID: null
                };

            self.processRotateConfig(data, alertConfig.rotateConfig, 'rotateGroup');

            _.each(alertConfig.groups, function (group) {
                _.each(group.escalations, function (escalation) {
                    var rotateConfig = escalation.rotateConfig,
                        data = {
                            policyID: policy._id,
                            alertConfigID: alertConfig.id,
                            groupID: group.id,
                            escalationID: escalation.id
                        };

                    self.processRotateConfig(data, rotateConfig, 'rotateMembers');
                });
            });
        });

        cb();
    };
};

module.exports = new Policies();