var cmd = {
    "Command Type": 7,
    "upi": 3004,
    "Value": 0,
    "Controller": 1,
    "Relinquish": 0,
    "Priority": 16,
    "Wait": 1,
    "OvrTime": 0
};
var fn = function(err, resp) {
    console.log(err, resp);
};

new cronJob('00 * * * * *', function() {
    cmd.Value = 1;
    zmq.sendCommand(JSON.stringify(cmd), fn);
});

new cronJob('30 * * * * *', function() {
    cmd.Value = 0;
    zmq.sendCommand(JSON.stringify(cmd), fn);
});