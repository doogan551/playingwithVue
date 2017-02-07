let tmp = require('tmp');
let fs = require('fs');
let rimraf = require('rimraf');

let Utility = require('../models/utility');
let compiler = require('../helpers/scriptCompiler.js');

module.exports = {

    update: function (data, cb) {
        let fileName = data.fileName.replace(/\.dsl$/i, '');
        let script = data.script;

        tmp.dir({
            dir: __dirname + '/../tmp/'
        }, function _tempDirCreated(err, path) {
            let filepath = path + '/' + fileName + '.dsl';
            fs.writeFile(filepath, script, function (err) {
                compiler.compile(filepath, path + '/' + fileName, function (err) {
                    fs.readFile(path + '/' + fileName + '.err', cb);
                });
            });
        });
    },
    commit: function (data, cb) {
        let upi = parseInt(data.upi, 10);
        let fileName = data.fileName.replace(/\.dsl$/i, '');
        let path = data.path;

        Utility.getOne({
            collection: 'points',
            query: {
                _id: upi
            }
        }, function (err, script) {
            fs.readFile(path + '/' + fileName + '.sym', function (err, sym) {
                if (err) {
                    return cb(err);
                }

                sym = sym.toString();
                let csv = sym.split(/[\r\n,]/);

                script = {
                    'Point Register Names': [],
                    'Integer Register Names': [],
                    'Real Register Names': [],
                    'Boolean Register Names': []
                };

                for (let i = 0; i < csv.length; i++) {
                    if (csv[i - 1] !== 'TOTAL') {
                        if (csv[i] === 'POINT') {
                            script['Point Register Names'].push(csv[i + 2]);
                        } else if (csv[i] === 'INTEGER') {
                            script['Integer Register Names'].push(csv[i + 2]);
                        } else if (csv[i] === 'REAL') {
                            script['Real Register Names'].push(csv[i + 2]);
                        } else if (csv[i] === 'BOOLEAN') {
                            script['Boolean Register Names'].push(csv[i + 2]);
                        }
                    }
                }

                script['Point Register Count'] = script['Point Register Names'].length;
                script['Integer Register Count'] = script['Integer Register Names'].length;
                script['Real Register Count'] = script['Real Register Names'].length;
                script['Boolean Register Count'] = script['Boolean Register Names'].length;

                fs.readFile(path + '/' + fileName + '.dsl', function (err, dsl) {
                    if (err) {
                        return cb(err);
                    }

                    dsl = dsl.toString();


                    script['Script Source File'] = dsl;
                    //"Script Filename": fileName + '.dsl'

                    fs.readFile(path + '/' + fileName + '.pcd', function (err, pcd) {
                        if (err) {
                            return cb(err);
                        }

                        //let buffer = new Buffer(pcd);

                        script['Compiled Code'] = pcd;
                        script['Compiled Code Size'] = pcd.length;


                        rimraf(path, function (err) {
                            if (err) {
                                return cb(err);
                            }
                            return cb(null, script);
                        });
                    });
                });
            });
        });
    },
    read: function (data, cb) {
        let upi = data.upi;

        Utility.getOne({
            collection: 'points',
            query: {
                _id: upi
            }
        }, cb);
    }
};
