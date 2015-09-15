var User 		= require('mongoose').model('User');
var Post 			= require('mongoose').model('Post');
var Uchecker 	= require('../../app/controllers/user.server.createChecker');
var _SigninMail = require('../../app/controllers/user.server.SendMail.signin');


var tokenRefresher = require('../../app/controllers/user.server.tokenRefresher')
var jwt    		= require('jsonwebtoken');
var config = require('../../config/config.js');

function _getTime(token, username, res){
	User.findOne({username:username},{_id:0, timer : 1, timerDate : 1}, function(err, doc){
		if(err){ res.json({success:false, error : err})}
		else{
			//Update credit time

			if( ((new Date() - doc.timerDate)/1000) > 86400){
				User.findOneAndUpdate({username : username}, {$set:{timerDate: new Date(), timer : 2880}},{new: true}, function(err, userUpdated){
					if(err)res.send(err);
					else{
						res.json({success:true, JWToken : token, timerTotal: userUpdated.timer});
						
					}
				});
			}else{
				res.json({success:true, JWToken : token, timerTotal :doc.timer});
			}
			
		}
	})
	
}

exports.getTime = function(req, res) {
	var token = req.headers['x-access-token'];
	console.log(jwt.decode(token));
   	jwt.verify(token, config.secret, function(err, decoded){
    		if(err){
    			if(err.message == "jwt expired"){
    				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
	    				if(err) res.json({success: false, tokenStatut : "expired"});
	    				else _getTime(newToken, jwt.decode(token).username, res);
    				});

    			}else{
    				res.status(401).send(err);
    			}
    			
    			
    		} else {
    			_getTime(token, jwt.decode(token).username, res);
    		}

    });    
};

function _profil (token, username, res){
	var decodedToken = jwt.decode(token);
	var projection = {};

	if(decodedToken.username == username){
		projection = {_id:0, username:1,nbFollowing : 1, nbFollower :1, profilPicUri : 1};
	}else{
		projection = {_id:0, username:1,profilPicUri : 1,nbFollower :1, profilPicUri : 1, nbFollowing : 1, followers : 1}
	}
	
	User.findOne({username:username},projection).lean().exec(function(err, doc){
		if(err)res.json(err);
		else{
			if(doc != null){
				var projection = { creator : 1, rawData : 1, photoData : 1, nbComment : 1, timer : 1,adder : 1 };
				var dateNow = Math.round(new Date().getTime()/1000);
				if(doc.username == decodedToken.username){

					Post.find({creator : doc.username, timer : {$gt :dateNow }},projection,
								{sort:{dateCreation:-1}}, 
					function(err, lePost) {
						res.json({success:true,JWToken : token, userData : doc,  userPost : lePost, dateNow : dateNow});
					})
				}else{
					if(doc.followers.indexOf(decodedToken.username)> -1){
					
					Post.find({creator : doc.username, timer : {$gt :dateNow }}, projection,
								{sort:{dateCreation:-1}}).lean().exec( 
					function(err, lePost) {

						var allPost_count = lePost.length;

						if(allPost_count > 0){
							for (var i = 0; i < allPost_count; i++) {
								lePost[i].IamAdder = false;

								for(var j = 0; j < lePost[i].adder.length; j++){
									if(decodedToken.username == lePost[i].adder[j]){
										lePost[i].IamAdder = true;
									}
								}
								delete lePost[i].adder;
							};
						}

						delete doc['followers'];
						res.json({success:true,JWToken : token, userData : doc, userPost : lePost, dateNow : dateNow});
					})
					}else{
						delete doc['followers'];
						res.json({success:true,JWToken : token, userData : doc, dateNow : dateNow});
					}
					
				}
				



			}
			
			
		}
	});	
}

exports.profil = function(req, res) {
    var token = req.headers['x-access-token'];
    jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){
    			tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
    				if(err) res.json({success: false, tokenStatut : "expired"});
    				else _profil(newToken, req.params.username, res);
    			});
			} else {
				res.status(401).send(err);
			}

			
		} else {
			_profil(token, req.params.username, res);
		}
	});
    
};

function _getDrawer(token, decodedToken, res){
	projection = {_id:0, timer : 1 ,username:1, timerDate : 1, nbFollower : 1, nbFollowing : 1, nbNotification:1, profilPicUri : 1};
	User.findOne({username:decodedToken.username}, projection, function(err, doc){
		if(err)res.json({success : false, why : "error db"})
		else{
			console.log(decodedToken.username);
			if( ((new Date() - doc.timerDate)/1000) > 86400){
				User.findOneAndUpdate({username : decodedToken.username}, {$set:{timerDate: new Date(), timer : 2880}},{new: true}, function(err, userUpdated){
					if(err)res.send(err);
					else{
						doc.timer = userUpdated.timer;

						res.json({success:true, JWToken : token, doc : doc});
						
					}
				});
			}else{
				console.log(doc);
				res.json({success:true, JWToken : token, doc : doc});
			}
		}
	});
}

