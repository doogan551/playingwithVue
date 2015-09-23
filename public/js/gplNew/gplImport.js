var socket = io.connect('http://' + window.location.hostname + ':8085');

socket.on('gplImportMessage', function(data) {
    $('#output tr:first').before('<tr class="' + data.type + '"><td>' + data.message + '</td><td>' + data.name + '</td></tr>');
});

socket.on('gplImportComplete', function() {
    $('#output tr:first').before('<tr><td colspan="2">Import Complete</td></tr>');
});

socket.on('gplTypes', function(data) {
    $('#output').append('<pre>' + JSON.stringify(data, null, 3) + '</pre>');
});

socket.on('connect', function() {
    // socket.emit('getBlockTypes', {});
    socket.emit('doGplImport', {});
});