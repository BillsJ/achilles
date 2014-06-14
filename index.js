var util = require("util");
var events = require("events");

var achilles = {};

/**
   Instantiates an achilles Object
   @class Provides an Object-Oriented structure to extend
   @lends events.EventEmitter
 */
achilles.Object = function(base) {
	events.EventEmitter.call(this);
	this._data = {};
};

util.inherits(achilles.Object, events.EventEmitter);

var ensureType = function(val, type) {
	if(type === String && typeof val === "string") {
		return val;
	} else if(type === String && typeof val.toString() === "string") {
		return val.toString();
	} else if(type === Number && typeof val === "number") {
		return val;
	} else if(type === Boolean && typeof val === "boolean") {
		return val;
	} else if(type instanceof Array && val instanceof Array) {
		val.forEach(function(value) {
			ensureType(value, type);
		});
		return val;
	} else if(val instanceof type) {
		return val;
	} else {
		throw new TypeError("Value, " + val + ", must be of type " + type.name || type);
	}
};

achilles.Object.prototype.define = function(key, type) {
	Object.defineProperty(this, key, {
		get: function() {
			return this._data[key];
		},
		set: function(val) {
			if(val === this._data[key]) { // Do not set if identical
				return;
			}
			if(type instanceof Array) {
				val.push = (function(value) {
					ensureType(value, type[0]);
					val[val.length] = value;
					this.emit("push:" + key, value);
				}).bind(this);
			}
			this._data[key] = ensureType(val, type);
			this.emit("change");
			this.emit("change:" + key);
		}
	});
};

/**
   Creates an EventEmitter
   @class Represents an EventEmitter on a DOM object
   @lends achilles.Object
 */
achilles.EventEmitter = function(el) {
	achilles.Object.call(this);
	this.define("el", Element);
	this.el = el;
};

util.inherits(achilles.EventEmitter, achilles.Object);

achilles.EventEmitter.prototype.addListener
	= achilles.EventEmitter.prototype.on
	= function(type, listener) {
		events.EventEmitter.prototype.addListener.call(this, type, listener);
		var parts = type.split(" ");
		var eventType = parts.splice(0, 1);
		var eventTarget = parts.join(" ");
		if(!eventTarget) {
			this.el.addEventListener(eventType, listener, false);
		} else if(events.EventEmitter.listenerCount(this, type)) {
			this.el.addEventListener(eventType, (function(e) {
				if(e.target.matches(eventTarget)) {
					this.emit(type, e);
				}
			}).bind(this), false);
		}
};

achilles.EventEmitter.prototype.removeListener = function(type, listener) {
	events.EventEmitter.prototype.removeListener.call(this, type, listener);
	var parts = type.split(" ");
	var eventType = parts.splice(0, 1);
	this.el.removeEventListener(eventType, listener);
};

/**
    Creates a new Controller
    @class Represents a dynamically-updating template-based element with a scope
	@lends achilles.EventEmitter
 */
achilles.Controller = function(el) {
	if(!el) {
		el = document.createElement("div");
	}
	achilles.EventEmitter.call(this, el);
	if(this.className) {
		this.el.classList.add(this.className);
	}
	process.nextTick((function() {
		this.render();
	}).bind(this));
};

util.inherits(achilles.Controller, achilles.EventEmitter);

achilles.Controller.prototype.render = function() {
	if(this.template) {
		this.template((function(err, html) {
			this.el.innerHTML = html;
			this.emit("render");
		}).bind(this));
	} else if(this.templateSync) {
		this.el.innerHTML = this.templateSync();
		this.emit("render");
	}
};

module.exports = achilles;
