define([
	'puredom',
	'./modules/auth',
	'./modules/dialogs'
], function($, auth, dialogs) {
	var modules = new $.ControllerManager({
		singular : false,
		allowLoadDefault : false,
		autoRestoreOnInit : false
	});
	
	modules.register('auth', auth);
	modules.register('dialogs', dialogs);

	return modules;
});