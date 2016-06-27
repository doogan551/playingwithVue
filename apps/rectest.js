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
    "touid": "tou_64",
    "utilityName": "Electricity",
    "range": {
      "start": 1443675600,
      "end": 1446354000
    },
    "scale": "month",
    "fx": "tempRange",
    "upis": [
      65696
    ]
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
      // console.log(JSON.stringify(result));
      console.log(result[0].results.tempRanges);
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

function testInheritance() {
  var createInherit = function(superClass, subClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
  };

  function Table() {
    this.type = 'table';
  }

  Table.prototype.setType = function(type) {
    console.log('before', this.type);
    this.type = type;
    console.log('after', this.type);
  };

  Table.prototype.print = function() {
    console.log(this.type);
  };

  function Devices() {
    console.log('Table.call');
    Table.call(this);
    this.setType('Rectangle');
  }

  createInherit(Table, Devices);

  template = {
    'Point Type': {
      eValue: 1,
      Value: function() {
        console.log('eval', this.eValue);
      }
    }
  };
  template['Point Type'].Value();
}
// testInheritance();

function setUpNotifications() {
  var pointNames = ['Booster_Pump 1_Control', 'Booster_Pump 2_Control', 'Booster_Pump 2_VFD Speed', 'Booster_Pump Station_Pressure', 'Booster_Pumps_Not Running_Alarm', 'Booster Sta_Chem Pump 1_Status', 'Booster Sta_Chem Pump 2_Status', 'Booster Sta_Chem Pump 3_Status', 'Booster Sta_Chem Pump 4_Status', 'Booster Sta_Discharge_Pressure', 'Booster Sta_Intrusion_Switch_Alarm', 'Booster Sta_Low_Suction_Alarm', 'Booster Sta_PH', 'Booster Sta_Power_Fail_Alarm', 'Booster Sta_Pump 1_Fail_Alarm', 'Booster Sta_Pump 2_Fail_Alarm', 'Booster Sta_Res Disch_Flow', 'Booster Sta_Reservoir_Flow', 'Booster Sta_Suction_Pressure', 'Chlorine_Feed', 'Clear_Water_Level', 'Combined_Effluent_Turbidity', 'Filter1_Effluent_Flow', 'Filter1_Effluent_Turbidity', 'Filter1_Finish H2O_Loss of Head', 'Filter2_Effluent_Flow', 'Filter2_Effluent_Turbidity', 'Filter2_Finish H2O_Loss of Head', 'Filter3_Effluent_Flow', 'Filter3_Effluent_Turbidity', 'Filter3_Finish H2O_Loss of Head', 'Finish_Pump 1_100 HP_Control', 'Finish_Pump 2_75 HP_Control', 'Finish_Pump 3_200 HP_Control', 'Finished_Water_Flow', 'Finished_Water_Turbidity', 'Finished_Water_pH', 'High_Service_Pressure', 'Mixed_Water_pH', 'Post_Chlorine', 'Raw_Water_Flow', 'Raw_Water_Pump 1_Control', 'Raw_Water_Pump 2_Control', 'Raw_Water_Turbidity', 'Reservior_Water_Level', 'Reservoir_Power_Fail_Alarm', 'Settled_DefNameSeg2_Turbidity', 'Sulfur_Feed', 'Sweep_Flow', 'Water_Tank_AltValve_Control', 'Water_Tank1_Intrusion', 'Water_Tank1_Level', 'Water_Tank2_Level_psi', 'Yadkinville_xTalk01 1_MSC20_Water Tank'];
  var policyId = '56e883c634fa375416c1c0ec';

  db.connect(connectionString.join(''), function(err) {
    var criteria = {
      collection: 'points',
      query: {
        /*Name: {
          $in: pointNames
        }*/
        'Notify Policies': {
          $size: 1
        }
      }
    };
    Utility.iterateCursor(criteria, function(err, doc, cb) {
      var msgs = doc['Alarm Messages'];
      doc['Notify Policies'] = [policyId];
      for (var i = 0; i < msgs.length; i++) {
        msgs[i].ack = true;
        msgs[i].notify = true;
      }
      Utility.update({
        collection: 'points',
        query: {
          _id: parseInt(doc._id, 10)
        },
        updateObj: doc
      }, function(err, result) {
        cb(err);
      });
    }, function(err, count) {
      console.log(err, count, 'done');
    });
  });
}
// setUpNotifications();

