let Counter = require('../../models/counter.js');
let counter = new Counter();

describe('Counter Model', function () {
    it('should get new upi based on string.', function (done) {
        counter.getUpiForPointType('Analog Input', (err, newUpi) => {
            expect(err).to.be.equal(null);
            expect(newUpi).to.be.above(0);
            expect(newUpi).to.be.below(4194302);

            counter.getUpiForPointType('Device', (err, newUpi) => {
                expect(err).to.be.equal(null);
                expect(newUpi).to.be.above(36700159);
                expect(newUpi).to.be.below(37748734);
                done();
            });
        });
    });

    it('should get new upi based on enum.', function (done) {
        counter.getUpiForPointType(0, (err, newUpi) => {
            expect(err).to.be.equal(null);
            expect(newUpi).to.be.above(0);
            expect(newUpi).to.be.below(4194302);

            counter.getUpiForPointType(8, (err, newUpi) => {
                expect(err).to.be.equal(null);
                expect(newUpi).to.be.above(36700160);
                expect(newUpi).to.be.below(37748734);
                done();
            });
        });
    });
});
