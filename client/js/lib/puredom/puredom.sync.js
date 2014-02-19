(function(factory) {
	if (typeof window.define==='function' && window.define.amd) {
		window.define(['puredom'], factory);
	}
	else {
		factory(window.puredom);
	}
}(function(puredom) {
	var exports = {
		VERSION : '1.1.0'
	};
	
	/**	Get a synchronously chainable version of a selection. <br />
	 *	The new synchronous chain executes all chained functions in order, even if those functions are asynchronous (such as animation). <br />
	 *	<strong>Note:</strong> To revert back to the default (asynchronous) puredom selection, call <code>.async()</code>.
	 *	@name puredom.NodeSelection#sync
	 *	@function
	 */
	puredom.addNodeSelectionPlugin('sync', function() {
		var sel = new puredom.SyncNodeSelection(this),
			proto = puredom.NodeSelection.prototype,
			syncProto = puredom.SyncNodeSelection.prototype,
			i;
		for (i in proto) {
			if (proto.hasOwnProperty(i) && !syncProto.hasOwnProperty(i) && typeof proto[i]==='function') {
				syncProto[i] = syncProto._wrapAsyncMethod(i);
			}
		}
		return sel;
	});


	/**	@class Just like a normal NodeSelection, but each chained method waits for the previous method to finish prior to running.
	 *	@augments puredom.NodeSelection
	 */
	puredom.SyncNodeSelection = function(sel) {
		this._selection = puredom(sel);
		this._asyncQueue = [];
	};

	puredom.extend(puredom.SyncNodeSelection.prototype, /** @lends puredom.SyncNodeSelection# */ {
		/**	Return the original (asynchronous) puredom selection, marking the sync selection for disposal.<br />
		 *	<strong>Warning:</strong> Methods chained after a call to async() can (and will) 
		 *	execute prior to sync portions of a chain. To wait until the sync chain is 
		 *	finished executing, use <code>.then()</code>.
		 *	@returns {puredom.NodeSelection} selection
		 */
		async : function() {
			this._addToQueue(this.dispose, null, this, true);
			return this._selection;
		},
		
		/**	This just returns the existing synchronous selection. <br />
		 *	This is useful if the selection is passed around between modules that may not know that it is already synchronous.
		 */
		sync : function() {
			return this;
		},
		
		/**	Invoke a <code>callback</code> after all previous chained synchronous operations have completed.<br />
		 *	<strong>Note:</strong> Any additional arguments are passed on to <code>callback</code>, similar to how Function.prototype.bind() works.
		 *	@param {Function} callback		A function to call once complete. Gets passed the original (asynchronous) puredom selection (see <code>.async()</code>).
		 *	@returns {this}
		 */
		then : function(callback) {
			this._then = true;
			return this.and.apply(this, arguments);
		},
		
		/**	Invoke a <code>callback</code> after previous chained synchronous operations have completed.<br />
		 *	<strong>Note:</strong> Unlike <code>.then()</code>, this does not terminate the chain.<br />
		 *	<strong>Note:</strong> Any additional arguments are passed on to <code>callback</code>, similar to how Function.prototype.bind() works.
		 *	@param {Function} callback		A function to call between synchronous chained methods. Gets passed the original (asynchronous) puredom selection (see <code>.async()</code>).
		 *	@returns {this}
		 */
		and : function(callback) {
			var args = puredom.toArray(arguments).slice(1);
			this._addToQueue(function() {
				args.splice(0, 0, this._selection);
				callback.apply(this._selection, args);
				if (this._then===true) {
					this.async();
				}
				args = callback = null;
			}, null, this, true);
			return this;
		},
		
		/**	Clean up the sync selection when it is no longer needed. */
		dispose : function() {
			if (this._queueTimer) {
				clearTimeout(this._queueTimer);
			}
			this._selection = this._asyncQueue = this._queueTimer = null;
			return null;
		},
		
		/**	@private */
		_addToQueue : function(executor, args, context, autoProcess) {
			if (arguments.length>1) {
				executor = puredom.toArray(arguments);
			}
			this._asyncQueue.push(executor);
			this._processQueue();
		},
		
		/**	Process the next delayed executor in the queue.
		 *	@private
		 */
		_processQueue : function() {
			var self = this;
			if (this._queueTimer) {
				clearTimeout(this._queueTimer);
			}
			if (this._asyncWaiting===true) {
				return;
			}
			// delay the queue until no more sync pushes are happening.
			this._queueTimer = setTimeout(function() {
				var next = self._asyncQueue && self._asyncQueue.splice(0, 1)[0],
					args = [],
					context = self,
					autoProcess = false;
				this._queueTimer = null;
				if (next) {
					if (puredom.isArray(next)) {
						autoProcess = next[3]===true;
						context = next[2] || context;
						args = args.concat(next[1]);
						next = next[0];
					}
					self._asyncWaiting = true;
					next.apply(context, args);
					if (autoProcess) {
						self._asyncWaiting = false;
						self._processQueue();
					}
				}
				self = null;
			}, 1);
		},
		
		_asyncList : {
			wait	: 1,
			fadeIn	: 1,
			fadeOut	: 1,
			animate	: 3,
			css		: 2,
			on		: 1,
			_createAnimationObj : 3,
			position : [2, "callback"]
		},
		
		/**	Create a synchronously chainable wrapper for a selection method.
		 *	@private
		 */
		_wrapAsyncMethod : function(/*String*/ name) /*Function*/ {
			var callbackIndex = puredom.NodeSelection.prototype[name].asyncDefinition,
				async = !!callbackIndex;
			if (!async && this._asyncList.hasOwnProperty(name)) {
				async = true;
				callbackIndex = this._asyncList[name];
			}
			
			/*
			// arguments don't retain their names when minified, so this is essentially pointless.
			var reg = /\((.*?)\)/gi,
				args, callbackPath, async;
			args = reg.exec(Function.prototype.toString.call(puredom.NodeSelection.prototype[name]))[1];
			args = typeof args==='string' && args.replace(/\s/g).split(',');
			if (!args) {
				return this._undefinedMethod;
			}
			callbackPath = args.indexOf('callback');
			async = callbackIndex>-1;
			*/
			
			return function() {
				var args = puredom.toArray(arguments),
					self, options, callback, userCallback;
				if (async) {
					self = this;
					callback = function() {
						if (userCallback && userCallback.apply) {
							userCallback.apply(this, arguments);
						}
						self._asyncWaiting = false;
						self._processQueue();
						self = userCallback = null;
					};
					if (puredom.isArray(callbackIndex)) {
						options = args[callbackIndex[0]] || {};
						userCallback = options[callbackIndex[1]];
						options[callbackIndex[1]] = callback;
						args[callbackIndex[0]] = options;
					}
					else {
						userCallback = args[callbackIndex];
						args[callbackIndex] = callback;
					}
					options = callback = null;
				}
				this._addToQueue(function() {
					this._selection[name].apply(this._selection, args);
					if (!async) {
						this._processQueue();
					}
					args = null;
				});
				return this;
			};
		}
	});
	
	return exports;
}));