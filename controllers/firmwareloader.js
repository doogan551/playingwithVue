var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Firmware = require('../models/firmware');


router.get('/get/:model', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Firmware.getModelFiles(data, function(err, files) {
		if (err) return Utils.sendResponse(res, {
			err: err
		});

		return Utils.sendResponse(res, {
			files: files
		});
	});

});

router.get('/getRemoteUnits', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Firmware.getRemoteUnits(data, function(err, remoteUnits) {
		if (err) return Utils.sendResponse(res, {
			err: err
		});

		return Utils.sendResponse(res, {
			remoteUnits: remoteUnits
		});
	});
});