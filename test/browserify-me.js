var achilles = require("../index");
var util = require("util");

var enclosure = new achilles.EventEmitter("#enclosure");

enclosure.on("click .first", function(e) {
	console.log("hi");
	console.log(e);
});

enclosure.on("click .second", function(e) {
	console.log("bye");
	console.log(e);
});


function Person(name, age) {
	achilles.Object.call(this);

	this.define("name", String);
	this.define("age", Number);
	this.define("children", [Person]);

	this.name = name;
	this.age = age;
	this.children = [];
}

util.inherits(Person, achilles.Object);

window.addEventListener("load", function() {
	var Xavier = new Person("Xavier", 13);
	console.log(Xavier.name);
	console.log(Xavier.age);

	Xavier.on("change:age", function() {
		console.log("Age changed to " + this.age);
	});

	Xavier.on("push:children", function(child) {
		console.log("New child added, called " + child.name);
	});

	Xavier.age = 15;
	Xavier.age = 15;
	Xavier.age = 14;

	var John = new Person("John", 18);
	Xavier.children.push(John);
	console.log(Xavier.children);
});

