var exec = require('child_process').exec;

var child = exec('browserify browserify-me.js > script.js && open index.html', function(err, stdout, stdin) {
	console.log(stdout);
	if(err) {
		throw err;
	} else {
		console.log("index.html opened");
	}
});
