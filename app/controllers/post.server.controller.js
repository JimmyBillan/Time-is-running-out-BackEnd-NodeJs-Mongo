var Post 			= require('mongoose').model('Post');
var Pchecker 		= require('../../app/controllers/post.server.createChecker');
var mongoose 		= require('mongoose');

var tokenRefresher 	= require('../../app/controllers/user.server.tokenRefresher')
var jwt    			= require('jsonwebtoken');
var config 			= require('../../config/config.js');

		var User 		= require('mongoose').model('User');


function _create (token, post,decodedToken, res) {

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
}

exports.create = function(req, res) {
	var token = req.headers['x-access-token'];
		jwt.verify(token, config.secret, function(err, decoded){
			if(err){
				if(err.message == "jwt expired"){
					tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
						if(err){res.json({success: false, tokenStatut : "expired"});} 
	    				else{_create(newToken, req.body,jwt.decode(token), res);} 
	    			});
				} else{
					res.status(401).send(err);
				}
			}else{_create(token, req.body,jwt.decode(token), res);} 
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
				res.json({success:true, JWToken : token, dateNow : dateNow, posts:allPost});
				
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

						if(allPost_count > 0){
							for (var i = 0; i < allPost_count; i++) {
								allPost[i].IamAdder = false;
								for(var j = 0; j < allPost[i].adder.length; j++){
									if(decodedToken.username == allPost[i].adder[j]){
										allPost[i].IamAdder = true;
									}
								}
								delete allPost[i].adder;
							};
						}
						res.json({success:true, JWToken : token, dateNow : dateNow, posts:allPost});
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
			
			if(doc !== null){
			
				Post.findOneAndUpdate({_id:mongoose.Types.ObjectId(req.id),creator : req.creator, adder : {$ne : decodedToken.username}},
					{$inc : {timer : 3600}, $push : {adder : decodedToken.username}},function(err, thepost){
						if(err){res.json(err)}
						else{
							if(thepost !== null){
								res.json({add1h : "success", id  : req.id});
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
	console.log(params.postAuthor+" "+decodedToken.username);

	var conditon = {};
	console.log(params);
	function requetePush () {
		var dateNow = new Date();
				
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
			console.log("myself posting");
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
					res.json({success:true,JWToken : token, comments : comments.comments})						
				});
										
				}else{
					res.json({success:false, why : "id\'s wrong"})
				}
			}
		});
	}
	if(params.postAuthor == decodedToken.username){
		requetFind();
		console.log("find comments my post");
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


