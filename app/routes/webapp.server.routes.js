module.exports = function(app){
	app.route('/').get(function(req, res, next){
		res.status(200).sendFile('stress.html',{root: __dirname }
			);
	});
}