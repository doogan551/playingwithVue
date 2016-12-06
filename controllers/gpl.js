var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var GPL = require('../models/gpl');
// Checked
router.get('/view/:upoint', function(req, res, next) {
	var upi = parseInt(req.params.upoint, 10),
		cbCount = 0,
		cbTotal = 1,
		complete = function() {
			cbCount++;
			console.log('completing', cbCount);
			if (cbCount === cbTotal) {
				res.render('gpl/index.pug');
			}
		},
		processGpl = function(data) {
			res.locals.upi = upi;
			res.locals.point = JSON.stringify(data.data || {
				msg: 'no results'
			});
			res.locals.references = JSON.stringify(data.pointdata);
			complete();
		};

	res.locals = {};

	GPL.getGplInfo({
		user: req.user,
		upi: upi
	}, processGpl);
});
// Checked
router.get('/edit/:upoint', function(req, res, next) {
	var upi = parseInt(req.params.upoint, 10),
		cbCount = 0,
		cbTotal = 1,
		complete = function() {
			cbCount++;
			console.log('completing', cbCount);
			if (cbCount === cbTotal) {
				res.render('gpl/index.pug');
			}
		},
		processGpl = function(data) {
			res.locals.upi = upi;
			res.locals.point = JSON.stringify(data.data || {
				msg: 'no results'
			});
			res.locals.references = JSON.stringify(data.pointdata);
			complete();
		};

	GPL.getGplInfo({
		user: req.user,
		upi: upi
	}, processGpl);
});
// NOT CHECKED
router.get('/getReferences/:upoint', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	GPL.getReferences(data, function(err, result) {
		if (err) {
			ret = err;
		} else {
			ret = result;
		}
		utils.sendResponse(res, ret);
	});
});

module.exports = router;