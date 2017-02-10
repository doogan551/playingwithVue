let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let GPL = new(require('../models/gpl'))();

// Checked
router.get('/view/:upoint', function (req, res, next) {
    let upi = parseInt(req.params.upoint, 10),
        cbCount = 0,
        cbTotal = 1,
        completeWithError = function () {
            cbCount++;
            console.log('completing with Error', cbCount);
            if (cbCount === cbTotal) {
                res.render('gpl/sequenceNotFound.pug');
            }
        },
        complete = function () {
            cbCount++;
            console.log('completing', cbCount);
            if (cbCount === cbTotal) {
                res.render('gpl/index.pug');
            }
        },
        processGpl = function (err, data) {
            if (!!err) {
                completeWithError();
            } else {
                res.locals.upi = upi;
                res.locals.point = JSON.stringify(data.data || {
                    msg: 'no results'
                });
                res.locals.references = JSON.stringify(data.pointdata);
                complete();
            }
        };

    res.locals = {};

    GPL.getGplInfo({
        user: req.user,
        upi: upi
    }, processGpl);
});
// Checked
router.get('/edit/:upoint', function (req, res, next) {
    let upi = parseInt(req.params.upoint, 10),
        cbCount = 0,
        cbTotal = 1,
        completeWithError = function () {
            cbCount++;
            console.log('completing with Error', cbCount);
            if (cbCount === cbTotal) {
                res.render('gpl/sequenceNotFound.pug');
            }
        },
        complete = function () {
            cbCount++;
            console.log('completing', cbCount);
            if (cbCount === cbTotal) {
                res.render('gpl/index.pug');
            }
        },
        processGpl = function (err, data) {
            if (!!err) {
                completeWithError();
            } else {
                res.locals.upi = upi;
                res.locals.point = JSON.stringify(data.data || {
                    msg: 'no results'
                });
                res.locals.references = JSON.stringify(data.pointdata);
                complete();
            }
        };

    GPL.getGplInfo({
        user: req.user,
        upi: upi
    }, processGpl);
});
// NOT CHECKED
router.get('/getReferences/:upoint', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    let ret;
    data.user = req.user;

    GPL.getReferences(data, function (err, result) {
        if (err) {
            ret = err;
        } else {
            ret = result;
        }
        utils.sendResponse(res, ret);
    });
});

module.exports = router;
