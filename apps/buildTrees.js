var async = require('async');
var db = require('../helpers/db');
var Utility = require('../models/utility');
var Config = require('../public/js/lib/config.js');
var config = require('config');
var ObjectID = require('mongodb').ObjectID;

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

let locationStructure = {
    item: 'location',
    type: '',
    display: '',
    'Location Refs': []
};
let locationRefStructure = {
    'AppIndex': 0,
    'Display': '',
    'Value': '',
    'isReadOnly': false,
    'isDisplayable': true
};
let locations = [{
    buildings: 200,
    floors: 10,
    rooms: 50
}, {
    buildings: 100,
    floors: 0,
    rooms: 25
}];
let order = ['buildings', 'floors', 'rooms'];

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
            let newRef = _.cloneDeep(locationRefStructure);
            newLocation.type = locationType;
            newLocation.display = locationType.substr(0, locationType.length - 1) + '/' + setIndex.toString() + '-' + (i + 1).toString();
            newLocation['Location Refs'] = refs;
            Utility.insert({
                collection: 'locations',
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
    buildLocations(set, setIndex, 0, new Array(), cb);
    // }, cb);
};

let buildTree = function () {
    db.connect(connectionString.join(''), function (err) {
        Utility.remove({
            collection: 'locations'
        }, function () {
            async.eachOfSeries(locations, iterateLocations, function (err) {
                console.log('done');
            });
        });
    });
};

buildTree();