let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Calendar = new(require('../models/calendar'))();

// Checked
router.post('/getyear', function (req, res) {
    let data = _.merge(req.params, req.body);
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
// Checked
router.post('/getseason', function (req, res) {
    let data = _.merge(req.params, req.body);
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
// Checked
router.post('/updateseason', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Calendar.updateSeason(data, function (err) {
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
// Checked - Shouldn't be called if season changes in year that doesn't have dates
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

module.exports = router;
