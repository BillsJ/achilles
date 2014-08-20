var util = require("util");
var Group = require("./Group");
var Model = require("./Model");

function User() {
	Model.call(this);
	this.define("name", String);
	this.define("password", String);
	this.define("roles", [String]);
	this.define("groups", [String]);
	
	this.roles = [];
}

util.inherits(User, Model);

/*
 * Permissions can be allocated on a per-model basis
 * or a per-id basis.
 * They can be assigned to an individual or a group to
 * whom indivuals may belong.
 */
User.prototype.can =
	Group.prototype.can =
	function(model, operation, id) {
		if(typeof model === "function") {		
			model = model.name;
		}
		/*
		 * If user is an admin grant permission automatically
		 */
		if(this.roles.indexOf("admin") !== -1) {
			return true;
		} else {
			if(this.roles.indexOf(model + ":" + operation) !== -1 || this.roles.indexOf(model + ":" + operation) !== -1) {
				return true;
			}
			if(this.groups) {
				for(var i = 0; i < this.groups.length; i++) {
					if(Group.all[this.groups[i]].can(model, operation, id)) {
						return true;
					}
				}
			}
		}
		return false;
};

module.exports = User;
