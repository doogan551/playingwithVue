var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Display = require('../models/display');
// Checked
router.post('/getDisplayInfo', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.getDisplayInfo(data, function(err, info) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, info);
		}
	});
});
// Checked
router.get('/edit/:upoint', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.editDisplay(data, function(err, result) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			res.render('displays/edit.jade', result);
		}
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
// Checked
router.get('/view/:upoint', function(req, res, next) {
	res.render('displays/view.jade', {
		upi: req.params.upoint
	});
});
// NOT CHECKED
router.get('/preview/:upoint', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.previewDisplay(data, function(err, result) {
		if (err) {
			return res.send(err);
		} else {
			return res.render('displays/preview.jade', result);
		}
	});
});
// NOT CHECKED
router.get('/view/:upoint/:dispId', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.viewDisplay(data, function(err, result) {

	});
});
// NOT CHECKED
router.get('/upiname/:upi', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.getName(data, function(err, result) {
		if (err) {
			return res.send(err);
		} else {
			return res.send(result);
		}
	});
});
// Checked
router.post('/later', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.saveLater(data, function(err, result) {
		if (err) {
			return res.send(err);
		} else {
			return res.send(result);
		}
	});
});
// Checked
router.post('/publish', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;
	data.files = req.files;

	Display.publish(data, function(err, result) {
		if (err) {
			return res.send(err);
		} else {
			return res.send(result);
		}
	});
});
// NOT CHECKED
router.get('/browse', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.browse(data, function(err, result) {
		if (err) {
			return res.send(err);
		} else {
			return res.render('displays/browse.jade', result);
		}
	});
});
// NOT CHECKED
router.get('/browse2', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.browse2(data, function(err, result) {
		if (err) {
			return res.send(err);
		} else {
			return res.render('displays/browse2.jade', result);
		}
	});
});
// NOT CHECKED
router.get('/listassets', function(req, res, next) {
	var data = _.merge(req.params, req.body, req.query);
	data.user = req.user;

	Display.listAssets(data, function(err, result) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, result);
		}
	});
});
//router.get('/import', controllers.import.index);
//router.get('/test', controllers.import.start);
//router.get('/test2', controllers.import.test2);
//router.post('/import', controllers.import.start);
// NOT CHECKED
router.get('/trend', function(req, res, next) {
	var pars = req.query;
	res.render('displays/plot.jade',
		pars
	);
});
// router.get('/displays/plot', controllers.displays.plot);
// router.get('/displays/plot64', controllers.displays.plot64);
// router.get('/console', controllers.console.index);

module.exports = router;