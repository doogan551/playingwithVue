let Point = require('../models/point');
let pointModel = new Point();
let logObj;

describe('Point Model', function () {
    it('should reassign point refs.', function () {
        let point1 = {
            _id: 100,
            id: 'AAA',
            'Point Refs': [{
                Value: 'BBB'

            }]
        };
        let point2 = {
            _id: 200,
            id: 'BBB',
            'Point Refs': [{
                Value: 'AAA'
            }]
        };
        let points = [{
            newPoint: point1
        }, {
            newPoint: point2
        }];

        pointModel.reassignRefs(points);

        expect(point1['Point Refs'][0].Value).to.be.equal(point2._id);
        expect(point2['Point Refs'][0].Value).to.be.equal(point1._id);
        expect(point1['Point Refs'][0].PointInst).to.be.equal(point2._id);
        expect(point2['Point Refs'][0].PointInst).to.be.equal(point1._id);
    });
});
