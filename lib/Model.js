var Object = require("./Object");
var util = require("util");
var request = require("request");
var url = require("url");
var JSONStream = require("JSONStream");
var stream = require("stream");

/**
 * A model is a class to represent a row
 * in a database, for example a row in Excel.
 * Unlike a regular class this means that a
 * model can be saved, using .save().
 */
function Model(data) {
	Object.call(this);

	this.define(this.constructor.idAttribtue, String);
	this.define("permissions", Object, {virtual:true});

	this._refs = {};
}

util.inherits(Model, Object);

/**
 * Returns the address of a given model
 */
Model.prototype.getURL = function() {
	if(this.constructor.URL) {
		return this.constructor.URL + "/" + (this[this.constructor.idAttribute] || "");
	} else {
		return this.container.getURL() +  (this[this.constructor.idAttribute] ? "/" + this[this.constructor.idAttribute] : "");
	}
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
	if(this[this.constructor.idAttribute]) {
		var method = "put";
	} else {
		var method = "post";
	}
	
	return request({method:method, json: this.toJSON(), url:this.getURL()}, cb && function(err, res, body) {
		if(!this[this.constructor.idAttribute]) {
			this[this.constructor.idAttribute] = body[this.constructor.idAttribute];
		}
		cb(err, this);
	}.bind(this));

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

Model.prototype.del = function(cb) {
	return request.del({url: this.getURL(), json:true}, cb && function(err, res, body) {
		cb(err, body);
	});
};

Model.prototype.refresh = function(prop, cb) {
	if(typeof prop === "function") {
		cb = prop;
		prop = "";
	}
	return request.get({url: this.getURL() + (prop ? "/" + prop : ""), json:true}, function(err, res, body) {
		if(!err) {
			this._data = body;
		}
		if(cb) {
			cb(err, this); // Pass back error and the model to callback
		}
	}.bind(this));
};

Model.getById = function(options, cb) {
	var Class = this;
	var _id = options._id || options;
	var nova = new Class();
	nova[this.idAttribute] = _id;
	return nova.refresh(cb);
};

Model.getByIds = function(ids) {
	var ret = new stream.PassThrough({objectMode:true});
	var i = 0;
	ids.forEach(function(id) {
		this.getById(id, function(err, doc) {
			i++;
			if(err) {
				return ret.emit("error", err);
			}
			ret.write(doc);
			if(i === ids.length) {
				ret.end();
			}
		});
	}.bind(this));
	return ret;
};

Model.delById = function(options, cb) {
	var Class = this;
	var _id = options._id || options;
	var nova = new Class();
	nova._id = _id;
	return nova.del(cb);
};

Model.getAllDocsURL = function() {
	return url.parse(this.URL);
};

Model.get = function(options, cb) {
	if(typeof options === "function") {
		cb = options;
		options = undefined;
	}
	var queryString = "";
	for(var key in options) {
		if(!queryString) {
			queryString += "?";
		} else {
			queryString += "&";
		}
		queryString += key + "=" + options[key];
	}
	return request.get({url: this.URL + queryString, json:true}, cb && function(err, res, body) {
		cb(err, body);
	}.bind(this))
		.pipe(JSONStream.parse("*"));
};

Model.getSubDoc = function(base, key, sub) {
	return request.get({url: this.URL + "/" + base + "/" + key + ("/" + sub || ""), json:true})
		.pipe(JSONStream.parse("*"));
};

Model.getRefDocTree = function() {
	var Class = this;
	var n = new Class();
	var tree = {};
	for(var key in n._refs) {
		tree[key] = n._refs[key];
	}
	return tree;
};

Model.getTree = function() {
	var tree = this.getSubDocTree();
	tree[""] = this;
	return tree;
};

Model.getSubDocTree = function() {
	var Class = this;
	var n = new Class();
	var tree = {};
	for(var key in n._type) {
		if(n._type[key] instanceof Array && n._type[key][0].prototype instanceof Object) {
			tree[key] = n._type[key][0];
			var subtree = n._type[key][0].getSubDocTree();
			for(var subkey in subtree) {
				tree[key + "." + subkey] = subtree[subkey];
			}
		}
	}
	return tree;
};

Model.idAttribute = "_id";

module.exports = Model;
