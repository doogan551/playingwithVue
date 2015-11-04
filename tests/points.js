/*var expect = require('chai').expect,
    Point = require('../models/point.js'),
    db = require('../helpers/db'),
    async = require('async'),
    config = require('config'),
    dbConfig = config.get('Infoscan.dbConfig'),
    connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port,
        '/', dbConfig.dbName
    ],
    admin = {
        "System Admin": {
            "Value": true
        },
        groups: []
    };

async.waterfall([function(cb) {

    describe('Database', function() {

        it('should connect to the db', function(done) {
            db.connect(connectionString.join(''), function(err) {
                expect(err).to.equal(undefined);
                done();
            });
        });
        cb();
    });
}, function(cb) {
    describe('Point', function() {
        describe('init', function() {
            it('should return an array', function(done) {
                Point.getPointsByQuery({}, function(err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.have.length.above(0);
                    var testPoint = result[0];
                    describe('Search', function() {
                        it('should return a point', function(done) {
                            Point.getPointById({
                                collection: 'points',
                                id: testPoint._id,
                                user: admin
                            }, function(err, info, result) {
                                expect(err).to.equal(null);
                                expect(result).to.not.equal(null);
                                done();
                                cb();
                            });
                        });
                    });
                    done();
                });
            });
        });
    });
}, function(cb) {
    console.log('third');

    cb();
}], function(err) {
    console.log('done');
});
*/