var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Utilities = require('../models/utilities');

router.post('/getutility', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Utilities.getUtility(data, function(err, result) {
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

router.post('/saveutility', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Utilities.saveUtility(data, function(err, result) {
		if (err) {
			return Utils.sendResponse(res, {
				err: err
			});
		} else {
			return Utils.sendResponse(res, {
				message: 'success'
			});
		}
	});
});

router.post('/uploadBackground', function(req, res, next) {
	var data = {
		files: req.files,
		user: req.user
	};

	Utilities.uploadBackground(data, function(err, result) {
		if (err) {
			return Utils.sendResponse(res, {
				err: err
			});
		} else {
			return Utils.sendResponse(res, {
				message: 'success'
			});
		}
	});
});

module.exports = router;