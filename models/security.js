var db = require('../helpers/db');
var Utility = require('../models/utility');
var User = require('../models/user');
var config = require('../public/js/lib/config.js');

module.exports = {
  getAllUsers: function (data, cb) {
    var properties;
    var returnUsers = [];
    var i;
    var j;
    var tempObj;

    var searchCriteria = {};
    var criteria = {
      collection: 'Users',
      query: {}
    };

    User.get(criteria, function (err, users) {
      if (err) {
        return cb(err);
      }
      properties = data.Properties;

      if (properties !== undefined) {
        for (i = 0; i < users.length; i++) {
          tempObj = {};
          for (j = 0; j < properties.length; j++) {

            if (typeof users[i][properties[j]] == 'undefined') {
              continue;
            }

            if (typeof users[i][properties[j]].Value == 'undefined') {
              tempObj[properties[j]] = users[i][properties[j]];
            } else {
              tempObj[properties[j]] = users[i][properties[j]].Value;
            }
          }

          returnUsers.push(tempObj);
        }
      } else {
        returnUsers = users;
      }

      return cb(null, returnUsers);
    });
  }
};
