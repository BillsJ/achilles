var achilles = require("../");
var Album = require("./Album");
var Song = require("./Song");
var assert = require("assert");

describe("achilles.Model.ref", function() {
	it("should automatically convert actual objects to refs", function() {
		
	});
});

describe("achilles.Model", function() {
	it("should have an id attribute", function() {
		var album = new Album();
		assert(album._type.id === String);
	});
	it("getById()", function(done) {
		Album.getById("1", function(err, album) {
			assert(album.title === "quidem molestiae enim");
			done();
		});
	});
	it(".save()", function(done) {
		var album = new Album("For The Win");
		album.save(function(err, album) {
			if(err) {
				throw err;
			} 
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
	it("getRefDocTree()", function() {
		var tree = Album.getRefDocTree();
		assert(Object.keys(tree).length === 1);
		assert(tree.userId === achilles.User);
	});
	it("getSubDocTree()", function() {
		var tree = Album.getSubDocTree();
		assert(tree["songs"] === Song);
		assert(Object.keys(tree).length === 2);
	});
	it("get()", function(done) {
		Album.get(function(err, list) {
			assert(list.length === 100);
			done();
		});
	});
	it("getURL()", function(cb) {
		Album.getById("1", function(err, album) {
			var song = new Song("Counting Stars");
			album.songs = [song];
			console.log(album.getURL());
			assert(song.getURL() === album.getURL() + "/songs");
			cb();
		});
	});
});
