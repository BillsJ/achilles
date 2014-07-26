/**
 * @author Hashan Punchihewa
 */

var util = require("util");
var events = require("events");
var url = require("url");
var request = require("request");
var accepts = require("accepts");
var redirect = require("response-redirect");

/**
 * Super Dodgy Code
 * Overrides util.inherits such that
 * a subclass inherits statics as well
 */

var original = util.inherits;
util.inherits = function(subclass, superclass) {
	original(subclass, superclass);
	for(var n in superclass) {
		if(n != "prototype") {
			subclass[n] = superclass[n];
		}
	}
};

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
	} else if(type === Date && typeof val === "string") {
		/**
		 * Dates are unfortunately not a valid part of JSON,
		 * therefore it is nothing less than essential to
		 * have string to date casting, especially because
		 * certain databases use JSON inherently and
		 * JSON is used in HTTP
		 */
		return new Date(val);
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

achilles.Object.prototype.toJSON = function() {
	var n = {};
	for(var key in this._data) {
		if(this._data[key] instanceof achilles.Object) {
			n[key] = this._data[key].toJSON();
		} else if(this._data[key] instanceof Array && this._type[key][0].prototype instanceof achilles.Object) {
			n[key] = this._data[key].map(function(data) {
				return data.toJSON();
			});
		} else {
			n[key] = this._data[key];
		}
	}
	return n;
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

var pathToRegex = require("path-to-regexp");

achilles.Router = function() {
	this._events = [];
	this.formatters = {};
	this.route = this.route.bind(this);
};

achilles.Router.prototype.addFormatter = function(from, to, stream) {
	if(!this.formatters[from]) {
		this.formatters[from] = {};
	}
	this.formatters[from][to] = stream;
	for(var f in this.formatters[to]) {
		var v = this.formatters[to][f];
		this.addFormatter(from, f, function() {
			stream()
				.pipe(v());
		});
	}
};

achilles.Router.prototype.on = function(listener) {
	this._events.push(listener);
};

achilles.Router.prototype.use = function(url, listener) {
	var keys = [];
	if(typeof url === "function" || url instanceof achilles.Router) {
		listener = url;
		var regex = new RegExp(".*", "g");
	} else {
		if(listener instanceof achilles.Router) {
			var original = url;
			url += "/(.*)";
		}
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
				obj[key.name] = values[i+1];
			});
			req.params = obj;
			if(original) {
				req.url = req.url(original.length);
			}
			listener(req, res, next);
		} else {
			next();
		}
	});
};

