var db = require('../helpers/db');
var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

exports.getGroupsWithUser = function(userid, cb) {
  var query = {};
  query['Users.' + userid] = {
    $exists: 1
  };

  var criteria = {
    collection: 'User Groups',
    query: query
  };
  Utility.get(criteria, cb);
};