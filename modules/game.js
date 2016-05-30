var Deck = require('./deck');

module.exports = function(players, spectators) {
	assert(players.length=4);
	return {
		deck: new Deck(),
		players: players,//[name]
		spectators: spectators,//[pName]
		scores: {global:[0,0], round:null},
		current: {
			dealer: '',
			player: '',
			announce: {
				value: '',
				color: '',
				player: '',
				coinched: false,
			},
			belote: null//player
		},
		//event
		announce: function(from, data, sendmessage){//data={value,color}

		},
		coinche: function(from, data, sendmessage){//data={value,color}//checker si probleme de emssage en meme temps

		},
		play: function(from, data, sendmessage){//data={value,color}

		},
		nextRound: function(){

		},
		nextGame: function(){

		}
		//systeme



	}
}
// Archi de jeu:
// 	One game = {Round} to have winner = {JETEE[8]}
// //systeùe de NOUS vs EUX
// //systeme intelligent pour al rotation de la vue
// 	je stocke le nm?
// 	l ID ?
// 	la position?
// 	...
// 		-> forcement une relation d ordre... quelle est elle?