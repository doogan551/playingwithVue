var Service = require('node-windows').Service;
var commandLineArgs = require('command-line-args');

var cli = commandLineArgs([{
  name: 'install',
  alias: 'i',
  type: Boolean
}, {
  name: 'uninstall',
  alias: 'u',
  type: Boolean
}, {
  name: 'start',
  alias: 's',
  type: Boolean
}, {
  name: 'stop',
  alias: 'x',
  type: Boolean
}, {
  name: 'restart',
  alias: 'r',
  type: Boolean
}]);

var options = cli.parse();

// Create a new service object
var svc = new Service({
  name: 'InfoscanJS',
  description: 'Infoscan web server.',
  script: require('path').join(__dirname, '..', 'app.js')
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  console.log('Installed', svc.description);
  svc.start();
});

svc.on('uninstall', function() {
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

if (!!options.uninstall) {
  svc.uninstall();
} else if (!!optins.install) {
  svc.install();
} else if (!!options.start) {
  svc.start();
} else if (!!options.stop) {
  svc.stop();
} else if (!!options.restart) {
  svc.stop();
  svc.start();
} else{
  throw new Error('No valid arguments passed');
}