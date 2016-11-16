var async = require('async');
var Utility = require('../models/utility');
var ObjectID = require('mongodb').ObjectID;
var self;

module.exports = self = {
    getSchedules: function (data, callback) {
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
                    referencePointUpi: data.upi
                }
            };

        Utility.get(criteria, callback);
    },
    saveSchedules: function (data, callback) {
        // data = {
        //     user: user,
        //     schedules: [] (array of schedule objects)
        // }
        var criteria = {
                collection: 'Schedules',
                query: {}
            },
            getOldSchedule = function (idata, cb) { // idata...'data' was already taken =/
                if (idata.newSchedule._id) { // If this is an existing point (_id field present)
                    idata.newSchedule._id = ObjectID(idata.newSchedule._id);
                    criteria.query._id = idata.newSchedule._id;
                    Utility.get(criteria, function (err, oldSchedule) {
                        idata.oldSchedule = oldSchedule;
                        cb(err, idata);
                    });
                } else {
                    cb(null, idata);
                }
            },
            doSave = function (idata, cb) {
                var fn;

                if (idata.oldSchedule) {
                    fn = 'update';
                    criteria.updateObj = idata.newSchedule;
                } else {
                    fn = 'insert';
                    criteria.insertObj = idata.newSchedule;
                }
                Utility[fn](criteria, function (err) {
                    cb(err, idata);
                });
            },
            doCronMaintenance = function (idata, cb) {
                var createCron = false,
                    deleteCron = false,
                    modifyCron = false;

                if (!idata.oldSchedule) { // If this is a new shcedule
                    createCron = true;
                } else if (idata.oldSchedule.enable ^ idata.newSchedule.enable) { // If enable flag changed
                    if (idata.newSchedule.enable) {
                        createCron = true;
                    } else {
                        deleteCron = true;
                    }
                } else if (idata.oldSchedule.runTime !== idata.newSchedule.runTime) { // If runtime changed
                    modifyCron = true;
                }

                if (createCron) {
                    // TODO Install CRON @ newSchedule.runTime
                } else if (deleteCron) {
                    // TODO Delete CRON @ newSchedule.runTime
                } else if (modifyCron) {
                    // TODO Reinstall CRON @ newSchedule.runTime
                }

                cb(null, idata);
            },
            processSchedule = function (schedule, cb) {
                var start = function (cb) {
                        cb(null, {
                            newSchedule: schedule
                        });
                    };

                async.waterfall([start, getOldSchedule, doSave, doCronMaintenance], cb);
            };

        async.eachSeries(data.schedules, processSchedule, callback);
    },
    runSchedule: function (data, callback) {
        // data = {
        //     user: user,
        //     schedule: {} (schedule object)
        // }

        // TODO
        callback(null);
    }
};