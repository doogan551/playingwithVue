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
const order = ['Class', 'System', 'Component', 'Equipment', 'Instrumentation'];
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
    let addChildren = function (_callback) {
        Utility.get({
            collection: collection,
            query: {
                mech: {
                    $exists: 1
                }
            }
        }, function (err, parents) {
            async.eachSeries(parents, function (parent, callback) {
                var criteria = {
                    statement: 'Select * from Mechanical_Library where ' + parent.mech + ' == "' + parent.type + '"'
                };
                all(criteria, function (err, rows) {
                    async.eachSeries(rows, function (row, callback2) {

                        var firstChild = findFirstChild(parent.mech, row);
                        if (!!firstChild) {
                            // if (firstChild === 'Instrumentation') {
                            //     return callback2();
                            // }
                            // console.log('Select * from Mechanical_Library where ' + parent.mech + ' == "' + parent.type + '"');
                            // console.log(parent);
                            // console.log(row);
                            // console.log(firstChild);
                            Utility.getOne({
                                collection: collection,
                                query: {
                                    type: row[firstChild],
                                    mech: firstChild
                                }
                            }, function (err, item) {
                                var updateObj = {
                                    $addToSet: {}
                                };
                                updateObj.$addToSet[firstChild] = item.type;
                                Utility.update({
                                    collection: collection,
                                    query: {
                                        _id: parent._id
                                    },
                                    updateObj: updateObj
                                }, callback2);
                            });
                        } else {
                            Utility.update({
                                collection: collection,
                                query: {
                                    type: 'Bad'
                                },
                                updateObj: {
                                    $addToSet: {
                                        objects: row
                                    }
                                }
                            }, callback2);
                        }
                        // callback2();
                    }, callback);
                });
            }, _callback);
        });
    };


    let buildChildren = function (start, startIndex, cb) {
        // go through each class and get all unique systems then get all unique Components withouth a system and so forth
        // find a way to know which mech categories to skip - build the string after a search of mechs to ignore (where System = '' AND Component = '') - if Instrumentation is '', it's Bad
        // Select * from Mechanical_Library where Instrumentation == "" AND Equipment == "" AND Component == "" AND System == "" AND Class == ""
        async.eachOfSeries(order, function (mech, index, callback) {
            if (startIndex > index) {
                return callback();
            }
            var statement = 'Select * from Mechanical_Library where ' + start + ' != ""';
            var i = index;
            while (i > startIndex) {
                statement += ' AND ' + order[i] + ' == ""';
                i--;
            }
            var criteria = {
                statement: statement
            };
            console.log(statement);
            all(criteria, function (err, rows) {
                // console.log(rows);
                async.eachSeries(rows, function (row, callback2) {
                    if (order[index + 1] === undefined) {
                        // valid Instrumentations are being added to Bad array (last run)
                        Utility.update({
                            collection: collection,
                            query: {
                                type: 'Bad'
                            },
                            updateObj: {
                                $addToSet: {
                                    objects: row
                                }
                            }
                        }, callback2);
                    } else {
                        var updateObj = {
                            $addToSet: {}
                        };
                        // GET mech's id
                        updateObj.$addToSet[order[index + 1]] = row[order[index + 1]];
                        Utility.update({
                            collection: collection,
                            query: {
                                mech: start,
                                type: row[start]
                            },
                            updateObj: updateObj
                        }, callback2);
                    }
                }, callback);
            });
        }, cb);
    };

    Utility.remove({
        collection: collection
    }, function () {
        async.eachSeries(hierarchy, function (mech, callback) {
            var criteria = {
                statement: 'Select distinct ' + mech.mech + ' from Mechanical_Library'
            };
            all(criteria, function (err, rows) {
                async.eachSeries(rows, function (row, callback2) {
                    let newMech = _.cloneDeep(mech);
                    newMech.type = row[mech.mech] || "";
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
                async.eachOfSeries(order, buildChildren, cb);
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