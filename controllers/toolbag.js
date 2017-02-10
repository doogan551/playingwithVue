let express = require('express');
let router = express.Router();
let _ = require('lodash');
let utils = require('../helpers/utils.js');
let ToolBag = new(require('../models/toolbag'))();
// Checked
router.post('/getPoints', function (req, res, next) {
    /*let data = _.merge(req.params, req.body);
    data.user = req.user;*/

    ToolBag.getPoints(req.body, function (err, trends) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, trends);
    });
});
// Checked
router.post('/generateCppHeaderFile', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    ToolBag.generateCppHeaderFile(data, function (err, trends) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, trends);
    });
});
// Checked
router.get('/downloadCppHeaderFile', function (req, res, next) {
    let filename = 'enumsJSON.h';
    let filepath = './logs/';

    res.download(filepath + filename, filename);
});
// Checked
router.get('/dbValidation', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    ToolBag.getTemplateNames(function (err, templateNames) {
        res.locals = {
            err: err,
            templateNames: templateNames || []
        };
        res.render('toolBag/dbValidation');
    });
});
// Checked
router.post('/validatePoints', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    ToolBag.validatePoints(data, function (err, validationProblems) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }

        return utils.sendResponse(res, {
            validationProblems: validationProblems
        });
    });
});

module.exports = router;
