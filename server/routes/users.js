var api = require('../lib/api'),
	_ = require('lodash'),
	mongoose = require('mongoose'),
	User = mongoose.model('User');


module.exports = {

	// list
	'GET /' : function(req, res) {
		var start = Math.round(req.query.start) || 0,
			limit = Math.round(req.query.limit) || 10;
		limit = Math.max(1, Math.min(50, limit));

		User.find({})
			.skip(start)
			.limit(limit)
			.exec(function(err, results) {
				if (err) return res.json(500, { error : err });

				res.json(200, results);
			});
	},
	
	// get
	'GET /:id' : function(req, res) {
		db.collection('users').findOne({
			_id : new ObjectID(req.params.id)
		}, function(err, doc) {
			if (err) {
				return res.send(500, { error: err });
			}
			res.send(200, {
				data : doc
			});
		});
	},
	
	// create
	'POST /' : function(req, res) {
		var user = _.clone(req.body),
			valid;

		valid = validation.validate(user, {
			email : 'email',
			password : 'minLength:6'
		});

		if (valid!==true) {
			return res.send(500, valid);
		}

		user.created = user.modified = Math.floor(Date.now()/1000);

		db.collection('users').insert(user, function(err, doc) {
			if (err) {
				return res.send(500, { error : err });
			}
			doc.id = doc._id+'';
			delete doc._id;
			res.send(200, {
				data : doc
			});
		});
	},
	
	// update
	'PUT /:id' : api.echo,
	
	// delete
	'DELETE /:id' : function(req, res) {
		db.collection('users').remove({
			_id : new ObjectID(req.params.id)
		}, function(err, doc) {
			if (err) {
				return res.send(500, { error: err });
			}
			res.send(200, {
				data : doc
			});
		});
	}

};