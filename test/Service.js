var achilles = require("../");
var assert = require("assert");
var request = require("request");
var Album = require("./Album");
var bodyParser = require("body-parser");
var nock = require("nock");
var express = require("express");

var service = new achilles.Service(Album);
var server;

describe("achilles.Service", function() {
	before(function(cb) {
		var app = express();
		app.use(bodyParser.json());
		app.use(service);
		server = app.listen(5000, cb);
	});
	it("should work with /", function(done) {
		request.get({url:"http://localhost:5000/", json:true}, function(err, res, body) {
			if(err) {
				throw err;
			}
			assert(typeof body[0] === "object");
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
	it("should support document creation", function(cb) {
		request.post({url:"http://localhost:5000/", json:{title:"Because we're worth it"}}, function(err, res, body) {
			if(err) {
				throw err;
			}
			assert(body.id !== undefined);
			cb();
		});
	});
	it("should support document updates", function(cb) {
		request.put({url:"http://localhost:5000/1", json:{title:"Because we're worth it"}}, function(err, res, body) {
			if(err) {
				throw err;
			}
			assert(res.statusCode === 204);
			cb();
		});
	});
	it("should support document deletion", function(cb) {
		request.del("http://localhost:5000/1", function(err, res, body) {
			assert(res.statusCode === 204);
			cb();
		});
	});
	it("should work with nested resources", function(cb) {
		request.get({url:"http://localhost:5000/1/photos", json:true}, function(err, res, body) {
			assert(body.length === 50);
			cb();
		});
	});
	it("should work with getting nested resources", function(cb) {
		nock('http://jsonplaceholder.typicode.com')
			.get('/albums/1/photos/1')
			.reply(200, {
				"albumId": 1,
				"id": 1,
				"title": "accusamus beatae ad facilis cum similique qui sunt",
				"url": "http://placehold.it/600/92c952",
				"thumbnailUrl": "http://placehold.it/150/30ac17"
			})
			.post('/albums/1/photos', {})
			.reply(201, {
				"id":"51"
			});
		request.get({url:"http://localhost:5000/1/photos/1", json:true}, function(err, res, body) {
			assert(body.title === "accusamus beatae ad facilis cum similique qui sunt");
			cb();
		});
	});
	it("should work with creating nested resources", function(cb) {
		request.post({url:"http://localhost:5000/1/photos", json:{title:"Hi"}}, function(err, res, body) {
			assert(res.statusCode === 201);
			assert(body.id === "51");
			cb();
		});
	});
	after(function(cb) {
		server.close(cb);
	});
});

describe("achilles.Service (Permissions System)", function() {
	before(function(cb) {
		nock.restore();
		service = new achilles.Service(Album);

		var app = express();

		app.use(function(req, res, next) {
			req.user = new achilles.User();
			req.user.roles = ["Album:get:5", "Album:get:6"];
			next();
		});

		app.use(service);
		
		server = app.listen(5000, cb);
	});
	it("should only return records permission has been granted to see", function(cb) {
		request.get({url:"http://localhost:5000/", json:true}, function(err, res, body) {
			if(err) {
				throw err;
			}
			assert(body.length === 2);
			cb();
		});
	});
	it("should deny those that don't have permission to get", function(cb) {
		request.get({url:"http://localhost:5000/1/photos", json:true}, function(err, res, body) {
			assert(body.length === 0);
			cb();
		});
	});
	it("should deny those that don't have permission to del", function(cb) {
		request.del({url:"http://localhost:5000/1/photos/1", json:true}, function(err, res, body) {
			assert(res.statusCode === 401);
			cb();
		});
	});
	after(function(cb) {
		server.close(cb);
	});
});
