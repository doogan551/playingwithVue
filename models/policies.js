var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

var Policies = function() {
  this.get = function(data, cb) {
    var criteria = {
      collection: 'NotifyPolicies',
      query: data.data || {}
    };
    Utility.get(criteria, cb);
  };
};

module.exports = new Policies();