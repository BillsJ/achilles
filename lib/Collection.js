var View = require("./View");
var util = require("util");

function Collection(controller) {
	View.call(this);
	this.define("value", [Object]);
	this.controller = controller;
	this.subcontrollers = [];
	this.on("push", this.render.bind(this));
	this.on("change", this.render.bind(this));
	this.on("remove", this.render.bind(this));
	this.on("change:value", this.render.bind(this));
}

util.inherits(Collection, View);

Collection.prototype.add = function(item) {
	var itemNew = new this.controller();
	itemNew.model = item;
	itemNew.append(this.el);
};

Collection.prototype.render = function() {
	if(this.el) {
		this.el.innerHTML = "";
		this.value.forEach(this.add.bind(this));
	}
};

module.exports = Collection;
