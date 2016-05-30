var Game = require('./game');

module.exports = function() {
	return {
		id: '',// on following template! 'R' + int
		//manage room socket
		players: [],
		event: function(event, data, callback){
			// callback(from,to,event,data);
			//data: from, to, data
			switch(event){
				case 'afez':

				break;
				default:
				
			}
		}
	}
}