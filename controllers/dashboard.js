var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Utilities = require('../models/utilities');
// Checked
router.get('/', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Utilities.index(data, function(err, result) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		}else{
			res.render('dashboard/index.pug', result);
		}
	});
});
// NOT CHECKED
router.post('/getutility', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Utilities.getUtility(data, function(err, result) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				utility: utility
			});
		}
	});
});
// Checked
router.post('/saveutility', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Utilities.saveUtility(data, function(err, result) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				message: 'success'
			});
		}
	});
});
// Checked
router.post('/uploadBackground', function(req, res, next) {
	var data = {
		files: req.files,
		user: req.user
	};

	Utilities.uploadBackground(data, function(err, result) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				message: 'success'
			});
		}
	});
});
// Checked
router.post('/removeutility', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Utilities.removeUtility(data, function(err, result) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				message: 'success'
			});
		}
	});
});
// NOT CHECKED
router.get('/getmarkup', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;
    data.type = req.query.type;

	Utilities.getMarkup(data, function(result, err) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				markup: result
			});
		}
	});
});

module.exports = router;