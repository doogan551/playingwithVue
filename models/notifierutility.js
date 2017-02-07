let config = require('config');

let infoscanConfig = config.get('Infoscan');
let twilioConfig = config.get('Twilio');
// let plivoConfig = config.get('Plivo');

let inboundId = infoscanConfig.siteConfig.inboundId;
let inboundUrl = (infoscanConfig.letsencrypt.enabled ? 'https://' : 'http://') + infoscanConfig.domains[0] + '/' + inboundId;

let NotifierUtility = function () {
    this.Twilio = require('./twilio');
    this.Plivo = require('./plivo');
    this.Mailer = require('./mailer');
};

NotifierUtility.prototype.testText = function (number, message, cb) {
    this.Twilio.sendText(number, message, cb);
    this.Plivo.sendText(number, message, cb);
};

NotifierUtility.prototype.fixPhoneNumbers = function (number) {
    number = number.toString();

    // Add US country code if not already present
    if (number.length === 10) {
        number = '+1' + number;
    } else if (number.length === 11) {
        number = '+' + number;
    }
    return number;
};

NotifierUtility.prototype.sendText = function (number, message, cb) {
    this.Twilio.sendText(this.fixPhoneNumbers(number), message, function (err, response) {
        if (cb) {
            return cb(err, response);
        }
    });
};

NotifierUtility.prototype.sendVoice = function (options, cb) {
    // Our options argument is derived from Twilio/Plivo voice API; all options are not implemented
    // https://www.twilio.com/docs/api/rest/making-calls#url-parameter
    // https://www.plivo.com/docs/api/call/#make-an-outbound-call
    //
    // options {
    //   to: <string - target phone number>,
    //   app: <string - the calling application; see config.Twilio.voice for valid applications>,
    //   [urlParams: <JSON object of params to be appended to url; requires method be set to GET>],
    // }
    let app = twilioConfig.voice[options.app],
        to = this.fixPhoneNumbers(options.to),
        queryString = '',
        key,
        twilioOptions,
        buildOptions = function () {
            let obj = {},
                keyValue;
            for (let key in app) {
                keyValue = app[key];

                // If this is a URL
                if ((typeof keyValue === 'string') && (keyValue.charAt(0) === '/')) {
                    // Prefix the URL with our domain/inboundId & add to our object
                    obj[key] = inboundUrl + keyValue;
                } else {
                    obj[key] = keyValue;
                }
            }
            obj.to = to;

            return obj;
        };

    // An invalid app object is a programmer bug
    if (!app) {
        return cb('options.app is invalid. See config.Twilio.voice for valid applications');
    }

    // Get our options object
    twilioOptions = buildOptions();

    // Add query string if needed
    if ((twilioOptions.Method === 'GET') && options.urlParams && Object.keys(options.urlParams).length) {
        // Build query string; Object.keys returns empty array if argument is not an object type
        queryString = '?';
        for (key in options.urlParams) {
            queryString += (key + '=' + options.urlParams[key] + '&');
        }

        twilioOptions.Url += queryString;
        if (twilioOptions.StatusCallback) {
            twilioOptions.StatusCallback += queryString;
        }
    }

    // Do voice notification
    this.Twilio.sendVoice(twilioOptions, function (err, response) {
        // TODO Check for error and fallback to Plivo if necessary
        if (cb) {
            return cb(err, response);
        }
    });
};

NotifierUtility.prototype.sendEmail = function (options, cb) {
    // All mailer options (see https://github.com/nodemailer/nodemailer) are exposed with one exception:
    // Our 'from' address is always built from two optional parameters: 'fromAccount' and 'fromUser'
    // If your options object has a 'from' key, it will be overwritten; options.from is created from the 'fromAccount' and 'fromUser' keys.
    // If not used, 'fromAccount' defaults to 'infoscan', and 'fromUser' defaults to 'InfoScan', combining to yield a from address of:
    // '"InfoScan" <infoscan@[domain]>', where domain is the site domain defined in the config file
    // Typically, the 'fromAccount' will be sourced from one listed in the config file (Infoscan.email.accounts)
    this.Mailer.sendEmail(options, function (err, response) {
        if (cb) {
            cb(err, response);
        }
    });
};

module.exports = NotifierUtility;
