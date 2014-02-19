define([
	'puredom',
	'./controllers/index',
	'./controllers/about',
	'./controllers/account'
], function($) {
	var router = new $.RouteManager({});
	
	$.extend({
		singular : true,
		allowLoadDefault : false,
		autoRestoreOnInit : false,
		allowPartialUrlFallback : true
	});

	for (var i=1; i<arguments.length; i++) {
		router.register(arguments[i].name, arguments[i]);
	}
	
	return router;
});