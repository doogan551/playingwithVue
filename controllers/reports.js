var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Reports = require('../models/reports');
var logger = require('../helpers/logger')(module);
// NOT CHECKED
router.get('/getMRT/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.getMRT(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.get('/reportSearch', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.reportSearch(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.post('/saveMRT', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.saveMRT(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.post('/saveSVG', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.saveSVG(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.post('/saveReport', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.saveReport(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.get('/getSVG/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.getSVG(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.post('/reportSearch', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.reportSearch(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.get('/getHistoryPoints', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.getHistoryPoints(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.post('/historyDataSearch', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.historyDataSearch(data, function(err, results) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, results);
  });
});
// NOT CHECKED
router.post('/historySearch', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.historySearch(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.post('/totalizerReport', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.totalizerReport(data, function(err, trends) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, trends);
  });
});
// NOT CHECKED
router.get('/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.reportMain(data, function(err, locals, result) {
    reportMainCallback(res, err, locals, result);
  });
});
// NOT CHECKED
router.get('/view/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.reportMain(data, function(err, locals, result) {
    reportMainCallback(res, err, locals, result);
  });
});
// NOT CHECKED
router.get('/scheduled/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;
  data.scheduled = true;

  Reports.reportMain(data, function(err, locals, result) {
    scheduledReportCallback(res, err, locals, result);
  });
});
// NOT CHECKED
router.get('/cr/pointInvolvement', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.pointInvolvement(data, function(err, locals) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    res.locals = locals;
    res.render('reports/cannedReports/pointInvolvement');
  });
});

var reportMainCallback = function(res, err, locals, result) {
  if (err) {
    return utils.sendResponse(res, {
      err: err
    });
  } else {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    if (!locals) {
      res.render("reports/reportErrorNotFound");
    } else {
      if (result["Report Type"]) {
        res.locals = locals;
        switch (result["Report Type"].Value) {
          case "Property":
            res.render('reports/index');
            break;
          case "History":
            res.render('reports/index');
            break;
          case "Totalizer":
            res.render('reports/index');
            break;
            //case "Point Involvement":
            //    res.render('reports/cannedReports/pointInvolvement');
            //    break;
          default:
            res.render("reports/reportErrorNotFound");
            break;
        }
      }
    }
  }
};

var scheduledReportCallback = function(res, err, locals, result) {
  if (err) {
    return utils.sendResponse(res, {
      err: err
    });
  } else {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    if (!locals) {
      res.render("reports/reportErrorNotFound");
    } else {
      if (result["Report Type"]) {
        res.locals = locals;
        res.locals.dataUrl = "/scheduleloader";
        switch (result["Report Type"].Value) {
          case "Property":
            res.render('reports/scheduledReport');
            break;
          case "History":
            res.render('reports/scheduledReport');
            break;
          case "Totalizer":
            res.render('reports/scheduledReport');
            break;
            //case "Point Involvement":
            //    res.render('reports/cannedReports/pointInvolvement');
            //    break;
          default:
            res.render("reports/reportErrorNotFound");
            break;
        }
      }
    }
  }
};

module.exports = router;