var express = require('express');
var router = express.Router();
var utils = require('../helpers/utils.js');
var ActivityLog = require('../models/activitylog');


router.post('/get', function (req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  ActivityLog.get(data, function (err, logs, count) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, {
      err: err,
      logs: logs,
      count: count
    });
  });
});

module.exports = router;
