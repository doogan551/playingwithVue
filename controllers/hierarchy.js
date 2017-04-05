let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Hierarchy = new(require('../models/hierarchy'))();

router.use('/locations', require('./locations'));

router.get('/get', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Hierarchy.get(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});

module.exports = router;
