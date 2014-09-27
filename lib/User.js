var util = require("util");
var Group = require("./Group");
var Model = require("./Model");

function User() {
	Model.call(this);

	this.define("name", String, {unique: true});
	this.define("password", String);
	this.define("roles", [String]);

	this.roles = [];

	this.ref("groups", [Group]);
}

util.inherits(User, Model);

User.prototype.refresh = function(cb) {
	Model.prototype.refresh.call(this, function(err) {
		if(err) {
			return cb(err);
		}
		Group.getByIds(this.groups, function() {
			for(var i = 0; i < this.groups.length; i++) {
				this._data.roles = this.roles.concat(this.groups[i].roles);
			}			
			cb(null, this);
		}.bind(this));
	}.bind(this));
};

/*
 * Permissions can be allocated on a per-model basis
 * or a per-id basis.
 * They can be assigned to an individual or a group to
 * whom indivuals may belong.
 */

User.prototype.can = function(model, operation, id) {
	if(typeof model === "function") {		
		model = model.name;
	}
	/*
	 * If user is an admin grant permission automatically
	 */
	if(this.roles.indexOf("admin") !== -1) {
		return true;
	} else if(this.roles.indexOf(model + ":" + operation) !== -1 || this.roles.indexOf(model + ":" + operation + id) !== -1) {
		return true;
	}
	return false;
};

User.prototype.getAllAccessible = function(model, operation) {
	if(typeof model === "function") {
		model = model.name;
	}
	var all = [];
	var permission = model + ":" + operation;
	this.roles.forEach(function(item) {
		if(item.substring(0, permission.length) === permission) {
			all.push(item.slice(permission.length + 1));
		}
	});
	return all;
};

module.exports = User;
