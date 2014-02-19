/**
 *	app.model.users.index(console.log.bind(console));
 */
define([
	'puredom',
	'./rest',
	'./auth'
], function($, rest, auth) {
	var exports = new rest.Resource('/api/users');

	auth.on('tokenchange', function(token) {
		exports.param('access_token', token);
	});

	return exports;
});

/*
// server validation fail:
puredom.net.post('/api/users', {}, function(r, data) {
	console.log('Example validation error: ', puredom.json(data));
});

// create a new user:
puredom.net.post('/api/users', {
	email:'jason@developit.ca',
	password : 'testpassword'
}, function(r, data) {
	console.log('New user: ', puredom.json(data));
	
	// List users:
	puredom.net.get('/api/users', function(r, data) {
		data = puredom.json.parse(data).data;
		
		// Delete a user:
		puredom.net.request({
			type : 'DELETE',
			url : '/api/users/' + data[0].id,
			callback : console.log.bind(console)
		});
	});
});
*/