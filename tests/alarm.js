var Alarm = require('../models/alarm');

describe('Alarm Model', function() {
   it('should return between 0 and 200 recent alarms', function(done) {
        Alarm.getRecentAlarms({
            user: adminUser
        }, function(err, recentAlarms) {
            expect(err).to.not.be.ok;
            expect(recentAlarms).to.be.ok;
            done();
        });
    });
});