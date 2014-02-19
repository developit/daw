var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	uuid = require('node-uuid'),
	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10,
	MAX_LOGIN_ATTEMPTS = 10,
	LOCK_TIME = 2 * 60 * 60 * 1000,		// 2 hours
	SESSION_LIFETIME = 60 * 1000;


var UserSchema = new Schema({

	//_id : Schema.Types.ObjectId,

	firstname : String,
	
	lastname : String,
	
	email : {
		type : String,
		required : true,
		lowercase : true,
		trim : true,
		index : { unique : true }
	},
	
	password : {
		type : String,
		required : true
	},
	
	created : {
		type : Date,
		default : Date.now
	},
	
	modified : {
		type : Date,
		default : Date.now
	},

	sessions : [
		{
			token : {
				type : String,
				required : true,
				index : { unique : true }
			},
			created : {
				type : Date,
				default : Date.now
			},
			lastSeen : {
				type : Date,
				default : Date.now
			}
		}
	],

	loginAttempts : {
		type : Number,
		required : true,
		default : 0
	},

	lockUntil : {
		type : Date
	}

});



// hide _id and password when serialized
function transformForPublicUse(doc, ret, options) {
	var publics = {},
		props = UserSchema.statics.publicProperties;
	for (var i=props.length; i--; ) {
		publics[props[i]] = ret[props[i]];
	}
	return publics;
	//'__v _id password sessions loginAttempts lockUntil created modified'.split(' ').forEach(function(prop) {
	//	delete ret[prop];
	//});
}

UserSchema.options.toObject = UserSchema.options.toObject || {};
UserSchema.options.toObject.transform = transformForPublicUse;

UserSchema.options.toJSON = UserSchema.options.toJSON || {};
UserSchema.options.toJSON.transform = transformForPublicUse;




UserSchema.static({

	publicProperties : [
		'firstname',
		'lastname',
		'email'
	],

	/**	User was not found */
	NOT_FOUND: 0,

	/**	Username and password didn't match */
	PASSWORD_INCORRECT: 1,

	/**	User has reached their maximum failed login attempts */
	MAX_ATTEMPTS: 2,


	/**	Find a user with the given session token */
	findBySessionToken : function(token, callback) {
		this.findOneAndUpdate({
			'sessions.token' : token,
			'sessions.lastSeen' : {
				$gte : Date.now() - SESSION_LIFETIME
			}
		}, {
			$set : {
				'sessions.$.lastSeen' : Date.now()
			}
		}, callback);
	},


	/**	Authenticate a user by email & password
	 *	@name User.authenticate
	 *	@param {String} email			The email of a user to authenticate as
	 *	@param {String} password		A plaintext password to compare against the user's stored password hash
	 *	@param {Function} callback		Gets passed `([err=null], user, [reasonCode])`
	 */
	authenticate : function(email, password, callback) {
		var reasons = UserSchema.statics;

		this.findOne({
				email : email
			})
			.exec(function(err, user) {
				if (err) return callback(err);

				// make sure the user exists
				if (!user) {
					return callback(null, null, reasons.NOT_FOUND);
				}

				// If the account is locked, just increment attempts:
				if (user.isLocked()) {
					return user.incLoginAttempts(function(err) {
						callback(err, null, err ? null : reasons.MAX_ATTEMPTS);
					});
				}

				user.validPassword(password, function(err, isMatch) {
					if (err) return callback(err);

					// If password is incorrect, increment login attempts:
					if (!isMatch) {
						return user.addLoginAttempt(function(err) {
							callback(err, null, err ? null : reasons.PASSWORD_INCORRECT);
						});
					}

					// if there's no lock or failed attempts, just return the user
					if (!user.loginAttempts && !user.lockUntil) {
						return callback(null, user);
					}

					// reset attempts and lock info
					user.update({
						$set : {
							loginAttempts : 0
						},
						$unset : {
							lockUntil : 1
						}
					}, function(err) {
						callback(err, err ? null : user);
					});
				});
			}
		);
	}

});


UserSchema.method({

	/**	Create a new session. */
	createSession : function(callback) {
		var session = {
			token : uuid.v4()
		};
		this.sessions.push(session);
		this.save(function(err, user) {
			callback(err, session);
		});
	},

	/**	Destroys a session. */
	destroySession : function(token, callback) {
		this.sessions.pull({
			token : token
		});
		this.save(callback);
	},

	/**	Validate a plaintext password against the user's stored password hash.
	 *	@name User#validPassword
	 */
	validPassword : function(password, callback) {
		bcrypt.compare(password, this.password, callback);		// (err, isMatch)
	},

	/**	Check if the user's account is locked from too many failed login attempts.
	 *	@name User#validPassword
	 */
	isLocked : function() {
		return !!(this.lockUntil && this.lockUntil > Date.now());
	},

	/**	Register a failed login attempt. */
	addLoginAttempt : function(callback) {
		var updates = {};

		// if we have a previous lock that has expired, restart at 1
		if (this.lockUntil && this.lockUntil < Date.now()) {
			updates.$set = { loginAttempts : 1 };
			updates.$unset = { lockUntil : 1 };
		}
		else {
			updates.$inc = { loginAttempts : 1 };
			
			// lock the account if we've reached max attempts and it's not locked already
			if ( this.loginAttempts+1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked() ) {
				updates.$set = {
					lockUntil : Date.now() + LOCK_TIME
				};
			}
		}
		
		this.update(updates, callback);
	}

});


/**	Hash password on save. */
UserSchema.pre('save', function(next) {
	var user = this;

	// only if the password is modified:
	if (!user.isModified('password')) return next();

	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) return next(err);

		// hash the password along with our new salt:
		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) return next(err);

			user.password = hash;
			next();
		});
	});
});


exports.UserSchema = UserSchema;
exports.User = mongoose.model('User', UserSchema);
