
module.exports = function(io){
	return {
		chatMessage: function(m){
			//m = {from:,to:,msg}
			io.to(m.to).emit({from: m.from, msg:m.msg});
		}
	}

}