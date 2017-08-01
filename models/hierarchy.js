const _ = require('lodash');
const async = require('async');

const Common = require('./common');
const Config = require('../public/js/lib/config.js');

const LOCATION = 'Location';
const MECHANICAL = 'Mechanical';

const models = {
    common: {
        _id: 0,
        id: '',
        parent: 0,
        display: '',
        tags: [],
        meta: {}
    },
    location: {
        nodeType: 'Location',
        locationType: ''
    },
    equipment: {
        nodeType: 'Equipment',
        libraryId: 0
    },
    category: {
        nodeType: 'Category'
    },
    point: {
        nodeType: 'Point',
        libraryId: 0,
        pointId: 0,
        isReference: false
    },
    application: {
        nodeType: 'Application',
        applicationType: '',
        pointId: 0
    }
};

const Hierarchy = class Hierarchy extends Common {

    constructor() {
        super('points');
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
                'parentNode': id,
                '_pStatus': 0
            },
            sort: {
                'display': 1
            },
            fields: {
                display: 1,
                parentNode: 1,
                nodeType: 1,
                nodeSubType: 1,
                locationType: 1
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
        const pointModel = new Point();
        let node = data;
        delete node.id;
        node._pStatus = Config.Enums['Point Statuses'].Active.enum;

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
        pointModel.buildPath(node.parentNode, node.display, (err, newPath) => {
            node.path = newPath;
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

    getNewId(type, cb) {
        let counterModel = new Counter();
        let typeEnum = Config.Enums['Hierarchy Types'][type].enum;
        counterModel.getNextSequence(type, (err, count) => {
            cb(err, (typeEnum << 22) + count);
        });
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
                    this.getNewId(node.nodeType, (err, newId) => {
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
                if (child.parentNode === parent.id) {
                    child.parentNode = parent._id;
                }
            }
        }
    }

    search(data, cb) {
        let terms = this.getDefault(data.terms, []);
        let pipeline = [];

        terms = this.buildSearchTerms(terms);

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

    buildSearchTerms(terms) {
        return terms.map((term) => {
            if (term.match(/"/)) {
                return term.replace(/"/g, '');
            }
            return new RegExp('[.]*' + term + '[.]*', 'i');
        });
    }

    getDescendants(data, cb) {
        let id = this.getNumber(data.id);

        let pipeline = [];
        pipeline.push({
            '$match': {
                'parent': id
            }
        });
        pipeline.push({
            '$graphLookup': {
                'from': 'hierarchy',
                'startWith': '$_id',
                'connectFromField': '_id',
                'connectToField': 'parent',
                'as': 'children'
            }
        });
        pipeline.push({
            '$project': {
                'display': 1,
                'parent': 1,
                'nodeType': 1,
                'locationType': 1,
                'children': 1
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

            descendants = this.orderDescendants(newDescendants, id);
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

    orderDescendants(descendants, parentId) {
        let newPath = [];
        let findNextChild = (parentId) => {
            for (var d = 0; d < descendants.length; d++) {
                let node = descendants[d];

                if (node.parent === parentId) {
                    newPath.push(node);
                    findNextChild(node._id);
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
        const skipProperties = ['tags', '_id', 'parentNode', 'libraryId', 'pointId', 'isReference', 'refNode', 'libraryId', '_pStatus'];

        let addUniqueTags = (tag) => {
            let tags = tag.toLowerCase().split(' ');
            tags = tags.filter((tag) => !node.tags.includes(tag) && tag !== '');
            node.tags.push(...tags);
        };

        let iterateModel = (model) => {
            for (var prop in model) {
                let property = model[prop];
                if (!skipProperties.includes(prop)) {
                    if (property instanceof Object) {
                        iterateModel(property);
                    } else {
                        addUniqueTags(property);
                    }
                }
            }
        };

        node.tags = [];

        // iterateModel(node);

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
        return cb([]);
        // let problems = [];
        // async.eachSeries(nodes, (node, callback) => {
        //     if (this.isNumber(node.parentNode)) {
        //         this.checkForExistingName(node, node.parentNode, (err, exists) => {
        //             if (!!exists) {
        //                 problems.push({
        //                     err: 'Name already exists under this parent location',
        //                     node: node
        //                 });
        //             }
        //             callback(err);
        //         });
        //     } else {
        //         return callback();
        //     }
        // }, (err) => {
        //     return cb(err || problems);
        // });
    }

    checkForExistingName(node, parentNode, cb) {
        this.count({
            query: {
                _id: {
                    $ne: node._id
                },
                display: node.display,
                parentNode: parentNode
            }
        }, (err, count) => {
            return cb(err, (count > 0));
        });
    }

};

module.exports = Hierarchy;
const Counter = require('./counter');
const Point = require('./point');
