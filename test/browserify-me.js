var achilles = require("../index");
var util = require("util");

window.addEventListener("load", function() {
	var enclosure = new achilles.EventEmitter(document.getElementById("enclosure"));

	enclosure.on("click .first", function(e) {
		console.log("hi");
		console.log(e);
	});

	enclosure.on("click .second", function(e) {
		console.log("bye");
		console.log(e);
	});
});

function Person(name, age) {
	achilles.Object.call(this);

	this.define("name", String);
	this.define("age", Number);

	this.name = name;
	this.age = age;
}

util.inherits(Person, achilles.Object);

window.addEventListener("load", function() {
	var Xavier = new Person("Xavier", 13);
	console.log(Xavier.name);
	console.log(Xavier.age);

	Xavier.on("change:age", function() {
		console.log("Age changed to " + this.age);
	});

	Xavier.age = 15;
	Xavier.age = 15;
	Xavier.age = 14;

	var John = new Person("John", true);
});

