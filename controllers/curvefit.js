let express = require('express');
let router = express.Router();
let _ = require('lodash');
let rtdTables = require('../lib/rtdTables.js');
let utils = require('../helpers/utils.js');
let CurveFit = new(require('../models/curvefit'))();

// Checked
router.post('/getRTDRange', function (req, res, next) {
    let ranges = {};
    for (let prop in rtdTables) {
        ranges[prop] = {
            min: rtdTables[prop][0].T,
            max: rtdTables[prop][rtdTables[prop].length - 1].T
        };
    }
    return utils.sendResponse(res, ranges);
});
// checked
router.post('/dofit', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    let callback = function (result) {
        return utils.sendResponse(res, result);
    };

    CurveFit.doFit(data, callback);
});

module.exports = router;
