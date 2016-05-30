var Room = require('./room'),
	chat = require('./chat');

module.exports = function (io) {
	var connectedPlayers = [];
	// var welcome = []; //players
	var rooms = []; //rooms

	io.on('connection', function(socket){
		var pName = 'robin'; //todo //=socket.request.session
		assert(!connectedPlayers[pName]);
		connectedPlayers[pName] = new Player(pName, socket.id);
		socket.emit('hello', {name: pName});
		io.on('disconnect', function(){
			connectedPlayers[pName].status = 'DISCONNECTING';
			// if(connectedPlayers[pName].roomid)
			// 	rooms[roomid].players[pName].socketid=null;
			//broadcast to room
			//broadcast to friends

			connectedPlayers[pName].socketid = null;//question:faut-il free les objets?
		});
		//CHAT MSG HANDLER
		io.on('whisper', function(data){
			assert(data.to); //name
			assert(connectedPlayers[data.to]);
			assert(data.msg);
    		io.to(connectedPlayers[data.to].socketid).emit('chat',{from: pName, data: data.msg});
		});
		//GAME PREPARATION HANDLER
		socket.on('newRoom',function(data){ //optional 'to':players to be invited
			assert(connectedPlayers[pName].status == 'AVAILABLE');
			connectedPlayers[pName].status == 'INROOM';

			var newRoom = new Room(pName, io, connectedPlayers, rooms, socket);//create new room
			rooms[newRoom.id] = newRoom;
			connectedPlayers[pName].roomid = newRoom.id;

			//invite players if any
			invitePlayers(pName, data.to);
		});
		socket.on('roomInvitation', function(data){
			invitePlayers(pName, data.to);
		});
		socket.on('acceptInvite', function(data){
			var roomid = connectedPlayers[pName].roomid;
			assert(roomid);
			rooms[roomid].play(pName,data.accept, socket);
		});
		socket.on('leaveRoom', function(data){
			var roomid = connectedPlayers[pName].roomid;
			assert(roomid);
			rooms[roomid].leaveRoom(pName, socket);
		});
		socket.on('kick', function(data){
			var roomid = connectedPlayers[pName].roomid;
			assert(roomid);
			assert(data.to);
			rooms[roomid].kick(pName, data.to, socket);
		});
		socket.on('swap', function(data){
			var roomid = connectedPlayers[pName].roomid;
			assert(roomid);
			assert(data.to);
			rooms[roomid].swap(pName,data.to);
		});
		socket.on('startGame', function(data){
			var roomid = connectedPlayers[pName].roomid;
			assert(roomid);
			rooms[roomid].startGame(pName);
		});
		socket.on('chat', function(data){
			var roomid = connectedPlayers[pName].roomid;
			assert(roomid);
			assert(data.msg);
			rooms[roomid].chat(pName,data.msg);
		});
		socket.on('announce', function(data){
			var roomid = connectedPlayers[pName].roomid;
			assert(roomid);
			assert(data.announce);
			rooms[roomid].announce(pName,data.announce);
		});
		socket.on('coinche', function(data){
			var roomid = connectedPlayers[pName].roomid;
			assert(roomid);
			assert(data.announce);
			rooms[roomid].coinche(pName,data.announce);
		});
		socket.on('play', function(data){
			var roomid = connectedPlayers[pName].roomid;
			assert(roomid);
			assert(data.card);
			rooms[roomid].play(pName,data.card);
		});

		// for (var i = 0; i < roomEvents.length; i++) {
		// 	(function(eventName, playerid) {
		//          socket.on(eventName, function(data) {
		//             rooms[connectedPlayers[playerid]].event({data: data, from: playerid});
		//          }); 
		//     })(roomEvents[i], pName);
		// }

		function invitePlayers(from, to){
			var roomid = connectedPlayers[from].roomid;
			assert(roomid);
			if(to){
				for (var i = 0; i < to.length; i++) {
					assert(connectedPlayers[to[i]]);
					rooms[newRoom.id].invite(from, to);
					// connectedPlayers[to[i]].status = 'INVITATION_PENDING';
					// connectedPlayers[to[i]].roomid = newRoom.id;
					// io.to(to[i]).emit('roomInvitation', {from: from});//question: if 3 persons, loop?
				}
			}
		}
	});
}