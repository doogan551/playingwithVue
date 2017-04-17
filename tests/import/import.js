let ImportApp = require('../../models/import.js');
let importApp = new ImportApp();

describe('Import App', function () {
    it('should run test fx.', function (done) {
        let Counter = require('../../models/counter');
        let counter = new Counter();
        importApp.setupCounters((err) => {
            counter.getNextSequence('analogInputId', (err, newAIId) => {
                expect(err).to.be.equal(undefined);
                expect(newAIId).to.not.be.equal(0);
                done();
            });
        });
    });
});
