var DeviceTree = require('../models/devicetree.js');
var moment = require('moment');
var data;

describe('Device Tree Model', function() {
  beforeEach(function() {
    data = {
      user: global.adminUser
    };
  });

  it('should build tree', function(done) {

    DeviceTree.getTree(data, function(err, result) {
      expect(err).to.be.equal(undefined);
      expect(result).to.not.be.equal(undefined);
      expect(result.tree.length).to.not.be.equal(0);
      expect(result.networkNumbers.length).to.not.be.equal(0);
      expect(result.badNumbers.length).to.be.at.least(0);
      done(err);
    });
  });
});