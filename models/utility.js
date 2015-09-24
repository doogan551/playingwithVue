var db = require('../helpers/db');
var winston = require('winston');

exports.get = function (criteria, cb) {
  var query = (!!criteria.query) ? criteria.query : {};
  var coll = criteria.collection;
  var limit = (!!criteria.limit) ? criteria.limit : 0;
  var fields = (!!criteria.fields) ? criteria.fields : {};
  var sort = (!!criteria.sort) ? criteria.sort : {};
  var skip = (!!criteria.skip) ? criteria.skip : 0;
  var collection;

  if (!coll) {
    return cb({
      err: "Please provide a collection."
    });
  }

  // console.log(query, coll);
  collection = db.get().collection(coll);

  collection.find(query, fields).limit(limit).toArray(cb);
};

exports.getOne = function (criteria, cb) {
  var query = (!!criteria.query) ? criteria.query : {};
  var coll = criteria.collection;
  var fields = (!!criteria.fields) ? criteria.fields : {};
  var collection;

  if (!coll) {
    return cb({
      err: "Please provide a collection."
    });
  }

  // console.log(query, coll);
  collection = db.get().collection(coll);

  collection.findOne(query, fields, cb);
};

exports.aggregate = function (criteria, cb) {
  var query = (!!criteria.query) ? criteria.query : {};
  var coll = criteria.collection;
  var collection;

  if (!coll) {
    return cb({
      err: "Please provide a collection."
    });
  }

  collection = db.get().collection(coll);

  collection.aggregate(query, cb);
};

exports.update = function (criteria, cb) {
  var query = (!!criteria.query) ? criteria.query : {};
  var updateObj = (!!criteria.updateObj) ? criteria.updateObj : {};
  var options = (!!criteria.options) ? criteria.options : {};
  var coll = criteria.collection;
  var collection;

  if (!coll) {
    return cb({
      err: "Please provide a collection."
    });
  }

  collection = db.get().collection(coll);

  collection.update(query, updateObj, options, cb);
};

exports.findAndModify = function (criteria, cb) {
  var query = (!!criteria.query) ? criteria.query : {};
  var sort = (!!criteria.sort) ? criteria.sort : [];
  var updateObj = (!!criteria.updateObj) ? criteria.updateObj : {};
  var options = (!!criteria.options) ? criteria.options : {};
  var coll = criteria.collection;
  var collection;

  if (!coll) {
    return cb({
      err: "Please provide a collection."
    });
  }

  collection = db.get().collection(coll);

  collection.findAndModify(query, sort, updateObj, options, function(err, result){
    if(err){
      return cb(err);
    }else{
      return cb(null, result.value);
    }
  });
};

exports.count = function (criteria, cb) {
  var query = (!!criteria.query) ? criteria.query : {};
  var coll = criteria.collection;
  var collection;

  if (!coll) {
    return cb({
      err: "Please provide a collection."
    });
  }

  // console.log(query, coll);
  collection = db.get().collection(coll);

  collection.count(query, cb);
};

exports.findAndCount = function (critera, cb) {
  var _points;

  exports.get(critera, function (err, points) {
    if (err) {
      return cb(err);
    } else {
      _points = points;

      exports.count(critera, function (err, count) {
        cb(err, _points, count);
      });
    }
  });
};
