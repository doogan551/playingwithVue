var async = require('async');
var ObjectID = require('mongodb').ObjectID;

var Utility = require('../models/utility');
var Reports = require('../models/reports');

var self;

module.exports = self = {
    getSchedules: function(data, callback) {
        // data = {
        //     user: user,
        //     upi: int
        // }

        // At the time of this writing, the db schedule object looks like:
        // {
        //     _id : ObjectId,
        //     runTime: cron string,
        //     type: int, (1, reports)
        //     referencePointUpi: int,
        //     optionalParameters: {
        //         duration: object,
        //         interval: object
        //     },
        //     users: array of user ids,
        //     emails: array of email strings,
        //     enabled: boolean
        // }

        var criteria = {
            collection: 'Schedules',
            query: {
                upi: data.upi
            }
        };

        Utility.get(criteria, callback);
    },
    saveSchedules: function(data, callback) {
        // data = {
        //     user: user,
        //     schedules: [] (array of schedule objects)
        // }
        var criteria = {
                collection: 'Schedules',
                query: {}
            },
            getOldSchedule = function(idata, cb) { // idata...'data' was already taken =/
                if (idata.schedule._id) { // If this is an existing point
                    idata.schedule._id = ObjectID(idata.schedule._id);
                    criteria.query._id = idata.schedule._id;

                    if (!idata.schedule.deleteMe) {
                        Utility.get(criteria, function(err, oldSchedule) {
                            idata.oldSchedule = oldSchedule;
                            cb(err, idata);
                        });
                        return;
                    }
                }

                cb(null, idata);
            },
            doSave = function(idata, cb) {
                var fn;

                if (idata.schedule.deleteMe) {
                    fn = 'remove';
                } else if (idata.oldSchedule) {
                    fn = 'update';
                    criteria.updateObj = idata.schedule;
                } else {
                    fn = 'insert';
                    criteria.insertObj = idata.schedule;
                }
                Utility[fn](criteria, function(err) {
                    cb(err, idata);
                });
            },
            doCronMaintenance = function(idata, cb) {
                var createCron = false,
                    deleteCron = false,
                    modifyCron = false;

                if (idata.schedule.deleteMe) {
                    deleteCron = true;
                } else if (!idata.oldSchedule) { // If this is a new shcedule
                    createCron = true;
                } else if (idata.oldSchedule.enable ^ idata.schedule.enable) { // If enable flag changed
                    if (idata.schedule.enable) {
                        createCron = true;
                    } else {
                        deleteCron = true;
                    }
                } else if (idata.oldSchedule.runTime !== idata.schedule.runTime) { // If runtime changed
                    modifyCron = true;
                }

                if (createCron) {
                    // TODO Install CRON @ schedule.runTime
                } else if (deleteCron) {
                    // TODO Delete CRON @ schedule.runTime
                } else if (modifyCron) {
                    // TODO Reinstall CRON @ schedule.runTime
                }

                cb(null, idata);
            },
            processSchedule = function(schedule, cb) {
                var start = function(cb) {
                    cb(null, {
                        schedule: schedule
                    });
                };

                async.waterfall([start, getOldSchedule, doSave, doCronMaintenance], cb);
            };

        async.eachSeries(data.schedules, processSchedule, callback);
    },
    runSchedule: function(data, callback) {
        // data = {
        //     user: user,
        //     schedule: {} (schedule object)
        // }

        switch (data.schedule.type) {
            case 1:
                return Reports.scheduledReport(data, callback);
            default:
                return callback();
        }
    }
};