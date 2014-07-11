var achilles = require("../../index.js");
var util = require("util");

function Album(name) {
	achilles.Model.call(this);
	this.backend("http://localhost:5984/albums");
	this.define("name", String);
	this.name = name;
}

util.inherits(Album, achilles.Model);

var Zed = new Album("Zed");
Zed.save();
