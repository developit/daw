/**	@fileOverview A simple way to expose modules as REST APIs. */
var fs = require('fs'),
	path = require('path'),
	_ = require('lodash');

module.exports = function() {
	var api = {
			root : '/api/'
		},
		methodMap = {
			del : 'delete'
		},
		methodReg = /^(?:([A-Z]{2,}) )?(.+)$/g;

	function init(app, conf) {
		api.app = app;
		if (conf) {
			api.root = conf.root || api.root;
			if (conf.routesDir) {
				api.loadRoutesFromDir(conf.routesDir);
			}
		}
	}

	api.route = function(path, handler, prefix) {
		var parts,
			p = handler || path;
		if (typeof p==='object') {
			prefix = typeof path==='string' ? path.replace(/\/$/g,'') : '';
			for (var i in p) {
				if (p.hasOwnProperty(i) && typeof p[i]==='function') {
					api.route(i, p[i], prefix);
				}
			}
			return;
		}
		methodReg.lastIndex = 0;
		parts = methodReg.exec(path);
		method = (parts[1] || 'get').toLowerCase();
		path = normalizePath(api.root + (prefix || '') + parts[2]);
		method = methodMap[method] || method;
		if (api.debug===true) {
			console.log(method + '("'+path+'", ' + (handler+'').match(/^.*?\([^\)]*\)/i)[0] + ' { ... })');
		}
		api.app[method](path, handler);
	};

	api.expose = function(path, module, idParam) {
		('get post get put del').split(' ').forEach(function(method, index) {
			var id = index>1 ? ('/:' + idParam || 'id') : '';
			if (!module[method]) return;
			api.app[method](normalizePath(exports.root + path) + id, module[method]);
		});
	};

	api.loadRoutesFromDir = function(dir) {
		//if (!dir.match(/^[.\/]/g)) {
		//	dir = './' + dir;
		//}
		dir = path.resolve(process.cwd(), dir);
		fs.readdirSync(dir).forEach(function(name) {
			if (name.match(/\.js$/gi)) {
				var route = require(dir+'/'+name);
				api.route(route.path || name.replace(/\.js$/gi,''), route);
			}
		});
	};

	function normalizePath(path) {
		path = path.replace(/(?:(\/)\/+|\/+$)/g, '$1');
		path = path.split('/');
		for (var i=path.length; i--; ) {
			if (path[i]==='..') {
				path.splice(i-1, 2);
			}
		}
		return path.join('/');
	}

	api.echo = exports.echo;

	init.apply(api, arguments);
	return api;
};


module.exports.echo = function(req, res) {
	res.send(200, {
		route : req.method + ' ' + req.path,
		params : _.assign({}, req.params),
		headers : req.headers,
		querystring : req.query,
		body : req.body
	});
};