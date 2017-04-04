var async = require('async');
var _ = require('lodash');
var db = require('../helpers/db');
var config = require('config');
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];
let locationModel;
let utility;

let types = {
    site: ['s'],
    building: ['b'],
    floor: ['f'],
    room: ['r']
};

let getType = function (t) {
    if (!!types.hasOwnProperty(t)) {
        return t;
    }
    for (var type in types) {
        if (!!~types[type].indexOf(t)) {
            return type;
        }
    }
    return t;
};

let getNextSequence = function (name, callback) {
    utility.findAndModify({
        collection: 'counters',
        query: {
            _id: name
        },
        updateObj: {
            $inc: {
                count: 1
            }
        },
        options: {
            'new': true
        }
    }, callback);
};

let buildParentPath = function (parent, node, cb) {
    let type = getType(node.split(':')[0]);
    let display = node.split(':')[1];
    let buildParent = function (id) {
        return {
            Display: display,
            Value: id,
            isDisplayable: true,
            isReadOnly: false
        };
    };
    locationModel.getOne({
        query: {
            display: display,
            locationRef: parent
        }
    }, (err, node) => {
        if (!node) {
            getNextSequence('locationid', function (err, newId) {
                locationModel.insert({
                    insertObj: {
                        _id: newId.count,
                        display: display,
                        locationRef: parent,
                        type: type
                    }
                }, (err) => {
                    cb(err, buildParent(newId.count));
                });
            });
        } else {
            cb(err, buildParent(node._id));
        }
    });
};

let createLocation = function (locs) {
    let parent = null;
    async.eachSeries(locs, (loc, cb) => {
        buildParentPath(parent, loc, (err, newParent) => {
            parent = _.cloneDeep(newParent);
            cb(err);
        });
    }, (err) => {
        process.exit(0);
    });
};

db.connect(connectionString.join(''), function (err) {
    locationModel = new Location();
    utility = new Utility();
    createLocation(process.argv.splice(2)[0].split('/'));
});
var Location = require('../models/location');
var Utility = require('../models/utility');
