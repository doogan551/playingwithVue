var express = require('express');
var router = express.Router();
var _ = require('lodash');
var History = require('../models/history');
var utils = require('../helpers/utils');

router.post('/getMeters', function(req, res, next) {
	History.getMeters('Control Priorities', function(err, priorities) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, priorities.Entries);
		}
	});
});

router.post('/getUsage', function(req, res, next) {
	History.getUsage('Control Priorities', function(err, priorities) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, priorities.Entries);
		}
	});
});

router.post('/getMissingMeters', function(req, res, next) {
	History.getMissingMeters('Control Priorities', function(err, priorities) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, priorities.Entries);
		}
	});
});

router.post('/editDatastore', function(req, res, next) {
	History.editDatastore('Control Priorities', function(err, priorities) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, priorities.Entries);
		}
	});
});

router.post('/importCSV', function(req, res, next) {
	History.importCSV('Control Priorities', function(err, priorities) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, priorities.Entries);
		}
	});
});

router.post('/exportCSV', function(req, res, next) {
	History.exportCSV('Control Priorities', function(err, priorities) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, priorities.Entries);
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
	History.uploadCSV('Control Priorities', function(err, priorities) {
		if (err) {
			return utils.sendResponse(res, {
				err: err
			});
		} else {
			return utils.sendResponse(res, priorities.Entries);
		}
	});
});

module.exports = router;