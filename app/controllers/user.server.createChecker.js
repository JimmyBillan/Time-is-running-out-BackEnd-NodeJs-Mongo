var config = require('../../config/config.js');


function validateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

function validatePassword(password){
	if(password.length< 8 || password.length > 99) return false;
	else return true;
	
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function hash_salt_dyn(password, dyn) {
	var crypto = require('crypto'),
	    shasum = crypto.createHash('sha512');

	shasum.update(dyn+""+password+""+dyn+""+config.hashPassword);
	return shasum.digest('hex');
}

exports.validInputMail = function(mail, cb){
	mail = mail.toLowerCase();
	if(!validateEmail(mail)) cb(mail, {success :false, input : "mail",  why : "Invalid"});
	else cb(mail, {success : true});
}

exports.validInputPassword = function(password, cb){
	if(!validatePassword(password)) cb(password, {success : false, input : "password", why :"length"});
	else cb(password, {success:true});
}

exports.validFormConnection = function(inputPassword, dbLog, cb){
		if(dbLog.password === hash_salt_dyn(inputPassword, dbLog.password_date)){
				cb({success:true});
		}else{
				cb({success:false, input:"password", why :"incorrect"});
		}
}

exports.validFormInscription = function(user, cb) {
	var key;
	var needed = ["mail", "username","gender", "password", "age"];
	var errors = {
		success : true,
		missingInputValue : [],
	};

	/* No empty input *************************/
	for ( key in user){
		if(!user[key]){
			console.log(key);
			errors.missingInputValue.push(key);
			errors.success = false; 
			var pos = needed.indexOf(key);
			needed.splice(pos, 1);
		}else{
			var pos = needed.indexOf(key);
			needed.splice(pos, 1);
		}
		
	}

	if(needed.length > 0){
		console.log(needed);
			errors.missingInputValue.push(needed[0]);
			errors.success = false; 
			return cb(null,errors);
	}

	if(user.username.length < 4 || user.username.length >254){
		errors.username = {succes : false, why :"Username length"};
		errors.success = false;
	}

	/* Regex mail *************************/
	user.mail = user.mail.toLowerCase();
	if(!validateEmail(user.mail)){
		errors.regexMail = false;
		errors.success = false; 
	}


	if(!validatePassword(user.password)){
		errors.passwordLength = false;
		errors.success = false; 
	}
	

	if(user.gender != "Female"){
		user.gender = "Male";
	}

	user.age = parseInt(user.age);
	if(!isNaN(user.age)){
		if(user.age < 13){
			errors.birth_yearValid = {success : false, why : "Minimum age : 13"};
			errors.success = false; 
		}else if ( user.age > 99){
			errors.birth_yearValid = {success : false, why : "TOO OLD"};
			errors.success = false; 
		}
	}else{
		errors.ageValid = {success:false, why : "invalide input"};
		errors.success = false; 
	}
	
    
	if(errors.success === true) {
		user.password_date = Date.now() +""+process.hrtime()[1];
		user.password = hash_salt_dyn(user.password, user.password_date);
		return cb(null,user);
	} 
	else return cb(null,errors);
	
	
}