let async = require('async');
let ObjectID = require('mongodb').ObjectID;

const Common = new(require('./common'))();
let Reports = require('../models/reports');
const utils = require('../helpers/utils');
const schedulesCollection = utils.CONSTANTS('schedulesCollection');

let Schedule = class Schedule extends Common {
    constructor() {
        super(schedulesCollection);
    }

    getSchedules(data, callback) {
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

        let criteria = {
            query: {
                upi: data.upi
            }
        };

        this.getAll(criteria, callback);
    }
    saveSchedules(data, callback) {
        // data = {
        //     user: user,
        //     schedules: [] (array of schedule objects)
        // }
        let criteria = {
                query: {}
            },
            getOldSchedule = (idata, cb) => { // idata...'data' was already taken =/
                if (idata.schedule._id) { // If this is an existing point
                    idata.schedule._id = ObjectID(idata.schedule._id);
                    criteria.query._id = idata.schedule._id;

                    if (!idata.schedule.deleteMe) {
                        this.get(criteria, (err, oldSchedule) => {
                            idata.oldSchedule = oldSchedule;
                            cb(err, idata);
                        });
                        return;
                    }
                }

                cb(null, idata);
            },
            doSave = (idata, cb) => {
                let fn;

                if (idata.schedule.deleteMe) {
                    fn = 'remove';
                } else if (idata.oldSchedule) {
                    fn = 'updateOne';
                    criteria.updateObj = idata.schedule;
                } else {
                    fn = 'insert';
                    criteria.insertObj = idata.schedule;
                }
                this[fn](criteria, (err) => {
                    cb(err, idata);
                });
            },
            doCronMaintenance = (idata, cb) => {
                let createCron = false,
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
            processSchedule = (schedule, cb) => {
                let start = (cb) => {
                    cb(null, {
                        schedule: schedule
                    });
                };

                async.waterfall([start, getOldSchedule, doSave, doCronMaintenance], cb);
            };

        async.eachSeries(data.schedules, processSchedule, callback);
    }
    runSchedule(data, callback) {
        this.getOne({
            query: {
                _id: ObjectID(data._id)
            }
        }, (err, schedule) => {
            data.schedule = schedule;
            switch (data.schedule.type) {
                case 1:
                    return Reports.scheduledReport(data, callback);
                default:
                    return callback();
            }
        });
    }
    remove(data, callback) {
        this.remove({
            query: {
                upi: data.upi
            }
        }, callback);
    }
    disable(data, callback) {
        this.findAndModify({
            query: {
                upi: data.upi
            },
            updateObj: {
                $set: {
                    enabled: false
                }
            }
        }, callback);
    }
};


module.exports = Schedule;
