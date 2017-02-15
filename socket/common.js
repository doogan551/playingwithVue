// OTHERS
let System = new(require('../models/system'))();

let common = {
    sockets: require('../helpers/sockets.js')
};

let io = common.sockets.get().io;
let rooms = io.sockets.adapter.rooms;
common.rooms = rooms;

let socket = function () {
    System.getSystemInfoByName('Quality Codes', function (err, codes) {
        common.qualityCodes = codes.Entries;
        System.getSystemInfoByName('Control Priorities', function (err, priorities) {
            common.controlPriorities = priorities.Entries;
            loader();
        });
    });
};

let loader = function () {
    require('./socketio')(common);
    require('./oplog')(common);
    require('./tcp')(common);
};

common.sendUpdate = sendUpdate;

module.exports = {
    socket: socket,
    common: common
};


function sendUpdate(dynamic) {
    if (rooms.hasOwnProperty(dynamic.upi)) {
        io.to(dynamic.upi).emit('recieveUpdate', dynamic);
    }
}
