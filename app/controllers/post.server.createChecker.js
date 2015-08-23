var xssEscape 	= require('xss-escape');
var User 		= require('mongoose').model('User');


function checkRawData(rawData, cb){
	if(rawData){
		if(rawData.length < 1000){
			rawData = xssEscape(rawData);
			cb(null, rawData);
		}else{
			cb(true, {success : false, why :"RawData too long"});
		}
	}else{
		cb(true, {success : false, why :"RawData missing"});
	}
}


function checkRawDataPhotoMode(rawData, cb){
	if(rawData){
		console.log("ya rawData");
		if(rawData.length < 1000){
			rawData = xssEscape(decodeURI(rawData.replace(/\+/g, ' ')));

			console.log(rawData);
			cb(null, rawData);
		}else{
			cb(true, {success : false, why :"RawData too long"});
		}
	}else{
		console.log("pas rawData");
		cb(null, xssEscape(rawData));
	}
}

exports.validCommentCreate = function(commentRawData, cb){
	checkRawData(commentRawData, function(err, rawData){
		if(err){cb(true, rawData)}
			else{
				cb(null,rawData);
			}
	})
}

function checkTimer(timer, username, cb){
	timer = parseInt(timer);

	if(!isNaN(timer)){
		//timer is a number
		if(timer < 44640 && timer > 0){
			//timer is not < 0 and is < 1 month
			User.findOneAndUpdate({username : username, timer : {$gt : timer-1}},{$inc : {timer : -timer}},{new: true}, function(err, doc) {
				if(err)cb(true, err);
				else{
					//User timer value is changed
					if(doc){
						cb(null, doc.timer);
					}else{
						cb(true, {success : false, why :"No time enough"});
					}
					
				}
			});
			
		}else{
			cb(true,{success : false, why :"timer invalid"});
		}
	}else{
		cb(true, {success : false, why :"timer not number"});
	}
}

exports.validFormModify = function(rawData,cb){
	checkRawData(rawData, function(err, rawData){
		if(err){cb(true, rawData);}
		else{cb(null, rawData);}
			
	});
}

exports.validFormCommentCreate = function(rawData, cb) {
	checkRawData(rawData, function(err, rawData){
		if(err){cb(true, rawData);}
		else{cb(null, rawData);}
			
	});
}

exports.validFormCreate = function(post,decodedToken, cb) {
	
	checkRawData(post.rawData, function(err, rawData){
		if(err){
			cb(true, rawData);
		}else{
			checkTimer(post.timer, decodedToken.username, function(err, timer) {
				if(err){
					cb(true, timer);
				}else{
					cb(null, {rawData : rawData, timerTotal :timer, timerPostinSecond : post.timer*60});
				}
			});
		}
	});

};

exports.validFormCreatePhotoMode = function(post,decodedToken, cb) {
	
	checkRawDataPhotoMode(post.rawData, function(err, rawData){
		if(err){
			cb(true, rawData);
		}else{
			checkTimer(post.timer, decodedToken.username, function(err, timer) {
				if(err){
					cb(true, timer);
				}else{
					cb(null, {rawData : rawData, timerTotal :timer, timerPostinSecond : post.timer*60});
				}
			});
		}
	});

};