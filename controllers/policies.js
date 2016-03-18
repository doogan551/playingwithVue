var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Policies = require('../models/policies');
var utils = require('../helpers/utils.js');
var ObjectID = require('mongodb').ObjectID;

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
router.post('/delete', function(req, res) {
  var data = _.merge(req.params, req.body);

  data._id = new ObjectID(data._id);

  Policies.delete(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

// NEW
router.post('/save', function(req, res) {
  var data = _.merge(req.params, req.body);

  Policies.save(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

module.exports = router;