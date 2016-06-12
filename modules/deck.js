var Cards = require('./card').template();

module.exports = function(){//todo: where stock points
	return {
		/*
		*
		*/
		cards: [],
		teamTricks: [[],[]],
		colorValues: {H: 0, S: 1, D:2,C: 3},
		init: function(){
			this.cards =['7H','8H','9H','10H','JH','QH','KH','AH','7D','8D','9D','10D','JD','QD','KD','AD','7S','8S','9S','10S','JS','QS','KS','AS','7C','8C','9C','10C','JC','QC','KC','AC'];
			//this.cards = Card
			this.shuffle();
			// this.cut();
		},
		shuffle: function(){
		    for(var j, x, i = this.cards.length; i; j = Math.floor(Math.random() * i), x = this.cards[--i], this.cards[i] = this.cards[j], this.cards[j] = x);
		},
		distribute: function(){
			var resultedDeck = [];
			this.fusionTeamTricks();
			if (this.cards.length == 0) this.init();
			this.cut();
			var p1 = [].concat(this.cards.slice(0,3),this.cards.slice(12,15),this.cards.slice(24,26));
			var p2 = [].concat(this.cards.slice(3,6),this.cards.slice(15,18),this.cards.slice(26,28));
			var p3 = [].concat(this.cards.slice(6,9),this.cards.slice(18,21),this.cards.slice(28,30));
			var p4 = [].concat(this.cards.slice(9,12),this.cards.slice(21,24),this.cards.slice(30,32));
			var resultedDeck = [this.cardSort(p1),this.cardSort(p2),this.cardSort(p3),this.cardSort(p4)];
			this.cards=[];
			return resultedDeck;
		},
		collectTrick: function(trick, team){
			this.teamTricks[team]=this.teamTricks[team].concat(trick.reverse());
		},
		cut: function(){
			var coupure = Math.floor(Math.random() * 15 + Math.random() * 15);
			var resultedDeck = [].concat(this.cards.slice(coupure, 32),this.cards.slice(0,coupure));
			this.cards = resultedDeck;
		},
		fusionTeamTricks: function(){
			var rand = Math.floor(Math.random()*2);
			this.cards = this.teamTricks[(rand+1)%2].concat(this.teamTricks[rand]);
			this.teamTricks[0] = [];
			this.teamTricks[1] = [];
		},
		cardSort: function(cards){
			var tab = cards
			var swapped;
		    do {
		        swapped = false;
		        for (var i=0; i < tab.length-1; i++) {
			        if ( (this.colorValues[Cards[tab[i]].color] > this.colorValues[Cards[tab[i+1]].color]) || ( (this.colorValues[Cards[tab[i]].color] == this.colorValues[Cards[tab[i+1]].color]) && (Cards[tab[i]].order > Cards[tab[i+1]].order) ) ){
		                var temp = tab[i];
		                tab[i] = tab[i+1];
		                tab[i+1] = temp;
		                swapped = true;
		            }
		        }
		    } while (swapped);
			return tab;
		}
	}
}