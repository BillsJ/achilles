var achilles = require("../../index.js");
var util = require("util");

function Song(name) {
	this.define("name");
	this.name = name;
}

util.inherits(Song, achilles.Model);

function Album(name) {
	achilles.Model.call(this);
	this.define("name", String);
	this.define("songs", [Song]);
	this.name = name;
}

util.inherits(Album, achilles.Model);

console.log(Album.getSubDocsTree());
