var fs = require('fs');
var async = require('async');
var moment = require('moment');
var db = require('../helpers/db');
var Utility = require('../models/utility');
var Config = require('../public/js/lib/config.js');
var config = require('config');
var logger = require('../helpers/logger')(module);
var ObjectID = require('mongodb').ObjectID;

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

const collection = 'mechTemplate';

let hierarchy = [{
        mech: 'Class',
        optional: 'Class_Type',
        id: 1,
        parent: null
    },
    {
        mech: 'System',
        optional: 'System_Type',
        id: 2,
        parent: 1
    },
    {
        mech: 'Component',
        optional: 'Component_Type',
        id: 3,
        parent: 2
    },
    {
        mech: 'Equipment',
        optional: 'Equipment_Type',
        id: 4,
        parent: 3
    },
    {
        mech: 'Instrumentation',
        optional: 'Instrumentation_Type',
        id: 5,
        parent: 4
    }
];

let start = function (cb) {
    async.eachSeries(hierarchy, function (mech, callback) {
        var criteria = {
            statement: 'Select distinct ' + mech.mech + ' from Mechanical_Library'
        };
        all(criteria, function (err, rows) {
            async.eachSeries(rows, function (row, callback2) {
                var obj = {
                    collection: collection,
                    insertObj: {
                        mech: mech.mech,
                        type: row[mech.mech]
                    }
                };
                Utility.insert(obj, callback2);
            }, callback);
        });
    }, cb);
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