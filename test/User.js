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
		m.roles = ["Post:get"]; 
		// This user does not have permission to get albums
		assert(m.can(Album, "get") === false);
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

describe("achilles.Group", function() {
	it("should disallow two groups with the same name", function() {
		assert.throws(function() {
			new achilles.Group("main man");
			new achilles.Group("main man");
		});
	});
});
