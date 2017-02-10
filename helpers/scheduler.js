// initialized on server startup
// get all schedules from db
// for each, setup cron job

var CronJob = new(require('../models/cronjob'))();
var Utility = new(require('../models/utility'))();
var Schedule = new(require('../models/schedule'))();

var scheduleContainer = {};

var Scheduler = {
    buildAll: function (cb) {
        Utility.iterateCursor({
            collection: 'Schedules',
            query: {}
        }, function (err, schedule, nextSchedule) {
            Scheduler.buildCron(schedule, nextSchedule);
        },
            cb);
    },
    buildCron: function (schedule, cb) {
        Scheduler.stopSchedule(schedule);

        if (!!schedule.enabled) {
            var time = schedule.runTime;
            scheduleContainer[schedule._id] = new CronJob(time, function () {
                Schedule.runSchedule(schedule, function () {});
            });
            cb();
        } else {
            cb();
        }
    },
    stopSchedule: function (schedule) {
        if (scheduleContainer.hasOwnProperty(schedule._id)) {
            scheduleContainer[schedule._id].stop();
        }
    }
};
module.exports = Scheduler;
