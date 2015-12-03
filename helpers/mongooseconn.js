var mongoose = require('mongoose');
var _ = require('lodash');
var config = require('config');
var dbConfig = config.get('Infoscan.dbConfig');

var mongoUrl = [dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName].join('');

module.exports = function(cb) {
  
  mongoose.connect(mongoUrl, function(err, mongooseConn) {
    GLOBAL.mongooseConn = mongooseConn;
    cb();
  });
};