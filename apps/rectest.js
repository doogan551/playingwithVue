var fs = require('fs');
var async = require('async');
var moment = require('moment');
var db = require('../helpers/db');
var Utility = require('../models/utility');
var Config = require('../public/js/lib/config.js');
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
  var history = require('../models/history.js');
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
      console.log(JSON.stringify(result));
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
// fixDbDoubles();

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
/*process.on('uncaughtException', function(err) {
  throw Error(err);
});*/

function addProperties() {
  var criteria = {
    collection: 'points',
    query: {
      'Point Type.Value': 'Optimum Start'
    },
    updateObj: {
      $set: {
        "Trend Enable": {
          "isDisplayable": true,
          "isReadOnly": false,
          "ValueType": 7,
          "Value": false
        },
        "Trend Interval": {
          "isDisplayable": true,
          "isReadOnly": false,
          "ValueType": 13,
          "Value": 60
        },
        "Trend Last Status": {
          "isDisplayable": false,
          "isReadOnly": true,
          "ValueType": 18,
          "Value": 0
        },
        "Trend Last Value": {
          "isDisplayable": false,
          "isReadOnly": true,
          "ValueType": 5,
          "Value": "Off",
          "eValue": 0
        },
        "Trend Samples": {
          "isDisplayable": true,
          "isReadOnly": false,
          "ValueType": 4,
          "Value": 0
        }
      }
    },
    options: {
      multi: true
    }
  };
  db.connect(connectionString.join(''), function(err) {
    Utility.update(criteria, function(err, result) {
      console.log(err, result.result.nModified);
    });
  });
}
// addProperties();

function testTwilio() {
  var client = require('twilio')('AC197afc3a1bff2117f0ce2b26becd96e7', 'e0a0537c16e912d59166f5777c2beef7');

  var sendText = function() {
    client.sendMessage({

      to: '+13364694547', // Any number Twilio can deliver to
      from: '+13367702400', // A number you bought from Twilio and can use for outbound communication
      body: 'Today\'s date is ' + moment().format('MM/DD/YYYY') // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio

      if (!err) { // "err" is an error received during the request, if any
        console.log(responseData.from); // outputs "+14506667788"
        console.log(responseData.body); // outputs "word to your mother."

      } else {
        console.log(err);
      }
    });
  };

  var sendVoice = function() {
    var msg = 'Johnny Roberts is a girl'.split(' ').join('+');
    var url = 'http://twimlets.com/echo?Twiml=%3CResponse%3E%3CSay%3E' + msg + '%3C%2FSay%3E%3C%2FResponse%3E';
    console.log(url);
    client.makeCall({

      to: '+13364694547', // Any number Twilio can call
      from: '+13367702400', // A number you bought from Twilio and can use for outbound communication
      url: url // A URL that produces an XML document (TwiML) which contains instructions for the call

    }, function(err, responseData) {
      console.log(err);
      //executed when the call has been initiated.
      console.log(responseData.from); // outputs "+14506667788"

    });
  };
  sendText();

}
// testTwilio();

function updateGPL() {
  var count = 0;
  var pointTypes = ["Alarm Status", "Analog Selector", "Average", "Binary Selector", "Comparator", "Delay", "Digital Logic", "Economizer", "Enthalpy", "Logic", "Math", "Multiplexer", "Proportional", "Ramp", "Select Value", "Setpoint Adjust", "Totalizer"];
  var criteria = {
    collection: 'points',
    query: {
      'Point Type.Value': {
        $in: pointTypes
      }
    }
  };
  db.connect(connectionString.join(''), function(err) {
    Utility.iterateCursor(criteria, function(err, point, cb) {
      count++;
      if (count % 1000 === 0) {
        console.log(count);
      }
      var parentUpi = point._parentUpi;

      for (var prop in point) {
        if (point[prop].ValueType == 8) {
          if (parentUpi !== 0)
            point[prop].isReadOnly = true;
          else
            point[prop].isReadOnly = false;
        }
      }

      switch (point["Point Type"].Value) {
        case 'Proportional':
        case 'Binary Selector':
        case 'Analog Selector':
          point['Setpoint Value'].isReadOnly = (parentUpi !== 0) ? true : false;
          break;
        case 'Math':
        case 'Multiplexer':
          point['Input 1 Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
          point['Input 2 Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
          break;
        case 'Delay':
          point['Trigger Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
          break;
        case 'Comparator':
          point['Input 2 Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
          break;
      }

      var crit = {
        collection: 'points',
        query: {
          _id: point._id
        },
        updateObj: point
      };
      Utility.update(crit, cb);
    }, function(err) {
      console.log('done', err);
    });
  });

}
updateGPL();