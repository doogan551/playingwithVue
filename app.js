require('./helpers/checkDirectories');
var startTime = new Date();
process.setMaxListeners(0);

var logger = require('./helpers/logger')(module);
logger.info('NODE_ENV:' + process.env.NODE_ENV);
var express = require('express');
var app = express();
var lex = require('letsencrypt');
var db = require('./helpers/db');
var sockets = require('./helpers/sockets');
var config = require('config');
var passport = require('passport');
var morgan = require('morgan');
var loggerStream = require("./helpers/loggerStream");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var session = require('express-session');
var router = express.Router();
var errorHandler = require('errorhandler');
var favicon = require('serve-favicon');
var RedisStore = require('connect-redis')(session);
var redis = require('redis');
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];
var port = config.get('Infoscan.siteConfig').port;
app.use(favicon(__dirname + '/public/favicon.ico'));

var _controllers = require('./helpers/controllers')(app, {});
var sessionStore = new RedisStore(config.get('redisConfig'));

var lexConfig = {
  server: lex.stagingServerUrl, // or LE.productionServerUrl

  configDir: './lib/letsencrypt.config', // or /etc/letsencrypt or wherever

  privkeyPath: ':config/live/:hostname/privkey.pem', //
  fullchainPath: ':config/live/:hostname/fullchain.pem', // Note: both that :config and :hostname
  certPath: ':config/live/:hostname/cert.pem', //       will be templated as expected
  chainPath: ':config/live/:hostname/chain.pem', //

  debug: false
};


var handlers = {
  _challenges: {},
  setChallenge: function(opts, hostname, key, val, cb) {
    console.log(1, opts, hostname, key, val);
    handlers._challenges[key] = val;
    return cb(null);
  }, // called during the ACME server handshake, before validation

  removeChallenge: function(opts, hostname, key, cb) {
    console.log(2, opts, hostname, key);
    delete handlers._challenges[key];
    return cb(null);
  }, // called after validation on both success and failure

  getChallenge: function(opts, hostname, key, cb) {
    console.log(3, opts, hostname, key);
    return cb(null, handlers._challenges[key]);
  }, // this is special because it is called by the webserver
  // (see letsencrypt-cli/bin & letsencrypt-express/standalone),
  // not by the library itself


  agreeToTerms: function(tosUrl, cb) {
    console.log('4');
    return cb(null, true);
  } // gives you an async way to expose the legal agreement
    // (terms of use) to your users before accepting
};

require('./helpers/passport')(passport); // pass passport for configuration

app.use(express.static(__dirname + '/public'));
app.use(morgan(':remote-addr :method :url :status :res[content-length] :response-time', {
  'stream': loggerStream.stream
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(multer({
  inMemory: true
}));

app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

app.use(session({
  key: 'express.sid',
  secret: 'lepanto',
  resave: true,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: null // not working as intended
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', require('./helpers/router')(_controllers));

require('./helpers/mongooseconn.js')(function() {
  db.connect(connectionString.join(''), function(err) {
    if (err) {
      logger.error('unable to connect');
      process.exit(1);
    } else {
      logger.info('mongo connected to', connectionString.join(''));
      sockets.connect(config, sessionStore, cookieParser, function() {
        require('./socket/common').socket();
        var le = lex.create(lexConfig, handlers);
        le.register({
          domains: ['infoscanweb.com'],
          email: 'rkendall@dorsett-tech.com',
          agreeTos: false
        }, function(err) {
          if (err) {
            // Note: you must have a webserver running
            // and expose handlers.getChallenge to it
            // in order to pass validation
            // See letsencrypt-cli and or letsencrypt-express
            console.error('[Error]: node-letsencrypt/examples/standalone');
            console.error(err.stack);
          } else {
            console.log('success');
          }
          logger.info('server started in', (new Date() - startTime) / 1000, 'seconds');
        });
      });
    }
  });
});

process.on('uncaughtException', function(err) {

  var mailer = require('./models/mailer');
  mailer.sendError(err.stack);
  setTimeout(function() {
    process.exit(1);
  }, 5000);
});