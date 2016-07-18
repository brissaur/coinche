var Game 	= require('./game');
var log    	= require('./log');

module.exports = newRoom;
function newRoom(host, io, connectedPlayers, rooms, hostsocket) {
	var generatedid;
	do {
		generatedid = Math.random(0,100000000);
	} while (rooms[generatedid]);
	var attendee = {};
	attendee[host] = connectedPlayers[host];
	attendee[host].updateStatus('INROOM', io);
	attendee[host].roomid=generatedid;
	hostsocket.join(generatedid);
	io.to(attendee[host].socketid).emit('joinRoom', {players: [{name:host},{},{},{}]});//send context
	return new Room(host, io, connectedPlayers, attendee, generatedid);
}

function Room(host, io, connectedPlayers, attendee, id){
	return {
		id: id,// on following template! 'R' + int
		//manage room socket
		leader: host,
		attendee: attendee, //pointeur sur element de connectedPlayers
		players: [host, , , ],
		availablePlayerId: [3,2,1],
		game: null,

		nbPlayers: function(){
			var count = 0
			for (i in this.players){
				if (this.players[i])
					count++;
			}
			return count;
		},
		invite: function(from,to){ //from=string, to=string
			assert(this.attendee[from]);
			// assert(from==this.leader);
			assert(connectedPlayers[to].status == 'AVAILABLE');
			assert(!this.attendee[to]);
			log('DEBUG', 'Room '+ this.id + ': Invitation from player ' + from + ' to player ' + to + '.');

			this.attendee[to]=connectedPlayers[to];
			this.attendee[to].roomid=this.id;
			this.attendee[to].updateStatus('INVITATION_PENDING', io);
			io.to(this.attendee[to].socketid).emit('roomInvitation', {from:from});
		},
		acceptInvite: function(from, accept, socket){
			assert(this.attendee[from]);
			assert(!this.game);
			assert(this.attendee[from].status='INVITATION_PENDING');
			log('DEBUG','Room '+ this.id + ': Player ' + from + (accept? ' accepted ':' refused ') + 'the invitation.');
			if (accept){
				if (this.nbPlayers() >= 4){
					log('error','Room '+ this.id + ': Player '+from+' tries to join thus already 4 players');
					this.attendee[from].status='AVAILABLE';
					io.to(this.attendee[from].socket).emit('game_is_full', {});
					// this.attendee[from].emit('game_is_full', {});
					
					this.attendee[from] = null;
					delete this.attendee[from];
					return;
				} 

				this.players[this.availablePlayerId.pop()] = from;
				//todo probleme si qqun leave
				
				// io.to(this.id).emit('join',{from: from, accept:accept});
				for (i in this.players){
					if (this.players[i])
						io.to(this.attendee[this.players[i]].socketid).emit('join',{from: from, accept: accept, players: this.playersFromViewOf(this.players[i])});
				}
				this.attendee[from].updateStatus('INROOM', io);
				this.attendee[from].roomid=this.id;
				socket.join(this.id);
				io.to(this.attendee[from].socketid).emit('joinRoom', {players: this.playersFromViewOf(from)});//send context
				if (this.nbPlayers() == 4){
					io.to(this.attendee[this.leader].socketid).emit('startEnabled');
				}
			} else {
				this.attendee[from].updateStatus('AVAILABLE', io);
				this.attendee[from].roomid = null;
				this.attendee[from] = null;
				delete this.attendee[from];
				io.to(this.id).emit('join',{from: from, accept:accept});
			}
		},
		leaveRoom: function(from, socket){
			assert(this.attendee[from]);
			log('DEBUG','Room '+ this.id + ': Player ' + from + ' left the room.');
			var pIndex = this.players.indexOf(from);
			socket.leave(this.id);
			this.availablePlayerId.push(pIndex);
			if(this.attendee.length==1){//todo

			}
			if (from==this.leader){
				this.leader=this.players[this.players.indexOf(from)+1%this.players.length]; //todo right function getIndex
				io.to(this.id).emit('newLeader',{from: this.leader});
			}

			this.attendee[from].updateStatus('AVAILABLE', io);
			this.attendee[from].roomid=null;
			for(var i in this.players){
				if (this.players[i] == from)
					this.players[i] = null; //todo: check how to remove elem from array
			}
			for (var i in this.players){
				var pName=this.players[i];
				if (pName)
					io.to(attendee[pName].socketid).emit('leaveRoom',{from: from, players: this.playersFromViewOf(pName)});
			}

			this.attendee[from] = null;
			delete(this.attendee[from]);
			if (this.nbPlayers() == 3){
				io.to(this.attendee[this.leader].socketid).emit('startDisabled');
			}
		},
		kick: function(from,to,socket){
			assert(this.attendee[from]);
			assert(from==this.leader);
			assert(!this.game);
			log('DEBUG','Room '+ this.id + ': Player ' + to + ' was kicked by player '+from+'.');
			this.attendee[to].updateStatus('AVAILABLE', io);
			io.to(this.id).emit('leaveRoom',{from: to});
			socket.leave(this.id);
			this.attendee[to].roomid=null;

			this.attendee[to] = null;
			delete(this.attendee[to]);
			for(var i in this.players){
				if (this.players[i] == to)
					this.players.remove[i]; //todo: check how to remove elem from array
			}
		},
		swap: function(from,to){
			assert(this.attendee[from]);
			assert(!this.game);
			log('DEBUG','Room '+ this.id + ': Player ' + from + ' swapped with player '+to+'.');
			var fromIndex = this.players.indexOf(from);
			var toIndex = (to + fromIndex)%4;
			if (this.players[toIndex]){//if the place is not empty
				this.players[fromIndex] = this.players[toIndex];
				this.players[toIndex] = from;
			} else {
				assert(this.availablePlayerId.indexOf(toIndex) != -1);
				this.availablePlayerId.splice(this.availablePlayerId.indexOf(toIndex),1);
				this.availablePlayerId.push(fromIndex);
				this.players[fromIndex] = null;
				this.players[toIndex] = from;
			}
			for (var i in this.players){
				var pName=this.players[i];
				if (pName)
					io.to(attendee[pName].socketid).emit('swap',{players: this.playersFromViewOf(pName)});
			}
		},
		startGame: function(from){
			assert(from==this.leader);
			log('DEBUG','Room '+ this.id + ': Starting Game!');
			this.game = new Game(io, this.id, this.attendee, this.players);
			io.to(this.attendee[this.leader].socketid).emit('startDisabled');
			this.game.start();
		},
		chat: function(from, msg){
			assert(this.attendee[from]);
			log('DEBUG','Room '+ this.id + ": Message from "+from+": "+msg);
			io.to(this.id).emit('chat',{from: from, msg: msg});
		},
		disconnection: function(from){
			assert(this.attendee[from]);
			var pIndex = this.players.indexOf(from);
			assert(pIndex != -1);//todo: pas vrai pour els spectators
			log('DEBUG','Room '+ this.id + ': Player was disconnected');

			if (!this.game){

				this.availablePlayerId.push(pIndex);
				if(this.attendee.length==1){//todo

				}
				var oldLeader = this.leader;
				for(var i in this.players){
					if (this.players[i] == from)
						this.players[i] = null; //todo: check how to remove elem from array
				}
				for (var i in this.players){
					var pName=this.players[i];
					if (pName)
						io.to(attendee[pName].socketid).emit('leaveRoom',{from: from, players: this.playersFromViewOf(pName)});
				}
				if (from==this.leader){
					for (pIndex in this.players){ //todo: take most ancient //the next one after current leader
						var player = this.players[pIndex];
						if (player){
							this.leader=player; //todo right function getIndex
							break;
						}
					}
					io.to(this.id).emit('newLeader',{from: this.leader});
				}
				if (this.nbPlayers() == 3){
					if (oldLeader == this.leader){
						io.to(this.attendee[this.leader].socketid).emit('startDisabled');
					}
				}
			} else {
				// todo: issue if dealer left
				this.game.disconnection(from);
				
			}
		},
		reconnection: function(from, socket){
			assert(this.attendee[from]);
			log('DEBUG','Room '+ this.id + ': Reconnection of player '+from +'.');

			if (!this.game){
				if (this.nbPlayers() >= 4){
					log('ERROR','Room '+ this.id + ': Reconnection impossible as game is now full');
					this.attendee[from].status='AVAILABLE';
					// this.attendee[from].emit('game_is_full', {});
					io.to(this.attendee[from].socket).emit('game_is_full', {});
					this.attendee[from].roomid=null;
					this.attendee[from] = null;
					delete this.attendee[from];
					return;
				} 

				this.players[this.availablePlayerId.pop()] = from;
				//todo probleme si qqun leave
				
				// io.to(this.id).emit('join',{from: from, accept:accept});
				for (i in this.players){
					if (this.players[i])
						io.to(this.attendee[this.players[i]].socketid).emit('join',{from: from, accept: true, players: this.playersFromViewOf(this.players[i])});
				}
				this.attendee[from].updateStatus('INROOM', io);
				this.attendee[from].roomid=this.id;
				socket.join(this.id);
				io.to(this.attendee[from].socketid).emit('joinRoom', {players: this.playersFromViewOf(from)});//send context
				if (this.nbPlayers() == 4){
					console.log({leader:this.leader});
					io.to(this.attendee[this.leader].socketid).emit('startEnabled');
				}
			} else {
				socket.join(this.id);
				io.to(this.attendee[from].socketid).emit('joinRoom', {players: this.playersFromViewOf(from)});//send context
				this.game.reconnection(from);
			}

		},
		announce: function(from,announce){
			assert(this.attendee[from]);
			assert(this.game);
			this.game.announce(from, announce);
		},
		coinche: function(from,announce){
			assert(this.attendee[from]);
			assert(this.game);
			this.game.coinche(from, announce);

		},
		play: function(from,card){
			assert(this.attendee[from]);
			assert(this.game);
			this.game.play(from, card);

		},
		playersFromViewOf: function(pName){
			var pIndex = this.players.indexOf(pName);
			assert(pIndex != -1);
			var view = [{},{},{},{}];
			for (i in this.players) {
				view[(i - pIndex + 4)%4] = {name: this.players[i]};
			}
			return view;
		}
	}
}