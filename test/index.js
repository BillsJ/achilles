var achilles = require("../index.js");
var util = require("util");
var assert = require("assert");
var Album = require("./Album");

describe("achilles.Object.parse", function() {
	it("should not parse undeclared properties", function() {
		var rawObj = {name: "nemesis", lol: true};
		var album = Album.parse(rawObj);
		assert(album.lol === undefined);
	});
});

describe("achilles.Object.prototype.define", function() {
    it("should set this._type[key] to appropriate type", function() {
		var album = new Album("Femme Fatale");
		assert(album._type.name === String);
    });

	it("should support type casting from String to Number", function() {
		var album = new Album("Pixie Lott");
		album.rating = "3";
		assert(album.rating === 3);
	});

	it("should support type casting from Number to String", function() {
		var album = new Album();
		album.name = 3;
		assert(album.name === "3");
	});
	
	it("should support setting a property to null", function() {
		var album = new Album();
		album.name = null;
		assert(album.name === undefined);
	});
	
	it("should support setting a property to a falsey value", function() {
		var album = new Album();
		album.name = 0;
		assert(album.name === "0");
	});
});

describe("achilles.Object.toJSON", function() {
    it("should be serialisable to JSON", function() {
		var album = new Album("Random Album");
		JSON.stringify(album.toJSON());
    });

	it("should not contain virtual properties", function() {
		var album = new Album("Blah Blah Blah");
		album.virtual_property = 5;
		assert(album.toJSON().virtual_property === undefined);
	});
});
