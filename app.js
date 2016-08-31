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
var fs = require('fs');
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

require('./helpers/passport')(passport); // pass passport for configuration

//if production, use dist folders
if (config.minifyFiles !== false) {
  //no need to test for existence of directories, it falls back to public/...
  logger.info('Using minified files');
  app.use('/js', express.static(__dirname + '/dist/public/js'));
  app.use('/css', express.static(__dirname + '/dist/public/css'));
}

app.use(express.static(__dirname + '/public'));

app.use(morgan(':remote-addr :method :url :status :res[content-length] :response-time', {
  'stream': loggerStream.stream
}));
app.use(cookieParser());

app.use(bodyParser.json({
  limit: 10000
}));
app.use(bodyParser.urlencoded({
  extended: true,
  parameterLimit: 4500
}));
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

app.engine('pug', require('pug').__express);
app.set('view engine', 'pug');

//if production, use dist folders
if (config.minifyFiles !== false) {
  try {
    var stat = fs.statSync(__dirname + '/dist/views/');
    if (stat.isDirectory()) {
      logger.info('Found prod directory, redirecting views');
      app.set('views', __dirname + '/dist/views');
    } else {
      logger.info('Prod view folder not found, skipping view redirect');
    }
  } catch (ex) {
    logger.info('Prod view folder not found, skipping view redirect');
  }
}


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

db.connect(connectionString.join(''), function(err) {
  require('./helpers/processes')(function(err) {
    logger.info('processes', err);
        require('./helpers/scheduler')(function(err) {
          logger.info('scheduler', err);
    require('./helpers/globals').setGlobals(function() {
      if (!!config.get('Infoscan.letsencrypt').enabled) {

        var lex = LEX.create({
          configDir: config.get('Infoscan.files').driveLetter + ':' + config.get('Infoscan.letsencrypt').directory,
          approveRegistration: function(hostname, cb) {
            cb(null, {
              domains: config.get('Infoscan').domains,
              email: 'rkendall@dorsett-tech.com', // 'user@example.com'
              agreeTos: true
            });
                },
                handleRenewFailure: function(err, hostname, certInfo) {
                  logger.error("ERROR: Failed to renew domain '", hostname, "':");
                  if (err) {
                    logger.error(err.stack || err);
                  }
                  if (certInfo) {
                    logger.error(certInfo);
                  }
          }
        });

        http.createServer(LEX.createAcmeResponder(lex, function redirectHttps(req, res) {
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
    });
  });
});

process.on('uncaughtException', function(err) {

  var mailer = require('./models/mailer');
  mailer.sendError(err.stack);
  setTimeout(function() {
    process.exit(1);
  }, 5000);
});