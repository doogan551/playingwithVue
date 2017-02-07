let CronJob = require('cron').CronJob;

/////////////////////////////////////////////////////
// Second Minute Hour DayOfMonth Month DayOfWeek   //
// 01     01     01   01         01    01          //
// will run Jan 1 at 01:01:01 if it is a monday    //
//                                                 //
// 01 * * * * *                                    //
// will run every minute, 1 second past the minute //
/////////////////////////////////////////////////////

let Cron = class Cron {
    /**
     * Creates an instance of Cron.
     *
     * @param {any} time  tells when cron job should run
     * @param {any} fx  The function ran when cron job executes
     * @param {any} onComplete  Function that runs when job finishes
     */
    constructor(time, fx, onComplete) {
        this.job = new CronJob({
            cronTime: time,
            onTick: fx,
            onComplete: onComplete,
            start: true,
            runOnInit: false
        });
    }

    /**
     * Helper function to allow a cron job to stop if needed
     *
     * @return {Undefined} Doesn't return. onComplete is auto called if provided.
     */
    stop() {
        this.job.stop();
    }
};


module.exports = Cron;
