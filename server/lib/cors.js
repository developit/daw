/**	@fileOverview Enable CORS globally for the given express instance. */

var config = {
	origin : '*',
	methods : '*',
	headers : 'Content-Type'
};

function middleware(req, res, next) {
	if (req.get('Origin')) {
		for (var key in config) {
			if (config.hasOwnProperty(key)) {
				res.set('Access-Control-Allow-' + key.charAt(0).toUpperCase()+key.substring(1), config[key]);
			}
		}
		res.set('Access-Control-Allow-Origin', config.origin);
		res.set('Access-Control-Allow-Methods', config.methods);
		res.set('Access-Control-Allow-Headers', config.headers);
		if (req.method==='OPTIONS') {
			return res.send(200);
		}
	}
	next();
}

module.exports = middleware;
exports.middleware = middleware;

exports.use = function(app, path) {
	if (app) {
		app.all(path + '/*', middleware);
	}
	return exports;
};

exports.config = function(conf) {
	for (var key in conf) {
		if (!config.hasOwnProperty(key)) {
			throw(new Error('api.config() :: Unknown key "'+key+'".'));
		}
		if (!conf[key]) {
			throw(new Error('api.config() :: Missing value for key "'+key+'".'));
		}
		config[key] = conf[key];
	}
	return this;
};