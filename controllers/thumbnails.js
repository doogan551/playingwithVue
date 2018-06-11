let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Thumbnail = new(require('../models/thumbnails'))();

// NOT CHECKED
router.get('/batch', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Thumbnail.batch(data, function (err, locallets) {
        res.render('thumbnailGenerator/batch', locallets);
    });
});
// NOT CHECKED
router.get('/:id', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Thumbnail.one(data, function (err, locallets) {
        res.render('thumbnailGenerator/batch', locallets);
    });
});
// NOT CHECKED
router.post('/save', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Thumbnail.save(data, function (err, locallets) {
        if (!err) {
            return utils.sendResponse(res, {
                'msg': 'success',
                'result': locallets.thumbDir
            });
        }
        return utils.sendResponse(res, {
            'msg': 'Error: ' + err
        });
    });
});

module.exports = router;
