var express = require('express');
var router = express.Router();
var _ = require('lodash');
var passport = require('passport');
var utils = require('../helpers/utils');
var Workspace = require('../models/workspace');

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

router.get('/login', function(req, res) {
  res.render('login');
});

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

      return res.json(user);
    });
  })(req, res, next);
});

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

router.post('/lost-password', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  return utils.sendResponse(res, {
    err: 'Route not implemented.'
  });
});

router.get('/reset-password', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  return utils.sendResponse(res, {
    err: 'Route not implemented.'
  });
});

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

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;