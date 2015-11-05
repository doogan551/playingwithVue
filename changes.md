- \infoscan-test\public\js\pointLookup\pointLookup.js:
	/pointlookup/ -> /api/points/

- front-end client socket.io.js source to v1.3.5

- dashboard.js - socket connection, new way to get id
  var socket = io.connect('http://' + window.location.hostname + ':8085');
  socket.on('connect', function() {
      tou.socket = socket;
      tou.socketid = socket.id; 

      cb();
  });

- delete /public/js/pointSelector
- delete /public/js/pointEditor

- change /pointlookup/newpoint in public\js\pointLookup\pointLookup.js to /api/points/newpoint