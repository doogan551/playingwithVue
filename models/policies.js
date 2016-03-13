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
    if (typeof data.data._id === 'string' && data.data._id.length === 24) {
        data.data._id = new ObjectID(data.data._id);
    } else {
        data.data._id = new ObjectID();//new policy
        data.data.threads = [];
        data.data.members = data.data.members || [];
        data.data.memberGroups = data.data.memberGroups || [];
        data.data.alertConfigs = data.data.alertConfigs || [];
        data.data.scheduleLayers = data.data.scheduleLayers || [];
    }
    var criteria = {
      collection: 'NotifyPolicies',
      query: {
        _id: data.data._id
      },
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