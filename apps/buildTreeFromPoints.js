var async = require('async');
var db = require('../helpers/db');
var config = require('config');
var ObjectId = require('mongodb').ObjectId;

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

let areaAbbreviations = {
    'n': 'North',
    's': 'South',
    'e': 'East',
    'w': 'West',
    'ne': 'North East',
    'nw': 'North West',
    'se': 'South East',
    'sw': 'South West',
    'center': 'Center',
    'north': 'North',
    'south': 'South',
    'east': 'East',
    'west': 'West',
    'lobby': 'Lobby'
};

let groupings = ['Shop', 'Simulator', 'Schedule Entry', 'Sensor', 'MSFC'];

let locationStructure = {
    item: 'Location',
    type: '',
    display: '',
    meta: {
        coords: {
            lat: '34.648902',
            long: '-86.668932'
        },
        address: {
            street: 'Redstone Arsenal, Marshall Space Flight Center',
            city: 'Huntsville',
            state: 'AL',
            zip: '35811'
        },
        description: 'Marshall Space Flight Center.',
        tz: 'Chicago'
    },
    hierarchyRefs: [],
    tags: []
};
let pointStructure = {
    item: 'Instrumentation',
    type: '',
    display: '',
    meta: {
        coords: {
            lat: '34.648902',
            long: '-86.668932'
        },
        address: {
            street: 'Redstone Arsenal, Marshall Space Flight Center',
            city: 'Huntsville',
            state: 'AL',
            zip: '35811'
        },
        description: 'Marshall Space Flight Center.',
        tz: 'Chicago'
    },
    hierarchyRefs: [],
    tags: []
};
let refStructure = {
    'isReadOnly': false,
    'display': '',
    'value': 0,
    'type': '',
    'isDisplayable': true,
    'item': 'Location'
};

let otherGroup = null;

let buildTree = () => {
    console.time('tree');
    let utilityModel = new Utility('points');
    let commonModel = new Common();
    let root = _.cloneDeep(locationStructure);

    addLocation('Site', 'MSFC', _.cloneDeep(refStructure), (err, newRef) => {
        addLocation('Group', 'Other', newRef, (err, otherRef) => {
            otherGroup = otherRef;
            utilityModel.distinct({
                field: 'name1'
            }, (err, name1s) => {
                let names = [];
                name1s.forEach((name1) => {
                    let newName = getBuildingDisplay(name1);
                    if (!names.includes(newName)) {
                        names.push(newName);
                    }
                });
                async.eachSeries(names, (name, cb) => {
                    addLocation('Building', name, newRef, (err, nextRef) => {
                        findFloors(name, nextRef, cb);
                    });
                }, (err) => {
                    addPointsToModel((err) => {
                        console.log('addPointsToModel', err);
                        moveNonBuildings((err) => {
                            console.log('done', err);
                            console.timeEnd('tree');
                            process.exit(0);
                        });
                    });
                });
            });
        });
    });
};

let addLocation = function (type, name, parentRef, cb) {
    let counterModel = new Counter();
    let utilityModel = new Utility('hierarchy');
    let newLocation = _.cloneDeep(locationStructure);
    let newRef = _.cloneDeep(refStructure);
    let mechRef = _.cloneDeep(refStructure);
    mechRef.item = 'Mechanical';

    newLocation.type = type;
    newLocation.display = name;
    newLocation.hierarchyRefs.push(parentRef);
    newLocation.hierarchyRefs.push(mechRef);
    newLocation.tags = [newLocation.type, newLocation.display, 'Location'];
    counterModel.getNextSequence('hierarchy', function (err, newId) {
        newLocation._id = newId;
        utilityModel.insert({
            insertObj: newLocation
        }, function (err, result) {
            newRef.display = newLocation.display;
            newRef.value = newLocation._id;
            newRef.type = newLocation.type;
            cb(err, newRef);
        });
    });
};

let addPoint = function (type, name, parentRef, cb) {
    let counterModel = new Counter();
    let utilityModel = new Utility('hierarchy');
    let newPoint = _.cloneDeep(pointStructure);
    let newRef = _.cloneDeep(refStructure);
    let mechRef = _.cloneDeep(refStructure);
    mechRef.item = 'Mechanical';

    newPoint.type = type;
    newPoint.display = name;
    newPoint.hierarchyRefs.push(parentRef);
    newPoint.hierarchyRefs.push(mechRef);
    newPoint.tags = [newPoint.type, newPoint.display, 'Location'];
    counterModel.getNextSequence('hierarchy', function (err, newId) {
        newPoint._id = newId;
        utilityModel.insert({
            insertObj: newPoint
        }, function (err, result) {
            newRef.display = newPoint.display;
            newRef.value = newPoint._id;
            newRef.type = newPoint.type;
            cb(err, newRef);
        });
    });
};

let findFloors = (name, parentRef, cb) => {
    let utilityModel = new Utility('points');
    utilityModel.distinct({
        field: 'name2',
        query: {
            name1: RegExp(name),
            name2: RegExp('flr', 'i')
        }
    }, (err, name2s) => {
        let floors = {};
        name2s.forEach((name2) => {
            // console.log(name, name2);
            let display = getFloorDisplay(name2);
            if (!floors.hasOwnProperty(display)) {
                floors[display] = [];
            }
            let area = getAreaDisplay(name2);
            if (!!area) {
                if (!floors[display].includes(area)) {
                    floors[display].push(area);
                }
            }
        });
        // console.log(floors);
        async.eachOfSeries(floors, (areas, floorName, next) => {
            if (floorName === 'Floor') {
                addAreas(areas, parentRef, next);
            } else {
                addLocation('Floor', floorName, parentRef, (err, newParent) => {
                    if (!!areas.length) {
                        addAreas(areas, newParent, next);
                    } else {
                        next(err);
                    }
                });
            }
        }, (err) => {
            cb(err, parentRef);
        });
    });
};
let findFirstNumber = (element) => {
    return element !== '';
};

