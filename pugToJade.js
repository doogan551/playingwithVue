var fs = require('fs'),
    path = require('path');

function walk(rootdir, callback, subdir) {
    var abspath = subdir ? path.join(rootdir, subdir) : rootdir;
    fs.readdirSync(abspath).forEach(function (filename) {
        var filepath = path.join(abspath, filename);
        if (fs.statSync(filepath).isDirectory()) {
            walk(rootdir, callback, path.join(subdir || '', filename || ''));
        } else {
            callback(filepath, rootdir, subdir, filename);
        }
    });
};

walk('./views', function (filepath, rootdir, subdir, filename) {
    fs.renameSync(filepath, filepath.replace('jade', 'pug'));
    console.log('renamed', filepath);
});
