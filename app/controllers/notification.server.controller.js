var mongoose 		= require('mongoose');
var User 			= require('mongoose').model('User');
var Notification	= require('mongoose').model('Notification');
var tokenRefresher 	= require('../../app/controllers/user.server.tokenRefresher')
var jwt    			= require('jsonwebtoken');
var config 			= require('../../config/config.js');

var type = {new_follower:"follower"}


function _list(token,decodedToken, res){
	Notification.find({target:decodedToken.username},{}).lean().exec(function(err, allNotification){
			if(err)res.send(err);
			else{

				var list = [];
				for(var i = 0; i < allNotification.length; i++){
					list.push(allNotification[i].feeder);
				}
				User.find({username : {$in : list}},{_id:0, profilPicUri : 1}).lean().exec(function(err,doc) {
					if(doc !=null){
						for (var i = 0; i <doc.length; i++) {
							if(doc[i]!= null){
								allNotification[i].avatarUri = doc[i].profilPicUri;
							}else{
								allNotification[i].avatarUri = null;
							}
							console.log(allNotification[i] );				
						}	

					}
					res.json({success:true, JWToken : token, notifications:allNotification});
				});
	

				
				
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
				{username:req.params.username, followers : {$ne : decodedToken.username}, tmp_followers : {$ne : decodedToken.username}},
				{$inc : {nbNotification : 1}, $push : {tmp_followers : decodedToken.username}},
				{new : true},
				function(err, user) {
					if(err)(res.json(err));
					else{
						
						if(user){
						var theNotification = Notification({
							feeder : decodedToken.username,
							target : req.params.username,
							type : type.new_follower});

						theNotification.save(function(err){
								if(err)res.json(err);
								else{
									User.findOneAndUpdate(
										{username:decodedToken.username, followings : {$ne : req.params.username }, tmp_followings : {$ne : req.params.username }}, {$push : {tmp_followings : req.params.username}},
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

function _responseAddContact(token, req, decodedToken, res){
	if(req.params.username.length>3){
		User.findOneAndUpdate({username:req.params.username},{$pull: {tmp_followers:decodedToken.username}},{new : true},
			function(err,doc) {
				if(err){res.json(err)}
				else{
					res.json(doc);
				}
		});
	}
}


exports.responseAddContact = function(req, res){
	var token = req.headers['x-access-token'];

	jwt.verify(token, config.secret, function(err, decoded){
		if(err){
			if(err.message == "jwt expired"){
				
				tokenRefresher.checkEXP(jwt.decode(token), jwt, config, function(err, newToken) {
    				if(err){res.json({success: false, tokenStatut : "expired"});} 
    				else{_responseAddContact(newToken, req, jwt.decode(token), res);} 
    			});
			} else {
				res.status(401).send(err);
			}
		
		} else {_responseAddContact(token, req, jwt.decode(token), res);} 
	});

}



