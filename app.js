console.log(process.env.NODE_ENV);
var express = require('express');
var app = express();
var db = require('./helpers/db');
var sockets = require('./helpers/sockets');
var config = require('config');
var passport = require('passport');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var session = require('express-session');
var router = express.Router();
var errorHandler = require('errorhandler');
var RedisStore = require('connect-redis')(session);
var redis = require('redis');
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];
var port = config.get('Infoscan.siteConfig').port;
var _controllers = require('./config/controllers')(app, {});

var sessionStore = new RedisStore(config.get('redisConfig'));

require('./config/passport')(passport); // pass passport for configuration

app.use(express.static(__dirname + '/public'));
app.use(morgan(':date[iso] :method :url :status :res[content-length] :response-time'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(multer({
  inMemory: true
}));

if (process.env.NODE_ENV !== 'rob') {
  app.use(errorHandler({
    log: true
  }));
}

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

//app.use(require('./middlewares/users'));
app.use('/', require('./config/router')(router, _controllers));

process.on('uncaughtException', function (err) {
  console.log('Threw exception', err, err.stack);
});


db.connect(connectionString.join(''), function (err) {
  if (err) {
    console.log('unable to connect');
    process.exit(1);
  } else {

    sockets.connect(sessionStore, cookieParser, function () {
      require('./socket/common').socket();
      app.listen(port, function () {
        console.log('listening on port', port);
      });
    });
  }
});
