/* global global, process, chai */

process.env.NODE_ENV = 'tester';

global.chai = require('chai');
global.expect = chai.expect;

var db = require('../helpers/db');
var config = require('config');
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port,
  '/', dbConfig.dbName
];

global.adminUser = {
  "System Admin": {
    "Value": true
  },
  groups: []
};



before(function(done) {
  console.log('running before mocha init', connectionString.join(''));
  db.connect(connectionString.join(''), done);
});