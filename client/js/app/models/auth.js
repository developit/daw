/**
 *	app.model.auth.login(console.log.bind(console));
 */
define([
	'puredom',
	'./rest'
], function($, rest) {
	var exports = new $.EventEmitter(),
		api = new rest.Resource('/auth');

	/*
	api.on('res', function(req, res) {
		console.log('res', req.url);
	});
	
	api.on('status', function(req, res) {
		console.log('res', req.url);
	});
	*/

	api.on('res:/login', function(req, res) {
		var data = res.json,
			token = data && data.access_token;
		if (token) {
			console.log('Saw access_token, firing auth->authenticated and auth->tokenChange');
			api.param('access_token', token);
			exports.token = token;
			exports.fireEvent('authenticated');
			exports.fireEvent('tokenchange', token);
		}
	});

	api.on('status:401', function(req, res) {
		if (exports.token) {
			console.log('Saw status 401, firing auth->fail');
			exports.token = null;
			exports.fireEvent('fail');
		}
	});

	/**	Log the user in
	 *	@param {Object} params				Login parameters
	 *	@param {String} params.email		The user's email address
	 *	@param {String} params.password		The user's password
	 *	@param {Function} callback			A function to call once completed
	 */
	exports.login = function(params, callback) {
		return api._call('POST /login', params, callback || params.callback);
	};


	/**	Register the user
	 *	@param {Object} params				Registration profile
	 *	@param {String} params.email		The new user's email address
	 *	@param {String} params.password		The new user's password
	 *	@param {Function} callback			A function to call once completed
	 */
	exports.register = function(params, callback) {
		return api._call('POST /register', params, callback || params.callback);
	};


	//exports.login = api._call.bind(api, '/login');

	return exports;
});