const childProcess = require('child_process');

const ChromePageRender = class ChromePageRender {
    renderPage(url, path, cb) {
        const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
        childProcess.exec(CHROME, ['--headless', '--disable-gpu', '--print-to-pdf', url], cb);
    }
};

module.exports = ChromePageRender;
