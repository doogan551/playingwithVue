var zmq = require('zmq');
var frontAddr = 'tcp://127.0.0.1:5570';
var sock;

// We do this bit repeatedly. Should use with connect or bindSync.
function makeASocket(sockType, idPrefix, addr, bindSyncOrConnect) {
  var sock = zmq.socket(sockType);
  sock.identity = idPrefix + process.pid;
  // call the function name in bindSyncOrConnect
  sock[bindSyncOrConnect](addr);
  return sock;
}

function serverTask() {

  var upi = 53226;
  // read device time
  var jparm = "{ \"Command Type\" : 1 , \"upi\" :" + upi + "}";

  console.time('test');
  sock.send(jparm);
}

function clientTask() {
  sock = makeASocket('dealer', 'client', frontAddr, 'connect');

  console.log('identity - ' + sock.identity);

  sock.on('message', function(data) {
    var args = Array.apply(null, arguments);
    if(data.toString() !== 'Done'){
      console.log(JSON.parse(data));  
    }    

    console.timeEnd('test');
  });
}

(function setUp() {
  clientTask();
  serverTask();
})();