const async = require('async');
const db = require('../helpers/db');
const Utility = require('../models/utility');
const Config = require('../public/js/lib/config.js');
const config = require('config');
const Point = require('../models/point');

const dbConfig = config.get('Infoscan.dbConfig');
const connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

let test = () => {
    let pointModel = new Point();
    pointModel.iterateCursor({}, (err, node, nextNode)=>{
        pointModel.toLowerCasePath(node);
        pointModel.update({query: {_id: node._id}, updateObj: {$set: {_path: node._path}}}, (err, result)=>{
            nextNode(err);
        });
    }, (err, count)=>{
        console.log(err, 'done');
    });
};

let buildTags = () => {
    let pointModel = new Point();

    pointModel.iterateCursor({}, (err, doc, nextDoc)=>{
        doc.tags = doc.path.map((item)=>item.toLowerCase());
        if(doc.hasOwnProperty('Point Type')) {
            doc.bitType = Config.Enums['Point Types'][doc['Point Type'].Value].bit;
        }
        pointModel.update({query: {_id: doc._id}, updateObj: doc}, (err, result) =>{
            nextDoc(err);
        });
    }, (err, count)=>{
        console.log(err, count, 'done');
    });
};

db.connect(connectionString.join(''), function (err) {
    test();
});
