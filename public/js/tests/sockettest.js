var socket = io.connect('http://localhost:9000');
socket.on('test1', function (data) {
	console.log(data.hello);
});
socket.emit('test2', {
	hello: "goodbye"
});