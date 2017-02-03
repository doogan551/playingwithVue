/**
 * Utility object to load, read, and update the archiving database
 * Currently, the database is sqlite3
 * This file is just a wrapper for the db functionality
 * documentation for this module can be found @ 
 * https://github.com/mapbox/node-sqlite3
 */

var sqlite3 = require('sqlite3').verbose();
var config = require('config');
var fs = require('fs');
var async = require('async');
var moment = require('moment');
var logger = require("../helpers/logger")(module);

var sqliteDB = {};

var driveLetter = config.get('Infoscan.files').driveLetter;
var archiveLocation = config.get('Infoscan.files').archiveLocation + config.get('Infoscan.dbConfig').dbName + '/';

/////////////////////////////////////////////////////
// Populating any necessary databases if necessary //
/////////////////////////////////////////////////////
var buildSqliteDB = function(year, callback) {
  var buildTables = function(year, tableCB) {
    var months = [];
    for (var i = 1; i <= 12; i++) {
      months.push(i);
    }
    async.eachSeries(months, function(month, cb) {
      var tableName = 'History_' + year.toString() + ((month < 10) ? '0' + month.toString() : month.toString());
      sqliteDB[year].run('CREATE TABLE IF NOT EXISTS ' + tableName + ' (UPI INTEGER NOT NULL, TIMESTAMP INTEGER NOT NULL, VALUE REAL NOT NULL, VALUETYPE INTEGER NOT NULL, STATUSFLAGS INTEGER DEFAULT 0, USEREDITED INTEGER DEFAULT 0, PRIMARY KEY(UPI, TIMESTAMP) ON CONFLICT IGNORE)', cb);
    }, tableCB);
  };

  if (!!sqliteDB) {
    // sqliteDB.close();
  }
  if (!!sqliteDB[year]) {
    return callback();
  }
  var file = 'History_' + year + '.db';
  var hsd = archiveLocation + file;

  fs.stat(archiveLocation, function(err, stats) {
    if (err) {
      var mkdirp = require('mkdirp');
      mkdirp(archiveLocation, function(err) {
        fs.openSync(hsd, 'w');
        sqliteDB[year] = new sqlite3.Database(hsd);
        buildTables(year, callback);
        // callback();
      });
    } else {
      sqliteDB[year] = new sqlite3.Database(hsd);
      buildTables(year, callback);
      // callback();
    }
  });
};

//////////////////////////////
// returns database by year //
//////////////////////////////
var getSqliteDB = function(year, callback) {
  if (!!sqliteDB[year]) {
    return callback(sqliteDB[year]);
  } else {
    buildSqliteDB(year, function() {
      return callback(sqliteDB[year]);
    });
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// On startup, loads all databases into memory by year                                              //
// Creates databases if necessary                                                                   //
// Builds next year's database if it doesn't exist (in case year rolls over without server restart) //
//////////////////////////////////////////////////////////////////////////////////////////////////////
(function buildAllSqliteDB(callback) {
  fs.readdir(archiveLocation, function(err, files) {
    if (err) {
      logger.error(err);
    }
    var databases = [];
    for (var f = 0; f < files.length; f++) {
      var file = files[f];
      if (file.slice(-3) === '.db') {
        databases.push(file);
      }
    }
    async.eachSeries(databases, function(db, cb) {
      var year = '';
      var chars = db.split('');
      for (var c = 0; c < chars.length; c++) {
        if (!isNaN(chars[c])) {
          year += chars[c];
        }
      }
      buildSqliteDB(parseInt(year, 10), cb);
    }, function(err) {
      var nextYear = moment().add(1, 'year').year();
      buildSqliteDB(nextYear, function(){
        buildSqliteDB(moment().year(), callback);
      });
    });
  });
})(function() {
  // logger.debug('sqliteDB', sqliteDB);
});

exports.get = function(criteria, cb) {
  var statement = criteria.statement;
  var year = criteria.year || moment().year();
  var parameters = criteria.parameters || [];

  if (!statement) {
    cb('No statement supplied.', {});
  } else {
    getSqliteDB(year, function(_sqliteDB) {
      _sqliteDB.get(statement, parameters, cb);
    });
  }
};

exports.all = function(criteria, cb) {
  var statement = criteria.statement;
  var year = criteria.year || moment().year();
  var parameters = criteria.parameters || [];

  if (!statement) {
    cb('No statement supplied.', []);
  } else {
    getSqliteDB(year, function(_sqliteDB) {
      _sqliteDB.all(statement, parameters, cb);
    });
  }
};

exports.prepare = function(criteria, cb) {
  var statement = criteria.statement;
  var year = criteria.year || moment().year();

  if (!statement) {
    cb('No statement supplied.', []);
  } else {
    getSqliteDB(year, function(_sqliteDB) {
      return cb(_sqliteDB.prepare(statement));
    });
  }
};

exports.exec = function(criteria, cb) {
  var statement = criteria.statement;
  var year = criteria.year || moment().year();
  var parameters = criteria.parameters || [];

  if (!statement) {
    cb('No statement supplied.', []);
  } else {
    getSqliteDB(year, function(_sqliteDB) {
      _sqliteDB.exec(statement, cb);
    });
  }
};

exports.runDB = function(criteria, cb) {
  var statement = criteria.statement;
  var year = criteria.year || moment().year();
  var parameters = criteria.parameters || [];

  if (!statement) {
    cb('No statement supplied.', []);
  } else {
    getSqliteDB(year, function(_sqliteDB) {
      _sqliteDB.run(statement, parameters, cb);
    });
  }
};

exports.runStatement = function(criteria, cb) {
  var statement = criteria.statement;
  var parameters = criteria.parameters || [];

  if (!statement) {
    cb('No statement supplied.', []);
  } else {
    statement.run(parameters, cb);
  }
};

exports.finalizeStatement = function(criteria, cb) {
  var statement = criteria.statement;
  var parameters = criteria.parameters || [];

  if (!statement) {
    cb('No statement supplied.', []);
  } else {
    statement.finalize(cb);
  }
};

exports.serialize = function(criteria, cb) {
  var year = criteria.year || moment().year();
  console.log('serializing');
  getSqliteDB(year, function(_sqliteDB) {
    console.log('gotten db');
    _sqliteDB.serialize(function(err){
      console.log(err);
      return cb();
    });
  });
};