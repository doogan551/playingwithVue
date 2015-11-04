var chai = require('chai');
var expect = chai.expect;
var AssertionError = chai.AssertionError;
var Assertion = chai.Assertion;
var assert = chai.assert;

var ActivityLog = require('../models/activitylog.js');
var db = require('../helpers/db');
var config = require('config');
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port,
    '/', dbConfig.dbName
];

var admin = {
    "System Admin": {
        "Value": true
    },
    groups: []
};

describe('Getting default Activity Logs', function() {
    before(function(done) {
        db.connect(connectionString.join(''), done);
    });

    it('should return between 0 and 200 logs', function(done) {
        ActivityLog.get({
            user: admin
        }, function(err, logs) {
            expect(err).to.not.be.ok;
            expect(logs).to.be.ok;
            done(err);
        });
    });
});