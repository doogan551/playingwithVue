// initialized on server startup
// get all schedules from db
// for each, setup cron job


var fs = require('fs');

var moment = require('moment');
var async = require('async');

var CronJob = require('../models/cronjob');
var pageRender = require('../models/pagerender');
var mailer = require('../models/mailer');

module.exports = function(cb) {
  var schedules = [{
    test: 1
  }];

  async.each(schedules, function(schedule, callback) {
    var reportName = '[REPORTNAME]';
    var reportUpi = 80;
    var userEmail = 'rkendall@dorsett-tech.com';
    var date = moment().format('YYYYMMDD');

    // figure out date/time
    new CronJob('* * 16 * * *', function() {
      var path = [__dirname, '/../tmp/', date, reportName, '.pdf'].join('');
      pageRender.renderPage('http://localhost/scheduleloader/report/scheduled/' + reportUpi, path, function(err) {
        fs.readFile(path, function(err, data) {
          mailer.sendEmail({
            to: userEmail,
            fromAccount: 'infoscan',
            subject: [reportName, ' for ', date].join(''),
            attachments: [{
              filePath: path,
              contentType: 'application/pdf',
              contents: data
            }]
          }, function(err, info) {
            console.log(err && err.code, info);
          });
        });
      });
    });

    callback();
  }, cb);
};