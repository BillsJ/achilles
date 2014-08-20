var achilles = require("../index.js");
var util = require("util");

function Album(name) {
	achilles.Object.call(this);
	this.define("name", String);
	this.define("rating", Number);
	this.name = name;
}

util.inherits(Album, achilles.Object);

module.exports = Album;
