let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Mechanical = new(require('../models/mechanical'))();

router.post('/getTemplate', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Mechanical.getNode(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});

module.exports = router;
