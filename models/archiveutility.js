/**
 * Utility object to load, read, and update the archiving database
 * Currently, the database is sqlite3
 * This file is just a wrapper for the db lit=> y
 * documentation for this module can be found @
 * https://github.com/mapbox/node-sqlite3
 */

let sqlite3 = require('sqlite3').verbose();
let config = require('config');
let fs = require('fs');
let async = require('async');
let moment = require('moment');
let logger = require('../helpers/logger')(module);

let sqliteDB = {};

let archiveLocation = config.get('Infoscan.files').archiveLocation + config.get('Infoscan.dbConfig').dbName + '/';


let ArchiveUtility = class ArchiveUtility {

    constructor() {
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        // On startup, loads all databases into memory by year                                              //
        // Creates databases if necessary                                                                   //
        // Builds next year's database if it doesn't exist (in case year rolls over without server restart) //
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        fs.readdir(archiveLocation, (err, files) => {
            if (err) {
                logger.error(err);
            }
            let databases = [];
            for (let f = 0; f < files.length; f++) {
                let file = files[f];
                if (file.slice(-3) === '.db') {
                    databases.push(file);
                }
            }
            async.eachSeries(databases, (db, cb) => {
                let year = '';
                let chars = db.split('');
                for (let c = 0; c < chars.length; c++) {
                    if (!isNaN(chars[c])) {
                        year += chars[c];
                    }
                }
                this.buildSqliteDB(parseInt(year, 10), cb);
            }, (err) => {
                let nextYear = moment().add(1, 'year').year();
                this.buildSqliteDB(nextYear, () => {
                    this.buildSqliteDB(moment().year(), () => {});
                });
            });
        });
    }

    /////////////////////////////////////////////////////
    // Populating any necessary databases if necessary //
    /////////////////////////////////////////////////////
    buildSqliteDB(year, callback) {
        let buildTables = (_year, tableCB) => {
            let months = [];
            for (let i = 1; i <= 12; i++) {
                months.push(i);
            }
            async.eachSeries(months, (month, cb) => {
                let tableName = 'History_' + _year.toString() + ((month < 10) ? '0' + month.toString() : month.toString());
                sqliteDB[_year].run('CREATE TABLE IF NOT EXISTS ' + tableName + ' (UPI INTEGER NOT NULL, TIMESTAMP INTEGER NOT NULL, VALUE REAL NOT NULL, VALUETYPE INTEGER NOT NULL, STATUSFLAGS INTEGER DEFAULT 0, USEREDITED INTEGER DEFAULT 0, PRIMARY KEY(UPI, TIMESTAMP) ON CONFLICT IGNORE)', cb);
            }, tableCB);
        };

        if (!!sqliteDB) {
            // sqliteDB.close();
        }
        if (!!sqliteDB[year]) {
            return callback();
        }
        let file = 'History_' + year + '.db';
        let hsd = archiveLocation + file;

        fs.stat(archiveLocation, (err) => {
            if (err) {
                let mkdirp = require('mkdirp');
                mkdirp(archiveLocation, (err) => {
                    fs.openSync(hsd, 'w');
                    sqliteDB[year] = new sqlite3.Database(hsd);
                    buildTables(year, callback);
                    // callback();
                });
            } else {
                sqliteDB[year] = new sqlite3.Database(hsd);
                buildTables(year, callback);
                // callback();
            }
        });
    }

    //////////////////////////////
    // returns database by year //
    //////////////////////////////
    getSqliteDB(year, callback) {
        if (!!sqliteDB[year]) {
            return callback(sqliteDB[year]);
        }
        this.buildSqliteDB(year, () => {
            return callback(sqliteDB[year]);
        });
    }

    get(criteria, cb) {
        let statement = criteria.statement;
        let year = criteria.year || moment().year();
        let parameters = criteria.parameters || [];

        if (!statement) {
            cb('No statement supplied.', {});
        } else {
            this.getSqliteDB(year, (_sqliteDB) => {
                _sqliteDB.get(statement, parameters, cb);
            });
        }
    }

    all(criteria, cb) {
        let statement = criteria.statement;
        let year = criteria.year || moment().year();
        let parameters = criteria.parameters || [];

        if (!statement) {
            cb('No statement supplied.', []);
        } else {
            this.getSqliteDB(year, (_sqliteDB) => {
                _sqliteDB.all(statement, parameters, cb);
            });
        }
    }

    prepare(criteria, cb) {
        let statement = criteria.statement;
        let year = criteria.year || moment().year();

        if (!statement) {
            cb('No statement supplied.', []);
        } else {
            this.getSqliteDB(year, (_sqliteDB) => {
                return cb(_sqliteDB.prepare(statement));
            });
        }
    }

    exec(criteria, cb) {
        let statement = criteria.statement;
        let year = criteria.year || moment().year();

        if (!statement) {
            cb('No statement supplied.', []);
        } else {
            this.getSqliteDB(year, (_sqliteDB) => {
                _sqliteDB.exec(statement, cb);
            });
        }
    }

    runDB(criteria, cb) {
        let statement = criteria.statement;
        let year = criteria.year || moment().year();
        let parameters = criteria.parameters || [];

        if (!statement) {
            cb('No statement supplied.', []);
        } else {
            this.getSqliteDB(year, (_sqliteDB) => {
                _sqliteDB.run(statement, parameters, cb);
            });
        }
    }

    runStatement(criteria, cb) {
        let statement = criteria.statement;
        let parameters = criteria.parameters || [];

        if (!statement) {
            cb('No statement supplied.', []);
        } else {
            statement.run(parameters, cb);
        }
    }

    finalizeStatement(criteria, cb) {
        let statement = criteria.statement;

        if (!statement) {
            cb('No statement supplied.', []);
        } else {
            statement.finalize(cb);
        }
    }

    serialize(criteria, cb) {
        let year = criteria.year || moment().year();
        this.getSqliteDB(year, (_sqliteDB) => {
            _sqliteDB.serialize((err) => {
                return cb();
            });
        });
    }
};
module.exports = ArchiveUtility;
