var express = require('express');
var router = express.Router();
var utils = require('../helpers/utils.js');
var _ = require('lodash');
var schedule = require('../models/schedule');

router.post('/getSchedules', function (req, res, next) {
    var data = _.merge(req.params, req.body);
    data.user = req.user;

    schedule.getSchedules(data, function (err, schedules) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            schedules: schedules
        });
    });
});

router.post('/saveSchedules', function (req, res, next) {
    var data = _.merge(req.params, req.body);
    data.user = req.user;

    schedule.saveSchedules(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {});
    });
});

router.post('/runSchedule', function (req, res, next) {
    var data = _.merge(req.params, req.body);
    data.user = req.user;

    schedule.runSchedule(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {});
    });
});

module.exports = router;