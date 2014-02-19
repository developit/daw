define(['puredom', 'text!templates/index.html'], function($, view) {
	return {
		
		name : 'index',
		title : 'Home - {{{global.appName}}}',
		isDefault : true,
		customUrl : '/',
		
		load : function(options) {
			var self = this,
				tpl = {};
			$.extend(tpl, app.tpl);
			
			this.params = options.params || {};
			document.title = $.template(this.title, tpl);
			app.views.addView(this.name, view);
			this.ui = app.views.template(this.name, tpl, options.viewBase).show();
			
			//this.ui.query('[data-action]').on('click', function(e) {
			//	return app.handleAction(this, e, self);
			//});
			
			this._kill = function() {
				self = tpl = options = null;
			};
		},
		
		unload : function() {
			if (this._kill) {
				this._kill();
			}
			this.ui.destroy();
			this.ui = this._kill = null;
		}
	
	};
});