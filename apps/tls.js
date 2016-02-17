var lex = require('letsencrypt-express').testing();
var express = require('express');
var app = express();

app.use('/', function(req, res) {
  res.send({
    success: true
  });
});

lex.create({
  configDir: '../lib/letsencrypt.config', // ~/letsencrypt, /etc/letsencrypt, whatever you want
  onRequest: app, // your express app (or plain node http app)
  letsencrypt: null, // you can provide you own instance of letsencrypt
  // if you need to configure it (with an agreeToTerms
  // callback, for example)
  approveRegistration: function(hostname, cb) { // PRODUCTION MODE needs this function, but only if you want
    // automatic registration (usually not necessary)
    // renewals for registered domains will still be automatic
    cb(null, {
      domains: ['dorsett.duckdns.org'],
      email: 'rkendall@dorsett-tech.com',
      agreeTos: true // you 
    });
  }
}).listen([80], [443], function() {
  console.log("ENCRYPT __ALL__ THE DOMAINS!");
});

// ./letsencrypt-auto certonly --standalone --email rkendall@dorsett-tech.com -d dorsett.duckdns.org

// /etc/letsencrypt/live/dorsett.duckdns.org/fullchain.pem