

var config = require('./config'),
    express = require('express'),
    bodyParser = require('body-parser'),
	morgan      = require('morgan');

module.exports = function() {
    var app = express();



    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());
	app.use(morgan('dev'));

  

	require('../app/routes/webapp.server.routes.js')(app);
    require('../app/routes/users.server.routes.js')(app);
    require('../app/routes/posts.server.routes.js')(app);


    return app;
};