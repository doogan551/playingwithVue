var process = require('child_process').exec,
  child;


child = process('git reset --hard origin/Develop', function(err, stdout, stderr) {
  console.log(err);
  console.log('------');
  console.log(stdout.toString());
  console.log('------');
  console.log(stderr.toString());
  child = process('git clean -f -d', function(err, stdout, stderr) {
    console.log(err);
    console.log('------');
    console.log(stdout.toString());
    console.log('------');
    console.log(stderr.toString());
    child = process('git pull', function(err, stdout, stderr) {
      console.log(err);
      console.log('------');
      console.log(stdout.toString());
      console.log('------');
      console.log(stderr.toString());
    });
  });
});