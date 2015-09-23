var ObjectID = require('mongodb').ObjectID;
var Utility = require('./utility');

exports.get = function (criteria, cb) {
  Utility.get(criteria, cb);
};

exports.findByUsername = function (username, cb) {
  var collection = db.get().collection('Users');

  collection.find({
    username: username
  }).toArray(cb);
};

exports.findById = function (id, cb) {
  var collection = db.get().collection('Users');

  collection.find({
    _id: new ObjectID(id)
  }).toArray(cb);
};
