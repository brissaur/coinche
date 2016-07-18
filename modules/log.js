var loglevels = ['DEBUG','INFO','ERROR','CRITICAL'];
module.exports = function(loglevel,logmessage){
	//logger.log
	console.log(new Date() + ' ' + loglevel.toUpperCase() + ' ' + logmessage);
}