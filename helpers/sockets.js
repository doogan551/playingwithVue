var state = {
  io: null,
  tcp: null,
  oplog: null
};

var _app = null;

exports.connect = function (done) {
  // if (!!state.socket) return done();
  state.io = require('socket.io').listen(8085);
  state.tcp = require('net').createServer().listen(5002, "127.0.0.1");
  state.oplog = require('mongo-oplog')('mongodb://localhost/local', 'oplog.rs').tail();
  done();
};

exports.get = function () {
  return state;
};
