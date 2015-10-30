var bcrypt = require('bcrypt-nodejs');
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var mongodb = require('mongodb');
var errorMsg = "Invalid username or password";
var User = require('../models/user.js');
var Utility = require('../models/utility.js');
var UserGroup = require('../models/userGroup.js');

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    var criteria = {
      collection: 'Users',
      query: [{
        $match: {
          "_id": new mongodb.ObjectID(id)
        }
      }, {
        $project: {
          _id: "$_id",
          "firstName": "$First Name.Value",
          "lastName": "$Last Name.Value",
          title: "$Title.Value",
          workspace: "$Workspace",
          username: "$username",
          photo: "$Photo.Value",
          "System Admin.Value": "$System Admin.Value"
        }
      }, {
        $limit: 1
      }]
    };
    Utility.aggregate(criteria, function(err, users) {
      var user = users[0];
      UserGroup.getGroupsWithUser(user._id, function(err, groups) {
        user.groups = groups;
        done(err, user);
      });
    });
  });

  passport.use(new LocalStrategy(function(username, password, done) {
    process.nextTick(function() {
      var criteria = {
        collection: 'Users',
        query: [{
          $match: {
            "username": {
              "$regex": new RegExp(['^', username, '$'].join(''), 'i')
            }
          }
        }, {
          $project: {
            _id: "$_id",
            "firstName": "$First Name.Value",
            "lastName": "$Last Name.Value",
            title: "$Title.Value",
            workspace: "$Workspace",
            username: "$username",
            password: "$Password.Value",
            photo: "$Photo.Value",
            "System Admin.Value": "$System Admin.Value",
            resetPass: "$Password Reset.Value",
            idleTimeout: "$Auto Logout Duration.Value",
            sessionLength: "$Session Length.Value"
          }
        }, {
          $limit: 1
        }]
      };

      Utility.aggregate(criteria, function(err, userArray) {
        var user = userArray[0];

        if (err) return done(err);
        if (!user || (user && !user.password)) {
          return done(null, false, {
            message: errorMsg
          });
        }

        bcrypt.compare(password, user.password, function(error, result) {
          var groupQuery = {};

          if (result === true) {
            groupQuery[['Users.', user._id].join('')] = {
              '$exists': true
            };

            UserGroup.getGroupsWithUser(user._id, function(
              err, groups) {
              if (err === null && (groups instanceof Array)) {
                user.groups = groups;
              }

              user.password = '';

              if (!!user.resetPass) {
                return done(null, user, {
                  message: "Please reset your password.",
                  resetPass: true
                });
              }

              return done(null, user);
            });

          } else {
            return done(null, false, {
              err: errorMsg
            });
          }
        });
      });
    });
  }));
};