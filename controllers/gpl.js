var express = require('express');
var router = express.Router();
var utils = require('../helpers/utils.js');
var GPL = require('../models/gpl');

router.get('/view/:upoint', function(req, res, next) {
	var upi = parseInt(req.params.upoint, 10),
		cbCount = 0,
		cbTotal = 1,
		complete = function() {
			cbCount++;
			console.log('completing', cbCount);
			if (cbCount === cbTotal) {
				res.render('gpl/index.jade');
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

	GPL.getGplInfo(upi, processGpl);
});

router.get('/edit/:upoint', function(req, res, next) {
	var upi = parseInt(req.params.upoint, 10),
		cbCount = 0,
		cbTotal = 1,
		complete = function() {
			cbCount++;
			console.log('completing', cbCount);
			if (cbCount === cbTotal) {
				res.render('gpl/index.jade');
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

	GPL.getGplInfo(upi, processGpl);
});

router.get('/getReferences/:upoint', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	GPL.getReferences(data, function(err, result){
		if (err) {
			ret = err;
		} else {
			ret = result;
		}
		Utils.sendResponse(res, ret);
	});
});