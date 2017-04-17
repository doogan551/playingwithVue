/**
 * Utility object to load, read, and update the archiving database
 * Currently, the database is sqlite3
 * This file is just a wrapper for the db lit=> y
 * documentation for this module can be found @
 * https://github.com/mapbox/node-sqlite3
 */

const Sequelize = require('sequelize');

const ArchiveUtility = class ArchiveUtility extends Sequelize {

    constructor(archiveLocation, db) {
        console.log(archiveLocation + db + '.db');
        super(db, '', '', {
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
            storage: archiveLocation + db + '.db'
        });
    }

};
module.exports = ArchiveUtility;
