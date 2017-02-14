let nodemailer = require('nodemailer');
let config = require('config');

let serverName = require('os').hostname();
let siteConfig = config.get('Infoscan');
let siteDomain = siteConfig.domains[0];
let siteName = siteConfig.location.site;
let defaultAccount = siteConfig.email.accounts.default;
let smtpAuth = config.get('SparkPost').smtpAuth;

let OPEN = 1;
let CLOSED = 2;
let TIMEOUT = 30000; // 30 seconds

// Initially we used a 5min 30sec timeout. Often, our transport object would receive our email requests but the emails
// were never sent and our callback was never called. It appears the transport was prematurely closing due to a problem with
// our version of the nodemailer or one of it's dependencies as described here: https://github.com/nodemailer/nodemailer/issues/260.
// Apparently this issue was resolved in a later release of Nodemailer, but at the time of this writing we cannot upgrade
// because the later releases are ES6, and our version of Node is ES5.

// Our workaround is to use a timeout of 30 seconds. This is based on the fact that notifications.js is the only application
// currently sending email, and it runs once per minute. Setting our timeout to 30s guarantees we'll create a new transport
// object for sending emails when the notification task runs.

// In the future, other InfoScan applications may send email (automated reports, etc.); then we can no longer guarantee that a
// transport will be created each time emails are sent (because it could be requested before our transport is closed). To test
// how our workaround performs, a test script was created to send an email every 20s (to continually extend the life of the
// transport and prevent it from closing). In total, 49 emails were successfully sent over the course of 13+ minutes. Only one
// email was not received in the targeted inbox, and subsequent emails continued to flow in, indicating the lost email was not
// a result of the transport issue previously seen.

let transportStatus = CLOSED;
let smtpTransport;
let timeoutObj;
let smtpConfig = {
    transport: 'SMTP',
    host: 'smtp.sparkpostmail.com', // hostname
    secureConnection: false, // connection is started in insecure plain text mode and later upgraded with STARTTLS
    port: 587, // port for secure SMTP
    auth: smtpAuth
};

let closeTransport = () => {
    smtpTransport.close();
    transportStatus = CLOSED;
};

let getTransport = () => {
    clearTimeout(timeoutObj); // Clear the timeout
    timeoutObj = setTimeout(closeTransport, TIMEOUT); // Close the connection pool after <timeout> milliseconds of inactivity

    if (transportStatus === CLOSED) {
        smtpTransport = nodemailer.createTransport(smtpConfig);
        transportStatus = OPEN;
    }
};

let sendEmail = (options, cb) => {
    let fromName = '"' + (options.fromName || 'InfoScan') + '"',
        fromAddr = (options.fromAccount || defaultAccount) + '@' + siteDomain;

    getTransport();
    options.from = fromName + ' <' + fromAddr + '>';
    smtpTransport.sendMail(options, cb);
};

let Mailer = class Mailer {
    sendError(msg) {
        let options;

        if (siteConfig.email.onError.enabled) {
            options = {
                to: siteConfig.email.onError.to,
                subject: 'Error: ' + serverName + ' (Site: ' + siteName + ')',
                text: ['Site: ' + siteName, 'Time: ' + new Date().toString(), '', msg].join('\n')
            };
            sendEmail(options, () => {});
        }
    }
    sendEmail(options, cb) {
        sendEmail(options, cb);
    }
};

module.exports = Mailer;
