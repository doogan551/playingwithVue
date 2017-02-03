var CronJob = require('cron').CronJob;

/////////////////////////////////////////////////////
// Second Minute Hour DayOfMonth Month DayOfWeek   //
// 01     01     01   01         01    01          //
// will run Jan 1 at 01:01:01 if it is a monday    //
//                                                 //
// 01 * * * * *                                    //
// will run every minute, 1 second past the minute //
/////////////////////////////////////////////////////

/**
 * Class constructor will create a new cron job
 *
 * @param {String} time       tells when cron job should run
 * @param {Function} fx       The function ran when cron job executes
 * @param {Function} onComplete Function that runs when job finishes
 */
var Cron = function(time, fx, onComplete) {
  this.job = new CronJob({
    cronTime: time,
    onTick: fx,
    onComplete: function(){
      console.log(time, 'job stopped');
    },
    start: true,
    runOnInit: false
  });
};

/**
 * Helper function to allow a cron job to stop if needed
 *
 * @return {Undefined} Doesn't return. onComplete is auto called if provided.
 */
Cron.prototype.stop = function() {
  this.job.stop();
};

module.exports = Cron;