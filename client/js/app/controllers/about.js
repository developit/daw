define(['puredom', 'text!templates/about.html'], function($, view) {
	return {
		
		name : 'about',
		title : 'About Us{global.appTitle}',
		customUrl : '/about',
		
		load : function(options) {
			var self = this,
				tpl = {
					global : app.tpl.global
				};
			
			this.params = options.params || {};
			document.title = $.template(this.title, tpl);
			app.views.addView(this.name, view);
			this.ui = app.views.template(this.name, tpl, options.viewBase).show();
			
			this.handlers = {
				action : function(e) {
					return app.handleAction(this, e, [self, self.handlers]);
				}
			};
			
			this.ui.query('[data-action]').on('click', this.handlers.action);
			
			this._kill = function() {
				self = tpl = options = this.handlers = null;
			};
		},
	
	
		unload : function() {
			this._kill && this._kill();
			this.ui && this.ui.destroy();
			this.ui = this._kill = null;
		}
	
	};
});