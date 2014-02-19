/** Replaces puredom's templating with TemplateEngine. */
require(['puredom', 'templateengine'], function(puredom, engine) {
	var orig = puredom.template;

	puredom.template = function(text, fields, allowI18n) {
		//if (typeof allowI18n==='boolean') {
		//	console.log('puredom.template() :: allowI18n flag was set. Using internal templating implementation instead of TemplateEngine.');
		//	return orig.apply(this, arguments);
		//}
		text = text.replace(/([^\\]?)\{?\{([a-z0-9A-Z\$_\.]+)(\|[^\}]*?)?\}\}?/gm, '$1{{$2$3}}');
		return engine.template(text, fields);
	};

	/*
	function logIO(name, f) {
		return function() {
			var args = Array.prototype.slice.call(arguments);
			var ret = f.apply(this, args);
			console.log('logIO:: ' + name + '('+args.join(', ')+') = ' + ret);
			return ret;
		};
	}
	*/

	puredom.forEach(puredom.text, function(f, name) {
		engine.helpers[name] = f;		//logIO(name, f);
	});
});