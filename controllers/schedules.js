let express = require('express');
let router = express.Router();
let utils = require('../helpers/utils.js');
let _ = require('lodash');
let Schedule = new(require('../models/schedule'))();

router.post('/getSchedules', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Schedule.getSchedules(data, function (err, schedules) {
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
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Schedule.saveSchedules(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {});
    });
});

router.post('/runSchedule', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Schedule.runSchedule(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {});
    });
});

module.exports = router;
