let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Scripts = new(require('../models/scripts'))();

// NOT CHECKED - moved to socket?
router.post('/api/scripts/updatescript', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Scripts.update(data, function (err, data) {
        if (data.length > 0) {
            return res.json({
                err: data.toString().replace(re, '')
            });
        }
        return res.json({
            path: path
        });
    });
});
// NOT CHECKED - moved to socket?
router.post('/api/scripts/commitscript', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Scripts.commit(data, function (err, script) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            point: script
        });
    });
});
// NOT CHECKED - moved to socket?
router.post('/api/scripts/readscript', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Scripts.read(data, function (err, point) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            script: point['Script Source File'],
            fileName: point['Script Filename']
        });
    });
});

module.exports = router;
