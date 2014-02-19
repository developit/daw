var passport = require('passport'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	_ = require('lodash');


module.exports = exports = {

	// jump out of /api/ --> /auth/
	path : '../auth',

	'POST /login' : function(req, res) {
		//console.log('LOGIN: ', req.body);

		passport.authenticate('local', {
			session : false
		}, function(err, user, info) {
			if (err) return res.json(500, { error:err });

			//console.log('LOGIN RESULT: ', err, user, info);
			
			if (!user) {
				return res.json(401, info);
			}

			var session = user.createSession(function(err, session) {
				if (err) return res.json(500, { error:err });

				res.json({
					access_token : session.token,
					message : 'Logged in as ' + user.email
				});
			});
		})(req, res);
	},
	
	'POST /register' : function(req, res) {

		User.create(req.body, function(err, user) {
			if (err) {
				if (String(err.err).match(/\bduplicate key\b/g)) {
					var msg = 'Email already in use';
					err = {
						errors : { email:msg },
						message : msg
					};
				}
				res.json(401, {
					errors : err.errors && _.mapValues(err.errors, String) || {},
					error : err.message
				});
			}

			res.json(user.toObject());
		});
	},


	'POST /logout' : function(req, res) {
		passport.authenticate('bearer', {
			session : false
		}, function(err, user, info) {
			if (err) return res.json(500, { error:err });

			if (!user) {
				return res.json(401, info);
			}

			var token = req.body.access_token || req.query.access_token;
			user.destroySession(token, function(err, success) {
				if (err) return res.json(500, { error:err });

				res.json({
					message : 'You are now logged out'
				});
			});
		})(req, res);
	}
	
};