var posts = require('../../app/controllers/post.server.controller');

module.exports = function(app) {

	app.route('/post/create').post(posts.create);
	app.route('/post/').get(posts.getPostsUser);
	app.route('/post/following').get(posts.getPostFollowing);
	app.route('/post/modify').post(posts.modify);
	app.route('/post/add1h').post(posts.add1h);
	app.route('/post/timer/:id').get(posts.getTimer);

	
	app.route('/post/comment/:idPost/:postAuthor/').post(posts.addComment).get(posts.getCommentsByPostId);
	app.route('/post/photo/:uri').get(posts.getPhoto);
	
};