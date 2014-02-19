/** A synchronized model base class. */
(function(factory) {
	if (typeof window.define==='function' && window.define.amd) {
		window.define(['puredom'], factory);
	}
	else {
		factory(window.puredom);
	}
}(function($) {
	/** @exports Model as puredom.Model */
	
	function noop(){}
	
	function Model(attributes, callback) {
		if (arguments.length===3) {
			callback = arguments[2];
			this.db = arguments[1];
		}
		callback = callback || noop;

		if (attributes) {
			if (typeof attributes==='string' || typeof attributes==='number') {
				this.id = this.attributes.id = attributes;
			}
			else {
				this.fromJSON(attributes);
			}
		}

		if (this.id) {
			this.fetch(callback);
		}
		else {
			this.localId = (Date.now() + Math.random()).toString(36);
			setTimeout(function() {
				callback();
			}, 1);
		}
	}

	$.inherits(Model, $.EventEmitter);
	
	$.extend(Model.prototype, {
		type : 'Model',
		url : '/api/{{type}}/{{id}}',
		synced : false,
		attributes : {},

		set : function(key, value) {
			var old = this.attributes[key];
			this.attributes[key] = value;
			this.fireEvent('change', [key, value, old]);
			this.sync();
		},

		get : function(key, callback) {
			if (typeof callback==='function') {
				return this._fetchIfNotSynced(function() {
					callback(this.attributes[key]);
				});
			}
			return this.attributes[key];
		},

		cache : function(db) {
			var id = this.localId || this.id,
				dba = db || this.db;
			if (dba) {
				dba.setValue('$.Model.'+this.type+'.'+id, this.toJSON());
			}
			return this;
		},

		fromCache : function(db) {
			var id = this.localId || this.id,
				dba = db || this.db,
				json = dba && id && dba.getValue('$.Model.'+this.type+'.'+id);
			if (json) {
				this.fromJSON(json);
			}
			return this;
		},

		fetch : function(callback) {
			var self = this,
				json = this.toJSON();
			this.fireEvent('fetchstart');
			json.id = this.id || json.id;
			$.net.get($.template(this.url, json), function(success, json) {
				console.log('fetch() callback: ', success, json);
				if (success===true) {
					self.fromJSON(json);
					self.synced = true;
				}
				self.fireEvent('fetchend');
				callback.call(this, success ? null : ('Error: '+json), success ? json : null);
			});
			return this;
		},

		sync : function(callback) {
			var self = this,
				json;
			callback = callback || noop;
			if (this.initialized!==true) {
				return callback();
			}
			this.fireEvent('syncstart');
			json = this.toJSON();
			delete json.localId;
			$.net.post($.template(this.url, json), json, function(success, json) {
				console.log('sync() callback: ', arguments);
				self.synced = true;
				self.fireEvent('syncend');
				callback.call(this, success ? null : ('Error: '+json), success ? json : null);
			});
			return this;
		},

		_fetchIfNotSynced : function(callback) {
			var self = this;
			if (this.synced===true) {
				return setTimeout(function() {
					callback.call(self, true);
				}, 1);
			}
			return this.fetch(callback);
		},

		toJSON : function() {
			return $.extend({}, this.attributes);
		},

		fromJSON : function(json) {
			this.attributes = $.extend({}, json);
			if (json.id) {
				this.id = json.id;
				if (this.localId) {
					db.removeKey('$.Model.'+this.type+'.'+this.localId);
					delete this.localId;
					this.cache();
				}
			}
			else if (!this.id && !this.localId && json.localId) {
				this.localId = json.localId;
				this.cache();
			}
			return this;
		}
	});

	// Come on, it'll be fun
	$.Model = Model.Model = Model;
	return Model;
}));