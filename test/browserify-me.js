var achilles = require("../index");

window.onload = function() {
	var enclosure = new achilles.EventEmitter(document.getElementById("enclosure"));

	enclosure.on("click .first", function(e) {
		console.log("hi");
		console.log(e);
	});

	enclosure.on("click .second", function(e) {
		console.log("bye");
		console.log(e);
	});
};


