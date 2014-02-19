var passport = require('passport'),
	BearerStrategy = require('passport-http-bearer').Strategy,
	mongoose = require('mongoose'),
	User = mongoose.model('User');

//passport.use(new BearerStrategy({}, User.findBySessionToken);

passport.use(new BearerStrategy({ session:false }, function(token, done) {

	User.findBySessionToken(token, function(err, user) {
		done(err || null, user || false);
	});

}));