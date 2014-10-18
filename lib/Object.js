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
function Obj() {
	events.EventEmitter.call(this);
	this._data = {}; // Stores data
	this._virtuals = {}; // Stores virtuals
	this._type = {}; // Stores data types
}

util.inherits(Obj, events.EventEmitter);

var ensureType = function(val, Type) {
	if(Type === String && typeof val === "string") {
		return val;
	} else if(Type === String && typeof val.toString() === "string") {
		// Object to String Casting
		return val.toString();
	} else if(Type === Number && typeof val === "number") {
		return val;
	} else if(Type === Number && typeof val === "string" && !isNaN(val)) {
		// String to Number casting
		return parseInt(val, 10);
	} else if(Type === Boolean && typeof val === "boolean") {
		return val;
	} else if(Type instanceof Array && val instanceof Array) {
		// Array handling
		var y = val.map(function(value) {
			return ensureType(value, Type[0]);
		});
		y.forEach(function(value) {
			if(value instanceof Obj) {
				value.container = y;
			}
		});
		return y;
	} else if(Type === Date && typeof val === "string") {
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
			if (val.hasOwnProperty(key)) {
				n[key] = val[key];
			}
		}
		return n;
	} else if(val instanceof Type) {
		return val;
	} else {
		throw new TypeError("Value, " + val + ", must be of type " + Type.name || Type);
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
				}
				
				val = ensureType(val, this._type[key]);
				
				if(typeof val === "object") {
					val.container = this;
					val.containerProp = key;
				}

				if(this._type[key] instanceof Array) {
					val.push = function(value) {
						value = ensureType(value, this._type[key][0]);
						if(value instanceof Obj) {
							value.container = val;
						}
						val[val.length] = value;
						this.emit("push:" + key, value);
					}.bind(this);
				}
				
				if(options.virtual) {
					this._virtuals[key] = val;
				} else {
					this._data[key] = val;
				}
				this.emit("change", key);
				this.emit("change:" + key);
			}
		}
	});
};

Obj.prototype.toJSON = function() {
	var n = {};
	function dataReturned(data) {
		return data.toJSON();
	} 
	for(var key in this._data) {
		if(this._data[key] instanceof Obj) {
			n[key] = this._data[key].toJSON();
		} else if(this._data[key] instanceof Array && this._type[key][0].prototype instanceof Obj) {
			n[key] = this._data[key].map(dataReturned);
		} else {
			n[key] = this._data[key];
		}
	}
	return n;
};

Obj.prototype.remove = function() {
	this.container.splice(this.container.indexOf(this), 1);
	this.container.container.emit("remove:" + this.container.containerProp);
};

Obj.prototype.parse = function(data) {
	for(var key in data) {
		if(this.hasOwnProperty(key)) {
			this[key] = data[key];
		}
	}
};

Obj.parse = function(data) {
	var Class = this;
	var nova = new Class();
	nova.parse(data);
	return nova;
};

module.exports = Obj;
