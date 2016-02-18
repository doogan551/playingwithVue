var process = require('child_process').exec,
  child;

child = process('sc stop infoscanjs.exe ', function(err, stdout, stderr) {
  logResults('sc stop out:', err, stdout, stderr);
  child = process('git reset --hard origin/Develop', function(err, stdout, stderr) {
    logResults('git reset out:', err, stdout, stderr);
    child = process('git clean -f -d', function(err, stdout, stderr) {
      logResults('git clean out:', err, stdout, stderr);
      child = process('git pull', function(err, stdout, stderr) {
        logResults('git pull out:', err, stdout, stderr);
        child = process('sc start infoscanjs.exe ', function(err, stdout, stderr) {
          logResults('sc start out:', err, stdout, stderr);
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