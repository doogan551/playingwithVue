var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);
var ObjectID = require('mongodb').ObjectID;

var Policies = function() {
  this.get = function(data, cb) {
    var criteria = {
      collection: 'NotifyPolicies',
      query: data.data || {}
    };
    Utility.get(criteria, cb);
  };
  this.save = function (data, cb) {
    data.data._id = new ObjectID(data.data._id);
    var criteria = {
      collection: 'NotifyPolicies',
      options: {
        upsert: true
      },
      updateObj: {
        $set: data.data || {}
      }
    };
    Utility.update(criteria, cb);
  };
};

module.exports = new Policies();