/*var Config = require('../public/js/lib/config.js');
var async = require('async');
var path = require('path');
var sys = require('sys');
var fs = require('fs');
var ce = require('cloneextend');
var gm = require('gm');
var glob = require('glob');
var pointsCollection = "points";
var versionsCollection = "versions";
var BSON = require('mongodb').BSONPure;*/

var Utility = require('../models/utility');

module.exports = {

    getDisplayInfo: function(data, cb) {
        var upi = +data.upi;
        var upiList = data.upiList || [];
        var idx;
        var returnObj = {};
        var getUpiNames = function(callback) {
            // console.log('getting display info', upiList);
            Utility.get({
                collection: pointsCollection,
                query: {
                    "_id": {
                        $in: upiList
                    }
                },
                fields: {
                    _id: 1,
                    Name: 1,
                    'Point Type.Value': 1
                }
            }, function(err, docs) {
                var ret = {},
                    names = {},
                    pointTypes = {},
                    c,
                    len = docs.length;

                for (c = 0; c < len; c++) {
                    names[docs[c]._id] = docs[c].Name;
                    pointTypes[docs[c]._id] = docs[c]['Point Type'].Value;
                }

                return callback({
                    names: names,
                    pointTypes: pointTypes
                });
            });
        };

        for (idx = 0; idx < upiList.length; idx++) {
            upiList[idx] = +upiList[idx];
        }

        Utility.get({
            collection: versionsCollection,
            query: {
                vid: upi
            },
            sort: {
                eDate: -1
            }
        }, function(err, versions) {
            var callback = function(ret) {
                returnObj.upiNames = ret.names;
                returnObj.pointTypes = ret.pointTypes;
                return cb(returnObj);
            };
            returnObj.versions = versions;
            getUpiNames(callback);
        });
    },

    displaygif: function(data, cb) {
        var filename = data.fname + '.gif';
        var frame = parseInt(data.frame, 10);
        var dirname = __dirname.replace(/\\/g, '/');
        var assetPath = dirname + '/../public/display_assets/assets/';
        var frameDir = 'frames/';
        // retried = false,
        var filepath = assetPath + filename;
        var frameFilename;
        var setFrameFilename = function(fr) {
            frameFilename = filename.replace('.gif', '_frame_' + fr + '.gif');
        };
        var splitIntoFrames = function(fn) {
            gm(filepath).out('+adjoin').write(assetPath + frameDir + filename.replace('.gif', '_frame_%d.gif'), function() {
                fn();
            });
        };
        var sendFullImage = function() {
            fs.readFile(filepath, function(err, result) {
                if (err) {
                    console.log('Displays: Error sending full gif file: ', err);
                    return cb(err);
                } else {
                    return cb(null, result);
                }
            });
        };
        var sendSingleFrame = function() {
            fs.readFile(assetPath + frameDir + frameFilename, function(err, result) {

                if (err) { //invalid frame/file
                    console.log('Displays: Error sending single frame: ', err);
                    return cb(err);
                } else {
                    return cb(null, result);
                }
            });
        };

        if (!filename.match('.gif')) {
            filename += '.gif';
        }

        //create frame dir if doesn't exist
        fs.exists(assetPath + frameDir, function(dexists) {
            var retried = false,
                complete = function() {
                    if (isNaN(frame)) {
                        sendFullImage();
                    } else {
                        fs.exists(assetPath + frameDir + filename + frame, function(exists) {
                            if (exists) {
                                sendSingleFrame();
                            } else {
                                splitIntoFrames(sendSingleFrame);
                            }
                        });
                    }
                },
                getFiles = function() {
                    if (isNaN(frame)) {
                        sendFullImage();
                    } else {
                        setFrameFilename(frame);
                        glob(assetPath + frameDir + filename.replace('.gif', '_frame_*.gif'), function(err, files) {
                            var oldFrame = frame;

                            if (files.length === 0) {
                                if (retried === false) {
                                    retried = true;
                                    splitIntoFrames(getFiles);
                                } else {
                                    return cb('No frame in file.');
                                }
                            } else {
                                if (files.indexOf(assetPath + frameDir + frameFilename) > -1) { //frame exists
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
                            }
                        });
                    }
                };

            if (!dexists) {
                fs.mkdir(assetPath + frameDir, function() {
                    getFiles();
                });
            } else {
                getFiles();
            }

        });
    },
    editdisplay: function(data, cb) {
        Utility.get({
                collection: versionsCollection,
                query: {
                    vid: +data.upoint
                },
                sort: {
                    version: -1,
                    eDate: -1
                }
            },
            function(err, versions) {
                console.log("err", err);
                console.log('# of display versions for ', data.upoint, ': ', versions.length);


                Utility.get({
                    collection: pointsCollection,
                    query: {
                        "_id": +data.upoint
                    }
                }, function(err, production) {
                    var disp;

                    production[0].version = 'Production';

                    if (versions.length < 1) { //if no staging versions
                        disp = ce.clone(production[0]);
                        disp.version = 'Staging';
                        disp.vid = +disp._id;
                        versions.push(disp);

                        disp._actvAlmId = 0;
                        disp.vid = disp._id;
                        delete disp._id;
                        disp.eDate = Math.round(+new Date() / 1000);

                        console.log('saving staging version', disp.version);
                        Utility.save({
                            collection: versionsCollection,
                            saveObj: disp
                        }, function(err, result) {
                            console.log('save version error', err);
                            renderDisplay(versions.slice(-1)[0], versions, cb);
                        });

                    } else {
                        versions.unshift(production[0]);
                        renderDisplay(versions[1], versions, cb);
                    }
                });
            });
    },
    previewdisplay: function(data, cb) {
        Utility.get({
            collection: pointsCollection,
            query: {
                "_id": +data.upoint,
                "Screen Objects": {
                    $exists: true
                }
            }
        }, function(err, docs) {

            //if it's found in the points collection
            if (docs.length > 0) {
                return cb(null, {
                    upi: data.upoint,
                    displayJson: docs[0]
                });
            } else {

                if (data.upoint !== '{{tab.upi}}') {
                    Utility.get({
                        collection: versionsCollection,
                        query: {
                            "_id": new BSON.ObjectID(data.upoint)
                        }
                    }, function(err, docs) {

                        if (docs.length > 0) {
                            return cb(null, {
                                upi: docs[0].vid,
                                displayJson: docs[0]
                            });
                        } else {
                            return cb('Display not found');
                        }
                    });
                } else {
                    return cb('tab.upi sent');
                }
            }
        });
    },
    getname: function(data, cb) {
        Utility.get({
            collection: pointsCollection,
            query: {
                "_id": +data.upi
            }
        }, function(err, docs) {

            if (docs.length > 0) {
                return cb(null, docs[0].Name);
            } else {
                return cb('#' + data.upi + ' not found');
            }
        });

    },

    save: function(data, cb) {
        console.log('saving display');
        return cb('saved');
    },

    publish: function(data, cb) {
        var dId,
            c,
            displayObject = JSON.parse(data.display),
            oldVersion,
            obj,
            rootPath = __dirname + '/../public/display_assets/assets/',
            makeHandler = function(name) {
                return function() {
                    console.log('DISPLAYS: saved uploaded file:', name);
                };
            },
            uploadedFiles = data.files,
            list = Object.keys(uploadedFiles);

        for (c = 0; c < list.length; c++) {
            obj = uploadedFiles[list[c]];
            fs.writeFile(rootPath + obj.originalname, obj.buffer, makeHandler(obj.originalname));
        }

        displayObject.eDate = Math.round(+new Date() / 1000);
        dId = +displayObject._id;
        displayObject._id = +displayObject._id;
        displayObject.vid = +displayObject.vid;
        displayObject._actvAlmId = BSON.ObjectID(displayObject._actvAlmId);
        delete displayObject.version;

        console.log('displays: finding display-', displayObject._id);
        Utility.get({
            collection: pointsCollection,
            query: {
                "_id": displayObject._id
            }
        }, function(e, d) {
            console.log('publish find err:', e);
            console.log('displays: found ', d.length, ' docs');
            oldVersion = ce.clone(d[0]);
            delete oldVersion._id;

            Utility.update({
                    collection: pointsCollection,
                    query: { //update the display
                        "_id": displayObject._id
                    },
                    updateObj: displayObject
                },
                function(err, docs) {
                    console.log('display publish err', err);
                    console.log('displays: updated display');
                    console.log('displays: removing display');

                    displayObject.vid = dId;
                    displayObject.version = 'Staging';
                    oldVersion.vid = dId;

                    //set version in previous production version
                    console.log('displays: updating staging version');
                    delete displayObject._id;

                    Utility.update({
                        collection: pointsCollection,
                        query: {
                            vid: dId,
                            version: 'Staging'
                        },
                        updateObj: displayObject
                    }, function(saveOldErr, saveOldRes) {

                        console.log('displays saveOld err:', saveOldErr);
                        console.log('displays saveOld res:', saveOldRes);
                        if (saveOldErr) {
                            return cb(saveOldErr);
                        } else {
                            console.log('displays: saving display in versions');
                            delete oldVersion._id;
                            delete oldVersion.version;
                            Utility.save({
                                collection: versionsCollection,
                                saveObj: oldVersion
                            }, function(saveNewErr, saveNewRes) {
                                if (saveNewErr) {
                                    return cb(saveNewErr);
                                } else {
                                    return cb(null, 'Saved and Published');
                                }
                            });
                        }
                    });
                });
        });
    },

    saveLater: function(data, cb) {
        var displayObject,
            upi;

        displayObject = JSON.parse(data.display);

        upi = +displayObject.vid;

        displayObject.vid = upi;

        displayObject.eDate = Math.round(+new Date() / 1000);
        delete displayObject._id;
        displayObject.version = 'Staging';

        console.log('displays savelater', displayObject);

        Utility.update({
                collection: versionsCollection,
                query: {
                    vid: upi,
                    version: 'Staging'
                },
                updateObj: displayObject
            },
            function(err, docs) {
                console.log('displays savelater docs', docs);
                if (err) {
                    return cb(err);
                } else {
                    return cb(null, 'Saved for later');
                }
            });

    },
    browse: function(data, cb) { //bmp
        var files,
            flist = [],
            j,
            ext;

        files = fs.readdirSync(path.join(__dirname, '..', 'public', 'display_assets', 'assets'));
        for (j = 0; j < files.length; j++) {
            ext = files[j].split('.');

            if (ext[1] !== 'gif') {
                flist.push(files[j]);
            }
        }

        return cb(null, {
            files: flist
        });

    },

    browse2: function(req, res, next) {
        var files, flist, j, ext;
        
        files = fs.readdirSync(path.join(__dirname, '..', 'public', 'display_assets', 'assets'));
        flist = [];
        for (j = 0; j < files.length; j++) {
            ext = files[j].split('.');

            if (ext[1] === 'gif') {
                flist.push(files[j]);
            }
        }

        return cb(null, {
            files: flist
        });

    },
    listassets: function(data, cb) {
        console.log(' - - - -  listassets()  called  - - - - - ');
        var filetype = data.imagetype,
            ext,
            files,
            flist = [],
            fileStats,
            assetsDir = path.join(__dirname, '..', 'public', 'display_assets', 'assets'),
            j;

        console.log(" - - -  listassets()  assetsDir = %s", assetsDir);
        files = fs.readdirSync(assetsDir);
        console.log(" - - -  listassets()  readdirSync() files.length = %s", files.length);
        for (j = 0; j < files.length; j++) {
            fileStats = fs.statSync(assetsDir + "\\" + files[j]);
            if (fileStats && !fileStats.isDirectory()) {
                if (filetype && filetype !== "*") {  // list all files when "*"
                    ext = path.extname(files[j]);
                    if (("." + filetype.toLowerCase()) === ext.toLowerCase()) {
                        flist.push({file:{filename: files[j], filesize: fileStats.size, modifieddate: fileStats.mtime}});
                    }
                } else {
                    flist.push({file:{filename: files[j], filesize: fileStats.size, modifieddate: fileStats.mtime}});
                }
            }
        }
        console.log(' - - -  flist.length = ', flist.length);
        return cb(null, { path: '/display_assets/assets/', files: flist, folders: '' } );
    }
};

var renderDisplay = function(currDisp, versions, cb) {
    var c, len,
        upiList = [],
        getUpiNames = function(callback) {
            Utility.get({
                collection: pointsCollection,
                query: {
                    "_id": {
                        $in: upiList
                    }
                },
                fields: {
                    _id: 1,
                    Name: 1
                }
            }, function(err, docs) {
                var ret = {},
                    cc,
                    lenn = docs.length;

                for (cc = 0; cc < lenn; cc++) {
                    ret[docs[cc]._id] = docs[cc].Name;
                }

                callback(ret);
            });
        };

    len = currDisp['Screen Objects'].length;
    for (c = 0; c < len; c++) {
        upiList.push(currDisp['Screen Objects'][c].upi);
    }

    getUpiNames(function(upiNames) {
        // currDisp.upiNames = upiNames;
        currDisp._id = data.upoint;

        return cb({
            upi: data.upoint,
            displayJson: currDisp,
            upiNames: upiNames,
            versions: versions
        });
    });
};