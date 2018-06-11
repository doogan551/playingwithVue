let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let DeviceTree = require('../models/devicetree');

// POSTMAN
router.get('/gettree', function (req, res, next) {
    let deviceTreeModel = new DeviceTree();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    deviceTreeModel.getTree(function (err, result) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, result);
    });
});

module.exports = router;
