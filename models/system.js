var db = require('../helpers/db');
var Utility = require('../models/utility');
var Config = require('../public/js/lib/config');

exports.getSystemInfoByName = function (name, cb) {
  var criteria = {
    query: {
      Name: name
    },
    collection: 'SystemInfo',
    limit: 1
  };

  Utility.get(criteria, cb);
};

exports.getCounts = function (type, cb) {
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
};
