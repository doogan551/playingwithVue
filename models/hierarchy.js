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
                'hierarchyRefs': {
                    $elemMatch: {
                        value: id
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

    buildParent(parent) {
        let template = {
            isReadOnly: false
        };

        template.display = (!parent) ? '' : parent.display;
        template.value = (!parent) ? 0 : parent._id;
        template.type = (!parent) ? '' : parent.type;
        template.isDisplayable = (!parent) ? false : true;
        template.item = parent.item;

        return template;
    }

    add(data, cb) {
        let display = data.display;
        let id = this.getNumber(data._id);
        let refs = data.refs;
        let type = data.type;
        let item = data.item;
        let instance = this.getDefault(data.instance, '');
        let systemTags = this.getDefault(data.systemTags, {
            properties: [],
            qualifiers: []
        });
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
            tz: ''
        });

        // let meta = this.buildMeta(data.meta, (!!parent) ? parent.meta : {});
        let node = {
            item: item,
            _id: id,
            display: display,
            hierarchyRefs: refs,
            type: type,
            meta: meta,
            tags: [],
            systemTags: systemTags,
            instance: instance
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
                for (var r = 0; r < child.refs.length; r++) {
                    let ref = child.refs[r];
                    if (ref.value === parent.id) {
                        ref.value = parent._id;
                    }
                }
            }
        }
    }

    search(data, cb) {
        let terms = this.getDefault(data.terms, []);
        let pipeline = [];

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
                // descendant.path = this.orderPath(item, descendant.path);
                callback();
            }, (err) => {
                cb(err, descendants);
            });
        });
    }

    getDescendants(data, cb) {
        let id = this.getNumber(data.id);

        let pipeline = [];
        pipeline.push({
            '$match': {
                'hierarchyRefs': {
                    '$elemMatch': {
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

        this.aggregate({
            pipeline: pipeline
        }, (err, descendants) => {
            let newDescendants = [];
            descendants.forEach((descendant) => {
                newDescendants = newDescendants.concat([...descendant.children]);
                delete descendant.children;
                newDescendants.push(descendant);
            });

            // descendants = this.orderDescendants(item, newDescendants, id);
            cb(err, descendants);
        });
    }

    getDescendantIds(data, cb) {
        let id = this.getNumber(data.id);

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
                // descendant.path = this.orderPath(item, descendant.path);
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
                this.updateParent(id, query, cb);
            }
        });
    }

    moveNode(data, cb) {
        let id = this.getNumber(data.id);
        let parentId = this.getNumber(data.parentId);
        this.getNode({
            id: id
        }, (err, node) => {
            this.checkForExistingName(node, parentId, (err, exists) => {
                if (!!exists) {
                    cb('Name already exists under this parent location');
                } else {
                    this.updateParent(parentId, {
                        _id: id
                    }, cb);
                }
            });
        });
    }

    updateParent(parentId, query, cb) {
        // TODO needs to be reworked on how the array element is updated
        // query['hierarchyRefs.item'] = item;
        this.getNode({
            id: parentId
        }, (err, parent) => {
            this.update({
                query: query,
                updateObj: {
                    $set: {
                        'hierarchyRefs.$': this.buildParent(parent)
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
                                    'hierarchyRefs.$': this.buildParent(node)
                                }
                            }
                        }, cb);
                    });
                }
            });
        });
    }

    recreateTags(node) {
        let addUniqueTags = (tag) => {
            let tags = tag.toLowerCase().split(' ');
            tags = tags.filter((tag) => !node.tags.includes(tag) && tag !== '');
            node.tags.push(...tags);
        };

        node.tags = [];

        if (node.hasOwnProperty('systemTags')) {
            node.systemTags.properties.forEach((tag) => {
                addUniqueTags(tag);
            });
            node.systemTags.qualifiers.forEach((tag) => {
                addUniqueTags(tag);
            });
        }

        node.hierarchyRefs.forEach((ref) => {
            ref.categories.forEach((cat) => {
                addUniqueTags(cat);
            });
        });

        addUniqueTags(node.display);
        addUniqueTags(node.type);
        addUniqueTags(node.item);
        addUniqueTags(node.instance);
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
