let Utility = require('../models/utility');

let Sequence = class Sequence {

    getBlockTypes(cb) {
        let criteria = {
            collection: 'points',
            query: {
                SequenceData: {
                    $exists: true
                }
            },
            fields: {
                'SequenceData.Sequence.Block': 1
            }
        };

        Utility.get(criteria, (err, results) => {
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
        let _id = data.sequenceID;
        let criteria = {
            collection: 'points',
            query: {
                _id: _id
            },
            updateObj: {
                $set: {
                    '_pollTime': new Date().getTime()
                }
            }
        };

        Utility.update(criteria, (err) => {
            if (err) {
                // log it!
            }
        });
    }

    doUpdateSequence(data, cb) {
        let name = data.sequenceName;
        let sequenceData = data.sequenceData;
        let criteria = {
            collection: 'points',
            query: {
                'Name': name
            },
            updateObj: {
                $set: {
                    'SequenceData': sequenceData
                }
            }
        };

        Utility.update(criteria, (err) => {
            if (err) {
                cb('Error: ' + err.err);
            } else {
                cb('success');
            }
        });
    }
};

module.exports = Sequence;
