// TODO need to seperate functions and not call DB ever
var DeviceTree = new (require('../models/devicetree.js'))();

describe('Device Tree Model', function () {
    it('should build tree', function (done) {
        DeviceTree.getTree(function (err, result) {
            expect(err).to.be.equal(undefined);
            expect(result).to.not.be.equal(undefined);
            expect(result.tree.length).to.not.be.equal(0);
            expect(result.networkNumbers.length).to.not.be.equal(0);
            expect(result.badNumbers.length).to.be.at.least(0);
            done(err);
        });
    });
});
