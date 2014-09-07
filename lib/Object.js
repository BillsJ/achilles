var util = require("util");
var events = require("events");

/**
 * Super Dodgy Code
 * Overrides util.inherits such that
 * a subclass inherits statics as well
 */

var original = util.inherits;
util.inherits = function(subclass, superclass) {
	original(subclass, superclass);
	for(var n in superclass) {
		if(n !== "prototype") {
			subclass[n] = superclass[n];
		}
	}
};

/**
 * Instantiates an achilles Object
 * @class Provides an Object-Oriented structure to extend
 * @lends events.EventEmitter
 */
function Obj(base) {
	events.EventEmitter.call(this);
	this._data = {}; // Stores data
	this._virtuals = {}; // Stores virtuals
	this._type = {}; // Stores data types
}

util.inherits(Obj, events.EventEmitter);

var ensureType = function(val, type) {
	var Class = this;
	if(type === String && typeof val === "string") {
		return val;
	} else if(type === String && typeof val.toString() === "string") {
		// Object to String Casting
		return val.toString();
	} else if(type === Number && typeof val === "number") {
		return val;
	} else if(type === Number && typeof val === "string" && !isNaN(val)) {
		// String to Number casting
		return parseInt(val, 10);
	} else if(type === Boolean && typeof val === "boolean") {
		return val;
	} else if(type instanceof Array && val instanceof Array) {
		// Array handling
		val.forEach(function(value) {
			if(value instanceof Obj) {
				value.container = val;
			}
			ensureType(value, type[0]);
		});
		return val;
	} else if(type === Date && typeof val === "string") {
		/**
		 * Dates are unfortunately not a valid part of JSON,
		 * therefore it is nothing less than essential to
		 * have string to date casting, especially because
		 * certain databases use JSON inherently and
		 * JSON is used in HTTP
		 */
		return new Date(val);
	} else if(Object.getPrototypeOf(val) === Object.prototype) {
		var n = new Type();
		for(var key in val) {
			n[key] = val[key];
		}
		return n;
	} else if(val instanceof type) {
		return val;
	} else {
		throw new TypeError("Value, " + val + ", must be of type " + type.name || type);
	}
};

var ensureArray = function(arr) {
	if(!(arr instanceof Array)) {
		return [arr];
	} else {
		return arr;
	}
};

Obj.prototype.define = function(key, type, options) {
	if(!options) {
		options = {};
	}
	
	this._type[key] = type; // Otherwise just store type anyway
	Object.defineProperty(this, key, {
		get: function() {
			return this._data[key];
		},
		set: function(val) {
			if(val !== undefined) { // Checks if val exists
				if(val === null) {
					if(options.virtual) {
						delete this._virtuals[key];
					} else {
						delete this._data[key];
					}
					return;
				}
				if(val === (options.virtual ? this._data[key] : this._virtuals[key])) { // Do not set if identical
					return;
				}
				if(this._type[key] instanceof Array) {
					val = ensureArray(val);
					val.getURL = function() {
						return this.getURL() + "/" + key;
					}.bind(this);
					val.push = function(value) {
						ensureType(value, this._type[key][0]);
						val[val.length] = value;
						if(value instanceof Obj) {
							value.container = val;
						}
						this.emit("push:" + key, value);
					}.bind(this);
				}

				if(options.virtual) {
					this._virtuals[key] = ensureType(val, this._type[key]);
				} else {
					this._data[key] = ensureType(val, this._type[key]);
				}
				this.emit("change");
				this.emit("change:" + key);
			}
		}
	});
};

Obj.prototype.toJSON = function() {
	var n = {};
	for(var key in this._data) {
		if(this._data[key] instanceof Obj) {
			n[key] = this._data[key].toJSON();
		} else if(this._data[key] instanceof Array && this._type[key][0].prototype instanceof Obj) {
			n[key] = this._data[key].map(function(data) {
				return data.toJSON();
			});
		} else {
			n[key] = this._data[key];
		}
	}
	return n;
};

Obj.prototype.remove = function() {
	this.container.splice(this.container.indexOf(this), 1);
};

Obj.parse = function(data) {
	Class = this;
	var nova = new Class();
	for(var key in data) {
		if(nova.hasOwnProperty(key)) {
			nova[key] = data[key];
		}
	}
	return nova;
};

module.exports = Obj;
