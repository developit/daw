#!/bin/node

var	fs = require('fs'),
	mongo = require('mongodb'),
	MongoClient = mongo.MongoClient,
	express = require('express'),
	_ = require('lodash'),
	app = express();
global.app = app;

process.chdir(__dirname);

app.set('port', process.env.PORT || 5000);
app.set('mongoUri', process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/daw');
app.use(express.favicon());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
//app.use(app.router);


require('./lib/mongoose/init');
require('./lib/models');


/**	API Setup */

require('./lib/passport/init');

app.cors = require('./lib/cors');
app.use('/api', app.cors);

app.api = require('./lib/api')(app, {
	root : '/api/',		// it's the default but let's be explicit
	routesDir : 'routes'
});



/**	Static Setup */

app.use(function(req, res, next) {
	if (!req.url.match(/(^\/?(login|register|api|static)(\/|\?|$)|\.[a-z]+(\?.*)?$)/g)) {
		req.url = '/';
	}
	next();
});

app.use(express.static(__dirname+'/../client'));



MongoClient.connect(app.get('mongoUri'), function (err, db) {
	if (err) {
		throw(new Error('Mongo Error: '+err));
	}

	global.db = db;
	db.collection('users').ensureIndex({ email:1 }, { unique:true }, function(err, indexName) {

	});

	app.listen(app.get('port'), function() {
		console.log('Listening on ' + app.get('port'));
	});
});