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
const order = ['Class', 'Class_Type', 'System', 'System_Type', 'Component', 'Component_Type', 'Equipment', 'Component_Type', 'Instrumentation', 'Instrumentation_Type'];
let mechStructure = {
    name: '',
    category: 'Class',
    pathRefs: []
};
let hierarchy = [{
        category: 'Class'
    },
    {
        category: 'Class_Type',
        Class: []
    },
    {
        category: 'System',
        Class: [],
        Class_Type: []
    },
    {
        category: 'System_Type',
        Class: [],
        Class_Type: [],
        System: []
    },
    {
        category: 'Component',
        Class: [],
        Class_Type: [],
        System: [],
        System_Type: []
    },
    {
        category: 'Component_Type',
        Class: [],
        Class_Type: [],
        System: [],
        System_Type: [],
        Component: []
    },
    {
        category: 'Equipment',
        Class: [],
        Class_Type: [],
        System: [],
        System_Type: [],
        Component: [],
        Component_Type: []
    },
    {
        category: 'Equipment_Type',
        Class: [],
        Class_Type: [],
        System: [],
        System_Type: [],
        Component: [],
        Component_Type: [],
        Equipment: []
    },
    {
        category: 'Instrumentation',
        Class: [],
        Class_Type: [],
        System: [],
        System_Type: [],
        Component: [],
        Component_Type: [],
        Equipment: [],
        Equipment_Type: []
    },
    {
        category: 'Instrumentation_Type',
        Class: [],
        Class_Type: [],
        System: [],
        System_Type: [],
        Component: [],
        Component_Type: [],
        Equipment: [],
        Equipment_Type: [],
        Instrumentation: []
    }
];

let start = function (cb) {

    let buildParents = function (cat, callback) {
        async.forEach(hierarchy, function (item, callback2) {
            if (!cat.hasOwnProperty(item.category)) {
                return callback2();
            } else {
                var statement = ['SELECT DISTINCT ', cat.category, ', ', item.category, ' FROM Mechanical_Library'].join('');
                console.log(statement);
                var criteria = {
                    statement: statement
                };
                all(criteria, function (err, rows) {
                    async.eachSeries(rows, function (row, callback3) {
                        var query = {
                            category: cat.category,
                            name: row[cat.category]
                        };
                        var updateObj = {
                            $addToSet: {}
                        };

                        Utility.getOne({
                            collection: collection,
                            query: {
                                category: item.category,
                                name: row[item.category],
                            }
                        }, function (err, parent) {
                            updateObj.$addToSet[item.category] = parent.name;
                            Utility.update({
                                collection: collection,
                                query: query,
                                updateObj: updateObj
                            }, callback3);
                        });
                    }, function (err) {
                        callback2();
                    });
                });
            }
        }, callback);
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
                            statement: 'Select distinct ' + mech.category + ' from Mechanical_Library'
                        };
                        all(criteria, function (err, rows) {
                            async.eachSeries(rows, function (row, callback2) {
                                let newMech = _.cloneDeep(mech);
                                newMech.name = row[mech.category] || "";
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
                            async.eachSeries(hierarchy, buildParents, cb);
                        });
                    });

                });
            });
        });
    });
};

