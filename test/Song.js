
var util = require("util");
var achilles = require("../");

function Song(title) {
	achilles.Model.call(this);

	this.define("title", String);
	this.title = title;
}

util.inherits(Song, achilles.Model);

module.exports = Song;
