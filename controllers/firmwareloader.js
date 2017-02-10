let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Firmware = new(require('../models/firmware'))();

// Checked
router.get('/get/:model', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Firmware.getModelFiles(data, function (err, files) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, {
            files: files
        });
    });
});
// NOT CHECKED - not used?
router.get('/getRemoteUnits', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Firmware.getRemoteUnits(data, function (err, remoteUnits) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, {
            remoteUnits: remoteUnits
        });
    });
});

module.exports = router;
