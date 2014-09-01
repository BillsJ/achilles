var achilles = require("../");
var assert = require("assert");
var http = require("http");
var request = require("request");
var Album = require("./Album");

var service = new achilles.Service(Album);

describe("achilles.Service", function() {
	before(function(cb) {
		http.createServer(service.server()).listen(5000, cb);
	});
	it("should work with /", function(done) {
		request.get({url:"http://localhost:5000/", json:true}, function(err, res, body) {
			if(err) {
				throw err;
			}
			assert(body.length === 100);
			done();
		});
	});
	it("should work with /:id", function(done) {
		request.get("http://localhost:5000/1", function(err, res, body) {
			body = JSON.parse(body);
			assert(body.title === "quidem molestiae enim");
			done();
		});
	});
});
