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
  this.save = function(data, cb) {
    var criteria = {
      collection: 'NotifyPolicies',
      query: {
        _id: data._id
      },
      options: {
        upsert: true
      },
      updateObj: {
        $set: data || {}
      }
    };
    Utility.update(criteria, cb);
  };
  this.delete = function(data, cb) {
    var criteria = {
      collection: 'NotifyPolicies',
      query: {
        _id: data._id
      }
    };
    var updatePoints = function(err) {
      if (err) {
        return cb(err);
      }
      var criteria = {
        collection: 'points',
        query: {
          'Notify Policies': data._id.toString()
        },
        updateObj: {
          $pull: {
            'Notify Policies': data._id.toString()
          }
        }
      };
      Utility.update(criteria, cb);
    };
    Utility.remove(criteria, updatePoints);
  };
};

module.exports = new Policies();