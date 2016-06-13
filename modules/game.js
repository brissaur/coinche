var Deck 	= require('./deck');
var Cards 	= require('./card').template();
var log    	= require('./log');
module.exports = function(io, namespace, attendee, players) {
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
	return {
		namespace: namespace,
		deck: new Deck(),
		players: players,
		attendee: attendees,
		spectators: null, //todo: need to know who he is spectating
		scores:null,
		//team: null,
		current: {
			dealer: null, //0
			player: null, //1
			announce: {value:0,color:null,coinched:false,player:-1},//{value: color: coinched: player:}
			trick: [],
			belote: null
		},
		start: function(){
			// console.log(this.current);
			//emit data to players
			io.to(this.namespace).emit('startGame', {});//todo: players, dealer, 
			this.nextRound();
			// this.emitUpdatePlayerInfo();
			// console.log(this.current);
		},
		announce: function(pName,announce){
			var pIndex =this.players.indexOf(pName);
			assert(pIndex != -1);
			assert(pIndex == this.current.player);
			//todo: assert announce.value is authorized and announce.color is authorized
			log('DEBUG', 'Player ' + pName + (announce==null?' passed ':' announced ' + announce.value + announce.color));
			assert(announce.value==0 || announce.value > this.current.announce.value || announce.coinched);//todo: renforcer secu

			//COINCHED
			if (announce.coinched){
				this.coinche(pName,announce);
				return;
			}

			//PASS
			if (announce.value==0){//KO
				announce.color=null;
				//if end of announce turn
				if (this.getNextPlayer() == this.current.announce.player){//if all passed
					//if all passed = nextRound
					if (this.current.announce.value==0){
						//notify pass
						io.to(this.namespace).emit('announced', {from: pName, announce:announce});//todo: add scores
						this.emitUpdatePlayerInfo();
						//notidy newGame
						this.nextRound();
						return;
					} else {//
						io.to(this.namespace).emit('chosenTrumps', this.current.announce.color);//todo: add scores
						this.current.player = (this.current.dealer+1)%this.players.length;
						// console.log(this);
						// console.log(this.getPlayablecards());
						// console.log(this);
						var targetCards = this.getPlayablecards();
						// console.log(targetCards);
						io.to(this.getCurrentPlayerSocketId()).emit('play',{cards:targetCards});
						return;
					}
					// console.log('CHOSENTRUMPS');

				}
				if (this.current.announce.player==-1){//if first to talk and pass,note it down to know where the turn started
					this.current.announce.player == this.players.indexOf(pName);
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
			io.to(this.getCurrentPlayerSocketId()).emit('announce', {announce:this.current.announce});
		},
		coinche: function(pName,announce){
			var pIndex =this.players.indexOf(pName);
			assert(pIndex != -1);
			assert(this.current.announce);
			assert(this.current.announce.color == announce.color && this.current.announce.value == announce.value);
			assert(!this.sameTeam(pName,this.current.announce.player));

			this.current.announce.coinched = true;

			this.current.player = (this.current.dealer+1)%this.players.length;
			var targetCards = this.getPlayablecards();
			io.to(this.getCurrentPlayerSocketId()).emit('play',{cards:targetCards});
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
			playRound(pName, card);
			if (this.current.trick.length > 0){ 										// trick ongoing -> next player to play
				var targetCards = this.getPlayablecards();
				io.to(this.getCurrentPlayerSocketId()).emit('play',{cards:targetCards});
			} else if (this.current.trickIndex == 8){									//round finished -> end or next round
				//sys back to room
				//todo: manage points
				io.to(this.namespace).emit('endJetee', {scores: this.scores});//todo: add scores
				//emit end game ==> back to room
				if (false){//todo: condition end game																	//if end
					//emit
					//delete game item //todo: comment lol?
				} else { 																//if next round
					this.nextRound();
				}
			} else {
				this.nextTrick();														//next trick
			}

		},
		playRound: function(pName, card){
			playTrick(pName,card);
			if (this.current.trick.length == this.players.length){//end trick
				var lastTrick = [];
				this.current.trick.forEach(function(card){
					lastTrick.push(card.toString());
				});
				var winnerIndex = this.trickWinner();
				this.current.player = this.trickWinner();
				this.collectCards(lastTrick,getTeamNumber(this.players[winnerIndex]));
				//update scores
				this.scores[this.getTeamNumber(winnerIndex)]+=this.trickValue(lastTrick, this.current.announce.color, this.current.trickIndex == 7);

				io.to(this.namespace).emit('endTrick', {});//todo: lastTrick:lastTrick
				this.current.trickIndex++;
				//this.current.player = ...
				this.current.trick = [];
			} 
		},
		playTrick: function(pName, card){
			var cIndex = this.players[name].cards.indexOf(card);
			assert(cIndex != -1);//JEN SUIS LA ROBIN
			// assert(canPlayThisCard); //todo: check card playable
			this.attendee[pName].cards.splice(cIndex, 1);//ca va pas truncate car c un objet different....
			this.current.trick.push[card];
			//todo: handle belote
			//emit card played
			io.to(this.namespace).emit('played', {from: pName, card:card.toString()});//todo: add scores
		},

		//UTILS
		getTeamNumber: function(pName){
			return (this.players.indexOf(pName)%2);
		},
		sameTeam: function(pName1,pName2){
			return (this.getTeamNumber(pName1)==this.getTeamNumber(pName1));
		},
		getPlayablecards: function(){//return current player playable cards
			return (this.attendee[this.players[this.current.player]].cards);//todo: playable cards
		},
		setNextDealer: function(){
			if (this.current.dealer !== null)
				this.attendee[this.players[this.current.dealer]].dealer=false;
			// this.current.dealer = (this.current.dealer?Math.floor(Math.random*this.players.length):(this.current.dealer+1)%this.players.length);
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
			return this.attendee[players[this.current.player]].global.socketid;
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
			this.setNextDealer();
			this.distribute();
			io.to(this.getCurrentPlayerSocketId()).emit('announce',{announce: this.current.announce});
			this.emitUpdatePlayerInfo();
		},
		nextTrick: function(){
			//this.current.player already set in playRound after winner computer
			var targetCards = this.availableCards();
			io.to(this.getCurrentPlayerSocketId()).emit('play',{cards: targetCards});
		},

///////////////////////////////////////////////////::
		//playCards
		playableCards: function(){
			var thisPlayerCards = attendee[players[this.current.player].name].cards;
			
			//FIRST TO PLAY -> ALL CARDS
			if (this.firstToPlay()) return thisPlayerCards;

			var colorPlayedCards = this.cardsOfColor(thisPlayerCards,this.colorPlayed());
			//IF HE HAS THE COLOR
			if (colorPlayedCards.length > 0){
				//AND ORDER LIKE TRUMPS
				if ((this.colorPlayed()==this.current.announce.color) || this.current.announce.color == 'AT'){
					//MANAGE TRUMP ORDER
					return this.manageTrumps(this.current.trick, thisPlayerCards, this.current.announce.color,this.colorPlayed());
				}
				//IF NO TRUMP RETURN ALL CARDS OF THE COLOR
				return colorPlayedCards;
			}

			//IF I DO NOT HAVE THE COLOR
			//AND IF MY PARTNER IS WINNING
			if (this.partnerIsWinning()) return thisPlayerCards;
			//RETURN ALL CARDS
			
			//IF THE OTHER TEMA IS WINNING
			var trumpPlayedCards = this.cardsOfColor(thisPlayerCards,this.currentTrump);
			//IF I CAN CUT
			if(trumpPlayedCards.length>0){
				//MANAGE TRUMP ORDER
				return manageTrumps(this.currentTrick, thisPlayerCards, this.currentTrump,this.colorPlayed());
			}
			//IF I CANNOT CUT RETURN ALL CARDS
			return thisPlayerCards;
		},
		partnerIsWinning: function(){ 
			var len = this.current.trick.length;
			if (len >=2){
				return this.trickWinner().index == len - 2;
			}
			return false;
		},
		/*** RETURN TRUE IF CURRENT PLAYER IS FIRST TO PLAY ***/
		firstToPlay: function(){
  			return this.currentTrick.length == 0;
		},
		/*** RETURNS THE COLOR OF THE FIRST CARD OF THE TRICK ***/
		colorPlayed: function(){
			if (!this.current.trick[0])  return '';
			return this.current.trick[0].color;
		},







		/*** RETURNS THE SUBTABLE OF @CARDS OF THE COLOR @COLOR ***/
		cardsOfColor: function (cards, color){//cards=[{value:,color:}]
			var targetCards = [];
			cards.forEach(function(card){
				if (card.color == color){
					targetCards.push(card);
				}
			});
			return targetCards;
		},
		manageTrumps: function(playedCards, availableCards, trumpColor, playedColor){
			//COMPUTE THE GREATEST CARD IN THE TRUMP
			var maxTrump = 0;
			playedCards.forEach(function(_card){
				var card = Cards[_card.color, _card.value];
				if (card.color == trumpColor || (trumpColor == 'AT' && card.color == playedColor)) {
					if (card.trumpOrder > maxTrump) maxTrump = card.trumpOrder;
				}
			});
			if(maxTrump == 0) return this.cardsOfColor(availableCards, trumpColor);

			//SPLIT THE CARDS OF THIS COLOR LOWER OR GREATER THAN THE MAX VALUE
			var lowerTrumps = [];
			var upperTrumps = [];
			availableCards.forEach(function(card){
				if (card.color == trumpColor|| (trumpColor == 'AT' && card.color == playedColor)) {
					if (card.trumpOrder > maxTrump){
						upperTrumps.push(card);
					} else {
						lowerTrumps.push(card);
					}
				}
			});
			assert(upperTrumps || lowerTrumps);
			//IF THERE ARE GREATER CARDS RETURN THEM, ELSE RETURN THE LOWER ONES
			return (upperTrumps.length>0?upperTrumps:lowerTrumps);
		},
		/*** RETURNS THE VALUE OF THE @TRICK CONSIDERATING THE TRUMP COLOR IS @TRUMP AND IT @ISLASTTRICK OR NOT ***/
		trickValue: function(trick, trump, isLastTrick){
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
		},
		trickWinner: function(){
			var defaultOrder = (this.current.announce.color == 'AT'?'trumpOrder':'order');//if AT or NT, always defaultOrder

			var cut = false;
			var max = 0;
			var winnerIndex = 0;
			var winningCard = {};
			for (index in this.current.trick){
				var card = this.currentTrick[index];
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
			res = (winnerIndex+this.current.dealer+1)%this.players.length;
			return {card: winningCard, index: res};
			// return {card: winningCard, index: parseInt(winnerIndex)};
		},
		collectCards: function(trick, team){
			this.deck.collectTrick(trick, team);
		},
			/*** COMPUTES WHETHER THERE IS A BELOTE ON THE BEGINING OF A JETEE ***/
		isThereABelote: function(){
			if (this.current.announce.color == 'AT' || this.current.announce.color == 'NT') return false;
			
			this.players.forach(function(pName){
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
									return this.belote = {player : this.playersIndexes.indexOf(pName), rebelote: false};
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
									return this.belote = {player : this.playersIndexes.indexOf(pName), rebelote: false};
								}
							}
							return false;
						}
					}
				}
			});
		},
		playersFromViewOf: function(pName){
			var pIndex = this.players.indexOf(pName);
			assert(pIndex != -1);
			var view = [{},{},{},{}];
			for (i in this.players) {
				var attendee=this.attendee[this.players[i]];
				view[(i - pIndex + 4)%4] = {
					name: this.players[i],
					dealer: attendee.dealer,
					playedCard: attendee.playedCard,
					announce: attendee.announce
				};
			}
			return view;
		},
		emitUpdatePlayerInfo: function(){
			for (i in this.players){
				io.to(this.attendee[this.players[i]].global.socketid).emit('updatePlayerInfo',{players: this.playersFromViewOf(this.players[i])});
			}
		}
			/*** MANAGE RECONNECTION TO A GAME ***/
		// reconnect: function(name){
		// 	// assert(this.players[name]);
		// 	assert(this.attendee[name].global);

		// 	//INITIAL GAME DATA
		// 	io.to(users[name].socket).emit('initialize_game', 
		// 		{msg:'', players: this.playersIndexes, dealer: this.playersIndexes[this.currentDealer]});
		// 	//CURRENT PLAYER HAND
		// 	io.to(users[name].socket).emit('distribution', 
		// 			{msg:'', cards: this.players[name].cards, dealer: this.playersIndexes[this.currentDealer]});
		// 	//CURRENT PLAYED CARDS
		// 	var currentTrickCards = {};
		// 	for (pIndex in this.currentTrick){
		// 		var playerIndex = (parseInt(pIndex)+this.firstTrickPlayer)%this.nbPlayers;
		// 		currentTrickCards[this.playersIndexes[playerIndex]] = this.currentTrick[pIndex];
		// 	}
		// 	io.to(users[name].socket).emit('display_current_trick', { cards:currentTrickCards, msg:'current trick is ...'});
		// 	//SCORES
		// 	var scoresToSend = [];
		// 	scoresToSend.push(this.scores[this.players[name].team]);
		// 	scoresToSend.push(this.scores[(this.players[name].team+1)%2]);
		// 	scoresToSend[0].jetee = 0;
		// 	scoresToSend[1].jetee = 0;
		// 	io.to(users[name].socket).emit('scores', {message:'current scores', scores:scoresToSend});
		// 	//CURRENTLY WINNING ANNOUNCE
		// 	var winningAnnounce = {value: this.currentAnnounce.value, color:this.currentAnnounce.color , playerName: this.currentAnnounce.playerName};
		// 	io.emit('announced', { winningAnnounce: winningAnnounce, value:winningAnnounce.value, color:winningAnnounce.color, name:winningAnnounce.playerName, msg:''});
		// 	//THE CHOSEN TRUMP IF WE FINISHED ANNOUNCING AND ARE PLAYING
		// 	if (this.currentTrump) {
		// 		io.to(users[name].socket).emit('chosen_trumps', 
		// 						{msg:'', color: this.currentAnnounce.color, value: this.currentAnnounce.value, coinche: this.currentAnnounce.coinche});
		// 	}
			
		// 	//IF IT IS THAT PLAYERS TURN TO ANNOUNCE OR PLAY
		// 	if (this.playersIndexes[this.currentPlayer] == name ){
		// 		if (this.currentTrump){
		// 			io.to(users[name].socket).emit('play', {message:'', cards: this.playableCards()});	
		// 		} else {
	 //  				var winningAnnounce = {value: this.currentAnnounce.value, color:this.currentAnnounce.color , playerName: this.currentAnnounce.playerName};
		// 			io.to(users[name].socket).emit('announce', { winningAnnounce:winningAnnounce, msg:'next announce'});//TODO: pas bon choix en théorie car peut jouer quune partie a la foi... donc server devrait sen rappeler
		// 		}
		// 	}
		// }
	}
}


