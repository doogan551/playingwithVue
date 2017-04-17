let Point = require('../models/point.js');
let pointModel = new Point();
let logObj;

describe('Point Model', function () {
    it('should reassign point refs.', function () {
        let points = [{
            _id: 100,
            id: 'AAA',
            'Point Refs': [{
                id: 'BBB'
            }]
        }, {
            _id: 200,
            id: 'BBB',
            'Point Refs': [{
                id: 'AAA'
            }]
        }];

        pointModel.reassignRefs(points);

        expect(points[0]['Point Refs'][0].id).to.be.equal(points[1]._id);
        expect(points[1]['Point Refs'][0].id).to.be.equal(points[0]._id);
    });
});
