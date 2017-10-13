const _ = require('lodash');
const async = require('async');
var logger = require('../helpers/logger')(module);

const Common = require('./common');
const Config = require('../public/js/lib/config.js');

const LOCATION = 'Location';
const MECHANICAL = 'Mechanical';

const Hierarchy = class Hierarchy extends Common {

    constructor() {
        super('points');
    }

    checkUniqueDisplayUnderParent(data, cb) {
        let parentNode = this.getNumber(data.parentNode);
        let display = data.display;
        if (!display) {
            return cb(null, false);
        }
        this.getOne({
            query: {
                parentNode,
                display,
                _pStatus: Config.Enums['Point Statuses'].Active.enum
            }
        }, (err, result) => {
            let exists = (!!result) ? true : false;
            return cb(err, {
                exists
            });
        });
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
                '_pStatus': 0,
                'Point Type.Value': {
                    $ne: 'Schedule Entry'
                }
            },
            sort: {
                'display': 1
            },
            fields: {
                display: 1,
                parentNode: 1,
                _parentUpi: 1,
                nodeType: 1,
                nodeSubType: 1,
                locationType: 1,
                refNode: 1,
                path: 1,
                Name: 1
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

    fixPath(path, display, index) {
        path[index] = display;
        return path;
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
            this.toLowerCasePath(node);
            this.recreateTags(node);
            try {
                let result = Config.Templates.checkAgainstTemplate(node);
            } catch (e) {
                logger.error(e);
                return cb(e.message || e);
            }
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

    getDescendants(data, cb) {
        let id = this.getNumber(data.id);

        let pipeline = [];
        pipeline.push({
            '$match': {
                '_id': id
            }
        });
        pipeline.push({
            '$graphLookup': {
                'from': 'points',
                'startWith': '$_id',
                'connectFromField': '_id',
                'connectToField': 'parentNode',
                'as': 'children'
            }
        });
        pipeline.push({
            '$project': {
                'children._id': 1,
                'children.path': 1
            }
        });
        pipeline.push({
            '$unwind': {
                'path': '$children'
            }
        });
        pipeline.push({
            '$replaceRoot': {
                'newRoot': '$children'
            }
        });

        this.aggregate({
            pipeline: pipeline
        }, (err, descendants) => {
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
                'from': 'points',
                'startWith': '$_id',
                'connectFromField': '_id',
                'connectToField': 'parentNode',
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
                nodes: {
                    $addToSet: {
                        id: '$children._id',
                        nodeType: '$children.nodeType'
                    }
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
        let nodeType = this.getDefault(data.nodeType, 'Location');
        let points = [];
        let hierarchies = [];

        let deleteHierachyNodes = (ids, callback) => {
            if (!ids.length) {
                return callback();
            }
            this.remove({
                query: {
                    _id: {
                        $in: ids
                    }
                }
            }, callback);
        };

        let removePointNodes = (ids, callback) => {
            if (!ids.length) {
                return callback();
            }
            // could potentially call point.deletePoint() but needs to be run through
            // to make sure it doesn't do something we don't want, like delete children
            this.remove({
                query: {
                    _id: {
                        $in: ids
                    }
                }
            }, callback);
        };

        let sortId = (type, id) => {
            if (['Point', 'Application'].includes(type)) {
                points.push(id);
            } else {
                hierarchies.push(id);
            }
        };

        this.getDescendantIds({
            id: id
        }, (err, descendants) => {
            let allIds = descendants[0];
            if (!!allIds && !!allIds.nodes.length) {
                allIds.nodes.forEach((descendant) => {
                    sortId(descendant.nodeType, descendant.id);
                });
            }

            sortId(nodeType, id);

            deleteHierachyNodes(hierarchies, (err, result) => {
                removePointNodes(points, (err, result) => {
                    return cb();
                });
            });
        });
    }

    moveNode(data, cb) {
        let id = this.getNumber(data.id);
        let parentNode = this.getNumber(data.parentNode);

        this.checkUniqueDisplayUnderParent({
            id,
            parentNode
        }, (err, exists) => {
            if (!!err) {
                return cb(err);
            } else if (!!exists.exists) {
                return cb('Label already exists under node');
            }
            this.getNode({
                id: id
            }, (err, node) => {
                this.getNode({
                    id: parentNode
                }, (err, parent) => {
                    node.parentNode = parentNode;

                    if (parentNode === 0) {
                        node.path = [node.display];
                    } else {
                        node.path = [...parent.path, node.display];
                    }
                    this.toLowerCasePath(node);
                    this.update({
                        query: {
                            _id: id
                        },
                        updateObj: node
                    }, (err) => {
                        this.updateChildrenPaths(id, node.path, cb);
                    });
                });
            });
        });
    }

    copyNode(data, cb) {
        let newNode,
            id = this.getNumber(data.id),
            parentNode = this.getNumber(data.parentNodeId);

        this.getNode({
            id: id
        }, (err, node) => {
            this.getNode({
                id: parentNode
            }, (err, parent) => {
                newNode = node;
                newNode.parentNode = parentNode;
                newNode.id = 'newNode';
                // newNode.targetUpi = id;
                newNode.display += this.getCopyPostFix();

                if (parentNode === 0) {
                    newNode.path = [newNode.display];
                } else {
                    newNode.path = [...parent.path, newNode.display];
                }

                this.addAll({
                    nodes: [newNode]
                }, cb);
            });
        });
    }

    updateChildrenPaths(parentNode, path, cb) {
        this.iterateCursor({
            query: {
                parentNode
            },
            fields: {
                path: 1
            }
        }, (err, child, nextChild) => {
            for (var p = 0; p < path.length; p++) {
                child.path[p] = path[p];
            }
            this.toLowerCasePath(child);
            this.update({
                query: {
                    _id: child._id
                },
                updateObj: {
                    $set: {
                        path: child.path,
                        _path: child._path
                    }
                }
            }, (err, result) => {
                this.updateChildrenPaths(child._id, path, nextChild);
            });
        }, (err, count) => {
            cb(err);
        });
    }

    updateChildrenPath(parentNode, path, cb) {
        this.getDescendants({
            id: parentNode
        }, (err, descendants) => {
            async.eachSeries(descendants, (descendant, nextDesc) => {
                for (var p = 0; p < path.length; p++) {
                    descendant.path[p] = path[p];
                }
                this.toLowerCasePath(descendant);
                this.update({
                    query: {
                        _id: descendant._id
                    },
                    updateObj: {
                        $set: {
                            path: descendant.path,
                            _path: descendant._path
                        }
                    }
                }, nextDesc);
            }, (err) => {
                cb(err);
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
        let oldDisplay;

        // updateTags
        this.getOne({
            query: {
                _id: id
            }
        }, (err, node) => {
            if (data.hasOwnProperty('display')) {
                // updateRefs
                oldDisplay = node.display;
                node.display = data.display;
                node.path[node.path.length - 1] = data.display;
                this.toLowerCasePath(node);
            }

            if (data.hasOwnProperty('nodeSubType')) {
                // updateRefs
                node.nodeSubType = data.nodeSubType;
            }

            if (data.hasOwnProperty('meta')) {
                for (var prop in data.meta) {
                    node.meta[prop] = data.meta[prop];
                }
            }
            this.recreateTags(node);
            this.checkUniqueDisplayUnderParent({
                parentNode: node.parentNode,
                display: data.display
            }, (err, exists) => {
                if (!!err || !!exists.exists) {
                    return cb({
                        err: 'Name already exists'
                    });
                }
                this.update({
                    query: {
                        _id: id
                    },
                    updateObj: node
                }, (err) => {
                    if (err) {
                        return cb(err);
                    }
                    this.updateChildrenPaths(id, node.path, cb);
                });
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
        cb([]);
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

    createHierarchy(cb) {
        const pointModel = new Point();
        const firstNode = 'IS2k';
        const nameSegments = ['name1', 'name2', 'name3', 'name4'];

        const getNextSegment = (segment) => {
            return nameSegments[nameSegments.indexOf(segment) + 1];
        };
        const createFolder = (parent, display, callback) => {
            let data = Config.Templates.getTemplate('Location');
            this.getNewId('Location', (err, upi) => {
                data._id = upi;
                data.display = display;
                data.parentNode = parent._id;
                data.nodeSubType = 'Area';
                this.checkUniqueDisplayUnderParent({
                    display,
                    parentNode: parent._id
                }, (err, exists) => {
                    if (!!exists.exists) {
                        this.getOne({
                            query: {
                                parentNode: parent._id,
                                display
                            }
                        }, callback);
                    } else {
                        this.add(data, callback);
                    }
                });
            });
        };
        const createPoint = (parent, point, display, callback) => {
            let data = {
                upi: point._id,
                parentNode: parent._id,
                display: display,
                nodeType: Config.Utility.getNodeType(point['Point Type'].Value),
                nodeSubType: point['Point Type'].Value
            };
            pointModel.addPointToHierarchy(data, (err, result) => {
                callback(err);
            });
        };
        const shelvePoints = (query, callback) => {
            this.updateAll({
                query,
                updateObj: {
                    $set: {
                        _pStatus: 4
                    }
                }
            }, callback);
        };
        const shelveScheduleEntries = (callback) => {
            shelvePoints({
                'Point Type.Value': 'Schedule Entry'
            }, callback);
        };
        const addScheduleEntries = (callback) => {
            this.iterateCursor({
                query: {
                    'Point Type.Value': 'Schedule Entry',
                    _pStatus: 4
                }
            }, (err, entry, nextEntry) => {
                let updateObj = {
                    $set: {
                        display: entry.Name,
                        _pStatus: Config.Enums['Point Statuses'].Active.enum
                    }
                };

                if (entry._parentUpi) {
                    updateObj.$set.parentNode = entry._parentUpi;
                } else {
                    updateObj.$set.parentNode = entry['Point Refs'][0].Value;
                }
                this.update({
                    query: {
                        _id: entry._id
                    },
                    updateObj
                }, (err, result) => {
                    nextEntry(err);
                });
            }, callback);
        };
        const createRoot = (callback) => {
            createFolder({
                _id: 0
            }, firstNode, callback);
        };
        const addFolders = (segment, parent, names, callback) => {
            // for each folder, add points then add folders for next segment (recursively)
            const nextSegment = getNextSegment(segment);
            if (!nextSegment) {
                return callback();
            }
            let field = segment;
            let query = _.cloneDeep(names);
            query['Point Type'] = {
                $exists: 1
            };
            query[segment] = {
                $exists: 1
            };
            query[nextSegment] = {
                $ne: ''
            };
            // console.log('f', field, JSON.stringify(query));
            this.distinct({
                field,
                query
            }, (err, folderNames) => {
                async.eachSeries(folderNames, (folder, nextFolder) => {
                    // console.log('folder:', folder);
                    createFolder(parent, folder, (err, nextParent) => {
                        names[segment] = folder;
                        doSegment(nextSegment, nextParent, names, nextFolder);
                    });
                }, (err) => {
                    if (!!err) {
                        console.log(err);
                    }
                    callback(err);
                });
            });
        };
        const addPoints = (segment, parent, names, callback) => {
            const nextSegment = getNextSegment(segment);
            let query = _.cloneDeep(names);
            query['Point Type'] = {
                $exists: 1
            };
            query[segment] = {
                $ne: ''
            };
            if (!!nextSegment) {
                query[nextSegment] = '';
            }
            // console.log('p', JSON.stringify(query));

            this.iterateCursor({
                query,
                fields: {
                    name1: 1,
                    name2: 1,
                    name3: 1,
                    name4: 1,
                    Name: 1,
                    'Point Type': 1
                }
            }, (err, point, nextPoint) => {
                // console.log('point:', point.Name);
                createPoint(parent, point, point[segment], (err) => {
                    nextPoint(err);
                });
            }, (err, count) => {
                // console.log(err, count);
                callback(err);
            });
        };
        const doSegment = (segment, parent, names, callback) => {
            parent = _.cloneDeep(parent);
            names = _.cloneDeep(names);
            addPoints(segment, parent, names, (err) => {
                addFolders(segment, parent, names, callback);
            });
        };
        const start = (callback) => {
            shelveScheduleEntries((err) => {
                createRoot((err, root) => {
                    doSegment(nameSegments[0], root, {}, (err) => {
                        addScheduleEntries(callback);
                    });
                });
            });
        };

        start(cb);
    }


    import(masterCb) {
        let locCount; // strip
        let locPrefix; // strip
        let importNodeName = 'IS2k';

        let doLog = true; // strip
        let self = this; // strip

        let SEGMENT1 = 1;
        let SEGMENT2 = 2;
        let SEGMENT3 = 3;
        let SEGMENT4 = 4;

        let nodeLookup = {};

        let ioPointTypes = ['Analog Input', 'Analog Output', 'Analog Value', 'Binary Input', 'Binary Output', 'Binary Value', 'Accumulator', 'MultiState Value'];

        let getNodeType = (pointType) => {
            let nodeType;

            if (!!~ioPointTypes.indexOf(pointType)) {
                nodeType = 'Point';
            } else {
                nodeType = 'Application';
            }
            return nodeType;
        };
        let makeId = () => {
            return locPrefix + locCount++;
        };
        let getInsertCriteria = (parentNode, path) => {
            return {
                insertObj: {
                    _id: makeId(),
                    _pStatus: 0,
                    parentNode: parentNode,
                    libraryId: 0,
                    refNode: 0,
                    nodeType: 'Location',
                    nodeSubType: 'Area',
                    path: path,
                    display: path[path.length - 1]
                }
            };
        };
        let importPoint = (point, cb) => {
            let i = 2;
            let name = point.name1;
            let path = [importNodeName];
            let pointType = point['Point Type'].Value;
            let uid;
            let parentNode;
            let criteria;

            while (!!name) {
                path.push(name);
                name = point['name' + i++];
            }

            uid = path.join('%');
            nodeLookup[uid] = point._id;

            parentNode = nodeLookup[path.slice(0, path.length - 1).join('%')] || nodeLookup[importNodeName];

            criteria = {
                query: {
                    _id: point._id
                },
                updateObj: {
                    $set: {
                        _pStatus: 0,
                        parentNode: parentNode,
                        nodeType: getNodeType(pointType),
                        nodeSubType: pointType,
                        path: path,
                        display: path[path.length - 1]
                    }
                }
            };

            this.update(criteria, cb);
        };
        let importPoints = (criteria, cb) => {
            this.iterateCursor(criteria, (err, point, callback) => {
                if (err) {
                    return callback(err);
                }
                importPoint(point, (err) => {
                    callback(err);
                });
            }, function done(err) {
                cb(err);
            });
        };
        let createFolder = (point, segment, cb) => {
            let path = [];
            let uid;
            let parentNode;
            let criteria;

            while (segment > 0) {
                path.push(point['name' + segment]);
                segment--;
            }
            path.push(importNodeName);
            path.reverse();
            uid = path.join('%');

            if (!nodeLookup[uid]) {
                parentNode = nodeLookup[path.slice(0, path.length - 1).join('%')] || nodeLookup[importNodeName];

                criteria = getInsertCriteria(parentNode, path);

                nodeLookup[uid] = criteria.insertObj._id;

                this.insert(criteria, cb);
            } else {
                cb();
            }
        };
        let createFolders = (criteria, segment, cb) => {
            this.iterateCursor(criteria, (err, point, callback) => {
                if (err) {
                    return callback(err);
                }
                createFolder(point, segment, (err) => {
                    // Our call stack was overflowing so we have to process on each event loop to limit call stack
                    process.nextTick(() => {
                        callback(err);
                    });
                });
            }, function done(err) {
                cb(err);
            });
        };
        let log = (msg) => {
            if (doLog) {
                logger.info(msg);
            }
        };

        log('Running hierarchy import');

        async.waterfall([
            // strip
            function getLocationCounter(cb) {
                let criteria = {
                    collection: 'counters',
                    query: {
                        _id: 'location'
                    }
                };

                log('Working on getLocationCounter');

                self.getOne(criteria, (err, location) => {
                    if (err) {
                        return cb(err);
                    }

                    locCount = location.count;
                    locPrefix = location.enum << 22;
                    cb(null);
                });
            },
            function shelveScheduleEntries(cb) {
                let criteria = {
                    query: {
                        'Point Type.Value': 'Schedule Entry'
                    },
                    updateObj: {
                        $set: {
                            _pStatus: 4
                        }
                    },
                    options: {
                        multi: true // strip
                    }
                };

                log('Working on shelveScheduleEntries');

                self.update(criteria, (err, results) => { // updateAll
                    cb(err);
                });
            },
            function createMasterImportNode(cb) {
                // All imported nodes go into this node we're creating now
                let criteria = getInsertCriteria(0, [importNodeName]);

                nodeLookup[importNodeName] = criteria.insertObj._id;

                log('Working on createMasterImportNode');

                self.insert(criteria, (err, results) => {
                    cb(err);
                });
            },
            function segment1Points(cb) {
                let criteria = {
                    query: {
                        _pStatus: 3,
                        name2: ''
                    }
                };

                log('Working on segment1_Points');

                importPoints(criteria, cb);
            },
            function segment1Folders(cb) {
                let criteria = {
                    field: 'name1',
                    query: {
                        _pStatus: 3
                    }
                };

                log('Working on segment1_Folders');

                self.distinct(criteria, (err, distinctName1s) => {
                    if (err) {
                        return cb(err);
                    }

                    async.each(distinctName1s, (name1, myCb) => {
                        createFolder({
                            name1: name1
                        }, SEGMENT1, myCb);
                    }, function done(err) {
                        cb(err);
                    });
                });
            },
            function segment2Points(cb) {
                let criteria = {
                    query: {
                        _pStatus: 3,
                        name3: ''
                    }
                };

                log('Working on segment2_Points');

                importPoints(criteria, cb);
            },
            function segment2Folders(cb) {
                let criteria = {
                    query: {
                        _pStatus: 3,
                        name3: {
                            $ne: ''
                        }
                    }
                };

                log('Working on segment2_Folders');

                createFolders(criteria, SEGMENT2, cb);
            },
            function segment3Points(cb) {
                let criteria = {
                    query: {
                        _pStatus: 3,
                        name4: ''
                    }
                };

                log('Working on segment3_Points');

                importPoints(criteria, cb);
            },
            function segment3Folders(cb) {
                let criteria = {
                    query: {
                        _pStatus: 3,
                        name4: {
                            $ne: ''
                        }
                    }
                };

                log('Working on segment3_Folders');

                createFolders(criteria, SEGMENT3, cb);
            },
            function segment4Points(cb) {
                let criteria = {
                    query: {
                        _pStatus: 3
                    }
                };

                log('Working on segment4_Points');

                importPoints(criteria, cb);
            },
            function unshelveScheduleEntries(cb) {
                let processSchedule = (schedule, myCb) => {
                    let $set = {};
                    let criteria = {
                        query: {
                            _id: schedule._id
                        },
                        updateObj: {
                            $set: $set
                        }
                    };

                    if (schedule._parentUpi) {
                        $set.parentNode = schedule._parentUpi;
                    } else {
                        $set.parentNode = schedule['Point Refs'][0].Value;
                    }
                    $set.display = schedule.Name;
                    $set._pStatus = 0;

                    self.update(criteria, myCb);
                };

                log('Working on unshelveScheduleEntries');

                self.iterateCursor({
                    query: {
                        _pStatus: 4
                    }
                }, (err, schedule, callback) => {
                    if (err) {
                        return callback(err);
                    }
                    processSchedule(schedule, (err) => {
                        callback(err);
                    });
                }, function done(err) {
                    cb(err);
                });


                // self.get({
                //     _pStatus: 4
                // }, (err, scheduleEntries) => {
                //     if (err) return cb(err);

                //     async.each(scheduleEntries, processSchedule, cb);
                // });
            },
            function updateLocationCounter(cb) {
                let criteria = {
                    collection: 'counters',
                    query: {
                        _id: 'location'
                    },
                    updateObj: {
                        $set: {
                            count: locCount
                        }
                    }
                };

                log('Working on updateLocationCounter');

                self.update(criteria, (err, results) => {
                    cb(err);
                });
            }
        ], function done(err) {
            if (!!err) {
                log('Error');
                log(JSON.stringify(err));
            } else {
                log('All done!');
            }
            masterCb(err);
        });
    }
};

module.exports = Hierarchy;
const Counter = require('./counter');
const Point = require('./point');
