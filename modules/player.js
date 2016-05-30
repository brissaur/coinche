module.exports = function(name, socketid){
	return {
		name: name,
		socketid: socketid,
		roomid: null,
		status: 'AVAILABLE',

		updateStatus: function(status, io){
			this.status = status;
			io.to('roomid').emit('updateStatus', {from: this.name, status: status});
		}
	}
}