var async = require('async');
var _ = require('lodash');

var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

var validPortProtocols = [1, 4];
var validEthProtocols = [1];

var sortArray = function(a, b) {
    return a - b;
};
var compare = function(a, b) {
    if (a.networkSegment < b.networkSegment)
        return -1;
    if (a.networkSegment > b.networkSegment)
        return 1;
    return 0;
};

module.exports = {
    getTree: function(cb) {
    }
};