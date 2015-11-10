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
  db.connect(connectionString.join(''), done);
});