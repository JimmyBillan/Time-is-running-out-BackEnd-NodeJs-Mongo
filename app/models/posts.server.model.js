var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;


var Comments = new Schema({
	creator : {
		type : String,
		required : true
	},
	commentText : {
		type : String,
		required : true
	},
	dateCreation : {
		type : Date,
		default: Date.now,
	}
});

var PostShema = new Schema({
	creator : {
			type : String,
			required: true  
		},
	rawData : {
			type : String, 
			required: true 
		},
	timer : {
			type :  Number,
			required: true  
		},
	dateCreation: { 
			type: Number,
			required:true
		},
	adder : {
		type : [String]
	},
	comments : {
		type : [Comments]
	},
	nbComment : {
		type : Number
	}

});





mongoose.model('Post', PostShema);