exports.getDrawer = function(req, res) {
	var token = req.headers['x-access-token'];
	console.log(token);
    jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){
    			tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
    				if(err) res.json({success: false, tokenStatut : "expired"});
    				else _getDrawer(newToken, jwt.decode(token), res);
    			});
			} else {
				res.status(401).send(err);
			}

			
		} else {
			_getDrawer(token, jwt.decode(token), res);
		}
	});
};



exports.create = function(req, res, next) {
	//Analyse sign in form 
	Uchecker.validFormInscription(req.body, function(err, userInput) {
		
	if(err) 
		next(err); 
	else {
		// Error input in the form
		if(typeof userInput.success != "undefined"){
			res.json(userInput);
		console.log("1");
		// Form was ok
		}else{
			//Look if user or mail is not already used 
			console.log("2");
			User.find({ $or : [ 
				{mail:userInput.mail}, {username:userInput.username}]},
				{_id : 0, mail : 1, username : 1}, 
				function(err, doc){

					//User and mail dont exist
					if(doc.length == 0){
						console.log("3");
						var user = new User(userInput); 
						user.save(function(err) {
							if(err){ res.json(err); }
							else { 
								//Object send mail and hash token
								var  signin = new _SigninMail(user.mail, user.password_date);
								console.log("4");
								signin.generateToken()
								console.log("4.1");
								
								if(process.env.NODE_ENV === "development"){
									res.json({success:true, link:'http://tiro-app.com/user/confirm_mail/'+signin.mail+'/'+signin.token});
									console.log("5");
							
								}else{
									res.json({success:true});
									signin.sendMailConfirm();
									console.log("6");
									
								}
							}
						});
					} 
					//User or mail exist already
					else {
						console.log("7");
						if(userInput.mail == doc[0].mail){
							console.log("8");
							res.json({success:false, why : "mail used", attach : userInput.mail});
						}
						else{
							console.log("9");
							res.json({success:false, why : "username used", attach : userInput.username});
						}
						
					}
				}
			).limit(1); //find limit one, faster than fastone
		}
	}
	});	
};

exports.login = function(req, res, next){
	Uchecker.validInputMail(req.body.mail, function(mail, result){
		//input mail well formed
		
		if(result.success){
			Uchecker.validInputPassword(req.body.password, function(password, result){
					//password mail well formed
					if(result.success){
						User.find({mail:mail},{username:1, password:1, password_date : 1}, function(err,doc){
							if(err)return next (err);
							else
							{

								//Mail existin database
								if(doc.length != 0){
									Uchecker.validFormConnection(password, doc[0], function(result){

											//passwords matches
											if(result.success){
												var token = jwt.sign({username : doc[0].username}, config.secret, {
													expiresInMinutes:config.tokenPolicies.tokenLifeTime
												});
												result.JWToken= token;
												result.Username = doc[0].username;
												res.json(result);
											}else{
												res.json(result)
											}
										});
								}else{
									res.json({success:false, input : mail, why:"unknown"})
								}

							}
						}).limit(1);
					} 
					else res.json(result);
			});
		}
		else res.json(result);
	});
};

exports.userById = function(req, res, next, id) {
	User.findOne({
		_id:id
	},function(err, user) {
		if(err)
			{ return next (err); }
		else
			{
				req.user = user;
				next();
			}
	});
};
/*
exports.update = function(req, res, next) {
	User.findByIdAndUpdate(req.user.id, req.body,{ new : true},function(err, user) {
        
        if (err) { return next(err); }
        
        else { res.json(user); }

    });
};*/
/*
exports.list = function(req, res, next) {
	User.find({},{_id:false,username:true},function(err,users) {
		if(err)
			{ return next(err); }
		else
			{ res.json(users); }
	});
};*/

exports.validateMail = function(req,res,next){
	User.findOne(
		{$and : [
			{mail:req.params.mail},
			{validateMail :{$ne : true}}
		]},{_id:false, password_date:true},

		function(err,doc){
			if(err) return next(err);
			else{
				if(doc){
					var signin = new _SigninMail(req.params.mail, doc.password_date);
					signin.generateToken();

					if(signin.token === req.params.token){
						User.update({mail:req.params.mail},{$unset:{validateMail:true}},
							function(err,doc){
								if(err) return next(err);
								else
									res.json({success:"Email validate"});

							});
					}else{
						res.json({error:"token not valid"})
					}
				}
				else
				res.json({error:"Mail already validate"})

			}
		}

		)
}

