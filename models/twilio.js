var https = require('https');
var xml2js = require('xml2js');
var config = require('config');
var logger = require('../helpers/logger')(module);
var accountSid = config.get('Twilio').accountSid;
var authToken = config.get('Twilio').authToken;
var phoneNumbers = config.get('Twilio').phoneNumbers;
var numberIndex = 0;

var client = require('twilio')(accountSid, authToken);

var NotifierUtility = require('./notifierutility');
var notifierUtility = new NotifierUtility();
// https://api.twilio.com/2010-04-01/Accounts/
module.exports = {
  sendText: function(toNumber, message, cb) {
    var fromNumber = phoneNumbers[numberIndex++];

    if (numberIndex >= phoneNumbers.length)
      numberIndex = 0;

    client.sendMessage({
      to: toNumber,
      from: fromNumber,
      body: message.toString()
    }, cb);
  },

  sendVoice: function(options, cb) {
    options.from = phoneNumbers[0];
    client.makeCall(options, cb);
  },

  getLogs: function(type, cb) {
    var self = this;
    var url = 'https://' + accountSid + ':' + authToken + '@api.twilio.com/2010-04-01/Accounts/' + accountSid + '/' + type;
    https.get(url, function(res) {
      var xml = '';
      res.on('data', function(chunk) {
        xml += chunk;
      });
      res.on('end', function() {
        self.parseXml(xml, function(err, result) {
          if (!!result.TwilioResponse.RestException) {
            return cb(result.TwilioResponse.RestException, null);
          } else {
            return cb(null, result.TwilioResponse);
          }
        });
      });
    }).on('error', function(error) {
      logger.info('err', error);
    });
  },

  getMessages: function() {
    this.getLogs('Messages', function(err, xml) {
      if(err){
        logger.error(err);
      }
      var messages = xml.Messages[0].Message;
      messages.forEach(function(msg) {
        if (msg.To.indexOf(from) > -1) {
          logger.info(msg.Body);
        }
      });
    });
  },

  getCalls: function() {
    this.getLogs('Callss', function(err, xml) {
      if(err){
        logger.error(err);
      }
      var calls = xml.Calls[0].Call;
      logger.info(calls);
      calls.forEach(function(call) {
        if (call.To.indexOf(from) > -1) {
          logger.info(call);
        }
      });
    });
  },

  parseXml: function(xml, cb) {
    xml2js.parseString(xml, cb);
  }
};