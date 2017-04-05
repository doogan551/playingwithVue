const Common = require('./common');

const Hierarchy = class Hierarchy extends Common {
    constructor() {
        super('hierarchy');
    }
    get(data, cb) {
        cb(null, 2);
    }
};

module.exports = Hierarchy;
