process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config 		= require('./config/config');
var mongoose    = require('./config/mongoose');
var express     = require('./config/express');

var app         = express();
var db 			= mongoose();



app.listen(config.port, config.ipAllowed);
module.exports = app;
console.log(process.env.NODE_ENV  + ' server running at http://localhost:' + config.port);


process.on('uncaughtException', function(err) {
console.log(err);
});
 