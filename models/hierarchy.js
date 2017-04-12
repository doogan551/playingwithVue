const async = require('async');

const Common = require('./common');

const LOCATION = 'Location';
const MECHANICAL = 'Mechanical';

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
                'hierarchyRefs.value': id
            },
            sort: {
                'display': 1
            }
        }, cb);
    }

    buildParents(loc, mech) {
        return [this.buildParent(LOCATION, loc), this.buildParent(MECHANICAL, mech)];
    }

    buildParent(item, parent) {
        let template = {
            isReadOnly: false
        };

        template.display = (!parent) ? '' : parent.display;
        template.value = (!parent) ? 0 : parent._id;
        template.type = (!parent) ? '' : parent.type;
        template.isDisplayable = (!parent) ? false : true;
        template.item = item;

        return template;
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
        this.checkForExistingName(data, parentLocId, (err, exists) => {
            if (!!exists) {
                cb('Name already exists under this parent location');
            } else {
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
                        newNode: result
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
        let terms = this.getDefault(data.terms, []);
        let groups = this.getDefault(data.groups, []);
        let item = data.item;

        let pipeline = [];

        pipeline.push(this.getPathLookup());

        if (!!terms.length) {
            terms = terms.map((term) => {
                if (term.match(/"/)) {
                    return term;
                }
                return new RegExp('[.]*' + term.toLowerCase() + '[.]*');
            });
            pipeline.push({
                $unwind: {
                    path: '$path',
                    preserveNullAndEmptyArrays: true
                }
            });

            pipeline.push({
                $project: {
                    'tags': {
                        $concatArrays: ['$tags', {
                            $ifNull: ['$path.tags', []]
                        }]
                    },
                    'display': 1,
                    'item': 1,
                    'type': 1,
                    'path': 1
                }
            });

            pipeline.push({
                $unwind: {
                    path: '$tags'
                }
            });

            pipeline.push({
                $group: {
                    _id: '$_id',
                    display: {
                        $first: '$display'
                    },
                    type: {
                        $first: '$type'
                    },
                    item: {
                        $first: '$item'
                    },
                    path: {
                        $addToSet: '$path'
                    },
                    tags: {
                        $addToSet: '$tags'
                    }
                }
            });

            pipeline.push({
                $match: {
                    tags: {
                        $all: terms
                    }
                }
            });

            pipeline.push({
                $project: {
                    'tags': 0,
                    'path.tags': 0
                }
            });
        } else if (!!groups.length) {
            let group = {
                $group: {
                    _id: 'descendants'
                }
            };
            groups.forEach((field) => {
                group.$group[field[0]] = {
                    $addToSet: '$' + field[1]
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
                this.orderPath(item, descendant);
                callback();
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
                this.orderPath(item, descendant);
                callback();
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
                    if (hierRef.item === item && hierRef.value === parentId) {
                        newPath.push(node);
                        findNextChild(node._id);
                        break;
                    }
                }
            }
        };

        findNextChild(0);
        descendant.path = newPath;
        return;
    }

    getPathLookup() {
        return {
            $graphLookup: {
                from: this.collection,
                startWith: '$hierarchyRefs.value',
                connectFromField: 'hierarchyRefs.value',
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
                this.updateParent(null, query, item, cb);
            }
        });
    }

    moveNode(data, cb) {
        let id = this.getNumber(data.id);
        let parentId = this.getNumber(data.parentId);
        let item = data.item;
        this.getNode({
            id: id
        }, (err, node) => {
            this.checkForExistingName(node, parentId, (err, exists) => {
                if (!!exists) {
                    cb('Name already exists under this parent location');
                } else {
                    this.updateParent(parentId, {
                        _id: id
                    }, item, cb);
                }
            });
        });
    }

    updateParent(parentId, query, item, cb) {
        query['hierarchyRefs.item'] = item;
        this.getNode({
            id: parentId
        }, (err, parent) => {
            this.update({
                query: query,
                updateObj: {
                    $set: {
                        'hierarchyRefs.$': this.buildParent(parent.item, parent)
                    }
                }
            }, cb);
        });
    }

    editNode(data, cb) {
        let id = this.getNumber(data.id);
        let checkName = false;

        // updateTags
        this.getOne({
            query: {
                _id: id
            }
        }, (err, node) => {
            if (data.hasOwnProperty('display')) {
                // updateRefs
                node.display = data.display;
                checkName = true;
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
            this.checkForExistingName(node, LOCATION, (err, exists) => {
                if (!!checkName && !!exists) {
                    cb('Name already exists under this parent location');
                } else {
                    this.update({
                        query: {
                            _id: id
                        },
                        updateObj: node
                    }, (err) => {
                        this.update({
                            query: {
                                'hierarchyRefs.value': id
                            },
                            updateObj: {
                                $set: {
                                    'hierarchyRefs.$': this.buildParent(node.item, node)
                                }
                            }
                        }, cb);
                    });
                }
            });
        });
    }

    recreateTags(node) {
        node.tags = [];
        node.tags.push(node.display.toLowerCase());
        node.tags.push(node.type.toLowerCase());
        node.tags.push(node.item.toLowerCase());
        node.tags.push(node.meta.description.toLowerCase());
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

    checkForExistingName(node, item, cb) {
        let parent = {};
        if (this.isNumber(item)) {
            parent.value = item;
        } else {
            node.hierarchyRefs.forEach((ref) => {
                if (ref.item === item) {
                    parent = ref;
                }
            });
        }
        this.count({
            query: {
                _id: {
                    $ne: node._id
                },
                display: node.display,
                'hierarchyRefs.value': parent.value
            }
        }, (err, count) => {
            return cb(err, (count > 0));
        });
    }
};

module.exports = Hierarchy;
const Counter = require('./counter');
