let ImportApp = require('../../models/import.js');
let importApp = new ImportApp();

describe('Import App', function () {
    it('should setup counters.', function (done) {
        let Counter = require('../../models/counter');
        let counter = new Counter();
        counter.remove({}, (err) => {
            importApp.setupCounters((err) => {
                expect(err).to.be.equal(null);
                done();
            });
        });
    });
});
