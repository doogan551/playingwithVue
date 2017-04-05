let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Location = new(require('../models/location'))();

router.post('/get', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Location.getLocation(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});

router.post('/getChildren', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Location.getChildren(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});

router.post('/add', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Location.add(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});

module.exports = router;
