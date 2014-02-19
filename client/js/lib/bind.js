/** bind(func, context, args) */
define(function() {
	if (!Function.prototype.bind) {
		Function.prototype.bind = function bindShim(context, args) {
			var func = this;
			args = Array.prototype.slice.call(arguments, 2);
			function bound() {
				return func.apply(context, args.concat(Array.prototype.slice.call(arguments)));
			}
			return bound;
		};
	}
	function bind(func, context, args) {
		return func.bind.apply(func, Array.prototype.slice.call(arguments, 1));
	}
	return bind;
});