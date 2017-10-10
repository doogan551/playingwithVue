process.setMaxListeners(0);
const async = require('async');
const db = require('../helpers/db');
const Utility = require('../models/utility');
const Config = require('../public/js/lib/config.js');
const config = require('config');
const Point = require('../models/point');
const Hierarchy = require('../models/hierarchy');

const dbConfig = config.get('Infoscan.dbConfig');
const connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

let test = () => {
    let hierarchyModel = new Hierarchy();
    console.time('test');
    hierarchyModel.createHierarchy((err) => {
        console.log(err);
        console.timeEnd('test');
    });
    // let pointModel = new Point();
    // pointModel.iterateCursor({}, (err, node, nextNode)=>{
    //     pointModel.toLowerCasePath(node);
    //     pointModel.update({query: {_id: node._id}, updateObj: {$set: {_path: node._path}}}, (err, result)=>{
    //         nextNode(err);
    //     });
    // }, (err, count)=>{
    //     console.log(err, 'done');
    // });
};

let checkHierarchy = () => {
    let pointModel = new Point();
    pointModel.iterateCursor({}, (err, point, nextPoint) => {
        let newProps = Object.keys(Config.Templates.getTemplate('Location'));
        for(var n = 0; n < newProps; n++) {
            if(!point.hasOwnProperty(newProps[n])) {
                console.log('missing property', newProps[n], point._id);
                return nextPoint(null, true);
            }
        }
        if (!point.path.includes(point.display)) {
            console.log('display not in path', point._id);
            return nextPoint(null, true);
        }
        pointModel.getOne({
            query: {
                _id: point.parentNode
            }
        }, (err, parent) => {
            if(!parent) {
                console.log('no parent', point._id, point.display);
                return nextPoint();
            }
            if(!!err) {
                return nextPoint(err);
            }
            if (!point.path.includes(parent.display)) {
                console.log('parent display not in path', point._id);
                return nextPoint(null, true);
            }
            for (var p = 0; p < parent.path; p++) {
                if (point.path[p] !== parent.path[p]) {
                    console.log('parent path and point path don\'t match', point._id);
                    return nextPoint(null, true);
                }
            }
            return nextPoint(err);
        });
    }, (err, count) => {
        console.log('done', err, count);
    });
};

let buildTags = () => {
    let pointModel = new Point();

    pointModel.iterateCursor({}, (err, doc, nextDoc) => {
        doc.tags = doc.path.map((item) => item.toLowerCase());
        if (doc.hasOwnProperty('Point Type')) {
            doc.bitType = Config.Enums['Point Types'][doc['Point Type'].Value].bit;
        }
        pointModel.update({
            query: {
                _id: doc._id
            },
            updateObj: doc
        }, (err, result) => {
            nextDoc(err);
        });
    }, (err, count) => {
        console.log(err, count, 'done');
    });
};

db.connect(connectionString.join(''), function (err) {
    checkHierarchy();
});
