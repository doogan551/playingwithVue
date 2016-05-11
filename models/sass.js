var sass = require('node-sass');
var Utility = require('../models/utility');
// var logger = require('../helpers/logger')(module);

module.exports = {
    renderSass: function (data, cb) {
         var dir = data.dir,
            dirs = dir.split('-').join('/'),
            filename = data.filename,
            base = __dirname + '/../sass/' + dirs + '/',
            sassPath = base + filename + '.scss';

        console.log('rendering sass');

        sass.render({
            file: sassPath
        }, cb);
    }
};
