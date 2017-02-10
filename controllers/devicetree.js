let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let DeviceTree = new(require('../models/devicetree'))();

// Checked
router.get('/gettree', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    DeviceTree.getTree(function (err, result) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, result);
    });
});

module.exports = router;
