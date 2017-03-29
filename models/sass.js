const sass = require('node-sass');

const Sass = class Sass {
    renderSass(data, cb) {
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

module.exports = Sass;
