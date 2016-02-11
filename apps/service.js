var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'InfoscanJS',
  description: 'Infoscan web server.',
  script: 'C:/infoscanjs/app.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

// Uninstall the service.
svc.uninstall();