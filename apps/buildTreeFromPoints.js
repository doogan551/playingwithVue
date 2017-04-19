var async = require('async');
var db = require('../helpers/db');
var config = require('config');
var ObjectId = require('mongodb').ObjectId;

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

let buildTree = () => {
    let utilityModel = new Utility('points');
    utilityModel.distinct({
        field: 'name1'
    }, (err, name1s) => {
        console.log(name1s);
    });
};

db.connect(connectionString.join(''), function (err) {
    buildTree();
});
var Utility = require('../models/utility');
let utility = new Utility();
