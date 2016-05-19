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
  // All mailer options (see https://github.com/nodemailer/nodemailer) are exposed with one exception:
  // Our 'from' address is always built from two optional parameters: 'fromAccount' and 'fromUser'
  // If your options object has a 'from' key, it will be overwritten; options.from is created from the 'fromAccount' and 'fromUser' keys.
  // If not used, 'fromAccount' defaults to 'infoscan', and 'fromUser' defaults to 'InfoScan', combining to yield a from address of:
  // '"InfoScan" <infoscan@[domain]>', where domain is the site domain defined in the config file
  // Typically, the 'fromAccount' will be sourced from one listed in the config file (Infoscan.email.accounts)
  this.Mailer.sendEmail(options, function(err, response) {
    if (cb)
      cb(err, response);
  });
};

module.exports = NotifierUtility;