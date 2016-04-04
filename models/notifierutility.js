var async = require('async');
var moment = require('moment');

var NotifierUtility = function() {
  this.Twilio = require('./twilio');
  this.Plivo = require('./plivo');
  this.Mailer = require('./mailer');
};

NotifierUtility.prototype.testText = function(number, message, cb) {
  this.Twilio.sendText(number, message, cb);
  this.Plivo.sendText(number, message, cb);
};

NotifierUtility.prototype.fixPhoneNumbers = function(number) {
  number = number.toString();
  number = (number.search(/\+/) >= 0) ? number : '+' + number;
  return number;
};

NotifierUtility.prototype.sendText = function(number, message, cb) {
  this.Twilio.sendText(this.fixPhoneNumbers(number), message, function(err, response) {
    if (cb)
      return cb(err, response);
  });
};

NotifierUtility.prototype.sendVoice = function(options, cb) {
  // Our options argument is derived from Twilio/Plivo voice API; all options are not implemented
  // https://www.twilio.com/docs/api/rest/making-calls#url-parameter
  // https://www.plivo.com/docs/api/call/#make-an-outbound-call
  //
  // options {
  //   to: <target phone number>,
  //   url: <A URL that produces an XML document which contains instructions for the call>,
  //   [urlParams: <JSON object of params to be appended to url; requires method be set to GET>],
  //   [method: <POST or GET; defaults to POST>],
  //   [fallbackUrl: <Fallback url for XML document containing call instructions>],
  //   [statusCallbackUrl: <url that should be called to provide a status update after the call is finished>],
  // }
  var twilioOptions = {
      to: this.fixPhoneNumbers(options.to),
      url: options.url
    };
  var httpGet = options.method === 'GET';
  var params = '';
  var key;

  // Check for URL parameters
  if (httpGet && options.urlParams) {
    params = '?';
    for (key in options.urlParams) {
      params += (key + '=' + options.urlParams[key] + '&');
    }
    twilioOptions.url += params;
  }

  // Check for a fallback URL
  if (options.fallbackUrl) {
    twilioOptions.fallbackUrl = options.fallbackUrl;
    if (httpGet) {
      twilioOptions.fallbackMethod = 'GET';
      twilioOptions.fallbackUrl += params;
    }
  }

  // Check for a status callback URL
  if (options.statusCallbackUrl) {
    twilioOptions.statusCallback = options.statusCallbackUrl;
    if (httpGet) {
      twilioOptions.statusCallbackMethod = 'GET';
      twilioOptions.statusCallback += params;
    }
  }

  this.Twilio.sendVoice(options, function(err, response) {
    // TODO Check for error and fallback to Plivo if necessary
    if (cb)
      return cb(err, response);
  });
};

NotifierUtility.prototype.sendEmail = function(options, cb) {
  this.Mailer.sendEmail(options, function(err, response) {
    if (cb)
      cb(err, response);
  });
};

module.exports = NotifierUtility;