let Utility = new(require('../models/utility'))();

let GPL = class GPL {
    getGplInfo(data, cb) {
        let seqData,
            sendToJade = (err, pointdata) => {
                // console.log('GPL:', 'got points');
                cb(err, {
                    data: seqData,
                    pointdata: pointdata
                });
            },
            getPointData = () => {
                this.getGplPoints({
                    seq: seqData,
                    user: data.user
                }, sendToJade);
            };

        Utility.getOne({
            collection: 'points',
            query: {
                _id: data.upi
            }
        }, (err, result) => {
            // console.log('GPL:', 'got point');
            seqData = result;
            if (!!seqData) {
                getPointData();
            } else {
                sendToJade('No sequence found!');
            }
        });
    }
    getReferences(data, cb) {
        let upoint = parseInt(data.upoint, 10);

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
    getGplPoints(data, cb) {
        let c,
            seq = data.seq,
            list = seq.SequenceData,
            blocks,
            dynamics,
            pointRefs = seq['Point Refs'],
            len,
            block,
            dynamic,
            pointref,
            upis = [],
            getPointRef = (pointRefIndex, referenceType) => {
                let answer;
                if (pointRefIndex > -1) {
                    answer = pointRefs.filter((pointRef) => {
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
                pointref = getPointRef(block.pointRefIndex, 'GPLBlock');
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
                pointref = getPointRef(dynamic.pointRefIndex, 'GPLDynamic');
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
    }
};

module.exports = GPL;
