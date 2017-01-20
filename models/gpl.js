var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

module.exports = {
    getGplInfo: function(data, cb) {
        var seqData,
            sendToJade = function(err, pointdata) {
                // console.log('GPL:', 'got points');
                cb(err,
                    {
                        data: seqData,
                        pointdata: pointdata
                    });
            },
            getPointData = function() {
                getGplPoints({
                    seq: seqData,
                    user: data.user
                }, sendToJade);
            };

        Utility.getOne({
            collection: 'points',
            query: {
                _id: data.upi
            }
        }, function(err, result) {
            // console.log('GPL:', 'got point');
            seqData = result;
            if (!!seqData) {
                getPointData();
            } else {
                sendToJade("No sequence found!");
            }

        });
    },
    getReferences: function(data, cb) {

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

var getGplPoints = function(data, cb) {
    var c,
        seq = data.seq,
        list = seq.SequenceData,
        blocks,
        dynamics,
        pointRefs = seq["Point Refs"],
        len,
        block,
        dynamic,
        pointref,
        upis = [],
        getPointRef = function(pointRefIndex, referenceType) {
            var answer;
            if (pointRefIndex > -1) {
                answer = pointRefs.filter(function(pointRef) {
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

        Utility.getWithSecurity({
            collection: 'points',
            query: {
                _id: {
                    $in: upis
                }
            },
            data: {
                user: data.user
            }
        }, cb);
    } else {
        cb(null, {});
    }

};