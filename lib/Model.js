var Object = require("./Object");
var util = require("util");
var request = require("request");
var url = require("url");

/**
 * A model is a class to represent a row
 * in a database, for example a row in Excel.
 * Unlike a regular class this means that a
 * model can be saved, using .save().
 */
function Model() {
	Object.call(this);
	this.define("_id", String);
	this._refs = {};
}

util.inherits(Model, Object);

/**
 * Returns the address of a given model
 */
Model.prototype.getURL = function() {
	return this.constructor.URL + "/" + this._id;
};

Model.prototype.save = function(cb) {
	/**
	 * Lo! Behold! The callback-stream pattern!
	 * Because of the nature of request you can use
	 * both stream and callbacks. Its methods, you see,
	 * return streams but also accept callbacks. These
	 * methods in achilles.Model are desgined to work in
	 * exactly the same way.
	 */
	return request.put({json: this.toJSON(), url:this.getURL()}, cb && (function(err, res, body) {
		cb(err, this);
	}).bind(this));
	/**
	 * N.B. this.getURL() must be called after this.toJSON()
	 * because in some subclasses this.toJSON() may set an _id
	 * if one has not been defined. And this.getURL() relies on
	 * an _id being defined.
	 */
};

Model.prototype.ref = function(property, model) {
	if(model instanceof Array) {
		this.define(property, [String]);
	} else {
		this.define(property, String);
	}
	this._refs[property] = model;
};

Model.prototype.refresh = function(cb) {
	return request.get({url: this.getURL(), json:true}, (function(err, res, body) {
		if(!err) {
			this._data = body;
		}
		if(cb) {
			cb(err, this); // Pass back error and the model to callback
		}
	}).bind(this));
};

Model.prototype.del = function(cb) {
	return request.del({url: this.getURL(), json:true}, cb && function(err, res, body) {
		cb(err, body);
	});
};

Model.getById = function(options, cb) {
	var _id = options._id || options;
	var nova = new this();
	nova._id = _id;
	return nova.refresh(cb);
};

Model.delById = function(options, cb) {
	var _id = options._id || options;
	var nova = new this();
	nova._id = _id;
	return nova.del(cb);
};

Model.getAllDocsURL = function() {
	return url.parse(this.constructor.URL);
};

Model.find = function(limit, cb) {
	if(typeof limit === "function") {
		cb = limit;
		limit = undefined;
	}
	var URL = this.getAllDocsURL();
	delete URL.search;
	if(limit) {
		URL.query.limit = limit;
	}
	return request.get({url: url.format(URL), json:true}, cb && function(err, res, body) {
		cb(err, body);
	});
};

Model.getRefDocTree = function() {
	var n = new this();
	var tree = {};
	for(var key in n._refs) {
		tree[key] = n._refs[key];
	}
	return tree;
};

Model.getSubDocsTree = function() {
	var n = new this();
	var tree = {};
	for(var key in n._type) {
		if(n._type[key] instanceof Array && n._type[key][0].prototype instanceof Object) {
			tree[key] = n._type[key][0];
		}
	}
	return tree;
};


module.exports = Model;
