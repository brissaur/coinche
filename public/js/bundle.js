var socket = io();
socket.emit('authentification',{name:'robin'});
// $.post()
// alert('tadaaa');

socket.on('hello', function(message){
	socket.emit('test');
});
