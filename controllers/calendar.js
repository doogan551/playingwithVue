let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Calendar = new(require('../models/calendar'))();
let System = new(require('../models/system'))();

// POSTMAN
router.post('/getyear', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Calendar.getYear(data, function (err, year) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, year);
    });
});
// POSTMAN
router.post('/getseason', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    System.getSeason(data, function (err, season) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, season);
    });
});
// POSTMAN
router.post('/updateseason', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    System.updateSeason(data, function (err) {
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
// POSTMAN
router.post('/newdate', function (req, res) {
    let data = _.merge(req.params, req.body);
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
router.post('/getyearswithdata', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Calendar.getYearsWithData(function (err, years) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, years);
    });
});

module.exports = router;
