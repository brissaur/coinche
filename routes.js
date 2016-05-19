// ==============================================================
// ================== GLOBAL VAR ==================================
// ==============================================================

module.exports = {
	index: function(req, res){
		res.render('index.jade',
		{
			name: "robin"
		});

	},
	page: function(req, res){
		// res.render('');

	}
}
