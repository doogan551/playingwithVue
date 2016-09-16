var db = require('../helpers/db');
var logger = require("../helpers/logger")(module);

exports.get = function(criteria, cb) {
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
  collection.find(query, fields).limit(limit).sort(sort).skip(skip).toArray(cb);
};

exports.getOne = function(criteria, cb) {
  var query = (!!criteria.query) ? criteria.query : {};
  var coll = criteria.collection;
  var fields = (!!criteria.fields) ? criteria.fields : {};
  var collection;

  if (!coll) {
    return cb({
      err: "Please provide a collection."
    });
  }

  collection = db.get().collection(coll);

  collection.findOne(query, fields, cb);
};

exports.aggregate = function(criteria, cb) {
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

exports.update = function(criteria, cb) {
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

exports.save = function(criteria, cb) {
  var saveObj = criteria.saveObj;
  var options = (!!criteria.options) ? criteria.options : {};
  var coll = criteria.collection;
  var collection;

  if (!coll) {
    return cb({
      err: "Please provide a collection."
    });
  }

  collection = db.get().collection(coll);

  collection.save(saveObj, options, cb);
};

exports.findAndModify = function(criteria, cb) {
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

  collection.findAndModify(query, sort, updateObj, options, function(err, result) {
    if (err) {
      return cb(err);
    } else {
      return cb(null, result.value);
    }
  });
};

exports.count = function(criteria, cb) {
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

exports.findAndCount = function(criteria, cb) {
  var query = (!!criteria.query) ? criteria.query : {};
  var coll = criteria.collection;
  var limit = (!!criteria.limit) ? criteria.limit : 0;
  var fields = (!!criteria.fields) ? criteria.fields : {};
  var sort = (!!criteria.sort) ? criteria.sort : {};
  var skip = (!!criteria.skip) ? criteria.skip : 0;
  var collection;
  var cur;
  var t;

  if (!coll) {
    return cb({
      err: "Please provide a collection."
    });
  }

  t = new Date().getTime();

  // console.log(query, coll);
  collection = db.get().collection(coll);
  // collection.find(query, fields).limit(limit).sort(sort).skip(skip).toArray(cb);
  cur = collection.find(query, fields);

  cur.count(function (err, count) {
    if (err) {
      return cb(err);
    }
    cur.limit(limit).sort(sort).skip(skip).toArray(function (err, results) {
      return cb(err, results, count, new Date().getTime() - t);
    });
  });
};

exports.findAndCountOld = function(criteria, cb) {
  var t = new Date().getTime();

  exports.get(criteria, function(err, points) {
    if (err) {
      return cb(err);
    } else {
      exports.count(criteria, function(err, count) {
        cb(err, points, count, new Date().getTime() - t);
      });
    }
  });
};

exports.insert = function(criteria, cb) {
  var insertObj = criteria.insertObj;
  var coll = criteria.collection;
  var options = criteria.options;

  var collection = db.get().collection(coll);

  collection.insert(insertObj, options, cb);
};

exports.remove = function(criteria, cb) {
  var query = criteria.query;
  var coll = criteria.collection;
  var options = criteria.options;

  var collection = db.get().collection(coll);

  collection.remove(query, options, cb);
};

exports.distinct = function(criteria, cb) {
  var query = criteria.query;
  var coll = criteria.collection;
  var field = criteria.field;
  var options = criteria.options;

  var collection = db.get().collection(coll);

  collection.distinct(field, query, options, cb);
};

exports.dropCollection = function(criteria, cb) {
  var coll = criteria.collection;

  db.get().dropCollection(coll, cb);
};

exports.ensureIndex = function(criteria, cb) {
  var coll = criteria.collection;
  var index = criteria.index;
  var options = criteria.options || {};

  var collection = db.get().collection(coll);
  collection.ensureIndex(index, options, cb);
};

exports.getCursor = function(criteria, cb) {
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

  var cursor = collection.find(query, fields).limit(limit).sort(sort).skip(skip);
  cb(cursor);
};

/*Utility.iterateCursor(criteria, function(err, doc, cb){
  // do something with doc
  cb(null);
}, function(err){
  console.log('done', err);
});*/
exports.iterateCursor = function(criteria, fx, done) {
  var count = 0;
  exports.getCursor(criteria, function(cursor) {

    function processDoc(err, doc) {
      if (!!err || doc === null) {
        done(err, count);
      } else {
        ++count;
        fx(err, doc, function(err) {
          cursor.nextObject(processDoc);
        });
      }
    }

    cursor.nextObject(processDoc);

  });
};