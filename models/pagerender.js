let childProcess = require('child_process');

let PageRender = class PageRender {
    renderPage(url, path, cb) {
        childProcess.exec('phantomjs apps\\reportRunner.js ' + url + ' ' + path, (error) => {
            cb(error);
        });
    }
};
module.exports = PageRender;
