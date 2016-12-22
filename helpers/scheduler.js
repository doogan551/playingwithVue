// initialized on server startup
// get all schedules from db
// for each, setup cron job

var moment = require('moment');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;

var CronJob = require('../models/cronjob');
var Utility = require('../models/utility');
var Schedule = require('../models/schedule');

var scheduleContainer = {};

var Scheduler = {
  buildAll: function(cb) {

    Utility.iterateCursor({
        collection: 'Schedules',
        query: {}
      }, function(err, schedule, nextSchedule) {
        Scheduler.buildCron(schedule, nextSchedule);
      },
      cb);
  },
  buildCron: function(schedule, cb) {

    Scheduler.stopSchedule(schedule);

    if (!!schedule.enabled) {
      var time = schedule.runTime;
      scheduleContainer[schedule._id] = new CronJob(time, function() {
        Schedule.runSchedule(schedule);

      });
      cb();
    } else {
      cb();
    }
  },
  stopSchedule: function(schedule) {
    if (scheduleContainer.hasOwnProperty(schedule._id)) {
      scheduleContainer[schedule._id].stop();
    }
  }
};
module.exports = Scheduler;