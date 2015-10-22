var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/pointinspector/:id', function(req, res, next) {
  res.render('pointInspector/index.jade');
});

router.get('/splash', function(req, res, next) {
  res.render('baseui/splash.jade');
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
  res.render("baseui/syspref.jade", {
    title: 'InfoScan System Preferences',
    user: req.user
  });
});

router.get('/devicetree', function(req, res) {
  res.render("devicetree/devicetree.jade");
});

router.get('/displays', function(req, res) {
  res.render("displays/index.jade");
});

router.get('/securityadmin', function(req, res) {
  res.render('securityAdmin/securityAdmin.jade');
});

router.get('/slideShows/', function(req, res) {
  res.render('slideShows/index.jade');
});

router.get('/slideShows/viewer', function(req, res) {
  res.render('slideShows/viewer.jade');
});

router.get('/thumbnail/capture', function(req, res) {
  res.render("thumbnailGenerator/capture.jade");
});

router.get('/toolbag', function(req, res) {
  res.render('toolbag/dbMonitor.jade');
});

router.get('/toolbag/dbTemplate', function(req, res) {
  res.render('toolbag/dbTemplate.jade');
});

router.get('/toolbag/dbMonitor', function(req, res) {
  res.render('toolbag/dbMonitor.jade');
});

router.get('/toolbag/propertyUsage', function(req, res) {
  res.render("toolbag/propertyUsage.jade");
});

router.get('/toolbag/enums', function(req, res) {
  res.render("toolbag/enums.jade");
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