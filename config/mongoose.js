var config = require('./config'),
    mongoose = require('mongoose');
    require('../app/models/user.server.model');
    require('../app/models/posts.server.model');
    require('../app/models/notification.server.model');

module.exports = function() {

    var db = mongoose.connect(config.db);
    return db;
};