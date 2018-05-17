let express = require('express');
let router = express.Router();
let _ = require('lodash');
const async = require('async');
let passport = require('passport');
let utils = require('../helpers/utils');
let Workspace = new(require('../models/workspace'))();
let ActivityLog = require('../models/activitylog');
let System = require('../models/system');
let actLogsEnums = require('../public/js/lib/config').Enums['Activity Logs'];
let logger = require('../helpers/logger')(module);
// Checked
router.get('/', function (req, res) {
    let _user = req.user;
    const system = new System();

    if (!_user) {
        _user = {};
    }

    async.parallel({
        controlpriorities(pcb) {
            system.getSystemInfoByName('Control Priorities', (err, priorities)  => {
                pcb(null, priorities.Entries);
            });
        },
        qualityCodes(pcb) {
            system.getQualityCodes({}, (err, codes) => {
                pcb(null, codes);
            });
        },
        controllers(pcb) {
            system.getSystemInfoByName('Controllers', (err, controllers) => {
                pcb(null, controllers.Entries);
            });
        },
        telemetry(pcb) {
            system.getSystemInfoByName('Preferences', (err, telemetry) => {
                pcb(null, telemetry);
            });
        }
    }, (err, results) => {
        let ret = {
            title: 'You are home',
            user: JSON.stringify(_user),

            isAuthenticated: req.isAuthenticated(),

            systemEnums: JSON.stringify(results)
        };

        res.render('baseui/home', ret);
    });
});
// NOT CHECKED
router.get('/home', function (req, res) {
    let _user = req.user;

    if (!_user) {
        _user = {};
    }

    res.render('baseui/home', {
        title: 'You are home',
        user: JSON.stringify(_user),
        isAuthenticated: req.isAuthenticated()
    });
});
// NOT CHECKED
router.get('/login', function (req, res) {
    req.logout();
    res.render('baseui/login');
});
// Checked
router.post('/authenticate', function (req, res, next) {
    const activityLog = new ActivityLog();
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        } else if (info) {
            return res.json(info);
        }

        req.logIn(user, function (err2) {
            if (err2) {
                return next(err2);
            }
            let logData = {
                user: user,
                timestamp: Date.now(),
                activity: 'User Logon',
                log: 'User Logged In.'
            };
            activityLog.create(logData, function () {});
            return res.json(user);
        });
    })(req, res, next);
});
// NOT CHECKED
router.post('/saveworkspace', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Workspace.saveWorkspace(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            message: 'success'
        });
    });
});
// NOT CHECKED
router.post('/lost-password', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    return utils.sendResponse(res, {
        err: 'Route not implemented.'
    });
});
// NOT CHECKED
router.post('/reset-password', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;
    logger.info('reset password');
    Workspace.resetPassword(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            message: 'success'
        });
    });
});
// NOT CHECKED
router.post('/lost-password', function (req, res) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Workspace.resetPassword(data, function (err) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, {
            message: 'success'
        });
    });
});
// Checked
router.get('/logout', function (req, res) {
    const activityLog = new ActivityLog();
    let user = req.user;
    req.logout();

    let logData = {
        user: user,
        timestamp: Date.now(),
        activity: 'User Logoff',
        log: 'User Logged Out.'
    };
    activityLog.create(logData, function () {});
    res.redirect('/');
});

module.exports = router;
