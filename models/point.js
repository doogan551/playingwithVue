const async = require('async');
const ObjectID = require('mongodb').ObjectID;

const utils = require('../helpers/utils');
const logger = require('../helpers/logger')(module);
const Common = require('./common');
const Config = require('../public/js/lib/config.js');
const zmq = require('../helpers/zmq');

const READ = utils.CONSTANTS('READ');
const ACKNOWLEDGE = utils.CONSTANTS('ACKNOWLEDGE');
const CONTROL = utils.CONSTANTS('CONTROL');
const WRITE = utils.CONSTANTS('WRITE');

let distinctProperties = {}; // Temporary workaround to improve UI performance on app load

const Point = class Point extends Common {
    constructor() {
        super('points');
    }

    resolvePointRefs(matchStage, cb) {
        let stages = [{
            '$facet': {
                'Ref': [{
                    '$unwind': {
                        'path': '$Point Refs',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$lookup': {
                        'from': 'points',
                        'localField': 'Point Refs.Value',
                        'foreignField': '_id',
                        'as': 'refNames'
                    }
                }, {
                    '$unwind': {
                        'path': '$refNames'
                    }
                }, {
                    '$addFields': {
                        'Point Refs.PointPath': '$refNames.path',
                        'Point Refs.PointType': '$refNames.Point Type.eValue'
                    }
                }, {
                    '$group': {
                        '_id': '$_id',
                        'Point Refs': {
                            '$push': '$Point Refs'
                        }
                    }
                }],
                'Point': [{
                    '$sort': {
                        '_id': 1
                    }
                }],
                'Points': [{
                    '$project': {
                        'Point Refs': {
                            '$filter': {
                                'input': '$Point Refs',
                                'as': 'ref',
                                'cond': {
                                    '$eq': ['$$ref.Value', 0]
                                }
                            }
                        }
                    }
                }]
            }
        }, {
            '$unwind': {
                'path': '$Point'
            }
        }, {
            '$project': {
                'Ref': {
                    '$filter': {
                        'input': '$Ref',
                        'as': 'ref',
                        'cond': {
                            '$eq': ['$$ref._id', '$Point._id']
                        }
                    }
                },
                'Point': 1,
                'Points': 1
            }
        }, {
            '$unwind': {
                'path': '$Ref',
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$unwind': {
                'path': '$Points',
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$group': {
                '_id': '$Point._id',
                'Point': {
                    '$first': '$Point'
                },
                'Points': {
                    '$first': '$Points'
                },
                'refs': {
                    '$first': '$Ref'
                }
            }
        }, {
            '$addFields': {
                'Point.Point Refs': {
                    '$concatArrays': [{
                        '$cond': {
                            'if': {
                                '$ne': ['$refs', null]
                            },
                            'then': '$refs.Point Refs',
                            'else': []
                        }
                    }, '$Points.Point Refs']
                }
            }
        }, {
            '$replaceRoot': {
                'newRoot': '$Point'
            }
        }];
        let pipeline = [matchStage, ...stages];

        this.aggregate({
            pipeline: pipeline
        }, (err, points) => {
            if (err) {
                return cb(err);
            }
            points.forEach((point) => {
                point['Point Refs'].forEach((pointRef) => {
                    pointRef.PointName = Config.Utility.getPointName(pointRef.PointPath);
                    if (!pointRef.PointName) {
                        pointRef.PointName = '';
                    }
                    if (!pointRef.PointType) {
                        pointRef.PointType = '';
                    }
                });
            });
            return cb(null, points);
        });
    }

    extendPointRefProperties(refs, cb) {
        async.forEachSeries(refs, (ref, nextRef) => {
            if (ref.Value === 0) {
                return nextRef();
            }
            this.getOne({
                _id: ref.Value
            }, (err, refPoint) => {
                if (!!err || !refPoint) {
                    return nextRef(err);
                }
                ref.PointName = Config.Utility.getPointName(refPoint.path);
                ref.PointType = refPoint['Point Type'].eValue;
                ref.PointPath = refPoint.path;
                return nextRef();
            });
        }, (err) => {
            return cb(err, refs);
        });
    }

    getAllPointsById(data, cb) {
        let results = [];
        async.eachSeries(data.upis, (upi, nextUpi) => {
            this.getPointById({
                id: upi,
                user: data.user,
                resolvePointRefs: data.resolvePointRefs
            }, (err, message, point) => {
                results.push(point);
                nextUpi(err);
            });
        }, (err) => {
            return cb(err, results);
        });
    }

    getPointById(data, cb) {
        const security = new Security();
        let criteria = {
            pipeline: []
        };
        let upi = parseInt(data.id, 10);
        let point = null;

        let fixPoint = (permissions, results, callback) => {
            if (results.length) {
                point = results[0];
            }

            if (permissions === true || permissions.hasOwnProperty(upi)) {
                if (!point) {
                    return callback(null, 'No Point Found', null);
                }
                if (permissions !== true) {
                    point._pAccess = permissions[point._id];
                } else {
                    point._pAccess = 15;
                }

                return callback(null, null, point);
            }
            return callback('Permission Denied', null, null);
        };

        // Pipeline stages
        let matchStage = {
            $match: {
                _id: upi
            }
        };

        security.getPermissions(data.user, (err, permissions) => {
            if (data.resolvePointRefs) {
                this.resolvePointRefs(matchStage, (err, points) => {
                    if (err) {
                        return cb(err, null, null);
                    }
                    fixPoint(permissions, points, cb);
                });
            } else {
                criteria.pipeline.push(matchStage);
                this.aggregate(criteria, (err, points) => {
                    if (err) {
                        return cb(err, null, null);
                    }
                    fixPoint(permissions, points, cb);
                });
            }
        });
    }

    newPoint(data, cb) {
        let id = data.id || null;
        let pointType = !!data.pointType && JSON.stringify(decodeURI(data.pointType));
        let locals = {
            id: data.id || 0,
            name: JSON.stringify(''),
            pointType: pointType,
            selectedPointType: data.selectedPointType,
            pointTypes: JSON.stringify(Config.Utility.pointTypes.getAllowedPointTypes()),
            subType: (!!data.subType ? data.subType : -1)
        };
        let query = {
            _id: parseInt(id, 10)
        };
        let fields = {
            Name: 1,
            'Point Type.Value': 1,
            'Report Type.eValue': 1,
            'Sensor Type.eValue': 1
        };

        if (id) {
            this.getOne({
                query: query,
                fields: fields
            }, (err, point) => {
                if (err) {
                    return cb(err, null);
                }

                if (point.hasOwnProperty('Report Type')) {
                    locals.subType = JSON.stringify(point['Report Type'].eValue);
                } else if (point.hasOwnProperty('Sensor Type')) {
                    locals.subType = JSON.stringify(point['Sensor Type'].eValue);
                }

                locals.name = JSON.stringify(point.Name.replace('\'', '\\\''));
                locals.pointType = JSON.stringify(point['Point Type'].Value);

                return cb(null, locals);
            });
        } else {
            return cb(null, locals);
        }
    }

    pointLookup(data, cb) {
        let property = data.property && decodeURI(data.property);
        let pointType = (data.pointType && data.pointType !== 'null' && decodeURI(data.pointType)) || null;
        let pointTypes = Config.Utility.pointTypes.getAllowedPointTypes(property, pointType);
        let deviceId = data.deviceId || null;
        let remoteUnitId = data.remoteUnitId || null;
        let locals = {
            mode: JSON.stringify(data.mode),
            modes: JSON.stringify(data.modes),
            point: '{}',
            pointType: JSON.stringify(pointType),
            pointtypes: JSON.stringify(pointTypes),
            groupId: JSON.stringify(null),
            deviceId: JSON.stringify(deviceId),
            remoteUnitId: JSON.stringify(remoteUnitId)
        };

        cb(locals);
    }

    search(data, cb) {
        // Do we have a device ID?
        let deviceId = data.deviceId || null;
        // Do we have a RU ID?
        let remoteUnitId = data.remoteUnitId || null;
        // Do we have a point type?
        let pointType = data.pointType || null;

        // Show only active points by default
        // 0 = Active
        // 1 = Inactive
        // 2 = Deleted
        let includeSoftDeletedPoints = data.showDeleted || false;
        let includeInactivePoints = data.showInactive || false;
        //limit query to 200 by default
        let limit = data.limit || 200;
        // If no point type array passed in, use default
        let pointTypes = data.pointTypes || Config.Utility.pointTypes.getAllowedPointTypes().map((type) => {
            return type.key;
        });
        // Name segments, sort names and values
        let nameSegments = [{
            name: '_name1',
            value: data.name1 && data.name1.toLowerCase()
        }, {
            name: '_name2',
            value: data.name2 && data.name2.toLowerCase()
        }, {
            name: '_name3',
            value: data.name3 && data.name3.toLowerCase()
        }, {
            name: '_name4',
            value: data.name4 && data.name4.toLowerCase()
        }];
        // First projection. Provides lowercase values for sorting
        let projection = {
            _id: 1,
            _pStatus: 1,
            'Point Type.Value': 1,
            name1: 1,
            name2: 1,
            name3: 1,
            name4: 1,
            _parentUpi: 1
        };
        // sort
        let sort = {
            _name1: 1,
            _name2: 1,
            _name3: 1,
            _name4: 1
        };

        let buildQuery = () => {
            let query = {},
                segment,
                _pStatus = 0;

            if (pointTypes.length === 1 && pointTypes[0] === 'Sensor') {
                if (pointType === 'Analog Input' || pointType === 'Analog Output') {
                    query['Sensor Type.Value'] = pointType.split(' ')[1];
                }
            }

            if (pointTypes instanceof Array) {
                query['Point Type.Value'] = {
                    $in: pointTypes
                };
            }

            if (!!deviceId) {
                query.$and = [{
                    'Point Refs.PointInst': parseInt(deviceId, 10)
                }, {
                    'Point Refs.PropertyName': 'Device Point'
                }];
                if (!!remoteUnitId) {
                    query.$and.push({
                        'Point Refs.PointInst': parseInt(remoteUnitId, 10)
                    });
                    query.$and.push({
                        'Point Refs.PropertyName': 'Remote Unit Point'
                    });
                }
            }

            for (let i = 0, last = nameSegments.length; i < last; i++) {
                segment = nameSegments[i];
                if (typeof segment.value === 'string') {
                    if (segment.value.length) {
                        query[segment.name] = utils.getRegex(segment.value.toLowerCase(), {
                            matchBeginning: true
                        });
                        // if (segment.value.indexOf('*') < 0) {
                        //   query[segment.name] = new RegExp(['^', segment.value.toLowerCase()].join(''));
                        // } else {
                        //   query[segment.name] = utils.convertRegexWildcards(segment.value.toLowerCase());
                        // }
                    }
                } else {
                    query[segment.name] = '';
                }
            }

            // JSON.parse because these letiables are received as strings
            if (JSON.parse(includeInactivePoints)) {
                _pStatus = 3;
            } else if (JSON.parse(includeSoftDeletedPoints)) {
                _pStatus = 2;
            }

            query._pStatus = _pStatus;

            return query;
        };


        let criteria = {
            query: buildQuery(),
            sort: sort,
            limit: limit,
            fields: projection,
            data: data,
            count: false
        };

        this.getWithSecurity(criteria, (err, points, count) => {
            points.forEach((point) => {
                point.pointType = point['Point Type'].Value;
            });
            return cb(err, points, count);
        });
    }

    getDistinctValues(data, cb) {
        // data is an array of objects indicating the properties for which you want unique Values:
        // [{
        //   property: 'Active Value',
        //   valueTypes: [2,5] // Get distincts for these value types; use empty array or do not include for all unique values regardless of value type
        // }]
        let distinct = [];
        let getDistinct = (item, cb) => {
            if (distinctProperties[item.property]) { // Temporary workaround to improve UI performance on app load
                distinct.push(distinctProperties[item.property]);
                return cb(null);
            }

            let criteria = {
                    field: item.property + '.Value',
                    query: {}
                },
                valueTypes = item.valueTypes || [];

            if (valueTypes.length) {
                criteria.query.$or = [];
                valueTypes.forEach((valueType) => {
                    let obj = {};
                    obj[item.property + '.' + 'ValueType'] = valueType;
                    criteria.query.$or.push(obj);
                });
            }

            this.distinct(criteria, (err, results) => {
                let obj = {
                    property: item.property,
                    distinct: results
                };
                distinct.push(obj);
                distinctProperties[item.property] = obj; // Temporary workaround to improve UI performance on app load
                cb(err);
            });
        };

        async.each(data.distinct, getDistinct, (err) => {
            // cb(err, distinct);
            this.update({
                collection: 'dev',
                query: {
                    item: 'distinct'
                },
                updateObj: {
                    $set: {
                        values: distinct
                    }
                }
            }, (err) => {
                cb(err, distinct);
            });
        });
    }

    getDistinctValuesTemp(data, cb) {
        this.getOne({
            collection: 'dev',
            query: {
                item: 'distinct'
            }
        }, (err, results) => {
            if (!results || !results.values.length) {
                this.getDistinctValues(data, cb);
            } else {
                cb(err, results.values);
            }
        });
    }

    globalSearch(data, cb) {
        // data = {
        //   searchTerms: [{
        //     expression: string,
        //     isEquation: bool,
        //     isInvalid: bool,
        //     operator: string,
        //     value: string or int,
        //     property: string
        //   }],
        //   reqID: string,
        //   limit: int,
        //   skip: int
        // }

        let criteria = {
            query: {
                $and: []
            },
            fields: {
                _id: 1,
                _pStatus: 1,
                'Point Type.Value': 1,
                Name: 1
            },
            data: data,
            _skip: data.skip || 0,
            _limit: data.limit || 200
        };
        let $and = criteria.query.$and;
        let operatorMap = {
            ':': '$eq',
            '=': '$eq',
            '<>': '$ne',
            '!=': '$ne',
            '>': '$gt',
            '>=': '$gte',
            '<': '$lt',
            '<=': '$lte'
        };
        let searchTerm;
        let key;
        let query;
        let preQuery;
        let operator;

        for (key in data.searchTerms) {
            searchTerm = data.searchTerms[key];
            query = {};
            preQuery = null;

            if (searchTerm.isInvalid) {
                continue; // Do not add this search term to our query
            }

            if (searchTerm.isEquation) {
                if (searchTerm.value === 'true') {
                    searchTerm.value = true;
                } else if (searchTerm.value === 'false') {
                    searchTerm.value = false;
                } else if (!isNaN(+searchTerm.value)) {
                    searchTerm.value = +searchTerm.value;
                }
                operator = operatorMap[searchTerm.operator];
                query[searchTerm.expression] = {};
                query[searchTerm.expression][operator] = searchTerm.value;

                if (operator === '$ne') {
                    // For not-equal-to operations, we need to make sure the top-level property exists because Mongo returns
                    // documents that do not include the field. For example, 'Alarm High Limit.Value' != 100 returns documents
                    // that don't have the 'Alarm High Limit' property
                    preQuery = {};
                    preQuery[searchTerm.property] = {
                        $exists: true
                    };
                }
            } else {
                query._Name = {
                    $regex: utils.getRegex(searchTerm.expression.toLowerCase())
                };
            }

            if (preQuery) {
                $and.push(preQuery);
            }
            $and.push(query);
        }

        this.getWithSecurity(criteria, cb);

        // return cb(null, [data.searchTerms]);
        // (req, res, next) =>{
        //   let db, tags, query;
        //   db = req.database;
        //   tags = (!!req.body.tags) ? req.body.tags : [];
        //   qTags = (!!req.params.tags) ? req.params.tags : [];
        //   qTags = qTags.split(/[ _]+/);
        //   tags = tags.concat(qTags);
        //   for (let i = 0; i < tags.length; i++) {
        //     tags[i] = new RegExp("^" + tags[i], 'i');
        //   }
        //   query = {
        //     taglist: {
        //       $all: tags
        //     }
        //   };
        //   console.log(query);
        //   db.collection(pointsCollection).find(query, {
        //     Name: 1,
        //     "Point Type": 1
        //   }).limit(25).sort({Name:1}).toArray((err, results) =>{
        //     async.forEach(results, (result, cb) =>{
        //       result.pointType = result["Point Type"].Value;
        //       cb(null);
        //     }, (err) =>{
        //       return utils.sendResponse(res, results);
        //     });
        //   });
        // }
    }

    searchDependencies(data, cb) {
        let returnObj = {
            target: {},
            'Point Refs': [],
            'Dependencies': []
        };
        let addAppIndex = (buildObject, pointRef) => {
            let propName = pointRef.PropertyName;
            if (propName === 'Point Register') {
                buildObject.extendedProperty = [propName, ' ', pointRef.AppIndex].join('');
            }
            return;
        };

        let upi = parseInt(data.upi, 10);
        let notInHierarchy = this.getDefault(data.notInHierarchy, false);

        let criteria = {
            query: {
                _id: upi
            }
        };

        this.getOne(criteria, (err, targetPoint) => {
            if (err) {
                return cb(err);
            }
            if (!targetPoint) {
                return cb('Point not found.');
            }

            returnObj.target.path = targetPoint.path;
            returnObj.target['Point Type'] = targetPoint['Point Type'].Value;

            async.eachSeries(targetPoint['Point Refs'], (pointRef, callback) => {
                buildPointRefs(pointRef.Value, notInHierarchy, (err, ref, device) => {
                    if (err || !ref) {
                        return callback(err);
                    }
                    let obj = {
                        _id: pointRef.Value,
                        Name: pointRef.Name,
                        Property: pointRef.PropertyName,
                        'Point Type': (ref !== null) ? ref['Point Type'].Value : null,
                        path: (ref !== null) ? ref.path : [],
                        _pStatus: (ref !== null) ? ref._pStatus : null,
                        Device: (device !== null) ? {
                            Name: device.path,
                            _id: device._id,
                            _pStatus: device._pStatus,
                            path: device.path
                        } : null
                    };
                    addAppIndex(obj, pointRef);
                    returnObj['Point Refs'].push(obj);
                    callback(err);
                });
            }, (err) => {
                let criteria = {
                    query: {
                        'Point Refs.PointInst': upi,
                        _pStatus: (!!notInHierarchy) ? Config.Enums['Point Statuses'].NotInHierarchy.enum : {
                            $ne: Config.Enums['Point Statuses'].NotInHierarchy.enum
                        }
                    }
                };
                this.get(criteria, (err, dependencies) => {
                    if (err) {
                        return cb(err);
                    }

                    async.eachSeries(dependencies, (dependency, depCB) => {
                        let deviceUpi = 0;
                        let matchedDependencies = [];

                        for (let m = 0; m < dependency['Point Refs'].length; m++) {
                            if (dependency['Point Refs'][m].PropertyName === 'Device Point' && dependency['Point Refs'][m].Value !== 0) {
                                deviceUpi = dependency['Point Refs'][m].Value;
                            }
                            if (dependency['Point Refs'][m].PropertyName === 'Sequence Device' && dependency['Point Refs'][m].Value !== 0) {
                                deviceUpi = dependency['Point Refs'][m].Value;
                            }
                            if (dependency['Point Refs'][m].Value === upi) {
                                matchedDependencies.push(dependency['Point Refs'][m]);
                            }
                        }
                        async.eachSeries(matchedDependencies, (depPointRef, depPRCB) => {
                            if (depPointRef.Value === upi) {
                                if (dependency['Point Type'].Value === 'Schedule Entry' && depPointRef.PropertyName === 'Control Point') {
                                    if (dependency._parentUpi === 0) {
                                        returnObj['Point Refs'].push({
                                            _id: 0,
                                            Property: depPointRef.PropertyName,
                                            'Point Type': dependency['Point Type'].Value,
                                            path: [],
                                            Name: '',
                                            _pStatus: null,
                                            Device: null
                                        });
                                        depPRCB(null);
                                    } else {
                                        criteria = {
                                            query: {
                                                _id: dependency._parentUpi
                                            }
                                        };

                                        this.getOne(criteria, (err, schedule) => {
                                            returnObj.Dependencies.push({
                                                _id: schedule._id,
                                                Name: schedule.Name,
                                                Property: depPointRef.PropertyName,
                                                'Point Type': schedule['Point Type'].Value,
                                                path: schedule.path,
                                                _pStatus: schedule._pStatus,
                                                Device: null
                                            });
                                            depPRCB(null);
                                        });
                                    }
                                } else {
                                    findDevicePoint(deviceUpi, (err, device) => {
                                        if (err) {
                                            return depPRCB(err);
                                        }
                                        let obj = {
                                            _id: dependency._id,
                                            Name: dependency.Name,
                                            Property: depPointRef.PropertyName,
                                            'Point Type': dependency['Point Type'].Value,
                                            _pStatus: dependency._pStatus,
                                            path: dependency.path,
                                            Device: (device !== null) ? {
                                                _id: device._id,
                                                path: device.path,
                                                _pStatus: device._pStatus,
                                                Name: device.Name
                                            } : null
                                        };
                                        addAppIndex(obj, depPointRef);
                                        returnObj.Dependencies.push(obj);
                                        depPRCB(null);
                                    });
                                }
                            } else {
                                setTimeout(() => {
                                    depPRCB(null);
                                }, 0);
                            }
                        }, (err) => {
                            depCB(err);
                        });
                    }, (err) => {
                        return cb(err, returnObj);
                    });
                });
            });
        });

        let buildPointRefs = (upi, notInHierarchy, callback) => {
            let deviceUpi = 0;
            if (upi !== 0) {
                let criteria = {
                    query: {
                        _id: upi,
                        _pStatus: (!!notInHierarchy) ? Config.Enums['Point Statuses'].NotInHierarchy.enum : {
                            $ne: Config.Enums['Point Statuses'].NotInHierarchy.enum
                        }
                    },
                    fields: {
                        _pStatus: 1,
                        'Point Refs': 1,
                        'Point Type': 1,
                        Name: 1,
                        path: 1
                    }
                };
                this.getOne(criteria, (err, ref) => {
                    if (err || !ref) {
                        return callback(err);
                    }
                    for (let m = 0; m < ref['Point Refs'].length; m++) {
                        if (ref['Point Refs'][m].PropertyName === 'Device Point' && ref['Point Refs'][m].Value !== 0) {
                            deviceUpi = ref['Point Refs'][m].Value;
                        }
                    }
                    findDevicePoint(deviceUpi, (err, device) => {
                        callback(err, ref, device);
                    });
                });
            } else {
                callback(null, null, null);
            }
        };

        let findDevicePoint = (upi, callback) => {
            if (upi !== 0) {
                let criteria = {
                    query: {
                        _id: upi
                    },
                    fields: {
                        path: 1,
                        Name: 1,
                        _pStatus: 1
                    }
                };
                this.getOne(criteria, callback);
            } else {
                callback(null, null);
            }
        };
    }

    getNames(data, cb) {
        let upis = data.upis;
        async.map(upis, (upi, callback) => {
            let criteria = {
                query: {
                    _id: upi * 1,
                    _pStatus: 0
                },
                fields: {
                    Name: 1,
                    path: 1
                }
            };
            this.getOne(criteria, callback);
        }, cb);
    }

    rebuildName(point) {
        point._name1 = (point.name1) ? point.name1.toLowerCase() : '';
        point._name2 = (point.name2) ? point.name2.toLowerCase() : '';
        point._name3 = (point.name3) ? point.name3.toLowerCase() : '';
        point._name4 = (point.name4) ? point.name4.toLowerCase() : '';

        point.Name = '';

        if (point.name1) {
            point.Name += point.name1;
        }
        if (point.name2) {
            point.Name = point.Name + '_' + point.name2;
        }
        if (point.name3) {
            point.Name = point.Name + '_' + point.name3;
        }
        if (point.name4) {
            point.Name = point.Name + '_' + point.name4;
        }

        point._Name = point.Name.toLowerCase();
    }

    initPoint(data, cb) {
        const alarmDefs = new AlarmDefs();
        const system = new System();
        const counterModel = new Counter();
        const hierarchyModel = new Hierarchy();

        let criteria = {};

        let path = data.path;
        let subType = (data.pointSubType ? data.pointSubType : {});

        let display = data.display;
        let uuid = this.getUuid();
        let parentNode = this.getDefault(data.parentNode, 0);
        let pointType = data.pointType;
        let targetUpi = this.getDefault(data.targetUpi, 0);
        let parentUpi = this.getDefault(data.parentUpi, 0);
        let parentPath = data.parentPath;

        let doInitPoint = (pointType, targetUpi, subType, callback) => {
            system.getSystemInfoByName('Preferences', (err, sysInfo) => {
                if (err) {
                    return callback(err);
                }

                if (pointType === 'Schedule Entry') {
                    display = `${pointType}_${uuid}`;
                }

                if (targetUpi && targetUpi !== 0) {
                    criteria = {
                        query: {
                            _id: targetUpi
                        }
                    };

                    this.getOne(criteria, (err, targetPoint) => {
                        if (err) {
                            return cb(err);
                        }

                        if (!targetPoint) {
                            return callback('Target point not found.');
                        }

                        fixPoint(targetPoint, true, sysInfo, callback);
                    });
                } else {
                    fixPoint(Config.Templates.getTemplate(pointType), false, sysInfo, callback);
                }
            });
        };

        let cloneGPLSequence = (oldSequence, callback) => {
            async.eachSeries(oldSequence.SequenceData.sequence.block, (block, acb) => {
                if (block.upi === undefined || block.upi === 0) {
                    acb(null);
                } else {
                    doInitPoint(null, block.upi, null, (err, point) => {
                        if (err) {
                            acb(err);
                        } else {
                            block.upi = point._id;
                            acb(null);
                        }
                    });
                }
            }, callback);
        };

        let setIpPort = (point, callback) => {
            system.getSystemInfoByName('Preferences', (err, prefs) => {
                let ipPort = prefs['IP Port'];
                if (point['Point Type'].Value === 'Device') {
                    point['Ethernet IP Port'].Value = ipPort;
                    point['Downlink IP Port'].Value = ipPort;
                } else if (point['Point Type'].Value === 'Remote Unit' && [5, 9, 10, 11, 12, 13, 14, 16].indexOf(point['Model Type'].eValue) < 0) {
                    point['Ethernet IP Port'].Value = ipPort;
                }
                return callback();
            });
        };

        let fixPoint = (template, isClone, sysInfo, callback) => {
            template.id = display.toString() + uuid;
            template.display = display;
            template._pStatus = Config.Enums['Point Statuses'].Inactive.enum;
            template._actvAlmId = ObjectID('000000000000000000000000');
            template._cfgRequired = true;


            switch (pointType) {
                case 'Report':
                    if (subType.eValue === undefined) { // subType passed in from initPoint
                        subType.Value = template['Report Type'].Value;
                        subType.eValue = template['Report Type'].eValue;
                    }
                    break;
                case 'Sensor':
                    if (subType.eValue === undefined) { // subType passed in from initPoint
                        subType.Value = template['Sensor Type'].Value;
                        subType.eValue = template['Sensor Type'].eValue;
                    }
                    break;
                case 'Display': // default background color for new Displays
                    template['Background Color'] = Config.Templates.getTemplate('Display')['Background Color'];
                    break;
                default:
                    subType.eValue = 0; // TODO
                    break;
            }

            utils.setupNonFieldPoints(template);

            this.getOne({
                query: {
                    _id: parentNode
                }
            }, (err, parent) => {
                if (!!parent) {
                    template.path = [...parent.path, template.display];
                } else if (!!parentPath) {
                    template.path = [...parentPath, template.display];
                } else {
                    template.path = [template.display];
                }
                this.toLowerCasePath(template);
                template.parentNode = parentNode;

                console.log('isClone', isClone);
                if (!isClone) {
                    template.nodeType = Config.Utility.getNodeType(pointType);
                    // update device template here
                    // get telemetry ip port and set ethernet ip port and downlink ip port
                    // rmu - model type nin[5, 9, 10, 11, 12, 13, 14, 16] set ethernet ip port
                    setIpPort(template, () => {
                        if (template['Point Type'].Value === 'Sensor') {
                            template['Sensor Type'].Value = (subType) ? subType.Value : 'Input';
                            template['Sensor Type'].eValue = (subType) ? parseInt(subType.eValue, 10) : 0;
                        } else if (template['Point Type'].Value === 'Report') {
                            template['Report Type'].Value = (subType) ? subType.Value : 'Property';
                            template['Report Type'].eValue = (subType) ? parseInt(subType.eValue, 10) : 0;
                        }

                        if (template['Point Type'].Value === 'Device') {
                            template['Time Zone'].eValue = sysInfo['Time Zone'];
                            template['Time Zone'].Value = Config.revEnums['Time Zones'][sysInfo['Time Zone']];
                        }

                        alarmDefs.getSystemAlarms((err, alarmDefs) => {
                            if (err) {
                                return callback(err);
                            }
                            if (template['Alarm Messages'] !== undefined) {
                                for (let i = 0; i < template['Alarm Messages'].length; i++) {
                                    for (let j = 0; j < alarmDefs.length; j++) {
                                        if (template['Alarm Messages'][i].msgType === alarmDefs[j].msgType) {
                                            template['Alarm Messages'][i].msgId = alarmDefs[j]._id.toString();
                                        }
                                    }
                                }
                            }


                            system.getSystemInfoByName('Preferences', (err, sysInfo) => {
                                if (err) {
                                    return callback(err);
                                }
                                if (template['Quality Code Enable'] !== undefined) {
                                    template['Quality Code Enable'].Value = sysInfo['Quality Code Default Mask'];
                                }
                                addTemplateToDB(template, callback);
                            });
                        });
                    });
                } else {
                    // if cloned from "old" point schema

                    template.Name = '';
                    template._Name = '';
                    template._oldUpi = 0;
                    template._id = 0;

                    if (!!template.name1) {
                        template.name1 = '';
                        template.name2 = '';
                        template.name3 = '';
                        template.name4 = '';
                        template._name1 = '';
                        template._name2 = '';
                        template._name3 = '';
                        template._name4 = '';
                    }


                    if (template['Point Type'].Value !== 'Schedule Entry' && template._parentUpi !== 0) {
                        template._parentUpi = 0;
                        for (let i = 0; i < template['Point Refs'].length; i++) {
                            template['Point Refs'][i].isReadOnly = false;
                        }
                    }
                    this.extendPointRefProperties(template['Point Refs'], (err, refs) => {
                        addTemplateToDB(template, callback);
                    });
                    // does this even get called? is it suppose to?
                    if (['Analog Output', 'Analog Value', 'Binary Output', 'Binary Value'].indexOf(template['Point Type'].Value) >= 0) {
                        template['Control Array'] = [];
                    }
                }
            });
        };

        let addTemplateToDB = (template, callback) => {
            // criteria = {
            //     insertObj: template
            // };
            // this.insert(criteria, (err) => {
            return callback(null, template);
            // });
        };
        hierarchyModel.checkUniqueDisplayUnderParent({
            display,
            parentNode
        }, (err, exists) => {
            if (!!err) {
                return cb(err);
            } else if (!!exists.exists) {
                return cb('Label already exists under node');
            }
            doInitPoint(pointType, targetUpi, subType, cb);
        });
    }

    getPointRefsSmall(data, cb) {
        let searchCriteria = {};
        let filterProps = {
            Value: 1,
            'Point Type': 1,
            'Point Refs': 1,
            path: 1
        };

        let upi = data.upi;

        searchCriteria._id = parseInt(upi, 10);
        searchCriteria._pStatus = {
            $in: [0, 1]
        };

        let criteria = {
            query: searchCriteria,
            fields: filterProps
        };

        this.getOne(criteria, (err, point) => {
            if (err) {
                return cb(err);
            }
            if (point === null) {
                return cb(null, 'No point found.');
            }

            return cb(null, null, point);
        });
    }

    getPointRefsInstance(data, cb) {
        this.getPointRefsSmall(data, (err, msg, result) => {
            if (!!err) {
                return cb(err);
            } else if (!!result) {
                return cb(null, null, result);
            }
            let filterProps = {
                Value: 1,
                'Point Type': 1,
                'Point Refs': 1,
                path: 1
            };
            let criteria = {
                query: {
                    'Instance.Value': Config.Utility.getInstanceFromId(data.upi),
                    'Point Type.Value': 'Remote Unit',
                    'Point Refs': {
                        $elemMatch: {
                            'PointInst': parseInt(data.device, 10),
                            'PropertyName': 'Device Point'
                        }
                    }
                },
                fields: filterProps
            };

            this.getOne(criteria, (err, point) => {
                if (err) {
                    return cb(err);
                }
                if (point === null) {
                    return cb(null, 'No point found.');
                }

                return cb(null, null, point);
            });
        });
    }

    findAlarmDisplays(data, cb) {
        const security = new Security();
        let criteria = {};
        let alarmDisplayPointCriteria = {};
        let firstSearch = {};
        let thirdSearch = {};
        let displays = [];
        let upi = parseInt(data.upi, 10);
        let secondSearch = {
            'Point Type.Value': 'Display'
        };
        let doSecondSearch = (targetPoint, callback) => {
            secondSearch['Point Refs.Value'] = targetPoint._id;
            criteria = {
                query: secondSearch,
                fields: {
                    Name: 1,
                    path: 1
                },
                data: data
            };
            this.getWithSecurity(criteria, (err, references) => {
                async.eachSeries(references, (ref, acb) => {
                    ref.Name = Config.Utility.getPointName(ref.path);
                    displays.push(ref);
                    acb(null);
                }, callback);
            });
        };
        let getAlarmDisplayPoint = (alarmDisplayPointCriteria) => {
            this.getOne(alarmDisplayPointCriteria, (err, alarmDisplayPoint) => {
                if (err) {
                    cb(err);
                } else {
                    displays.push({
                        _id: alarmDisplayPoint._id,
                        Name: Config.Utility.getPointName(alarmDisplayPoint.path)
                    });
                }
            });
        };

        firstSearch._id = upi;

        criteria = {
            query: firstSearch,
            fields: {
                Name: 1,
                path: 1,
                'Point Refs': 1
            }
        };

        this.getOne(criteria, (err, targetPoint) => {
            if (err) {
                cb(err);
            }

            if (targetPoint !== null) {
                for (let i = 0; i < targetPoint['Point Refs'].length; i++) {
                    if (targetPoint['Point Refs'][i].PropertyName === 'Alarm Display Point') {
                        if (targetPoint['Point Refs'][i].Value !== 0) {
                            alarmDisplayPointCriteria.query = {
                                _id: targetPoint['Point Refs'][i].Value,
                                'Point Type.Value': 'Display'
                            };

                            alarmDisplayPointCriteria.fields = {
                                Name: 1,
                                path: 1,
                                _id: 1
                            };

                            getAlarmDisplayPoint(alarmDisplayPointCriteria);
                        }
                        break;
                    }
                }

                thirdSearch._id = (displays.length > 0) ? displays[0]._id : 0;
                if (thirdSearch._id !== 0) {
                    criteria = {
                        query: thirdSearch,
                        fields: {
                            _id: 1
                        }
                    };

                    security.getPermissions(data.user, (err, permissions) => {
                        this.getOne(criteria, (err, point) => {
                            if (err) {
                                return cb(err);
                            }
                            if (!point || permissions === false || !permissions.hasOwnProperty(thirdSearch._id)) {
                                displays = [];
                            }
                            doSecondSearch(targetPoint, (err) => {
                                return cb(err, displays);
                            });
                        });
                    });
                } else {
                    doSecondSearch(targetPoint, (err) => {
                        return cb(err, displays);
                    });
                }
            } else {
                return cb('Point not found.');
            }
        });
    }

    getControls(data, cb) {
        let searchCriteria = {};
        let filterProps = {
            'Control Array': 1
        };

        let upi = data.upi;

        searchCriteria._id = parseInt(upi, 10);

        let criteria = {
            query: searchCriteria,
            fields: filterProps
        };

        this.getOne(criteria, (err, point) => {
            if (err) {
                return cb(err);
            }
            return cb(null, point);
        });
    }

    //io, updateSequencePoints, runScheduleEntry(tcp), updateDependencies
    newUpdate(oldPoint, newPoint, flags, user, callback) {
        const security = new Security();
        const script = new Script();
        const activityLog = new ActivityLog();
        let generateActivityLog = false,
            updateReferences = false,
            updateModelType = false,
            updateCfgReq = false,
            downloadPoint = false,
            updateDownlinkNetwk = false,
            configRequired,
            updateObject = {},
            //activityLogObject = {},
            activityLogObjects = [],
            readOnlyProps,
            executeTOD = false,
            logData = {
                user: user,
                timestamp: Date.now(),
                point: newPoint
            },
            // Have to store the refs before removal because the point inspector expects the point refs to be returned correctly
            refsStore = _.cloneDeep(newPoint['Point Refs']);

        readOnlyProps = ['_id', '_cfgDevice', '_updTOD', '_pollTime', '_pAccess',
            '_forceAllCOV', '_actvAlmId', 'Alarm State', 'Control Pending', 'Device Status',
            'Last Report Time', 'Point Type', 'Reliability'
        ];
        // JDR - Removed "Authorized Value" from readOnlyProps because it changes when ValueOptions change. Keep this note.

        let updatePointRefProperties = (_point) => {
            let refs = _point['Point Refs'];
            for (var r = 0; r < refs.length; r++) {
                let ref = refs[r];
                for (var s = 0; s < refsStore.length; s++) {
                    let storedRef = refsStore[s];

                    if (ref.PropertyEnum === storedRef.PropertyEnum && ref.AppIndex === storedRef.AppIndex) {
                        ref.PointName = storedRef.PointName;
                        ref.PointType = storedRef.PointType;
                        break;
                    }
                }
            }
            _point['Point Refs'] = refs;
        };

        this.getOne({
            query: {
                _id: newPoint._id
            },
            fields: {
                _pStatus: 1,
                _id: 0
            }
        }, (err, dbPoint) => {
            if (err) {
                return callback({
                    err: err
                }, null);
            } else if (!dbPoint) {
                return callback({
                    err: 'Point not found: ' + newPoint._id
                }, null);
            } else if (dbPoint._pStatus === Config.Enums['Point Statuses'].Deleted.enum) {
                return callback({
                    err: 'Point deleted: ' + newPoint._id
                }, null);
            }

            configRequired = newPoint._cfgRequired;


            // TODO should this be === or !== ? - probably !== since it is used again
            if (flags.method !== null) {
                if (oldPoint._pStatus === Config.Enums['Point Statuses'].Active.enum && newPoint._pStatus === Config.Enums['Point Statuses'].Active.enum) {
                    generateActivityLog = true;
                } else if (oldPoint._pStatus === Config.Enums['Point Statuses'].Inactive.enum && newPoint._pStatus === Config.Enums['Point Statuses'].Active.enum) {
                    if (flags.method === 'restore') {
                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                            log: 'Point restored',
                            activity: 'Point Restore'
                        }));
                    } else {
                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                            log: 'Point added',
                            activity: 'Point Add'
                        }));
                    }
                } else if (oldPoint._pStatus === Config.Enums['Point Statuses'].Active.enum && newPoint._pStatus === Config.Enums['Point Statuses'].Inactive.enum) {
                    if (flags.method === 'hard') {
                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                            log: 'Point destroyed',
                            activity: 'Point Hard Delete'
                        }));
                    } else if (flags.method === 'soft') {
                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                            log: 'Point deleted',
                            activity: 'Point Soft Delete'
                        }));
                    }
                } else if (newPoint.Name !== oldPoint.Name) {
                    activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                        log: 'Point renamed from ' + oldPoint.Name + ' to ' + newPoint.Name,
                        activity: 'Point Restore'
                    }));
                }
            }

            let compare = (a, b) => {
                return a * 1 > b * 1;
            };

            let updateProperties = () => {
                for (let prop in newPoint) {
                    if (readOnlyProps.indexOf(prop) === -1) {
                        // sort enums first
                        if (newPoint[prop].hasOwnProperty('ValueOptions')) {
                            let options = newPoint[prop].ValueOptions;

                            let newOptions = {};
                            let temp = [];
                            for (let stringVal in options) {
                                temp.push(options[stringVal]);
                            }
                            temp.sort(compare);
                            for (let key = 0; key < temp.length; key++) {
                                for (let property in options) {
                                    if (options[property] === temp[key]) {
                                        newOptions[property] = options[property];
                                    }
                                }
                            }
                            newPoint[prop].ValueOptions = newOptions;
                        }

                        // this will compare Slides and Point Refs arrays.
                        if (!_.isEqual(newPoint[prop], oldPoint[prop])) {
                            logger.info(newPoint._id, prop);
                            logData.activity = 'Point Property Edit';
                            logData.prop = prop;
                            logData.oldValue = {
                                Value: oldPoint[prop].Value
                            };
                            logData.newValue = {
                                Value: newPoint[prop].Value
                            };
                            if (newPoint[prop].eValue !== undefined) {
                                logData.newValue.eValue = newPoint[prop].eValue;
                            }
                            if (oldPoint[prop].eValue !== undefined) {
                                logData.oldValue.eValue = oldPoint[prop].eValue;
                            }

                            switch (prop) {
                                case 'Configure Device':
                                    if (newPoint[prop].Value === true) {
                                        updateObject._cfgDevice = true;
                                        if (newPoint['Point Type'].eValue === Config.Enums['Point Types']['Remote Unit'].enum) {
                                            downloadPoint = true;
                                        }
                                    }
                                    break;

                                case 'Value':
                                    let propName = '';

                                    if (!_.isEqual(newPoint[prop].ValueOptions, oldPoint[prop].ValueOptions)) {
                                        updateReferences = true;
                                        propName = 'Value.ValueOptions';
                                        updateObject[propName] = newPoint[prop].ValueOptions;
                                    }
                                    if (newPoint[prop].isReadOnly !== oldPoint[prop].isReadOnly) {
                                        propName = 'Value.isReadOnly';
                                        updateObject[propName] = newPoint[prop].isReadOnly;
                                    }
                                    if (newPoint[prop].Value !== oldPoint[prop].Value) {
                                        propName = 'Value.Value';
                                        updateObject[propName] = newPoint[prop].Value;

                                        if (newPoint[prop].eValue !== undefined) {
                                            propName = 'Value.eValue';
                                            updateObject[propName] = newPoint[prop].eValue;
                                        }

                                        if (!!newPoint.hasOwnProperty('Out of Service') && newPoint['Out of Service'].Value === true) {
                                            if (newPoint.Value.oosValue !== undefined) {
                                                downloadPoint = true;
                                                if (newPoint[prop].eValue !== undefined) {
                                                    updateObject['Value.oosValue'] = newPoint[prop].eValue;
                                                } else {
                                                    updateObject['Value.oosValue'] = newPoint[prop].Value;
                                                }
                                            }
                                        }
                                    }
                                    break;

                                case 'Out of Service':
                                    if (newPoint[prop].Value === true && newPoint.Value.oosValue !== undefined) {
                                        updateObject['Value.oosValue'] = (newPoint.Value.eValue !== undefined) ? newPoint.Value.eValue : newPoint.Value.Value;
                                    }
                                    downloadPoint = true;
                                    break;

                                case 'Compiled Code':
                                    updateReferences = true;
                                    break;

                                case 'Conversion Adjustment':
                                case 'Conversion Coefficient 1':
                                case 'Conversion Coefficient 2':
                                case 'Conversion Coefficient 3':
                                case 'Conversion Coefficient 4':
                                case 'Conversion Type':
                                    if (newPoint['Point Type'].eValue === Config.Enums['Point Types'].Sensor.enum) {
                                        updateReferences = true;
                                    } else {
                                        downloadPoint = true;
                                    }
                                    break;

                                case 'Model Type':
                                    updateReferences = true;
                                    configRequired = true;
                                    updateModelType = true;
                                    break;

                                case 'Firmware Version':
                                    updateReferences = true;
                                    configRequired = true;
                                    break;

                                case '_rmuModel':
                                case '_devModel':
                                    configRequired = true;
                                    break;

                                case 'Active Control':
                                case 'Active Release':
                                case 'Active Value':
                                case 'Alarm Adjust Band':
                                case 'Alarm Deadband':
                                case 'APDU Timeout':
                                case 'APDU Retries':
                                case 'Auxiliary Control Point':
                                case 'Auxiliary Output Configuration':
                                case 'Boolean Registers':
                                case 'Broadcast Enable':
                                case 'Broadcast Period':
                                case 'Calculation Type':
                                case 'Calibration Factor':
                                case 'CFM Deadband':
                                case 'Close Polarity':
                                case 'Control Band Value':
                                case 'Control Priority':
                                case 'Controller':
                                case 'Cooling Equipment':
                                case 'Cooling Gain':
                                case 'Cooling Setpoint':
                                case 'COV Period':
                                case 'COV Enable':
                                case 'COV Increment':
                                case 'Damper Max Output':
                                case 'Damper Min Output':
                                case 'Damper Proportional Band':
                                case 'Damper Reset Gain':
                                case 'Damper Reverse Action':
                                case 'Damper Run Unoccupied':
                                case 'Damper Unoccupied Output':
                                case 'Digital Heat 1 Run Unoccupied':
                                case 'Digital Heat 1 Start Load':
                                case 'Digital Heat 1 Stop Load':
                                case 'Digital Heat 2 Run Unoccupied':
                                case 'Digital Heat 2 Start Load':
                                case 'Digital Heat 2 Stop Load':
                                case 'Digital Heat 3 Run Unoccupied':
                                case 'Digital Heat 3 Start Load':
                                case 'Digital Heat 3 Stop Load':
                                case 'Default Value':
                                case 'Delay Time':
                                case 'Demand Enable':
                                case 'Demand Interval':
                                case 'Disable Limit Fault':
                                case 'Downlink Broadcast':
                                case 'Downlink Network':
                                case 'Emergency Pump Down Time':
                                case 'Enable Network COV':
                                case 'Enable Warning Alarms':
                                case 'Fail Action':
                                case 'Fan Off CFM Setpoint':
                                case 'Fan Off Temp Deadband':
                                case 'Fan On CFM Setpoint':
                                case 'Fast Pulse':
                                case 'Feedback Polarity':
                                case 'Filter':
                                case 'Filter Weight':
                                case 'Heat 1 Max Output':
                                case 'Heat 1 Min Output':
                                case 'Heat 1 Proportional Band':
                                case 'Heat 1 Reset Gain':
                                case 'Heat 1 Reverse Action':
                                case 'Heat 1 Run Unoccupied':
                                case 'Heat 1 Unoccupied Output':
                                case 'Heating Equipment':
                                case 'Heating Gain':
                                case 'Heating Setpoint':
                                case 'High Alarm Limit':
                                case 'High Deadband':
                                case 'High Level Float Point':
                                case 'High Level Setpoint':
                                case 'High Setpoint':
                                case 'High Warning Limit':
                                case 'Horn Control Point':
                                case 'Horn Output Configuration':
                                case 'If Compare 1':
                                case 'If Compare 2':
                                case 'If Compare 3':
                                case 'If Compare 4':
                                case 'If Compare 5':
                                case 'If Result 2':
                                case 'If Result 3':
                                case 'If Result 4':
                                case 'If Result 5':
                                case 'If Value 1':
                                case 'If Value 2':
                                case 'If Value 3':
                                case 'If Value 4':
                                case 'If Value 5':
                                case 'In Alarm':
                                case 'In Fault':
                                case 'In Out of Service':
                                case 'In Override':
                                case 'Inactive Control':
                                case 'Inactive Release':
                                case 'Inactive Value':
                                case 'Integer Registers':
                                case 'Interlock State':
                                case 'Input 1 Constant':
                                case 'Input 2 Constant':
                                case 'Input Deadband':
                                case 'Input High Limit':
                                case 'Input Low Limit':
                                case 'Input Range':
                                case 'Input Rate':
                                case 'Lag Level Float Point':
                                case 'Lag Level Setpoint':
                                case 'Lead Level Float Point':
                                case 'Lead Level Setpoint':
                                case 'Lead Time':
                                case 'Level Sensor Point':
                                case 'Light Control Point':
                                case 'Light Output Configuration':
                                case 'Low Alarm Limit':
                                case 'Low Deadband':
                                case 'Low Level Float Point':
                                case 'Low Level Setpoint':
                                case 'Low Setpoint':
                                case 'Low Warning Limit':
                                case 'Max Pump Off Time':
                                case 'Max Pump Run Time':
                                case 'Maximum Change':
                                case 'Maximum Value':
                                case 'Minimum Value':
                                case 'Minimum Off Time':
                                case 'Minimum On Time':
                                case 'Modbus Order':
                                case 'Momentary Delay':
                                case 'Occupancy Schedule':
                                case 'Occupied Cool Setpoint Value':
                                case 'Occupied Heat Setpoint Value':
                                case 'Occupied Max Cool CFM':
                                case 'Occupied Max Heat CFM':
                                case 'Occupied Min Cool CFM':
                                case 'Occupied Min Heat CFM':
                                case 'Off Level Float Point':
                                case 'Off Level Setpoint':
                                case 'Open Polarity':
                                case 'Outside Air Gain':
                                case 'Override Time':
                                case 'Point Registers':
                                case 'Polarity':
                                case 'Program Change Request':
                                case 'Proportional Band':
                                case 'Pulse Weight':
                                case 'Pump Control Mode':
                                case 'Pump Select Mode':
                                case 'Pump Sequence Delay':
                                case 'Rate':
                                case 'Rate Period':
                                case 'Real Registers':
                                case 'Reset Gain':
                                case 'Reset Interval':
                                case 'Reset Time':
                                case 'Reverse Action':
                                case 'Run Total':
                                case 'Same State Test':
                                case 'Scale Factor':
                                case 'Select State':
                                case 'Setback Controller':
                                case 'Setback Deadband':
                                case 'Setback Enable':
                                case 'Setpoint Value':
                                case 'Shutdown Control':
                                case 'Shutdown Enable':
                                case 'Shutdown Release':
                                case 'Shutdown State':
                                case 'Shutdown Value':
                                case 'Square Root':
                                case 'Startup Delay':
                                case 'Stop Gain':
                                case 'Supervised Input':
                                case 'Total':
                                case 'Trend COV Increment':
                                case 'Trend Enable':
                                case 'Trend Interval':
                                case 'Trigger Constant':
                                case 'Unoccupied Cool Setpoint Value':
                                case 'Unoccupied Heat Setpoint Value':
                                case 'Unoccupied Max Cool CFM':
                                case 'Unoccupied Max Heat CFM':
                                case 'Unoccupied Min Cool CFM':
                                case 'Unoccupied Min Heat CFM':
                                case 'Update Interval':
                                case 'Value Deadband':
                                case 'Verify Delay':
                                case 'Warmup Deadband':
                                case 'Warning Adjust Band':
                                    downloadPoint = true;
                                    break;

                                case 'States':
                                    if (newPoint['Point Type'].eValue === Config.Enums['Point Types']['MultiState Value'].enum) {
                                        downloadPoint = true;
                                    }
                                    break;

                                case 'Channel':
                                case 'Close Channel':
                                case 'Device Address':
                                case 'Device Port':
                                case 'Downlink IP Port':
                                case 'Feedback Channel':
                                case 'Feedback Type':
                                case 'Input Type':
                                case 'Network Segment':
                                case 'Network Type':
                                case 'Off Channel':
                                case 'On Channel':
                                case 'Open Channel':
                                case 'Output Type':
                                case 'Port 1 Address':
                                case 'Port 1 Maximum Address':
                                case 'Port 1 Network':
                                case 'Port 1 Protocol':
                                case 'Port 2 Address':
                                case 'Port 2 Maximum Address':
                                case 'Port 2 Network':
                                case 'Port 2 Protocol':
                                case 'Port 3 Address':
                                case 'Port 3 Maximum Address':
                                case 'Port 3 Network':
                                case 'Port 3 Protocol':
                                case 'Port 4 Address':
                                case 'Port 4 Maximum Address':
                                case 'Port 4 Network':
                                case 'Port 4 Protocol':
                                case 'Time Zone':
                                case 'VAV Channel':
                                    configRequired = true;
                                    break;

                                case 'Boolean Register Names':
                                case 'Integer Register Names':
                                case 'Point Register Names':
                                case 'Real Register Names':
                                    if (newPoint['Point Type'].eValue !== Config.Enums['Point Types'].Script.enum) {
                                        downloadPoint = true;
                                    }
                                    break;

                                case 'Alarm Delay Time':
                                case 'Stop Scan':
                                    if (newPoint['Point Type'].eValue !== Config.Enums['Point Types'].Device.enum) {
                                        downloadPoint = true;
                                    }
                                    break;

                                case 'Alarm Value':
                                case 'Alarms Off':
                                    if (newPoint['Point Type'].eValue !== Config.Enums['Point Types'].Device.enum && newPoint['Point Type'].eValue !== Config.Enums['Point Types']['Remote Unit'].enum) {
                                        downloadPoint = true;
                                    }
                                    break;

                                case 'Execute Now':
                                    executeTOD = true;
                                    break;

                                case 'Trend Samples':
                                    if (newPoint._devModel === Config.Enums['Device Model Types']['MicroScan 5 UNV'].enum || newPoint._devModel === Config.Enums['Device Model Types']['MicroScan 5 xTalk'].enum || newPoint._devModel === Config.Enums['Device Model Types']['SCADA Vio'].enum) {
                                        downloadPoint = true;
                                    } else {
                                        configRequired = true;
                                    }
                                    break;

                                case 'Ethernet Network':
                                    if (newPoint['Point Type'].Value === 'Device') {
                                        updateDownlinkNetwk = true;
                                    }
                                    break;

                                case 'Point Refs':
                                    downloadPoint = true;
                                    let pointRefProps = Config.Utility.getPointRefProperties(newPoint);
                                    for (let r = 0; r < pointRefProps.length; r++) {
                                        if (!_.isEqual(Config.Utility.getPropertyObject(pointRefProps[r], newPoint), Config.Utility.getPropertyObject(pointRefProps[r], oldPoint))) {
                                            switch (pointRefProps[r]) {
                                                case 'Device Point':
                                                    updateReferences = true;
                                                    configRequired = true;
                                                    updateCfgReq = true;
                                                    break;

                                                case 'Remote Unit Point':
                                                case 'Script Point':
                                                    configRequired = true;
                                                    break;

                                                default:
                                                    break;
                                            }
                                        }
                                    }
                                    break;

                                default:
                                    break;
                            }

                            if (prop !== 'Configure Device' && prop !== 'Value') {
                                updateObject[prop] = newPoint[prop];
                            }

                            if (generateActivityLog === true && flags.from === 'ui') {
                                let oldVal = (oldPoint[prop].Value !== '') ? oldPoint[prop].Value : '[blank]',
                                    newVal = (newPoint[prop].Value !== '') ? newPoint[prop].Value : '[blank]';
                                //if enum, if evalue changed AL, else if not enum, compare value
                                if (['Report', 'Sequence'].indexOf(newPoint['Point Type'].Value) >= 0) {
                                    activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                        log: newPoint['Point Type'].Value + ' updated',
                                        activity: 'Point Property Edit'
                                    }));
                                } else if (updateObject[prop] !== undefined && ((updateObject[prop].ValueType === 5 && updateObject[prop].eValue !== oldPoint[prop].eValue) || (updateObject[prop].ValueType !== 5 && updateObject[prop].Value !== oldPoint[prop].Value))) {
                                    if (prop === 'Configure Device') {
                                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                            log: 'Device configuration requested',
                                            activity: 'Device Configuration'
                                        }));
                                    } else if (newPoint[prop].ValueType === Config.Enums['Value Types'].Bool.enum) {
                                        if (newPoint[prop].Value === true) {
                                            activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                                log: prop + ' set',
                                                activity: 'Point Property Edit'
                                            }));
                                        } else {
                                            activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                                log: prop + ' cleared',
                                                activity: 'Point Property Edit'
                                            }));
                                        }
                                    } else if (newPoint[prop].ValueType === Config.Enums['Value Types'].UniquePID.enum) {
                                        if (oldPoint[prop].PointInst !== null && newPoint[prop].PointInst === null) {
                                            activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                                log: newPoint[prop].Name + ' removed from ' + prop,
                                                activity: 'Point Property Edit'
                                            }));
                                        } else if (oldPoint[prop].PointInst === null && newPoint[prop].PointInst !== null) {
                                            activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                                log: newPoint[prop].Name + ' added to ' + prop,
                                                activity: 'Point Property Edit'
                                            }));
                                        } else {
                                            activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                                log: prop + ' changed from ' + oldPoint[prop].Name + ' to ' + newPoint[prop].Name,
                                                activity: 'Point Property Edit'
                                            }));
                                        }
                                    } else if ([Config.Enums['Value Types'].HourMinSec.enum, Config.Enums['Value Types'].MinSec.enum, Config.Enums['Value Types'].HourMin.enum].indexOf(newPoint[prop].ValueType) > -1) {
                                        let timeMessage,
                                            hour = 0,
                                            min = 0,
                                            sec = oldPoint[prop].Value;
                                        switch (newPoint[prop].ValueType) {
                                            case 12:
                                                hour = Math.floor(sec / 3600);
                                                sec %= 3600;
                                                min = Math.floor(sec / 60);
                                                sec %= 60;
                                                hour = hour > 9 ? hour : '0' + hour;
                                                min = min > 9 ? min : '0' + min;
                                                sec = sec > 9 ? sec : '0' + sec;
                                                timeMessage = prop + ' changed from ' + hour + ':' + min + ':' + sec + ' to ';
                                                sec = newPoint[prop].Value;
                                                hour = Math.floor(sec / 3600);
                                                sec %= 3600;
                                                min = Math.floor(sec / 60);
                                                sec %= 60;
                                                hour = hour > 9 ? hour : '0' + hour;
                                                min = min > 9 ? min : '0' + min;
                                                sec = sec > 9 ? sec : '0' + sec;
                                                timeMessage += hour + ':' + min + ':' + sec;
                                                break;
                                            case 13:
                                                min = Math.floor(sec / 60);
                                                sec %= 60;
                                                min = min > 9 ? min : '0' + min;
                                                sec = sec > 9 ? sec : '0' + sec;
                                                timeMessage = prop + ' changed from ' + min + ':' + sec + ' to ';
                                                sec = newPoint[prop].Value;
                                                min = Math.floor(sec / 60);
                                                sec %= 60;
                                                min = min > 9 ? min : '0' + min;
                                                sec = sec > 9 ? sec : '0' + sec;
                                                timeMessage += min + ':' + sec;
                                                break;
                                            case 17:
                                                hour = Math.floor(sec / 3600);
                                                sec %= 3600;
                                                min = Math.floor(sec / 60);
                                                hour = hour > 9 ? hour : '0' + hour;
                                                min = min > 9 ? min : '0' + min;
                                                timeMessage = prop + ' changed from ' + hour + ':' + min + ' to ';
                                                sec = newPoint[prop].Value;
                                                hour = Math.floor(sec / 3600);
                                                sec %= 3600;
                                                min = Math.floor(sec / 60);
                                                hour = hour > 9 ? hour : '0' + hour;
                                                min = min > 9 ? min : '0' + min;
                                                timeMessage += hour + ':' + min;
                                                break;
                                        }
                                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                            log: timeMessage,
                                            activity: 'Point Property Edit'
                                        }));
                                    } else {
                                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                            log: prop + ' changed from ' + oldVal + ' to ' + newVal,
                                            activity: 'Point Property Edit'
                                        }));
                                    }
                                } else if (prop === 'Point Refs') {
                                    if (newPoint['Point Type'].Value === 'Slide Show') {
                                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                            log: 'Slide Show edited',
                                            activity: 'Slideshow Edit'
                                        }));
                                    } else if (newPoint['Point Type'].Value === 'Program') {
                                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                            log: 'Program edited',
                                            activity: 'Program Edit'
                                        }));
                                    } else {
                                        compareArrays(newPoint[prop], oldPoint[prop], activityLogObjects);
                                    }
                                } else if (prop === 'Alarm Messages' || prop === 'Occupancy Schedule' || prop === 'Sequence Details' || prop === 'Security' || prop === 'Script Source File') {
                                    activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                        log: prop + ' updated',
                                        activity: 'Point Property Edit'
                                    }));
                                } else if (prop === 'Name') {
                                    if (newPoint[prop] !== oldPoint[prop]) {
                                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                            log: prop + ' changed from ' + oldPoint[prop] + ' to ' + newPoint[prop],
                                            activity: 'Point Property Edit'
                                        }));
                                    }
                                    /*} else if (prop === "Value") {
                                      if (newPoint[prop].Value !== oldPoint[prop].Value) {
                                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                          log: prop + " changed from " + oldVal + " to " + newVal,
                                          activity: "Point Property Edit"
                                        }));
                                      }*/
                                } else if (prop === 'States') {
                                    if (!_.isEqual(newPoint[prop], oldPoint[prop])) {
                                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                                            log: prop + ' updated',
                                            activity: 'Point Property Edit'
                                        }));
                                    }
                                }
                            } else {
                                generateActivityLog = false;
                            }
                        }
                    }
                }

                if (!_.isEmpty(updateObject)) {
                    if (newPoint['Point Type'].Value === 'Schedule Entry') {
                        downloadPoint = false;
                        updateReferences = false;
                    } else if (newPoint['Point Type'].Value === 'Device') {
                        utils.updateNetworkAndAddress(newPoint);

                        updateObject['Network Segment.Value'] = newPoint['Network Segment'].Value;
                        updateObject['Device Address.Value'] = newPoint['Device Address'].Value.toString();
                    }

                    if (configRequired === true) {
                        updateObject._cfgRequired = true;
                        downloadPoint = false;
                    } else if (newPoint._pStatus !== Config.Enums['Point Statuses'].Active.enum ||
                        newPoint._devModel === Config.Enums['Device Model Types'].Unknown.enum ||
                        newPoint._devModel === Config.Enums['Device Model Types']['Central Device'].enum ||
                        newPoint['Point Type'].Value === 'Sequence' ||
                        (newPoint['Point Type'].Value !== 'Device' &&
                            (Config.Utility.getPropertyObject('Device Point', newPoint) === null ||
                                Config.Utility.getPropertyObject('Device Point', newPoint).PointInst === 0))) {
                        // not active
                        // or (central device or unknown)
                        // or (!device and !device point)

                        downloadPoint = false;
                    } else if (flags.from === 'updateDependencies') {
                        updateObject._updPoint = true;
                        downloadPoint = false;
                    }

                    // Removing "PointName" and "PointType" from "Point Refs" as part of effort: 'Remove PointName from Point Refs'
                    if (updateObject['Point Refs']) {
                        updateObject['Point Refs'].forEach((ref) => {
                            delete ref.PointName;
                            delete ref.PointType;
                            delete ref.PointPath;
                        });
                    }

                    security.updSecurity(newPoint, (err) => {
                        this.findAndModify({
                            query: {
                                _id: newPoint._id
                            },
                            sort: [],
                            updateObj: {
                                $set: updateObject
                            },
                            options: {
                                new: true
                            }
                        }, (err, result) => {
                            if (err) {
                                return callback({
                                    err: err
                                }, null);
                            }
                            let error = null;
                            // REMOVE AFTER NEW PERMISSIONS
                            result._pAccess = newPoint._pAccess;
                            updatePointRefProperties(result);
                            this.updDownlinkNetwk(updateDownlinkNetwk, newPoint, oldPoint, (err) => {
                                if (err) {
                                    return callback({
                                        err: err
                                    }, result);
                                }
                                this.updPoint(downloadPoint, newPoint, (err, msg) => {
                                    if (err) {
                                        error = err;
                                    }
                                    this.signalExecTOD(executeTOD, (err) => {
                                        if (err) {
                                            error = error;
                                        }
                                        activityLog.doActivityLogs(generateActivityLog, activityLogObjects, (err) => {
                                            if (err) {
                                                return callback({
                                                    err: err
                                                }, result);
                                            }
                                            this.updateModel(updateModelType, newPoint, (err) => {
                                                if (err) {
                                                    return callback({
                                                        err: err
                                                    }, result);
                                                }
                                                this.fixCfgRequired(updateCfgReq, oldPoint, newPoint, (err) => {
                                                    if (err) {
                                                        return callback({
                                                            err: err
                                                        }, result);
                                                    }
                                                    this.updateRefs(updateReferences, newPoint, flags, user, (err) => {
                                                        if (err) {
                                                            return callback({
                                                                err: err
                                                            }, result);
                                                        } else if (error) {
                                                            return callback({
                                                                err: error
                                                            }, result);
                                                        }

                                                        msg = (msg !== undefined && msg !== null) ? msg : 'success';
                                                        return callback({
                                                            message: msg
                                                        }, result);
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                } else {
                    updatePointRefProperties(newPoint);
                    return callback({
                        message: 'success'
                    }, newPoint);
                }
            };

            if (newPoint['Point Type'].Value === 'Script' && !!flags.path) {
                script.commit({
                    point: newPoint,
                    path: flags.path
                }, (err) => {
                    if (!!err) {
                        return callback(err);
                    }
                    updateProperties();
                });
            } else {
                updateProperties();
            }
        });

        let compareArrays = (newArray, oldArray, activityLogObjects) => {
            for (let i = 0; i < newArray.length; i++) {
                if (newArray[i].Value !== oldArray[i].Value) {
                    logData.prop = newArray[i].PropertyName;
                    if (newArray[i].Value === 0 && oldArray[i].Value !== 0) {
                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                            log: logData.prop + ' removed',
                            activity: 'Point Property Edit'
                        }));
                    } else if (newArray[i].Value !== 0 && oldArray[i].Value === 0) {
                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                            log: logData.prop + ' added',
                            activity: 'Point Property Edit'
                        }));
                    } else {
                        activityLogObjects.push(_.merge(_.cloneDeep(logData), {
                            log: logData.prop + ' changed from ' + oldArray[i].PointName + ' to ' + newArray[i].PointName,
                            activity: 'Point Property Edit'
                        }));
                    }
                }
            }
        };
    }

    // newupdate
    updateRefs(updateReferences, newPoint, flags, user, callback) {
        if (updateReferences === true) {
            this.updateDependencies(newPoint, {
                from: 'newUpdate',
                method: (flags.method === null) ? 'update' : flags.method
            }, user, (err) => {
                return callback(err);
            });
        } else {
            return callback(null);
        }
    }

    //newupdate
    fixCfgRequired(updateCfgReq, oldPoint, newPoint, callback) {
        if (!!updateCfgReq) {
            let oldDevPoint = Config.Utility.getPropertyObject('Device Point', oldPoint).Value;
            let newDevPoint = Config.Utility.getPropertyObject('Device Point', newPoint).Value;
            // 0 > 0 - no change
            // N > 0 - cfg old
            // 0 > N - cfg new
            // N > M - cfg both
            let areBothZero = oldDevPoint === 0 && newDevPoint === 0;
            let isNowOffDevice = oldDevPoint !== 0 && newDevPoint === 0;
            let isNowOnDevice = oldDevPoint === 0 && newDevPoint !== 0;
            let didChangeDevice = oldDevPoint !== 0 && newDevPoint !== 0 && oldDevPoint !== newDevPoint;

            if (!areBothZero && (!!isNowOffDevice || !!isNowOnDevice || !!didChangeDevice)) {
                let upis = [];
                if (isNowOffDevice || didChangeDevice) {
                    upis.push(oldDevPoint);
                }
                if (isNowOnDevice || didChangeDevice) {
                    upis.push(newDevPoint);
                }

                this.update({
                    query: {
                        _id: {
                            $in: upis
                        }
                    },
                    updateObj: {
                        $set: {
                            _cfgRequired: true
                        }
                    }
                }, callback);
            } else {
                callback();
            }
        } else {
            callback();
        }
    }

    //newupdate
    updateModel(updateModelType, newPoint, callback) {
        if (!!updateModelType) {
            let criteria = {
                query: {
                    'Point Refs.Value': newPoint._id
                }
            };
            this.iterateCursor(criteria, (err, doc, next) => {
                if (newPoint['Point Type'].Value === 'Device') {
                    doc._devModel = newPoint['Model Type'].eValue;
                } else if (newPoint['Point Type'].Value === 'Remote Unit') {
                    doc._rmuModel = newPoint['Model Type'].eValue;
                }
                Config.Utility.updDevModel({
                    point: doc
                });
                this.updateOne({
                    query: {
                        _id: doc._id
                    },
                    updateObj: doc
                }, next);
            }, callback);
        } else {
            callback();
        }
    }

    // newupdate
    updDownlinkNetwk(updateDownlinkNetwk, newPoint, oldPoint, callback) {
        if (updateDownlinkNetwk) {
            this.updateOne({
                query: {
                    'Point Type.Value': 'Device',
                    'Uplink Port.Value': 'Ethernet',
                    $and: [{
                        'Downlink Network.Value': {
                            $ne: 0
                        }
                    }, {
                        $or: [{
                            'Downlink Network.Value': newPoint['Ethernet Network'].Value
                        }, {
                            'Downlink Network.Value': oldPoint['Ethernet Network'].Value
                        }]
                    }]
                },
                updateObj: {
                    $set: {
                        _updPoint: true
                    }
                }
            }, (err) => {
                callback(err);
            });
        } else {
            callback(null);
        }
    }

    // newupdate
    updPoint(downloadPoint, newPoint, callback) {
        // const zmq = new ZMQ();
        if (downloadPoint === true) {
            //send download point request to c++ module
            let command = {
                'Command Type': 6,
                'upi': newPoint._id
            };
            let err;
            let code;
            let updPoint = false;
            command = JSON.stringify(command);

            zmq.sendCommand(command, (error, msg) => {
                if (!!error) {
                    err = error.ApduErrorMsg;
                    code = parseInt(error.ApduError, 10);
                }

                if (err) {
                    if (code >= 2300 && code < 2304) {
                        updPoint = true;
                    } else {
                        return callback(err, null);
                    }
                }

                this.update({
                    query: {
                        _id: newPoint._id
                    },
                    updateObj: {
                        $set: {
                            _updPoint: updPoint
                        }
                    }
                }, (dberr, result) => {
                    if (dberr) {
                        return callback(dberr, null);
                    }
                    return callback(err, 'success');
                });
            });
        } else {
            callback(null, 'success');
        }
    }

    //renamePoint(depre), deletePoint, restorePoint(io), updateRefs (common)
    updateDependencies(refPoint, flags, user, callback) {
        // schedule entries collection - find the control point properties and
        // run this against those properties that match the upi
        // create a new  for this and call from within this=>.
        let error = null;
        let data = {
            point: null,
            refPoint: refPoint,
            oldPoint: null,
            property: null,
            propertyObject: null
        };
        let devices = [];
        let signalTOD = false;
        let deepClone = (o) => {
            // Return the value if it's not an object; shallow copy mongo ObjectID objects
            if ((o === null) || (typeof (o) !== 'object') || (o instanceof ObjectID)) {
                return o;
            }

            let temp = o.constructor();

            for (let key in o) {
                temp[key] = deepClone(o[key]);
            }
            return temp;
        };

        this.getAll({
            query: {
                'Point Refs.Value': refPoint._id
                // _parentUpi
            },
            fields: {
                _id: 1
            }
        }, (err, dependencies) => {
            async.eachSeries(dependencies, (dependencyId, depCB) => {
                this.getOne({
                    query: {
                        _id: dependencyId._id
                    }
                }, (err, dependency) => {
                    // TODO Check for errors
                    async.waterfall([
                        (cb1) => {
                            if (dependency['Point Type'].Value === 'Schedule Entry' && flags.method === 'hard') {
                                this.updateScheduleEntries(dependency, devices, null, (todSignal) => {
                                    signalTOD = (signalTOD | todSignal) ? true : false;
                                    // does deletePoint need to be called here?
                                    this.remove({
                                        query: {
                                            _id: dependency._id
                                        }
                                    }, (err, result) => {
                                        console.log('first err', err);
                                        cb1(err);
                                    });
                                });
                            } else {
                                cb1(null);
                            }
                        },
                        (cb2) => {
                            data.point = dependency;
                            data.oldPoint = deepClone(dependency);

                            if (dependency['Point Type'].Value !== 'Schedule Entry' || (flags.method !== 'hard')) {
                                if (dependency['Point Type'].Value === 'Schedule Entry' && dependency._parentUpi === 0 && flags.method === 'soft') {
                                    dependency._pStatus = 2;
                                    return cb2(null);
                                }
                                // dependency._cfgRequired = false;
                                // dependency._updPoint = false;

                                for (let i = 0; i < dependency['Point Refs'].length; i++) {
                                    if (dependency['Point Refs'][i].Value === refPoint._id) {
                                        data.property = i;
                                        data.propertyObject = dependency['Point Refs'][i];

                                        switch (flags.method) {
                                            case 'hard':
                                                data.propertyObject.Value = 0;
                                                data.refPoint = null;
                                                break;
                                            case 'soft':
                                                data.propertyObject.PointInst = 0;
                                                data.refPoint = null;
                                                break;
                                            case 'restore':
                                                data.propertyObject.PointInst = data.propertyObject.Value;
                                                break;
                                        }

                                        /*if (dependency["Point Refs"][i]["Point Type"].Value === "Script")
                                         data.newPoint._cfgRequired = true;*/
                                        Config.Update.formatPoint(data);
                                        if (data.err !== undefined) {
                                            logger.error('data.err: ', data.err);
                                            error = 'ERROR!';
                                            cb2(data.err);
                                        }
                                    }
                                }
                                cb2(null);
                            } else {
                                cb2(null);
                            }
                        },
                        (cb3) => {
                            if (dependency['Point Type'].Value === 'Schedule Entry') {
                                if (flags.method !== 'hard') {
                                    this.updateScheduleEntries(dependency, devices, null, (todSignal) => {
                                        signalTOD = (signalTOD | todSignal) ? true : false;
                                        // does deletePoint need to be called here?
                                        this.newUpdate(data.oldPoint, data.point, {
                                            method: flags.method,
                                            from: 'updateDependencies'
                                        }, user, (response, point) => {
                                            console.log('second err', err);
                                            cb3(response.err);
                                        });
                                    });
                                } else {
                                    return cb3();
                                }
                            } else {
                                this.newUpdate(data.oldPoint, data.point, {
                                    method: flags.method,
                                    from: 'updateDependencies'
                                }, user, (response, point) => {
                                    cb3(null);
                                });
                            }
                        }
                    ], (err) => {
                        depCB(err);
                    });
                });
            }, (err) => {
                this.signalHostTOD(signalTOD, (err) => {
                    if (err) {
                        return callback(err);
                    }
                    this.updateDeviceToDs(devices, (err) => {
                        callback((error !== null) ? error : err);
                    });
                });
            });
        });
    }

    restorePoint(upi, user, callback) {
        const activityLog = new ActivityLog();
        let logData = {
                user: user,
                timestamp: Date.now()
            },
            pointType;

        this.findAndModify({
            query: {
                _id: upi
            },
            sort: [],
            updateObj: {
                $set: {
                    _pStatus: 0
                }
            },
            options: {
                new: true
            }
        }, (err, point) => {
            if (err) {
                return callback({
                    err: err
                });
            }

            logData.activity = 'Point Restore';
            logData.log = 'Point restored';
            logData.point = point;
            activityLog.create(logData, (err, result) => {
                pointType = point['Point Type'].Value;
                switch (pointType) {
                    case 'Schedule':
                    case 'Sequence':
                        this.updateAll({
                            query: {
                                _parentUpi: point._id
                            },
                            updateObj: {
                                $set: {
                                    _pStatus: 0
                                }
                            }
                        }, (err, result) => {
                            return callback({
                                message: 'success'
                            });
                        });
                        break;
                    case 'Report':
                        // enable related schedules
                        // this.findAndModify({
                        //     collection: constants('schedulescollection'),
                        //     query: {
                        //         upi: point._id
                        //     },
                        //     updateObj: {
                        //         $set: {
                        //             enabled: true
                        //         }
                        //     }
                        // },  (err, result) =>{
                        //     return callback({
                        //         message: "success"
                        //     });
                        // });
                        break;
                    default:
                        this.restoreScheduleEntries(point, user, () => {
                            this.updateDependencies(point, {
                                method: 'restore'
                            }, user, () => {
                                return callback({
                                    message: 'success'
                                });
                            });
                        });
                        break;
                }
            });
        });
    }

    restoreScheduleEntries(refPoint, user, callback) {
        let query = {
            'Point Type.Value': 'Schedule Entry',
            'Point Refs': {
                $elemMatch: {
                    Value: refPoint._id,
                    PropertyName: 'Control Point'
                }
            }
        };

        this.getAll({
            query: query
        }, (err, points) => {
            let devices = [],
                signalTOD = false;
            async.eachSeries(points, (point, asyncCB) => {
                // if host schedule - set flag
                this.updateScheduleEntries(point, devices, refPoint, (todSignal) => {
                    signalTOD = (signalTOD | todSignal) ? true : false;
                    this.restorePoint(point._id, user, (err) => {
                        asyncCB(err.err);
                    });
                });
            }, (err) => {
                this.signalHostTOD(signalTOD, (err) => {
                    if (err) {
                        return callback(err);
                    }
                    this.updateDeviceToDs(devices, (err) => {
                        callback(err);
                    });
                });
            });
        });
    }

    //updateSchedules(io), io, deleteChildren, updateSequencePoints(io)
    deletePoint(upi, method, user, options, callback) {
        const activityLog = new ActivityLog();
        const history = new History();
        const schedule = new Schedule();

        let _point,
            _updateFromSchedule = !!options && options.from === 'updateSchedules',
            _upi = parseInt(upi, 10),
            _logData = {
                user: user,
                timestamp: Date.now()
            },
            _method = method || 'soft',
            _warning = '',
            _buildWarning = (msg) => {
                if (_warning.length) {
                    _warning += '; ' + msg;
                } else {
                    _warning = msg;
                }
            },
            _findPoint = (cb) => {
                let query = {
                    _id: _upi
                };
                this.getOne({
                    query: query
                }, (err, point) => {
                    if (err) {
                        return cb(err);
                    }
                    // Save point reference
                    _point = point;
                    // STOP PROCESSING if the the point wasn't found
                    if (!point) {
                        err = 'Point not found';
                    } else if (_point._pStatus === 2) { //status already equals "Deleted"
                        _method = 'hard';
                    }
                    cb(err);
                });
            },
            _deletePoint = (cb) => {
                let query = {
                        _id: _upi
                    },
                    sort = [],
                    update = {
                        $set: {
                            _pStatus: Config.Enums['Point Statuses'].Deleted.enum
                        }
                    },
                    options = {
                        new: true
                    };

                if (_method === 'hard') {
                    this.remove({
                        query: query
                    }, (err, result) => {
                        cb(err);
                    });
                } else {
                    query._pStatus = 0;
                    this.findAndModify({
                        query: query,
                        sort: sort,
                        updateObj: update,
                        options: options
                    }, (err, point) => {
                        // Update our point reference
                        _point = point;
                        // STOP PROCESSING if we couldn't modify the point or if it wasn't found
                        if (!err && !point) {
                            err = 'Point already deleted';
                        }
                        cb(err);
                    });
                }
            },
            _updateUpis = (cb) => {
                // We only update the upis collection if the point is hard deleted (destroyed)
                if (_method === 'soft') {
                    return cb(null);
                }

                cb(null);
            },
            _deleteHistory = (cb) => {
                // We only remove entries from the history collection if the point is hard deleted (destroyed)
                if (_method === 'soft') {
                    return cb(null);
                }
                history.remove({
                    upi: _upi
                }, (err, result) => {
                    if (err) {
                        _buildWarning('could not remove all history entries');
                    }
                    cb(null);
                });
            },
            _fromScheduleExitCheck = (cb) => {
                // STOP PROCESSING if updating from schedules; otherwise continue down the waterfall
                if (_updateFromSchedule) {
                    cb('OK');
                } else {
                    cb(null);
                }
            },
            _addActivityLog = (cb) => {
                if (_point._pStatus === Config.Enums['Point Statuses'].Inactive.enum) {
                    return cb(null);
                }
                if (_method === 'hard') {
                    _logData.activity = 'Point Hard Delete';
                    _logData.log = 'Point destroyed';
                } else {
                    _logData.activity = 'Point Soft Delete';
                    _logData.log = 'Point deleted';
                }
                _logData.point = _point;
                activityLog.create(_logData, (err, result) => {
                    if (err) {
                        _buildWarning('could not create activity log');
                    }
                    cb(null);
                });
            },
            _deleteChildren = (cb) => {
                this.deleteChildren(_method, _point['Point Type'].Value, _point._id, null, (err) => {
                    if (err) {
                        _buildWarning('could not delete all schedule entries associated with this point');
                    }
                    cb(null);
                });
            },
            _updateCfgRequired = (cb) => {
                this.updateCfgRequired(_point, (err) => {
                    if (err) {
                        _buildWarning('could not update the configuration required flag on all point dependencies');
                    }
                    cb(null);
                });
            },
            _updateDependencies = (cb) => {
                let refPoint = {
                        _id: _upi
                    },
                    flags = {
                        method: _method
                    };
                this.updateDependencies(refPoint, flags, user, (err) => {
                    if (err) {
                        _buildWarning('could not update all point dependencies');
                    }
                    cb(null);
                });
            },
            _updateRelatedSchedule = (cb) => {
                if (_method === 'hard') {
                    schedule.remove(upi, cb);
                } else {
                    schedule.disable(upi, cb);
                }
            },
            executeFunctions = [_findPoint, _deletePoint, _updateUpis, _deleteHistory, _fromScheduleExitCheck, _addActivityLog,
                _deleteChildren, _updateCfgRequired, _updateDependencies, _updateRelatedSchedule
            ];

        async.waterfall(executeFunctions, (err) => {
            let data = {};
            // If error is null or 'OK' (we send 'OK' when we need to exit the waterfall before it's completed)
            if (err === null || err === 'OK') {
                if (_warning.length) {
                    data.warning = _warning;
                } else {
                    data.message = 'success';
                }
            } else {
                data.err = err;
            }
            callback(data);
        });
    }

    // deletepoint
    deleteChildren(method, pointType, upi, user, callback) {
        let query = {};
        // Build the query object
        if (['Schedule', 'Sequence'].indexOf(pointType) >= 0) {
            query._parentUpi = upi;
            if (method === 'soft') {
                this.updateAll({
                    query: query,
                    updateObj: {
                        $set: {
                            _pStatus: 2
                        }
                    }
                }, (err, results) => {
                    callback(err);
                });
            } else if (method === 'hard') {
                this.remove({
                    query: query
                }, callback);
            } else {
                return callback();
            }
        } else {
            return callback();
        }
    }

    //updateDependencies, deleteChildren, updateSchedules(io)
    updateDeviceToDs(devices, callback) {
        this.updateAll({
            query: {
                _id: {
                    $in: devices
                }
            },
            updateObj: {
                $set: {
                    _updTOD: true
                }
            }
        }, (err, result) => {
            callback(err);
        });
    }

    //updateDependencies, deleteChildren, updateSchedules(io)
    signalHostTOD(signalTOD, callback) {
        // const zmq = new ZMQ();
        if (signalTOD === true) {
            let command = {
                'Command Type': 9
            };
            command = JSON.stringify(command);
            zmq.sendCommand(command, (err, msg) => {
                return callback(err, msg);
            });
        } else {
            callback(null, 'success');
        }
    }

    //updateDependencies, deleteChildren
    updateScheduleEntries(scheduleEntry, devices, refPoint, callback) {
        let signalTOD = false;

        if (refPoint !== null) {
            scheduleEntry = Config.Update.formatPoint({
                point: scheduleEntry,
                oldPoint: scheduleEntry,
                property: 'Control Point',
                refPoint: refPoint
            });
        }

        if (scheduleEntry['Host Schedule'].Value === true) {
            signalTOD = true;
        } else {
            this.addToDevices(scheduleEntry, devices);
        }

        return callback(signalTOD);
    }

    //updateSchedules(io), updateScheduleEntries
    addToDevices(scheduleEntry, devices, oldPoint) {
        let devInst = Config.Utility.getPropertyObject('Control Point', scheduleEntry).DevInst;
        if (devInst !== null && devInst !== 0 && devices.indexOf(devInst) === -1) {
            devices.push(parseInt(devInst, 10));
        }
        if (!!oldPoint) {
            devInst = Config.Utility.getPropertyObject('Control Point', oldPoint).DevInst;
            if (devInst !== null && devInst !== 0 && devices.indexOf(devInst) === -1) {
                devices.push(parseInt(devInst, 10));
            }
        }
    }

    //addpoint (io), deletepoint
    updateCfgRequired(point, callback) {
        if (point['Point Type'].Value === 'Device') {
            point._cfgRequired = true;
            callback(null);
        } else if (Config.Utility.getPropertyObject('Device Point', point) !== null) {
            point._cfgRequired = true;
            if (Config.Utility.getPropertyObject('Device Point', point).PointInst !== 0) {
                this.updateOne({
                    query: {
                        _id: Config.Utility.getPropertyObject('Device Point', point).PointInst
                    },
                    updateObj: {
                        $set: {
                            _cfgRequired: true
                        }
                    }
                }, (err, result) => {
                    callback(err);
                });
            } else {
                callback(null);
            }
        } else { // TODO Schedule Entry comes to here. Added to progress.
            callback(null);
        }
    }

    addPoint(data, user, options, callback) {
        const activityLog = new ActivityLog();
        const hierarchyModel = new Hierarchy();
        let point = data.newPoint;
        let logData = {
            user: user,
            timestamp: Date.now(),
            point: point,
            activity: 'Point Add',
            log: 'Point added'
        };

        hierarchyModel.checkUniqueDisplayUnderParent({
            display: point.display,
            parentNode: point.parentNode
        }, (err, exists) => {
            if (!!err) {
                return callback(err);
            } else if (!!exists.exists) {
                return callback({
                    err: 'Label already exists under node'
                });
            }

            this.updateCfgRequired(point, (err) => {
                if (err) {
                    callback(err);
                }

                delete point.id;

                if (point['Point Refs']) {
                    point['Point Refs'].forEach((ref) => {
                        delete ref.PointName;
                        delete ref.PointType;
                        delete ref.PointPath;
                    });
                }

                point._pStatus = 0;
                point.Security = [];
                point._actvAlmId = ObjectID(point._actvAlmId);
                // point._curAlmId = ObjectID(updateObj._curAlmId);

                this.insert({
                    insertObj: point
                }, (err, result) => {
                    if (err) {
                        callback(err);
                    } else {
                        logData.point = point;
                        if (!options || (!!options && options.from !== 'updateSchedules')) {
                            activityLog.create(logData, (err, result) => {});
                        }

                        if (data.hasOwnProperty('oldPoint') && data.oldPoint !== undefined) {
                            this.newUpdate(data.oldPoint, point, {
                                from: 'addpoint',
                                path: data.path
                            }, user, (err, newPoint) => {
                                callback({
                                    msg: 'success'
                                }, newPoint);
                            });
                        } else {
                            return callback({
                                msg: 'success'
                            }, point);
                        }
                    }
                });
            });
        });
    }

    copyPoint(data, cb) {
        const hierarchyModel = new Hierarchy();
        const report = new Report();
        let newPoint = data.newPoint;
        const targetUpi = this.getNumber(newPoint.targetUpi);
        const parentNode = this.getNumber(newPoint.parentNode);
        const display = newPoint.display;

        const updateRef = (point, newId, oldId) => {
            let refs = point['Point Refs'];
            for (var r = 0; r < refs.length; r++) {
                if (refs[r].Value === oldId) {
                    refs[r].Value = newId;
                }
                if (refs[r].PointInst === oldId) {
                    refs[r].PointInst = newId;
                }
            }
        };
        const buildPoint = (targetUpi, parentNode, display, callback) => {
            this.initPoint({
                targetUpi,
                parentNode,
                display
            }, (err, validatedPoint) => {
                if (err) {
                    return callback(err);
                }
                let points = [{
                        newPoint: validatedPoint
                    }],
                    reportCallback = (err, report) => {
                        callback(err, points);
                    };
                switch (validatedPoint['Point Type'].Value) {
                    case 'Schedule':
                    case 'Sequence':
                        this.iterateCursor({
                            query: {
                                _parentUpi: targetUpi
                            }
                        }, (err, child, nextChild) => {
                            this.initPoint({
                                parentUpi: validatedPoint.id,
                                targetUpi: child._id,
                                parentNode: validatedPoint.id,
                                display: child.display,
                                parentPath: validatedPoint.path
                            }, (err, newBlock) => {
                                newBlock._parentUpi = newBlock.parentNode;
                                points.push({
                                    newPoint: newBlock
                                });
                                updateRef(validatedPoint, newBlock.id, child._id);
                                nextChild();
                            });
                        }, (err, count) => {
                            callback(err, points);
                        });
                        break;
                    case 'Report':
                        let reportCriteria = {
                            id: validatedPoint._id,
                            data: validatedPoint,
                            resolvePointRefs: true
                        };
                        this.getPointById(reportCriteria, () => {
                            if (err) {
                                return callback(err);
                            }
                            report.getReportColumnInfo(validatedPoint, null, null, reportCallback);
                        });
                        break;
                    default:
                        callback(err, points);
                        break;
                }
            });
        };

        buildPoint(targetUpi, parentNode, display, cb);
    }

    bulkAdd(points, user, options, cb) {
        let updatedPoints = [];
        this.changeNewIds(points, (err, points) => {
            async.eachSeries(points, (point, callback) => {
                this.addPoint(point, user, options, (err, point) => {
                    if (!!err && !err.hasOwnProperty('msg')) {
                        return callback(err);
                    }
                    updatedPoints.push(point);
                    return callback();
                });
            }, (err) => {
                if (err) {
                    return cb(err);
                }
                return cb({
                    msg: 'success'
                }, updatedPoints);
            });
        });
    }

    changeNewIds(points, cb) {
        this.updateIds(points, (err) => {
            this.reassignRefs(points);
            cb(null, points);
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

    updateIds(points, callback) {
        let counterModel = new Counter();
        async.eachSeries(points, (point, seriesCallback) => {
            if (point.newPoint.hasOwnProperty('id')) {
                counterModel.getUpiForPointType(point.newPoint['Point Type'].eValue, (err, newUpi) => {
                    point.newPoint._id = newUpi;
                    if (point.newPoint['Point Type'] === 'Schedule Entry') {
                        point.newPoint.name2 = newUpi;
                        this.rebuildName(point.newPoint);
                    }
                    seriesCallback(err);
                });
            } else {
                return seriesCallback();
            }
        }, callback);
    }

    reassignRefs(points) {
        for (var p = 0; p < points.length; p++) {
            let point = points[p].newPoint;
            for (var rp = 0; rp < points.length; rp++) {
                let refPoint = points[rp].newPoint;
                let refs = refPoint['Point Refs'];
                for (var r = 0; r < refs.length; r++) {
                    let ref = refs[r];
                    if (ref.Value === point.id) {
                        ref.Value = point._id;
                        ref.PointInst = point._id;
                    }
                }
                if (refPoint.parentNode === point.id) {
                    refPoint.parentNode = point._id;
                }
                if (refPoint._parentUpi === point.id) {
                    refPoint._parentUpi = point._id;
                }
            }
        }
    }

    ////////////////////////////////////////////
    // Gets remote units attached to a device //
    ////////////////////////////////////////////
    getRemoteUnits(data, cb) {
        let upi = parseInt(data.deviceUpi, 10);

        this.getAll({
            query: {
                'Point Type.Value': 'Remote Unit',
                'Point Refs': {
                    $elemMatch: {
                        'Value': upi,
                        'PropertyName': 'Device Point'
                    }
                }
            }
        }, cb);
    }

    getMeters(data, cb) {
        let upis = data.upis;

        if (!(upis instanceof Array)) {
            upis = JSON.parse(upis);
        }
        upis = upis.map((upi) => {
            return parseInt(upi, 10);
        });

        let criteria = {
            query: {
                _id: {
                    $in: upis
                }
            },
            fields: {
                Name: 1
            }
        };

        this.getAll(criteria, cb);
    }

    addGroups(data, cb) {
        let newGroups = (data.Groups) ? data.Groups : [];
        let points = (data.Points) ? data.Points : [];
        let searchFilters = (data.searchFilters) ? data.searchFilters : null;
        let criteria = {};

        if (points.length < 1 || !searchFilters) {
            return cb('No points or filters given.');
        }

        let updateCriteria = {
            $addToSet: {
                Security: {
                    $each: []
                }
            }
        };

        for (let m = 0; m < newGroups.length; m++) {
            newGroups[m].groupId = new ObjectID(newGroups[m].groupId);

            newGroups[m].Permissions = parseInt(newGroups[m].Permissions, 10);
            if ((newGroups[m].Permissions & WRITE) !== 0) { // If write, get read, ack and control
                newGroups[m].Permissions = newGroups[m].Permissions | READ | ACKNOWLEDGE | CONTROL;
            }
            if ((newGroups[m].Permissions & CONTROL) !== 0) { // If control, get read
                newGroups[m].Permissions |= READ;
            }
            if (newGroups[m].Permissions === undefined) {
                newGroups[m].Permissions = 0;
            }

            updateCriteria.$addToSet.security.$each.push(newGroups[m]);
        }


        async.eachSeries(newGroups, (newGroup, callback) => {
            async.waterfall([

                (wfCb) => {
                    criteria = {
                        query: {
                            _id: newGroup.groupId
                        }
                    };
                    this.getOne(criteria, (err, group) => {
                        wfCb(err, (group !== null) ? group.Users : null);
                    });
                },
                (users, wfCb) => {
                    if (searchFilters) {
                        let searchCriteria = {};
                        searchCriteria.name1 = {
                            '$regex': '(?i)' + '^' + searchFilters.name1
                        };
                        searchCriteria.name2 = {
                            '$regex': '(?i)' + '^' + searchFilters.name2
                        };
                        searchCriteria.name3 = {
                            '$regex': '(?i)' + '^' + searchFilters.name3
                        };
                        searchCriteria.name4 = {
                            '$regex': '(?i)' + '^' + searchFilters.name4
                        };

                        for (let user in users) {
                            updateCriteria.$addToSet.security.$each.push({
                                userId: new ObjectID(user),
                                groupId: newGroup.groupId
                            });
                        }
                        criteria = {
                            query: searchCriteria,
                            updateObj: updateCriteria
                        };
                        this.updateAll(criteria, (err) => {
                            wfCb(err, true);
                        });
                    } else {
                        async.eachSeries(points, (upi, cb2) => {
                            let id;
                            if (upi.length < 12) {
                                id = parseInt(upi, 10);
                            } else {
                                id = new ObjectID(upi);
                            }
                            let searchCriteria = {
                                '_id': id
                            };

                            for (let user in users) {
                                updateCriteria.$addToSet.security.$each.push({
                                    userId: new ObjectID(user),
                                    groupId: newGroup.groupId
                                });
                            }
                            criteria = {
                                query: searchCriteria,
                                updateObj: updateCriteria
                            };
                            this.updateAll(criteria, (err) => {
                                cb2(err);
                            });
                        }, (err) => {
                            wfCb(err, true);
                        });
                    }
                }
            ], (err) => {
                callback(err);
            });
        }, (err) => {
            return cb(err);
        });
    }

    removeGroups(data, cb) {
        let groupUpis = (data['User Group Upis']) ? data['User Group Upis'] : [];
        let points = (data.Points) ? data.Points : [];
        let id;

        if (points.length < 1) {
            return cb('No points given.');
        }

        let updateCriteria = {
            $pull: {
                'Security': {
                    $and: []
                }
            }
        };

        for (let i = 0; i < groupUpis.length; i++) {
            updateCriteria.$pull.security.$and.push({
                groupId: new ObjectID(groupUpis[i])
            });
        }

        async.eachSeries(points, (upi, callback) => {
            if (upi.length < 12) {
                id = parseInt(upi, 10);
            } else {
                id = new ObjectID(upi);
            }

            let searchCriteria = {
                '_id': id
            };

            let criteria = {
                query: searchCriteria,
                updateObj: updateCriteria
            };

            this.updateOne(criteria, (err) => {
                callback(err);
            });
        }, cb);
    }

    linkWithOldUpi(upi, cb) {
        this.getOne({
            _id: upi
        }, {
            fields: {
                _oldUpi: 1
            }
        }, (err, point) => {
            return cb(err, point._oldUpi);
        });
    }

    doPointPackage(data, cb) {
        // reassignids for new blocks
        // update refs on blocks and on gpl
        let user = data.user;
        let _options = {
            method: 'update',
            from: 'ui'
        };
        async.waterfall([(callback) => {
            async.mapSeries(data.deletes, (upi, mapCallback) => {
                this.deletePoint(upi, '', user, null, (response) => { // Changed calling arguments per Rob (gpl was throwing error when saving a sequence with deleted blocks)
                    mapCallback(response.err);
                });
            }, (err, newPoints) => {
                callback(err);
            });
        }, (callback) => {
            this.changeNewIds(data.updates, (err, points) => {
                let adds = [];
                let updates = [];
                points.forEach((point) => {
                    if (point.newPoint._pStatus === Config.Enums['Point Statuses'].Inactive.enum) {
                        adds.push(point);
                    } else {
                        updates.push(point);
                    }
                });
                callback(null, updates, adds);
            });
        }, (updates, adds, callback) => {
            async.mapSeries(updates, (point, mapCallback) => {
                this.newUpdate(point.oldPoint, point.newPoint, _options, user, (response, updatedPoint) => {
                    mapCallback(response.err, updatedPoint);
                });
            }, (err, newPoints) => {
                callback(err, adds, newPoints);
            });
        }, (adds, newPoints, callback) => {
            async.mapSeries(adds, (point, mapCallback) => {
                this.addPoint(point, user, null, (err, result) => {
                    mapCallback(err.err, result);
                });
            }, (err, _newPoints) => {
                callback(err, _newPoints.concat(newPoints));
            });
        }], (err, returnPoints) => {
            if (err) {
                cb(err);
            } else {
                cb(null, returnPoints);
            }
        });
    }

    addPointToHierarchy(data, cb) {
        let addedPoints = [];
        let upi = this.getNumber(data.upi);
        let parentNode = this.getNumber(data.parentNode);
        let display = this.getDefault(data.display, '');
        let nodeType = this.getDefault(data.nodeType, '');
        let nodeSubType = this.getDefault(data.nodeSubType, '');
        let locatedIn = this.getDefault(data.locatedIn, 0);
        let servedBy = this.getDefault(data.servedBy, []);
        let descriptors = this.getDefault(data.descriptors, []);
        let _pStatus = Config.Enums['Point Statuses'].Active.enum;
        this.buildPath(parentNode, display, (err, path) => {
            data.path = path;
            this.toLowerCasePath(data);
            this.findAndModify({
                query: {
                    _id: upi
                },
                updateObj: {
                    $set: {
                        parentNode,
                        display,
                        nodeType,
                        nodeSubType,
                        path,
                        _pStatus,
                        locatedIn,
                        servedBy,
                        descriptors,
                        _path: data._path
                    }
                },
                options: {
                    new: true
                }
            }, (err, result) => {
                if (err) {
                    return cb([{
                        err: err,
                        node: data
                    }]);
                }
                addedPoints.push({
                    newNode: result
                });
                return cb(null, addedPoints);
            });
        });
    }

    addPointsAndChildrenToHierarchy(data, cb) {
        let nodeSubType = this.getDefault(data.nodeSubType, '');
        let upi = this.getNumber(data.upi);

        this.addPointToHierarchy(data, (err, addedPoints) => {
            if (nodeSubType === 'Sequence') {
                this.setHierarchyParentUpi(upi, (err, addedNodes) => {
                    addedPoints.push(...addedNodes);
                    return cb(null, addedPoints);
                });
            } else if (nodeSubType === 'Schedule') {
                this.setHierarchyParentUpi(upi, (err, addedNodes) => {
                    return cb(null, addedPoints);
                });
            } else {
                this.setHierarchyScheduleReference(upi, (err, addedEntries) => {
                    return cb(null, addedPoints);
                });
            }
        });
    }

    setHierarchyParentUpi(upi, cb) {
        let newPoints = [];
        this.iterateCursor({
            query: {
                _parentUpi: upi
            }
        }, (err, block, nextBlock) => {
            let data = {
                upi: block._id,
                parentNode: upi,
                nodeType: 'Application',
                nodeSubType: block['Point Type'].Value,
                display: (block.name4 !== '') ? block.name4 : (block.name3 !== '') ? block.name3 : block.Name
            };
            this.addPointToHierarchy(data, (err, result) => {
                if (!!err) {
                    newPoints.push({
                        err: err,
                        node: data
                    });
                } else {
                    newPoints.push(...result);
                }
                nextBlock(null);
            });
        }, (err) => {
            cb(err, newPoints);
        });
    }

    setHierarchyScheduleReference(upi, cb) {
        let newPoints = [];
        this.iterateCursor({
            query: {
                'Point Refs.Value': upi,
                'Point Type.Value': 'Schedule Entry'
            }
        }, (err, scheduleEntry, nextScheduleEntry) => {
            let data = {
                upi: scheduleEntry._id,
                parentNode: upi,
                nodeType: 'Application',
                nodeSubType: scheduleEntry['Point Type'].Value,
                display: scheduleEntry.name2
            };
            this.addPointToHierarchy(data, (err, result) => {
                if (!!err) {
                    newPoints.push({
                        err: err,
                        node: data
                    });
                } else {
                    newPoints.push(...result);
                }
                nextScheduleEntry(null);
            });
        }, (err) => {
            cb(err, newPoints);
        });
    }

    buildPath(parentId, display, cb) {
        if (parentId === 0) {
            return cb(null, [display]);
        }
        this.getOne({
            query: {
                _id: parentId
            }
        }, (err, parent) => {
            let path = [display];
            if (!!parent) {
                path.unshift(...parent.path);
            }
            cb(err, path);
        });
    }

    getFilteredPoints(data, cb) {
        // Do we have a device ID?
        let deviceId = data.deviceId || null;
        // Do we have a RMU ID?
        let remoteUnitId = data.remoteUnitId || null;
        // Do we have a point type?
        let pointType = data.pointType || null;

        let terms = data.terms;
        let pointTypes = data.pointTypes;
        let pipeline = [];

        let match = {
            $and: [{
                _pStatus: Config.Enums['Point Statuses'].Active.enum
            }]
        };

        if (!!terms && terms.length) {
            match.$and.push({
                _path: {
                    $all: this.buildSearchTerms(terms)
                }
            });
        }

        if (pointTypes.length === 1 && pointTypes[0] === 'Sensor') {
            if (pointType === 'Analog Input' || pointType === 'Analog Output') {
                match.$and.push({
                    'Sensor Type.Value': pointType.split(' ')[1]
                });
            }
        }

        if (!!deviceId) {
            match.$and.push({
                'Point Refs': {
                    '$elemMatch': {
                        'PointInst': parseInt(deviceId, 10),
                        'PropertyName': 'Device Point'
                    }
                }
            });
            if (!!remoteUnitId) {
                match.$and.push({
                    'Point Refs': {
                        '$elemMatch': {
                            'PointInst': parseInt(remoteUnitId, 10),
                            'PropertyName': 'Remote Unit Point'
                        }
                    }
                });
            }
        }

        match.$and.push({
            'Point Type.Value': {
                $in: pointTypes
            }
        });

        pipeline.push({
            $match: match
        });
        pipeline.push({
            $limit: 200
        });
        pipeline.push({
            $sort: {
                'path': 1
            }
        });
        pipeline.push({
            $project: {
                _id: 1,
                pointType: '$Point Type.Value',
                reportType: '$Report Type.Value',
                path: 1,
                display: 1,
                parentNode: 1,
                Value: 1
            }
        });

        this.aggregate({
            pipeline: pipeline
        }, cb);
    }
};

module.exports = Point;

const System = require('./system');
const ActivityLog = require('./activitylog');
const AlarmDefs = require('./alarmdefs');
const History = require('./history');
const Report = require('./reports');
const Schedule = require('./schedule');
const Security = require('./security');
const Script = require('./scripts');
const Counter = require('./counter');
const Hierarchy = require('./hierarchy');
