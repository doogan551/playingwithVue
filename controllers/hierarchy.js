let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Hierarchy = new(require('../models/hierarchy'))();

router.use('/locations', require('./locations'));

router.post('/get', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Hierarchy.getNode(data, function (err, results) {
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

    Hierarchy.getChildren(data, function (err, results) {
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

    Hierarchy.addAll(data, function (err, result) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, result);
    });
});

router.post('/getDescendants', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Hierarchy.getDescendants(data, function (err, results) {
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

    Hierarchy.getFullPath(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});

router.post('/search', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Hierarchy.search(data, function (err, results) {
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

    Hierarchy.deleteNode(data, function (err, results) {
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

    Hierarchy.moveNode(data, function (err, results) {
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

router.post('/edit', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Hierarchy.editNode(data, function (err, results) {
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

router.post('/checkUniqueDisplayUnderParent', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Hierarchy.checkUniqueDisplayUnderParent(data, function (err, exists) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, exists);
    });
});

module.exports = router;
