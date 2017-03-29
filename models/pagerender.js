const childProcess = require('child_process');

const PageRender = class PageRender {
    renderPage(url, path, cb) {
        childProcess.exec('phantomjs apps\\reportRunner.js ' + url + ' ' + path, (error) => {
            cb(error);
        });
    }
};
module.exports = PageRender;
