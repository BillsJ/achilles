var View = require("./View");
var util = require("util");

function Collection(controller) {
	this.controller = controller;
	this.subcontrollers = [];
	this.on("push", this.addController.bind(this));
	this.on("change", function() {
		this.model.forEach(this.addController);
	}.bind(this));
}

util.inherits(Collection, View);

Collection.prototype.addController = function(item) {
	var itemNew = new this.controller();
	itemNew.model = item;
	itemNew.on("destroy", function() {
		this.subcontrollers.splice(this.subcontrollers.indexOf(itemNew), 1);
		this.model.splice(this.model.indexOf(itemNew.model), 1);
	}.bind(this));
	this.subcontrollers.push(itemNew);
	itemNew.append(this.el);
};

Collection.prototype.render = function() {
	this.subcontrollers.forEach(function(controller) {
		controller.append(this.el);
	}.bind(this));
};

module.exports = Collection;
