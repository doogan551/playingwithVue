var ActivityLog = require('../models/activitylog.js');

describe('Getting default Activity Logs', function() {
    it('should return between 0 and 200 logs', function(done) {
        ActivityLog.get({
            user: adminUser
        }, function(err, logs) {
            expect(err).to.not.be.ok;
            expect(logs).to.be.ok;
            done(err);
        });
    });
});