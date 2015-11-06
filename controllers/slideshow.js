var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Slideshow = require('../models/slideshow');
// NOT CHECKED
router.post('/get/:id', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Slideshow.get(data, function(err, ss) {
		if (err) return utils.sendResponse(res, {
			err: err
		});

		return utils.sendResponse(res, {
			slideshow: ss
		});
	});
});

module.exports = router;