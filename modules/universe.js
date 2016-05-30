var Room = require('./room'),
	Player = require('./player'),
	chat = require('./chat'),
	log = require('./log');

module.exports = function (io) {
	chat = chat(io);

	var connectedPlayers = [];
		//players in the welcome screen
	var welcome = [];
		//players who joined a room
	var rooms = [];

	/*
	* messge = {from:"", to:[""]}
	*/
	io.on('connection', function(socket){
		console.log(socket.request.session);
		log('DEBUG', 'new connection');
		socket.on('authentification',function(data){
			// data={}
			console.log('auth');
			console.log(connectedPlayers);
			assert(!(connectedPlayers[data.name]));
			// connectedPlayers[socket.id] = new Player(data.name, socket.id);
			connectedPlayers[data.name] = new Player(data.name, socket.id);
			log('DEBUG', data.name +' connected on socket ' + socket.id);
			welcome[socket.id] = socket.id;
			socket.emit('ack_auth');
		});
		// var cookie = cookie.parse(socket.handshake.headers.cookie);
		// console.log({socket: socket.client.request});
		// console.log(socket.id);
		socket.emit('hello',{name:'robin'});
			//treat new connection
		// log('debug', connectedPlayers[socket.id]);
			//treat disconnection
		socket.on('disconnect', function(){
			// log('debug', 'disconnection ' + socket.id);
			// assert(connectedPlayers[socket.id]);
			// delete connectedPlayers[socket.id];
		});	


		//treat other messages
			//room-related
		socket.on('room', function(msg){//msg=
			assert(connectedPlayers[socket.id].roomid);
		});

			//game-related
		socket.on('game', function(msg){
			assert(connectedPlayers[socket.id].roomid);
		});

		var PLAYERID = 'ROBIN';//ARCHI: DECIDE WHAT THAT IS
		var roomEvents = ['first_event', 'second_event', 'third_event'];
		for (var i = 0; i < roomEvents.length; i++) {
			(function(eventName, playerid) {
		         socket.on(eventName, function(data) {
		            rooms[connectedPlayers[PLAYERID]].event({eventData: data, from: PLAYERID},function(from,to,event,data){
	            		io.to(to).emit(event,{from: from, data: data});
		            });
		         }); 
		    })(roomEvents[i], PLAYERID);
		}
	});
	// io.on('invitation', function(message){
	// 	//todo
	// 	assert(!welcome[message.username]);

	// 	welcome[username] = '';
	// });
	// io.on('join', function(message){
	// 	//todo
	// 	assert(!welcome[message.username]);
	// 	welcome[message.username] = new User(message.username);
	// });

	// var io = require('socket.io')(http);
	// var launcher = require(__dirname+'/modules/launcher')(io);


}

// messages
// friends
// 	invite
// 	delete

// 	acceptInvite
// 	refuseInvite

// Room
// 	invite
// 	leave

// 	acceptInvite
// 	refuseInvite



// __________
// account
// 	name
// 	passwd
// 	friends
// 	pendingFriendsRequests