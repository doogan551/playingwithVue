var express = require('express');
var app = express();
var LEX = require('letsencrypt-express');
var http = require('http');
var https = require('https');
var config = require('config');

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
    res.writeHead(301, {
      "Location": "https://" + req.headers['host'] + req.url
    });
    res.end();
  })).listen(80);

  var httpsServer = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app));
  app.all('*', function(req, res) {
    res.status(503).send('Infoscan is down for maintenance.').end();
    if (!!req.xhr) {
      // res.status(503);
    } else {}
  });
  httpsServer.listen(443);
} else {
  var httpServer = http.createServer(app);
  app.all('*', function(req, res) {
    res.status(503).send('Infoscan is down for maintenance.').end();
    if (!!req.xhr) {
      // res.status(503);
    } else {}
  });
  httpServer.listen(80);
}