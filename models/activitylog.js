var db = require('../helpers/db');
var Utility = require('../models/utility');
var config = require('../public/js/lib/config.js');
var logger = require('../helpers/logger')(module);
var utils = require('../helpers/utils');
var activityLogCollection = utils.CONSTANTS('activityLogCollection');

module.exports = {
  get: function(data, cb) {
    var currentPage = parseInt(data.currentPage, 10);
    var itemsPerPage = parseInt(data.itemsPerPage, 10);
    var startDate = (typeof parseInt(data.startDate, 10) === "number") ? data.startDate : 0;
    var endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime()) : data.endDate;
    var usernames = data.usernames;
    var sort = {};
    var allEnumsPointTypes = config.Enums["Point Types"];
    var filterByPointTypeEnums = [];

    if (!itemsPerPage) {
      itemsPerPage = 200;
    }
    if (!currentPage || currentPage < 1) {
      currentPage = 1;
    }

    var numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

    var query = {
      $and: [{
        timestamp: {
          $gte: startDate
        }
      }, {
        timestamp: {
          $lte: endDate
        }
      }]
    };

    if (data.name1 !== undefined) {
      if (data.name1 !== null) {
        query.name1 = new RegExp("^" + data.name1, 'i');
      } else {
        query.name1 = "";
      }
    } else {
      query.name1 = "";
    }

    if (data.name2 !== undefined) {
      if (data.name2 !== null) {
        query.name2 = new RegExp("^" + data.name2, 'i');
      } else {
        query.name2 = "";
      }
    } else {
      query.name2 = "";
    }

    if (data.name3 !== undefined) {
      if (data.name3 !== null) {
        query.name3 = new RegExp("^" + data.name3, 'i');
      } else {
        query.name3 = "";
      }
    } else {
      query.name3 = "";
    }

    if (data.name4 !== undefined) {
      if (data.name4 !== null) {
        query.name4 = new RegExp("^" + data.name4, 'i');
      } else {
        query.name4 = "";
      }
    } else {
      query.name4 = "";
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

    if (!!usernames && usernames.length > 0) {
      query.username = {
        $in: usernames
      };
    }

    sort.timestamp = (data.sort !== 'desc') ? -1 : 1;
    var skip = (currentPage - 1) * itemsPerPage;
    var criteria = {
      query: query,
      collection: activityLogCollection,
      sort: sort,
      _skip: skip,
      _limit: numberItems,
      data: data
    };
    Utility.getWithSecurity(criteria, cb);
  },
  create: function(logData, cb) {
    Utility.insert({
      collection: activityLogCollection,
      insertObj: logData
    }, cb);
  }
};