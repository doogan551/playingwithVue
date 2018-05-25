const config = require('config');

let ArchiveUtility = require('../models/archiveutility');
let archiveLocation = config.get('Infoscan.files').archiveLocation + config.get('Infoscan.dbConfig').dbName + '/';
let archiveUtility = new ArchiveUtility(archiveLocation, 'History');

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
        type: ArchiveUtility.INTEGER
    },
    statusFlags: {
        type: ArchiveUtility.INTEGER
    },
    userEdited: {
        type: ArchiveUtility.INTEGER,
        defaultValue: 0
    }
});
let upis = [918993, 918967, 918993, 918966];
let where = {
    timestamp: {
        gt: 0,
        lte: 1491250247000
    },
    upi: {
        $in: upis
    }
};

archiveUtility.sync().then(() => {
    return HistoryRecord.count({
        where: where,
        raw: true
    });
}).then((count) => {
    console.log(count);
    if (count < 4465) {
        return;
    }
    where.userEdited = 1;
    return HistoryRecord.count({
        where: where,
        raw: true
    });
}).then((count2) => {
    console.log(count2 > 0);
}).catch((err) => {
    console.log(err);
});
