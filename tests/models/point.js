let _ = require('lodash');
let Config = require('../../public/js/lib/config');
let Point = require('../../models/point.js');
let pointModel = new Point();


describe('Point Model', function () {
    it('should reassign point refs for a sequence update.', function (done) {
        let oldSequence = Config.Templates.getTemplate('Sequence');
        let newSequence = _.cloneDeep(oldSequence);
        let oldBlockExisting = Config.Templates.getTemplate('Average');
        let newBlockExisting = _.cloneDeep(oldBlockExisting);
        let oldBlockAdd = Config.Templates.getTemplate('Logic');
        let newBlockAdd = _.cloneDeep(oldBlockAdd);

        let fakeId = 'test123';
        newBlockAdd.id = fakeId;
        newBlockExisting['Point Refs'][0].Value = fakeId;
        newSequence['Point Refs'][0].Value = fakeId;

        newSequence.Name = 'Sequence';
        newBlockExisting.Name = 'Average';
        newBlockAdd.Name = 'Logic';

        let data = {
            updates: [{
                newPoint: newSequence,
                oldPoint: oldSequence
            }, {
                newPoint: newBlockExisting,
                oldPoint: oldBlockExisting
            }, {
                newPoint: newBlockAdd,
                oldPoint: oldBlockAdd
            }]
        };

        pointModel.changeNewIds(data.updates, (err, points) => {
            expect(err).to.be.equal(null);
            expect(newSequence.id).to.be.equal(undefined);
            expect(newBlockExisting.id).to.be.equal(undefined);
            expect(newBlockAdd.id).to.be.equal(undefined);

            expect(newBlockAdd.id).to.not.be.equal(fakeId);
            expect(newBlockExisting['Point Refs'][0].Value).to.not.be.equal(fakeId);
            expect(newSequence['Point Refs'][0].Value).to.not.be.equal(fakeId);

            expect(newBlockExisting['Point Refs'][0].Value).to.be.equal(newBlockAdd._id);
            expect(newSequence['Point Refs'][0].Value).to.be.equal(newBlockAdd._id);
            done();
        });
    });

    it('should reassign point refs for a new sequence.', function (done) {
        let oldSequence = Config.Templates.getTemplate('Sequence');
        let newSequence = _.cloneDeep(oldSequence);
        let oldBlockExisting = Config.Templates.getTemplate('Average');
        let newBlockExisting = _.cloneDeep(oldBlockExisting);
        let oldBlockAdd = Config.Templates.getTemplate('Logic');
        let newBlockAdd = _.cloneDeep(oldBlockAdd);

        let fakeId = 'test123';

        newSequence.Name = 'Sequence';
        newBlockExisting.Name = 'Average';
        newBlockAdd.Name = 'Logic';

        newSequence.id = fakeId + newSequence.Name;
        newBlockExisting.id = fakeId + newBlockExisting.Name;
        newBlockAdd.id = fakeId + newBlockAdd.Name;

        newBlockExisting['Point Refs'][0].Value = newBlockAdd.id;
        newSequence['Point Refs'][0].Value = newBlockAdd.id;

        let data = {
            updates: [{
                newPoint: newSequence,
                oldPoint: oldSequence
            }, {
                newPoint: newBlockExisting,
                oldPoint: oldBlockExisting
            }, {
                newPoint: newBlockAdd,
                oldPoint: oldBlockAdd
            }]
        };

        pointModel.changeNewIds(data.updates, (err, points) => {
            expect(err).to.be.equal(null);
            expect(newSequence.id).to.be.equal(undefined);
            expect(newBlockExisting.id).to.be.equal(undefined);
            expect(newBlockAdd.id).to.be.equal(undefined);

            expect(newBlockAdd.id).to.not.be.equal(fakeId);
            expect(newBlockExisting['Point Refs'][0].Value).to.not.be.equal(fakeId);
            expect(newSequence['Point Refs'][0].Value).to.not.be.equal(fakeId);

            expect(newBlockExisting['Point Refs'][0].Value).to.be.equal(newBlockAdd._id);
            expect(newSequence['Point Refs'][0].Value).to.be.equal(newBlockAdd._id);
            done();
        });
    });
});