function fixPointInst() {
  db.connect(connectionString.join(''), function(err) {
    var criteria = {
      collection: 'points',
      query: {
        'Point Type.Value': {
          $in: ['Display', 'Program']
        }
      }
    };
    Utility.iterateCursor(criteria, function(err, doc, cb) {
        var refs = doc['Point Refs'];
        var index = -1;
        async.eachSeries(refs, function(ref, callback) {
          index++;
          if (ref.Value !== ref.PointInst) {
            Utility.getOne({
              collection: 'points',
              query: {
                _id: ref.Value
              }
            }, function(err, point) {

              Config.EditChanges.applyUniquePIDLogic({
                point: doc,
                refPoint: point
              }, index);
              Utility.update({
                collection: 'points',
                query: {
                  _id: parseInt(doc._id, 10)
                },
                updateObj: doc
              }, callback);
            });
          } else {
            callback();
          }

        }, cb);

      },
      function(err, count) {
        console.log(err, count, 'done');
      });
  });
}
// fixPointInst();

function fixUsers() {
  db.connect(connectionString.join(''), function(err) {
    var criteria = {
      collection: 'Users',
      query: {}
    };
    Utility.iterateCursor(criteria, function(err, doc, cb) {
      var alerts = doc.alerts;

      for (var prop in alerts) {
        var cat = alerts[prop];
        for (var i = 0; i < cat.length; i++) {
          if (cat[i].hasOwnProperty('info')) {
            cat[i].Value = cat[i].info;
            cat[i].Type = cat[i].type;
            delete cat[i].info;
            delete cat[i].type;
          }
        }
      }
      if (!doc.hasOwnProperty('notificationOptions')) {
        doc['notificationOptions'] = {
          "Emergency": false,
          "Critical": false,
          "Urgent": false,
          "notifyOnAck": false
        };
      }
      if (!doc.hasOwnProperty('notificationsEnabled')) {
        doc['notificationsEnabled'] = false;
      }
      if (!doc.hasOwnProperty('alerts')) {
        doc['alerts'] = {
          'Normal': [],
          'Emergency': [],
          'Critical': [],
          'Urgent': []
        };
      }
      Utility.update({
        collection: 'Users',
        query: {
          _id: doc._id
        },
        updateObj: doc
      }, cb);
    }, function(err, count) {
      console.log('done', err, count);
    });
  });
}
// fixUsers();

function createMathBlocks() {
  var Point = require('../models/point');
  var socketCommon = require('../socket/common').common;
  var criteria = {
    collection: 'points',
    query: {
      _id: 81
    }
  };
  db.connect(connectionString.join(''), function(err) {
    Utility.getOne(criteria, function(err, report) {
      async.eachSeries(report['Point Refs'], function(column, cb) {
        // logger.info('working on', column.Value, column.PointName);
        async.waterfall([function(wfcb) {
          criteria.query._id = column.Value;
          Utility.getOne(criteria, wfcb);
        }, function(refPoint, wfcb) {
          // logger.info(refPoint.Name);
          Point.initPoint({
            name1: refPoint.name1,
            name2: refPoint.name2,
            name3: refPoint.name3,
            name4: 'Run Time',
            pointType: 'Math',
            targetUpi: 92
          }, function(err, cloned) {
            // logger.info(err, cloned);
            cloned['Point Refs'][0] = refPoint['Point Refs'][0];
            cloned['Point Refs'][4].Value = refPoint._id;
            cloned['Point Refs'][4] = Config.EditChanges.applyUniquePIDLogic({
              point: cloned,
              refPoint: refPoint
            }, 4)['Point Refs'][4];
            // logger.info(cloned['Point Refs']);
            socketCommon.addPoint(cloned, {}, {}, function(err, result) {
              // logger.info('cloned added', err);
              wfcb(null, refPoint);
            });
          }, function(refPoint, wfcb) {
            refPoint['Trend Interval'].Value = 1;
            Utility.update({
              collection: 'points',
              query: {
                _id: refPoint._id
              },
              updateObj: refPoint
            }, wfcb);
          });
        }], cb);
      }, function(err) {
        logger.info('done', err);
      });
    });
  });
}
// createMathBlocks();

function renamePoints() {
  var socketCommon = require('../socket/common').common;
  db.connect(connectionString.join(''), function(err) {
    var name1 = 'YDK Booster Sta';
    var newName1 = 'YNC Booster Sta';
    Utility.get({
      collection: 'points',
      query: {
        name1: name1
      }
    }, function(err, points) {
      async.eachSeries(points, function(point, cb) {
        var oldPoint = _.cloneDeep(point);
        point.name1 = newName1;
        point = Config.Update.formatPoint({
          point: point,
          oldPoint: oldPoint,
          property: 'name1'
        });
        socketCommon.newUpdate(oldPoint, point, {
          method: "update",
          from: "ui"
        }, {username:'SYSTEM'}, function(response, point) {
          console.log(response);
          cb();
        });
      }, function(err) {
        console.log(err, 'done');
      });
    });
  });
}
renamePoints();

function test() {
  var pjson = require('../package.json');
  console.log(pjson.version);
}
// test();