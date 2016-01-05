var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Thumbnail = require('../models/thumbnails');
// NOT CHECKED
router.get('/batch', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Thumbnail.batch(data, function(err, localVars) {
		res.render("thumbnailGenerator/batch", localVars);
	});
});
// NOT CHECKED
router.get('/:id', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Thumbnail.one(data, function(err, localVars) {
		res.render("thumbnailGenerator/batch", localVars);
	});
});
// NOT CHECKED
router.post('/save', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	Thumbnail.save(data, function(err, localVars) {
		if (!err) {
			return utils.sendResponse(res, {
				"msg": "success",
				"result": localVars.thumbDir
			});
		} else {
			return utils.sendResponse(res, {
				"msg": "Error: " + err
			});
		}
	});
});

module.exports = router;