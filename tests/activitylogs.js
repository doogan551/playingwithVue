var ActivityLog = require('../models/activitylog.js');
var query;

describe('Activity Logs Model', function () {
  beforeEach(function () {
    query = {
      "itemsPerPage": 200,
      "sort": "asc",
      "currentPage": 1,
      "usernames": [],
      "name1": "",
      "name2": "",
      "name3": "",
      "name4": "",
      "startDate": 0,
      "endDate": 0,
      user: global.adminUser
    };
  });

  it('should return no errors', function (done) {
    ActivityLog.get(query, function (err, logs) {
      expect(err).to.not.be.ok;
      done(err);
    });
  });
  
  it('should return 1 log', function (done) {
    query.name1 = '4200';
    ActivityLog.get(query, function (err, logs) {
      expect(err).to.not.be.ok;
      expect(logs.length).to.equal(1);
      done(err);
    });
  });
  
  it('should return 0 logs', function (done) {
    query.name1 = 'X';
    ActivityLog.get(query, function (err, logs) {
      expect(err).to.not.be.ok;
      expect(logs.length).to.equal(0);
      done(err);
    });
  });
  
  it('should return 1 log', function (done) {
    query.itemsPerPage = 1;
    ActivityLog.get(query, function (err, logs) {
      expect(err).to.not.be.ok;
      expect(logs.length).to.equal(1);
      done(err);
    });
  });
  
  it('should return 10 logs', function (done) {
    query.numberItems = 10;
    ActivityLog.get(query, function (err, logs) {
      expect(err).to.not.be.ok;
      expect(logs.length).to.equal(10);
      done(err);
    });
  });
});