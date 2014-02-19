if (!window.console || !window.console.log) {
	window.console = {
		log : function(){},
		warn : function(){},
		error : function(){}
	};
}

require.config({
	
	baseUrl : 'js/lib',

	paths : {
		'app' : '../app',
		'templates' : '../../templates',
		'templateengine' : 'templateengine-1.8.2',
		'puredom/sync' : 'puredom/puredom.sync',
		'puredom/Model' : 'puredom/puredom.Model',
		'puredom/propertyselector' : 'puredom/puredom.propertyselector',
		'puredom/templateengine' : 'puredom/puredom.templateengine'
	},

	shim : {
		'aurora/AV' : {
			exports : 'AV'
		},
		'aurora/MP3Decoder' : {
			exports : 'MP3Decoder'
		}
	}

});

require([
	'puredom',
	'puredom/templateengine',
	'puredom/sync',
	'puredom/propertyselector',
	'bind',
	'app/main'
], function($, templateengine, sync, prop, bind, main) {
	$.templateAttributeName = 'tpl';	// data-tpl-id sucked
	window.app = main;
	main.init();
});