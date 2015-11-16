/*var ArchiveUtility = require('../models/archiveutility');
var moment = require('moment');
var criteria = {};
var year = moment().year();
var month = moment().format('MM');
var table = "History_"+year.toString()+month;

describe('Archive Utility Model', function () {
  beforeEach(function () {
    criteria = {
      statement:"select * from "+table +" limit 1",
      year: year
    };
  });

  it('should return no errors', function (done) {
    ArchiveUtility.get(criteria, function (err, logs) {
      expect(err).to.be.equal(null);
      done(err);
    });
  });

  it('should return 1 row', function (done) {
    ArchiveUtility.get(criteria, function (err, logs) {
      expect(err).to.be.equal(null);
      expect(logs.length).to.equal(1);
      done(err);
    });
  });

  it('should return 0 rows', function (done) {
    criteria.statement = "Select * from " + table + " where timestamp = 0";
    ArchiveUtility.get(criteria, function (err, logs) {
      expect(err).to.be.equal(null);
      expect(logs.length).to.equal(0);
      done(err);
    });
  });
});*/