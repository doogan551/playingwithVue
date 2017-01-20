var express = require('express');
var router = express.Router();
var _ = require('lodash');
var passport = require('passport');
var utils = require('../helpers/utils');
var Workspace = require('../models/workspace');
var ActivityLog = require('../models/activitylog');
var actLogsEnums = require('../public/js/lib/config').Enums["Activity Logs"];
var logger = require('../helpers/logger')(module);
// Checked
router.get('/', function(req, res, next) {
  var _user = req.user;

  if (!_user) {
    _user = {};
  }

  res.render("baseui/home", {
    title: 'You are home',
    user: JSON.stringify(_user),
    isAuthenticated: req.isAuthenticated()
  });
});
// NOT CHECKED
router.get('/home', function(req, res, next) {
  var _user = req.user;

  if (!_user) {
    _user = {};
  }

  res.render("baseui/home", {
    title: 'You are home',
    user: JSON.stringify(_user),
    isAuthenticated: req.isAuthenticated()
  });
});
// NOT CHECKED
router.get('/login', function(req, res) {
  req.logout();
  res.render('baseui/login');
});
// Checked
router.post('/authenticate', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    } else if (info) {
      return res.json(info);
    }

    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      var logData = {
        user: user,
        timestamp: Date.now(),
        activity: actLogsEnums["User Logon"].enum,
        log: "User Logged In."
      };
      ActivityLog.create(utils.buildActivityLog(logData), function() {});
      return res.json(user);
    });
  })(req, res, next);
});
// NOT CHECKED
router.post('/saveworkspace', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Workspace.saveWorkspace(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, {
        message: 'success'
      });
    }
  });
});
// NOT CHECKED
router.post('/lost-password', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  return utils.sendResponse(res, {
    err: 'Route not implemented.'
  });
});
// NOT CHECKED
router.post('/reset-password', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;
  logger.info('reset password');
  Workspace.resetPassword(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, {
        message: 'success'
      });
    }
  });
});
// NOT CHECKED
router.post('/lost-password', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Workspace.resetPassword(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, {
        message: 'success'
      });
    }
  });
});
// Checked
router.get('/logout', function(req, res) {
  var user = req.user;
  req.logout();

  var logData = {
    user: user,
    timestamp: Date.now(),
    activity: actLogsEnums["User Logoff"].enum,
    log: "User Logged Out."
  };
  ActivityLog.create(utils.buildActivityLog(logData), function() {});
  res.redirect('/');
});

module.exports = router;