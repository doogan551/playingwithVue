var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var ReportTemplate = require('../models/reporttemplates');

router.post('/get', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  ReportTemplate.getTemplate(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, result);
  });
});

router.post('/add', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  ReportTemplate.addTemplate(data, function(err, result) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, result[0]._id + "~" + name);
  });
});

router.post('/rename', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  ReportTemplate.renameTemplate(data, function(err, result) {
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

router.post('/delete', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  ReportTemplate.deleteTemplate(data, function(err, result) {
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

router.get('/getAll', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  ReportTemplate.getAllTemplates(data, function(err, results) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, results);
  });
});

router.post('/getSelected', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  ReportTemplate.getSelectedTemplates(data, function(err, results) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, results);
  });
});

router.post('/updateTemplate', function(req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  ReportTemplate.updateTemplate(data, function(err, result) {
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