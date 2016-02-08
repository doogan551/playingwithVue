var express = require('express');
var app = express();
var twilio = require('twilio');
var plivo = require('plivo');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res, next) {
  console.log('/');
  return next();
});

app.all('/twilio/xml', function(req, res) {
  var qs = req.query;
  var twiml = new twilio.TwimlResponse();

  console.log(qs);
  for (var prop in qs) {
    switch (prop) {
      case 'say':
        twiml.say(qs[prop]);
        break;
      case 'gather':
        twiml.gather({}, function() {
          this.say('Press 1 to acknowledge');
        });
        break;
    }
  }

  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// addGetDigits
app.get('/plivo/xml', function(req, res) {
  var qs = req.query;
  var r = plivo.Response();

  console.log(qs);
  for (var prop in qs) {
    switch (prop) {
      case 'say':
        r.addSpeak(qs[prop]);
        break;
      case 'gather':

        var digits = r.addGetDigits();
        digits.addSpeak('Press 1 to acknowledge');
        break;
    }
  }

  res.set('Content-Type', 'text/xml');
  res.send(r.toXML());
});

app.post('/twilio/sms', function(req, res) {
  console.log('T', req.body.From);
  console.log('T', req.body.To);
  console.log('T', req.body.Body);
});

// app.post('/plivo/sms', function(req, res){
//   console.log('P', req.body.From);
//   console.log('P', req.body.To);
//   console.log('P', req.body.Text);
// });
// 

app.all('/gitlabhook', function(req, res){
  console.log(req.body);
});

app.listen(85, function() {
  console.log('listening on port', 85);
});

var MailListener = require("mail-listener2");

var mailListener = new MailListener({
  username: "dorsett.alarms@gmail.com",
  password: "dorsettgmailpass",
  host: "imap.gmail.com",
  port: 993, // imap port 
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  },
  markSeen: true, // all fetched email willbe marked as seen and not fetched next time 
  fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`, 
  attachments: false // download attachments as they are encountered to the project directory 
});

mailListener.start(); // start listening 

// stop listening 
//mailListener.stop(); 

mailListener.on("server:connected", function() {
  console.log("imapConnected");
});

mailListener.on("server:disconnected", function() {
  console.log("imapDisconnected");
});

mailListener.on("error", function(err) {
  console.log(err);
});

mailListener.on("mail", function(mail, seqno, attributes) {
  // do something with mail object including attachments 
  console.log(mail.subject, mail.text);
  // mail processing code goes here 
});