exports.searchPublic = function(req, res) {
	var token = req.headers['x-access-token'];
	
		User.find({username: new RegExp('^'+req.params.username+'.*',"i")},{_id:0, username:1, nbFollower : 1, profilPicUri : 1}, function(err, users){
			if(err)res.status(500);
			else{
				if(users.length > 0 ){
					// methode used with a token
					if(typeof token !== "undefined"){

							jwt.verify(token, config.secret, function(err, decoded){
								if(err){
									if(err.message == "jwt expired"){
										tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
						    				if(err){res.json({success: false, name : "expired"})} 
						    				else{ _listIamFollowing(newToken, users, jwt.decode(token), res);} 
						    			});
									} else {
										res.status(401).send(err);
									}
								
								} else {
									_listIamFollowing(token, users, jwt.decode(token), res);} 
							});						
					// no token provided
					}else{
						res.json({success:true, users : users});
					}

				}else{

					res.json({success:false, why:"No user Found"});
				}
			}
		}).limit(50);
	
	
}

function _listIamFollowing(token, users, decodedToken, res){
	
		User.findOne({username:decodedToken.username},{_id:0, followings : 1, tmp_followings : 1}, function(err, doc) {
			if(err)res.json(err);
			else{ 
				var list = doc.followings.concat(doc.tmp_followings);
				if(users){ // case : recherhe nouveau contact nettoie resultat ne pas apparaitre ni les contacts qu'on suit deja
					
					for (var i = 0 ; i < list.length; i++) {
						for (var j = 0; j < users.length; j++) {
							if(list[i] == users[j].username || users[j].username == decodedToken.username){
								users.splice(j,1);
							}

						};
					};

					res.json({success:true, users : users, JWToken : token});
				} else {
					User.find({username: {$in : list}},{_id:0, username:1, nbFollower : 1, profilPicUri : 1}, function(err, docs) {
						if(err)res.json(err);
						else res.json({success:true, listFollow : docs, JWToken : token});

					});
					
					
				}
			}
		});
	
			
}

exports.listIamFollowing = function(req, res) {
	var token = req.headers['x-access-token'];

	jwt.verify(token, config.secret, function (err, decoded) {
		if (err) {
			if (err.message == "jwt expired") {
				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function (err, newToken) {
					if (err) {
						res.json({success: false, name: "JsonWebTokenError"});
					}
					else {
						_listIamFollowing(newToken, null, jwt.decode(token), res);
					}
				});
			} else {
				res.status(401).send({success : false, why : "token error"});
			}

		} else {
			_listIamFollowing(token, null, jwt.decode(token), res);
		}
	});
}

function _listMyFollower (token, decodedToken, res) {
	User.findOne({username:decodedToken.username},{_id:0,  followers:1, tmp_followers : 1},function(err,doc) {
		if(err)res.json(err);
		else{
			var list = doc.followers.concat(doc.tmp_followers);
			console.log(list);
			User.find({username : {$in : list}},{_id:0, username:1, nbFollower : 1, profilPicUri : 1}, function(err,docs) {
				
				res.json({success:true,listFollow : docs, JWToken : token});
			});
			
		}
	});
}

exports.listMyFollower = function(req, res) {
	var token = req.headers['x-access-token'];

	jwt.verify(token, config.secret, function (err, decoded) {
		if (err) {
			if (err.message == "jwt expired") {
				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function (err, newToken) {
					if (err) {
						res.json({success: false, name: "JsonWebTokenError"});
					}
					else {
						_listMyFollower(newToken, jwt.decode(token), res);
					}
				});
			} else {
				res.status(401).send({success : false, why : "token error"});
			}

		} else {
			_listMyFollower(token, jwt.decode(token), res);
		}
	});
};

function _getAvatarUri(username, cb){
	User.findOne({username:username}, {_id:0, profilPicUri : 1}, function(err, doc){
		cb(doc.profilPicUri);
	});
}

exports.getAvatarUri = function(req, res){
	_getAvatarUri(req.params.username, function(uri) {
		res.json({success:true, profilPicUri : uri });
	})
}


exports.getAvatar = function(req, res){
	var path = require('path');
	if(req.params.profilPicUri != 'uri'){
		
		 try {
          res.sendFile(path.join(__dirname, '../public/images/profil/',req.params.profilPicUri));
        } catch (e) {
        	console.log("here 404");
          res.status(404).send("no avatar");
        }
        
		
	}
	else{
		res.status(401).json({success:false, why : "missing parameter"});
	}
}



exports.uploadProfilPic = function(req, res){
	var token = req.headers['x-access-token'];
	var orientationPic = req.headers["orientationpic"];
	var ImageChecker = require('../../app/controllers/image.uploadChecker.js');

	jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){				
				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
					if(err) res.json({success: false, tokenStatut : "expired"});
					else ImageChecker.uploadProfilPic(jwt.decode(token),orientationPic ,User,req, res);
				});

			}else{
				res.status(401).send(err);
			}


		} else {

			ImageChecker.uploadProfilPic(jwt.decode(token),orientationPic,User,req, res);
		}
	});

}




