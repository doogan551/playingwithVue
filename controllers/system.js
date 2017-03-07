let express = require('express');
let router = express.Router();
let _ = require('lodash');
let System = require('../models/system');
let utils = require('../helpers/utils');

// Checked
router.get('/controlpriorities', function (req, res, next) {
    const system = new System();
    system.getSystemInfoByName('Control Priorities', function (err, priorities) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, priorities.Entries);
    });
});
// Checked
router.get('/qualitycodes', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.getQualityCodes(data, function (err, codes) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, codes);
    });
});
// Checked
router.get('/controllers', function (req, res, next) {
    const system = new System();
    system.getSystemInfoByName('Controllers', function (err, controllers) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, controllers.Entries);
    });
});
// NOT CHECKED
router.get('/getcounts/:type', function (req, res, next) {
    const system = new System();
    let type = req.params.type;

    system.getCounts(type, function (err, count) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, count);
    });
});
// Checked
router.post('/updatecontrolpriorities', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.updateControlPriorities(data, function (err, priorities) {
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
router.post('/updatequalitycodes', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.updateQualityCodes(data, function (err, priorities) {
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
router.post('/updatecontrollers', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.updateControllers(data, function (err, priorities) {
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
router.get('/telemetry', function (req, res, next) {
    const system = new System();
    system.getSystemInfoByName('Preferences', function (err, telemetry) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, telemetry);
    });
});
// Checked
router.post('/updatetelemetry', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.updateTelemetry(data, function (err, priorities) {
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
router.get('/getStatus', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.getStatus(data, function (err, status) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, status);
    });
});
// Checked
router.get('/getCustomColors', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.getCustomColors(data, function (err, colors) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, colors);
    });
});

router.post('/updateCustomColors', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.updateCustomColors(data, function (err, result) {
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

router.get('/getAlarmTemplates', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.getAlarmTemplates(data, function (err, alarmTemplates) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, alarmTemplates);
    });
});

router.post('/updateAlarmTemplate', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.updateAlarmTemplate(data, function (err, result) {
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

router.post('/deleteAlarmTemplate', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.deleteAlarmTemplate(data, function (err, result) {
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
router.get('/weather', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.weather(function (err, weather) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, weather);
    });
});
// Checked
router.post('/updateWeather', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);

    system.updateWeather(data, function (err, result) {
        if (err) {
            return utils.sendResponse(res, {
                err: err.message
            });
        }
        return utils.sendResponse(res, {
            message: 'success'
        });
    });
});
// Checked
router.get('/versions', function (req, res, next) {
    const system = new System();
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    system.getVersions(data, function (err, versions) {
        if (err) {
            return utils.sendResponse(res, {
                err: err
            });
        }
        return utils.sendResponse(res, versions);
    });
});

module.exports = router;
