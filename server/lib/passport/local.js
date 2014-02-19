var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	mongoose = require('mongoose');

passport.use(new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password'
}, function(email, password, done) {

	mongoose.model('User').authenticate(email, password, function(err, user, reasonCode) {
		//mongoose.model('User').find({}).exec(function(err, list) {
		//	console.log(list);
		//});

		done(err, user, user ? null : { message:'Not a recognized account ('+reasonCode+').' });
	});

}));