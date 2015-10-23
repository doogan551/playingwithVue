var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var TrendPlots = require('../models/trendplots');

router.post('/', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  TrendPlots.getData(data, function(err, data) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, data);
  });
});

module.exports = router;