/**
 * @author Hashan Punchihewa
 */

var util = require("util");
var events = require("events");

var achilles = {};

/**
 * Instantiates an achilles Object
 * @class Provides an Object-Oriented structure to extend
 * @lends events.EventEmitter
 */
achilles.Object = function(base) {
	events.EventEmitter.call(this);
	this._data = {}; // Stores data
	this._type = {}; // Stores data types
};

util.inherits(achilles.Object, events.EventEmitter);

var ensureType = function(val, type) {
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
			ensureType(value, type);
		});
		return val;
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

achilles.Object.prototype.define = function(key, type) {
	if(this._type[key]) { // If defined previously
		delete this._data[key]; // Delete old invalid data
		this._type[key] = type; // Store type
	} else {
		this._type[key] = type; // Otherwise just store type anyway
		Object.defineProperty(this, key, {
			get: function() {
				return this._data[key];
			},
			set: function(val) {
				if(val) { // Checks if val exists
					if(val === this._data[key]) { // Do not set if identical
						return;
					}
					if(this._type[key] instanceof Array) {
						val.push = (function(value) {
							ensureType(value, this._type[key][0]);
							val[val.length] = value;
							if(value instanceof achilles.Object) {
								value.container = this;
							}
							this.emit("push:" + key, value);
						}).bind(this);
					}
					this._data[key] = ensureType(val, this._type[key]);
					this.emit("change");
					this.emit("change:" + key);
				}
			}
		});
	}
};

achilles.Object.prototype.remove = function() {
	this.container.splice(this.container.indexOf(this), 1);
};

/**
 * Creates an EventEmitter
 * @class Represents an EventEmitter on a DOM object
 * @lends achilles.Object
 */
achilles.EventEmitter = function(el) {
	achilles.Object.call(this);
	this.on("change:el", this.applyAllListeners.bind(this));
	this.define("el", Element);
	if(el) {
		if(el instanceof Element) {
			this.el = el;
		} else if(document.readyState === "interactive") {
			this.el = document.querySelector(el);
		} else {
			window.addEventListener("load", (function() {
				this.el = document.querySelector(el);
			}).bind(this));
		}
	}
};

util.inherits(achilles.EventEmitter, achilles.Object);

achilles.EventEmitter.prototype.addListener
	= achilles.EventEmitter.prototype.on
	= function(type, listener) {
		events.EventEmitter.prototype.addListener.call(this, type, listener);
		if(this.el) {
			this.applyListener(type, listener);
		}
};

