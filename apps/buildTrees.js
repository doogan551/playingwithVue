var async = require('async');
var db = require('../helpers/db');
var config = require('config');

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

let collection = 'navigation';
let upi = 1;
let locationStructure = {
    item: 'location',
    type: '',
    display: '',
    'Location Refs': [],
    'Mechanical Refs': []
};
let refStructure = {
    'AppIndex': 0,
    'Display': '',
    'Value': '',
    'isReadOnly': false,
    'isDisplayable': true
};
let mechStructure = {
    item: 'system',
    type: '',
    display: '',
    mechanical: {
        class: ''
    },
    'Location Refs': [],
    'Mechanical Refs': []
};
let instrStructure = {
    item: 'instrumentation',
    type: '',
    display: '',
    mechanical: {
        class: '',
        component: '',
        equipment: ''
    },
    'Location Refs': [],
    'Mechanical Refs': []
};
let locations = [{
    buildings: 2,
    floors: 2,
    rooms: 3
    // }, {
    //     buildings: 100,
    //     floors: 0,
    //     rooms: 25
}];
let order = ['buildings', 'floors', 'rooms'];

let buildRef = function (obj, newRef, ref, array) {
    obj[array] = ref[array];
    newRef.Display = ref.display;
    newRef.Value = ref._id.toString();
    newRef.AppIndex = ref[array].length + 1;
    obj[array].push(newRef);
};

let buildMechanical = function (cb) {
    let buildVAVs = function (tempCount, callback) {
        utility.iterateCursor({
            collection: collection,
            query: {
                type: 'rooms'
            }
        }, function (err, room, next) {
            utility.getOne({
                collection: collection,
                query: {
                    type: 'temperature',
                    'Location Refs.Value': room._id.toString()
                }
            }, function (err, temp) {
                let newMechStructure = _.cloneDeep(mechStructure);
                let newLocRef = _.cloneDeep(refStructure);
                let newMechRef = _.cloneDeep(refStructure);
                newMechStructure.type = 'vav';
                newMechStructure.mechanical.class = 'Air Handling';
                newMechStructure.display = 'VAV ' + room.display.split('/')[1];
                buildRef(newMechStructure, newLocRef, room, 'Location Refs');
                buildRef(newMechStructure, newMechRef, temp, 'Mechanical Refs');

                utility.insert({
                    collection: collection,
                    insertObj: newMechStructure
                }, function (err, result) {
                    next(err);
                });
            });
        }, callback);
    };
    let buildTemperatures = function (callback) {
        utility.iterateCursor({
            collection: collection,
            query: {
                type: 'rooms'
            }
        }, function (err, room, next) {
            let newInstrStructure = _.cloneDeep(instrStructure);
            let newLocRef = _.cloneDeep(refStructure);
            newInstrStructure._id = upi++;
            newInstrStructure.type = 'temperature';
            newInstrStructure.mechanical.class = 'Air Handling';
            newInstrStructure.mechanical.component = 'Space';
            newInstrStructure.display = 'SPT ' + room.display.split('/')[1];

            buildRef(newInstrStructure, newLocRef, room, 'Location Refs');

            utility.insert({
                collection: collection,
                insertObj: newInstrStructure
            }, function (err, result) {
                next(err);
            });
        }, callback);
    };
    let buildAHUs = function (vavsCount, callback) {
        utility.iterateCursor({
            collection: collection,
            query: {
                type: 'floors'
            }
        }, function (err, floor, nextFloor) {
            let newMechStructure = _.cloneDeep(mechStructure);
            let newLocRef = _.cloneDeep(refStructure);
            let newMechRef = _.cloneDeep(refStructure);
            newMechStructure.type = 'ahu';
            newMechStructure.mechanical.class = 'Air Handling';
            newMechStructure.display = 'AHU ' + floor.display.split('/')[1];
            buildRef(newMechStructure, newLocRef, floor, 'Location Refs');

            utility.iterateCursor({
                collection: collection,
                query: {
                    type: 'vav',
                    'Location Refs.Value': floor._id.toString()
                }
            }, function (err, vav, nextVav) {
                vav['Mechanical Refs'] = [];
                buildRef(newMechStructure, newMechRef, vav, 'Mechanical Refs');
                nextVav();
            }, function (err, count) {
                utility.insert({
                    collection: collection,
                    insertObj: newMechStructure
                }, function (err, result) {
                    nextFloor(err);
                });
            });
        }, callback);
    };
    async.waterfall([buildTemperatures, buildVAVs, buildAHUs], cb);
};

let buildLocations = function (set, setIndex, index, refs, cb) {
    let locationType = order[index];
    // each building
    // each floor per building
    // each room per floor
    let i = 0;
    if (set[locationType] === 0) {
        buildLocations(set, setIndex, index + 1, refs, cb);
    } else {
        async.whilst(function () {
            return i < set[locationType];
        }, function (callback) {
            let newLocation = _.cloneDeep(locationStructure);
            let newRef = _.cloneDeep(refStructure);
            newLocation.type = locationType;
            newLocation.display = locationType.substr(0, locationType.length - 1) + '/' + setIndex.toString() + '-' + (i + 1).toString();
            newLocation['Location Refs'] = refs;
            utility.insert({
                collection: collection,
                insertObj: newLocation
            }, function (err, result) {
                if (index >= order.length - 1) {
                    i++;
                    return callback();
                }
                newRef.AppIndex = index + 1;
                newRef.Display = newLocation.display;
                newRef.Value = result.ops[0]._id.toString();
                refs.push(newRef);

                buildLocations(set, setIndex, index + 1, refs, function () {
                    i++;
                    callback();
                });
            });
        }, function (err) {
            refs.pop();
            cb();
        });
    }
};

let iterateLocations = function (set, setIndex, cb) {
    // async.eachSeries(order, function (locationType, callback) {
    let array = [];
    buildLocations(set, setIndex, 0, array, cb);
    // }, cb);
};

let buildTree = function () {
    db.connect(connectionString.join(''), function (err) {
        utility.remove({
            collection: collection
        }, function () {
            async.eachOfSeries(locations, iterateLocations, function (err) {
                buildMechanical(function (err) {
                    console.log('done');
                });
            });
        });
    });
};

buildTree();
var Utility = require('../models/utility');
let utility = new Utility();
