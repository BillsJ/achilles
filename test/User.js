var achilles = require("../");
var Album = require("./Album");
var assert = require("assert");

describe("achilles.User", function() {
	it("should grant automatic permission to admins", function() {
		var m = new achilles.User();
		m.roles = ["admin"];
		assert(m.can(Album, "del"));
	});
	it("should work correctly with roles", function() {
		var m = new achilles.User();
		m.roles = ["Album:get"];
		assert(m.can(Album, "get"));
	});
	it("should work correctly with groups", function() {
		new achilles.Group("student", {
			Album: {
				get:true
			}
		});
		var m = new achilles.User();
		m.groups = ["student"];
		assert(m.can(Album, "get"));
	});
});
