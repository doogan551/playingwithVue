var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Reports = require('../models/reports');

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

router.get('/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.reportMain(data, reportMainCallback);
});

router.get('/view/:id', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Reports.reportMain(data, reportMainCallback);
});

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

var reportMainCallback = function(err, locals) {
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
            res.render('reports/history');
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