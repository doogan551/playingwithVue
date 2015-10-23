var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Devicetree = require('../models/devicetree');

router.get('/gettree', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Devicetree.getTree(data, function(err, result) {
		if (err) {
			return Utils.sendResponse(res, {
				err: err
			});
		} else {
			return Utils.sendResponse(res, result);
		}
	});
});

module.exports = router;