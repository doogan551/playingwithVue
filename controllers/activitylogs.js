let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let ActivityLog = new(require('../models/activitylog'))();

// Checked
router.post('/get', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    ActivityLog.get(data, function (err, logs, count) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, {
            err: err,
            logs: logs,
            count: count
        });
    });
});

module.exports = router;
