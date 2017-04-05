const Common = require('./common');

const Location = class Location extends Common {

    constructor() {
        super('location');
    }

    getLocation(data, cb) {
        let id = this.getNumber(data.id);
        this.getOne({
            query: {
                _id: id
            }
        }, cb);
    }

    getChildren(data, cb) {
        let id = this.getNumber(data.id);
        this.getAll({
            query: {
                'locationRef.Value': id
            }
        }, cb);
    }
};

module.exports = Location;
