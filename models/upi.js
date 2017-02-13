let Utility = new(require('../models/utility'))();
const utils = require('../helpers/utils');
const upisCollection = utils.CONSTANTS('upis');

let Upi = class Upi extends Utility {
    constructor() {
        super(upisCollection);
    }

    getNextUpi(isDevice, cb) {
        let criteria = {
            collection: this.collection,
            query: {
                _pStatus: 1
            },
            updateObj: {
                $set: {
                    _pStatus: 0
                }
            },
            options: {
                'new': true
            }
        };

        if (isDevice) {
            criteria.sort = [
                ['_id', 'desc']
            ];
        } else {
            criteria.sort = [
                ['_id', 'asc']
            ];
        }

        Utility.findAndModify(criteria, cb);
    }

    deleteUpi(upi, cb) {
        let query = {
                _id: upi
            },
            sort = [],
            update = {
                $set: {
                    _pStatus: 2
                }
            };
        // Not specifiying new: true because we don't need the updated document after the update

        Utility.findAndModify({
            collection: this.collection,
            query: query,
            sort: sort,
            updateObj: update
        }, cb);
    }
};
module.exports = Upi;
