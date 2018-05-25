let express = require('express');
let router = express.Router();
let _ = require('lodash');
let Sass = new(require('../models/sass'))();
// let logger = require('../helpers/logger')(module);

// Checked
router.get('/:dir/:filename', function (req, res, next) {
    let data = _.merge(req.params, req.body);
    data.user = req.user;

    Sass.renderSass(data, function (err, result) {
        if (err) {
            console.log('Error rendering sass:', err);
            return res.end(JSON.stringify(err, null, 3));//change in prod
        }
        res.header('Content-type', 'text/css');
        return res.end(result.css);
    });
});


module.exports = router;
