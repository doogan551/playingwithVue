var async = require('async');
var modelUtil = require('../public/js/modelUtil.js');
var util = require('util');
var lodash = require('lodash');
var moment = require('moment');
var config = require('config');
var logger = require('../helpers/logger')(module);
var dbModel = require('../helpers/db');
var Utility = require('../models/utility');
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

var conn = connectionString.join('');

function changeUpis(oldId, newUpi, callback) {
  // rename schedule entries
  // drop pointinst and devinst indexes
  var newPoints = 'new_points';
  var points = 'points';

  var updateDependencies = function(oldId, newId, collection, cb) {
    Utility.iterateCursor({
        collection: collection,
        query: {
          $or: [{
            'Point Refs.Value': oldId
          }, {
            'Point Refs.PointInst': oldId
          }, {
            'Point Refs.DevInst': oldId
          }]
        }
      },
      function(err, dep, cb2) {
        var refs = dep['Point Refs'];
        for (var i = 0; i < refs.length; i++) {
          if (refs[i].Value === oldId) {
            // console.log('changing Value', oldId, collection);
            refs[i].Value = newId;
          }
          if (refs[i].PointInst === oldId) {
            // console.log('changing PointInst', oldId, collection);
            refs[i].PointInst = newId;
          }
          if (refs[i].DevInst === oldId) {
            // console.log('changing DevInst', oldId, collection);
            refs[i].DevInst = newId;
          }
        }
        // console.log(dep['Point Refs']);
        Utility.update({
          collection: collection,
          updateObj: dep,
          query: {
            _id: dep._id
          }
        }, cb2);
      }, cb);
  };

  Utility.iterateCursor({
      collection: points,
      query: {
        _id: oldId
      },
      sort: {
        _id: 1
      }
    }, function(err, doc, cb) {
      doc._newUpi = newUpi;
      doc['Point Instance'].Value = newUpi;
      doc._oldUpi = oldId;

      Utility.update({
        query: {
          _id: oldId
        },
        updateObj: doc,
        collection: points
      }, function(err, result) {
        cb();
      });
    },
    function(err, count) {
      Utility.iterateCursor({
        collection: points,
        query: {
          _id: oldId
        }
      }, function(err, doc, cb) {
        doc._id = doc._newUpi;
        console.log('inserting', JSON.stringify(doc));

        console.log('deleting', oldId)
        Utility.remove({
          collection: points,
          query: {
            _id: oldId
          }
        }, function(err) {
          Utility.insert({
            collection: points,
            insertObj: doc
          }, function(err) {
            cb(err);
          });
        });
      }, function(err, count) {

        console.log('count', count);
        Utility.iterateCursor({
          collection: points,
          query: {}
        }, function(err, doc, cb) {

          updateDependencies(doc._oldUpi, doc._newUpi, newPoints, function(err, count) {
            cb(err);
          });
        }, function(err, count) {
          callback(err);
        });
      });
    });
}

function updateHistory(oldId, newUpi, cb) {
  var Archive = require('../models/archiveutility');
  var now = moment().endOf('month');
  var start = moment('2000/01', 'YYYY/MM');
  var count = 0;

  async.whilst(function() {
    return now.isAfter(start);
  }, function(callback) {
    var criteria = {
      year: now.year(),
      statement: ['UPDATE History_', now.year(), now.format('MM'), ' SET UPI=? WHERE UPI=?'].join('')
    };
    Archive.prepare(criteria, function(stmt) {
      criteria = {
        year: now.year(),
        statement: stmt,
        parameters: [newUpi, oldId]
      };
      Archive.runStatement(criteria, function() {
        count += this.changes;
        Archive.finalizeStatement(criteria, function() {
          now = now.subtract(1, 'month');
          // console.log(count, 'history changed', now.format());
          callback();
        });
      });
    });
  }, cb);
}


dbModel.connect(connectionString.join(''), function(err) {
  var oldId = 5;
  var newUpi = 100000
  changeUpis(oldId, newUpi, function() {
    updateHistory(oldId, newUpi, function() {
      console.log('done');
    });
  });
});