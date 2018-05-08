const path = require('path');
const fs = require('fs');
const ce = require('cloneextend');
const gm = require('gm');
const glob = require('glob');
const ObjectID = require('mongodb').ObjectID;
const Point = require('./point');
var utils = require('../helpers/utils');
var activityLogCollection = utils.CONSTANTS("activityLogCollection");

const Config = require('../public/js/lib/config.js');
// TODO Remove utility occurences when converted to class.
const Utility = require('./utility');

const actLogsEnums = Config.Enums['Activity Logs'];
const pointsCollection = 'points';
const versionsCollection = 'versions';


const Display = class Display {
    getDisplayInfo(upiList, cb) {
        let dbUtility = new Utility();
        let idx;
        let returnObj = {};
        let getUpiNames = function (callback) {
            dbUtility.get({
                collection: pointsCollection,
                query: {
                    '_id': {
                        $in: upiList
                    }
                },
                fields: {
                    _id: 1,
                    // Name: 1,
                    path: 1,
                    Value: 1,
                    'Point Type.Value': 1,
                    'Point Type.eValue': 1,
                    'Report Type.Value': 1,
                    'Maximum Value': 1,
                    'Minimum Value': 1
                }
            }, function (err, docs) {
                let names = {},
                    pointTypes = {},
                    reportTypes = {},
                    c,
                    row,
                    len = docs.length;

                for (c = 0; c < len; c++) {
                    row = docs[c];
                    names[row._id] = Config.Utility.getPointName(row.path);
                    pointTypes[row._id] = row['Point Type'].Value;
                    if (row['Point Type'].Value === 'Report') {
                        reportTypes[row._id] = row['Report Type'].Value;
                    }
                }

                return callback({
                    upiNames: names,
                    pointTypes: pointTypes,
                    reportTypes: reportTypes,
                    points: docs
                });
            });
        };

        for (idx = 0; idx < upiList.length; idx++) {
            upiList[idx] = +upiList[idx];
        }

        getUpiNames((ret) => {
            cb(null, ret);
        });
    }

    viewDisplay(data, cb) {
        const point = new Point();
        let upi = +data.upoint;
        let user = data.user;
        point.getOne({
            query: {
                _id: upi
            }
        }, (err, display) => {
            if (!!display) {
                let upiList = display['Screen Objects'].map((obj) => {
                    return obj.upi;
                });

                this.getDisplayInfo(upiList, (err, ret) => {
                    ret.pointData = display;
                    ret.upi = upi;
                    ret.user = user;
                    cb(ret);
                });
            } else {
                let ret = {
                    pointData: {},
                    upiNames: {},
                    user: user,
                    reportTypes: {},
                    pointTypes: {},
                    points: []
                };

                cb(ret);
            }
        });
    }

    displayGif(data, cb) {
        let filename = data.fname + '.gif';
        let frame = parseInt(data.frame, 10);
        let dirname = __dirname.replace(/\\/g, '/');
        let assetPath = dirname + '/../public/display_assets/assets/';
        let frameDir = 'frames/';
        // retried = false,
        let filepath = assetPath + filename;
        let frameFilename;
        let setFrameFilename = function (fr) {
            frameFilename = filename.replace('.gif', '_frame_' + fr + '.gif');
        };
        let splitIntoFrames = function (fn) {
            gm(filepath).out('+adjoin').write(assetPath + frameDir + filename.replace('.gif', '_frame_%d.gif'), function () {
                fn();
            });
        };
        let sendFullImage = function () {
            fs.readFile(filepath, function (err, result) {
                if (err) {
                    console.log('Displays: Error sending full gif file: ', err.code);
                    return cb(err);
                }
                return cb(null, result);
            });
        };
        let sendSingleFrame = function () {
            fs.readFile(assetPath + frameDir + frameFilename, function (err, result) {
                if (err) { //invalid frame/file
                    console.log('Displays: Error sending single frame: ', err);
                    return cb(err);
                }
                return cb(null, result);
            });
        };

        if (!filename.match('.gif')) {
            filename += '.gif';
        }

        //create frame dir if doesn't exist
        fs.exists(assetPath + frameDir, function (dexists) {
            let retried = false,
                getFiles = function () {
                    if (isNaN(frame)) {
                        sendFullImage();
                    } else {
                        setFrameFilename(frame);
                        glob(assetPath + frameDir + filename.replace('.gif', '_frame_*.gif'), function (err, files) {
                            let oldFrame = frame;

                            if (files.length === 0) {
                                if (retried === false) {
                                    retried = true;
                                    splitIntoFrames(getFiles);
                                } else {
                                    return cb('No frame in file.');
                                }
                            } else if (files.indexOf(assetPath + frameDir + frameFilename) > -1) { //frame exists
                                sendSingleFrame();
                            } else { //invalid frame
                                if (frame < 0) {
                                    frame = 0;
                                } else {
                                    frame = files.length - 1;
                                }

                                console.log('Displays: Invalid frame (' + oldFrame + ') for', filename, 'sending', frame);

                                setFrameFilename(frame);
                                sendSingleFrame();
                            }
                        });
                    }
                };

            if (!dexists) {
                fs.mkdir(assetPath + frameDir, function () {
                    getFiles();
                });
            } else {
                getFiles();
            }
        });
    }
    getName(data, cb) {
        Utility.get({
            collection: pointsCollection,
            query: {
                '_id': +data.upi
            }
        }, function (err, docs) {
            if (docs.length > 0) {
                return cb(null, docs[0].Name);
            }
            return cb('#' + data.upi + ' not found');
        });
    }

    save(data, cb) {
        console.log('saving display');
        return cb('saved');
    }

    publish(data, cb) {
        var dId,
            c,
            displayObject = JSON.parse(data.display),
            oldVersion,
            obj,
            rootPath = __dirname + '/../public/display_assets/assets/',
            makeHandler = function (name) {
                return function (err) {
                    if (err) {
                        console.log('DISPLAYS:Error moving', name);
                    }
                    console.log('DISPLAYS: saved uploaded file:', name);
                };
            },
            uploadedFiles = data.files,
            list = Object.keys(uploadedFiles || {});

        let dbUtility = new Utility();

        for (c = 0; c < list.length; c++) {
            obj = uploadedFiles[list[c]];
            obj.mv(rootPath + obj.name, makeHandler(obj.name));
            // fs.writeFile(rootPath + obj.name, obj.data, makeHandler(obj.name));
        }

        return cb(null, {
            msg: 'Success'
        });

        // displayObject.eDate = Math.round(+new Date() / 1000);
        // dId = +displayObject._id;
        // displayObject._id = +displayObject._id;
        // displayObject.vid = +displayObject.vid;
        // displayObject._actvAlmId = ObjectID(displayObject._actvAlmId);
        // delete displayObject.version;

        // console.log('displays: finding display-', displayObject._id);
        // dbUtility.get({
        //     collection: pointsCollection,
        //     query: {
        //         '_id': displayObject._id
        //     }
        // }, function (e, d) {
        //     if (e) {
        //         console.log('publish find err:', e);
        //     }

        //     console.log('displays: found ', d.length, ' docs');

        //     displayObject._pStatus = 0;

        //     dbUtility.update({
        //             collection: pointsCollection,
        //             query: { //update the display
        //                 '_id': displayObject._id
        //             },
        //             updateObj: displayObject
        //         },
        //         function (err, docs) {
        //             var logData = {
        //                 user: data.user,
        //                 timestamp: Date.now(),
        //                 point: displayObject,
        //                 activity: actLogsEnums["Display Edit"].enum,
        //                 log: "Display edited."
        //             };

        //             if (err) {
        //                 return cb({
        //                     err: err
        //                 });
        //             }

        //             return cb(null, {
        //                 msg: 'Success'
        //             });
        //         }
        //     );
        // });
    }
};

module.exports = Display;

// let renderDisplay = function (data, currDisp, versions, cb) {
//     let dbUtility = new Utility();
//     let c, len,
//         upiList = [],
//         getUpiNames = function (callback) {
//             dbUtility.get({
//                 collection: pointsCollection,
//                 query: {
//                     '_id': {
//                         $in: upiList
//                     }
//                 },
//                 fields: {
//                     _id: 1,
//                     Name: 1
//                 }
//             }, function (err, docs) {
//                 let ret = {},
//                     cc,
//                     lenn = docs.length;

//                 for (cc = 0; cc < lenn; cc++) {
//                     ret[docs[cc]._id] = docs[cc].Name;
//                 }

//                 callback(err, ret);
//             });
//         };

//     len = currDisp['Screen Objects'].length;
//     for (c = 0; c < len; c++) {
//         upiList.push(currDisp['Screen Objects'][c].upi);
//     }

//     getUpiNames(function (err, upiNames) {
//         // currDisp.upiNames = upiNames;
//         currDisp._id = data.upoint;

//         return cb(err, {
//             upi: data.upoint,
//             displayJson: currDisp,
//             upiNames: upiNames,
//             versions: versions
//         });
//     });
// };


const ActivityLog = require('./activitylog');
