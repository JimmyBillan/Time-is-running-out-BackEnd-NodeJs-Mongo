var Post 			= require('mongoose').model('Post');
var Pchecker 		= require('../../app/controllers/post.server.createChecker');
var mongoose 		= require('mongoose');

var tokenRefresher 	= require('../../app/controllers/user.server.tokenRefresher')
var jwt    			= require('jsonwebtoken');
var config 			= require('../../config/config.js');

var User 			= require('mongoose').model('User');


function _createSimply (token, post,decodedToken, res) {

	Pchecker.validFormCreate(post,decodedToken,  function(err, result) {
		if(!err){
			var dateNow = Math.round(new Date().getTime()/1000);
			var post = Post({
				creator : decodedToken.username,
				rawData : result.rawData,
				timer : dateNow + result.timerPostinSecond,
				dateCreation : dateNow
			})
			post.save(function(err) {
				if(err){ console.log(err); res.json(err); }
				else{
					console.log(result.timerTotal);
					res.json({success : true, timerTotal : result.timerTotal, JWToken: token});
				}
			});
			
		}	
		else{
			//rawdata not valid
			console.log(result);
			res.json(result);
		}
	});
}
/*
function _createSimply_photo (token, req, decodedToken, res) {

	Pchecker.validFormCreate(post,decodedToken,  function(err, result) {
		if(!err){
			var dateNow = Math.round(new Date().getTime()/1000);
			var post = Post({
				creator : decodedToken.username,
				rawData : result.rawData,
				timer : dateNow + result.timerPostinSecond,
				dateCreation : dateNow
			})
			post.save(function(err) {
				if(err){ res.json(err); }
				else{
					res.json({success : true, timerTotal : result.timerTotal, JWToken: token});
				}
			});
			
		}	
		else{
			//rawdata not valid
			res.json(result);
		}
	});
}*/

exports.create = function(req, res) {
	var ImageChecker = require('../../app/controllers/image.uploadChecker.js');
	var token = req.headers['x-access-token'];
	var photo = req.headers["orientationpic"];
		jwt.verify(token, config.secret, function(err, decoded){
			if(err){
				if(err.message == "jwt expired"){
					tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
						if(err){res.json({success: false, tokenStatut : "expired"});} 
	    				else{
	    					if(photo > -1){
	    						console.log("photo == truerefresh");
	    						ImageChecker.uploadPostPic(newToken,jwt.decode(token), Post, req, res)
	    					}else{
	    					_createSimply(newToken, req.body,jwt.decode(token), res);
	    					}

	    				} 
	    			});
				} else{
					res.status(401).send(err);
				}
			}else{
				if(photo > -1){
	    			ImageChecker.uploadPostPic(token,jwt.decode(token),Post, req, res)
	    		}else{
	    			_createSimply(token, req.body,jwt.decode(token), res);
	    		}

				

			} 
		});
	
};





function _modify(token, req, decodedToken, res) {
	if(req.id  && req.rawData && decodedToken.username){
		var dateNow = Math.round(new Date().getTime()/1000);
		Pchecker.validFormModify(req.rawData, function(err, rawData){
			Post.findOneAndUpdate({_id :mongoose.Types.ObjectId(req.id), creator:decodedToken.username}, {$set:{rawData: rawData}},{new: true}, function(err, allPost){
			if(err)res.send(err);
			else{
				res.json({success:true, JWToken : token, posts:allPost});
				
			}

		});
	});
		
		
	}else{
	res.send({success:false,why:"not Myself"});
	}
}


exports.modify = function(req, res) {
	var token = req.headers['x-access-token'];
	jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){
				
		
				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
    				if(err){res.json({success: false, tokenStatut : "expired"});} 
    				else{_modify(newToken, req.body, jwt.decode(token), res);} 
    			});
			} else {
				res.status(401).send({success : false, why : "token error"});
			}
		
		} else {_modify(token, req.body,jwt.decode(token), res);} 
	});

}

function _getPostUser(token, req, decodedToken, res) {
	
		var dateNow = Math.round(new Date().getTime()/1000);
		Post.find({creator:decodedToken.username, timer : {$gt :dateNow } },{},{sort:{dateCreation:-1}}, function(err, allPost){
			if(err)res.send(err);
			else{
				User.findOne({username:decodedToken.username},{_id : 1, profilPicUri:1}, function (err, doc) {
					res.json({success:true, JWToken : token, dateNow : dateNow, posts:allPost, avatarUri : doc.profilPicUri});
				})
				
			}
		});
			
}


