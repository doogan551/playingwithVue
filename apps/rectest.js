const async = require('async');
const db = require('../helpers/db');
const Utility = require('../models/utility');
// const Config = require('../public/js/lib/config.js');
const config = require('config');
const Point = require('../models/point');

const dbConfig = config.get('Infoscan.dbConfig');
const connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];


let test = () => {
    let pointModel = new Point();
    let difDevice = [];
    pointModel.iterateCursor({query: {'Point Type.Value': 'Sequence'}}, (err, gpl, nextGpl)=>{
        let gplDevice = gpl['Point Refs'].find((gplRef)=>{
            if(gplRef.PropertyName === 'Device Point') {
                return true;
            }
        });
        if(!!gplDevice) {
            async.eachSeries(gpl['Point Refs'], (ref, nextRef)=>{
                if(ref.PropertyName === 'Device Point') {
                    return nextRef();
                }
                // pointModel.getOne({query: {_id: ref.Value, 'Point Refs': {$elemMatch: {'Value': {$ne: gplDevice.Value}, 'PropertyName': 'Device Point'}}}}, (err, result)=>{
                //     if(!!result) {
                //         difDevice.push({_id: result._id, Name: result.Name, gplName: gpl.Name, gplUpi: gpl._id});
                //     }
                //     nextRef();
                // });
                pointModel.getOne({query: {_id: ref.Value, 'Point Refs': {$elemMatch: {'Value': {$ne: 0}, 'PropertyName': 'Remote Unit Point'}}}}, (err, result)=>{
                    if(!!result) {
                        difDevice.push({_id: result._id, Name: result.Name, gplName: gpl.Name, gplUpi: gpl._id});
                    }
                    nextRef();
                });
            }, nextGpl);
        }else{
            return nextGpl();
        }
    }, (err, count)=>{
        console.log('done', count);
        console.log(difDevice.length, difDevice[0]);
    });
};

db.connect(connectionString.join(''), function (err) {
    test();
});
