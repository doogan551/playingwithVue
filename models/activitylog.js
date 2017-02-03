var db = require('../helpers/db');
var Utility = require('../models/utility');
var config = require('../public/js/lib/config.js');
var logger = require('../helpers/logger')(module);
var utils = require('../helpers/utils');
var activityLogCollection = utils.CONSTANTS('activityLogCollection');

module.exports = {
  /////////////////////////////////////////////////
  //Returns activity logs based on criteria sent //
  /////////////////////////////////////////////////
  get: function(data, cb) {
    /** @type {Number} Current page of log window. Used to skip in mongo */
    var currentPage = parseInt(data.currentPage, 10);
    /** @type {Number} How many logs are being shown in window. Used to skip in mongo */
    var itemsPerPage = parseInt(data.itemsPerPage, 10);
    var startDate = (typeof parseInt(data.startDate, 10) === "number") ? data.startDate : 0;
    var endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime()) : data.endDate;
    /** @type {Number} Usernames associated with logs (not logged in user) */
    var usernames = data.usernames;
    var sort = {};

    if (!itemsPerPage) {
      itemsPerPage = 200;
    }
    if (!currentPage || currentPage < 1) {
      currentPage = 1;
    }

    /** @type {Number} I don't remember what this is for, but it overrides itemsPerPage if it exists */
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

    /** @type {Array} Point Type enums */
    if (data.pointTypes) {
      if (data.pointTypes.length > 0) {
        query.pointType = {
          $in: data.pointTypes
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
  //////////////////////////////////////////////
  // inserts an activity log into the databse //
  //////////////////////////////////////////////
  create: function(logData, cb) {
    Utility.insert({
      collection: activityLogCollection,
      insertObj: logData
    }, cb);
  }
};