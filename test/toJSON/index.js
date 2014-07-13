var util = require("util");
var achilles = require("../../index.js");

function Song(name) {
	achilles.Object.call(this);
	this.define("name", String);
	this.name = name;
}

util.inherits(Song, achilles.Object);

function Album() {
	achilles.Object.call(this);
	this.define("name", String);
	this.define("songs", [Song]);
}

util.inherits(Album, achilles.Object);

var a = new Album();
a.name = "Proserpina";
a.songs = [];
a.songs.push(new Song("George"));
a.songs.push(new Song("Rocket Scientist"));
console.log(a.toJSON());
