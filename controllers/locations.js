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

        return utils.sendResponse(res, {
            newLocation: results.ops[0]
        });
    });
});

router.post('/bulkadd', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Location.builkAdd(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});

router.post('/getDescendants', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Location.getDescendants(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});

router.post('/getFullPath', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Location.getFullPath(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});

router.post('/delete', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Location.deleteLocation(data, function (err, results) {
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

router.post('/move', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Location.moveLocation(data, function (err, results) {
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

module.exports = router;
