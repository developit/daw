define([
	'puredom',
	'./auth',
	'./users'
], function($, auth, users) {
	var exports = new $.EventEmitter(),
		priv = {
			initialized : false
		};

	exports.auth = auth;

	exports.users = users;

	exports.init = function(config, callback) {
		if (priv.initialized) {
			return callback(exports);
		}
		priv.initialized = true;

		priv.config = config;

		/** Local database */
		var storeName = priv.config.storageName || priv.config.appName;
		exports.db = new puredom.LocalStorage(storeName, function() {
			setTimeout(function() {
				var token = exports.db.get('token');
				if (token) {
					//exports.api.setAuthParameter('token', token);
				}
				setTimeout(function() {
					priv.loaded = true;
					exports.fireEvent('load,init', exports);
					callback(exports);
					config = callback = null;
				}, 1);
			}, 1);
		}, {
			adapter : 'localstorage',
			useBest : true
		});
	};


	return exports;
});