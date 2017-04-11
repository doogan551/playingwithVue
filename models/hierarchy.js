const async = require('async');

const Common = require('./common');

const Hierarchy = class Hierarchy extends Common {

    constructor() {
        super('hierarchy');
    }

    getNode(data, cb) {
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
                'hierarchyRefs.Value': id
            },
            sort: {
                'display': 1
            }
        }, cb);
    }

    buildParents(loc, mech) {
        let locTemplate = {
            isReadOnly: false
        };
        let mechTemplate = {
            isReadOnly: false
        };

        locTemplate.display = (!loc) ? '' : loc.display;
        locTemplate.value = (!loc) ? 0 : loc._id;
        locTemplate.type = (!loc) ? '' : loc.type;
        locTemplate.isDisplayable = (!loc) ? false : true;
        locTemplate.item = 'Location';

        mechTemplate.display = (!mech) ? '' : mech.display;
        mechTemplate.value = (!mech) ? 0 : mech._id;
        mechTemplate.type = (!mech) ? '' : mech.type;
        mechTemplate.isDisplayable = (!mech) ? false : true;
        mechTemplate.item = 'Mechanical';

        return [locTemplate, mechTemplate];
    }

    add(data, cb) {
        let display = data.display;
        let parentLocId = this.getNumber(data.parentLocId);
        let parentMechId = this.getNumber(data.parentMechId);
        let type = data.type;
        let item = data.item;
        let meta = this.getDefault(data.meta, {
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
        });

        this.getBothParents(parentLocId, parentMechId, (err, parentLoc, parentMech) => {
            // let meta = this.buildMeta(data.meta, (!!parent) ? parent.meta : {});
            this.getNewId((err, newId) => {
                this.insert({
                    insertObj: {
                        item: item,
                        _id: newId,
                        display: display,
                        hierarchyRefs: this.buildParents(parentLoc, parentMech),
                        type: type,
                        meta: meta,
                        tags: [item, display, type]
                    }
                }, (err, result) => {
                    cb(err, result.ops[0]);
                });
            });
        });
    }

    getBothParents(parentLocId, parentMechId, cb) {
        this.getNode({
            id: parentLocId
        }, (err, parentLoc) => {
            this.getNode({
                id: parentMechId
            }, (err, parentMech) => {
                cb(err, parentLoc, parentMech);
            });
        });
    }

    getNewId(cb) {
        let counterModel = new Counter();
        counterModel.getNextSequence('hierarchyId', cb);
    }

    bulkAdd(data, cb) {
        let nodes = data.nodes;
        let results = [];
        async.eachSeries(nodes, (node, callback) => {
            this.add(node, (err, result) => {
                if (!!err) {
                    results.push({
                        err: err,
                        node: node
                    });
                } else {
                    results.push({
                        newNode: result.ops[0]
                    });
                }
                callback();
            });
        }, (err) => {
            cb(err, results);
        });
    }

    getDescendants(data, cb) {
        let id = this.getNumber(data.id);
        let itemTypes = [];
        let terms = this.getDefault(data.terms, '');
        let groups = this.getDefault(data.groups, []);
        let item = data.item;

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
            async.each(descendants, (descendant, callback) => {
                this.orderPath(item, descendant, callback);
            }, (err) => {
                cb(err, descendants);
            });
        });
    }

    sortDescendants(a, b) {
        return a.path.length - b.path.length;
    }

    getFullPath(data, cb) {
        let id = this.getNumber(data.id);
        let item = data.item;

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
            async.each(descendants, (descendant, callback) => {
                this.orderPath(item, descendant, callback);
            }, (err) => {
                cb(err, descendants);
            });
        });
    }

    orderPath(item, descendant, cb) {
        let path = descendant.path;
        let newPath = [];
        let findNextChild = (parentId) => {
            for (var p = 0; p < path.length; p++) {
                let node = path[p];
                for (var h = 0; h < node.hierarchyRefs.length; h++) {
                    let hierRef = node.hierarchyRefs[h];
                    if (hierRef.item === item) {
                        if (hierRef.Value === parentId) {
                            newPath.push(node);
                            findNextChild(node._id);
                            break;
                        }
                    }
                }
            }
        };

        findNextChild(0);
        descendant.path = newPath;
        return cb(null);
    }

    getPathLookup() {
        return {
            $graphLookup: {
                from: this.collection,
                startWith: '$hierarchyRefs.Value',
                connectFromField: 'hierarchyRefs.Value',
                connectToField: '_id',
                as: 'path'
            }
        };
    }

    deleteNode(data, cb) {
        let id = this.getNumber(data.id);
        let deleteChildren = this.getDefault(data.deleteChildren, false);
        let item = data.item;

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
                this.getOtherParent(id, item, 0, (err, parents) => {
                    this.updateParent(parents, query, cb);
                });
            }
        });
    }

    getOtherParent(id, item, parentId, cb) {
        this.getNode({
            id: id
        }, (err, child) => {
            let otherParentRef = {};
            for (var h = 0; h < child.hierarchyRefs.length; h++) {
                let hierRef = child.hierarchyRefs[h];
                if (hierRef.item !== item) {
                    otherParentRef = hierRef;
                }
            }
            this.getNode({
                _id: otherParentRef.value
            }, (err, otherParent) => {
                let parents = {
                    locationId: 0,
                    mechId: 0
                };

                if (otherParent.item === 'Location') {
                    parents.locationId = otherParent._id;
                    parents.mechId = parentId;
                } else {
                    parents.locationId = parentId;
                    parents.mechId = otherParent._id;
                }
                cb(err, parents);
            });
        });
    }

    moveNode(data, cb) {
        let id = this.getNumber(data.id);
        let parentId = this.getNumber(data.parentId);
        let item = data.item;

        this.getOtherParent(id, item, parentId, (err, parents) => {
            this.updateParent(parents, {
                _id: id
            }, cb);
        });
    }

    updateParent(parents, query, cb) {
        this.getBothParents(parents.locationId, parents.mechId, (err, parentLoc, parentMech) => {
            this.update({
                query: query,
                updateObj: {
                    $set: {
                        hierarchyRefs: this.buildParents(parentLoc, parentMech)
                    }
                }
            }, cb);
        });
    }

    editNode(data, cb) {
        let id = this.getNumber(data.id);

        // updateTags
        this.getOne({
            query: {
                _id: id
            }
        }, (err, node) => {
            if (data.hasOwnProperty('display')) {
                // updateRefs
                node.display = data.display;
            }

            if (data.hasOwnProperty('type')) {
                // updateRefs
                node.type = data.type;
            }

            if (data.hasOwnProperty('meta')) {
                for (var prop in data.meta) {
                    node.meta[prop] = data.meta[prop];
                }
            }
            this.recreateTags(node);

            this.update({
                query: {
                    _id: id
                },
                updateObj: node
            }, (err) => {
                this.update({
                    query: {
                        'hierarchyRefs.Value': id
                    },
                    updateObj: {
                        $set: {
                            'locationRef.Display': node.display,
                            'locationRef.Type': node.type
                        }
                    }
                }, cb);
            });
        });
    }

    recreateTags(node) {
        node.tags = [];
        node.tags.push(node.display);
        node.tags.push(node.type);
        node.tags.push(node.item);
        node.tags.push(node.description);
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
                    iterateObj(_meta[prop], (!!_data) ? _data[prop] : {}, (!!_parent) ? _parent[prop] : {});
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

module.exports = Hierarchy;
const Counter = require('./counter');
