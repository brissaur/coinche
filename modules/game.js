var Deck 	= require('./deck');
var Cards 	= require('./card').template();
var log    	= require('./log');

module.exports = newGame;
function newGame(io, namespace, attendee, players) {
	var attendees={};
	for (aName in attendee){
		attendees[aName] = {global:attendee[aName]};
	}
	players.forEach(function(player){
		attendees[player].cards=null;
		attendees[player].dealer=false;
		attendees[player].playedCard=null;
		attendees[player].announce=null;
	});
	return new Game(io, namespace, attendees, players);
}

function Game(io, namespace, attendee, players){
	return {
		namespace: namespace,
		deck: new Deck(),
		players: players,
		attendee: attendee,
		spectators: null, //todo: need to know who he is spectating
		scores:{round:[0,0],game:[0,0]},
		// scores:[[0],[0]],
		//team: null,
		tricks: [],
		current: {
			state: "ANNOUNCING",
			belote: null,
			dealer: null, //0
			player: null, //1
			firstPlayer: null,
			announce: {value:0,color:null,coinched:false,player:-1},//{value: color: coinched: player:}
			trick: [],
			trickIndex: 0,
			belote: null
		},
		start: function(){
			io.to(this.namespace).emit('startGame', {});//todo: players, dealer, 
			this.nextRound();
		},
		disconnection: function(from){
			log('DEBUG', 'Game '+ this.namespace + ': Player '+ from + ' is disconnecting');
			io.to(this.namespace).emit('gameDisconnection',{from:from});
		},
		reconnection: function(from){
			log('DEBUG', 'Game '+ this.namespace + ': Player '+ from + ' is reconnecting');
			var player = this.attendee[from];
			var socketid=player.global.socketid;
			//emit playerinfos
			io.to(socketid).emit('startGame', {});//todo: players, dealer, 
			this.emitUpdatePlayerInfo();
			//emit cards
			io.to(socketid).emit('distribute',{cards: player.cards});
			var pIndex = this.players.indexOf(from);
			//emit cards played
			var pLength = this.players.length;
			this.current.trick.forEach(function(card, i){
				io.to(socketid).emit('played',{
					from:players[i],
					index:(i - pIndex + pLength)%pLength,
					card:card.toString()});
			});
			//emit update scores
			io.to(socketid).emit('updateScores', {scores:{round:[0,0],game:this.scoresFromViewOf(from).game}});
			//emit lastTrick
			if( this.current.trickIndex > 0)
				io.to(socketid).emit('lastTrick', {lastTrick:this.trickFromViewOf(from, this.current.trickIndex - 1)});
			// io.to(socketid).emit('updateScores', {scores:this.scoresFromViewOf(from)});
			//emit if his turn to play
			if (this.current.player == pIndex){
				if (this.current.state == 'ANNOUNCING'){
					var coincheEnabled = !(this.current.announce.player == -1) && 
										this.current.announce.value!=0 && 
										!this.sameTeam(this.current.announce.player,this.current.player);
					io.to(this.getCurrentPlayerSocketId()).emit('announce', {
						announce:{value:this.current.announce.value,
						color:this.current.announce.color,
						coincheEnabled: coincheEnabled}
					});

				} else {
					assert(this.current.state == 'PLAYING');
					var targetCards= this.playableCards();
					io.to(this.getCurrentPlayerSocketId()).emit('play', {
						cards:targetCards
					});
				}

			}
		},
		announce: function(pName,announce){
			var pIndex =this.players.indexOf(pName);
			assert(pIndex != -1);
			assert(pIndex == this.current.player);
			//todo: assert announce.value is authorized and announce.color is authorized
			log('DEBUG', 'Game '+this.namespace+': Player ' + pName + (announce==null?' passed ':(announce.coinched?' coinched!': ' announced ' + announce.value + announce.color)));
			assert(announce.value==0 || announce.value > this.current.announce.value || announce.coinched);//todo: renforcer secu

			//COINCHED
			if (announce.coinched){
				this.coinche(pName,announce);
				return;
			}
			//PASS
			if (announce.value==0){//KO
				announce.color=null;
				//if first to speak: note player in case all player gonna pass
				if (this.current.announce.player==-1){//if first to talk and pass,note it down to know where the turn started
					this.current.announce.player = this.players.indexOf(pName);
				} 
				//if end of announce turn
				if (this.getNextPlayer() == this.current.announce.player){//if all passed
					//if all passed = nextRound
					if (this.current.announce.value==0){
						//notify pass
						io.to(this.namespace).emit('announced', {from: pName, announce:announce});//todo: add scores
						this.emitUpdatePlayerInfo();
						//notidy newGame
						this.cleanPlayerAnnounce();
						log('DEBUG', 'Game '+this.namespace+': All passed');
						this.nextRound();
						return;
					} else {//
						io.to(this.namespace).emit('chosenTrumps', this.current.announce.color);//todo: add scores
						this.current.state = "PLAYING";
						this.current.player = (this.current.dealer+1)%this.players.length;
						// var targetCards = this.playableCards();
						// io.to(this.getCurrentPlayerSocketId()).emit('play',{cards:targetCards});
						this.cleanPlayerAnnounce();
						this.emitUpdatePlayerInfo();
						log('DEBUG', 'Game '+this.namespace+': Final announce is ' + this.players[this.current.announce.player] + ': ' + this.current.announce);
						this.isThereABelote();
						log('DEBUG','Game ' + this.namespace + ': ' + (this.current.belote ? 'Belote detected in '+ this.players[this.current.belote.player] + '\'s hand' : 'No belote detected'));
						this.nextTrick();
						return;
					}

				}
				//else if one passed but not last
					//nothing to do: next player
			} else {
			//Announced
				this.current.announce = {value: announce.value, color: announce.color, coinched: false, player: this.players.indexOf(pName)}//todo: get index of pName
			}
			this.attendee[pName].announce = {value: announce.value, color: announce.color}
			io.to(this.namespace).emit('announced', {from: pName, announce:announce});//todo: add scores
			this.emitUpdatePlayerInfo();
			this.setNextPlayer();
			io.to(this.getCurrentPlayerSocketId()).emit('announce', {
				announce:{value:this.current.announce.value,
				color:this.current.announce.color,
				coincheEnabled: this.current.announce.value!=0 && !this.sameTeam(this.current.announce.player,this.current.player)}
			});
		},
		coinche: function(pName,announce){
			var pIndex =this.players.indexOf(pName);
			assert(pIndex != -1);
			assert(this.current.announce);
			assert(this.current.announce.color == announce.color && this.current.announce.value == announce.value);
			assert(!this.sameTeam(this.players.indexOf(pName),this.current.announce.player));
			log('DEBUG','Game ' + this.namespace + ': Player '+ pName + ' coinched ' + announce);

			this.current.announce.coinched = true;
			//todo: emit 'coinched'!!

			this.current.player = (this.current.dealer+1)%this.players.length;
			io.to(this.namespace).emit('coinche',{from:pName});
			this.cleanPlayerAnnounce();
			this.emitUpdatePlayerInfo();
			this.current.state = 'PLAYING';
			log('DEBUG', 'Game '+this.namespace+': Final announce is ' + this.players[this.current.announce.player] + ': ' + this.current.announce);
			this.isThereABelote();
			log('DEBUG','Game ' + this.namespace + ': ' + (this.current.belote ? 'Belote detected in '+ this.players[this.current.belote.player] + '\'s hand' : 'No belote detected'));
			this.nextTrick();
		},
		play: function(pName,card){//card='AH'
			var pIndex =this.players.indexOf(pName);
			assert(pIndex != -1);
			assert(pIndex == this.current.player);

			var realCard = Cards[card];//todo: test non existent card
			this.playGame(pName, realCard);
		},

		//detailed play game
		playGame: function(pName, card){//card={value:,color:}
			this.playRound(pName, card);


								var tmp = [];
								for (var i = 0; i < this.current.trick.length; i++) {
									tmp.push(this.current.trick[i]?this.current.trick[i].toString():null);
								}


			if (this.trickLength() > 0){ 										// trick ongoing -> next player to play
				this.setNextPlayer();
				var targetCards = this.playableCards();
				io.to(this.getCurrentPlayerSocketId()).emit('play',{cards:targetCards});
			} else if (this.current.trickIndex == 8){									//round finished -> end or next round
				//sys back to room
				//todo: manage points


			//contrat fait ?
			if (this.current.belote){
				this.scores.round[this.getTeamNumber(this.current.belote.player)] += 20;
			}
			var teamWhoAnnounced= this.getTeamNumber(this.current.announce.player);
			var contractPassed = this.scores.round[teamWhoAnnounced] >= this.current.announce.value; //todo: && scores > other team
			//
			if (contractPassed){
				this.scores.game[teamWhoAnnounced] += this.current.announce.value * (this.current.announce.coinched ? 2 : 1);
			} else {
				this.scores.game[(teamWhoAnnounced + 1)%2] += this.current.announce.coinched ? this.current.announce.value *2 : 160;

			}

			for (i in this.players){
				var pName = this.players[i];
				io.to(this.attendee[pName].global.socketid).emit('endJetee',{scores:this.scoresFromViewOf(pName)});
			}
				//emit end game ==> back to room
				if (false){//todo: condition end game																	//if end
					//emit
					// var team = this.players
					// var scoresFromViewOfPlayer
					//delete game item //todo: comment lol?
				} else { 																//if next round
					this.nextRound();
				}
			} else {
				this.nextTrick();														//next trick
			}

		},
		playRound: function(pName, card){
			this.playTrick(pName,card);
			if (this.trickLength() == this.players.length){//end trick
				var lastTrick = [];
				this.current.trick.forEach(function(card,i){
					// lastTrick.push(card.toString()); //too: check what needed
					lastTrick[i]=card.toString();
				});
				var winnerIndex = this.trickWinner().index;
				log('DEBUG','Game ' + this.namespace + ': Player '+ this.players[winnerIndex] + ' won the trick');
				this.tricks.push(lastTrick);
				console.log(lastTrick);
				this.emitEndTrick();
				var teamIndex = this.getTeamNumber(winnerIndex);
				this.current.player = winnerIndex;
				this.collectCards(lastTrick,teamIndex);
				//update scores
				this.scores.round[teamIndex]+=parseInt(trickValue(lastTrick, this.current.announce.color, this.current.trickIndex == 7));
				// io.to(this.namespace).emit('endTrick', {});//todo: lastTrick:lastTrick
				this.current.trickIndex++;
				//this.current.player = ...
				this.current.trick = [];
			} 
			// else {
			// 	this.setNextPlayer();
			// 	io.to(this.getCurrentPlayerSocketId()).emit('play',this.playableCards());
			// }
		},
		playTrick: function(pName, card){
			log('DEBUG','Game ' + this.namespace + ': Player '+ pName + ' played ' + card.toString());
			var cIndex = this.attendee[pName].cards.indexOf(card.toString());
			assert(cIndex != -1);//JEN SUIS LA ROBIN

			this.attendee[pName].cards.splice(cIndex, 1);//ca va pas truncate car c un objet different....
			this.current.trick[this.players.indexOf(pName)]=card;
			// io.to(this.namespace).emit('played', {from: pName, card:card.toString()});//todo: add scores
			
			this.emitCardPlayed(pName, card.toString());
			//HANDLE BELOTE
			this.handleBelote(pName, card);
		},

		///////////////
		//// UTILS
		///////////////
		getTeamNumber: function(pIndex){
			return (pIndex%2);
			// return (this.players.indexOf(pName)%2);
		},
		sameTeam: function(pIndex1,pIndex2){
			return (this.getTeamNumber(pIndex1)==this.getTeamNumber(pIndex2));
			// return (this.getTeamNumber(pName1)==this.getTeamNumber(pName2));
		},
		setNextDealer: function(){
			if (this.current.dealer !== null)
				this.attendee[this.players[this.current.dealer]].dealer=false;
			this.current.dealer = (this.current.dealer==null?3:(this.current.dealer+1)%this.players.length);
			this.current.player = (this.current.dealer+1)%this.players.length;
			this.attendee[this.players[this.current.dealer]].dealer=true;
			return this.current.player;
		},
		setNextPlayer: function(){
			this.current.player = (this.current.player+1)%this.players.length;
			return this.current.player;
		},
		getNextPlayer : function(){
			return (this.current.player+1)%this.players.length;
		},
		getCurrentPlayerSocketId: function(){
			return this.attendee[this.players[this.current.player]].global.socketid;
		},
		distribute: function(){
			var cards = this.deck.distribute();
			for (var i = 0; i < this.players.length; i++) {
				var targetPIndex = (i+this.current.dealer+1)%this.players.length;
				this.attendee[this.players[targetPIndex]].cards = cards[i];
				io.to(this.attendee[this.players[targetPIndex]].global.socketid).emit('distribute',{cards: cards[i]});
			};
		},
		nextRound: function(){
			log('DEBUG','Game '+ this.namespace + ': nextRound');
			this.scores.round = [0,0];
			this.tricks = [];
			this.current.belote = null;
			this.current.announce = {value:0,color:null,coinched:false,player:-1};
			this.current.trickIndex = 0;
			this.setNextDealer();
			this.distribute();
			this.current.state = 'ANNOUNCING';
			io.to(this.getCurrentPlayerSocketId()).emit('announce',{announce: {value:this.current.announce.value, color:this.current.announce.color, coincheEnabled: false}});
			this.emitUpdatePlayerInfo();
		},
		nextTrick: function(){
			log('DEBUG','Game '+ this.namespace + ': nextTrick');
			//this.current.player already set in playRound after winner computer
			this.current.firstPlayer = this.current.player;
			var targetCards = this.playableCards();
			io.to(this.getCurrentPlayerSocketId()).emit('play',{cards: targetCards});
		},
		trickLength: function(){
			var count = 0;
			for (i in this.current.trick){
				count++;
			}
			return count;
		},

///////////////////////////////////////////////////::
		//playCards
		playableCards: function(){
			var thisPlayerCards = this.attendee[this.players[this.current.player]].cards;
			
			//FIRST TO PLAY -> ALL CARDS
			if (this.firstToPlay()) return thisPlayerCards;

			var colorPlayedCards = cardsOfColor(thisPlayerCards,this.colorPlayed());
			//IF HE HAS THE COLOR
			if (colorPlayedCards.length > 0){
				//AND ORDER LIKE TRUMPS
				if ((this.colorPlayed()==this.current.announce.color) || this.current.announce.color == 'AT'){
					//MANAGE TRUMP ORDER
					return manageTrumps(this.current.trick, thisPlayerCards, this.current.announce.color,this.colorPlayed());
				}
				//IF NO TRUMP RETURN ALL CARDS OF THE COLOR
				return colorPlayedCards;
			}

			//IF I DO NOT HAVE THE COLOR
			//AND IF MY PARTNER IS WINNING
			if (this.partnerIsWinning()) return thisPlayerCards;
			//RETURN ALL CARDS
			
			//IF THE OTHER TEMA IS WINNING
			var trumpPlayedCards = cardsOfColor(thisPlayerCards,this.current.announce.color);
			//IF I CAN CUT
			if(trumpPlayedCards.length>0){
				//MANAGE TRUMP ORDER
				return manageTrumps(this.current.trick, thisPlayerCards, this.current.announce.color,this.colorPlayed());
			}
			//IF I CANNOT CUT RETURN ALL CARDS
			return thisPlayerCards;
		},
		partnerIsWinning: function(){ 
			var len = this.trickLength();
			if (len >=2){
				return this.sameTeam(this.trickWinner().index,this.current.player);
			}
			return false;
		},
		/*** RETURN TRUE IF CURRENT PLAYER IS FIRST TO PLAY ***/
		firstToPlay: function(){
  			return this.trickLength() == 0;
		},
		/*** RETURNS THE COLOR OF THE FIRST CARD OF THE TRICK ***/
		colorPlayed: function(){
			if (!this.current.trick[this.current.firstPlayer])  return null;
			return this.current.trick[this.current.firstPlayer].color;
		},




		trickWinner: function(){
			var defaultOrder = (this.current.announce.color == 'AT'?'trumpOrder':'order');//if AT or NT, always defaultOrder

			var cut = false;
			var max = 0;
			var winnerIndex = 0;
			var winningCard = {};
			// for (index in this.current.trick){
			for (var i = 0; i < 4; i++){//todo: sale
				var index = (this.current.firstPlayer + i)%4;
				var card = this.current.trick[index];
				if (card){
					if (cut){
						if ((card.color == this.current.announce.color) && (card.trumpOrder > max)){
							max = card.trumpOrder;
							winnerIndex = index;
							winningCard = card;
						}
					} else {
						if (card.color == this.current.announce.color) {
							cut = true;
							max = card.trumpOrder;
							winnerIndex = index;
							winningCard = card;
						} else if ((card.color == this.colorPlayed()) && (card[defaultOrder] > max)){
							max = card[defaultOrder];
							winnerIndex = index;
							winningCard = card;
						}
					}
				}
			}
			res = parseInt(winnerIndex);
			// res = (parseInt(winnerIndex)+this.current.dealer+1)%this.players.length;
			return {card: winningCard, index: res};
			// return {card: winningCard, index: parseInt(winnerIndex)};
		},
		collectCards: function(trick, team){

			this.deck.collectTrick(trick, team);
		},
			/*** COMPUTES WHETHER THERE IS A BELOTE ON THE BEGINING OF A JETEE ***/
		isThereABelote: function(){
			// console.log({trump:this.current.announce.color});
			if (this.current.announce.color == 'AT' || this.current.announce.color == 'NT') return false;
			
			for (i in this.players){
				var pName = this.players[i];
			// this.players.foreach(function(pName){
				// FOR EACH PLAYER
				var cards = this.attendee[pName].cards;
				for (var j = 0; j < cards.length; j++) {
					//FOR EACH OF HIS CARD
					var card = Cards[cards[j]];
					if (card.color == this.current.announce.color){
						//IF THIS CARD IS TRUMP
						
						//IF HE HAS THE KING
						if (card.value == 'K'){
							for (var k = j+1; k < cards.length; k++){
								var secondCard=Cards[cards[k]];
								if (secondCard.value == 'Q' && secondCard.color == this.current.announce.color){
								//AND THE QUEEN
									return this.current.belote = {player : this.players.indexOf(pName), rebelote: false};
								//THERE IS A BELOTE
								}
							}
							//IS HE HAS ONLY THE KING THERE IS NO BELOTE FOR NO ONE
							return false;	
						}
						//SAME WITCH QUEEN AT FIRST
						if (card.value == 'Q'){
							for (var k = j+1; k < cards.length; k++){
								var secondCard=Cards[cards[k]];
								if (secondCard.value == 'K' && secondCard.color == this.current.announce.color){
									return this.current.belote = {player : this.players.indexOf(pName), rebelote: false};
								}
							}
							return false;
						}
					}
				}
			};
		},
		handleBelote: function(pName,card){
			if (this.current.belote && this.players[this.current.belote.player] == pName){
				if (card.color == this.current.announce.color && (card.value == 'K' || card.value == 'Q')){
					var rebelote = this.current.belote.rebelote;
					log('DEBUG','Game '+this.namespace + ': ' + (rebelote?'RE':'') + 'BELOTE: ' + card + ' has been played by '+ pName);
					if (!rebelote) this.current.belote.rebelote = true;
					for (i in this.players){
						io.to(this.attendee[this.players[i]].global.socketid).emit('belote',{
						 	index: 		(this.players.indexOf(pName) - i + this.players.length)%this.players.length,
							rebelote: 	rebelote
						});
					}
				}
			}
		},
		playersFromViewOf: function(pName){
			var pIndex = this.players.indexOf(pName);
			assert(pIndex != -1);
			var view = [{},{},{},{}];
			for (i in this.players) {
				var attendee=this.attendee[this.players[i]];
				if (!attendee){
					console.log({players:this.players, i:i, player:this.players[i],attendees:this.attendee, attendee:this.attendee[this.players[i]]});
				}
				// if (attendee){
					view[(i - pIndex + 4)%4] = {
						name: this.players[i],
						dealer: attendee.dealer,
						playedCard: attendee.playedCard,
						announce: attendee.announce
					};
				// }
			}
			return view;
		},
		trickFromViewOf: function(pName, trickIndex){
			var pIndex = this.players.indexOf(pName);
			var trick = this.tricks[trickIndex];
			var res = [];
			for (i in trick){
					res[i] = trick[(i-pIndex+this.players.length)%this.players.length]					
			}
			return res;
		},
		scoresFromViewOf: function(pName){
			var teamIndex = this.getTeamNumber(this.players.indexOf(pName));
			var scoresFromViewOfPlayer = { round:[this.scores.round[teamIndex],this.scores.round[(teamIndex + 1)%2]],
											game:[this.scores.game[teamIndex],this.scores.game[(teamIndex + 1)%2]] };
			return scoresFromViewOfPlayer;
		},
		emitUpdatePlayerInfo: function(){
			for (i in this.players){
				io.to(this.attendee[this.players[i]].global.socketid).emit('updatePlayerInfo',{players: this.playersFromViewOf(this.players[i])});
			}
		},
		emitCardPlayed: function(pName,card){
			for (i in this.players){
				io.to(this.attendee[this.players[i]].global.socketid).emit('played', {	
					from: pName, 
					index:(this.players.indexOf(pName) - i + this.players.length)%this.players.length, 
					card:card
				});
			}
			
		},
		emitEndTrick: function(){
			for (i in this.players){
				io.to(this.attendee[this.players[i]].global.socketid).emit('endTrick', {
					index:(this.trickWinner().index - i + this.players.length)%this.players.length,
					lastTrick: (this.current.trickIndex == 7 ? null : this.trickFromViewOf(this.players[i], this.current.trickIndex))
				});
			}

		},
		cleanPlayerAnnounce: function(){
			for (i in this.players){
				this.attendee[this.players[i]].announce=null;
			}

		}
	}


}

