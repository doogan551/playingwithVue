const GPL = class GPL {
    getGplInfo(data, cb) {
        const point = new Point();
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

        point.getOne({
            query: {
                _id: data.upi
            }
        }, (err, result) => {
            // console.log('GPL:', 'got point');
            seqData = result;
            if (!!seqData) {
                getPointData();
            } else {
                sendToJade('sequenceNotFound');
            }
        });
    }
    getReferences(data, cb) {
        const point = new Point();
        let upoint = parseInt(data.upoint, 10);

        point.getOne({
            query: {
                _id: upoint
            },
            fields: {
                SequenceData: 1
            }
        }, cb);
    }
    getGplPoints(data, cb) {
        const point = new Point();
        let c,
            seq = data.seq,
            list = seq.SequenceData,
            editVersion = list.sequence.editVersion,
            blocks,
            dynamics,
            pointRefs = seq['Point Refs'],
            len,
            block,
            dynamic,
            pointref,
            tempData = [],
            upis = [],
            upisMap = {},
            getTempPoint = (id) => { // ch918; added function
                // "editVersion" : {
                //      "block" : [...], 
                //      "pointChanges" : {
                //         "updates" : [
                //             {
                //                  "oldPoint" : {}, 
                //                  "newPoint" : {
                //                      _id: 0,
                //                      id: "tempId_..." (where ... is some unique string)
                //                  }
                //             }
                //         ], 
                //         "deletes": []
                //      }

                let arr = editVersion.pointChanges.updates || [];
                let arrLen = arr.length;
                let i = 0;
                let point;

                for (i; i < arrLen ; i++) {
                    point = arr[i].newPoint;
                    if (point.id === id) {
                        return point;
                    }
                }

                return null;
            },
            getBlocksArray = (activeBlocks, editVersion) => {
                let allBlocks = [];

                if (!!activeBlocks) {
                    allBlocks = allBlocks.concat(activeBlocks);
                }

                if (!!editVersion && !!editVersion.block) {
                    allBlocks = allBlocks.concat(editVersion.block);
                }

                return allBlocks;
            },
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
            blocks = getBlocksArray(list.sequence.block, editVersion);
            len = blocks.length;
            for (c = 0; c < len; c++) {
                block = blocks[c];
                pointref = getPointRef(block.pointRefIndex, 'GPLBlock');
                if (!!pointref) {
                    let pointInst = pointref.PointInst;

                    if (!upisMap[pointInst]) {
                        // ch918; If the point ref refers to a temporary point, get the temporary point data
                        if ((typeof pointInst === 'string') && (pointInst.indexOf('tempId') > -1) && editVersion) {
                            tempData.push(getTempPoint(pointInst));
                        } else {
                            upis.push(pointInst);
                        }
                        upisMap[pointInst] = true;
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

            point.getAllPointsById({
                upis,
                user: data.user,
                resolvePointRefs: true
            }, (err, data) => {
                data = data || [];
                cb(err, [...data, ...tempData]); // ch918; results are combination of database points and temporary points
            });
        } else {
            cb(null, {});
        }
    }
};

module.exports = GPL;
const Point = require('./point');
