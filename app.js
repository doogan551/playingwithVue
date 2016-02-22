require('./helpers/checkDirectories');
var startTime = new Date();
process.setMaxListeners(0);

var logger = require('./helpers/logger')(module);
logger.info('NODE_ENV:' + process.env.NODE_ENV);
var express = require('express');
var app = express();
var LEX = require('letsencrypt-express');
var http = require('http');
var https = require('https');
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
console.log('NODE_CONFIG_DIR: ' + config.util.getEnv('NODE_CONFIG_DIR'));
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];
var port = config.get('Infoscan.siteConfig').port;
app.use(favicon(__dirname + '/public/favicon.ico'));

var _controllers = require('./helpers/controllers')(app, {});
var sessionStore = new RedisStore(config.get('redisConfig'));

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

      require('./helpers/globals').setGlobals(function() {
        console.log('----------', config.get('Infoscan.files').driveLetter);
        if (!!config.get('Infoscan.letsencrypt').enabled) {

          var lex = LEX.create({
            configDir: config.get('Infoscan.files').driveLetter + ':' + config.get('Infoscan.letsencrypt').directory,
            approveRegistration: function(hostname, cb) {
              cb(null, {
                domains: config.get('Infoscan.letsencrypt').domains,
                email: 'rkendall@dorsett-tech.com', // 'user@example.com'
                agreeTos: true
              });
            }
          });

          http.createServer(LEX.createAcmeResponder(lex, function redirectHttps(req, res) {
            console.log('request on 80', req.body);
            res.writeHead(301, {
              "Location": "https://" + req.headers['host'] + req.url
            });
            res.end();
          })).listen(80);

          var httpsServer = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app));
          sockets.connect(config, httpsServer, sessionStore, cookieParser, function() {
            require('./socket/common').socket();
            httpsServer.listen(443);
          });
        } else {
          var httpServer = http.createServer(app);
          sockets.connect(config, httpServer, sessionStore, cookieParser, function() {
            require('./socket/common').socket();
            httpServer.listen(80);
          });
        }

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