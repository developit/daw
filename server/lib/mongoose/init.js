var mongoose = require('mongoose');

mongoose.connect(app.get('mongoUri'), {
	db : {
		//native_parser: true
	},
	
	server : {
		socketOptions : {
			keepAlive : 1
		}
		//poolSize: 5
	}
});
