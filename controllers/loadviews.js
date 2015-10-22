var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/pointinspector/:id', function(req, res, next) {
  res.render('pointInspector/index');
});

router.get('/splash', function(req, res, next) {
  res.render('baseui/splash');
});

router.get('/activitylogs', function(req, res) {
  res.render('activityLogs/index.jade');
});

router.get('/alarms', function(req, res) {
  res.render('alarms/index.jade');
});

router.get('/alarms/print', function(req, res) {
  res.render('alarms/print.jade');
});

router.get('/syspref', function(req, res) {
  res.render("baseui/syspref", {
    title: 'InfoScan System Preferences',
    user: req.user
  });
});

router.get('/devicetree', function(req, res) {
  res.render("devicetree/devicetree");
});

router.get('/displays', function(req, res) {
  res.render("displays/index.jade");
});

router.get('/securityadmin', function(req, res) {
  res.render('securityAdmin/securityAdmin');
});

router.get('/slideShows/', function(req, res) {
  res.render('slideShows/index.jade');
});

router.get('/slideShows/viewer', function(req, res) {
  res.render('slideShows/viewer.jade');
});

router.get('/thumbnail/capture', function(req, res) {
  res.render("thumbnailGenerator/capture");
});

router.get('/trendplots', function(req, res) {
  var TrendPlots = require('../models/trendplots');
  TrendPlots.getPoints([2929, 2930, 2932, 2933, 2934, 2935, 643767, 643769, 643771, 643773, 643775, 643893, 643895, 643897, 643899, 643901, 729780, 730050], function(err, data) {
    res.locals = {
      pointData: JSON.stringify(data)
    };
    res.render('trendPlots/index.jade');
  });
});


module.exports = router;