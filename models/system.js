var async = require('async');

var db = require('../helpers/db');
var Utility = require('../models/utility');
var Config = require('../public/js/lib/config');
var logger = require('../helpers/logger')(module);
var ObjectId = require('mongodb').ObjectID;

module.exports = {
  getSystemInfoByName: function(name, cb) {
    var criteria = {
      query: {
        Name: name
      },
      collection: 'SystemInfo'
    };

    Utility.getOne(criteria, cb);
  },
  getCounts: function(type, cb) {
    var query = {};
    var criteria = {};

    if (!!Config.Enums["Alarm Classes"][type]) {
      query = {
        almClass: Config.Enums["Alarm Classes"][type].enum
      };
    }

    criteria.collection = "Alarms";
    criteria.query = query;
    Utility.count(criteria, cb);
  },
  updateControlPriorities: function(data, cb) {
    var searchCriteria = {
      "Name": "Control Priorities"
    };

    var entries = (data.Entries) ? data.Entries : [];

    if (entries.length < 0)
      return cb("Please send array for entries");

    entries.forEach(function(entry) {
      entry["Priority Level"] = parseInt(entry["Priority Level"], 10);
    });

    var updateCriteria = {
      $set: {
        Entries: entries
      }
    };

    var criteria = {
      query: searchCriteria,
      collection: 'SystemInfo',
      updateObj: updateCriteria
    };

    Utility.update(criteria, cb);
  },
  getQualityCodes: function(data, cb) {
    var criteria = {
      query: {
        Name: {
          $in: ["Quality Codes", "Preferences"]
        }
      },
      collection: 'SystemInfo'
    };

    Utility.get(criteria, function(err, result) {
      if (err) {
        return cb(err);
      }

      var returnObj = {
        Entries: [],
        "Quality Code Enable": {}
      };

      for (var i = 0; i < result.length; i++) {
        if (result[i].Name === "Preferences") {
          returnObj["Quality Code Enable"] = {
            Override: result[i]["Quality Code Default Mask"] & Config.Enums["Quality Code Enable Bits"].Override["enum"],
            "COV Enable": result[i]["Quality Code Default Mask"] & Config.Enums["Quality Code Enable Bits"]["COV Enable"]["enum"],
            "Alarms Off": result[i]["Quality Code Default Mask"] & Config.Enums["Quality Code Enable Bits"]["Alarms Off"]["enum"],
            "Command Pending": result[i]["Quality Code Default Mask"] & Config.Enums["Quality Code Enable Bits"]["Command Pending"]["enum"]
          };
        } else if (result[i].Name === "Quality Codes") {
          returnObj.Entries = result[i].Entries;
        }
      }

      return cb(null, returnObj);
    });
  },
  updateQualityCodes: function(data, cb) {
    var codesSearch = {
      "Name": "Quality Codes"
    };

    var maskSearch = {
      "Name": "Preferences"
    };

    var entries = (data.Entries) ? data.Entries : [];
    var codesUpdate = {
      $set: {
        Entries: entries
      }
    };

    var qualityMask = data["Quality Code Enable"];

    var maskUpdate = 0;

    maskUpdate = (qualityMask["Override"] * 1 !== 0) ? maskUpdate | Config.Enums["Quality Code Enable Bits"].Override["enum"] : maskUpdate;
    maskUpdate = (qualityMask["COV Enable"] * 1 !== 0) ? maskUpdate | Config.Enums["Quality Code Enable Bits"]["COV Enable"]["enum"] : maskUpdate;
    maskUpdate = (qualityMask["Alarms Off"] * 1 !== 0) ? maskUpdate | Config.Enums["Quality Code Enable Bits"]["Alarms Off"]["enum"] : maskUpdate;
    maskUpdate = (qualityMask["Command Pending"] * 1 !== 0) ? maskUpdate | Config.Enums["Quality Code Enable Bits"]["Command Pending"]["enum"] : maskUpdate;

    maskUpdate = (maskUpdate === 15) ? 255 : maskUpdate;

    var prefUpdate = {
      $set: {
        "Quality Code Default Mask": maskUpdate
      }
    };

    var criteria = {
      query: codesSearch,
      collection: 'SystemInfo',
      updateObj: codesUpdate
    };

    Utility.update(criteria, function(err, data) {
      if (err) {
        return cb(err.message);
      }

      criteria = {
        query: maskSearch,
        collection: 'SystemInfo',
        updateObj: prefUpdate
      };
      Utility.update(criteria, cb);
    });
  },
  updateControllers: function(data, cb) {
    var ID = 'Controller ID';
    var searchCriteria = {
      "Name": "Controllers"
    };

    var entries = (data.Entries) ? data.Entries : [];
    var row;
    var c;

    for (c = 0; c < entries.length; c++) {
      row = entries[c];
      row[ID] = parseInt(row[ID], 10);
      row.isUser = (row.isUser === 'true');
    }

    if (entries.length < 0) {
      return cb("Please send array for entries");
    }

    var updateCriteria = {
      $set: {
        Entries: entries
      }
    };

    var criteria = {
      query: searchCriteria,
      collection: 'SystemInfo',
      updateObj: updateCriteria
    };

    Utility.update(criteria, cb);
  },

  updateTelemetry: function(data, cb) {
    var ipSegment = parseInt(data["IP Network Segment"], 10);
    var ipPort = parseInt(data["IP Port"], 10);
    var netConfig = data['Network Configuration'];

    var updateNetworks = function(networks, callback) {
      async.eachSeries(networks, function(network, acb) {
        var criteria = {
          collection: 'points',
          query: {},
          updateObj: {},
          options: {
            multi: true
          }
        };
        var updates = [{
          query: {
            'Point Type.Value': 'Device',
            'Network Segment.Value': network['IP Network Segment']
          },
          updateObj: {
            $set: {
              'Ethernet IP Port.Value': network['IP Port']
            }
          }
        }, {
          query: {
            'Point Type.Value': 'Device',
            'Downlink Network.Value': network['IP Network Segment']
          },
          updateObj: {
            $set: {
              'Downlink IP Port.Value': network['IP Port']
            }
          }
        }, {
          query: {
            'Point Type.Value': 'Remote Unit',
            'Network Segment.Value': network['IP Network Segment']
          },
          updateObj: {
            $set: {
              'Ethernet IP Port.Value': network['IP Port']
            }
          }
        }];
        async.eachSeries(updates, function(update, acb2) {
          criteria.query = update.query;
          criteria.updateObj = update.updateObj;
          Utility.update(criteria, acb2);
        }, acb);
      }, callback);
    };

    for (var n = 0; n < netConfig.length; n++) {
      netConfig[n]['IP Network Segment'] = parseInt(netConfig[n]['IP Network Segment'], 10);
      netConfig[n]['IP Port'] = parseInt(netConfig[n]['IP Port'], 10);
      netConfig[n].isDefault = (netConfig[n].isDefault === 'true');
    }

    var searchCriteria = {
      "Name": "Preferences"
    };

    var updateCriteria = {
      $set: {
        "IP Network Segment": ipSegment,
        "APDU Timeout": parseInt(data["APDU Timeout"], 10),
        "APDU Retries": parseInt(data["APDU Retries"], 10),
        "Public IP": data["Public IP"],
        "IP Port": ipPort,
        "Time Zone": parseInt(data["Time Zone"], 10),
        "Network Configuration": netConfig
      }
    };

    var criteria = {
      query: searchCriteria,
      updateObj: updateCriteria,
      collection: 'SystemInfo'
    };
    Utility.getOne({
      collection: 'SystemInfo',
      query: {
        Name: 'Preferences'
      }
    }, function(err, data) {
      var centralUpi = data['Central Device UPI'];
      Utility.update({
        collection: 'points',
        query: {
          _id: centralUpi
        },
        updateObj: {
          $set: {
            'Ethernet IP Port.Value': ipPort
          }
        }
      }, function(err, results) {

        Utility.update(criteria, function(err, data) {

          if (err) {
            return cb(err.message);
          }
          updateNetworks(netConfig, cb);

        });
      });
    });
  },
  getStatus: function(data, cb) {
    var ackStatus = false;
    var serverStatus = false;

    var criteria = {
      collection: 'Alarms',
      query: {
        ackStatus: 1
      },
      fields: {
        _id: 1
      },
      limit: 1
    };
    Utility.get(criteria, function(err, alarm) {
      if (err) {
        return cb(err);
      }
      ackStatus = (alarm.length > 0) ? true : false;
      return cb(null, {
        ackStatus: ackStatus,
        serverStatus: true
      });
    });
  },
  getCustomColors: function(data, cb) {
    var searchCriteria = {
      "Name": "Custom Colors"
    };
    var criteria = {
      query: searchCriteria,
      collection: 'SystemInfo'
    };
    Utility.getOne(criteria, function(err, data) {

      if (err) {
        return cb(err.message);
      }

      var entries = data["HTML Colors"];
      return cb(null, entries);
    });
  },
  updateCustomColors: function(data, cb) {
    var codesSearch = {
      "Name": "Custom Colors"
    };

    var colorsUpdate = {
      $set: {
        "HTML Colors": data.colorsArray
      }
    };

    var criteria = {
      query: codesSearch,
      collection: 'SystemInfo',
      updateObj: colorsUpdate
    };

    Utility.update(criteria, cb);
  },
  getAlarmTemplates: function(data, cb) {
    var searchCriteria = {};
    var criteria = {
      query: searchCriteria,
      collection: 'AlarmDefs'
    };
    Utility.get(criteria, function(err, data) {

      if (err) {
        return cb(err.message);
      }

      var entries = data;
      return cb(null, entries);
    });
  },
  updateAlarmTemplate: function(data, cb) {
    var searchCriteria,
      criteria;

    if (!!data.newObject) {
      var alarmTemplateNew = {
        "_id": new ObjectId(),
        "isSystemMessage": false,
        "msgType": parseInt(data.newObject.msgType, 10),
        "msgCat": parseInt(data.newObject.msgCat, 10),
        "msgTextColor": data.newObject.msgTextColor,
        "msgBackColor": data.newObject.msgBackColor,
        "msgName": data.newObject.msgName,
        "msgFormat": data.newObject.msgFormat
      };

      criteria = {
        collection: 'AlarmDefs',
        saveObj: alarmTemplateNew
      };

      console.log("new criteria = " + JSON.stringify(criteria));
      Utility.save(criteria, cb);

    } else if (!!data.updatedObject) {
      searchCriteria = {
        "_id": ObjectId(data.updatedObject._id)
      };

      var alarmTemplateUpdate = {
        $set: {
          "isSystemMessage": (data.updatedObject.isSystemMessage == "true"),
          "msgType": parseInt(data.updatedObject.msgType, 10),
          "msgCat": parseInt(data.updatedObject.msgCat, 10),
          "msgTextColor": data.updatedObject.msgTextColor,
          "msgBackColor": data.updatedObject.msgBackColor,
          "msgName": data.updatedObject.msgName,
          "msgFormat": data.updatedObject.msgFormat
        }
      };

      criteria = {
        query: searchCriteria,
        collection: 'AlarmDefs',
        updateObj: alarmTemplateUpdate
      };

      console.log("updated criteria = " + JSON.stringify(criteria));
      Utility.update(criteria, cb);
    }
  },
  deleteAlarmTemplate: function(data, cb) {
    var searchCriteria = {
      "_id": ObjectId(data.deleteObject._id)
    };
    var criteria = {
      query: searchCriteria,
      collection: 'AlarmDefs'
    };
    Utility.remove(criteria, function(err, data) {

      if (err) {
        return cb(err.message);
      }

      var entries = data;
      return cb(null, entries);
    });
  },
  weather: function(cb) {
    var returnData;
    var upiMatrix = {};
    var weatherPointData = {};
    var weatherPointUpis = [];
    var getWeather = function(callback) {
      var search = {
        Name: "Weather"
      };
      var fields = {
        _id: 0,
        Name: 0
      };

      var criteria = {
        query: search,
        fields: fields,
        collection: 'SystemInfo'
      };

      Utility.getOne(criteria, function(err, _data) {
        var upi;
        var key;
        // Our data structure is like this:
        // {
        //    OAT: upi #,
        //    HDD: upi #,
        //    CDD: upi #
        // }
        for (key in _data) {
          upi = _data[key];
          // Save the upi and data object
          weatherPointUpis.push(upi);
          // Init our weather point
          weatherPointData[key] = null;
          // Save the key reference by upi
          upiMatrix[upi] = key;
        }
        callback(err);
      });
    };
    var getPoints = function(callback) {
      var search = {
        _id: {
          $in: weatherPointUpis
        }
      };
      var fields = {
        _id: 1,
        _pStatus: 1,
        Name: 1,
        'Point Type': 1
      };
      var criteria = {
        query: search,
        fields: fields,
        collection: 'points'
      };

      Utility.get(criteria, function(err, _data) {
        for (var i = 0, len = _data.length, point; i < len; i++) {
          point = _data[i];
          weatherPointData[upiMatrix[point._id]] = point;
        }
        returnData = weatherPointData;
        callback(err);
      });
    };

    var executeFns = [getWeather, getPoints];

    async.waterfall(executeFns, function(err) {
      if (err) {
        return cb(err.message);
      }

      return cb(null, returnData);
    });
  },
  updateWeather: function(data, cb) {
    var search = {
      Name: "Weather"
    };
    var update = {
      $set: {}
    };
    var $set = update.$set;
    var getSetData = function(upi) {
      if (upi === 'null') {
        upi = null;
      } else {
        upi = parseInt(upi, 10);
      }
      return upi;
    };

    for (var key in data) {
      $set[key] = getSetData(data[key]);
    }

    var criteria = {
      query: search,
      updateObj: update,
      collection: 'SystemInfo'
    };

    Utility.update(criteria, cb);
  },
  getVersions: function(data, cb) {
    var pjson = require('../package.json');
    var versions = {
      infoscanjs: pjson.version
    };
    var criteria = {
      collection: 'SystemInfo',
      query: {
        Name: 'Preferences'
      }
    };

    Utility.getOne(criteria, function(err, result) {
      if (err) {
        return cb(err);
      } else {
        versions.Processes = result['Server Version'];
        return cb(null, versions);
      }
    })
  }
};