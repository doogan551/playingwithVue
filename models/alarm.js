var ObjectID = require('mongodb').ObjectID;

var Utility = require('../models/utility');
var config = require('../public/js/lib/config.js');
var logger = require('../helpers/logger')(module);

exports.maintainAlarmViews = function(socketid, view, data, common) {
  var openAlarms = common.openAlarms;

  if (typeof data === "string")
    data = JSON.parse(data);

  for (var i = 0; i < openAlarms.length; i++) {
    if (openAlarms[i].sockId === socketid && openAlarms[i].alarmView === view) {
      openAlarms[i].data = data;
      return;
    }
  }

  openAlarms.push({
    sockId: socketid,
    alarmView: view,
    data: data
  });
};

exports.getRecentAlarms = function(data, cb) {
  if (typeof data === "string") {
    data = JSON.parse(data);
  }
  var currentPage = parseInt(data.currentPage, 10);
  var itemsPerPage = parseInt(data.itemsPerPage, 10);
  var startDate = (typeof parseInt(data.startDate, 10) === "number") ? data.startDate : 0;
  var endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;
  var allEnumsPointTypes = config.Enums["Point Types"];
  var filterByPointTypeEnums = [];

  var sort = {};
  var groups = [];

  if (!itemsPerPage) {
    itemsPerPage = 200;
  }
  if (!currentPage || currentPage < 1) {
    currentPage = 1;
  }

  var numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

  var user = data.user;

  var query = {
    $and: [{
      msgTime: {
        $gte: startDate
      }
    }, {
      msgTime: {
        $lte: endDate
      }
    }]
  };

  if (data.name1 !== undefined) {
    if (data.name1 !== null) {
      query.Name1 = new RegExp("^" + data.name1, 'i');
    } else {
      query.Name1 = "";
    }

  }
  if (data.name2 !== undefined) {
    if (data.name2 !== null) {
      query.Name2 = new RegExp("^" + data.name2, 'i');
    } else {
      query.Name2 = "";
    }
  }
  if (data.name3 !== undefined) {
    if (data.name3 !== null) {
      query.Name3 = new RegExp("^" + data.name3, 'i');
    } else {
      query.Name3 = "";
    }
  }
  if (data.name4 !== undefined) {
    if (data.name4 !== null) {
      query.Name4 = new RegExp("^" + data.name4, 'i');
    } else {
      query.Name4 = "";
    }
  }
  if (data.msgCat) {
    query.msgCat = {
      $in: data.msgCat
    };
  }
  if (data.almClass) {
    query.almClass = {
      $in: data.almClass
    };
  }

  if (data.pointTypes) {
    if (data.pointTypes.length > 0 && data.pointTypes.length !== allEnumsPointTypes.length) {
      for (var i = 0; i < data.pointTypes.length; i++) {
        if (data.pointTypes[i].length > 0) {
          filterByPointTypeEnums.push(allEnumsPointTypes[data.pointTypes[i]].enum);
        }
      }
      query.pointType = {
        $in: filterByPointTypeEnums
      };
    }
  }

  sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

  var criteria = {
    collection: 'Alarms',
    query: query,
    _skip: (currentPage - 1) * itemsPerPage,
    _limit: numberItems,
    sort: sort,
    data: data
  };

  Utility.getWithSecurity(criteria, cb);
};

exports.acknowledgeAlarm = function(data, cb) {
  var ids, username, time, ackMethod;

  ids = data.ids;
  username = data.username;
  time = Math.floor(new Date().getTime() / 1000);
  ackMethod = data.ackMethod || 'Console';

  for (var j = 0; j < ids.length; j++) {
    ids[j] = ObjectID(ids[j]);
  }

  var criteria = {
    collection: 'Alarms',
    query: {
      _id: {
        $in: ids
      },
      ackStatus: 1
    },
    updateObj: {
      $set: {
        ackStatus: 2,
        ackUser: username,
        ackMethod: ackMethod,
        ackTime: time
      }
    },
    options: {
      multi: true
    }
  };


  Utility.update(criteria, function(err, result) {
    criteria.collection = 'ActiveAlarms';
    Utility.update(criteria, function(err2, result2) {
      cb(err || err2, result);
    });
  });
};