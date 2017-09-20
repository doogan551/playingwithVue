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
        if(type !== 'Schedule Entry') {
            pointTypes.push(type);
        }
    }

    let queries = [{
        tags: {$all: pointModel.buildSearchTerms([ '4220', 'unv01'])},
        bitType: {
            $bitsAnySet: Math.pow(2, 53) - 1
        }
    }, {
        tags: {$all: pointModel.buildSearchTerms([ '4'])},
        bitType: {
            $bitsAnySet: Math.pow(2, 53) - 1
        }
    }, {
        tags: {$all: pointModel.buildSearchTerms([ '4', 'u'])},
        bitType: {
            $bitsAnySet: Math.pow(2, 53) - 1
        }
    }, {
        tags: {$all: pointModel.buildSearchTerms([ '4220', 'UNV01'])},
        bitType: {
            $bitsAnySet: Math.pow(2, 53) - 1
        }
    }, {
        tags: {$all: pointModel.buildSearchTerms([ '4220', 'unv01'])},
        bitType: {
            $bitsAnySet: 8192
        }
    }, {
        tags: {$all: pointModel.buildSearchTerms([ '4'])},
        bitType: {
            $bitsAnySet: 8192
        }
    }, {
        tags: {$all: pointModel.buildSearchTerms([ '4', 'u'])},
        bitType: {
            $bitsAnySet: 8192
        }
    }, {
        tags: {$all: pointModel.buildSearchTerms([ '4220', 'UNV01'])},
        bitType: {
            $bitsAnySet: 8192
        }
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
            console.log(results.length);
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
