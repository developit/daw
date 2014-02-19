
var files = require('fs').readdirSync(__dirname+'/models');
files.forEach(function(file) {
	if (file.match(/\.js/g)) {
		require(__dirname+'/models/'+file);
	}
});