exports.getPostsUser = function(req, res) {
	var token = req.headers['x-access-token'];
	jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){

				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
    				if(err){res.json({success: false, tokenStatut : "expired"});} 
    				else{_getPostUser(newToken, req.params,jwt.decode(token), res);} 
    			});
			} else {
				res.status(401).send({success : false, why : "token error"});
			}
		}else{_getPostUser(token, req.params,jwt.decode(token), res);} 
	});
	
};

function _getPostFollowing(token, req, decodedToken, res) {
	
		var dateNow = Math.round(new Date().getTime()/1000);
	
		User.findOne({username:decodedToken.username},{_id:0, followings : 1}, function(err, listIamFollowing) {
			if(err)res.json(err);
			else{ 
			Post.find({creator: {$in : listIamFollowing.followings},timer : {$gt :dateNow }},{},{sort:{dateCreation:-1}}).lean().exec(function(err, allPost){
					if(err)res.send(err);
					else{
						
						var allPost_count = allPost.length;
						var listCreator = [];

						if(allPost_count > 0){
							for (var i = 0; i < allPost_count; i++) {
								allPost[i].IamAdder = false;
								listCreator.push(allPost[i].creator);

								for(var j = 0; j < allPost[i].adder.length; j++){
									if(decodedToken.username == allPost[i].adder[j]){
										allPost[i].IamAdder = true;
									}
								}
								delete allPost[i].adder;
							};
						}


						User.find({username: {$in : listCreator}},{_id:0, profilPicUri:1, username : 1},function(err, doc) {
								if(doc != null){
									for (var i = 0; i < doc.length; i++) {
										for (var j = 0; j < allPost.length; j++) {
											if(doc[i].username == allPost[j].creator){
												allPost[j].avatarUri = doc[i].profilPicUri;
																
											}
										};
									};
								}
						res.json({success:true, JWToken : token, dateNow : dateNow, posts:allPost});
								
						});
			
					}
				});

			}
			});
															
}

exports.getPostFollowing = function(req, res) {
	var token = req.headers['x-access-token'];
	jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){
				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
    				if(err){res.json({success: false, tokenStatut : "expired"});} 
    				else{_getPostFollowing(newToken, req.params,jwt.decode(token), res);} 
    			});
			} else {
				res.status(401).send({success : false, why : "token error"});
			}
		}else{_getPostFollowing(token, req.params,jwt.decode(token), res);} 
	});
	
};


function _add1h(token, req, decodedToken, res){
	User.findOne({username : decodedToken.username, followings : {$in : [req.creator]}}, function(err, doc){
		if(err){ res.json(err);}
		else{
			console.log(req.creator);
			if(doc !== null){
			
				Post.findOneAndUpdate({_id:mongoose.Types.ObjectId(req.id),creator : req.creator, adder : {$ne : decodedToken.username}},
					{$inc : {timer : 3600}, $push : {adder : decodedToken.username}},function(err, thepost){
						if(err){res.json(err)}
						else{
							if(thepost !== null){
								res.json({success : true, id  : req.id});
							}else{
								res.json({success : false, why : "id is wrong"});
							}
						}
				});
			}else{
				res.json({success : false, why : "not following"});
			}
		
		}

	});
}

exports.add1h = function(req, res){
	var token = req.headers['x-access-token'];
	console.log(req.body);
	jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){

				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
    				if(err){res.json({success: false, tokenStatut : "expired"});} 
    				else{_add1h(newToken, req.body,jwt.decode(token), res);} 
    			});
			} else {
				res.status(401).send({success : false, why : "token error"});
			}
		}else{_add1h(token, req.body,jwt.decode(token), res);} 
	});


}

