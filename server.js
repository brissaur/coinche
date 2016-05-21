var express 	 = require('express'),
	config 		 = require('./config/config'),
	// http 		 = require('http'),
	routes 		 = require('./routes'),
	log 		 = require('./modules/log'),
	mongoose 	 = require('mongoose'),
	passport 	 = require('passport'),
	flash    	 = require('connect-flash');
	morgan       = require('morgan'),
	cookieParser = require('cookie-parser'),
	bodyParser   = require('body-parser'),
	session      = require('express-session');

mongoose.connect(config.database.url); 
// Create an express instance and set a port variable
require('./config/passport')(passport); 

var app = express();
	app.use(express.static(__dirname));// Set /public as our static content dir
  	app.set('view engine', 'jade');
	app.use(morgan('dev')); // log every request to the console
	app.use(cookieParser()); // read cookies (needed for auth)
	app.use(bodyParser()); // get information from html forms
	app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session

//routes
require('./routes.js')(app, passport); 

app.listen(config.express.port, function(){
	console.log('The magic happens on port ' + config.express.port);
});
// var server = http.Server(app).listen(config.port, function() {
//   log('INFO','Express server listening on port ' + config.port);
// });

// Initialize socket.io
// var io = require('socket.io').listen(server);
// var universe = require('./modules/universe')(io);