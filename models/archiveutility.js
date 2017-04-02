/**
 * Utility object to load, read, and update the archiving database
 * Currently, the database is sqlite3
 * This file is just a wrapper for the db lit=> y
 * documentation for this module can be found @
 * https://github.com/mapbox/node-sqlite3
 */

const sqlite3 = require('sqlite3').verbose();
const config = require('config');
const fs = require('fs');
const async = require('async');
const moment = require('moment');
const Sequelize = require('sequelize');

const ArchiveUtility = class ArchiveUtility extends Sequelize {

    constructor(archiveLocation) {
        archiveLocation = config.get('Infoscan.files').archiveLocation + config.get('Infoscan.dbConfig').dbName + '/History.db';
        console.log(archiveLocation);
        super('history', '', '', {
            host: 'localhost',
            dialect: 'sqlite',

            pool: {
                max: 5,
                min: 0,
                idle: 10000
            },
            define: {
                timestamps: false,
                freezeTableName: true
            },
            logging: false,
            storage: archiveLocation
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
