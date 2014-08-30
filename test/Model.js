var achilles = require("../");
var Album = require("./Album");
var Song = require("./Song");
var assert = require("assert");

describe("achilles.Model.ref", function() {
	it("should automatically convert actual objects to refs", function() {
		
	});
});

describe("achilles.Model", function() {
	it("getById()", function(done) {
		Album.getById("1", function(err, album) {
			assert(album.title === "quidem molestiae enim");
			done();
		});
	});
	it("delById()", function(done) {
		Album.delById("1", function(err, body) {
			if(err) {
				throw err;
			}
			done();
		});
	});
	it("getSubDocTree()", function() {
		var tree = Album.getSubDocTree();
		assert(tree["songs"] === Song);
		assert(Object.keys(tree).length === 1);
	});
});
