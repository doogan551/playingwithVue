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
let refStructure = {
    'isReadOnly': false,
    'display': '',
    'value': 0,
    'type': '',
    'isDisplayable': true,
    'item': 'Location'
};

let buildTree = () => {
    let utilityModel = new Utility('points');
    let commonModel = new Common();
    let root = _.cloneDeep(locationStructure);

    addLocation('Site', 'MSFC', _.cloneDeep(refStructure), (err, newRef) => {
        utilityModel.distinct({
            field: 'name1'
        }, (err, name1s) => {
            async.eachSeries(name1s, (name, cb) => {
                if (!commonModel.checkNumbers(name)) {
                    addLocation('Building', name, newRef, (err, nextRef) => {
                        findFloors(name, nextRef, cb);
                    });
                } else {
                    cb();
                }
            }, (err) => {
                console.log('done');
                process.exit(0);
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
            let display = 'Floor';
            if (name2.match(/[0-9]*/g).join('')) {
                display += ' ' + name2.match(/[0-9]*/g).join('');
            }
            if (name2.match(/pent/i)) {
                display = 'Penthouse';
            }
            if (!floors.hasOwnProperty(display)) {
                floors[display] = [];
            }
            let area = name2.split(' ').filter((area) => areaAbbreviations[area.toLowerCase()])[0];
            if (!!area) {
                area = areaAbbreviations[area.toLowerCase()];
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

let addAreas = (areas, newParent, cb) => {
    async.eachSeries(areas, (area, nextArea) => {
        addLocation('Area', area, newParent, nextArea);
    }, cb);
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
