var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var UserSchema = new Schema({
			mail : {
					type : String, 
					lowercase : true, 
					trim:true, 
					unique: true
				},
			username : {
					type : String, 
					trim:true, 
					unique: true,
					required: true 
				},
			gender : {
					type : String, 
					lowercase : true, 
					trim:true
				},
			password : {
					type : String, 
					trim:true,
					required: true 
				},
			password_date : {
					type : String,
					required: true 
				},
			age : {
					type : Number, 
					min:13,
					required: true  
				},
			validateMail : {
				type : Boolean,
				default: false
			},
			flagToken: {
				type : Boolean,
				default : false
			},
			timer : {
				type : Number,
				default : 2880,
				min : 0,
				required : true
			},
			timerDate : { 
				type: Date, 
				default: Date.now,
				required : true },
			followers : {
				type : [String]
			},
			followings: {
				type : [String]
			},
			nbfollower : {
				type : Number,
				min : 0,
			},
			nbFollowing : {
				type : Number,
				min : 0,
			},
			nbNotification : {
				type : Number,
				min : 0
			},
			profilPicUri :  {
				type : String
			}
		});



mongoose.model('User', UserSchema);
