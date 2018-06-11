let ActivityLog = require('../models/activitylog.js');
let activityLog = new ActivityLog();
let logObj;

describe('Activity Logs Model', function () {
    beforeEach(function () {
        logObj = {
            user: {
                _id: 'abcdefgh1234',
                username: 'tester'
            },
            activity: 'Reset',
            log: 'Device Reset'
        };
    });
    it('build an activity log object.', function () {
        let activityObj = activityLog.buildActivityLog(logObj);
        expect(activityObj).to.not.be.equal(undefined);
    });
});
