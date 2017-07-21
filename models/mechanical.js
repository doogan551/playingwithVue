const async = require('async');

const Common = require('./common');

const Mechanical = class Mechanical extends Common {

    constructor() {
        super('Templates');
    }

    getNode(data, cb) {
        let id = this.getNumber(data.id);
        this.getOne({
            query: {
                _id: id
            }
        }, cb);
    }

};

module.exports = Mechanical;
const Counter = require('./counter');
