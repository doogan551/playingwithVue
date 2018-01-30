let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let Reports = require('../models/reports');

let reportMainCallback = function (res, err, locals) {
    if (err && locals.point) {  // only error out if can't find valid ID
        return utils.sendResponse(res, {
            err: err
        });
    }
    let pointType = (locals.reportType ? locals.reportType : 'Property');

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');

    if (!locals) {
        res.render('reports/reportErrorNotFound');
    } else {
        res.locals.point = JSON.stringify(locals.point);
        res.locals.scheduledConfig = JSON.stringify(locals.scheduledConfig);

        if (pointType) {
            switch (pointType) {
                case 'Property':
                case 'History':
                case 'Totalizer':
                    res.render('reports/index');
                    break;
                default:
                    res.render('reports/reportErrorNotFound');
                    break;
            }
        } else {
            res.render('reports/reportErrorNotFound');
        }
    }
};

let scheduledReportCallback = function (res, err, locals) {
    if (err) {
        return utils.sendResponse(res, {
            err: err
        });
    }
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    let pointType = (locals.reportType ? locals.reportType : 'Property');

    if (!locals) {
        res.render('reports/reportErrorNotFound');
    } else if (pointType) {
        res.locals.point = JSON.stringify(locals.point);
        res.locals.scheduledConfig = locals.scheduledConfig;
        res.locals.dataUrl = '/scheduleloader';
        switch (pointType) {
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
// POSTMAN
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
// CHECKED 2017-03-10
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

    reports.reportMain(data, function (err, locals) {
        reportMainCallback(res, err, locals);
    });
});
// NOT CHECKED
router.get('/view/:id', function (req, res, next) {
    const reports = new Reports();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    reports.reportMain(data, function (err, locals) {
        reportMainCallback(res, err, locals);
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

    reports.reportMain(data, function (err, locals) {
        scheduledReportCallback(res, err, locals);
    });
});

module.exports = router;
