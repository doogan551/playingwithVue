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

    add(data, cb) {
        let counterModel = new Counter();
        let display = data.display;
        let parentId = this.getNumber(data.id);
        let type = data.type;
        this.getLocation({
            id: parentId
        }, (err, parent) => {
            if (!parent) {
                parent = {
                    Display: '',
                    Value: 0,
                    Type: '',
                    isDisplayable: false,
                    isReadOnly: false
                };
            }
            counterModel.getNextSequence('locationid', (err, newId) => {
                this.insert({
                    insertObj: {
                        _id: newId,
                        display: display,
                        locationRef: parent,
                        type: type
                    }
                }, cb);
            });
        });
    }
};

module.exports = Location;
const Counter = require('./counter');
