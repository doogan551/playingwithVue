var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Devicetree = require('../models/devicetree');
// Checked
router.get('/gettree', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Devicetree.getTree(function(err, result) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, result);
		}
	});
});

module.exports = router;