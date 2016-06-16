var https = require('https');
var async = require('async');
var xml2js = require('xml2js');
var config = require('config');
var logger = require('../helpers/logger')(module);
var accountSid = config.get('Twilio').accountSid;
var authToken = config.get('Twilio').authToken;
var phoneNumbers = config.get('Twilio').phoneNumbers;
var numNumbers = phoneNumbers.length;
var smsNumberIndex = 0;
var voiceNumberIndex = 0;

var client = require('twilio')(accountSid, authToken);

var NotifierUtility = require('./notifierutility');
var notifierUtility = new NotifierUtility();
// https://api.twilio.com/2010-04-01/Accounts/
module.exports = {
  sendText: function(toNumber, message, cb) {
    var fromNumber = phoneNumbers[smsNumberIndex++];

    if (smsNumberIndex >= numNumbers) {
      smsNumberIndex = 0;
    }

    client.sendMessage({
      to: toNumber,
      from: fromNumber,
      body: message.toString()
    }, cb);
  },

  sendVoice: function(options, cb) {
    options.from = phoneNumbers[voiceNumberIndex++];

    if (voiceNumberIndex >= numNumbers) {
      voiceNumberIndex = 0;
    }
    
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
  },

  transferNumbers: function (data, cb) {
    // This function transfers phone numbers between Twilio subaccounts, or between a subaccount and the master account
    // data is expected to be an object with keys fromAccountSid (string), toAccountSid (string), and numberSids (array of strings)
    // cb is optional
    // Twilio's documentation for this API is here: https://www.twilio.com/docs/api/rest/subaccounts

    // !!!!!! The Twilio client must be authenticated using the master account credentials to perform this function
    //        The data object may optionally include the master account credentials

    var numberSids = Array.isArray(data.numberSids) && data.numberSids;
    var fromAccountSid = data.fromAccountSid;
    var toAccountSid = data.toAccountSid;
    var results = [];
    var localClient;
    var transfer = function (numberSid, callback) {
      var number = (localClient || client).accounts(fromAccountSid).incomingPhoneNumbers(numberSid);
      var msg;

      number.update({
        accountSid: toAccountSid
      }, function (err, result) {
        if (err) {
          msg = 'The number associated with sid "' + numberSid + '" was NOT transferred due to an error';
        } else {
          msg = 'Number ' + result.phone_number + ' transferred successfully';
        }
        logger.info(msg);
        
        results.push({
          numberSid: numberSid,
          msg: msg,
          result: result,
          err: err
        });

        // Callback with no error (continue transferring numbers even if we had an error)
        callback(null);
      });
    };

    // Make sure the callback is defined
    cb = cb || function () {};

    if (!numberSids) {
      return cb('Property "numberSids is not present or invalid (should be an array)');
    }

    if (data.masterAccountSid && data.masterAuthToken) {
      localClient = require('twilio')(data.masterAccountSid, data.masterAuthToken);
    }

    async.each(numberSids, transfer, function done (err) {
      return cb(null, results);
    });
  }
};