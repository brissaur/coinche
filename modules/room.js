var Game 	= require('./game');
var log    	= require('./log');
module.exports = function(host, io, connectedPlayers, rooms, hostsocket) {
	// var io=io;
	// var connectedPlayers=
	var generatedid;
	do {
		generatedid = Math.random(0,100000000);
	} while (rooms[generatedid]);
	var attendee = {};
	attendee[host] = connectedPlayers[host];
	attendee[host].updateStatus('INROOM', io);
	attendee[host].roomid=generatedid;
	hostsocket.join(generatedid);
	io.to(attendee[host].socketid).emit('joinRoom', {players: [host]});//send context
	return {
		id: generatedid,// on following template! 'R' + int
		//manage room socket
		leader: host,
		attendee: attendee, //pointeur sur element de connectedPlayers
		players: [host],
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
			log('DEBUG', 'invitation from ' + from + ' to ' + to + '.');
			assert(this.attendee[from]);
			assert(from==this.leader);
			assert(connectedPlayers[to].status == 'AVAILABLE');
			assert(!this.attendee[to]);

			this.attendee[to]=connectedPlayers[to];
			this.attendee[to].roomid=this.id;
			this.attendee[to].updateStatus('INVITATION_PENDING', io);
			io.to(this.attendee[to].socketid).emit('roomInvitation', {from:from});
			console.log('invitation');
			log('DEBUG', 'Invitation from player ' + from + ' to player ' + to + '.');
			console.log(this);
		},
		acceptInvite: function(from, accept, socket){
			assert(this.attendee[from]);
			assert(!this.game);
			assert(this.attendee[from].status='INVITATION_PENDING');
			if (accept){
				if (this.nbPlayers() >= 4){
					console.log('ALLERTTTTTTTTTT thi.players.length==4');
					this.attendee[from].status='AVAILABLE';
					this.attendee[from].emit('game_is_full', {});
					
					this.attendee[from] = null;
					delete this.attendee[from];
					return;
				} 

				this.players[this.availablePlayerId.pop()] = from;
				//todo probleme si qqun leave
				
				// io.to(this.id).emit('join',{from: from, accept:accept});
				for (i in this.players){
					if (this.players[i])
						io.to(attendee[this.players[i]].socketid).emit('join',{from: from, accept: accept, players: this.playersFromViewOf(this.players[i])});
				}
				this.attendee[from].updateStatus('INROOM', io);
				this.attendee[from].roomid=this.id;
				socket.join(this.id);
				io.to(this.attendee[from].socketid).emit('joinRoom', {players: this.playersFromViewOf(from)});//send context
			} else {
				this.attendee[from].updateStatus('AVAILABLE', io);
				this.attendee[from] = null;
				delete this.attendee[from];
				io.to(this.id).emit('join',{from: from, accept:accept});
			}
			log('DEBUG','Player ' + from + (accept? ' accepted ':' refused ') + 'the invitation.');
			console.log(this);
		},
		leaveRoom: function(from, socket){
			assert(this.attendee[from]);
			var pIndex = this.players.indexOf(from);
			this.availablePlayerId.push(pIndex);
			if(this.attendee.length==1){//todo

			}
			if (from==this.leader){
				this.leader=this.players[this.players.indexOf(from)+1%this.players.length]; //todo right function getIndex
				io.to(this.id).emit('newLeader',{from: this.leader});
			}

			this.attendee[from].updateStatus('AVAILABLE', io);
			this.attendee[from].roomid=null;
			socket.leave(this.id);
			for (pName in this.attendee){
				io.to(attendee[pName].socketid).emit('leaveRoom',{from: from, players: this.playersFromViewOf(pName)});
			}

			this.attendee[from] = null;
			delete(this.attendee[from]);
			for(var i in this.players){
				if (this.players[i] == from)
					this.players[i].remove; //todo: check how to remove elem from array
			}
			log('DEBUG','Player ' + from + ' left the room.');
			console.log(this);
		},
		kick: function(from,to,socket){
			assert(this.attendee[from]);
			assert(from==this.leader);
			assert(!this.game);
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
			assert(this.attendee[to]);
			assert(!this.game);
			// this.
		},
		startGame: function(from){
			assert(from==this.leader);
			this.game = new Game(io, this.id, attendee, players);
			this.game.start();
		},
		chat: function(from, msg){
			assert(this.attendee[from]);
			io.to(this.id).emit('chat',{from: from, msg: msg});
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
			var view = [];
			var pLength = this.players.length;
			for (i in this.players) {
				view[(i - pIndex + pLength)%pLength] = this.players[i];
			}
			return view;
		}
	}
}