function _addComment (token, params, body, decodedToken, res) {

	function requetePush () {
			var dateNow = Math.round(new Date().getTime()/1000);
			console.log(body);
			Post.findOneAndUpdate(
				{_id: params.idPost, creator:params.postAuthor},
				{$push : 
					{comments : 
						{
							creator : decodedToken.username, 
							commentText : body.rawData,
							dateCreation : dateNow
						}
					},
					$inc: {nbComment : 1}
				},
				function(err, thePost){
				if(err)res.json(err);
				else{
					if(thePost !== null){
						res.json({success:true,JWToken : token})
					}else{

						res.json({success:false, why : "id\'s wrong"})
					}
				}
			});

		
		

	}

	if(params.postAuthor == decodedToken.username){
			requetePush();
	}else{
		User.findOne({followers : {$in : [decodedToken.username]},username : params.postAuthor},
			{_id:1},
			function (err, doc) {
			if(err)res.json(err);
			else{
				if(doc !== null){
					requetePush();
				}else{
					res.json({success:false, why : "not following"});
				}
			}
		})
	}


	
}

exports.addComment = function(req,res) {
	var token = req.headers['x-access-token'];
	Pchecker.validCommentCreate(req.body.rawData, function(err, retour){
			if(err){
				res.json(retour);
			}else{
				console.log(retour);
				req.body.rawData = retour;
				try{
					jwt.verify(token, config.secret, function(err, decoded){
						if(err){
							if(err.message == "jwt expired"){
								tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
				    				if(err){res.json({success: false, tokenStatut : "expired"});} 
				    				else{
										console.log(req.params);
				    					_addComment(newToken, req.params,req.body,jwt.decode(token), res);
				    				} 
				    			});
							} else {
								res.status(401).send({success : false, why : "token error"});
							}
						}else{_addComment(token, req.params,req.body,jwt.decode(token), res);} 
					});
				}catch(e){
					res.json({success : false, why : "id invalide"});
				}
			}
	});

}

function _getCommentsByPostId (token, params, decodedToken, res) {
	function requetFind(){
		var dateNow = new Date();
		Post.findOne(
			{_id: params.idPost, creator:params.postAuthor},
			{_id :0, comments :1}).lean().exec(
			function(err, comments){
			if(err)res.json(err);
			else{
				if(comments !== null){

					var lesCreators = [];
					comments.comments.forEach(function(com) {
					lesCreators.push(com.creator);
					})

					User.find({username:{$in : lesCreators} }, {_id:0, username : 1,  profilPicUri : 1}, function(err, doc){
						comments.comments.forEach(function(com2) {
							doc.forEach(function(doc2) {
								if(com2.creator == doc2.username){
									com2.profilPicUri = doc2.profilPicUri;
									
								}
							})
							
						})
						res.json({success:true,JWToken : token, comments : comments.comments, dateNow : dateNow = Math.round(new Date().getTime()/1000)})
					});
										
				}else{
					res.json({success:false, why : "id\'s wrong"})
				}
			}
		});
	}

	if(params.postAuthor == decodedToken.username){
		requetFind();
	}else{
		User.findOne({followers : {$in : [decodedToken.username]},username : params.postAuthor},
			{_id:1},
			function (err, doc) {
			if(err)res.json(err);
			else{
				if(doc !== null){
					requetFind();
				}else{
					res.json({success:false, why : "not following"});
				}
			}
		})
	}

	
	
}

exports.getCommentsByPostId = function(req, res){
	var token = req.headers['x-access-token'];


	req.params.id =  mongoose.Types.ObjectId(req.params.id);
		jwt.verify(token, config.secret, function(err, decoded){
			if(err){
				if(err.message == "jwt expired"){
					tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
	    				if(err){res.json({success: false, tokenStatut : "expired"});} 
	    				else{_getCommentsByPostId(newToken, req.params,jwt.decode(token), res);} 
	    			});
				} else {
					res.status(401).send(err);
				}
			}else{_getCommentsByPostId(token, req.params,jwt.decode(token), res);} 
		});

}


exports.getTimer = function(req, res) {
	var id;
	try{
		id =  mongoose.Types.ObjectId(req.params.id);
			Post.findOne({_id : mongoose.Types.ObjectId(req.params.id)},{_id : 0, timer:1}, function(err, timer) {
			if(err)res.json(err);
			else{
				if(timer !== null){
					res.json({success:true, id: id, timer : timer.timer});
				}else{
					res.json({success:false, why : "post doesn\'t exist"});
				}
			}
			})
	}catch(e){
			res.json({success : false, why : "id invalide"});
	}

};


exports.getPhoto = function(req, res){
	var path = require('path');
	if(req.params.uri != 'photo'){
		res.sendFile(path.join(__dirname, '../public/images/post/',req.params.uri));
	}
	else{
		res.status(401).json({success:false, why : "missing parameter"});
	}
}


