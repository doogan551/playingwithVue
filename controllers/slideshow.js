let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Slideshow = new(require('../models/slideshow'))();
// NOT CHECKED
router.post('/get/:id', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Slideshow.getSlideshow(data, function (err, ss) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, {
            slideshow: ss
        });
    });
});

module.exports = router;
