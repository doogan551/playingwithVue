
var childProcess = require('child_process');
module.exports = {
  renderPage: function(url, path, cb) {
    childProcess.exec('phantomjs apps\\reportRunner.js ' + url + ' ' + path, function(error, stdout, stderr) {
      cb(error);
    });
  }
};