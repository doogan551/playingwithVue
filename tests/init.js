// var db = require('../helpers/db');
// var config = require('config');
// var dbConfig = config.get('Infoscan.dbConfig');
// var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port,
//     '/infoscan'
// ];

before(function () {
    global.chai = require('chai');
    global.expect = chai.expect;

    global.adminUser = {
        'System Admin': {
            'Value': true
        },
        groups: []
    };
    // console.log('running before mocha init', connectionString.join(''));
    // db.connect(connectionString.join(''), done);
});
