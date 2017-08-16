const _ = require('lodash');

const db = require('../helpers/db');
const utils = require('../helpers/utils');

const Utility = class Utility {
    constructor(collection) {
        this.collection = null;
        if (collection) {
            this.collection = collection;
        }
    }
    get(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let coll = criteria.collection || this.collection;
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

    getAll(criteria, cb) {
        this.get(criteria, cb);
    }

    getOne(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let coll = criteria.collection || this.collection;
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
        let pipeline = (!!criteria.pipeline) ? criteria.pipeline : [];
        let coll = criteria.collection || this.collection;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        collection = db.get().collection(coll);

        collection.aggregate(pipeline, cb);
    }

    update(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let updateObj = (!!criteria.updateObj) ? criteria.updateObj : {};
        let options = (!!criteria.options) ? criteria.options : {};
        let coll = criteria.collection || this.collection;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        collection = db.get().collection(coll);

        collection.update(query, updateObj, options, cb);
    }

    updateOne(criteria, cb) {
        this.update(criteria, cb);
    }

    updateAll(criteria, cb) {
        if (criteria.hasOwnProperty('options')) {
            criteria.options.multi = true;
        } else {
            criteria.options = {
                multi: true
            };
        }
        this.update(criteria, cb);
    }

    save(criteria, cb) {
        let saveObj = criteria.saveObj;
        let options = (!!criteria.options) ? criteria.options : {};
        let coll = criteria.collection || this.collection;
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
        let coll = criteria.collection || this.collection;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        collection = db.get().collection(coll);

        collection.findAndModify(query, sort, updateObj, options, (err, result) => {
            if (err) {
                return cb(err);
            }
            return cb(null, result.value);
        });
    }

    count(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let coll = criteria.collection || this.collection;
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
        this.get(criteria, (err, points) => {
            if (err) {
                return cb(err);
            }
            this.count(criteria, (err, count) => {
                cb(err, points, count);
            });
        });
    }

    insert(criteria, cb) {
        let insertObj = criteria.insertObj;
        let coll = criteria.collection || this.collection;
        let options = criteria.options;

        let collection = db.get().collection(coll);

        collection.insert(insertObj, options, cb);
    }

    remove(criteria, cb) {
        let query = criteria.query;
        let coll = criteria.collection || this.collection;
        let options = criteria.options;

        let collection = db.get().collection(coll);

        collection.remove(query, options, cb);
    }

    distinct(criteria, cb) {
        let query = criteria.query || {};
        let coll = criteria.collection || this.collection;
        let field = criteria.field;
        let options = criteria.options || {};

        let collection = db.get().collection(coll);

        collection.distinct(field, query, options, cb);
    }

    createCollection(criteria, cb) {
        let coll = criteria.collection || this.collection;

        db.get().createCollection(coll, cb);
    }

    rename(criteria, cb) {
        let from = criteria.from;
        let to = criteria.to;

        let collection = db.get().collection(from);
        collection.rename(to, cb);
    }

    dropCollection(criteria, cb) {
        let coll = criteria.collection || this.collection;

        db.get().dropCollection(coll, cb);
    }

    dropDatabase(cb) {
        db.get().dropDatabase({}, cb);
    }

    ensureIndex(criteria, cb) {
        let coll = criteria.collection || this.collection;
        let index = criteria.index;
        let options = criteria.options || {};

        let collection = db.get().collection(coll);
        collection.ensureIndex(index, options, cb);
    }

    getCursor(criteria, cb) {
        let query = (!!criteria.query) ? criteria.query : {};
        let coll = criteria.collection || this.collection;
        let limit = (!!criteria.limit) ? criteria.limit : 0;
        let fields = (!!criteria.fields) ? criteria.fields : {};
        let sort = (!!criteria.sort) ? criteria.sort : {};
        let skip = (!!criteria.skip) ? criteria.skip : 0;
        let timeout = (!!criteria.timeout) ? criteria.timeout : true;
        let collection;

        if (!coll) {
            return cb({
                err: 'Please provide a collection.'
            });
        }

        // console.log(query, coll);
        collection = db.get().collection(coll);

        let cursor = collection.find(query, {
            fields,
            timeout
        }).limit(limit).sort(sort).skip(skip);
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
        this.getCursor(criteria, (cursor) => {
            let processDoc = (err, doc) => {
                if (!!err || doc === null) {
                    done(err, count);
                } else {
                    ++count;
                    fx(err, doc, (err, stop) => {
                        if (!!err || !!stop) {
                            done(err, count);
                        } else {
                            cursor.nextObject(processDoc);
                        }
                    });
                }
            };

            cursor.nextObject(processDoc);
        });
    }

    getWithSecurity(criteria, cb) {
        let skip = criteria._skip || 0;
        let limit = criteria._limit || 200;

        let identifier = (!!~utils.CONSTANTS('upiscollections').indexOf(criteria.collection)) ? 'upi' : '_id';
        let Security = require('./security');
        let security = new Security();

        security.getPermissions(criteria.data.user, (err, permissions) => {
            if (err || permissions === false) {
                cb(err || permissions);
            }

            // searching can take upwards of 10 seconds with permissions and results doesn't hit a limit
            // if permissions couldn't actually exceed the returned limit, search with upis as well
            if (permissions !== true && _.size(permissions) <= limit) {
                let upis = Object.keys(permissions).map((upi) => {
                    return parseInt(upi, 10);
                });
                if (!criteria.query.hasOwnProperty('_id')) {
                    criteria.query[identifier] = {
                        $in: upis
                    };
                }
            }
            let points = [];

            this.iterateCursor(criteria, (err, doc, next) => {
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
            }, (err) => {
                if (permissions !== true && permissions !== false) {
                    let upis = [];
                    for (let key in permissions) {
                        upis.push(parseInt(key, 10));
                    }
                    criteria.query[identifier] = {
                        $in: upis
                    };
                    this.count(criteria, (err, count) => {
                        cb(err, points, count);
                    });
                } else if (criteria.count !== false) {
                    this.count(criteria, (err, count) => {
                        cb(err, points, count);
                    });
                } else {
                    cb(err, points);
                }
            });
        });
    }

};

module.exports = Utility;
