process.setMaxListeners(0);
var async = require('async');
var Utility = require('../models/Utility');
var db = require('../helpers/db');
var utils = require('../helpers/utils');
var config = require('config');
var Config = require('../public/js/lib/config.js');
var logger = require('../helpers/logger')(module);
var stdin = process.openStdin();
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName].join('');

// console.log('-[name]-[item]-[type]-[location parent]-[equipment parent]-[sub items]');
// console.log('name is the displayed string');
// console.log('item is one of: location, equipment, point');
// console.log('type is the type of item: building, vav, supply room temp');
// console.log('sub types are any set of strings used to describe the item');
// console.log('each item leads with "-". name, item and type are required.');
// console.log('example:');
// console.log('-Room 103 -location -room -mechanical -chill -water');
// // trim spaces
// stdin.addListener("data", function (d) {
//     var entries = d.toString().trim().split('-').filter(function (entry) {
//         if (!!entry.length) {
//             return entry.trim();
//         }
//     });
//     if(entries.length < 3){
//         console.log('Not enough fields supplied');
//     }else{
//         Utility.insert()
//     }
// });
db.connect(connectionString, function (err) {
    let arrange = function (a, b) {
        if (a.tags.indexOf('location')) {
            return 1;
        }
        if (b.tags.indexOf('location')) {
            return -1;
        }
        if (a.tags.indexOf('equipment')) {
            return 1;
        }
        if (b.tags.indexOf('equipment')) {
            return -1;
        }
        return 0;
    };
    let getChildren = function (id) {
        console.log('-------------------');
        id = id.toString();
        Utility.get({
            collection: 'four',
            query: {
                locationRef: id
            },
            fields: {
                'display': 1,
                'locationPath': 1,
                'locationRef': 1,
                'tags': 1,
                'equipmentRefs': 1,
                'locationPaths': 1
            }
        }, function (err, children) {
            children.sort(arrange);
            children.forEach(function (child) {
                console.log(child);
            })
            console.log('...................');
        });
    };
    Utility.get({
        collection: 'four',
        query: {
            locationRef: null
        }
    }, function (err, root) {
        console.log(root);
        getChildren(root[0]._id);
    })
    stdin.addListener("data", function (d) {
        let id = d.toString().trim();
        getChildren(id);
    });
});