var History = require('../models/history.js');
var data;

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