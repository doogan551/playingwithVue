var fs = require('fs');
var async = require('async');
var moment = require('moment');
var db = require('../helpers/db');
var Utility = require('../models/utility');
var config = require('config');
var logger = require('../helpers/logger')(module);

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

var upis = {
  'demand': [918918, 918919, 918920, 918921, 918922, 918923, 918924, 918925, 918926, 918927, 918928, 918929, 918930, 918931, 918932, 918933, 918934, 918935, 918936, 918937, 918938, 918939, 918940, 918941, 918942, 918943, 918944, 918945, 918947, 918949, 918950, 918951, 918952, 918953],
  'consumption': [918990, 918991, 918992, 918993, 918994, 918995, 918996, 918997, 918998, 918999, 919000, 919001, 919002, 919003, 919004, 919005, 919006, 919007, 919008, 919009, 919010, 919011, 919012, 919013, 919014, 919015, 919016, 919017, 919018, 919019, 919020, 919021, 919022, 919023],
  'reactive': [918956, 918957, 918958, 918959, 918960, 918961, 918962, 918963, 918964, 918965, 918966, 918967, 918968, 918969, 918970, 918971, 918972, 918973, 918974, 918975, 918976, 918977, 918978, 918979, 918980, 918981, 918982, 918983, 918984, 918985, 918986, 918987, 918988, 918989]
};


function newHistory() {
  var history = require('./models/history.js');
  var start = moment('10/01/15', 'MM/DD/YY').unix();
  var end = moment.unix(start).add(1, 'month').unix();

  var options = [{
    "touid": "tou_14",
    "utilityName": "Electricity",
    "range": {
      "start": start,
      "end": end
    },
    "fiscalYear": 2015,
    "type": "demand",
    "scale": "month",
    "fx": "max",
    "upis": upis.demand
  }];

  // options  = [{"range":{"start":1417410000,"end":1420088400},"scale":"half-hour","fx":"missingData","upis":[919009,918929,918978]}];
  // console.log('before range', options.length);
  var newOptions = history.buildOps(options);
  // console.log('after range', newOptions.length);
  var startTime = new Date();
  logger.debug(connectionString.join(''));
  db.connect(connectionString.join(''), function(err) {
    history.getUsageCall(newOptions, function(err, result) {
      console.log('finished', new Date() - startTime, err);
      /*history.addToCsv(result, newOptions[0], function(err){
        console.log('doXne with csv', err);
      });*/
      result = history.unbuildOps(result);
      console.log(result);
      /*var peakSum = 0;
      var totalSum = 0;
      for (var r = 0; r < result.length; r++) {
        for (var s = 0; s < result[r].results.sums.length; s++) {
          if (['on', 'off'].indexOf(result[r].peak) >= 0) {
            peakSum += result[r].results.sums[s].sum;
          } else {
            totalSum += result[r].results.sums[s].sum;
          }
        }
      }
      console.log(peakSum);
      console.log(totalSum);*/
      /*fs.appendFile('./logs.js', JSON.stringify(result), function(err) {
        newOptions = [];
        result = [];
        console.log(err);
      });*/
    });
  });
}
// newHistory();

function fixDbDoubles() {
  db.connect(connectionString.join(''), function(err) {
    var criteria = {
      collection: 'points',
      query: {
        'Point Type.Value': 'MultiState Value'
      }
    };
    console.log(criteria);
    Utility.get(criteria, function(err, points) {
      console.log(err, points.length);
      async.eachSeries(points, function(point, cb) {
        for (var prop in point) {
          if (point[prop].hasOwnProperty('ValueType')) {
            point[prop].ValueType = parseInt(point[prop].ValueType, 10);
            if (point[prop].hasOwnProperty('eValue')) {
              point[prop].eValue = parseInt(point[prop].eValue, 10);
              for (var option in point[prop].ValueOptions) {
                point[prop].ValueOptions[option] = parseInt(point[prop].ValueOptions[option], 10);
              }
            }
            if (!isNaN(parseInt(point[prop].Value, 10))) {
              if (point[prop].ValueType !== 1) {
                point[prop].Value = parseInt(point[prop].Value, 10);
              } else {
                point[prop].Value = parseFloat(point[prop].Value);
              }
            }
          } else {
            // point[prop] = parseInt(point[prop], 10);
          }
        }
        criteria.query = {
          _id: point._id
        };
        criteria.updateObj = point;
        Utility.update(criteria, function(err, result) {
          cb(err);
        });
      }, function(err) {
        console.log('done', err);
      });
    });
  });
}
fixDbDoubles();

function testDBCursor() {
  db.connect(connectionString.join(''), function(err) {
    Utility.iterateCursor({
      collection: 'points',
      query: {},
      limit: 10
    }, function(err, doc, cb) {
      console.log(err, doc._id);
      cb(null);
    }, function(err) {
      console.log('done', err);
    });
  });
}
// testDBCursor();