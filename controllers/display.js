let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
// let Display = require('../models/display');
let Display = new(require('../models/display'))();
// Checked
router.post('/getDisplayInfo', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Display.getDisplayInfo(data, function (err, info) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, info);
    });
});
// Checked
router.get('/view/:upoint', function(req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Display.viewDisplay(data, (displayData) => {
        _.forOwn(displayData, (val, key) => {
            res.locals[key] = JSON.stringify(val);
        });
        // res.locals = JSON.stringify(displayData);
    	res.render('displays/index.pug');
    });
});
// NOT CHECKED
router.get('/view/:upoint/:dispId', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

    Display.viewDisplay(data, function (err, result) {

    });
});
// Checked
router.post('/publish', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;
	data.files = req.files;

    Display.publish(data, function (err, result) {
        if (err) {
            return res.send(err);
        }
        return res.send(result);
    });
});
// NOT CHECKED
router.get('/browse', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Display.browse(data, function (err, result) {
        if (err) {
            return res.send(err);
        }
        return res.render('displays/browse.pug', result);
    });
});

// Checked
router.get('/gifs/:fname', function(req, res, next) {
    var data = _.merge(req.params, req.body);
    data.user = req.user;

    Display.displayGif(data, function(err, result) {
        if (err) {
            res.status(404).end();
        } else {
            res.end(result, 'binary');
        }
    });
});
// NOT CHECKED
router.get('/gifs/:fname/:frame', function(req, res, next) {
    var data = _.merge(req.params, req.body);
    data.user = req.user;

    Display.displayGif(data, function(err, result) {
        if (err) {
            res.status(404).end();
        } else {
            res.end(result, 'binary');
        }
    });
});


// NOT CHECKED
router.get('/listassets', function (req, res, next) {
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    Display.listAssets(data, function (err, result) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, result);
    });
});
//router.get('/import', controllers.import.index);
//router.get('/test', controllers.import.start);
//router.get('/test2', controllers.import.test2);
//router.post('/import', controllers.import.start);
// router.get('/displays/plot', controllers.displays.plot);
// router.get('/displays/plot64', controllers.displays.plot64);
// router.get('/console', controllers.console.index);

module.exports = router;
