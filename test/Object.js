var achilles = require("../index.js");
var util = require("util");
var assert = require("assert");
var Album = require("./Album");
var Song = require("./Song");

describe("achilles.Object.parse", function() {
	it("should not parse undeclared properties", function() {
		var rawObj = {title: "nemesis", lol: true};
		var album = Album.parse(rawObj);
		assert(album.lol === undefined);
	});
});

describe("achilles.Object.prototype.define", function() {
    it("should set this._type[key] to appropriate type", function() {
		var album = new Album("Femme Fatale");
		album.popular = true;
		assert(album._type.title === String);
		assert(album.popular === true);
    });

	it("should support type casting from String to Number", function() {
		var album = new Album("Pixie Lott");
		album.rating = "3";
		assert(album.rating === 3);
	});

	it("should support type casting from Number to String", function() {
		var album = new Album();
		album.title = 3;
		assert(album.title === "3");
	});
	
	it("should support setting a property to null", function() {
		var album = new Album();
		album.title = null;
		assert(album.title === undefined);
	});
	
	it("should support setting a property to a falsey value", function() {
		var album = new Album();
		album.title = 0;
		assert(album.title === "0");
	});
	it("should automatically cast values to arrays where needed", function() {
		var song = new Song("Cal Me Maybe");
		var album = new Album();
		album.songs = song;
		assert(typeof album.songs === "array");
	});
});

describe("achilles.Object.toJSON", function() {
    it("should be serialisable to JSON", function() {
		var album = new Album("Random Album");
		album.songs = [new Song("Whatever")];
		JSON.stringify(album.toJSON());
    });

	it("should not contain virtual properties", function() {
		var album = new Album("Blah Blah Blah");
		album.virtual_property = 5;
		assert(album.toJSON().virtual_property === undefined);
	});
});

describe("achilles.Object.prototype.remove", function() {
	var album = new Album("Blah Blah Blah");
	it("setting an array of sub-objects, should add .container property", function() {
		var song = new Song("Whatever");
		album.songs = [song];
		assert(song.container === album.songs);
	});
	it("should remove a song from its container", function() {
		var song = new Song("Whatever 2");
		album.songs.push(song);
		song.remove();
		assert(album.songs.indexOf(song) === -1);
	});
});
