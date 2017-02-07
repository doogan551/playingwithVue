let sass = require('node-sass');

module.exports = {
    renderSass: function (data, cb) {
        let dir = data.dir,
            dirs = dir.split('-').join('/'),
            filename = data.filename,
            base = __dirname + '/../sass/' + dirs + '/',
            sassPath = base + filename + '.scss';

        sass.render({
            file: sassPath
        }, cb);
    }
};
