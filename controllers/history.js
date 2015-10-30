var express = require('express');
var router = express.Router();
var _ = require('lodash');
var History = require('../models/history');
var utils = require('../helpers/utils');

router.post('/getMeters', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	History.getMeters(data, function(err, meters) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				meters: meters
			});
		}
	});
});

router.post('/getUsage', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	History.getUsage(data, function(err, results) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, results);
		}
	});
});

router.post('/getMissingMeters', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	History.getMissingMeters(data, function(err, results) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, results);
		}
	});
});

router.post('/editDatastore', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	History.editDatastore(data, function(err, result) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				message: 'success'
			});
		}
	});
});

router.post('/importCSV', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	History.importCSV(data, function(err, count) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				message: 'success',
				updatedCount: count
			});
		}
	});
});

router.post('/exportCSV', function(req, res, next) {
	var data = _.merge(req.params, req.body);
	data.user = req.user;

	History.exportCSV(data, function(err, path) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, {
				path: path
			});
		}
	});
});

router.get('/downloadCSV', function(req, res, next) {
	var path = req.query.path;
	var filename = path.split('\\');
	filename = filename[filename.length - 1].split('-')[0] + '-' + filename[filename.length - 1].split('-')[1] + '.csv';
	res.download(path, filename, function(err) {
		if (err) {} else {
			fs.unlinkSync(path);
		}
	});
});

router.post('/uploadCSV', function(req, res, next) {
	var files = req.files;

	History.uploadCSV(files, function(err, path) {
		if (err) {
			return utils.sendResponse(res, err);
		} else {
			return utils.sendResponse(res, {
				path: path
			});
		}
	});
});

module.exports = router;