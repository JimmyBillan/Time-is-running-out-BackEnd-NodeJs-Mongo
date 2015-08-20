var User 		= require('mongoose').model('User');

function getFlagToken(token, cb){
	User.find({username:token.username},{_id:0, flagToken : 1},function(err, doc){
				if(doc.length> 0){
					if(doc[0].flagToken) cb(null, false);
					else cb(null, true);
				}else{
					cb(true, null);
				}
				
	}).limit(1);

}


exports.checkEXP = function(tokenDecoded, jwt, config, cb) {
	var now = Math.floor(Date.now() / 1000);
	if(tokenDecoded.exp){
		if(now - tokenDecoded.exp <= config.tokenPolicies.tokenCanBeRefresh){
				// Less than 10 min we can try to refresh the token
				// Check if flagToken is a true ( true mean password have been changed, security issue)
				// if flagToken is true, dont allowed to refresh token
				getFlagToken(tokenDecoded, function(err, canRefresh){
					if(canRefresh){
						var token = jwt.sign({username : tokenDecoded.username}, config.secret, {
							expiresInMinutes:1
						});
						cb(null, token);
					}
					else{
						cb(true, null);
					}
				});
				
		}else cb(true, null); //token is too old
	}else{
		// error in token
		cb(true, null); 
	}
};