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
    let pointTypes = [];
    let types = Config.Enums['Point Types'];
    for(var type in types) {
        pointTypes.push(type);
    }

    let queries = [{
        path: {
            $all: pointModel.buildSearchTerms(['4220', 'unv01'])
        },
        'Point Type.Value': {$in: pointTypes}
    }, {
        path: {
            $all: pointModel.buildSearchTerms(['4'])
        },
        'Point Type.Value': {$in: pointTypes}
    }, {
        path: {
            $all: pointModel.buildSearchTerms(['4', 'u'])
        },
        'Point Type.Value': {$in: pointTypes}
    }, {
        path: {
            $all: pointModel.buildSearchTerms(['4220', 'UNV01'])
        },
        'Point Type.Value': {$in: pointTypes}
    }, {
        path: {
            $all: pointModel.buildSearchTerms(['4220', 'unv01'])
        },
        'Point Type.Value': {$in: ['Device']}
    }, {
        path: {
            $all: pointModel.buildSearchTerms(['4'])
        },
        'Point Type.Value': {$in: ['Device']}
    }, {
        path: {
            $all: pointModel.buildSearchTerms(['4', 'u'])
        },
        'Point Type.Value': {$in: ['Device']}
    }, {
        path: {
            $all: pointModel.buildSearchTerms(['4220', 'UNV01'])
        },
        'Point Type.Value': {$in: ['Device']}
    } ];

    async.eachSeries(queries, (query, nextQuery)=>{
        console.time('test');
        pointModel.getAll({
            query,
            limit: 200,
            sort: {
                path: 1
            }
        }, (err, results) => {
            console.timeEnd('test');
            nextQuery(err);
        });
    }, (err)=>{
        console.log(err, 'done');
    });
};

let buildTags = () => {
    let pointModel = new Point();

    pointModel.iterateCursor({}, (err, doc, nextDoc)=>{
        doc.tags = doc.path.map((item)=>item.toLowerCase());
        doc.tags.push(doc['Point Type'].Value.toLowerCase());
        pointModel.update({query: {_id: doc._id}, updateObj: doc}, (err, result) =>{
            nextDoc(err);
        });
    }, (err, count)=>{
        console.log(err, count, 'done');
    });
};

db.connect(connectionString.join(''), function (err) {
    buildTags();
});
