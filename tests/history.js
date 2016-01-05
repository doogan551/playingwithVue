var moment = require('moment');

var History = require('../models/history.js');
var data;
var upis = {
  'demand': [918918, 918919, 918920, 918921, 918922, 918923, 918924, 918925, 918926, 918927, 918928, 918929, 918930, 918931, 918932, 918933, 918934, 918935, 918936, 918937, 918938, 918939, 918940, 918941, 918942, 918943, 918944, 918945, 918947, 918949, 918950, 918951, 918952, 918953],
  'consumption': [918990, 918991, 918992, 918993, 918994, 918995, 918996, 918997, 918998, 918999, 919000, 919001, 919002, 919003, 919004, 919005, 919006, 919007, 919008, 919009, 919010, 919011, 919012, 919013, 919014, 919015, 919016, 919017, 919018, 919019, 919020, 919021, 919022, 919023],
  'reactive': [918956, 918957, 918958, 918959, 918960, 918961, 918962, 918963, 918964, 918965, 918966, 918967, 918968, 918969, 918970, 918971, 918972, 918973, 918974, 918975, 918976, 918977, 918978, 918979, 918980, 918981, 918982, 918983, 918984, 918985, 918986, 918987, 918988, 918989]
};

describe('History Model', function() {
  beforeEach(function() {
    data = {
      user: global.adminUser
    };
  });

  it('should get meters', function(done) {
    data.upis = [918981];

    History.getMeters(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      done(err);
    });
  });

  it('should get month by month demand max', function(done) {
    data.options = [{
      "touid": "test",
      "utilityName": "Electricity",
      "range": {
        "start": moment('7/1/2015', 'M/D/YYYY').unix(),
        "end": moment('8/1/2015', 'M/D/YYYY').unix()
      },
      "fiscalYear": 2015,
      "type": "demand",
      "scale": "month",
      "fx": "max",
      "upis": upis.demand
    }];

    History.getUsage(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      expect(result[0].results.maxes.length).to.be.equal(1);
      done(err);
    });
  });

  it('should get month by day demand max', function(done) {
    data.options = [{
      "touid": "test",
      "utilityName": "Electricity",
      "range": {
        "start": moment('7/1/2015', 'M/D/YYYY').unix(),
        "end": moment('8/1/2015', 'M/D/YYYY').unix()
      },
      "fiscalYear": 2015,
      "type": "demand",
      "scale": "day",
      "fx": "max",
      "upis": upis.demand
    }];

    History.getUsage(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      expect(result[0].results.maxes.length).to.be.equal(31);
      done(err);
    });
  });

  it('should get month by week demand max', function(done) {
    data.options = [{
      "touid": "test",
      "utilityName": "Electricity",
      "range": {
        "start": moment('7/1/2015', 'M/D/YYYY').unix(),
        "end": moment('8/1/2015', 'M/D/YYYY').unix()
      },
      "fiscalYear": 2015,
      "type": "demand",
      "scale": "week",
      "fx": "max",
      "upis": upis.demand
    }];

    History.getUsage(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      expect(result[0].results.maxes.length).to.be.equal(4);
      done(err);
    });
  });

  it('should get week by week demand max', function(done) {
    data.options = [{
      "touid": "test",
      "utilityName": "Electricity",
      "range": {
        "start": moment('7/1/2015', 'M/D/YYYY').unix(),
        "end": moment('7/8/2015', 'M/D/YYYY').unix()
      },
      "fiscalYear": 2015,
      "type": "demand",
      "scale": "week",
      "fx": "max",
      "upis": upis.demand
    }];

    History.getUsage(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      expect(result[0].results.maxes.length).to.be.equal(1);
      done(err);
    });
  });

  it('should get week by day demand max', function(done) {
    data.options = [{
      "touid": "test",
      "utilityName": "Electricity",
      "range": {
        "start": moment('7/1/2015', 'M/D/YYYY').unix(),
        "end": moment('7/8/2015', 'M/D/YYYY').unix()
      },
      "fiscalYear": 2015,
      "type": "demand",
      "scale": "day",
      "fx": "max",
      "upis": upis.demand
    }];

    History.getUsage(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      expect(result[0].results.maxes.length).to.be.equal(7);
      done(err);
    });
  });

  it('should get day by day demand max', function(done) {
    data.options = [{
      "touid": "test",
      "utilityName": "Electricity",
      "range": {
        "start": moment('7/1/2015', 'M/D/YYYY').unix(),
        "end": moment('7/2/2015', 'M/D/YYYY').unix()
      },
      "fiscalYear": 2015,
      "type": "demand",
      "scale": "day",
      "fx": "max",
      "upis": upis.demand
    }];

    History.getUsage(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      expect(result[0].results.maxes.length).to.be.equal(1);
      done(err);
    });
  });

  it('should get day by half-hour demand max', function(done) {
    data.options = [{
      "touid": "test",
      "utilityName": "Electricity",
      "range": {
        "start": moment('7/1/2015', 'M/D/YYYY').unix(),
        "end": moment('7/2/2015', 'M/D/YYYY').unix()
      },
      "fiscalYear": 2015,
      "type": "demand",
      "scale": "half-hour",
      "fx": "max",
      "upis": upis.demand
    }];

    History.getUsage(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      expect(result[0].results.maxes.length).to.be.equal(48);
      done(err);
    });
  });

  it('should get week by half-hour demand max', function(done) {
    data.options = [{
      "touid": "test",
      "utilityName": "Electricity",
      "range": {
        "start": moment('7/1/2015', 'M/D/YYYY').unix(),
        "end": moment('7/8/2015', 'M/D/YYYY').unix()
      },
      "fiscalYear": 2015,
      "type": "demand",
      "scale": "half-hour",
      "fx": "max",
      "upis": upis.demand
    }];

    History.getUsage(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      expect(result[0].results.maxes.length).to.be.equal(7*48);
      done(err);
    });
  });

  it('should get month by half-hour demand max', function(done) {
    data.options = [{
      "touid": "test",
      "utilityName": "Electricity",
      "range": {
        "start": moment('7/1/2015', 'M/D/YYYY').unix(),
        "end": moment('8/1/2015', 'M/D/YYYY').unix()
      },
      "fiscalYear": 2015,
      "type": "demand",
      "scale": "half-hour",
      "fx": "max",
      "upis": upis.demand
    }];

    History.getUsage(data, function(err, result) {
      expect(err).to.be.equal(null);
      expect(result).to.not.be.equal(undefined);
      expect(result.length).to.be.equal(1);
      expect(result[0].results.maxes.length).to.be.equal(31*48);
      done(err);
    });
  });
});

/*getMeters
getUsage
getMissingMeters
editDatastore
importCSV
exportCSV
uploadCSV
findHistory
findLatest
runBackUp
buildOps
unbuildOps
getUsage*/