var achilles = require("../index.js");
var util = require("util");
var assert = require("assert");
var json2csv = require("json2csv-stream");
var ogg = require("ogg");
var vorbis = require("vorbis");
var lame = require("lame");
var request = require("request");
var http = require("http");

var router = new achilles.Router();

describe("achilles.Router.addFormatter", function() {
    it("should store formatters in this.formatters", function() {
		router.addFormatter("JSON", "CSV", json2csv);
		assert(router.formatters["JSON"]["CSV"] === json2csv);
    });

	it("should automatically use multiple converters if it can't find a single converter", function() {
		router.addFormatter("PCM", "VORBIS", vorbis.Encoder);
		router.addFormatter("VORBIS", "OGG", ogg.Encoder);
		router.addFormatter("MP3", "PCM", lame.Decoder);
		assert(router.formatters["MP3"]["OGG"]);
	});
});

var router, server;

describe("achilles.Router.addAuthenticator", function() {
	before(function(done) {
		var BasicStrategy = require("passport-http").BasicStrategy;
		router = new achilles.Router();
		router.addAuthenticator(new BasicStrategy(function(username, password, cb) {
			cb("Username or Password is invalid");
		}));
		router.use(router.authenticate("http"));
		server = http.createServer(router.server()).listen(5000, done);
	});

	it("should store authenticators in this.authenticators", function() {
		assert(router.authenticators.basic !== undefined);
	});

	after(function(done) {
		server.close(done);
	});
});

describe("achilles.Router", function() {
	before(function(done) {
		router = new achilles.Router({silent:true});
		server = http.createServer(router.server()).listen(5000, done);

		router.get("/", function(req, res) {
			res.redirect("/login");
		});

		router.get("/accepts", function(req, res) {
			assert(req.accepts !== undefined);
			res.end();
		});

		router.get("/errorhead", function(req, res) {
			throw new Error();
		});
	});

	it("should set res.redirect", function(done) {
		request.get({url: "http://localhost:5000/", followRedirect:false}, function(err, res, body) {
			assert(res.statusCode === 302);
			done();
		});
	});

	it("should set req.accepts", function(done) {
		request.get({url: "http://localhost:5000/accepts", followRedirect:false}, function(err, res, body) {
			done();
		});
	});
	
	it("should not crash; when an error is thrown", function(done) {
		request.get({url: "http://localhost:5000/errorhead", followRedirect:false}, function(err, res, body) {
			assert(res.statusCode === 500);
			done();
		});
	});

	after(function(done) {
		server.close(done);
	});
});

describe("achilles.Router.use", function() {
	before(function(done) {
		var router = new achilles.Router();
		var subrouter = new achilles.Router();
		subrouter.get("/", function(req, res) {
			res.end("index");
		});
		subrouter.get("/hi", function(req, res) {
			res.end("hi");
		});
		router.use("/sub", subrouter.server());
		server = http.createServer(router.server()).listen(5000, done);
	});

	it("should work with subrouters", function(done) {
		request.get("http://localhost:5000/sub/hi", function(err, res, body) {
			assert(body === "hi");
			done();
		});
	});

	it("should be able to route to the / of a subrouter", function(done) {
		request.get("http://localhost:5000/sub", function(err, res, body) {
			assert(body === "index");
			done();
		});
	});

	after(function(done) {
		server.close(function(err) {
			done(err);
		});
	});
});
