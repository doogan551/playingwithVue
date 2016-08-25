// start as service

// get all schedules from db
// cron
// email
// run reportRunner, et al.

var fs = require('fs');

var moment = require('moment');

var CronJob = require('../models/cronjob');
var pageRender = require('../models/pagerender');
var mailer = require('../models/mailer');

new CronJob('* * 16 * * *', function() {});
var path = __dirname + '/../tmp/' + moment().unix().toString() + 'report.pdf';
console.log(path);
pageRender.renderPage('http://localhost/scheduleloader/report/scheduled/80', path, function(err) {
  fs.readFile(path, function(err, data) {
    console.log('sending email', path, err, !!data);
    mailer.sendEmail({
      to: 'rkendall@dorsett-tech.com',
      fromAccount: 'infoscan',
      subject: 'REPORT',
      attachments: [{
        filePath: path,
        contentType: 'application/pdf',
        contents: data
      }]
    }, function(err, info) {
      console.log(err, info);
      process.exit(0);
    });
  });
});