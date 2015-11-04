var chai = require('chai');
var expect = chai.expect;
var AssertionError = chai.AssertionError;
var Assertion = chai.Assertion;
var assert = chai.assert;

var Alarm = require('../models/alarm');
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

describe('Alarm Model', function() {
    before(function(done) {
        db.connect(connectionString.join(''), done);
    });

    it('should return between 0 and 200 recent alarms', function(done) {
        Alarm.getRecentAlarms({
            user: admin
        }, function(err, recentAlarms) {
            expect(err).to.not.be.ok;
            expect(recentAlarms).to.be.ok;
            done();
        });
    });
});