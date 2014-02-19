define(['puredom', 'text!templates/auth.html'], function($, view) {
	var exports = new $.EventEmitter(),
		priv = {
			ui : {},
			responseMessages : {
				login : [
					'Logged in.',
					'Login failed.'
				],
				register : [
					'Registration successful. Please check your email inbox to confirm your account.',
					'Registration failed. Please check your information and try again.'
				],
				requestPasswordReset : [
					'Password reset email has been sent. Please check your email inbox.',
					'There was an error sending the password reset email. The email address you entered may not be associated with an account.'
				],
				resetPassword : [
					'Password has been changed.',
					'Password could not be updated. Please check your information and try again, or contact support.'
				]
			}
		};

	exports.init = exports.load = function() {
		if (priv.initialized) {
			return;
		}
		priv.initialized = true;
		
		priv.ui.base = $({
			html : view
		}).firstChild().insertInto(document.body);
		priv.ui.login = priv.ui.base.query('#module_auth_login');
		priv.ui.register = priv.ui.base.query('#module_auth_register');
		priv.ui.requestPasswordReset = priv.ui.base.query('#module_auth_requestpasswordreset');
		priv.ui.resetPassword = priv.ui.base.query('#module_auth_resetpassword');
		
		priv.ui.formBases = $([
			priv.ui.login,
			priv.ui.register,
			priv.ui.requestPasswordReset,
			priv.ui.resetPassword
		]);
		
		priv.ui.formBases.hide(true);
		
		priv.ui.base.query('[data-action]').on('click', priv.handlers.action);
		
		$.foreach(['login','register','requestPasswordReset','resetPassword'], function(type) {
			priv[type+'FormHandler'] = new $.FormHandler({
				form : priv.ui[type].query('form').attr('data-action', type),
				submitButton : priv.ui[type].query('.submit, [data-action=submit]'),
				cancelButton : priv.ui[type].query('.cancel, [data-action=cancel]'),
				onsubmit : priv.submit,
				oncancel : priv.cancel,
				enhance : true
			});
		});
	
		app.state.addObject('auth', priv.state);
		
		if (!app.model.api) {
			console.warn('No auth API defined, defaulting to logged-out state.');
			priv.setLoginState(false);
			return;
		}
		app.model.auth.isLoggedIn({
			callback : function(success, response) {
				priv.setLoginState(response && response.loggedin===true);
			}
		});
	};


	priv.state = {
		restoreState : function(state) {
			var show, m;
			priv.resetPasswordId = null;
		
			if (state) {
				priv.resetPasswordId = state.resetPasswordId;
			
				m = 'show'+state.view.charAt(0).toUpperCase()+state.view.substring(1);
				if (exports.hasOwnProperty(m) && exports[m].call) {
					show = true;
					exports[m]();
				}
			}
			if (!show && priv.ui.base.height()) {
				exports.hide();
			}
		}
	};


	priv.submit = function(data) {
		var form = this,
			method = this.form.attr('data-method') || this.form.attr('data-action'),
			action = this.form.attr('data-action');
		if (method==='resetPassword') {
			data.id = priv.resetPasswordId;
		}
		if (data.hasOwnProperty('password2') && data.password!==data.password2) {
			form.showFieldErrors({
				password2 : 'Passwords must match.'
			});
			return;
		}
		app.model.auth[action](data, function(err, data, req) {
			if (app.notifications && err) {
				app.notifications.show({
					message : err && (err.message || err.error) || priv.responseMessages[method][err?1:0]
				});
			}
			if (!err) {
				if (method==='login' || method==='register') {
					priv.setLoginState(true);
				}
				exports.hide();
			}
			else {
				if (method==='login' || method==='register') {
					priv.setLoginState(false);
				}
				if (err.clientSideError && err.field) {
					err.errors = {};
					err.errors[err.field] = err.message || err.error;
				}
				if (!err.errors) {
					err.errors = {};
					form.form.query('input,textarea,select').each(function(n) {
						var f = n.attr('name');
						if (f) {
							err.errors[f] = err.message || err.error;
							return false;
						}
					});
				}
				form.showFieldErrors(err.errors);
			}
			form = data = null;
		});
	};

	priv.cancel = function() {
		exports.hide();
	};


	priv.setLoginState = function(loggedin) {
		priv.loggedin = loggedin = loggedin===true;
		exports._fireEvent('loginstate', loggedin);
		exports._fireEvent('change', loggedin);
		exports._fireEvent(loggedin ? 'login' : 'logout');
		app.ui.base.query('.'+(loggedin?'un':'')+'authenticated').hide(true);
		app.ui.base.query('.'+(loggedin?'':'un')+'authenticated').show();
	};

	exports.isLoggedIn = function() {
		return priv.loggedin===true;
	};

	exports.logout = function() {
		app.model.logout();
		priv.setLoginState(false);
	};


	exports.hide = function() {
		priv.ui.base.query('.overlay_fg').css({
			transform : 'translate3d(0, -120%, 0)'
			//top : '-120%'
		}, {tween:300, callback:function() {
			priv.ui.base.query('.overlay_bg').fadeOut(200, function() {
				priv.ui.base.hide(true);
			});
			priv.state.setState({});
		}});
	};


	priv.showScreen = function(name, ui) {
		ui = priv.ui[ui] || ui || priv.ui[name];
		priv.ui.base.show();
		priv.ui.formBases.hide(true);
		ui.show();
		priv.ui.base.query('.overlay_bg').hide(true).fadeIn(200, function() {
			priv.state.setState({
				view : name
			});
			priv[name+'FormHandler'].clearErrors();
			priv.ui.base.query('.overlay_fg').css({
				transform : 'translate3d(0, 0%, 0)'
				//top : '0%'
			}, {tween:300});
			name = ui = null;
		});
	};


	exports.showLogin = function() {
		priv.showScreen('login');
	};

	exports.showRegister = function() {
		priv.showScreen('register');
	};

	exports.showRequestPasswordReset = function() {
		priv.showScreen('requestPasswordReset');
	};

	exports.showResetPassword = function() {
		priv.showScreen('resetPassword');
	};

	exports.unload = exports.destroy = function() {
		priv = exports = null;
	};

	priv.handlers = {
		action : function(e) {
			var me = $(this),
				action = me.attr('data-action'),
				f;
			if (me.nodeName()==='form') {
				return;
			}
			f = priv.handlers[action] || exports[action];
			if (f) {
				return f(me.attr('data-action-params') || me, e);
			}
		}
	};

	return exports;
});