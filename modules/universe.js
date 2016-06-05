var Room   = require('./room'),
	Player = require('./player'),
	chat   = require('./chat'),
	log    = require('./log');
var User   = require('../modules/user');

module.exports = function (io) {
	var connectedPlayers = [];
	// var welcome = []; //players
	var rooms = []; //rooms
		// io.on('connection', function(socket){
			
		// });
		// return;
	io.on('connection', function(socket){
		// var pName = 'robin';
		// assert(socket.request);
		// assert(socket.request.session);
		// assert(socket.request.session.passport);
		var pId = socket.request.session.passport.user;
		// console.log(pId);
		User.findOne({ '_id' :  pId }, function(err, user) {
            // if there are any errors, return the error
            if (err){
                console.log(err);
            	socket.disconnect();
            }
        	// check to see if theres already a user with that email
            if (user) {
        		var pName = user.local.email || user.facebook.name;
        		log('info',"User '" + pName + "' connected on socket "+socket.id);
						           
								if (connectedPlayers[pName]){
									connectedPlayers[pName].socketid = socket.id;
									connectedPlayers[pName].status = 'AVAILABLE';
								} else {
									connectedPlayers[pName] = new Player(pName, socket.id);
								}

								socket.emit('hello', {name: pName});
								socket.on('disconnect', function(){
									connectedPlayers[pName].status = 'DISCONNECTED';
									// if(connectedPlayers[pName].roomid)
									// 	rooms[roomid].players[pName].socketid=null;
									//broadcast to room
									//broadcast to friends

									connectedPlayers[pName].socketid = null;//question:faut-il free les objets?
								});
								socket.on('userData', function(data){//OK
									var connectedUsers = [];
									for (i in connectedPlayers ){
										var player = connectedPlayers[i];
										if (player.name != pName)
											connectedUsers.push({name:player.name, status:player.status});
									};
									socket.emit('userData',{connectedUsers:connectedUsers});//todo
									// socket.emit('userData',{connectedUsers:[{name:'pp1'},{name:'pp2'},{name:'pp3'}]});//todo
								});
								//CHAT MSG HANDLER
								socket.on('whisper', function(data){
									assert(data.to); //name
									assert(connectedPlayers[data.to]);
									assert(data.msg);
						    		io.to(connectedPlayers[data.to].socketid).emit('chat',{from: pName, data: data.msg});
								});
								//GAME PREPARATION HANDLER
								socket.on('roomInvitation',function(data){ //optional 'to':players to be invited  //OK
									var pStatus = connectedPlayers[pName].status;
									assert(pStatus == 'AVAILABLE' || (pStatus == 'INROOM'));
									assert(data.to);
									if (pStatus=='AVAILABLE'){
										connectedPlayers[pName].status == 'INROOM';
										var newRoom = new Room(pName, io, connectedPlayers, rooms, socket);//create new room
										rooms[newRoom.id] = newRoom;
									} else {
										assert(connectedPlayers[pName].roomid)
										assert(rooms[connectedPlayers[pName].roomid].leader == pName);
									}

									// connectedPlayers[pName].roomid = newRoom.id;
									// socket.emit('joinRoom',{players: []});
									//invite players if any
									// if (data.to)
									invitePlayers(pName, data.to);
								});
								// socket.on('roomInvitation', function(data){  //OK ?? check
								// 	invitePlayers(pName, data.to);
								// });
								socket.on('acceptInvite', function(data){ //WIP
									var roomid = connectedPlayers[pName].roomid;
									assert(roomid);
									assert(data.accept != null);
									rooms[roomid].acceptInvite(pName,data.accept, socket);
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
 			} else {
            	console.log('no user');
            	socket.disconnect();
            }

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
			//todo assert to is a table
			if(to){
				for (var i = 0; i < to.length; i++) {
					assert(connectedPlayers[to[i]]);
					rooms[roomid].invite(from, to[i]);
					// connectedPlayers[to[i]].status = 'INVITATION_PENDING';
					// connectedPlayers[to[i]].roomid = newRoom.id;
					// io.to(to[i]).emit('roomInvitation', {from: from});//question: if 3 persons, loop?
				}
			}
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