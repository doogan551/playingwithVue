var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var AlarmMessageDefinitions = require('../models/alarmmessagedefinitions');
var logger = require('../helpers/logger')(module);

router.all('/', AlarmMessageDefinitions.api.all);
router.get('/', AlarmMessageDefinitions.api.get);
router.post('/', AlarmMessageDefinitions.api.post);
router.put('/', AlarmMessageDefinitions.api.put);
router.delete('/:id', AlarmMessageDefinitions.api.delete);
router.get('/:id', AlarmMessageDefinitions.api.getbyid);

module.exports = router;