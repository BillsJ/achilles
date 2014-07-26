var achilles = require("../index.js");
var util = require("util");
var assert = require("assert");

function Album(name) {
	achilles.Object.call(this);
	this.define("name", String);
	this.name = name;
}

util.inherits(Album, achilles.Object);

describe("achilles.Object.define", function() {
    it("should set this._type[key] to appropriate type", function() {
		var album = new Album("Femme Fatale");
		assert(album._type.name === String);
    });
});

describe("achilles.Object.toJSON", function() {
    it("should be serialisable to JSON", function() {
		var album = new Album("Random Album");
		JSON.stringify(album.toJSON());
    });
});
