let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Reports = require('../models/reports');

let reportMainCallback = function (res, err, locals, result) {
    if (err) {
        return utils.sendResponse(res, {
            err: err
        });
    }
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');

    if (!locals) {
        res.render('reports/reportErrorNotFound');
    } else if (result['Report Type']) {
        res.locals = locals;
        switch (result['Report Type'].Value) {
            case 'Property':
            case 'History':
            case 'Totalizer':
                res.render('reports/index');
                break;
            default:
                res.render('reports/reportErrorNotFound');
                break;
        }
    }
};

let scheduledReportCallback = function (res, err, locals, result) {
    if (err) {
        return utils.sendResponse(res, {
            err: err
        });
    }
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');

    if (!locals) {
        res.render('reports/reportErrorNotFound');
    } else if (result['Report Type']) {
        res.locals = locals;
        res.locals.dataUrl = '/scheduleloader';
        switch (result['Report Type'].Value) {
            case 'Property':
            case 'History':
            case 'Totalizer':
                res.render('reports/scheduledReport');
                break;
            default:
                res.render('reports/reportErrorNotFound');
                break;
        }
    }
};

// NOT CHECKED
router.post('/saveSVG', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    reports.saveSVG(data, function (err, trends) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, trends);
    });
});
// NOT CHECKED
router.post('/saveReport', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    reports.saveReport(data, function (err, trends) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, trends);
    });
});
// NOT CHECKED
router.get('/getSVG/:id', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    reports.getSVG(data, function (err, trends) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, trends);
    });
});
// NOT CHECKED
router.post('/reportSearch', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    reports.reportSearch(data, function (err, trends) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, trends);
    });
});
// NOT CHECKED
router.post('/historyDataSearch', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    reports.historyDataSearch(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, results);
    });
});
// NOT CHECKED
router.post('/totalizerReport', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    reports.totalizerReport(data, function (err, trends) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, trends);
    });
});
// NOT CHECKED
router.get('/:id', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    reports.reportMain(data, function (err, locals, result) {
        reportMainCallback(res, err, locals, result);
    });
});
// NOT CHECKED
router.get('/view/:id', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    reports.reportMain(data, function (err, locals, result) {
        reportMainCallback(res, err, locals, result);
    });
});
// NOT CHECKED
router.get('/scheduled/:id', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;
    data.scheduled = true;
    data.scheduleID = req.query.scheduleID;
    data.scheduledIncludeChart = true; // this could be a passed param from scheduler

    reports.reportMain(data, function (err, locals, result) {
        scheduledReportCallback(res, err, locals, result);
    });
});

module.exports = router;
