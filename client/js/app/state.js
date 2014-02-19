define(['puredom'], function($) {
	var state = new $.StateManager({
		adapter : 'url',
		adaptorOptions : {
			html5UrlPrefix : '/',
			urlMapping : 'controller.current_url',
			usePreceedingSlash : true
		},
		init : false
	});
	
	return state;
});