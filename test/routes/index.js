var achilles = require("../../index");
var http = require("http");

var server = new achilles.Router();

server.use("/:id/:songs", function(req, res) {
	console.log(req.params);
	res.end();
});

http.createServer(server.route).listen(8080);
