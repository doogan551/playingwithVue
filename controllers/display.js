var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Display = require('../models/display');

router.post('/getDisplayInfo', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.getDisplayInfo(data, function(err, utility) {
		if (err) {
			return Utils.sendResponse(res, {
				err: err
			});
		} else {
			return Utils.sendResponse(res, {
				utility: utility
			});
		}
	});
});
app.get('/edit/:upoint', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.editDisplay(data, function(err, result) {
		if (err) {
			return Utils.sendResponse(res, {
				err: err
			});
		} else {
			res.render('displays/edit.jade', {
				upi: req.params.upoint,
				displayJson: currDisp,
				upiNames: upiNames,
				versions: versions
			});
		}
	});
});
app.get('/gifs/:fname', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.displayGif(data, function(err, result) {

	});
});
app.get('/gifs/:fname/:frame', function(req, res, next) {
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
app.get('/view/:upoint', function(req, res, next) {
	res.render('displays/view.jade', {
		upi: req.params.upoint
	});
});
app.get('/preview/:upoint', function(req, res, next) {
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
app.get('/view/:upoint/:dispId', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.viewDisplay(data, function(err, result) {

	});
});
app.get('/upiname/:upi', function(req, res, next) {
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
app.post('/later', function(req, res, next) {
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
app.post('/publish', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Display.publish(data, function(err, result) {
		if (err) {
			return res.send(err);
		} else {
			return res.send(result);
		}
	});
});
app.get('/browse', function(req, res, next) {
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
app.get('/browse2', function(req, res, next) {
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
app.get('/listassets', function(req, res, next) {
	var data = _.merge(req.params, req.body, req.query);
	data.user = req.user;

	Display.listassets(data, function(err, result) {
		if (err) {
			return Utils.sendResponse(res, {
				err: err
			});
		} else {
			return Utils.sendResponse(res, result);
		}
	});
});
//app.get('/import', controllers.import.index);
//app.get('/test', controllers.import.start);
//app.get('/test2', controllers.import.test2);
//app.post('/import', controllers.import.start);
app.get('/trend', function(req, res, next) {
	var pars = req.query;
	res.render('displays/plot.jade',
		pars
	);
});