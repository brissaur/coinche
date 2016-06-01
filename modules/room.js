var Game 	= require('./game');
var log    	= require('./log');
module.exports = function(host, io, connectedPlayers, rooms, hostsocket) {
	// var io=io;
	// var connectedPlayers=
	var generatedid;
	do {
		generatedid = Math.random(0,100000000);
	} while (rooms[generatedid]);
	hostsocket.join(generatedid);
	var attendee = {};
	attendee[host] = connectedPlayers[host];
	return {
		id: generatedid,// on following template! 'R' + int
		//manage room socket
		leader: host,
		attendee: attendee, //pointeur sur element de connectedPlayers
		players: [host],
		game: null,

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
		},
		acceptInvite: function(from, accept, socket){
			assert(this.attendee[from]);
			assert(!this.game);
			assert(this.attendee[from].status='INVITATION_PENDING');
			if (accept){
				this.attendee[from].updateStatus('INROOM', io);
				socket.join(this.id);
				this.attendee[from].roomid=null;

				this.players.push(from);//todo: probleme si plus de 4 joueurs
				//todo probleme si qqun leave
				io.to(this.attendee[from].socketid).emit('joinRoom', {players: this.players});//send context
			} else {
				this.attendee[from].updateStatus('AVAILABLE', io);
				delete this.attendee[from];
			}
				io.to(this.id).emit('join',{from: from, accept:accept});
		},
		leaveRoom: function(from, socket){
			assert(this.attendee[from]);
			if(this.attendee.length==1){//todo

			}
			if (from==this.leader){
				this.leader=this.players[this.players.indexOf(from)+1%this.playes.length]; //todo right function getIndex
				io.to(this.id).emit('newLeader',{from: this.leader});
			}

			this.attendee[from].updateStatus('AVAILABLE', io);
			this.attendee[from].roomid=null;
			io.to(this.id).emit('leaveRoom',{from: from});
			socket.leave(this.id);

			delete(this.attendee[from]);
			for(var i in this.players){
				if (this.players[i] == from)
					this.players.remove[i]; //todo: check how to remove elem from array
			}
		},
		kick: function(from,to,socket){
			assert(this.attendee[from]);
			assert(from==this.leader);
			assert(!this.game);
			this.attendee[to].updateStatus('AVAILABLE', io);
			io.to(this.id).emit('leaveRoom',{from: to});
			socket.leave(this.id);
			this.attendee[to].roomid=null;

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

		}
	}
}