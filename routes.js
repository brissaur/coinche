var auth = require('./modules/authentification');
// ==============================================================
// ================== GLOBAL VAR ==================================
// ==============================================================
module.exports = function(app, passport){

	app.get('/', function(req,res){
		res.render('index');
	});
	app.get('/login', function(req,res){
		res.render('login',{ message: req.flash('loginMessage') });
	});
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
	app.get('/signup', function(req,res){
		res.render('signup',{ message: req.flash('signupMessage') });
	});
	app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
	app.get('/profile', isLoggedIn, function(req,res){
		res.render('profile', {user: req.user});
	});
	app.get('/logout', function(req,res){
		req.logout();
		res.redirect('/');
	});



	function isLoggedIn(req,res,next){
		if (req.isAuthenticated()){
			return next();
		}
		res.redirect('/');
	}

}


// module.exports = {
// 	index: function(req, res){
// 		res.render('index.jade',
// 		{
// 			name: "robin"
// 		});
// 	},
// 	routes: function(req, res){
// 		console.log(req.params.route);
// 		res.render('login.jade');
// 	},
// 	page: function(req, res){
// 		// res.render('');

// 	}
// }
