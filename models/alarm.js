var Utility = require('../models/utility');
var config = require('../public/js/lib/config.js');

exports.maintainAlarmViews = function (socketid, view, data, common) {
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

exports.getRecentAlarms = function (data, cb) {
  if (typeof data === "string")
    data = JSON.parse(data);
  var currentPage = parseInt(data.currentPage, 10);
  var itemsPerPage = parseInt(data.itemsPerPage, 10);
  var startDate = (typeof parseInt(data.startDate, 10) === "number") ? data.startDate : 0;
  var endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;

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
    query.PointType = {
      $in: data.pointTypes
    };
  }

  groups = user.groups.map(function (group) {
    return group._id.toString();
  });

  if (!user["System Admin"].Value) {
    query.Security = {
      $in: groups
    };
  }

  sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

  var criteria = {
    collection: 'Alarms',
    query: query,
    skip: (currentPage - 1) * itemsPerPage,
    limit: numberItems,
    sort: sort
  };

  Utility.get(criteria, function (err, alarms) {
    if (err) return cb(err);
    mydb.collection(alarmsCollection).count(query, function (err, count) {
      if (err) return cb(err);
      return cb(err, alarms, count);
    });
  });
};
