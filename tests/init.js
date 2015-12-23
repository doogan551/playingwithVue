/* global global, process, chai */
// process.env.NODE_ENV = 'tester';
console.log(process.env.NODE_ENV);
var db = require('../helpers/db');
var config = require('config');
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port,
  '/tester'
];

before(function(done) {

global.chai = require('chai');
global.expect = chai.expect;

global.adminUser = {
  "System Admin": {
    "Value": true
  },
  groups: []
};
  console.log('running before mocha init', connectionString.join(''));
  db.connect(connectionString.join(''), done);
});