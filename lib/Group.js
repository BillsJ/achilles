var util = require("util");
var Model = require("./Model");

function Group() {
	Model.call(this);
	this.define("name", String);
	this.define("roles", [String]);
	
	this.roles = [];
}

util.inherits(Group, Model);

module.exports = Group;
