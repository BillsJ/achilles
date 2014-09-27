/**
 * @author Hashan Punchihewa
 */
var uuid = require("node-uuid");
var achilles = {};

achilles.Object = require("./lib/Object");
achilles.Model = require("./lib/Model");
achilles.Router = require("./lib/Router");
achilles.Service = require("./lib/Service");
achilles.User = require("./lib/User");
achilles.Group = require("./lib/Group");
achilles.Connection = require("./lib/Connection");

achilles.Model.prototype.toJSON = function() {
	if(!this._id && this.container) {
		this._id = uuid.v4();
	}
	return achilles.Object.prototype.toJSON.call(this);
};

module.exports = achilles;
