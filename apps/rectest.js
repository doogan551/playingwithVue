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
  var NotifierUtility = require('../models/notifierutility');
  var notifierUtility = new NotifierUtility();


  notifierUtility.sendText('13364694547', 'An alarm has occured in building 4200. Respond with asdf to acknowledge the alarm', function(err, response) {
    console.log(err, response);
  });

  /*var Twilio = require('../models/twilio');
  Twilio.getCalls();*/
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
// updateGPL();

function testTotalizerModel() {
  var Reports = require('../models/reports');

  var data = {
    upis: [
      /*{
            'upi': 28366,
            'op': 'starts'  // BI, BO, BV
          },*/
      {
        'upi': 2813,
        'op': 'total' // BI, BO, BV
      }
      /*, {
            'upi': 2813,
            'op': 'total' // All other types
          }*/
    ],
    range: {
      'start': 1453352400,
      'end': 1453356000
    },
    "reportConfig": {
      "returnLimit": 200,
      "interval": 60
    }
  };
  db.connect(connectionString.join(''), function(err) {
    Reports.totalizerReport(data, function(err, result) {
      console.log(err, JSON.stringify(result));
    });
  });
}
// testTotalizerModel();

function testMail() {
  var MailListener = require("mail-listener2");

  var mailListener = new MailListener({
    username: "dorsett.alarms@gmail.com",
    password: "dorsettgmailpass",
    host: "imap.gmail.com",
    port: 993, // imap port 
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false
    },
    markSeen: true, // all fetched email willbe marked as seen and not fetched next time 
    fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`, 
    attachments: false // download attachments as they are encountered to the project directory 
  });

  mailListener.start(); // start listening 

  // stop listening 
  //mailListener.stop(); 

  mailListener.on("server:connected", function() {
    console.log("imapConnected");
  });

  mailListener.on("server:disconnected", function() {
    console.log("imapDisconnected");
  });

  mailListener.on("error", function(err) {
    console.log(err);
  });

  mailListener.on("mail", function(mail, seqno, attributes) {
    // do something with mail object including attachments 
    console.log(mail.subject, mail.text);
    // mail processing code goes here 
  });
}
// testMail();

function testCron(fx) {
  var CronJob = require('../models/cronjob');

  var testFx = function() {
    console.log(new Date());
  };
  var cron = new CronJob('00 * * * * *', testFx);

  new CronJob('30 * * * * *', function() {
    console.log('second job');
  });

  var now = Date.now();
  console.log('starting', new Date());
  var interval = setInterval(function() {
    if (Date.now() >= now + (2 * 60 * 1000)) {
      cron.stop();
      clearInterval(interval);
    }
  }, 1000);

}
// testCron();