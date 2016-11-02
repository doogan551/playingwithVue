var config = require('config');
var process = require('child_process').exec;
var moment = require('moment');
var dbModel = require('../helpers/db');
var Utility = require('../models/utility');
var dbConfig = config.get('Infoscan.dbConfig');
var fromHost = "";
var fromDB = "";
var toHost = dbConfig.host;
var toDB = dbConfig.dbName;
var date = moment().format('YYYYMMDDX');
var folder = config.get('Infoscan.files').driveLetter + ':/mongodump/' + date;
var dumpFolder = config.get('Infoscan.files').driveLetter + ":/ServerInstall/mongodump/infoscan";

var Service = require('node-windows').Service;
var commandLineArgs = require('command-line-args');

var cli = commandLineArgs([{
  name: 'fromHost',
  alias: 'h',
  type: String
}, {
  name: 'fromDB',
  alias: 'd',
  type: String
}, {
  name: 'toHost',
  alias: 't',
  type: String
}, {
  name: 'toDB',
  alias: 'u',
  type: String
}]);

var options = cli.parse();

if (!options.fromHost) {
  console.error('You must supply a host to retrieve from');
  process.exit(1);
} else if (!options.fromDB) {
  console.error('You must supply a database to retrieve from');
  process.exit(1);
} else {
  fromHost = options.fromHost;
  fromDB = options.fromDB;
}

if (options.toHost) {
  toHost = options.toHost;
}
if (options.toDB) {
  toDB = options.toDB;
}


var connectionString = [dbConfig.driver, '://', toHost, ':', dbConfig.port, '/', toDB].join('');


dbModel.connect(connectionString, function(err) {
  Utility.dropDatabase(function(err, result) {
    console.log(err, result);
    child = process('"' + config.get('Infoscan.files').driveLetter + ':/Program Files/MongoDB/Server/3.2/bin/mongodump.exe" -h ' + fromHost + ' -d ' + fromDB + ' -o ' + folder, function(err, stdout, stderr) {
      logResults('mongodump out:', err, stdout, stderr);
      child = process('"' + config.get('Infoscan.files').driveLetter + ':/Program Files/MongoDB/Server/3.2/bin/mongorestore.exe" -h ' + toHost + ' -d ' + toDB + ' ' + folder + '/' + fromDB, function(err, stdout, stderr) {
        logResults('mongorestore main out:', err, stdout, stderr);
        child = process('"' + config.get('Infoscan.files').driveLetter + ':/Program Files/MongoDB/Server/3.2/bin/mongorestore.exe" -h ' + toHost + ' -d ' + toDB + ' ' + dumpFolder + '/upis.bson', function(err, stdout, stderr) {
          logResults('mongorestore upis out:', err, stdout, stderr);
          child = process('"' + config.get('Infoscan.files').driveLetter + ':/Program Files/MongoDB/Server/3.2/bin/mongorestore.exe" -h ' + toHost + ' -d ' + toDB + ' ' + dumpFolder + '/Users.bson', function(err, stdout, stderr) {
            logResults('mongorestore users out:', err, stdout, stderr);
            child = process('node apps\\importapp.js', function(err, stdout, stderr) {
              logResults('importapp out:', err, stdout, stderr);
              child = process('robocopy //' + fromHost + '/InfoScan/displays ' + config.get('Infoscan.files').driveLetter + ':/InfoscanJS/public/display_assets/assets /S', function(err, stdout, stderr) {
                logResults('robocopy out:', err, stdout, stderr);

              });
            });
          });
        });
      });
    });
  });
});



function logResults(msg, err, stdout, stderr) {
  console.log(msg);
  console.log(err);
  console.log('------');
  console.log(stdout.toString());
  console.log('------');
  console.log(stderr.toString());
  console.log('######');
}