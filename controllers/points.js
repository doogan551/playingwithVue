var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Point = require('../models/point');
var config = require('../public/js/lib/config.js');
var utils = require('../helpers/utils.js');

router.post('/browse', function(req, res) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Point.browse(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

router.post('/togglegroup', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.toggleGroup(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

router.get('/newpoint', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.newPoint(data, function(err, locals) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    else
      res.render('pointlookup/newPoint', locals);
  });
});

router.get('/newpoint/:id', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.newPoint(data, function(err, locals) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    else
      res.render('pointlookup/newPoint', locals);
  });
});

router.get('/newpoint/restrictTo/:pointType', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.newPoint(data, function(err, locals) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    else
      res.render('pointlookup/newPoint', locals);
  });
});

router.post('/search', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.search(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

router.get('/searchdependencies2/:upi', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.searchDependencies2(data, function(err, result) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, {
      Involvement: result
    });
  });
});

router.post('/getnames', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.getNames(data, function(err, results) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, results);
  });
});

router.post('/getpoint', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.getPoint(data, function(err, point) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, point);
  });
});

router.post('/initpoint', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.initPoint(data, function(err, point) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, point);
  });
});

router.get('/getpointref/small/:upi', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  Point.getPointRefsSmall(data, function(err, message, point) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    if (message) {
      return utils.sendResponse(res, {
        message: message
      });
    }
    return utils.sendResponse(res, point);
  });
});

router.post('/findalarmdisplays', function(req, res) {
  var data = _.merge(req.params, req.body, req.query);
  data.user = req.user;

  var reqId = parseInt(data.reqID, 10);

  Point.findAlarmDisplays(data, function(err, displays) {
    if (err) return utils.sendResponse(res, {
      err: err,
      reqID: reqId
    });
    return utils.sendResponse(res, {
      displays: displays,
      reqID: reqId
    });
  });
});

router.get('/:id', function(req, res) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Point.getPointById(data, function(err, message, point) {
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