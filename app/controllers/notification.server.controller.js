var mongoose 		= require('mongoose');
var User 			= require('mongoose').model('User');
var Notification	= require('mongoose').model('Notification');
var tokenRefresher 	= require('../../app/controllers/user.server.tokenRefresher')
var jwt    			= require('jsonwebtoken');
var config 			= require('../../config/config.js');


function _list(token,decodedToken, res){
	Notification.find({target:decodedToken.username},{}, function(err, allNotification){
			if(err)res.send(err);
			else{
				res.json({success:true, JWToken : token, notifications:allNotification});
				
			}
	});
}

exports.list = function(req, res) {
	var token = req.headers['x-access-token'];

	jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){
				
				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
    				if(err){res.json({success: false, tokenStatut : "expired"});} 
    				else{_list(newToken, jwt.decode(token), res);} 
    			});
			} else {
				res.status(401).send(err);
			}
		
		} else {_list(token, jwt.decode(token), res);} 
	});

};

function _addContact(token, req, decodedToken, res){
	if(req.params.username.length > 3){
		if(req.params.username !== decodedToken.username){ 
			

			User.findOneAndUpdate(
				{username:req.params.username, followers : {$ne : decodedToken.username}},
				{$inc : {nbNotification : 1, nbFollower : 1 }, $push : {followers : decodedToken.username}},
				{new : true},
				function(err, user) {
					if(err)(res.json(err));
					else{
						
						if(user){
						var theNotification = Notification({
							feeder : decodedToken.username,
							target : req.params.username,
							type : "follower"});

						theNotification.save(function(err){
								if(err)res.json(err);
								else{
									User.findOneAndUpdate(
										{username:decodedToken.username, followings : {$ne : req.params.username }}, 
										{$inc :{nbFollowing : 1}, $push : {followings : req.params.username}},
										function(err, myself) {
											res.json({success:true, JWToken: token});
									});
								}
						});
						}else{
							res.json({success:false, why :"already following"});
						}
						
					
					}

			});
		} else {
			res.json({success:false, why : "myself"});
		}
	}
		
	else{
		res.json({success:false, why : "invalide contact"});
	}
}


exports.addcontact = function(req, res){
	var token = req.headers['x-access-token'];

	jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){
				
				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
    				if(err){res.json({success: false, tokenStatut : "expired"});} 
    				else{_addContact(newToken, req, jwt.decode(token), res);} 
    			});
			} else {
				res.status(401).send(err);
			}
		
		} else {_addContact(token, req, jwt.decode(token), res);} 
	});

}