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
        let item = this.getDefault(data.item, LOCATION);

        this.getAll({
            query: {
                'hierarchyRefs': {
                    $elemMatch: {
                        value: id,
                        item: item
                    }
                }
            },
            sort: {
                'display': 1
            },
            fields: {
                display: 1,
                hierarchyRefs: 1,
                type: 1,
                item: 1,
                systemTags: 1
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
        let id = this.getNumber(data._id);
        let parentLocId = this.getNumber(data.parentLocId);
        let parentMechId = this.getNumber(data.parentMechId);
        let type = data.type;
        let item = data.item;
        let systemTags = this.getDefault(data.systemTags, '');
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
            let node = {
                item: item,
                _id: id,
                display: display,
                hierarchyRefs: this.buildParents(parentLoc, parentMech),
                type: type,
                meta: meta,
                tags: [],
                systemTags: systemTags
            };
            this.recreateTags(node);
            this.insert({
                insertObj: node
            }, (err, result) => {
                if (err) {
                    return cb(err);
                } else if (!!result) {
                    return cb(null, result.ops[0]);
                }
                return cb(null, null);
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
        counterModel.getNextSequence('hierarchy', cb);
    }

    addAll(data, cb) {
        let nodes = data.nodes;
        let results = [];
        this.checkAllNames(nodes, (errs) => {
            if (!!errs.length) {
                return cb(errs);
            }
            this.assignIds(nodes, (err) => {
                nodes = this.sortNodes(nodes);
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
            });
        });
    }

    sortNodes(nodes) {
        let sorted = [];
        let getParent = (node, path) => {
            nodes.forEach((_node) => {
                if (_node._id === node.parentLocId) {
                    addToPath(_node, path);
                    getParent(_node, path);
                }
            });
        };
        let addToPath = (node, path) => {
            if (!~sorted.indexOf(node._id) && !~path.indexOf(node._id)) {
                path.unshift(node._id);
            }
        };
        nodes.forEach((node) => {
            let path = [];
            addToPath(node, path);
            getParent(node, path);
            sorted.push(...path);
        });
        sorted.forEach((id, index) => {
            nodes.forEach((node) => {
                if (id === node._id) {
                    sorted[index] = node;
                }
            });
        });
        return sorted;
    }

    assignIds(nodes, cb) {
        let assignParentId = (parentCallback) => {
            async.eachSeries(nodes, (node, callback) => {
                if (node.hasOwnProperty('id')) {
                    this.getNewId((err, newId) => {
                        node._id = newId;
                        return callback(err);
                    });
                } else {
                    return callback();
                }
            }, parentCallback);
        };
        assignParentId((err) => {
            this.assignParentRefs(nodes);
            cb(err);
        });
    }

    assignParentRefs(nodes) {
        for (var p = 0; p < nodes.length; p++) {
            let parent = nodes[p];
            for (var c = 0; c < nodes.length; c++) {
                let child = nodes[c];
                if (child.parentLocId === parent.id) {
                    child.parentLocId = parent._id;
                }
                if (child.parentMechId === parent.id) {
                    child.parentMechId = parent._id;
                }
            }
        }
    }

    search(data, cb) {
        let terms = this.getDefault(data.terms, []);
        let pipeline = [];
        let item = this.getDefault(data.item, LOCATION);

        terms = terms.map((term) => {
            if (term.match(/"/)) {
                return term.replace(/"/g, '');
            }
            return new RegExp('[.]*' + term + '[.]*', 'i');
        });

        pipeline.push(this.getPathLookup());

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

        this.aggregate({
            pipeline: pipeline
        }, (err, descendants) => {
            descendants.sort(this.sortDescendants);
            async.each(descendants, (descendant, callback) => {
                descendant.path = this.orderPath(item, descendant.path);
                callback();
            }, (err) => {
                cb(err, descendants);
            });
        });
    }

    getDescendants(data, cb) {
        let id = this.getNumber(data.id);
        let item = data.item;

        let pipeline = [];
        pipeline.push({
            '$match': {
                'hierarchyRefs': {
                    '$elemMatch': {
                        'item': 'Location',
                        'value': id
                    }
                }
            }
        });
        pipeline.push({
            '$graphLookup': {
                'from': 'hierarchy',
                'startWith': '$_id',
                'connectFromField': '_id',
                'connectToField': 'hierarchyRefs.value',
                'as': 'children'
            }
        });

        // pipeline.push({
        //     $unwind: '$children'
        // });
        // pipeline.push({
        //     $replaceRoot: {
        //         'newRoot': '$children'
        //     }
        // });

        this.aggregate({
            pipeline: pipeline
        }, (err, descendants) => {
            let newDescendants = [];
            descendants.forEach((descendant) => {
                newDescendants = newDescendants.concat([...descendant.children]);
                delete descendant.children;
                newDescendants.push(descendant);
            });

            descendants = this.orderDescendants(item, newDescendants, id);
            cb(err, descendants);
        });
    }

    getDescendantIds(data, cb) {
        let id = this.getNumber(data.id);
        let item = data.item;

        let pipeline = [];
        pipeline.push({
            '$match': {
                _id: id
            }
        });
        pipeline.push({
            '$graphLookup': {
                'from': 'hierarchy',
                'startWith': '$_id',
                'connectFromField': '_id',
                'connectToField': 'hierarchyRefs.value',
                'as': 'children'
            }
        });
        pipeline.push({
            $unwind: {
                path: '$children'
            }
        });
        pipeline.push({
            $group: {
                '_id': 'children',
                ids: {
                    $addToSet: '$children._id'
                }
            }
        });

        this.aggregate({
            pipeline: pipeline
        }, (err, descendants) => {
            return cb(err, descendants);
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
                descendant.path = this.orderPath(item, descendant.path);
                callback();
            }, (err) => {
                cb(err, descendants);
            });
        });
    }

    orderPath(item, path) {
        let newPath = [];
        let parentId = 0;

        let findNextChild = (parentId) => {
            for (var p = 0; p < path.length; p++) {
                let node = path[p];
                for (var h = 0; h < node.hierarchyRefs.length; h++) {
                    let hierRef = node.hierarchyRefs[h];
                    if (hierRef.value === parentId && hierRef.item === item) {
                        newPath.push(node);
                        findNextChild(node._id);
                        break;
                    }
                }
            }
        };

        findNextChild(parentId);
        return newPath;
    }

    orderDescendants(item, descendants, parentId) {
        let newPath = [];
        let findNextChild = (parentId) => {
            for (var d = 0; d < descendants.length; d++) {
                let node = descendants[d];
                for (var h = 0; h < node.hierarchyRefs.length; h++) {
                    let hierRef = node.hierarchyRefs[h];
                    if (hierRef.value === parentId && hierRef.item === item) {
                        newPath.push(node);
                        findNextChild(node._id);
                    }
                }
            }
        };

        findNextChild(parentId);
        return newPath;
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

        this.getDescendantIds({
            id: id
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
                this.updateParent(id, query, item, cb);
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

    splitSystemTags(tagString) {
        // Group,Group/Property;Type
        // Supply,Air/Temperature;Sensor
        let tags = {};
        tags.groups = tagString.split('/')[0].split(',');
        tags.props = tagString.split('/')[1].split(';')[0].split(',');
        tags.types = tagString.split('/')[1].split(';')[1].split(',');
        return tags;
    }

    recreateTags(node) {
        node.tags = [];
        let sTags = node.systemTags.split(/[,/;]/);
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

    checkAllNames(nodes, cb) {
        // if parentId is fake, ignore it
        // change node to normal structure before name check
        let problems = [];
        async.eachSeries(nodes, (node, callback) => {
            if (this.isNumber(node.parentLocId)) {
                this.checkForExistingName(node, node.parentLocId, (err, exists) => {
                    if (!!exists) {
                        problems.push({
                            err: 'Name already exists under this parent location',
                            node: node
                        });
                    }
                    callback(err);
                });
            } else {
                return callback();
            }
        }, (err) => {
            return cb(err || problems);
        });
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
