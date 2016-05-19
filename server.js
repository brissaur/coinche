var express = require('express'),
	config = require('./config'),
	http = require('http'),
	routes = require('./routes');


// Create an express instance and set a port variable
var app = express();
	// Set /public as our static content dir
	app.use("/", express.static(__dirname + "/public/"));
	// var jade = require('jade');
  app.set('view engine', 'jade');
	// app.engine('handlebars', exphbs({ defaultLayout: 'main'}));

app.get('/', routes.index);
// Page Route
app.get('/:page', routes.page);


var server = http.createServer(app).listen(3000, function() {
  console.log('Express server listening on port ' + 3000);
});

// Initialize socket.io
var io = require('socket.io').listen(server);
var universe = require('./modules/universe')(io);