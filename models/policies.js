const ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');
const moment = require('moment');

const logger = require('../helpers/logger')(module);

const Policies = class Policies {
    get(data, cb) {
        const notifyPolicies = new NotifyPolicies();
        let criteria = {
            query: data.data || {}
        };
        notifyPolicies.get(criteria, cb);
    }

    save(rawData, cb) {
        const notifications = new Notifications();
        let data;
        let newID;
        let callback = (err) => {
            let complete = (removeErr) => {
                if (removeErr) {
                    logger.debug('Error removing threads for policy:', newID, removeErr);
                }

                cb(err, {
                    id: newID.toString()
                });
            };

            if (data.enabled === false) {
                notifications.removeThreads(data._id, complete);
            } else {
                complete();
            }
        };
        let convertStrings = (obj) => {
            let key,
                prop,
                type,
                c,
                matrix = {
                    object: (o) => {
                        return convertStrings(o);
                    },
                    string: (o) => {
                        let ret;

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
                    array: (o) => {
                        let arr = [];
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
        let doUpdate = () => {
            const notifyPolicies = new NotifyPolicies();
            let criteria = {
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

            notifyPolicies.update(criteria, callback);
        };

        data = convertStrings(rawData);

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
    }

    delete(data, cb) {
        const notifyPolicies = new NotifyPolicies();
        const point = new Point();
        let criteria = {
            query: {
                _id: data._id
            }
        };
        let updatePoints = (err) => {
            if (err) {
                return cb(err);
            }
            let criteria = {
                query: {
                    'Notify Policies': data._id.toString()
                },
                updateObj: {
                    $pull: {
                        'Notify Policies': data._id.toString()
                    }
                }
            };
            point.updateOne(criteria, cb);
        };
        notifyPolicies.remove(criteria, updatePoints);
    }

    processRotateConfig(data, config, task, cb) {
        const notifyScheduledTasks = new NotifyScheduledTasks();
        let criteria = {
                query: {
                    policyID: data.policyID.toString(),
                    'config.alertConfigID': data.alertConfigID,
                    'config.groupID': data.groupID,
                    'config.escalationID': data.escalationID
                }
            },
            taskTemplate = {
                type: 'RECURRING',
                action: task,
                policyID: data.policyID.toString(),
                nextAction: null,
                interval: config.scale * 7,
                config: {
                    alertConfigID: data.alertConfigID,
                    groupID: data.groupID,
                    escalationID: data.escalationID
                },
                lastAction: null
            };

        notifyScheduledTasks.getAll(criteria, (err, docs) => {
            let nextAction,
                now = moment(),
                taskList = [],
                setLastAction = (last) => {
                    if (last) {
                        nextAction = moment(last);
                        nextAction.seconds(0).milliseconds(0);
                        // console.log('Previous Action', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));
                        // console.log();
                        nextAction.add(config.scale, 'w');
                        while (nextAction.isBefore(now)) {
                            //do rotate
                            taskTemplate.nextAction = nextAction.valueOf();
                            taskTemplate.type = 'ONETIME';
                            taskList.push(JSON.parse(JSON.stringify(taskTemplate)));
                            // console.log('Run Task--added', config.scale, 'week', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));
                            nextAction.add(config.scale, 'w');
                        }
                    } else {
                        nextAction = moment();
                    }

                    // console.log(JSON.stringify(taskList, null, 3));

                    nextAction.day(config.day);

                    taskTemplate.type = 'RECURRING';

                    nextAction.hour(config.time / 100).minute(config.time % 100).seconds(0).milliseconds(0);

                    if (nextAction.isBefore(now)) {
                        nextAction.add(1, 'w');
                    }
                    // console.log();
                    // console.log('Next Action:', nextAction.format('dddd, MMMM Do YYYY, h:mm:ss a'));

                    taskTemplate.nextAction = nextAction.valueOf();
                    taskList.push(taskTemplate);
                    cb(taskList);
                };

            if (err) {
                logger.debug(err);
            }

            // console.log('------');

            // console.log(config);

            // console.log(docs.length, 'found');

            if (docs.length === 0) {
                //no deletes needed
                //no updates
                setLastAction();
            } else {
                _.each(docs, (doc) => {
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
    }

    processScheduledTasks(policy, cb) {
        const notifyScheduledTasks = new NotifyScheduledTasks();
        let policyID = policy._id.toString(),
            count = 0,
            newTasks = [],
            found = false,
            insertTasks = () => {
                let criteria = {
                    insertObj: newTasks
                };

                // console.log('Inserting for policy', policyID);
                notifyScheduledTasks.insert(criteria, (err) => {
                    if (err) {
                        logger.debug('Insert err', JSON.stringify(err));
                    }

                    cb();

                    // console.log('Done with policy', policyID);
                });
            },
            deleteTasks = (callback) => {
                let criteria = {
                    query: {
                        policyID: policyID
                    }
                };

                // console.log('Deleting from policy', typeof policyID, policyID);
                notifyScheduledTasks.remove(criteria, (err) => {
                    if (err) {
                        logger.debug('Remove err', JSON.stringify(err));
                    }

                    // console.log('Deleted from policy', policyID);
                    if (callback) {
                        callback();
                    } else {
                        cb();
                    }
                });
            },
            handleTaskList = (tasks) => {
                // console.log('handling tasks');
                newTasks = newTasks.concat(tasks);
                count--;
                if (count === 0) {
                    // console.log('done', newTasks);
                    deleteTasks(insertTasks);
                }
            };

        _.each(policy.alertConfigs, (alertConfig) => {
            let data = {
                policyID: policyID,
                alertConfigID: alertConfig.id,
                groupID: null,
                escalationID: null
            };

            if (alertConfig.groups.length > 1) {
                count++;
                found = true;
                self.processRotateConfig(data, alertConfig.rotateConfig, 'rotateGroup', handleTaskList);
            }

            _.each(alertConfig.groups, (group) => {
                _.each(group.escalations, (escalation) => {
                    let rotateConfig = escalation.rotateConfig,
                        data = {
                            policyID: policyID,
                            alertConfigID: alertConfig.id,
                            groupID: group.id,
                            escalationID: escalation.id
                        };

                    if (rotateConfig.enabled && escalation.alertStyle !== 'Everyone') {
                        found = true;
                        count++;
                        self.processRotateConfig(data, rotateConfig, 'rotateMembers', handleTaskList);
                    }
                });
            });
        });

        if (!found) {
            deleteTasks(cb);
        }
    }
};

module.exports = Policies;
const Notifications = require('./notifications');
const NotifyPolicies = require('./notifypolicies');
const NotifyScheduledTasks = require('./notifyscheduledtasks');
const Point = require('./point');
