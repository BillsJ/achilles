var util = require("util");
var Obj = require("./Object");

/**
 * Creates an EventEmitter
 * @class Represents an EventEmitter on a DOM object
 * @lends achilles.Object
 */
function View(el) {
	Obj.call(this);
	this.on("change:el", this.applyAllListeners.bind(this));
	this.define("el", Element);
	if(el) {
		if(el instanceof Element) {
			this.el = el;
		} else if(document.readyState === "interactive") {
			this.el = document.querySelector(el);
		} else {
			window.addEventListener("load", function() {
				this.el = document.querySelector(el);
			}.bind(this));
		}
	}
	if(this.el) {
		process.nextTick(function() {
			this.render();
		}.bind(this));
	}
	this.on("change:el", function() {
		if(this.className) {
			this.el.classList.add(this.className);
		}
		this.render();
	}.bind(this));
}

util.inherits(View, Obj);

View.prototype.addListener =
	View.prototype.on =
	function(type, listener) {
		Obj.prototype.addListener.call(this, type, listener);
		if(this.el) {
			this.applyListener(type, listener);
		}
};

View.prototype.applyListener = function(type, listener) {
	var parts = type.split(" ");
	var eventType = parts.splice(0, 1);
	var eventTarget = parts.join(" ");
	if(!eventTarget) {
		this.el.addEventListener(eventType, listener, false);
	} else if(Obj.listenerCount(this, type)) {
		this.el.addEventListener(eventType, function(e) {
			if(e.target.matches(eventTarget) || e.target.matches(eventTarget + " *")) {
				this.emit(type, e);
			}
		}.bind(this), false);
	}
};

View.prototype.applyAllListeners = function(evnt) {
	if(evnt) {
		if(typeof this._events[evnt] === "function") {
			this.applyListener(evnt, this._events[evnt]);
		} else if(this._events[evnt]) {
			this._events[evnt].forEach(function(listener) {
				this.applyListener(evnt, listener);
			}.bind(this));
		}
	} else {
		for(var event in this._events) {
			if (this._events.hasOwnProperty(event)) {
				this.applyAllListeners(event);
			}
		}
	}
};

View.prototype.removeListener = function(type, listener) {
	Obj.prototype.removeListener.call(this, type, listener);
	if(this.el) {
		var parts = type.split(" ");
		var eventType = parts.splice(0, 1);
		this.el.removeEventListener(eventType, listener);
	}
};

View.prototype.render = function() {
	if(this.el) {
		if(this.template) {
			this.template(this, function(err, html) {
				this.el.innerHTML = html;
				this.emit("render");
			}.bind(this));
		} else if(this.templateSync) {
			this.el.innerHTML = this.templateSync(this);
			this.emit("render");
		}
	}
};

View.prototype.bind = function(selector, key) {
	this.on("change " + selector, function(e) {
		if(this.model._type[key] instanceof Array) {
			this.model[key] = Array.prototype.slice.call(this.el.querySelectorAll(selector)).map(function(el) {
				return el.value || el.innerHTML;
			});
		} else {
			this.model[key] = e.target.value || e.target.innerHTML;
		}
	}.bind(this));
	this.on("input " + selector, function(e) {
		if(this.model._type[key] instanceof Array) {
			this.model[key] = Array.prototype.slice.call(this.el.querySelectorAll(selector)).map(function(el) {
				return el.value || el.innerHTML;
			});
		} else {
			this.model[key] = e.target.value || e.target.innerHTML;
		}
	}.bind(this));
};

View.prototype.append = function(el) {
	el.appendChild(this.el);
};

View.prototype.delegate = function(selector, key, thing) {
/*	this.on("change:el", function() {
		thing.el = this.el.querySelector(selector);
	}.bind(this));*/

	this.on("render", function() {
		thing.el = this.el.querySelector(selector);
	}.bind(this));

	var delegateEvents = function() {
		if(thing.hasOwnProperty("model")) {
			thing.model = this.model[key];
			thing.on("change:model", function() {
				this.model[key] = thing.model;
				if(this.model[key] !== thing.model) {
					this.model[key] = thing.model;
				}
			}.bind(this));
		} else {
			thing.value = this.model[key];
			thing.on("change:value", function() {
				if(this.model[key] !== thing.value) {
					this.model[key] = thing.value;
				}
			}.bind(this));
		}

		this.model.on("change:" + key, function() {
			thing.emit.apply(thing, ["change"].concat(Array.prototype.slice.call(arguments)));
		});
		this.model.on("push:" + key, function() {
			thing.emit.apply(thing, ["push"].concat(Array.prototype.slice.call(arguments)));
		});
		this.model.on("remove:" + key, function() {
			thing.emit.apply(thing, ["remove"].concat(Array.prototype.slice.call(arguments)));
		});
	}.bind(this);

	if(this.model) {
		delegateEvents();
	}
	this.on("change:model", delegateEvents);
};

module.exports = View;
