var express = require('express');
var router = express.Router();
var passport = require('passport');

module.exports = function (router, controllers) {
  router.all('*', function (req, res, next) {
    /*for (var prop in req.body) {
        req.body[prop] = (typeof req.body[prop] === 'object') ? JSON.stringify(req.body[prop]) : req.body[prop];
    }*/

    next();
  });

  router.use('/', controllers.workspace);
  router.use('/session', controllers.session);

  // ALL ROUTES BELOW THIS WILL REQUIRE AUTHENTICATION
  router.use(function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    res.redirect('/session/login');
  });

  router.use('/', controllers.loadviews);

  router.use('/pointlookup', controllers.pointlookup);

  router.use('/api/activitylogs', controllers.activitylogs);
  router.use('/api/calendar', controllers.calendar);
  router.use('/api/points', controllers.points);
  router.use('/api/security', controllers.security);
  router.use('/api/system', controllers.system);

  return router;
};
