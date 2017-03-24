var express = require('express');
var router = express.Router();
var passport = require('passport');
// 
router.get('/pointinspector/:id', function(req, res, next) {
  res.render('pointInspector/index.pug');
});
// 
router.get('/splash', function(req, res, next) {
  res.render('baseui/splash.pug');
});
// 
router.get('/activitylogs', function(req, res) {
  res.render('activityLogs/index.pug');
});
// 
router.get('/alarms', function(req, res) {
  res.render('alarms/index.pug');
});
// 
router.get('/alarms/print', function(req, res) {
  res.render('alarms/print.pug');
});
// 
router.get('/syspref', function(req, res) {
  res.render("baseui/syspref.pug", {
    title: 'InfoScan System Preferences',
    user: req.user
  });
});
// 
router.get('/devicetree', function(req, res) {
  res.render("devicetree/devicetree.pug");
});
// 
router.get('/mechtree', function(req, res) {
  res.render("mechtree/mechtree.pug");
});
// 
router.get('/displays', function(req, res) {
  res.render("displays/index.pug");
});
// 
router.get('/report', function(req, res) {
  res.render('reports/index');
});
// 
router.get('/securityadmin', function(req, res) {
  res.render('securityAdmin/securityAdmin.pug');
});

router.get('/slideShows/', function(req, res) {
  res.render('slideShows/index.pug');
});
// 
router.get('/slideShows/viewer', function(req, res) {
  res.render('slideShows/viewer.pug');
});

router.get('/thumbnail/capture', function(req, res) {
  res.render("thumbnailGenerator/capture.pug");
});
// 
router.get('/toolbag', function(req, res) {
  res.render('toolbag/dbMonitor.pug');
});
// 
router.get('/toolbag/dbTemplate', function(req, res) {
  res.render('toolbag/dbTemplate.pug');
});
// 
router.get('/toolbag/dbMonitor', function(req, res) {
  res.render('toolbag/dbMonitor.pug');
});
// 
router.get('/toolbag/propertyUsage', function(req, res) {
  res.render("toolbag/propertyUsage.pug");
});
// 
router.get('/toolbag/enums', function(req, res) {
  res.render("toolbag/enums.pug");
});

router.get('/trendplots', function(req, res) {
  var TrendPlots = require('../models/trendplots');
  TrendPlots.getPoints([2929, 2930, 2932, 2933, 2934, 2935, 643767, 643769, 643771, 643773, 643775, 643893, 643895, 643897, 643899, 643901, 729780, 730050], function(err, data) {
    res.locals = {
      pointData: JSON.stringify(data)
    };
    res.render('trendPlots/index.pug');
  });
});

router.get('/logs', function(req, res) {
  res.render("logs/index.pug");
});


module.exports = router;