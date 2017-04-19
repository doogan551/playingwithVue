var async = require('async');
var db = require('../helpers/db');
var config = require('config');
var ObjectId = require('mongodb').ObjectId;

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];


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
    'isDisplayable': false,
    'item': 'Location'
};

let buildTree = () => {
    let utilityModel = new Utility('points');
    utilityModel.distinct({
        field: 'name1'
    }, (err, name1s) => {
        async.eachSeries(name1s, (name, cb) => {
            addLocation('Building', _.cloneDeep(refStructure), name, (err, nextRef) => {
                cb();
            });
        }, (err) => {
            console.log('done');
            process.exit(0);
        });
    });
};

let addLocation = function (location, cb) {
    let counterModel = new Counter();
    let utilityModel = new Utility('hierarchy');
    let newLocation = _.cloneDeep(locationStructure);
    let newRef = _.cloneDeep(refStructure);
    newLocation.type = 'Building';
    newLocation.display = location.properties.name;
    newLocation.meta.coords.lat = location.geometry.coordinates[1];
    newLocation.meta.coords.lat = location.geometry.coordinates[0];
    newLocation.hierarchyRefs.push(_.cloneDeep(refStructure));
    newLocation.tags = ['Building', newLocation.display, 'Location'];
    counterModel.getNextSequence('hierarchy', function (err, newId) {
        newLocation._id = newId;
        utilityModel.insert({
            insertObj: newLocation
        }, function (err, result) {
            newRef.Display = newLocation.display;
            newRef.Value = result.ops[0]._id;
            cb(err, newRef);
        });
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
    testXML();
});
var Utility = require('../models/utility');
var Counter = require('../models/counter');
