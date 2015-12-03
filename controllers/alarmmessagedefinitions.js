var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var AlarmMessageDefinitions = require('../models/alarmmessagedefinitions');
var logger = require('../helpers/logger')(module);

router.get('/', AlarmMessageDefinitions.get);
router.get('/module', AlarmMessageDefinitions.getModule);
router.get('/helperData', AlarmMessageDefinitions.helperData.get);

module.exports = router;