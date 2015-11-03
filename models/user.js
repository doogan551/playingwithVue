var db = require('../helpers/db');
var ObjectID = require('mongodb').ObjectID;
var Utility = require('./utility');
var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;
var usersCollection = 'Users';
var logger = require('../helpers/logger')(module);

exports.get = function(criteria, cb) {
  Utility.get(criteria, cb);
};

exports.findByUsername = function(username, cb) {
  var criteria = {
    collection: usersCollection,
    query: {
      username: username
    }
  };
  Utility.get(criteria, cb);
};

exports.findById = function(id, cb) {
  var criteria = {
    collection: usersCollection,
    query: {
      _id: new ObjectID(id)
    }
  };
  Utility.get(criteria, cb);
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