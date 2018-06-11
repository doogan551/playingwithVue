process.setMaxListeners(0);
const async = require('async');
const db = require('../helpers/db');
const Utility = require('../models/utility');
const Config = require('../public/js/lib/config.js');
const config = require('config');
const Point = require('../models/point');
const Hierarchy = require('../models/hierarchy');
const System = require('../models/system');

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
        for (var n = 0; n < newProps; n++) {
            if (!point.hasOwnProperty(newProps[n])) {
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
            if (!parent) {
                console.log('no parent', point._id, point.display);
                return nextPoint();
            }
            if (!!err) {
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

let fixToUUtil = () => {
    let systemModel = new System();
    let pointModel = new Point();

    systemModel.getOne({
        query: {
            Name: 'Weather'
        }
    }, (err, weather) => {
        async.eachOfSeries(weather, (value, prop, callback) => {
            if (typeof value === 'number') {
                pointModel.getOne({
                    query: {
                        _oldUpi: value
                    }
                }, (err, refPoint) => {
                    weather[prop] = (!!refPoint) ? refPoint._id : 0;
                    callback(err);
                });
            } else {
                return callback();
            }
        }, (err) => {
            systemModel.update({
                query: {
                    Name: 'Weather'
                },
                updateObj: weather
            }, (err, results) => {
                console.log('done', err, results);
            });
        });
    });
};

let compareDBs = () => {
    let pointModel = new Point();
    const mongo = require('mongodb');

    mongo.connect('mongodb://localhost:27017', (err, conn) => {
        conn.db('msfc').collection('points').findOne({
            _id: 36700161
        }, (err, result) => {
            pointModel.getOne({
                query: {
                    _id: 36700161
                }
            }, (err, point) => {
                for (var prop in point) {
                    if (!result.hasOwnProperty(prop)) {
                        console.log(1, prop);
                    }
                }
                for (var key in result) {
                    if (!point.hasOwnProperty(key)) {
                        console.log(1, key);
                    }
                }
                console.log('done');
            });
        });
    });
};

let updateMSV = () => {
    let pointModel = new Point();
    let pointType = 'MultiState Value';
    let properties = ['Alarm Class', 'Alarm Delay Time', 'Alarm Repeat Enable', 'Alarm Repeat Time', 'Alarms Off', 'Default Value',
        'Demand Enable', 'Demand Interval', 'Fail Action', 'Interlock State'
    ];
    let pointRefs = ['Alarm Display Point', 'Interlock Point', 'Monitor Point', 'Feedback Point'];

    pointModel.iterateCursor({
        query: {
            'Point Type.Value': pointType
        }
    }, (err, doc, nextDoc) => {
        properties.forEach((prop) => {
            doc[prop] = Config.Templates.getTemplate(pointType)[prop];
        });
        doc['Point Refs'] = [doc['Point Refs'][0], doc['Point Refs'][1]];
        pointRefs.forEach((ref) => {
            doc['Point Refs'].push(Config.Utility.getPropertyObject(ref, Config.Templates.getTemplate(pointType)));
        });

        for (var option in doc.States.ValueOptions) {
            doc.States.AlarmValues = [doc.States.ValueOptions[option]];
            break;
        }

        doc['Alarm Messages'].push(Config.Templates.getTemplate(pointType)['Alarm Messages'][2]);

        pointModel.update({
            query: {
                _id: doc._id
            },
            updateObj: doc
        }, (err, result) => {
            return nextDoc(err);
        });
    }, (err, count) => {
        console.log('done', err, count);
    });
};

const deleteFiles = (cb) => {
    const fs = require('fs');
    const rimraf = require('rimraf');
    const dirs = ['./scripts/', './tmp/'];

    async.each(dirs, (dir, nextDir) => {
        fs.readdir(dir, (err, files) => {
            async.eachSeries(files, (file, nextFile) => {
                let filePath = dir + file;
                fs.stat(filePath, (err, stat) => {
                    if (stat.mtime.valueOf() < (Date.now() - (60 * 1000))) {
                        rimraf(filePath, nextFile);
                    } else {
                        return nextFile();
                    }
                });
            }, (err) => {
                nextDir();
            });
        });
    }, (err) => {
        cb();
    });
};

db.connect(connectionString.join(''), function (err) {
    deleteFiles((err) => {
        console.log('done');
    });
});
