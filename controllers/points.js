let express = require('express');
let router = express.Router();
let _ = require('lodash');
let Point = require('../models/point');
let utils = require('../helpers/utils.js');

// POSTMAN - broken?
router.post('/globalSearch', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body);
    data.user = req.user;
    console.log(data);
    point.globalSearch(data, function (err, points, count) {
        if (err) {
            return utils.sendResponse(res, {
                err: err,
                reqID: data.reqID
            });
        }
        return utils.sendResponse(res, {
            points: points,
            count: count,
            reqID: data.reqID
        });
    });
});

// POSTMAN
router.post('/getDistinctValues', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    point.getDistinctValuesTemp(data, function (err, distinctValues) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, distinctValues);
    });
});

// Checked
router.get('/newpoint', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.newPoint(data, function (err, locals) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        res.render('pointlookup/newPoint', locals);
    });
});
// NOT CHECKED - couldn't get context menu for clone to stay open
router.get('/newpoint/:id', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.newPoint(data, function (err, locals) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        res.render('pointlookup/newPoint', locals);
    });
});
// NOT CHECKED
router.get('/newpoint/restrictTo/:pointType', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.newPoint(data, function (err, locals) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        res.render('pointlookup/newPoint', locals);
    });
});
// POSTMAN
router.post('/search', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.search(data, function (err, points) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, points);
    });
});
// Checked
router.get('/searchdependencies/:upi', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.searchDependencies(data, function (err, result) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            Involvement: result
        });
    });
});
// POSTMAN
router.post('/getnames', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.getNames(data, function (err, results) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, results);
    });
});
// NOT CHECKED
router.post('/getpoint', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.getPoint(data, function (err, point) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, point);
    });
});
// POSTMAN
router.post('/initpoint', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.initPoint(data, function (err, point) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, point);
    });
});
// POSTMAN
router.get('/getpointref/small/:upi', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.getPointRefsSmall(data, function (err, message, point) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        if (message) {
            return utils.sendResponse(res, {
                message: message
            });
        }
        return utils.sendResponse(res, point);
    });
});
// POSTMAN
router.get('/getpointref/instance/:upi/:device', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.getPointRefsInstance(data, function (err, message, point) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        if (message) {
            return utils.sendResponse(res, {
                message: message
            });
        }
        return utils.sendResponse(res, point);
    });
});
// POSTMAN
router.post('/findalarmdisplays', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    let reqId = parseInt(data.reqID, 10);

    point.findAlarmDisplays(data, function (err, displays) {
        if (err) {
            return utils.sendResponse(res, {
                err: err,
                reqID: reqId
            });
        }
        return utils.sendResponse(res, {
            displays: displays,
            reqID: reqId
        });
    });
});
// POSTMAN
router.post('/getcontrols', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body, req.query);
    data.user = req.user;

    point.getControls(data, function (err, data) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, data);
    });
});
// POSTMAN
router.get('/:id', function (req, res) {
    const point = new Point();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    point.getPointById(data, function (err, message, point) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        if (message) {
            return utils.sendResponse(res, {
                message: message
            });
        }
        return utils.sendResponse(res, point);
    });
});

module.exports = router;