let getBuildingDisplay = (name) => {
    let display = '';
    if (!!name.match(/[0-9]*/g).join('')) {
        let newName = name.match(/[0-9]*/g).find(findFirstNumber);
        if (newName.length === 4) {
            display = newName;
        }
    }
    if (display === '') {
        groupings.forEach((grouping) => {
            if (name.match(new RegExp(grouping, 'i'))) {
                display = grouping;
            }
        });
    }
    if (display === '') {
        display = name;
    }
    return display;
};

let getFloorDisplay = (name) => {
    let display = 'Floor';
    if (name.match(/[0-9]*/g).join('')) {
        display += ' ' + name.match(/[0-9]*/g).find(findFirstNumber);
    } else if (name.match(/flr/i) && name.length > 3) {
        display += name;
    }
    if (name.match(/pent/i)) {
        display = 'Penthouse';
    }
    return display;
};

let getAreaDisplay = (name) => {
    let area = name.split(' ').filter((area) => areaAbbreviations[area.toLowerCase()])[0];
    if (!!area) {
        area = areaAbbreviations[area.toLowerCase()];
    }
    return area;
};

let addAreas = (areas, newParent, cb) => {
    async.eachSeries(areas, (area, nextArea) => {
        addLocation('Area', area, newParent, nextArea);
    }, cb);
};

let addPointsToModel = (cb) => {
    let utilityModel = new Utility('points');
    let hierarchyModel = new Hierarchy();

    let findLastNode = (nodes, lastNodeCB) => {
        let parent = {
            _id: 0
        };
        let getNode = (parent, display, callback) => {
            hierarchyModel.getOne({
                query: {
                    'hierarchyRefs': {
                        $elemMatch: {
                            value: parent._id,
                            item: 'Location'
                        }
                    },
                    display
                }
            }, callback);
        };
        async.eachSeries(nodes, (node, nextNode) => {
            getNode(parent, node.display, (err, child) => {
                if (child !== null) {
                    parent = child;
                }
                nextNode();
            });
        }, (err) => {
            lastNodeCB(err, parent);
        });
    };

    utilityModel.iterateCursor({}, (err, point, nextPoint) => {
        let queries = [{
            display: 'MSFC'
        }];
        let terms = ['"MSFC"'];
        let building = getBuildingDisplay(point.name1);
        let floor;
        let area;
        if (!!point.name2.match(/flr/i)) {
            floor = getFloorDisplay(point.name2);
            area = getAreaDisplay(point.name2);
        }
        if (!!building) {
            queries.push({
                display: building
            });
            terms.push(`"${building}"`);
        }
        if (!!floor) {
            queries.push({
                display: floor
            });
            terms.push(`"${floor}"`);
        }
        if (!!area) {
            queries.push({
                display: area
            });
            terms.push(`"${area}"`);
        }
        // console.log(point.Name, JSON.stringify(queries));
        findLastNode(queries, (err, node) => {
            let newRef = _.cloneDeep(refStructure);
            newRef.display = node.display;
            newRef.value = node._id;
            newRef.type = node.type;
            addPoint(point['Point Type'].Value, point.Name, newRef, (err, result) => {
                nextPoint(err);
            });
        });
    }, cb);
};

let moveNonBuildings = (cb) => {
    let utilityModel = new Utility('points');
    let hierarchyModel = new Hierarchy();
    utilityModel.distinct({
        field: 'name1',
        query: {
            name2: new RegExp('flr', 'i')
        }
    }, (err, names) => {
        let newNames = names.map((name) => name.split(/[^0-9]*/g).filter((num) => num !== '').slice(0, 4).join(''));
        hierarchyModel.iterateCursor({
            query: {
                'hierarchyRefs': {
                    $elemMatch: {
                        value: 1,
                        item: 'Location'
                    }
                },
                _id: {
                    $ne: otherGroup.value
                }
            }
        }, (err, location, nextLocation) => {
            if (!newNames.includes(location.display)) {
                hierarchyModel.moveNode({
                    id: location._id,
                    parentId: otherGroup.value,
                    item: 'Location'
                }, (err) => {
                    nextLocation(err);
                });
            } else {
                nextLocation();
            }
        }, cb);
    });
};

let testXML = () => {
    var tj = require('togeojson'),
        fs = require('fs'),
        // node doesn't have xml parsing or a dom. use xmldom
        DOMParser = require('xmldom').DOMParser;

    var kml = new DOMParser().parseFromString(fs.readFileSync('C:/Users/rob/Downloads/MSFC Campus Map.kml', 'utf8'));

    var converted = tj.kml(kml);
    async.eachSeries(converted.features, (building, cb) => {
        addLocation(building, cb);
    }, (err) => {
        console.log('done');
        process.exit(0);
    });
};

db.connect(connectionString.join(''), function (err) {
    buildTree();
    // testXML();
});
var Utility = require('../models/utility');
var Counter = require('../models/counter');
var Common = require('../models/common');
let Hierarchy = require('../models/hierarchy');
