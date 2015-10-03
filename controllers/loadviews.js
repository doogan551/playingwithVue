var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/pointinspector/:id', function (req, res, next) {
  res.render('pointInspector/index');
});

router.get('/splash', function (req, res, next) {
  res.render('baseui/splash');
});

router.get('/activitylogs', function (req, res) {
  res.render('activityLogs/index.jade');
});

router.get('/alarms', function (req, res) {
  res.render('alarms/index.jade');
});

router.get('/alarms/print', function (req, res) {
  res.render('alarms/print.jade');
});

router.get('/syspref', function (req, res) {
  res.render("baseui/syspref", {
		title: 'InfoScan System Preferences',
		user: req.user
	});
});

router.get('/devicetree', function (req, res) {
  res.render("devicetree/devicetree");
});

router.get('/displays', function (req, res) {
  res.render("displays/index.jade");
});


module.exports = router;
