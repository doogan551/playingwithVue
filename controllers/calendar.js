var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Calendar = require('../models/calendar');

router.post('/getyear', function (req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Calendar.getYear(data, function (err, years) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, years[0]);
  });
});

router.post('/getseason', function (req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Calendar.getSeason(data, function (err, seasons) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, seasons[0]);
  });
});

router.post('/updateseason', function (req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Calendar.updateSeason(data, function (err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, {
      message: 'success'
    });
  });
});

router.post('/newdate', function (req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Calendar.newDate(data, function (err, yearResult) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, yearResult);
  });
});

module.exports = router;
