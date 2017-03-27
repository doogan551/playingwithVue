var fs = require('fs');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');
var db = require('../helpers/db');
var Utility = require('../models/utility');
var Config = require('../public/js/lib/config.js');
var config = require('config');
var logger = require('../helpers/logger')(module);
var ObjectID = require('mongodb').ObjectID;

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

const collection = 'mechTemplate';
const order = ['System', 'Component', 'Equipment', 'Instrumentation'];
let hierarchy = [{
        mech: 'Class',
        optional: 'Class_Type',
        System: [],
        Component: [],
        Equipment: [],
        Instrumentation: []
    },
    {
        mech: 'System',
        optional: 'System_Type',
        Component: [],
        Equipment: [],
        Instrumentation: []
    },
    {
        mech: 'Component',
        optional: 'Component_Type',
        Equipment: [],
        Instrumentation: []
    },
    {
        mech: 'Equipment',
        optional: 'Equipment_Type',
        Instrumentation: []
    },
    {
        mech: 'Instrumentation',
        optional: 'Instrumentation_Type',
    }
];

let start = function (cb) {
    let findFirstChild = function (skip, obj) {
        var skipIndex = order.indexOf(skip);
        for (var o = 0; o < order.length; o++) {
            var item = order[o];
            if (o > skipIndex && !!obj[item]) {
                return item;
            }
        }
        return null;
    };

    let buildChildren = function (item, cb) {
        var previousChildren = [];
        async.eachSeries(order, function (mech, callback) {
            if (!item.hasOwnProperty(mech)) {
                if (mech === 'Instrumentation') {
                    Utility.remove({
                        collection: 'mechDB',
                        query: {}
                    })
                }
                return callback();
            } else {
                var statement = 'Select * from Mechanical_Library where ' + item.mech + ' != "" and ' + mech + ' != ""';
                previousChildren.forEach(function (child) {
                    statement += ' AND ' + child + ' == ""';
                });
                console.log(statement);
                var criteria = {
                    statement: statement
                };
                all(criteria, function (err, rows) {
                    // console.log(rows);
                    async.eachSeries(rows, function (row, callback2) {
                        Utility.remove({
                            collection: 'mechDB',
                            query: {
                                UID: row.UID
                            }
                        }, function () {

                            var query = {
                                mech: item.mech,
                                type: row[item.optional] || '',
                                name: row[item.mech]
                            };
                            var updateObj = {
                                $addToSet: {}
                            };
                            updateObj.$addToSet[mech] = row[mech];
                            Utility.update({
                                collection: collection,
                                query: query,
                                updateObj: updateObj
                            }, callback2);

                        });
                    }, function (err) {
                        previousChildren.push(mech);
                        callback();
                    });
                });
            }


        }, cb);
    };

    Utility.remove({
        collection: collection
    }, function () {
        Utility.remove({
            collection: 'mechDB'
        }, function () {
            all({
                statement: 'Select * from Mechanical_Library'
            }, function (err, results) {
                Utility.insert({
                    collection: 'mechDB',
                    insertObj: results
                }, function (err, results) {

                    async.eachSeries(hierarchy, function (mech, callback) {
                        var criteria = {
                            statement: 'Select distinct ' + mech.mech + ', ' + mech.optional + ' from Mechanical_Library'
                        };
                        all(criteria, function (err, rows) {
                            async.eachSeries(rows, function (row, callback2) {
                                let newMech = _.cloneDeep(mech);
                                newMech.type = row[mech.optional] || "";
                                newMech.name = row[mech.mech] || "";
                                delete newMech.optional;
                                var obj = {
                                    collection: collection,
                                    insertObj: newMech
                                };
                                Utility.insert(obj, callback2);
                            }, callback);
                        });
                    }, function (err) {
                        var obj = {
                            collection: collection,
                            insertObj: {
                                type: 'Bad',
                                objects: []
                            }
                        };
                        Utility.insert(obj, function () {
                            // addChildren(cb);
                            async.eachSeries(hierarchy, buildChildren, cb);
                        });
                    });

                });
            });
        });
    });
};

db.connect(connectionString.join(''), function (err) {
    start(function (err) {
        console.log(err, 'done');
    });
});

/**
 * Utility object to load, read, and update the archiving database
 * Currently, the database is sqlite3
 * This file is just a wrapper for the db functionality
 * documentation for this module can be found @ 
 * https://github.com/mapbox/node-sqlite3
 */

var sqlite3 = require('sqlite3').verbose();
var config = require('config');
var fs = require('fs');
var async = require('async');
var moment = require('moment');
var logger = require("../helpers/logger")(module);

var sqliteDB;

var archiveLocation = 'C:\\InfoScan\\Archive\\Mech\\';

var buildSqliteDB = function (callback) {

    if (!!sqliteDB) {
        return callback();
    }
    var file = 'Mechanical Relationships.db';
    var hsd = archiveLocation + file;
    sqliteDB = new sqlite3.Database(hsd);
    callback();
};

var getSqliteDB = function (callback) {
    if (!!sqliteDB) {
        return callback(sqliteDB);
    } else {
        buildSqliteDB(function () {
            return callback(sqliteDB);
        });
    }
};

let get = function (criteria, cb) {
    var statement = criteria.statement;
    var parameters = criteria.parameters || [];

    if (!statement) {
        cb('No statement supplied.', {});
    } else {
        getSqliteDB(function (_sqliteDB) {
            _sqliteDB.get(statement, parameters, cb);
        });
    }
};

let all = function (criteria, cb) {
    var statement = criteria.statement;
    var parameters = criteria.parameters || [];

    if (!statement) {
        cb('No statement supplied.', []);
    } else {
        getSqliteDB(function (_sqliteDB) {
            _sqliteDB.all(statement, parameters, cb);
        });
    }
};

let prepare = function (criteria, cb) {
    var statement = criteria.statement;

    if (!statement) {
        cb('No statement supplied.', []);
    } else {
        getSqliteDB(function (_sqliteDB) {
            return cb(_sqliteDB.prepare(statement));
        });
    }
};

let exec = function (criteria, cb) {
    var statement = criteria.statement;
    var parameters = criteria.parameters || [];

    if (!statement) {
        cb('No statement supplied.', []);
    } else {
        getSqliteDB(function (_sqliteDB) {
            _sqliteDB.exec(statement, cb);
        });
    }
};

let runDB = function (criteria, cb) {
    var statement = criteria.statement;
    var parameters = criteria.parameters || [];

    if (!statement) {
        cb('No statement supplied.', []);
    } else {
        getSqliteDB(function (_sqliteDB) {
            _sqliteDB.run(statement, parameters, cb);
        });
    }
};

let runStatement = function (criteria, cb) {
    var statement = criteria.statement;
    var parameters = criteria.parameters || [];

    if (!statement) {
        cb('No statement supplied.', []);
    } else {
        statement.run(parameters, cb);
    }
};

let finalizeStatement = function (criteria, cb) {
    var statement = criteria.statement;
    var parameters = criteria.parameters || [];

    if (!statement) {
        cb('No statement supplied.', []);
    } else {
        statement.finalize(cb);
    }
};

let serialize = function (criteria, cb) {
    console.log('serializing');
    getSqliteDB(function (_sqliteDB) {
        console.log('gotten db');
        _sqliteDB.serialize(function (err) {
            console.log(err);
            return cb();
        });
    });
};