let ActivityLog = new(require('../models/activitylog.js'))();

describe('Activity Logs Model', function () {
    it('should build 4 name segments', function () {
        let query = {};
        let data = {
            name1: 'Name1',
            name2: 123,
            name4: 'Name4'
        };
        ActivityLog.addNamesToQuery(data, query, 'name1');
        ActivityLog.addNamesToQuery(data, query, 'name2');
        ActivityLog.addNamesToQuery(data, query, 'name3');
        ActivityLog.addNamesToQuery(data, query, 'name4');

        expect(query.name1).to.deep.equal(new RegExp(/^Name1/i));
        expect(query.name2).to.deep.equal(new RegExp(/^123/i));
        expect(query.name3).to.equal('');
        expect(query.name4).to.deep.equal(new RegExp(/^Name4/i));
    });
});
