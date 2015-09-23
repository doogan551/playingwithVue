var db = require('../helpers/db');

exports.getGroupsWithUser = function (userid, cb) {
  var collection = db.get().collection('User Groups');
  var query = {};

  query['Users.' + userid] = {
    $exists: 1
  };

  collection.find(query).toArray(cb);
};
