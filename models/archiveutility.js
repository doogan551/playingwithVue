var sqlite3 = require('sqlite3').verbose();
var config = require('config');
var fs = require('fs');
var async = require('async');
var moment = require('moment');
var logger = require("../helpers/logger")(module);

var sdb = {};

var driveLetter = config.get('Infoscan.files').driveLetter;
var archiveLocation = config.get('Infoscan.files').archiveLocation;

var buildSdb = function(year, callback) {
  var buildTables = function(year, tableCB) {
    var months = [];
    for (var i = 1; i <= 12; i++) {
      months.push(i);
    }
    async.eachSeries(months, function(month, cb) {
      var tableName = 'History_' + year.toString() + ((month < 10) ? '0' + month.toString() : month.toString());
      sdb[year].run('CREATE TABLE IF NOT EXISTS ' + tableName + ' (UPI INTEGER NOT NULL, TIMESTAMP INTEGER NOT NULL, VALUE REAL NOT NULL, VALUETYPE INTEGER NOT NULL, STATUSFLAGS INTEGER DEFAULT 0, USEREDITED INTEGER DEFAULT 0, PRIMARY KEY(UPI, TIMESTAMP) ON CONFLICT IGNORE)', cb);
    }, tableCB);
  };

  if (!!sdb) {
    // sdb.close();
  }
  if (!!sdb[year]) {
    return callback();
  }
  var file = 'History_' + year + '.db';
  var hsd = archiveLocation + file;

  fs.stat(archiveLocation, function(err, stats) {
    if (err) {
      var mkdirp = require('mkdirp');
      mkdirp(archiveLocation, function(err) {
        fs.openSync(hsd, 'w');
        sdb[year] = new sqlite3.Database(hsd);
        buildTables(year, callback);
        // callback();
      });
    } else {
      sdb[year] = new sqlite3.Database(hsd);
      buildTables(year, callback);
      // callback();
    }
  });
};

var getSdb = function(year, callback) {
  if (!!sdb[year]) {
    return callback(sdb[year]);
  } else {
    buildSdb(year, function() {
      return callback(sdb[year]);
    });
  }
};

(function buildAllSdb(callback) {
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
      buildSdb(parseInt(year, 10), cb);
    }, function(err) {
      var nextYear = moment().add(1, 'year').year();
      buildSdb(nextYear, function(){
        buildSdb(moment().year(), callback);
      });
    });
  });
})(function() {
  // logger.debug('sdb', sdb);
});

exports.get = function(criteria, cb) {
  var statement = criteria.statement;
  var year = criteria.year || moment().year();
  var parameters = criteria.parameters || [];

  if (!statement) {
    cb('No statement supplied.', {});
  } else {
    getSdb(year, function(_sdb) {
      _sdb.get(statement, parameters, cb);
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
    getSdb(year, function(_sdb) {
      _sdb.all(statement, parameters, cb);
    });
  }
};

exports.prepare = function(criteria, cb) {
  var statement = criteria.statement;
  var year = criteria.year || moment().year();

  if (!statement) {
    cb('No statement supplied.', []);
  } else {
    getSdb(year, function(_sdb) {
      return cb(_sdb.prepare(statement));
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
    getSdb(year, function(_sdb) {
      _sdb.exec(statement, cb);
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
    getSdb(year, function(_sdb) {
      _sdb.run(statement, parameters, cb);
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
  getSdb(year, function(_sdb) {
    console.log('gotten db');
    _sdb.serialize(function(err){
      console.log(err);
      return cb();
    });
  });
};