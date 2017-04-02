let ArchiveUtility = require('../models/archiveutility');
let archiveUtility = new ArchiveUtility('');
const db = require('../helpers/db');
var config = require('config');
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

db.connect(connectionString.join(''), function (err) {
    let logger = require('../helpers/logger')(module);

    let HistoryRecord = archiveUtility.define('History', {
        upi: {
            type: ArchiveUtility.INTEGER,
            primaryKey: true
        },
        timestamp: {
            type: ArchiveUtility.INTEGER,
            primaryKey: true
        },
        value: {
            type: ArchiveUtility.REAL
        },
        valueType: {
            type: ArchiveUtility.INTEGER,
            defaultValue: 1
        },
        statusFlags: {
            type: ArchiveUtility.INTEGER,
            defaultValue: 1
        },
        userEdited: {
            type: ArchiveUtility.INTEGER,
            defaultValue: 0
        }
    });

    let count = 1000;
    let b = 0;
    let bulk = [];

    for (b; b < count; ++b) {
        bulk.push({
            upi: 1,
            timestamp: b,
            value: b * count
        });
    }
    logger.info('test');
    // archiveUtility.sync().then(() => {
    //     console.log(bulk.length);
    //     return HistoryRecord.bulkCreate(bulk);
    // }).then((results) => {
    //     console.log(JSON.stringify(results));
    //     console.timeEnd('start');
    // }).catch((err) => {
    //     console.log(err);
    // });
});
