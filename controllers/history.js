let fs = require('fs');
let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils');
let History = new(require('../models/history'))();
let Point = require('../models/point');

// POSTMAN
router.post('/getMeters', function (req, res, next) {
    const point = new Point();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    point.getMeters(data, function (err, meters) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            meters: meters
        });
    });
});
// POSTMAN
router.post('/getUsage', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    History.getUsageStart(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, results);
    });
});
// POSTMAN
router.post('/getMissingMeters', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    History.getMissingMeters(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, results);
    });
});
// POSTMAN
router.post('/editDatastore', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    History.editDatastore(data, function (err, result) {
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
// Checked
router.post('/importCSV', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    History.importCSV(data, function (err, count) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            message: 'success',
            updatedCount: count
        });
    });
});
// Checked
router.post('/exportCSV', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    History.exportCSV(data, function (err, path) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            path: path
        });
    });
});
// Checked
router.get('/downloadCSV', function (req, res, next) {
    let path = req.query.path;
    let filename = path.split('\\');
    filename = filename[filename.length - 1].split('-')[0] + '-' + filename[filename.length - 1].split('-')[1] + '.csv';
    res.download(path, filename, function (err) {
        if (err) {
            // log it!
        } else {
            fs.unlinkSync(path);
        }
    });
});
// Checked
router.post('/uploadCSV', function (req, res, next) {
    let files = req.files;

    History.uploadCSV(files, function (err, path) {
        if (err) {
            return utils.sendResponse(res, err);
        }
        return utils.sendResponse(res, {
            path: path
        });
    });
});

module.exports = router;
