require('./helpers/checkDirectories');
process.setMaxListeners(0);

let logger = require('./helpers/logger')(module);
logger.info('NODE_ENV:' + process.env.NODE_ENV);
let express = require('express');
let app = express();
let LEX = require('letsencrypt-express');
let http = require('http');
let https = require('https');
let fs = require('fs');
let db = require('./helpers/db');
let sockets = require('./helpers/sockets');
let config = require('config');
let passport = require('passport');
let morgan = require('morgan');
let loggerStream = require('./helpers/loggerStream');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let multer = require('multer');
let session = require('express-session');
let favicon = require('serve-favicon');
let RedisStore = require('connect-redis')(session);
let dbConfig = config.get('Infoscan.dbConfig');
let connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];
app.use(favicon(__dirname + '/public/favicon.ico'));

let _controllers = require('./helpers/controllers')(app, {});
let sessionStore = new RedisStore(config.get('redisConfig'));

// pass passport for configuration
require('./helpers/passport')(passport);

//if production, use dist folders
if (config.minifyFiles !== false) {
    //no need to test for existence of directories, it falls back to public/...
    logger.info('Using minified files');
    app.use('/js', express.static(__dirname + '/dist/public/js'));
    app.use('/css', express.static(__dirname + '/dist/public/css'));
}

app.use(express.static(__dirname + '/public'));

app.use(morgan(':remote-addr :method :url :status :res[content-length] :response-time', {
    stream: loggerStream.stream
}));
app.use(cookieParser());

app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: true,
    parameterLimit: 45000
}));
// var storage = multer.memoryStorage();
// var upload = multer({
//   storage: storage
// });

// app.use(upload.array());

app.engine('pug', require('pug').__express);
app.set('view engine', 'pug');

//if production, use dist folders
if (config.minifyFiles !== false) {
    try {
        let stat = fs.statSync(__dirname + '/dist/views/');
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
        // not working as intended
        maxAge: null
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', require('./helpers/router')(_controllers));

db.connect(connectionString.join(''), function (err) {
    logger.info('db.connect', err);
    require('./helpers/processes')(function (err2) {
        logger.info('processes', err2);
        require('./helpers/globals').setGlobals(function () {
            require('./helpers/scheduler').buildAll(function (err3) {
                logger.info('scheduler', err3);

                if (!!config.get('Infoscan.letsencrypt').enabled) {
                    let lex = LEX.create({
                        configDir: config.get('Infoscan.files').driveLetter + ':' + config.get('Infoscan.letsencrypt').directory,
                        approveRegistration: function (hostname, cb) {
                            cb(null, {
                                domains: config.get('Infoscan').domains,
                                email: 'rkendall@dorsett-tech.com',
                                agreeTos: true
                            });
                        },
                        handleRenewFailure: function (err4, hostname, certInfo) {
                            logger.error('ERROR: Failed to renew domain \'', hostname, '\':');
                            if (err4) {
                                logger.error(err4.stack || err4);
                            }
                            if (certInfo) {
                                logger.error(certInfo);
                            }
                        }
                    });

                    http.createServer(LEX.createAcmeResponder(lex, function redirectHttps(req, res) {
                        res.writeHead(301, {
                            Location: 'https://' + req.headers.host + req.url
                        });
                        res.end();
                    })).listen(80);

                    let httpsServer = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app));
                    sockets.connect(config, httpsServer, sessionStore, cookieParser, function () {
                        require('./socket/common').socket();
                        httpsServer.listen(443);
                    });
                } else {
                    let httpServer = http.createServer(app);
                    sockets.connect(config, httpServer, sessionStore, cookieParser, function () {
                        require('./socket/common').socket();
                        httpServer.listen(80);
                    });
                }
            });
        });
    });
});

let Mailer = new(require('./models/mailer'))();
process.on('uncaughtException', function (err) {
    Mailer.sendError(err.stack);
    setTimeout(function () {
        process.exit(1);
    }, 5000);
});
