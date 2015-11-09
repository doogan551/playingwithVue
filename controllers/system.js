var express = require('express');
var router = express.Router();
var _ = require('lodash');
var System = require('../models/system');
var utils = require('../helpers/utils');
// Checked
router.get('/controlpriorities', function(req, res, next) {
  System.getSystemInfoByName('Control Priorities', function(err, priorities) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, priorities.Entries);
    }
  });
});
// Checked
router.get('/qualitycodes', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.getQualityCodes(data, function(err, codes) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, codes);
    }
  });
});
// Checked
router.get('/controllers', function(req, res, next) {
  System.getSystemInfoByName('Controllers', function(err, controllers) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, controllers.Entries);
    }
  });
});
// NOT CHECKED
router.get('/getcounts/:type', function(req, res, next) {
  var type = req.params.type;

  System.getCounts(type, function(err, count) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, count);
    }
  });
});
// Checked
router.post('/updatecontrolpriorities', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateControlPriorities(data, function(err, priorities) {
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
// Checked
router.post('/updatequalitycodes', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateQualityCodes(data, function(err, priorities) {
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
// Checked
router.post('/updatecontrollers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateControllers(data, function(err, priorities) {
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
// Checked
router.get('/telemetry', function(req, res, next) {
  System.getSystemInfoByName('Preferences', function(err, telemetry) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, telemetry);
    }
  });
});
// Checked
router.post('/updatetelemetry', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateTelemetry(data, function(err, priorities) {
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
// NOT CHECKED
router.get('/getStatus', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.getStatus(data, function(err, status) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, status);
    }
  });
});
// Checked
router.get('/getCustomColors', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.getCustomColors(data, function(err, colors) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, colors);
    }
  });
});

router.post('/updateCustomColors', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateCustomColors(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, {message:'success'});
    }
  });
});
// Checked
router.get('/weather', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.weather(function(err, weather) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, weather);
    }
  });
});
// Checked
router.post('/updateWeather', function(req, res, next) {
  var data = _.merge(req.params, req.body);

  System.updateWeather(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err.message
      });
    } else {
      return utils.sendResponse(res, {message:'success'});
    }
  });
});

module.exports = router;