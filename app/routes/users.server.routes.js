var users = require('../../app/controllers/user.server.controller');
var notifications = require('../../app/controllers/notification.server.controller');

module.exports = function(app) {

	//No token : mail - username - gender - password - age
    app.route('/user/create').post(users.create);

    //Valide mail : link send by email
    app.route('/user/confirm_mail/:mail/:token').get(users.validateMail);

    //No token : mail - password
    app.route('/user/login').post(users.login);

    app.route('/user/time').get(users.getTime);

    app.route('/user/notifications').get(notifications.list);
    app.route('/user/:username/addcontact').put(notifications.addcontact);

   //app.route('/user/list').get(users.list);
    
    app.route('/user/following').get(users.listIamFollowing);
    app.route('/user/follower').get(users.listMyFollower);

    app.route('/user/search/:username').get(users.searchPublic);
    app.route('/user/:username').get(users.profil);
    app.route('/user/image/:idImage').get(users.getImage);

    app.route('/user/avatar/uri/:username').get(users.getAvatarUri);
    app.route('/user/avatar/:profilPicUri').get(users.getAvatar);
    app.route('/user/avatar/update').post(users.uploadProfilPic);

};