var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Policies = require('../models/policies');
var utils = require('../helpers/utils.js');
var ObjectID = require('mongodb').ObjectID;

// NEW
router.get('/get', function(req, res) {
  var data = _.merge(req.params, req.body);
  data.user = req.user;

  Policies.get(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

// NEW
router.post('/delete', function(req, res) {
  var data = _.merge(req.params, req.body);

  data._id = new ObjectID(data._id);

  Policies.delete(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, points);
  });
});

// NEW
router.post('/save', function(req, res) {
  var data = _.merge(req.params, req.body);
  var newID;
  var convertStrings = function (obj) {
    var key,
      prop,
      type,
      c,
      propsToRemove = {
        // 'xp:Value': true
      },
      matrix = {
        object: function (o) {
          return convertStrings(o);
        },
        string: function (o) {
          var ret;

          if (!o.match(/[^\d.]/g)) { //no characters, must be number
            if (o.indexOf('.') > -1) {
              ret = parseFloat(o);
            } else {
              ret = parseInt(o, 10);
            }
          } else {
            ret = o;
          }

          return ret;
        },
        array: function (o) {
          var arr = [];
          for (c = 0; c < o.length; c++) {
            arr[c] = convertStrings(o[c]);
          }
          return arr;
        }
      };

    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        prop = obj[key];
        type = typeof prop;
        if (type === 'object') {
          if (Array.isArray(prop)) {
            type = 'array';
          }
        }
        if (matrix[type]) {
          obj[key] = matrix[type](prop);
        }
      }
    }
    return obj;
  };

  data = convertStrings(data);
  if (data._new === true) {//typeof data._id === 'string' && data._id.length === 24) {
    //new policy
    delete data._new;
    newID = new ObjectID();
    data._id = newID;
    // data.threads = [];
    // data.members = data.members || [];
    // data.memberGroups = data.memberGroups || [];
    // data.alertConfigs = data.alertConfigs || [];
    // data.scheduleLayers = data.scheduleLayers || [];
  } else {
    newID = new ObjectID(data._id);
    data._id = newID;
  }



  Policies.save(data, function(err, points) {
    if (err) return utils.sendResponse(res, {
      err: err
    });
    return utils.sendResponse(res, {
        points: points,
        id: newID.toString()
    });
  });
});

module.exports = router;