// TEAM 0:
// TEAM 1:

// EXEMPLE

// namespace: 'aefznraàçw_32°IHLDSQÖ',
// players: [0 => {name:'robin',cards:[]}, 'clement', 'remy', 'quentin'],
// spectators : [{name:'younes', spectating:'robin' },{name: 'thib'...} ],
// attendee: {
// 	'quentin'=> {socketid},
// 	'robin'=> {...},
// 	'clement'=> {...},
// 	'remy'=> {...},
// 	'younes'=> {...},
// 	'thib'=> {...}
// }


// { GAME }
// { { ROUND } }
// { { { JETEE_8 } } }
// { { { { CARD_4 } } } }

// game.play=playGame
// {
// 	playGame: function(pName, card){
// 		playRound(pName, card);
// 	},
// 	playRound: function(pName, card){
// 		playJetee(pName,card);
// 		if (endJetee){

// 		} else {
// 			//emit next player
// 		}
// 	},
// 	playJetee: function(pName, card){
// 		assert(hasCard);
// 		assert(canPlayThisCard);
// 		//emit card played
// 	}
// }
// game.play
// 	round.play
// 		jetee.play


// 	if nbcard==4
// 		if nbjetee==8
// 			//
// 		else
// 			// new firstPlayer
// 			// gather tricks to team
// 			//io.emit
