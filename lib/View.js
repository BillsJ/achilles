var util = require("util");
var Object = require("./Object");

/**
 * Creates an EventEmitter
 * @class Represents an EventEmitter on a DOM object
 * @lends achilles.Object
 */
function View(el) {
	Object.call(this);
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

util.inherits(View, Object);

View.prototype.addListener =
	View.prototype.on =
	function(type, listener) {
		Object.prototype.addListener.call(this, type, listener);
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
	} else if(Object.listenerCount(this, type)) {
		this.el.addEventListener(eventType, function(e) {
			if(e.target.matches(eventTarget)) {
				this.emit(type, e);
			}
		}.bind(this), false);
	}
};

View.prototype.applyAllListeners = function(event) {
	if(event) {
		if(typeof this._events[event] === "function") {
			this.applyListener(event, this._events[event]);
		} else if(this._events[event]) {
			this._events[event].forEach(function(listener) {
				this.applyListener(event, listener);
			}.bind(this));
		}
	} else {
		for(var event in this._events) {
			this.applyAllListeners(event);
		}
	}
};

View.prototype.removeListener = function(type, listener) {
	Object.prototype.removeListener.call(this, type, listener);
	if(this.el) {
		var parts = type.split(" ");
		var eventType = parts.splice(0, 1);
		this.el.removeEventListener(eventType, listener);
	}
};

View.prototype.render = function() {
	if(this.template) {
		this.template(this, function(err, html) {
			this.el.innerHTML = html;
			this.emit("render");
		}.bind(this));
	} else if(this.templateSync) {
		this.el.innerHTML = this.templateSync(this);
		this.emit("render");
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
};

View.prototype.append = function(el) {
	el.appendChild(this.el);
};

View.prototype.delegate = function(selector, key, thing) {
	this.on("change:el", function(el) {
		thing.el = this.el.querySelector(selector);
	}.bind(this));

	this.on("render", function() {
		thing.el = this.el.querySelector(selector);
	}.bind(this));

	var delegateEvents = function() {
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
	}.bind(this);

	if(this.model) {
		delegateEvents();
	}
	this.on("change:model", delegateEvents);
};

module.exports = View;
