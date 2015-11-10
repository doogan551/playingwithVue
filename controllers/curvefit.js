var express = require('express');
var router = express.Router();
var _ = require('lodash');
var CurveFit = require('../models/curvefit');
var rtdTables = require('../lib/rtdTables.js');
var utils = require('../helpers/utils.js');
// Checked
router.post('/getRTDRange', function(req, res, next) {
  var ranges = {};
  for (var prop in rtdTables) {
    ranges[prop] = {
      min: rtdTables[prop][0].T,
      max: rtdTables[prop][rtdTables[prop].length - 1].T
    };
  }
  return utils.sendResponse(res, ranges);
});
// checked
router.post('/dofit', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  var callback = function(result){
    return utils.sendResponse(res, result);
  };

  CurveFit.doFit(data, callback);
});

module.exports = router;
