var logger = require('./logger')(module);

var state = {
    io: null,
    tcp: null,
    oplog: null
};

var _app = null;

exports.connect = function(config, server, sessionStore, cookieParser, done) {
    var socketConfig = config.get('Infoscan.socketConfig');
    var dbConfig = config.get('Infoscan.dbConfig');
    var oplogString = dbConfig.driver + '://' + dbConfig.host + ':' + dbConfig.port + '/' + socketConfig.oplogDb;

    // if (!!state.socket) return done();
    var passportSocketIo = require('passport.socketio');
    state.io = require('socket.io')(server);
    logger.info('socket.io listening on port', socketConfig.ioPort);
    state.tcp = require('net').createServer().listen(socketConfig.tcpPort, socketConfig.tcpAddress);
    logger.info('tcp server listening on ', socketConfig.tcpAddress + ":" + socketConfig.tcpPort);
    state.oplog = require('mongo-oplog')(oplogString, {}).tail();
    logger.info('oplog connected to', oplogString);
    state.io.use(passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: 'express.sid',
        secret: 'lepanto', // the session_secret to parse the cookie
        store: sessionStore, // we NEED to use a sessionstore. no memorystore please
        fail: onAuthorizeFail, // *optional* callback on success - read more below
        success: onAuthorizeSuccess
    }));

    function onAuthorizeSuccess(data, accept) {
        accept();
    }

    function onAuthorizeFail(data, message, error, accept) {
        logger.error('failed authorization to socket.io:', message);
        if (error)
            accept(new Error(message));
    }
    done();
};

exports.get = function() {
    return state;
};