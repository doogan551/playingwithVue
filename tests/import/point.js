let _ = require('lodash');
let async = require('async');
let Config = require('../../public/js/lib/config');
let Point = require('../../models/point.js');
let pointModel = new Point();


describe('Point Model', () => {
    it('should not have null reference values', (done) => {
        pointModel.iterateCursor({
            query: {
                'Point Refs': {
                    $ne: []
                }
            }
        }, (err, doc, next) => {
            doc['Point Refs'].forEach((ref) => {
                expect(ref.Value).to.not.be.equal(null);
                expect(ref.PointInst).to.not.be.equal(null);
                expect(ref.DevInst).to.not.be.equal(null);
            });
            next();
        }, done);
    });
    it('should have correct upi values in point refs', (done) => {
        pointModel.iterateCursor({
            query: {
                'Point Refs': {
                    $ne: []
                }
            }
        }, (err, doc, next) => {
            async.eachSeries(doc['Point Refs'], (pointRef, seriesCallback) => {
                if (pointRef.Value !== 0) {
                    pointModel.getOne({
                        query: {
                            _id: pointRef.Value
                        }
                    }, (err, ref) => {
                        expect(ref.Name).to.be.equal(pointRef.PointName);
                        // getting device's id - always in first index?
                        expect(ref['Point Refs'][0].Value).to.be.equal(pointRef.DevInst);
                        seriesCallback(err);
                    });
                }
            }, next);
        }, done);
    });
});
