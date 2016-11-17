var express = require('express');
var router = express.Router();
var passport = require('passport');
var config = require('config');

var inboundId = config.get('Infoscan').siteConfig.inboundId;

module.exports = function(controllers) {
  router.all('*', function(req, res, next) {
    /*for (var prop in req.body) {
        req.body[prop] = (typeof req.body[prop] === 'object') ? JSON.stringify(req.body[prop]) : req.body[prop];
    }*/

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
  });

  router.use('/', controllers.workspace);
  // Our inbound route is a random id so it's not guessable
  router.use('/' + inboundId, controllers.inbound);

  router.use('/sass', controllers.sass);
  router.use('/scheduleloader/report', controllers.reports);

  // ALL ROUTES BELOW THIS WILL REQUIRE AUTHENTICATION
  router.use(function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    res.redirect('/');
  });

  router.use('/', controllers.loadviews);
  router.use('/', controllers.workspace);

  router.use('/api/activitylogs', controllers.activitylogs);
  router.use('/api/calendar', controllers.calendar);
  router.use('/api/curvefit', controllers.curvefit);
  router.use('/api/devicetree', controllers.devicetree);
  router.use('/api/firmwareloader', controllers.firmwareloader);
  router.use('/api/meters', controllers.history);
  router.use('/api/points', controllers.points);
  router.use('/api/policies', controllers.policies);
  router.use('/api/reporttemplates', controllers.reporttemplates);
  router.use('/api/security', controllers.security);
  router.use('/api/scripts', controllers.scripts);
  router.use('/api/slideshows', controllers.slideshow);
  router.use('/api/system', controllers.system);
  router.use('/api/trenddata', controllers.trenddata);
  router.use('/api/trendplots', controllers.trendplots);

  router.use('/dashboard', controllers.dashboard);
  router.use('/displays', controllers.display);
  router.use('/gpl', controllers.gpl);
  router.use('/pointlookup', controllers.pointlookup);
  router.use('/report', controllers.reports);
  router.use('/thumbnail', controllers.thumbnails);
  router.use('/toolbag', controllers.toolbag);

  return router;
};