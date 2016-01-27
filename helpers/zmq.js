var config = require('config');
var zmq = require('zmq');
var uuid = require('node-uuid');

var logger = require('./logger')(module);

var zmqConfig = config.get('Infoscan.zmqConfig');
var zmqString = zmqConfig.protocol + '://' + zmqConfig.server + ':' + zmqConfig.port;

module.exports.sendMessage = function(msg, callback) {
  var zmqConn = makeZMQConn('dealer', 'client', zmqString, 'connect');
  console.time('test');
  zmqConn.send(msg);

  zmqConn.on('message', function(data) {
      // logger.info(data.toString());
      data = JSON.parse(data.toString());
      if (data.hasOwnProperty('err') && data.err !== 0 && data.err !== null) {

        console.timeEnd('test');
        return callback(data.err, null);
      } else if (!data.DEBUG) {
        console.timeEnd('test');
        return callback(null, data);
      }
  });
};

function makeZMQConn(sockType, idPrefix, addr, bindSyncOrConnect) {
  var sock = zmq.socket(sockType);
  sock.identity = idPrefix + uuid.v4();
  // call the function name in bindSyncOrConnect
  sock[bindSyncOrConnect](addr);
  return sock;
}