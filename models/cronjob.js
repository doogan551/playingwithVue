var CronJob = require('cron').CronJob;

// Second Minute Hour DayOfMonth Month DayOfWeek
// 01     01     01   01         01    01
// will run Jan 1 at 01:01:01 if it is a monday
// 
// 01 * * * * *
// will run every minute, 1 second past the minute

var Cron = function(time, fx) {
  this.job = new CronJob({
    cronTime: time,
    onTick: fx,
    onComplete: function(){
      console.log(time, 'job completed');
    },
    start: true,
    runOnInit: false
  });
};

Cron.prototype.stop = function() {
  this.job.stop();
};

module.exports = Cron;