var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

module.exports = {
    getGplInfo: function (upi, cb) {
        var seqData,
            sendToJade = function (err, pointdata) {
                // console.log('GPL:', 'got points');
                cb({
                    data: seqData,
                    pointdata: pointdata
                });
            },
            getPointData = function () {
                getGplPoints(seqData, sendToJade);
            };

        Utility.getOne({
            collection: 'points',
            query: {
                _id: upi
            }
        }, function (err, result) {
            // console.log('GPL:', 'got point');
            seqData = result;
            getPointData();
        });
    },
    getReferences: function (data, cb) {

        var upoint = parseInt(data.upoint, 10);

        Utility.getOne({
            collection: 'points',
            query: {
                _id: upoint
            },
            fields: {
                SequenceData: 1
            }
        }, cb);
    }
};

var getGplPoints = function (seq, cb) {
    var c,
        list = seq.SequenceData,
        blocks,
        dynamics,
        pointRefs = seq["Point Refs"],
        len,
        block,
        dynamic,
        pointref,
        upis = [],
        getPointRef = function (pointRefIndex, referenceType) {
            var answer;
            if (pointRefIndex > -1) {
                answer = pointRefs.filter(function (pointRef) {
                    return pointRef.AppIndex === pointRefIndex && pointRef.PropertyName === referenceType;
                });
            }
            return (!!answer ? answer[0] : null);
        };

    if (list && list.sequence) {
        blocks = list.sequence.block || [];
        len = blocks.length;
        for (c = 0; c < len; c++) {
            block = blocks[c];
            pointref = getPointRef(block.pointRefIndex, "GPLBlock");
            if (!!pointref) {
                if (upis.indexOf(pointref.PointInst) === -1) {
                    upis.push(pointref.PointInst);
                }
            }
        }

        dynamics = list.sequence.dynamic || [];
        len = dynamics.length;
        for (c = 0; c < len; c++) {
            dynamic = dynamics[c];
            pointref = getPointRef(dynamic.pointRefIndex, "GPLDynamic");
            if (!!pointref) {
                if (upis.indexOf(pointref.PointInst) === -1) {
                    upis.push(pointref.PointInst);
                }
            }
        }

        Utility.get({
            collection: 'points',
            query: {
                _id: {
                    $in: upis
                }
            }
        }, cb);
    } else {
        cb(null, {});
    }

};