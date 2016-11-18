// initialized on server startup
// get all schedules from db
// for each, setup cron job


var fs = require('fs');

var moment = require('moment');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var config = require('config');

var CronJob = require('../models/cronjob');
var pageRender = require('../models/pagerender');
var mailer = require('../models/mailer');
var Utility = require('../models/utility');

var domain = 'http://' + (!!config.get('Infoscan.letsencrypt').enabled ? config.get('Infoscan.domains')[0] : 'localhost');
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
    var upi = schedule.referencePointUpi;
    var emails = [];
    Utility.getOne({
      collection: 'points',
      query: {
        _id: upi
      },
      fields: {
        Name: 1
      }
    }, function(err, point) {

      var reportName = point.Name;
      var users = schedule.users.map(function(id) {
        return ObjectID(id);
      });
      var time = schedule.runTime;
      var date = moment().format('YYYYMMDD');

      Scheduler.stopSchedule(schedule);

      if (!!schedule.enabled) {
        scheduleContainer[schedule._id] = new CronJob(time, function() {
          var path = [__dirname, '/../tmp/', date, reportName.split(' ').join(''), '.pdf'].join('');
          var uri = [domain, '/scheduleloader/report/scheduled/', upi, '/', schedule._id].join('');
          pageRender.renderPage(uri, path, function(err) {
            fs.readFile(path, function(err, data) {
              Utility.iterateCursor({
                collection: 'Users',
                query: {
                  _id: {
                    $in: users
                  }
                }
              }, function(err, user, nextUser) {
                // figure out date/time
                emails = emails.concat(user['Contact Info'].Value.filter(function(info) {
                  return info.Type === 'Email';
                }).map(function(email) {
                  return email.Value;
                }));

                nextUser();
              }, function(err, count) {
                emails = emails.concat(schedule.emails).join(',');
                mailer.sendEmail({
                  to: emails,
                  fromAccount: 'infoscan',
                  subject: [reportName, ' for ', date].join(''),
                  attachments: [{
                    path: path,
                    contentType: 'application/pdf',
                    content: data
                  }]
                }, function(err, info) {
                  console.log(err && err.code, info);
                });
              });
            });
          });
        });
      }

      cb();
    });
  },
  stopSchedule: function(schedule) {
    if (scheduleContainer.hasOwnProperty(schedule._id)) {
      scheduleContainer[schedule._id].stop();
    }
  }
};
module.exports = Scheduler;