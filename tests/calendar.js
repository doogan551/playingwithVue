var Calendar = require('../models/calendar.js');
var moment = require('moment');
var data;

describe('Calendar Model', function() {
  beforeEach(function() {
    data = {
      user: global.adminUser
    };
  });

  it('should add year', function(done) {
    data.year = moment().year();
    data.dates = [{
      "month": 1,
      "date": 1,
      "comment": "New Years Day"
    }, {
      "month": 1,
      "date": 19,
      "comment": "Dr. Martin Luther King's Birthday"
    }];

    Calendar.newDate(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(null);
      done(err);
    });
  });

  it('should get year', function(done) {
    data.year = moment().year();

    Calendar.getYear(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(null);
      done(err);
    });
  });

  it('should get season', function(done) {
    Calendar.getSeason(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(null);
      done(err);
    });
  });

  it('should update season', function(done) {
    data['Current Season'] = 'Cooling';
    Calendar.updateSeason(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.be.equal('success');
      done(err);
    });
  });
});