var Room   = require('./room'),
	Player = require('./player'),
	chat   = require('./chat'),
	log    = require('./log');
var User   = require('../modules/user');

module.exports = function (io) {
	var connectedPlayers = [];
	var rooms = []; //rooms

	io.on('connection', function(socket){
		var pId = socket.request.session.passport.user;
		User.findOne({ '_id' :  pId }, function(err, user) {
            // if there are any errors, return the error
            if (err){
            	log('error',err);
            	socket.disconnect();
            }
        	// check to see if theres already a user with that email
            if (user) {
        		var pName = user.local.email || user.facebook.name;
        		log('info',"User '" + pName + "' connected on socket "+socket.id);
								if (connectedPlayers[pName]){
									log('debug','Player ' + pName + ' is reconnecting');
									connectedPlayers[pName].socketid = socket.id;
									if (connectedPlayers[pName].roomid){
										//RECONNECTION TO ROOM
										assert(rooms[connectedPlayers[pName].roomid]);
										connectedPlayers[pName].status = 'INROOM';
										rooms[connectedPlayers[pName].roomid].reconnection(pName, socket);
									} else {
										connectedPlayers[pName].status = 'AVAILABLE';
									}
								} else {
									connectedPlayers[pName] = new Player(pName, socket.id);
								}
								// socket.broadcast.emit('connection', {from:pName, connectedUsers:getConnectedUsers(pName)});
								if (connectedPlayers[pName].status == 'AVAILABLE'){
									for (name in connectedPlayers){
										if (name != pName)
											io.to(connectedPlayers[name].socketid).emit('newConnection',  {from:pName, connectedUsers:getConnectedUsers(name)});
									}
									socket.emit('hello', {name: pName});
								}
								socket.on('disconnect', function(){
									log('INFO', 'Player ' + pName + ' is disconnecting...');
									var status = connectedPlayers[pName].status;
									if (status == 'INVITATION_PENDING'){
										connectedPlayers[pName].roomid=null;
									}
									status = 'DISCONNECTED';
									if (connectedPlayers[pName].roomid){
										assert(rooms[connectedPlayers[pName].roomid]);
										rooms[connectedPlayers[pName].roomid].disconnection(pName);
									}
									connectedPlayers[pName].socketid = null;//question:faut-il free les objets?
								});
								socket.on('userData', function(data){//OK
									socket.emit('userData',{connectedUsers:getConnectedUsers(pName)});//todo
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
									}
									invitePlayers(pName, data.to);
								});
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
									assert(data.to >= 0);
									rooms[roomid].swap(pName,data.to);
								});
								socket.on('startGame', function(data){
									var roomid = connectedPlayers[pName].roomid;
									assert(roomid);
									rooms[roomid].startGame(pName);
								});
								socket.on('chat', function(data){
									assert(data.msg);
									var roomid = connectedPlayers[pName].roomid;
									// assert(roomid);
									if (roomid)
										rooms[roomid].chat(pName,data.msg);
									//todo: handle message /w /friends 
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
            	log('ERROR','Connection from unknown user');
            	socket.disconnect();
            }

        });    

		function invitePlayers(from, to){
			var roomid = connectedPlayers[from].roomid;
			assert(roomid);
			//todo assert to is a table
			if(to){
				for (var i = 0; i < to.length; i++) {
					assert(connectedPlayers[to[i]]);
					rooms[roomid].invite(from, to[i]);
				}
			}
		}

		function getConnectedUsers(pName){
			var connectedUsers = {};
			for (i in connectedPlayers ){
				var player = connectedPlayers[i];
				if (player.name != pName)
					connectedUsers[player.name] = {name:player.name, status:player.status};
			};
			return connectedUsers;
		}
	});
}