var express = require('express');
var router = express.Router();
var passport = require('passport');

module.exports = function(controllers) {
  router.all('*', function(req, res, next) {
    /*for (var prop in req.body) {
        req.body[prop] = (typeof req.body[prop] === 'object') ? JSON.stringify(req.body[prop]) : req.body[prop];
    }*/
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  router.use('/', controllers.workspace);

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
  router.use('/reports1', controllers.reports);
  router.use('/report', controllers.reports);
  router.use('/thumbnail', controllers.thumbnails);
  router.use('/toolbag', controllers.toolbag);

  return router;
};