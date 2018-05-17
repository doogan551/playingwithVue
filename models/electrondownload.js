const fs = require('fs');
const Common = require('./common');

module.exports = class ElectronDownload extends Common {
    getFiles(cb) {
        const dir = `${__dirname}/../electron-dist`;
        fs.readdir(dir, (err1, files) => {
            fs.readFile(`${dir}/latest.yml`, 'utf8', (err2, latestData) => {
                return cb(err1 || err2, {
                    files,
                    latestData
                });
            });
        });
    }
};
