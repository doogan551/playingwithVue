// const async = require('async');
const db = require('../helpers/db');
// const Utility = require('../models/utility');
// const Config = require('../public/js/lib/config.js');
const config = require('config');

const dbConfig = config.get('Infoscan.dbConfig');
const connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

let runTest = () => {
    const mechTemplate = require('../models/mechanical/templates');
    let vavModel = new mechTemplate.VAV('Air Handling');
    vavModel.buildOptions();
    db.connect(connectionString.join(''), function (err) {

    });
};
runTest();
