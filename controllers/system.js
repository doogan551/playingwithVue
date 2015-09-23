var express = require('express');
var router = express.Router();
var System = require('../models/system');
var utils = require('../helpers/utils');

router.get('/controlpriorities', function (req, res) {
  System.getSystemInfoByName('Control Priorities', function (err, priorities) {
    res.json(priorities);
  });
});

router.get('/qualitycodes', function (req, res) {
  System.getSystemInfoByName('Quality Codes', function (err, priorities) {
    res.json(priorities);
  });
});

router.get('/controllers', function (req, res) {
  System.getSystemInfoByName('Controllers', function (err, priorities) {
    res.json(priorities);
  });
});

router.get('/getcounts/:type', function (req, res) {
  var type = req.params.type;

  var callback = function (err, count) {
    if (err)
      return utils.sendResponse(res, {
        err: err
      });
    else
      return utils.sendResponse(res, count);
  };

  System.getCounts(type, callback);
});

module.exports = router;
