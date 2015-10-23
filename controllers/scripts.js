var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Scripts = require('../models/scripts');

router.post('/api/scripts/updatescript', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Scripts.update(data, function(err, data) {
		if (data.length > 0)
			return res.json({
				err: data.toString().replace(re, '')
			});
		return res.json({
			path: path
		});
	});
});

router.post('/api/scripts/commitscript', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Scripts.commit(data, function(err, script) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				point: script
			});
		}
	});
});

router.post('/api/scripts/readscript', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Scripts.read(data, function(err, point) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				script: point["Script Source File"],
				fileName: point["Script Filename"]
			});
		}
	});
});

module.exports = router;