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
		type : Number,
		default: Date.now,
		required : true
	}
});

var PostShema = new Schema({
	creator : {
			type : String,
			required: true  
		},
	rawData : {
			type : String, 
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
	},
	photoData : {
		type : String
	}

});





mongoose.model('Post', PostShema);