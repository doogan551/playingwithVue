const fs = require('fs');

const tmp = require('tmp');
const rimraf = require('rimraf');

const Script = class Script {

    update(data, cb) {
        const compiler = new Compiler();
        let fileName = data.fileName.replace(/\.dsl$/i, '');
        let script = data.script;

        tmp.dir({
            dir: __dirname + '/../tmp/'
        }, (err, path) => {
            let filepath = path + '/' + fileName + '.dsl';
            fs.writeFile(filepath, script, (err) => {
                compiler.compile(filepath, path + '/' + fileName, (err) => {
                    fs.readFile(path + '/' + fileName + '.err', cb);
                });
            });
        });
    }
    commit(data, cb) {
        const point = new Point();
        let upi = parseInt(data.upi, 10);
        let fileName = data.fileName.replace(/\.dsl$/i, '');
        let path = data.path;

        point.getPointById({
            id: upi
        }, (err, script) => {
            fs.readFile(path + '/' + fileName + '.sym', (err, sym) => {
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

                fs.readFile(path + '/' + fileName + '.dsl', (err, dsl) => {
                    if (err) {
                        return cb(err);
                    }

                    dsl = dsl.toString();


                    script['Script Source File'] = dsl;
                    //"Script Filename": fileName + '.dsl'

                    fs.readFile(path + '/' + fileName + '.pcd', (err, pcd) => {
                        if (err) {
                            return cb(err);
                        }

                        //let buffer = new Buffer(pcd);

                        script['Compiled Code'] = pcd;
                        script['Compiled Code Size'] = pcd.length;


                        rimraf(path, (err) => {
                            if (err) {
                                return cb(err);
                            }
                            return cb(null, script);
                        });
                    });
                });
            });
        });
    }
    read(data, cb) {
        const point = new Point();
        let upi = data.upi;

        point.getPointById({
            id: upi
        }, cb);
    }

    commitScript(data, callback) {
        let fileName, path;

        let script = data.point;
        fileName = script._id;
        path = data.path;

        fs.readFile(path + '/' + fileName + '.sym', (err) => {
            if (err) {
                return callback({
                    err: err
                });
            }
            return callback({
                err: false
            });
        });
    }
};

module.exports = Script;
const Point = require('./point');
const Compiler = require('../helpers/scriptCompiler.js');
