var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Policies = require('../models/policies');
var utils = require('../helpers/utils.js');

// NEW
router.get('/get', function(req, res) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Policies.get(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

// NEW
router.post('/save', function(req, res) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Policies.save(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

module.exports = router;