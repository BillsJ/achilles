var SALT_WORK_FACTOR = 10;

var util = require("util");
var Group = require("./Group");
var Model = require("./Model");
var bcrypt = require("bcrypt-nodejs");

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
		Group.getByIds(this.groups, function(err, groups) {
			for(var i = 0; i < this.groups.length; i++) {
				this._data.roles = this.roles.concat(groups[i].roles);
			}			
			cb(null, this);
		}.bind(this));
	}.bind(this));
};

User.prototype.save = function(cb) {
	if(this.changes.indexOf("password") !== -1) {
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if(err) {
				return cb(err);
			}
			
			bcrypt.hash(this.password, salt, function(err, hash) {
				if(err) {
					return cb(err);
				}
				this._data.password = hash;
				Model.prototype.save.call(this, cb);
			}.bind(this));
		}.bind(this));
	}
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

User.login = function(username, password, cb) {
	User.get({where: {name:username}}, function(err, user) {
		if(err) {
			return cb(err);
		} else if(!user) {
			return cb(null, null);
		}
		user = user[0];
		bcrypt.compare(password, user.password, function(err, isMatch) {
			if(err) {
				return cb(err);
			} else if(isMatch) {
				cb(null, user);
			} else {
				cb(null, null);
			}
		});
	});
};

module.exports = User;
