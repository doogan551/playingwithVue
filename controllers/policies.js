let express = require('express');
let router = express.Router();
let _ = require('lodash');
let Policies = new(require('../models/policies'))();
let utils = require('../helpers/utils.js');
let ObjectID = require('mongodb').ObjectID;

// NEW
router.get('/get', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Policies.get(data, function (err, points) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, points);
    });
});

// NEW
router.post('/delete', function (req, res) {
    let data = _.merge(req.params, req.body);

    data._id = new ObjectID(data._id);

    Policies.delete(data, function (err, points) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, points);
    });
});

// NEW
router.post('/save', function (req, res) {
    let data = _.merge(req.params, req.body);

    Policies.save(data, function (err, points) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, points);
    });
});

module.exports = router;
