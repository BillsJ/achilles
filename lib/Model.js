var Obj = require("./Object");
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
/*var status = {
	0: UNSAVED,
	1: SAVED,
	2: MODIFIED,
	3: CONFLICTED
};*/

function Model() {
	Obj.call(this);

	this.define(this.constructor.idAttribute, String);
	this.define("permissions", Obj, {virtual:true});
	//	this.define("status", Number, {virtual:true});

	this._refs = {};
	
	if(!this.constructor.collection && this.constructor.connection) {
		this.constructor.collection = "PENDING";
		this.constructor.collection = this.constructor.connection.setup(this.constructor.name);
	}

	this.changes = [];

	this.on("change", function(key) {
		if(key !== "_id") {
			this.changes.push(key);
		}
	});
}

util.inherits(Model, Obj);

/**
 * Returns the address of a given model
 */
Model.prototype.getURL = function() {
	if(!this.container) {
		return (this.constructor.collection || "") + "/" + (this[this.constructor.idAttribute] || "");
	} else if(this.container instanceof Array) {
		return this.container.container.getURL() + "/" + this.container.containerProp + (this[this.constructor.idAttribute] ? "/" + this[this.constructor.idAttribute] : "");
	} else {
		return this.container.getURL() + "/" + this.containerProp + (this[this.constructor.idAttribute] ? "/" + this[this.constructor.idAttribute] : "");
	}
};

["save", "refresh", "del"].forEach(function(name) {
	Model.prototype[name] = function() {
		var container = this;
		while(container.constructor.connection === undefined) {
			container = container.container;
		}
		return container.constructor.connection[name].apply(this, arguments);
	};
});

Model.prototype.ref = function(property, model) {
	if(model instanceof Array) {
		this.define(property, [String]);
	} else {
		this.define(property, String);
	}
	this._refs[property] = model;
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

Model.get = function() {
	var Class = this;
	if(this.connection && !this.collection) {
		return this.connection.get.apply(this, arguments);
	}
	return this.connection.get.apply(this, arguments);
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
		if (n._refs.hasOwnProperty(key)) {
			tree[key] = n._refs[key];
		}
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
		if(n._type[key] instanceof Array && n._type[key][0].prototype instanceof Obj) {
			tree[key] = n._type[key][0];
			var subtree = n._type[key][0].getSubDocTree();
			for(var subkey in subtree) {
				if (subtree.hasOwnProperty(subkey)) {
					tree[key + "." + subkey] = subtree[subkey];
				}
			}
		}
	}
	return tree;
};

Model.idAttribute = "_id";

module.exports = Model;
