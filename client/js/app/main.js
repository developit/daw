define([
	'puredom',
	'templateengine',
	'app/config',
	'app/state',
	'app/models',
	'app/controllers',
	'app/views',
	'app/modules',
	'app/notifications'
], function(
	$,
	engine,
	config,
	state,
	models,
	controllers,
	views,
	modules,
	notifications
) {
	var exports = {
			state : state,
			models : models,
			controllers : controllers,
			views : views,
			modules : modules,
			notifications : notifications,
			config : config,
			ui : {},
			tpl : {
				global : {
					appName : config && config.appName
				},
				locations : []
			},
			model : models.main,
			name : config && config.appName
		},
		priv = {};
	
	
	puredom.text.time = engine.helpers.time = function(text, military) {
		var time, h;
		military = military===true || military==='military';
		text = String(text).split(' ');
		time = text[0].split(':');
		h = Math.round(time[0]) || 0;
		return (military ? h : h%12) + (time[1] ? ':'+time[1] : '') + (h && !military ? (text[1] || (h>12 ? 'pm' : 'am')) : '');
	};


	/** @public
	 *	Initialize the app and all modules
	 */
	exports.init = function() {
		priv.initUI();
		
		exports.model.init(config, function() {

			$.extend(controllers.controllerOptions, {
				viewBase : exports.ui.base.query('#view'),
				db : exports.model.db
			});
			
			state.init({
				restore : false,
				objects : {
					controller : controllers
				}
			});
			
			controllers
				.on('unload', priv.controllerUnload)
				.on('change', priv.controllerChange)
				.init();
			
			modules.init();
			
			exports.auth = modules.load('auth');
			
			exports.dialogs = modules.load('dialogs');
			
			state.restore(function() {
				$('body').classify('loaded');
				
				if (!controllers.current()) {
					console.log('falling back to default controller');
					controllers.loadDefault();
				}
			});
		});
	};
	
	
	exports.handleAction = function(target, e, handlers) {
		var me = $(target),
			action = me.attr('data-action'),
			f, d, p, i, json;
		handlers = ([]).concat(handlers || []);
		if (action.substring(0,4)==='app.') {
			d = $.delve(exports, action.replace(/\.[^.]+$/g,''), true);
			f = d[action.split('.').pop()];
			if (typeof f!=='function') {
				f = null;
			}
		}
		else {
			for (i=handlers.length; i--; ) {
				if (handlers[i].hasOwnProperty(action)) {
					f = handlers[i][action];
					d = handlers[i];
					break;
				}
			}
		}
		if (f) {
			p = me.attr('data-action-params');
			if (p && (p.charAt(0)==='{' || p.charAt(0)==='[')) {
				try {
					json = $.json.parse(p);
				}catch(err){}
			}
			p = json || p || me;
			return f.apply(d || f, ([]).concat(p));
		}
	};
	
	
	priv.handleActionProxy = function(e) {
		setTimeout(exports.handleAction.bind(exports, this, e), 20);
		e.preventDefault();
		return false;
	};
	
	
	/**	@private
	 *	Create, bind and template the base app UI
	 */
	priv.initUI = function() {
		exports.ui.base = $('#app');

		$.extend(exports.tpl.global, config);
		$('html').template(exports.tpl);

		$('body').on('click', function(e) {
			var reg = /^\/(?:\#\/)?(.*?)$/g,
				t = e.target,
				h, r, a;
			do {
				a = t.getAttribute('data-action');
				if (a && t.nodeName!=='FORM') {
					e.target = t;
					return priv.handleActionProxy.call(t, e);
				}
				h = t.getAttribute('href');
				reg.lastIndex = 0;
				r = h && reg.exec(h);
				if (r) {
					if (controllers.route('/'+r[1])) {
						console.log('Routed to '+r[1]);
						return e.cancel();
					}
				}
			} while( (t=t.parentNode) && t!==document.body );
		});
		
		//$.addEvent(window, 'resize', priv.resize);
		//priv.resize();
	};
	
	
	priv.controllerUnload = function(name) {
		exports.ui.base.query('[data-action=app.controller.load][data-action-params='+name+']').declassify('active');
	};
	
	
	priv.controllerChange = function(name) {
		exports.ui.base.query('[data-action=app.controller.load][data-action-params='+name+']').classify('active');
		//priv.resize();
	};
	
	
	return exports;
});