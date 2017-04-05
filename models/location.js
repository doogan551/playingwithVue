const async = require('async');

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
        let itemTypes = ['location'];
        let terms = data.terms || '';
        let groups = data.groups;

        let pipeline = [];

        let afterMatch = {
            $match: {}
        };

        if (!!terms.length) {
            // surrounding with double quotes matches phrase
            // without quotes becomes OR
            // - negates
            pipeline.push({
                $match: {
                    $text: {
                        $search: terms
                    }
                }
            });
        }

        pipeline.push(this.getPathLookup());

        if (!!id) {
            afterMatch.$match = {
                'path.locationRef.Value': id
            };
        }

        if (!!itemTypes.length) {
            afterMatch.$match.item = {
                $in: itemTypes
            };
        }

        pipeline.push(afterMatch);

        if (!!groups.length) {
            let group = {
                $group: {
                    _id: 'descendants'
                }
            };
            groups.forEach((field) => {
                group.$group[field[0]] = {
                    $push: '$' + field[1]
                };
            });
            pipeline.push(group);
        }

        this.aggregate({
            pipeline: pipeline
        }, (err, descendants) => {
            if (!!groups.length) {
                return cb(err, descendants);
            }
            async.each(descendants, this.orderPath, (err) => {
                cb(err, descendants);
            });
        });
    }

    getFullPath(data, cb) {
        let id = this.getNumber(data.id);

        let pipeline = [];

        pipeline.push({
            $match: {
                _id: id
            }
        });

        pipeline.push(this.getPathLookup());

        this.aggregate({
            pipeline: pipeline
        }, (err, descendants) => {
            async.each(descendants, this.orderPath, (err) => {
                cb(err, descendants);
            });
        });
    }


    getPathLookup() {
        return {
            $graphLookup: {
                from: this.collection,
                startWith: '$locationRef.Value',
                connectFromField: 'locationRef.Value',
                connectToField: '_id',
                as: 'path'
            }
        };
    }

    orderPath(descendant, cb) {
        let path = descendant.path;
        let newPath = [];
        let findNextChild = (parentId) => {
            for (var p = 0; p < path.length; p++) {
                let node = path[p];
                if (node.locationRef.Value === parentId) {
                    newPath.push(node);
                    findNextChild(node._id);
                    break;
                }
            }
        };

        findNextChild(0);
        descendant.path = newPath;
        return cb(null);
    }

    deleteLocation(data, cb) {
        let id = this.getNumber(data.id);
        let deleteChildren = this.getDefault(data.deleteChildren, false);

        this.remove({
            query: {
                _id: id
            }
        }, (err, result) => {
            if (!!err || result.ok !== 1) {
                return cb(err || 'nothing deleted');
            }
            this.getDescendants({
                parentId: id,
                groups: [
                    ['ids', '_id']
                ]
            }, (err, descendants) => {
                let query = {
                    _id: {
                        $in: descendants.ids
                    }
                };
                if (!!deleteChildren) {
                    this.remove({
                        query: query
                    }, cb);
                } else {
                    this.update({
                        query: query,
                        updateObj: {
                            $set: {
                                locationRef: this.buildParent(0)
                            }
                        }
                    }, cb);
                }
            });
        });
    }

    moveLocation(data, cb) {

    }
};

module.exports = Location;
const Counter = require('./counter');
