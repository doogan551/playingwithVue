var db = require('../helpers/db');
var ObjectID = require('mongodb').ObjectID;
var Utility = require('./utility');
var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;
var usersCollection = 'Users';

exports.get = function (criteria, cb) {
  Utility.get(criteria, cb);
};

exports.findByUsername = function (username, cb) {
  var collection = db.get().collection(usersCollection);

  collection.find({
    username: username
  }).toArray(cb);
};

exports.findById = function (id, cb) {
  var collection = db.get().collection(usersCollection);

  collection.find({
    _id: new ObjectID(id)
  }).toArray(cb);
};

exports.addNewAccount = function(newData, callback) {

};

exports.updatePassword = function(email, newPass, callback) {
	
};

exports.deleteAccount = function(id, callback) {
	
};

exports.getAccountByEmail = function(email, callback) {

};

exports.validateResetLink = function(email, passHash, callback) {
	
};

exports.getAllRecords = function(callback) {
	
};