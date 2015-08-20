var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;

var notificationShema = new Schema({
			feeder : {
					type : String, 
					required : true
				},
			target : {
					type : String,
					required : true
				},
			type : {
					type : String, 
					required: true 
				},
			dateCreation: { 
					type: Date,
					default: Date.now,
				}
		});

mongoose.model('Notification', notificationShema);