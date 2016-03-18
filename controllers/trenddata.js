var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var TrendData = require('../models/trenddata');
// NOT CHECKED
router.post('/viewTrend', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  TrendData.viewTrend(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.post('/getTrendLimits', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  TrendData.getTrendLimits(data, function(err, limits) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, limits);
  });
});

module.exports = router;