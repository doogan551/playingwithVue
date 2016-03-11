var childprocess = require('child_process');

var async = require('async');
var logger = require('./logger')(module);
var config = require('config');
var processes = config.get('Infoscan').processes;
var locations = [];

for (var proc in processes) {
  locations.push(processes[proc]);
}


module.exports = function(cb) {

  async.each(locations, function(process, callback) {
    var child = childprocess.execFile(process, function(error, stdout, stderr) {
      if (error) {
        logger.info(process, error);
      }
      logger.info(process, stdout);
    });

    child.stdout.on('error', function(data) {
      logger.info(process, 'error: ' + data);
    });
    child.stdout.on('data', function(data) {
      logger.info(process, 'data: ' + data);
    });
    child.stderr.on('data', function(data) {
      logger.info(process, 'err: ' + data);
    });
    callback();
  }, cb);

};