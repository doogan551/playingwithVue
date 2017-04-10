const Common = require('./common');

const Counter = class Counter extends Common {

    constructor() {
        super('counters');
    }

    getNextSequence(name, callback) {
        this.findAndModify({
            query: {
                _id: name
            },
            updateObj: {
                $inc: {
                    count: 1
                }
            },
            options: {
                'new': true
            }
        }, (err, counter) => {
            callback(err, counter.count);
        });
    }
    getNextAvailableSequence(doc, targetCollection) {
        while (1) {
            var cursor = targetCollection.find({}, {
                _id: 1
            }).sort({
                _id: -1
            }).limit(1);

            var seq = cursor.hasNext() ? cursor.next()._id + 1 : 1;

            doc._id = seq;

            var results = targetCollection.insert(doc);

            if (results.hasWriteError()) {
                if (results.writeError.code === 11000 /* dup key */) {
                    continue;
                } else {
                    print('unexpected error inserting data: ' + JSON.stringify(results));
                }
            }

            break;
        }
    }
};
module.exports = Counter;
