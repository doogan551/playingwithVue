var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var ToolBag = require('../models/toolbag');

router.post('/toolbag/getPoints', function(req, res, next) {
	/*var data = _.merge(req.params, req.body);
	data.user = req.user;*/

	TrendData.getPoints(data, function(err, trends) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		}

		return utils.sendResponse(res, trends);
	});
});

router.post('/toolbag/generateCppHeaderFile', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	TrendData.generateCppHeaderFile(data, function(err, trends) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		}

		return utils.sendResponse(res, trends);
	});
});

router.get('/toolbag/downloadCppHeaderFile', function(req, res, next) {
	var filename = "enumsJSON.h";
	var filepath = "./logs/";

	res.download(filepath + filename, filename);
});

module.exports = router;