achilles.Router.prototype.route = function(req, res, cb) {
	var i = 0;
	if(!req.query) { // Ensure req.query is not set twice (by achille.Router using achilles.Router)
		var u = url.parse(req.url, true);
		req.query = u.query; // Sets req.query
		req.url = u.pathname; // Strip queries off url
		req.originalUrl = u.href; // Original URL
	}
	/**
	 * Content Negotiation
	 */
	if(!req.accepts) {
		req.accepts = accepts(req);
		res.redirect = redirect;
	}
	var next = (function(err) {
		if(err) {
			console.log(err);
			throw err;
		} else if(this._events.length != i) {
			i++;
			this._events[i - 1].apply(this, [req, res, next]);
		} else if(cb) {
			cb();
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

achilles.Router.prototype.view = function(url, view) {
	this.get(url, function(req, res, cb) {
		if(req.accepts.types("html")) {
			res.end(view());
		} else {
			cb();
		}
	});
};

/**
 * A model is a class to represent a row
 * in a database, for example a row in Excel.
 * Unlike a regular class this means that a
 * model can be saved, using .save().
 */
achilles.Model = function() {
	achilles.Object.call(this);
	this.define("_id", String);
};

util.inherits(achilles.Model, achilles.Object);

/**
 * Returns the address of a given model
 */
achilles.Model.prototype.getURL = function() {
	return this.constructor.URL + "/" + this._id;
};

achilles.Model.prototype.save = function(cb) {
	/**
	 * Lo! Behold! The callback-stream pattern!
	 * Because of the nature of request you can use
	 * both stream and callbacks. Its methods, you see,
	 * return streams but also accept callbacks. These
	 * methods in achilles.Model are desgined to work in
	 * exactly the same way.
	 */
	return request.put({json: this.toJSON(), url:this.getURL()}, cb && function(err, res, body) {
		cb(err, body);
	});
	/**
	 * N.B. this.getURL() must be called after this.toJSON()
	 * because in some subclasses this.toJSON() may set an _id
	 * if one has not been defined. And this.getURL() relies on
	 * an _id being defined.
	 */
};

/*
 * TODO: Add Fault tolerance to achilles.Model
 */
achilles.Model.prototype.ref = function(property, model) {
	this.define(property, String);
};

achilles.Model.prototype.refresh = function(cb) {
	return request.get({url: this.getURL(), json:true}, (function(err, res, body) {
		if(!err) {
			this._data = body;
		}
		if(cb) {
			cb(err, this); // Pass back error and the model to callback
		}
	}).bind(this));
};

achilles.Model.prototype.del = function(cb) {
	return request.del({url: this.getURL(), json:true}, cb && function(err, res, body) {
		cb(err, body);
	});
};

achilles.Model.getById = function(options, cb) {
	var _id = options._id || options;
	var nova = new this();
	nova._id = _id;
	return nova.refresh(cb);
};

achilles.Model.removeById = function(options, cb) {
	var _id = options._id || options;
	var nova = new this();
	nova._id = _id;
	return nova.del(cb);
};

achilles.Model.getAllDocsURL = function() {
	return url.parse(this.constructor.URL);
};

achilles.Model.find = function(limit, cb) {
	if(typeof limit === "function") {
		cb = limit;
		limit = undefined;
	}
	var URL = this.getAllDocsURL();
	delete URL.search;
	if(limit) {
		URL.query.limit = limit;
	}
	return request.get({url: url.format(URL), json:true}, cb && function(err, res, body) {
		cb(err, body);
	});
};

achilles.Model.getSubDocsTree = function() {
	var n = new this();
	var tree = {};
	for(var key in n._type) {
		if(n._type[key] instanceof Array && n._type[key][0].prototype instanceof achilles.Object) {
			tree[key] = n._type[key][0];
		}
	}
	return tree;
};

/**
   @class Bridges a model with a client
*/
achilles.Service = function(model) {
	achilles.Router.call(this);
	/**
	 * process.nextTick allows you add your own
	 * authentication or formatter functions
	 */
	process.nextTick((function() {
		/**
		 * Throughout achilles.Service, the streaming API
		 * is used because it is so much more efficent.
		 * This is one of achilles.Services' major advantages.
		 */
		this.get("/", function(req, res) {
			req
				.pipe(model.find(req.query.limit))
				.pipe(res);
		});
		this.get("/:_id", function(req, res) {
				/*
				 * Piping req into model.getById means
				 * etag headers are also passed along.
				 */
				req
					.pipe(model.getById(req.params))
					.pipe(res);
		});
		this.post("/", function(req, res) {
			/*
			 * `nova` means `new` Latin & `new` is a
			 * reserved keyword so you know
			 */
			var nova = new model();
			for(var key in req.body) {
				nova[key] = req.body[key];
			}
			nova.save().pipe(res);
		});
		this.put("/:_id", function(req, res) {
			var nova = new model();
			nova._id = req.params._id;
			for(var key in req.body) {
				nova[key] = req.body[key];
			}
			nova.save().pipe(res);
		});
		this.del("/:_id", function(req, res) {
			model.removeById(req.params).pipe(res);
		});
		var subdocs = model.getSubDocsTree();
		for(var key in subdocs) {
			var value = subdocs[key];
			this.get("/:_base/" + key, function(req, res) {
				req
					.pipe(model.subdoc(key, req.params._base))
					.pipe(res);
			});
			this.get("/:_base/" + key + "/:_id", function(req, res) {
				req
					.pipe(model.subdoc(key, req.params._base, req.params._id))
					.pipe(res);
			});
			this.post("/:_base/" + key + "/", function(req, res) {
				var z = new value();
				for(var k in req.body) {
					z[k] = req.body[z];
				}
				model.subdoc(key, req.params._base, z.toJSON())
					.pipe(res);
			});
			this.put("/:_base/" + key + "/" + "/:_id", function(req, res) {
				var nova  = new model();
				nova._id = req.params._base;
				nova.refresh(function() {
					var n = new value();
					n._id = req.params._id;
					for(var key in req.body) {
						n[key] = req.body[key];
					}
					nova[key].push(n);
					nova.save().pipe(res);
				});
			});
		}
	}).bind(this));
};

util.inherits(achilles.Service, achilles.Router);

module.exports = achilles;
