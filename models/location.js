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

    buildParent(parent) {
        let newParent = {
            isReadOnly: false
        };

        newParent.Display = (!parent) ? '' : parent.display;
        newParent.Value = (!parent) ? 0 : parent._id;
        newParent.Type = (!parent) ? '' : parent.type;
        newParent.isDisplayable = (!parent) ? false : true;

        return newParent;
    }

    add(data, cb) {
        let counterModel = new Counter();
        let display = data.display;
        let parentId = this.getNumber(data.parentId);
        let type = data.type;
        this.getLocation({
            id: parentId
        }, (err, parent) => {
            parent = this.buildParent(parent);
            counterModel.getNextSequence('locationid', (err, newId) => {
                this.insert({
                    insertObj: {
                        item: 'location',
                        _id: newId,
                        display: display,
                        locationRef: parent,
                        type: type
                    }
                }, cb);
            });
        });
    }

    getDescendants(data, cb) {
        let id = this.getNumber(data.id);
        let items = ['location'];
    }
};

module.exports = Location;
const Counter = require('./counter');