achilles.EventEmitter.prototype.applyListener = function(type, listener) {
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

achilles.EventEmitter.prototype.applyAllListeners = function(event) {
	if(event) {
		if(typeof this._events[event] === "function") {
			this.applyListener(event, this._events[event]);
		} else if(this._events[event]) {
			this._events[event].forEach((function(listener) {
				this.applyListener(event, listener);
			}).bind(this));
		}
	} else {
		for(var event in this._events) {
			this.applyAllListeners(event);
		}
	}
};

achilles.EventEmitter.prototype.removeListener = function(type, listener) {
	events.EventEmitter.prototype.removeListener.call(this, type, listener);
	if(this.el) {
		var parts = type.split(" ");
		var eventType = parts.splice(0, 1);
		this.el.removeEventListener(eventType, listener);
	}
};

/**
  * Creates a new Controller
  * @class Represents a dynamically-updating template-based element with a scope
  * @lends achilles.EventEmitter
 */
achilles.Controller = function(el) {
	achilles.EventEmitter.call(this, el);
	this.on("change:el", (function() {
		if(this.className) {
			this.el.classList.add(this.className);
		}
		this.render();
	}).bind(this));
	if(document.readyState !== "loading" && this.el) {
		this.render();
	}
};

util.inherits(achilles.Controller, achilles.EventEmitter);

achilles.Controller.prototype.render = function() {
	if(this.template) {
		this.template(this, (function(err, html) {
			this.el.innerHTML = html;
			this.emit("render");
		}).bind(this));
	} else if(this.templateSync) {
		this.el.innerHTML = this.templateSync(this);
		this.emit("render");
	}
};

achilles.Controller.prototype.append = function(el) {
	el.appendChild(this.el);
};

achilles.Controller.prototype.bind = function(selector, key) {
	this.on("change " + selector, (function(e) {
		if(this.model._type[key] instanceof Array) {
			this.model[key] = Array.prototype.slice.call(this.el.querySelectorAll(selector)).map(function(el) {
				return el.value || el.innerHTML;
			});
		} else {
			this.model[key] = e.target.value || e.target.innerHTML;
		}
	}).bind(this));
};

achilles.Controller.prototype.delegate = function(selector, key, thing) {
	this.on("change:el", (function(el) {
		thing.el = this.el.querySelector(selector);
	}).bind(this));

	this.on("render", (function() {
		thing.el = this.el.querySelector(selector);
	}).bind(this));

	var delegateEvents = (function() {
		if(thing.hasOwnProperty("model")) {
			thing.model = this.model[key];
		} else {
			thing.value = this.model[key];
		}

		this.model.on("change:" + key, function(e) {
			thing.emit.apply(thing, ["change"].concat(Array.prototype.slice.call(arguments)));
		});
		this.model.on("push:" + key, function(e) {
			thing.emit.apply(thing, ["push"].concat(Array.prototype.slice.call(arguments)));
		});
	}).bind(this);

	if(this.model) {
		delegateEvents();
	}
	this.on("change:model", delegateEvents);
};

achilles.Collection = function(controller) {
	this.controller = controller;
	this.subcontrollers = [];
	this.on("push", this.addController.bind(this));
	this.on("change", (function() {
		this.model.forEach(this.addController);
	}).bind(this));
};

util.inherits(achilles.Collection, achilles.Controller);

achilles.Collection.prototype.addController = function(item) {
	var itemNew = new this.controller();
	itemNew.model = item;
	itemNew.on("destroy", (function() {
		this.subcontrollers.splice(this.subcontrollers.indexOf(itemNew), 1);
		this.model.splice(this.model.indexOf(itemNew.model), 1);
	}).bind(this));
	this.subcontrollers.push(itemNew);
	itemNew.append(this.el);
};

achilles.Collection.prototype.render = function() {
	this.subcontrollers.forEach((function(controller) {
		controller.append(this.el);
	}).bind(this));
};

var http = require("http");
var pathToRegex = require("path-to-regexp");

achilles.Router = function() {
	this._events = [];
	this.route = this.route.bind(this);
};

achilles.Router.prototype.on = function(listener) {
	this._events.push(listener);
};

achilles.Router.prototype.use = function(url, listener) {
	var keys = [];
	if(typeof url === "function") {
		listener = url;
		var regex = new RegExp(".*", "g");
	} else {
		var regex = pathToRegex(url, keys);
	}

	if(listener instanceof achilles.Router) {
		listener = listener.route;
	}

	this.on(function(req, res, next) {
		if(regex.test(req.url)) {
			var values = regex.exec(req.url);
			var obj = {};
			keys.forEach(function(key, i) {
				obj[key.name] = values[i];
			});
			req.params = obj;
			listener(req, res, next);
		} else {
			next();
		}
	});
};

achilles.Router.prototype.route = function(req, res) {
	var i = 0;
	req.originalUrl = req.url;
	var next = (function(err) {
		if(err) {
			console.log(err);
			throw err;
		} else if(this._events.length != i) {
			i++;
			this._events[i].apply(this, [req, res, next]);
		} else {
			res.writeHead(404);
			res.end();
		}
	}).bind(this);

	next();
};

["GET", "POST", "PUT", "DELETE", "PATCH"].forEach(function(method) {
	achilles.Router.prototype[method === "DELETE" ? "del" : method.toLowerCase()] = function(url, fn) {
		this.use(url, function(req, res, next) {
			if(req.method === method) {
				fn.apply(this, Array.prototype.slice.call(arguments));
			} else {
				next();
			}
		});
	};
});

var url = require("url");
var request = require("request");

achilles.Model = function() {
	achilles.Object.call(this);
	this.define("_id", String);
};

util.inherits(achilles.Model, achilles.Object);

achilles.Model.prototype.backend = function(href) {
	this.url = href;
};

achilles.Model.prototype.save = function(cb) {
	request.put({url:this.url + "/" + this._id, json: this._data}, function(err, res, body) {
		if(cb) {
			cb(err, body);
		} else if(err) {
			throw err;
		}
	});
};

achilles.Model.prototype.refresh = function(cb) {
	request.get({url: this.url + "/" + this._id, json:true}, (function(err, res, body) {
		if(!err) {
			this._data = body;
		}
		cb(err, body);
	}).bind(this));
};

achilles.Model.findById = function(_id, cb) {
	var nova = new achilles.Model();
	nova._id = _id;
	nova.refresh(cb);
};

module.exports = achilles;
