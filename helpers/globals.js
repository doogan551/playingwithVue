var System = require('../models/System');

module.exports = {
  setGlobals: function(cb) {
    System.getQualityCodes({}, function(err, codes) {
      global.qualityCodes = codes.Entries;
      return cb();
    });
  }
};