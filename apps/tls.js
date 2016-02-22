var LEX = require('letsencrypt-express').testing();
var http = require('http');
var https = require('https');
// NOTE: you could use the old https module if for some reason you don't want to support modern browsers
// letsencrypt certonly --standalone --agree-tos --domains dorsett-tech.org --email rkendall@dorsett-tech.com
var lex = LEX.create({
  approveRegistration: function(hostname, cb) {
    console.log('----------', cb);
    cb(null, {
      domains: ['dorsett.duckdns.org'],
      email: 'rkendall@dorsett-tech.com', // 'user@example.com'
      agreeTos: true
    });
  }
});

function redirectHttp() {

  http.createServer(LEX.createAcmeResponder(lex, function redirectHttps(req, res) {
    res.writeHead(301, {
      "Location": "https://" + req.headers['host'] + req.url
    });
    res.end();
  })).listen(80);
}

function serveHttps() {
  var app = require('express')();

  app.use('/', function(req, res) {
    res.end('Hello!');
  });

  https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app)).listen(443);
}

redirectHttp();
serveHttps();