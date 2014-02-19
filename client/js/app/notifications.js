define(['puredom'], function($) {
	var notifications = new $.Notifier({
		parent : $('#notifications_inner')
	});
	
	$.extend(notifications, {
		timeout : 5
	});
	
	return notifications;
});