let transformSQLite = function (cb) {
    let types = [{
        old: 'Class',
        new: 'Class'
    }, {
        old: 'Class_Type',
        new: 'ClassType'
    }, {
        old: 'System',
        new: 'System'
    }, {
        old: 'System_Type',
        new: 'SystemType'
    }, {
        old: 'Component',
        new: 'Component'
    }, {
        old: 'Component_Type',
        new: 'ComponentType'
    }, {
        old: 'Equipment',
        new: 'Equipment'
    }, {
        old: 'Equipment_Type',
        new: 'EquipmentType'
    }, {
        old: 'Instrumentation',
        new: 'Instrumentation'
    }, {
        old: 'Instrumentation_Type',
        new: 'InstrumentationType'
    }];

    let createPaths = function (callback) {
        var criteria = {
            statement: "Select * from Mechanical_Library"
        };
        callback();
    };
    async.eachSeries(types, function (type, callback) {
        var criteria = {
            statement: ""
        };
        criteria.statement = "DROP TABLE " + type.new;
        runDB(criteria, function (err, results) {
            criteria.statement = "CREATE TABLE " + type.new + " (id INTEGER PRIMARY KEY AUTOINCREMENT, name STRING UNIQUE)";
            runDB(criteria, function (err, results) {
                criteria.statement = "INSERT INTO " + type.new + " (name) SELECT DISTINCT " + type.old + " FROM Mechanical_Library";
                runDB(criteria, callback);
            });
        });
    }, function (err) {
        console.log('err', err);
        createPaths(cb);
    });
};

let createPaths = function (cb) {
    // let buildRefPath = function (parents) {
    //     if (!parents.length) {
    //         return [];
    //     }
    //     var path = {
    //         $and: []
    //     };
    //     for (var p = 0; p < parents.length; p++) {
    //         let parent = parents[p];
    //         path.$and.push({pathRefs:{$elemMatch:{PropertyName: parent.PropertyName, }}});
    //     }
    // };
    let buildPaths = function (orderIndex, callback) {
        if (orderIndex >= order.length) {
            return callback();
        }
        var statement = ['SELECT DISTINCT '];
        for (var i = 0; i <= orderIndex; i++) {
            statement.push(order[i]);
            statement.push(', ');
        }
        statement.pop();
        statement.push(' from Mechanical_Library');
        var criteria = {
            statement: statement.join('')
        };
        all(criteria, function (err, rows) {
            async.eachSeries(rows, function (row, callback2) {
                let newMech = _.cloneDeep(mechStructure);
                var query = {
                    pathRefs: []
                };

                newMech.name = row[order[orderIndex]];
                newMech.category = order[orderIndex];

                var o = 0;
                async.whilst(function () {
                    return o < orderIndex
                }, function (callback3) {
                    var currentPath = {};
                    // var refPath = buildRefPath(currentPath);

                    query.name = row[order[o]];
                    query.category = order[o];
                    Utility.getOne({
                        collection: collection,
                        query: query
                    }, function (err, parent) {
                        var mechRef = {
                            AppIndex: 0,
                            name: parent.name,
                            Value: parent._id.toString(),
                            PropertyName: parent.category,
                            isDisplayable: true,
                            isReadOnly: false
                        };
                        newMech.pathRefs.push(mechRef);
                        delete query.pathRefs;
                        query['pathRefs.Value'] = parent._id.toString();
                        o++;
                        callback3();
                    });
                }, function (err) {
                    Utility.insert({
                        collection: collection,
                        insertObj: newMech
                    }, callback2);
                });
                // for (var o = 0; o < orderIndex; o++) {
                //     newMech.structure.push(row[order[o]]);
                // }
            }, function (err) {
                buildPaths(++orderIndex, callback)
            });
        });
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

                    var criteria = {
                        statement: 'Select distinct Class from Mechanical_Library'
                    };
                    all(criteria, function (err, rows) {
                        async.eachSeries(rows, function (row, callback2) {
                            let newMech = _.cloneDeep(mechStructure);
                            newMech.name = row.Class || "";
                            newMech.category = 'Class';
                            var obj = {
                                collection: collection,
                                insertObj: newMech
                            };
                            Utility.insert(obj, callback2);
                        }, function (err) {
                            buildPaths(1, cb);
                        });
                    });

                });
            });
        });
    });
};

db.connect(connectionString.join(''), function (err) {
    // start(function (err) {
    //     console.log(err, 'done');
    // });
    createPaths(function (err) {
        console.log(err, 'done');
    });
    // transformSQLite(function (err) {
    //     console.log(err, 'done');
    // });
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