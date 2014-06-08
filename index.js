var util = require("util");
var events = require("events");

var achilles = {};

/**
   Creates an EventEmitter
   @class Represents an EventEmitter on a DOM object
   @lends events.EventEmitter
 */
achilles.EventEmitter = function(el) {
	events.EventEmitter.call(this);
	this.el = el;
};

util.inherits(achilles.EventEmitter, events.EventEmitter);

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
		this.template(this.scope, (function(err, html) {
			this.el.innerHTML = html;
			this.emit("render");
		}).bind(this));
	} else if(this.templateSync) {
		this.el.innerHTML = this.templateSync(this.scope);
		this.emit("render");
	}
};

module.exports = achilles;
