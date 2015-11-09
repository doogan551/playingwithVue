
var socket = io.connect('http://' + window.location.hostname + ':8085');

socket.on('connect', function () {
    if (GPLViewModel.isViewer()){

        var sess = {};
        sess.socketid = socket.id;
        sess.display = {};
        sess.display["Screen Objects"] = window.app.view.socketObj.gplObjects;
        socket.emit('displayOpen', {
            data: sess
        });
    }
});

socket.on('recieveUpdate', function (dynamic) {
    if (GPLViewModel.isViewer()){
        var upiList = GPLViewModel.getAllPropByUPI(dynamic.upi);
        async.each(upiList,function(obj){
            if (dynamic.dynamic["Quality Label"] == "none") {
                obj.setValueText(dynamic.dynamic.Value);
            }
            else{
                _.each(window.app.view.qualityCodes.Entries, function (q) {
                    if (q["Quality Code Label"] == dynamic.dynamic["Quality Label"]){
                        obj.setValueText(dynamic.dynamic.Value, q);
                    }
                });
            }
        });
    }
});


$(window).on('unload', function () {
    socket.disconnect();
});