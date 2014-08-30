var achilles = require("../index.js");
var util = require("util");
var Song = require("./Song");

function Album(name) {
	achilles.Model.call(this);

	this.define("title", String);
	this.define("rating", Number);
	this.define("virtual_property", Number, {virtual:true});
	this.define("songs", [Song]);

	this.name = name;
}

Album.idAttribute = "id";
Album.URL = "http://jsonplaceholder.typicode.com/albums";

util.inherits(Album, achilles.Model);

module.exports = Album;
