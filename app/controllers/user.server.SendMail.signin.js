var config = require('../../config/config.js');



function New_User(mail, date){
	this.mail = mail;
	this.date = date;
	this.token;
}
//callback : sendToken
New_User.prototype.generateToken = function() {
	var crypto = require('crypto');
	var shasum = crypto.createHash('sha512');
	
	shasum.update("4"+this.mail+"8"+this.date+"15"+this.mail+"16"+this.date+"23"+this.mail+"42"+this.date);

	this.token = shasum.digest('hex');
	
};

New_User.prototype.sendMailConfirm = function(){
	var Mailgun = require('mailgun-js');
	var mailgun = new Mailgun({apiKey : config.mailgun_api_key, domain : config.domain });
	var data = {
		from : config.from_who,
		to : this.mail,
		subject : 'Welcome to Tiro',
		html :'http://92.222.67.16/user/confirm_mail/'+this.mail+'/'+this.token+'',
	}
	mailgun.messages().send(data, function(err,body){
		if(err){
			console.log('error mail : '+err);
		}
	})

}


module.exports = New_User;