const Point = require('./point');

const Sequence = class Sequence {

    getBlockTypes(cb) {
        const point = new Point();
        let criteria = {
            query: {
                SequenceData: {
                    $exists: true
                }
            },
            fields: {
                'SequenceData.Sequence.Block': 1
            }
        };

        point.get(criteria, (err, results) => {
            let c;
            let cc;
            let len = results.length;
            let row;
            let blockType;
            let blockTypes = {};

            for (c = 0; c < len; c++) {
                row = results[c].SequenceData.Sequence.Block;
                for (cc = 0; cc < row.length; cc++) {
                    blockType = row[cc].data.BlockType;
                    blockTypes[blockType] = blockTypes[blockType] || true;
                }
            }

            cb({
                err: err,
                types: blockTypes
            });
        });
    }

    doRefreshSequence(data) {
        const point = new Point();
        let _id = data.sequenceID;
        let criteria = {
            query: {
                _id: _id
            },
            updateObj: {
                $set: {
                    '_pollTime': new Date().getTime()
                }
            }
        };

        point.updateOne(criteria, (err) => {
            if (err) {
                // log it!
            }
        });
    }

    doUpdateSequence(data, cb) {
        const point = new Point();
        let name = data.sequenceName;
        let sequenceData = data.sequenceData;
        let criteria = {
            query: {
                'Name': name
            },
            updateObj: {
                $set: {
                    'SequenceData': sequenceData
                }
            }
        };

        point.updateOne(criteria, (err) => {
            if (err) {
                cb('Error: ' + err.err);
            } else {
                cb('success');
            }
        });
    }
};

module.exports = Sequence;
