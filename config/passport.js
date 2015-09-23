var bcrypt = require('bcrypt-nodejs');
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var errorMsg = "Invalid username or password";
var User = require('../models/user.js');
var UserGroup = require('../models/userGroup.js');

module.exports = function (passport) {
  passport.serializeUser(function (user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, users) {
      var user = users[0];

      UserGroup.getGroupsWithUser(user._id, function (err, groups) {
        user.groups = groups;
        done(err, user);
      });
    });
  });

  passport.use(new LocalStrategy(function (username, password, done) {
    process.nextTick(function () {
      User.findByUsername(username, function (err, userArray) {
        var user = userArray[0];

        if (err) return done(err);

        if (!user || (user && !user.Password.Value)) {
          return done(null, false, {
            message: errorMsg
          });
        }

        bcrypt.compare(password, user.Password.Value, function (error, result) {
          var groupQuery = {};

          if (result === true) {
            groupQuery[['Users.', user._id].join('')] = {
              '$exists': true
            };

            UserGroup.getGroupsWithUser(user._id, function (
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
