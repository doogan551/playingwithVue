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
            },
            sort: {
                'display': 1
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
            let meta = this.buildMeta(data.meta, parent.meta);
            parent = this.buildParent(parent);
            counterModel.getNextSequence('locationid', (err, newId) => {
                this.insert({
                    insertObj: {
                        item: 'location',
                        _id: newId,
                        display: display,
                        locationRef: parent,
                        type: type,
                        meta: meta,
                        tags: ['location', display, type]
                    }
                }, cb);
            });
        });
    }

    getDescendants(data, cb) {
        let id = this.getNumber(data.id);
        let itemTypes = ['location'];
        let terms = this.getDefault(data.terms, '');
        let groups = this.getDefault(data.groups, []);

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
                'path._id': id
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
            descendants.sort(this.sortDescendants);
            async.each(descendants, this.orderPath, (err) => {
                cb(err, descendants);
            });
        });
    }

    sortDescendants(a, b) {
        return a.path.length - b.path.length;
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
            descendants.sort(this.sortDescendants);
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

        this.getDescendants({
            id: id,
            groups: [
                ['ids', '_id']
            ]
        }, (err, descendants) => {
            let ids = [id];
            if (!!descendants.length && !!descendants[0].ids.length) {
                ids = ids.concat(descendants[0].ids);
            }
            let query = {
                _id: {
                    $in: ids
                }
            };
            if (!!deleteChildren) {
                this.remove({
                    query: query
                }, cb);
            } else {
                this.updateParent(null, query, cb);
            }
        });
    }

    moveLocation(data, cb) {
        let id = this.getNumber(data.id);
        let parentId = this.getNumber(data.parentId);

        this.updateParent(parentId, {
            _id: id
        }, cb);
    }

    updateParent(parentId, query, cb) {
        this.getLocation({
            id: parentId
        }, (err, parent) => {
            this.update({
                query: query,
                updateObj: {
                    $set: {
                        locationRef: this.buildParent(parent)
                    }
                }
            }, cb);
        });
    }

    editLocation(data, cb) {
        let id = this.getNumber(data.id);

        // updateTags
        this.getOne({
            query: {
                _id: id
            }
        }, (err, location) => {
            if (data.hasOwnProperty('display')) {
                // updateRefs
                location.display = data.display;
            }

            if (data.hasOwnProperty('type')) {
                // updateRefs
                location.type = data.type;
            }

            if (data.hasOwnProperty('meta')) {
                for (var prop in data.meta) {
                    location.meta[prop] = data.meta[prop];
                }
            }
            this.recreateTags(location);

            this.update({
                query: {
                    _id: id
                },
                updateObj: location
            }, (err) => {
                this.update({
                    query: {
                        'locationRef.Value': id
                    },
                    updateObj: {
                        $set: {
                            'locationRef.Display': location.display,
                            'locationRef.Type': location.type
                        }
                    }
                }, cb);
            });
        });
    }

    recreateTags(location) {
        location.tags = [];
        location.tags.push(location.display);
        location.tags.push(location.type);
        location.tags.push(location.item);
        location.tags.push(location.description);
        return;
    }

    buildMeta(data, parent) {
        let meta = {
            coords: {
                lat: 0,
                long: 0
            },
            address: {
                street: '',
                city: '',
                zip: ''
            },
            description: '',
            tz: ''
        };

        let iterateObj = (_meta, _data, _parent) => {
            for (var prop in _meta) {
                if (typeof _meta[prop] === 'object') {
                    iterateObj(_meta[prop], _data[prop], _parent[prop]);
                } else if (!!_data && _data.hasOwnProperty(prop)) {
                    _meta[prop] = _data[prop];
                } else if (!!_parent && _parent.hasOwnProperty(prop)) {
                    _meta[prop] = _parent[prop];
                }
            }
        };

        iterateObj(meta, data, parent);

        return meta;
    }
};

module.exports = Location;
const Counter = require('./counter');
