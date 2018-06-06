const fs = require('fs');
const async = require('async');
const rimraf = require('rimraf');
const dirs = ['./scripts/', './tmp/', './logs/'];

module.exports = (cb) => {
    async.each(dirs, (dir, nextDir) => {
        fs.readdir(dir, (err, files) => {
            async.each(files, (file, nextFile) => {
                let filePath = dir + file;
                fs.stat(filePath, (err, stat) => {
                    if (stat.mtime.valueOf() < (Date.now() - (30 * 24 * 60 * 60 * 1000))) {
                        rimraf(filePath, nextFile);
                    } else {
                        return nextFile();
                    }
                });
            }, (err) => {
                nextDir();
            });
        });
    }, (err) => {
        console.error(err);
        cb();
    });
};
