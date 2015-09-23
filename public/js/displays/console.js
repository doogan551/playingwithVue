var socket = io.connect('http://' + window.location.hostname + ':9200');

socket.on('sendDisplays', function (data) {
    $('ul').html('');
    disps = data.data;
    $('#dynamics').html('');
    //dyns = data.dyns;

    $(disps).each(function (item, val) {
        $('ul').append('<div>' +
        '<div style="text-shadow: 0px 2px 2px rgba(0,0,0,0.4),0px 2px 2px rgba(0,0,0,0.4),0px 2px 2px rgba(0,0,0,0.4);padding:5px;font-size:10px;">Display:' + val.display.Name + '<br />Socket:' + val.sockId + '<br />Object Count:' + val.display['Screen Objects'].length + '</div></div>');

        for (var j = 0; j < val.display['Screen Objects'].length; j++) {
            obj = val.display['Screen Objects'][j];
            if (obj['Screen Object'] == 0) {
                $('#dynamics').append('<div class="dyn" style="box-shadow: rgb(0, 0, 0) 0px 0px 15px;text-shadow: 0px 2px 2px rgba(0,0,0,0.4),0px 2px 2px rgba(0,0,0,0.4),0px 2px 2px rgba(0,0,0,0.4);color:white;background-color:#666666;width:190px;float:left;margin:10px;font-size:10px;padding:5px;">display:<span>' + val.display.Name + '</span><br />socket:<span class="sock">' + val.sockId + '</span><br />upi:<span class="point">' + obj.upi + '</span><span style="display:none;" class="current"></span><span style="display:none;" class="htmlid"></span><br />value: <input type="input" class="new" style="width:50px;" value="" /><input class="emit" type="button" value="send" /></div>');
            }
        }
    });

    $('.emit').click(function () {
        socket.emit('sendUpdate', {
            dynamic: {
                sock: $(this).parent().find('.sock').html(),
                point: $(this).parent().find('.point').html(),
                val: $(this).parent().find('.new').val()
            }
        });
    });
});

socket.emit('getDisplays', {
    data: ''
});


