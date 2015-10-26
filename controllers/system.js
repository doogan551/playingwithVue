var express = require('express');
var router = express.Router();
var _ = require('lodash');
var System = require('../models/system');
var utils = require('../helpers/utils');

router.get('/controlpriorities', function(req, res, next) {
  System.getSystemInfoByName('Control Priorities', function(err, priorities) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, priorities);
    }
  });
});

router.get('/qualitycodes', function(req, res, next) {
  System.getSystemInfoByName('Quality Codes', function(err, codes) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, codes);
    }
  });
});

router.get('/controllers', function(req, res, next) {
  System.getSystemInfoByName('Controllers', function(err, controllers) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, controllers);
    }
  });
});

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

router.post('/updatecontrolpriorities', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateControlPriorities('Control Priorities', function(err, priorities) {
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

router.post('/updatequalitycodes', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateQualityCodes('Control Priorities', function(err, priorities) {
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

router.post('/updatecontrollers', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateControllers('Control Priorities', function(err, priorities) {
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

router.post('/updatetelemetry', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateTelemetry('Control Priorities', function(err, priorities) {
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

router.get('/getStatus', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.getStatus('Control Priorities', function(err, status) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, status);
    }
  });
});

router.get('/getCustomColors', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.getCustomColors('Control Priorities', function(err, colors) {
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

  System.updateCustomColors('Control Priorities', function(err, priorities) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, {message:'success'});
    }
  });
});

router.get('/weather', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.weather('Control Priorities', function(err, weather) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    } else {
      return utils.sendResponse(res, weather);
    }
  });
});

router.post('/updateWeather', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  System.updateWeather('Control Priorities', function(err, priorities) {
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