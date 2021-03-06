// var auth = require('./modules/authentification');
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
        successRedirect : '/home', // redirect to the secure home section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
	app.get('/signup', function(req,res){
		res.render('signup',{ message: req.flash('signupMessage') });
	});
	app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/home', // redirect to the secure home section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
	app.get('/home', isLoggedIn, function(req,res){
		// console.log(req);
		res.render('reactApp', {user: req.user});
	});
	app.get('/logout', function(req,res){
		req.logout();
		res.redirect('/');
	});
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
    app.post('/auth/socket',isLoggedIn, function(){
    	
    });
    // handle the callback after facebook has authenticated the user
    // app.get('/auth/facebook/callback',function(req, res){
    // 	console.log(req);
    // 	console.log(res);
    // });

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/home',
            failureRedirect : '/'
        }
    ));



	function isLoggedIn(req,res,next){
		if (req.isAuthenticated()){
			return next();
		}
		res.redirect('/');
	}

}
