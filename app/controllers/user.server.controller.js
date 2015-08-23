var User 		= require('mongoose').model('User');
var Uchecker 	= require('../../app/controllers/user.server.createChecker');
var _SigninMail = require('../../app/controllers/user.server.SendMail.signin');


var tokenRefresher = require('../../app/controllers/user.server.tokenRefresher')
var jwt    		= require('jsonwebtoken');
var config = require('../../config/config.js');

function _getTime(token, username, res){
	User.findOne({username:username},{_id:0, timer : 1, timerDate : 1}, function(err, doc){
		if(err){ res.json({success:false, error : err})}
		else{
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

	var projection = {};

	if(jwt.decode(token).username == username){
		projection = {_id:0, username:1,nbFollowing : 1, nbFollower :1, profilPicUri : 1};
	}else{
		projection = {_id:0, username:1,profilPicUri : 1}
	}
	
	User.findOne({username:username},projection,function(err, doc){
		if(err)res.json(err);
		else{
			res.json({success:true,JWToken : token, userData : doc});
			
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
	
		User.find({username:decodedToken.username},{_id:0, followings : 1}, function(err, listIamFollowing) {
			if(err)res.json(err);
			else{ 

				if(users){ // case : recherhe nouveau contact nettoie resultat ne pas apparaitre ni les contacts qu'on suit deja
					console.log(users);
					for (var i = 0 ; i < listIamFollowing[0].followings.length; i++) {
						for (var j = 0; j < users.length; j++) {
							if(listIamFollowing[0].followings[i] == users[j].username || users[j].username == decodedToken.username){
								users.splice(j,1);
							}

						};
					};

					res.json({success:true, users : users, JWToken : token});
				} else {
					User.find({username: {$in : listIamFollowing[0].followings}},{_id:0, username:1, nbFollower : 1, profilPicUri : 1}, function(err, docs) {
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
	User.findOne({username:decodedToken.username},{_id:0,  followers:1},function(err,doc) {
		if(err)res.json(err);
		else{
			User.find({username : {$in : doc.followers}},{_id:0, username:1, nbFollower : 1, profilPicUri : 1}, function(err,docs) {
				
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

exports.getImage = function(req, res){
    var path = require('path');
	imageID = "ic_19405_10207287425046354_445544690276139381_n.png";
    res.sendFile(path.join(__dirname, '../public/images',imageID)).maxage(3600000);
}

exports.getAvatar = function(req, res){
	var path = require('path');
	if(req.params.profilPicUri != 'uri'){
		res.sendFile(path.join(__dirname, '../public/images/profil/',req.params.profilPicUri));
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




