var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Security = require('../models/security');


router.post('/users/getallusers', function (req, res, next) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Security.getAllUsers(data, function (err, users) {
    if (err) {
      return utils.sendResponse(res, {
        err: err
      });
    }

    return utils.sendResponse(res, {Users:users});
  });
});

module.exports = router;
