var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Point = require('../models/point');
var config = require('../public/js/lib/config.js');
var utils = require('../helpers/utils.js');

router.post('/browse', function (req, res) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Point.browse(data, function (err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

router.get('/newpoint', function (req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.newPoint(data, function (err, locals) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    else
      res.render('pointlookup/newPoint', locals);
  });
});

router.get('/newpoint/:id', function (req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.newPoint(data, function (err, locals) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    else
      res.render('pointlookup/newPoint', locals);
  });
});

router.get('/newpoint/restrictTo/:pointType', function (req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.newPoint(data, function (err, locals) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    else
      res.render('pointlookup/newPoint', locals);
  });
});

router.post('/search', function (req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.search(data, function (err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

router.get('/:id', function (req, res) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Point.getPointById(data, function (err, message, point) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    if (message) return utils.sendResponse(res, {
      message: message
    });
    return utils.sendResponse(res, point);
  });
});

module.exports = router;
