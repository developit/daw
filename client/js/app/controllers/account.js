define(['puredom', 'text!templates/account.html'], function($, view) {
	return {
		
		name : 'account',
		title : 'Account Settings{global.appTitle}',
		customUrl : '/account',
	
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
				},
			
				submit : function() {
					var data = self.form.getData();
					app.model.api.account.updateContact($.extend(data, {
						callback : function(success, response) {
							console.log(success, response);
							if (app.notifications) {
								app.notifications.show({
									message : response.message || (success?'Account updated.':'There was an error updating your account.')
								});
							}
							if (success && response) {
								self.populateForm();
							}
							else {
								self.form.showFieldErrors(response.errors || response.fieldErrors || {companyname:response.message});
							}
							form = data = null;
						}
					}));
				},
			
				cancel : function() {
					self.form.clearErrors();
					self.populateForm();
				}
			};
		
			this.ui.query('[data-action]').on('click', this.handlers.action);
		
			this.form = new $.FormHandler({
				form : this.ui.query('form'),
				submitButton : this.ui.query('form .submit'),
				cancelButton : this.ui.query('form .cancel'),
				onsubmit : this.handlers.submit,
				oncancel : this.handlers.cancel,
				enhance : true
			});
		
			this.populateForm();
		
			tpl = options = null;
			this._kill = function() {
				self = this.handlers = null;
			};
		},
	
	
		unload : function() {
			this._kill && this._kill();
			this.ui && this.ui.destroy();
			this.ui = this._kill = null;
		},
	
	
		populateForm : function(callback) {
			var self = this;
			if (!app.model.api || !app.model.api.account) {
				return console.warn('No account API defined.');
			}
			app.model.api.account.contact({
				callback : function(success, data) {
					data = success && data || false;
					if (data) {
						self.form.setData(data);
					}
					if (callback && callback.call) {
						callback(data);
					}
					self = callback = null;
				}
			});
		}
	
	};
});