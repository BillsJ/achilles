var View = require("./View");
var util = require("util");

function Collection(controller) {
	View.call(this);
	this.define("value", [Object]);
	this.controller = controller;
	this.subcontrollers = [];
	this.on("push", function() {
		if(this.el) {
			this.el.innerHTML = "";
			this.render();
		}
	}.bind(this));
	this.on("change", function() {
		if(this.el) {
			this.el.innerHTML = "";
			this.render();
		}
	}.bind(this));
	this.on("remove", function() {
		if(this.el) {
			this.el.innerHTML = "";
			this.render();
		}
	}.bind(this));
	this.on("change:value", function() {
		if(this.el) {
			this.el.innerHTML = "";
			this.render();
		}
	}.bind(this));
}

util.inherits(Collection, View);

Collection.prototype.render = function() {
	this.value.forEach(function(item) {
		var itemNew = new this.controller();
		itemNew.model = item;
		itemNew.append(this.el);
	}.bind(this));
};

module.exports = Collection;
