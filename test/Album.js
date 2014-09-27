var achilles = require("../index.js");
var util = require("util");
var Song = require("./Song");

achilles.User.idAttribute = "id";

function Photo(name) {
	achilles.Model.call(this);

	this.define("title", String);	
}

util.inherits(Photo, achilles.Model);

Photo.idAttribute = "id";

function Album(name) {
	achilles.Model.call(this);

	this.define("title", String);
	this.define("rating", Number);
	this.define("virtual_property", Number, {virtual:true});
	this.define("songs", [Song]);
	this.define("photos", [Photo]);
	this.define("popular", Boolean);
	this.ref("userId", achilles.User);

	this.name = name;
}

util.inherits(Album, achilles.Model);

Album.idAttribute = "id";
Album.connection = new achilles.Connection("http://jsonplaceholder.typicode.com/albums");

module.exports = Album;
