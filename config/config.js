// ==============================================================
// ================== GLOBAL VAR ==================================
// ==============================================================
var PORT = 3000;
module.exports = {
	express:{
		port: PORT
	},
	database: {
		url: "mongodb://127.0.0.1:27017/test" //mongodb://<user>:<pass>@mongo.onmodulus.net:27017/Mikha4ot		
	},
    facebookAuth: {
        'clientID'      : '1689664917973659', // your App ID
        'clientSecret'  : '6ad23ce9cc3e893cccc5c348c99fde1e', // your App Secret
        'callbackURL'   : 'http://localhost:'+PORT+'/auth/facebook/callback'
    }
}
