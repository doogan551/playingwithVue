var express = require('express');
var router = express.Router();
var _ = require('lodash');
var utils = require('../helpers/utils.js');
var Sass = require('../models/sass');
// var logger = require('../helpers/logger')(module);

// Checked
router.get('/:dir/:filename', function(req, res, next) {
    var data = _.merge(req.params, req.body);
    data.user = req.user;

    console.log('Rendering sass');

    Sass.renderSass(data, function(err, result) {
        if (err) {
            console.log('Error rendering sass:', err);
            return res.end(JSON.stringify(err, null, 3));//change in prod
        }
        res.header('Content-type', 'text/css');
        return res.end(result.css);
    });
});


module.exports = router;