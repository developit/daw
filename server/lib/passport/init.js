var passport = require('passport'),
	bearer = require('./bearer'),
	local = require('./local'),
	mongoose = require('mongoose'),
	User = mongoose.model('User');

app.use(passport.initialize());

app.use('/api', passport.authenticate('bearer', {
	session : false
}));


passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, done);		// done(err, user)
});


/*
app.post('/auth/register',
	function(req, res) {
		return res.json(req.body);

		res.json({
			message : 'Logged in as ' + req.user.email
		});
	}
);

app.post('/auth/login',
	passport.authenticate('local', {
		session : false
	}),
	function(req, res) {
		return res.json(req.body);

		res.json({
			message : 'Logged in as ' + req.user.email
		});
	}
);
*/