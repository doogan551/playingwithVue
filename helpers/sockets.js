var state = {
    io: null,
    tcp: null,
    oplog: null
};

var _app = null;

exports.connect = function(config, sessionStore, cookieParser, done) {
    var socketConfig = config.get('Infoscan.socketConfig');
    var dbConfig = config.get('Infoscan.dbConfig');
    var oplogString = dbConfig.driver + '://' + dbConfig.host + '/' + socketConfig.oplogDb;

    // if (!!state.socket) return done();
    var passportSocketIo = require('passport.socketio');
    state.io = require('socket.io').listen(socketConfig.ioPort);
    console.log('socket listening on port', socketConfig.ioPort);
    state.tcp = require('net').createServer().listen(socketConfig.tcpPort, socketConfig.tcpAddress);
    console.log('tcp server listening on ', socketConfig.tcpAddress + ":" + socketConfig.tcpPort);
    state.oplog = require('mongo-oplog')(oplogString, 'oplog.rs').tail();
    console.log('oplog connected to', oplogString);
    state.io.use(passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: 'express.sid',
        secret: 'lepanto', // the session_secret to parse the cookie
        store: sessionStore, // we NEED to use a sessionstore. no memorystore please
        fail: onAuthorizeFail, // *optional* callback on success - read more below
        success: onAuthorizeSuccess
    }));

    function onAuthorizeSuccess(data, accept) {
        console.log('successful connection to socket.io');
        accept();
    }

    function onAuthorizeFail(data, message, error, accept) {
        console.log('failed connection to socket.io:', data, message);
        if (error)
            accept(new Error(message));
    }
    done();
};

exports.get = function() {
    return state;
};