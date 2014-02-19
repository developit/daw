define(['puredom'], function($) {
	var exports = new puredom.EventEmitter(),
		priv = {
			dialogs : [			// auto now
				//'contact'
			],
			ui : {},
			responseMessages : {
				contact : [
					'Thank you, your message has been sent.',
					'There was an error sending your message. Please check your information and try again.'
				]
			}
		};
	
	/**	Initialize the dialog manager module. */
	exports.init = exports.load = function() {
		if (priv.initialized) {
			return;
		}
		priv.initialized = true;
		
		try {
		
		priv.ui.base = puredom('#module_dialogs');
		
		priv.dialogs = [];
		priv.ui.base.query('[id^=module_dialogs_]').each(function(p) {
			priv.dialogs.push(p.attr('id').substring(15));
		});
		
		var dialogs = [];
		for (var i=0; i<priv.dialogs.length; i++) {
			dialogs[i] = priv.ui[priv.dialogs[i]] = priv.ui.base.query('#module_dialogs_'+priv.dialogs[i]);
		}
		
		priv.ui.formBases = puredom(dialogs);
		priv.ui.formBases.hide(true);
		
		priv.ui.base.query('[data-action]').on('click', priv.handlers.action);
		
		puredom.foreach(priv.dialogs, function(type) {
			priv[type+'FormHandler'] = new puredom.FormHandler({
				form : priv.ui[type].query('form').attr('data-action', type),
				submitButton : priv.ui[type].query('.submit, [data-action=submit]'),
				cancelButton : priv.ui[type].query('.cancel, [data-action=cancel]'),
				onsubmit : priv.submit,
				oncancel : priv.cancel,
				enhance : true
			});
		});
		
		app.state.addObject('dialog', priv.state);
		} catch(err) {
			console.log('error', err.message, err.lineNumber);
		}
	};
	
	
	priv.state = {
		restoreState : function(state) {
			var show;
			if (state) {
				if (priv.dialogs.indexOf(state.view.toLowerCase())>-1) {
					show = true;
					exports.show(state.view);
				}
			}
			if (!show && priv.ui.base.height()) {
				exports.hide();
			}
		}
	};
	
	
	/**	@private */
	priv.submit = function(data) {
		var form = this,
			method = this.form.attr('data-method') || this.form.attr('data-action'),
			action = this.form.attr('data-action');
		app.model.api.forms[action](puredom.extend(data, {
			callback : function(success, response) {
				console.log(success, response);
				if (app.notifications && (!response || !response.clientSideError)) {
					app.notifications.show({
						message : response.message || priv.responseMessages[method][success?1:0]
					});
				}
				if (success && response) {
					exports.hide();
				}
				else {
					if (response.clientSideError && response.field) {
						response.fieldErrors = {};
						response.fieldErrors[response.field] = response.message;
					}
					if (!response.fieldErrors) {
						response.fieldErrors = {};
						form.form.query('input,textarea,select').each(function(n) {
							var f = n.attr('name');
							if (f) {
								response.fieldErrors[f] = response.message;
								return false;
							}
						});
					}
					form.showFieldErrors(response.fieldErrors);
				}
				form = data = null;
			}
		}));
	};
	
	
	/**	@private */
	priv.cancel = function() {
		exports.hide();
	};
	
	
	/**	Hide the current dialog */
	exports.hide = function() {
		priv.ui.base.query('.overlay_fg').css({
			top : '-100%'
		}, {tween:300, callback:function() {
			priv.ui.base.query('.overlay_bg').fadeOut(250, function() {
				priv.ui.base.hide(true);
			});
			priv.state.setState({});
		}});
	};
	
	
	/**	@private */
	priv.showScreen = function(name, ui) {
		ui = priv.ui[ui] || ui || priv.ui[name];
		priv.ui.base.show();
		priv.ui.base.query('.overlay_bg').fadeIn(250, function() {
			priv.state.setState({
				view : name
			});
			priv.ui.formBases.hide(true);
			ui.show();
			priv[name+'FormHandler'].clearErrors();
			priv.ui.base.query('.overlay_fg').css({
				top : 0
			}, {tween:300});
			name = ui = null;
		});
	};
	
	
	/**	Show a named dialog. */
	exports.show = function(name) {
		name = (name+'').toLowerCase();
		priv.showScreen(name);
	};
	
	
	/**	@private */
	exports.unload = exports.destroy = function() {
		priv = exports = null;
	};
	
	
	/**	@private */
	priv.handlers = {
		action : function(e) {
			var me = puredom(this),
				action = me.attr('data-action'),
				f;
			f = priv.handlers[action] || exports[action];
			if (f) {
				return f(me.attr('data-action-params') || me, e);
			}
		}
	};
	
	return exports;
});