var state = {
    io: null,
    tcp: null,
    oplog: null
};

var _app = null;

exports.connect = function(sessionStore, cookieParser, done) {

    // if (!!state.socket) return done();
    var passportSocketIo = require('passport.socketio');
    state.io = require('socket.io').listen(8085);
    console.log('socket listening on port', 8085);
    state.tcp = require('net').createServer().listen(5002, "127.0.0.1");
    console.log('tcp server listening on ', "127.0.0.1:5002");
    state.oplog = require('mongo-oplog')('mongodb://localhost/local', 'oplog.rs').tail();
    console.log('oplog connected - need to get address from options');
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