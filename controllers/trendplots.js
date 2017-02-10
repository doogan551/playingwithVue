let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let TrendPlots = new(require('../models/trendplots'))();
// NOT CHECKED
router.post('/', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    TrendPlots.getData(data, function (err, data) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, data);
    });
});

module.exports = router;
