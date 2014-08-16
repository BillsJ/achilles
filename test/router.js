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

var server;

describe("achilles.Router.route", function() {
	before(function(done) {
		server = http.createServer(router.route).listen(5000, done);
	});

	it("should set res.redirect", function(done) {
		router.get("/", function(req, res) {
			res.redirect("/login");
		});
		request.get({url: "http://localhost:5000/", followRedirect:false}, function(err, res, body) {
			assert(res.statusCode === 302);
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