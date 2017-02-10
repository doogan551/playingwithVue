let _ = require('lodash');
let db = require('../helpers/db');
let utils = require('../helpers/utils');

let Utility = class Utility {

    get(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let coll = criteria.collection;
        let limit = (!!criteria.limit) ? criteria.limit : 0;
        let fields = (!!criteria.fields) ? criteria.fields : {};
        let sort = (!!criteria.sort) ? criteria.sort : {};
        let skip = (!!criteria.skip) ? criteria.skip : 0;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        // console.log(query, coll);
        collection = db.get().collection(coll);
        collection.find(query, fields).limit(limit).sort(sort).skip(skip).toArray(cb);
    }

    getOne(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let coll = criteria.collection;
        let fields = (!!criteria.fields) ? criteria.fields : {};
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        collection = db.get().collection(coll);

        collection.findOne(query, fields, cb);
    }

    aggregate(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let coll = criteria.collection;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        collection = db.get().collection(coll);

        collection.aggregate(query, cb);
    }

    update(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let updateObj = (!!criteria.updateObj) ? criteria.updateObj : {};
        let options = (!!criteria.options) ? criteria.options : {};
        let coll = criteria.collection;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        collection = db.get().collection(coll);

        collection.update(query, updateObj, options, cb);
    }

    save(criteria, cb) {
        let saveObj = criteria.saveObj;
        let options = (!!criteria.options) ? criteria.options : {};
        let coll = criteria.collection;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        collection = db.get().collection(coll);

        collection.save(saveObj, options, cb);
    }

    findAndModify(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let sort = (!!criteria.sort) ? criteria.sort : [];
        let updateObj = (!!criteria.updateObj) ? criteria.updateObj : {};
        let options = (!!criteria.options) ? criteria.options : {};
        let coll = criteria.collection;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        collection = db.get().collection(coll);

        collection.findAndModify(query, sort, updateObj, options, function (err, result) {
            if (err) {
                return cb(err);
            }
            return cb(null, result.value);
        });
    }

    count(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let coll = criteria.collection;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        // console.log(query, coll);
        collection = db.get().collection(coll);

        collection.count(query, cb);
    }

    findAndCount(criteria, cb) {
        this.get(criteria, function (err, points) {
            if (err) {
                return cb(err);
            }
            this.count(criteria, function (err, count) {
                cb(err, points, count);
            });
        });
    }

    insert(criteria, cb) {
        let insertObj = criteria.insertObj;
        let coll = criteria.collection;
        let options = criteria.options;

        let collection = db.get().collection(coll);

        collection.insert(insertObj, options, cb);
    }

    remove(criteria, cb) {
        let query = criteria.query;
        let coll = criteria.collection;
        let options = criteria.options;

        let collection = db.get().collection(coll);

        collection.remove(query, options, cb);
    }

    distinct(criteria, cb) {
        let query = criteria.query || {};
        let coll = criteria.collection;
        let field = criteria.field;
        let options = criteria.options || {};

        let collection = db.get().collection(coll);

        collection.distinct(field, query, options, cb);
    }

    createCollection(criteria, cb) {
        let coll = criteria.collection;

        db.get().createCollection(coll, cb);
    }

    rename(criteria, cb) {
        let from = criteria.from;
        let to = criteria.to;

        let collection = db.get().collection(from);
        collection.rename(to, cb);
    }

    dropCollection(criteria, cb) {
        let coll = criteria.collection;

        db.get().dropCollection(coll, cb);
    }

    dropDatabase(cb) {
        db.get().dropDatabase({}, cb);
    }

    ensureIndex(criteria, cb) {
        let coll = criteria.collection;
        let index = criteria.index;
        let options = criteria.options || {};

        let collection = db.get().collection(coll);
        collection.ensureIndex(index, options, cb);
    }

    getCursor(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let coll = criteria.collection;
        let limit = (!!criteria.limit) ? criteria.limit : 0;
        let fields = (!!criteria.fields) ? criteria.fields : {};
        let sort = (!!criteria.sort) ? criteria.sort : {};
        let skip = (!!criteria.skip) ? criteria.skip : 0;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        // console.log(query, coll);
        collection = db.get().collection(coll);

        let cursor = collection.find(query, fields).limit(limit).sort(sort).skip(skip);
        cb(cursor);
    }

    /*Utility.iterateCursor(criteria, function(err, doc, cb){
      // do something with doc
      cb(null);
    }, function(err){
      console.log('done', err);
    });*/
    iterateCursor(criteria, fx, done) {
        let count = 0;
        this.getCursor(criteria, function (cursor) {
            function processDoc(err, doc) {
                if (!!err || doc === null) {
                    done(err, count);
                } else {
                    ++count;
                    fx(err, doc, function (err, stop) {
                        if (!!err || !!stop) {
                            done(err, count);
                        } else {
                            cursor.nextObject(processDoc);
                        }
                    });
                }
            }

            cursor.nextObject(processDoc);
        });
    }

    getWithSecurity(criteria, cb) {
        let skip = criteria._skip || 0;
        let limit = criteria._limit || 200;

        let identifier = (!!~utils.CONSTANTS('upiscollections').indexOf(criteria.collection)) ? 'upi' : '_id';
        let Security = require('../models/security');

        Security.Utility.getPermissions(criteria.data.user, function (err, permissions) {
            if (err || permissions === false) {
                cb(err || permissions);
            }

            // searching can take upwards of 10 seconds with permissions and results doesn't hit a limit
            // if permissions couldn't actually exceed the returned limit, search with upis as well
            if (permissions !== true && _.size(permissions) <= limit) {
                let upis = Object.keys(permissions).map(function (upi) {
                    return parseInt(upi, 10);
                });
                if (!criteria.query.hasOwnProperty('_id')) {
                    criteria.query[identifier] = {
                        $in: upis
                    };
                }
            }
            let points = [];

            this.iterateCursor(criteria, function (err, doc, next) {
                if (permissions !== true) {
                    if (permissions.hasOwnProperty(doc[identifier])) {
                        doc._pAccess = permissions[doc[identifier]];
                        if (skip > 0) {
                            skip--;
                        } else {
                            points.push(doc);
                        }
                    }
                } else {
                    doc._pAccess = 15;
                    if (skip > 0) {
                        skip--;
                    } else {
                        points.push(doc);
                    }
                }
                next(err, points.length >= (limit || 50) || false);
            }, function (err) {
                if (permissions !== true && permissions !== false) {
                    let upis = [];
                    for (let key in permissions) {
                        upis.push(parseInt(key, 10));
                    }
                    criteria.query[identifier] = {
                        $in: upis
                    };
                    this.count(criteria, function (err, count) {
                        cb(err, points, count);
                    });
                } else {
                    this.count(criteria, function (err, count) {
                        cb(err, points, count);
                    });
                }
            });
        });
    }

};

module.exports = Utility;
