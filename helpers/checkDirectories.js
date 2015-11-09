var fs = require('fs');
var async = require('async');
var dirs = ['tmp', 'tmp/uploads', 'scripts', 'logs'];

async.eachSeries(dirs, function(dir, cb){
  fs.mkdir(__dirname+'/../'+dir,function(err){
    cb();
  });
}, function(err){
});