/*** RETURNS THE SUBTABLE OF @CARDS OF THE COLOR @COLOR ***/
function cardsOfColor (cards, color){//cards=[{value:,color:}]
	var targetCards = [];
	cards.forEach(function(card){
		if (Cards[card].color == color){
			targetCards.push(card);
		}
	});
	return targetCards;
}
function manageTrumps(playedCards, availableCards, trumpColor, playedColor){
	//COMPUTE THE GREATEST CARD IN THE TRUMP
	var maxTrump = 0;
	playedCards.forEach(function(_card){
		var card = Cards[_card];
		// var card = Cards[_card.color, _card.value];
		if (card.color == trumpColor || (trumpColor == 'AT' && card.color == playedColor)) {
			if (card.trumpOrder > maxTrump) maxTrump = card.trumpOrder;
		}
	});
	if(maxTrump == 0) return cardsOfColor(availableCards, trumpColor);

	//SPLIT THE CARDS OF THIS COLOR LOWER OR GREATER THAN THE MAX VALUE
	var lowerTrumps = [];
	var upperTrumps = [];
	availableCards.forEach(function(_card){
		var card = Cards[_card];
		if (card.color == trumpColor|| (trumpColor == 'AT' && card.color == playedColor)) {
			if (card.trumpOrder > maxTrump){
				upperTrumps.push(_card);
			} else {
				lowerTrumps.push(_card);
			}
		}
	});
	assert(upperTrumps || lowerTrumps);
	//IF THERE ARE GREATER CARDS RETURN THEM, ELSE RETURN THE LOWER ONES
	return (upperTrumps.length>0?upperTrumps:lowerTrumps);
}
/*** RETURNS THE VALUE OF THE @TRICK CONSIDERATING THE TRUMP COLOR IS @TRUMP AND IT @ISLASTTRICK OR NOT ***/
function trickValue (trick, trump, isLastTrick){
	var res = 0;
	trick.forEach(function(card){
		if (trump == 'AT'){
			res += Cards[card].allTrumpsPoints;
		} else if (trump == 'NT'){
			res += Cards[card].noTrumpsPoints;
		} else if (trump == Cards[card].color){
			res += Cards[card].trumpPoints;
		} else {
			res += Cards[card].points;
		}
	});
	if (isLastTrick) res += 10;
	return res;
}

