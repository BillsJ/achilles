var request = require("request");
var JSONStream = require("JSONStream");

function Connection(url) {
	this.url = url;
	return this;
}

Connection.prototype.get = function(options, cb) {
	if(typeof options === "function") {
		cb = options;
		options = undefined;
	}
	var queryString = "";
	for(var key in options) {
		if (options.hasOwnProperty(key)) {
			if(!queryString) {
				queryString += "?";
			} else {
				queryString += "&";
			}
			queryString += key + "=" + options[key];
			}
	}
	return request.get({url: this.collection + queryString, json:true}, cb && function(err, res, body) {
		console.log(typeof body);
		console.log(this.parse);
		if(body) {
			body = body.map(this.parse.bind(this));
		}
		cb(err, body);
	}.bind(this))
		.pipe(JSONStream.parse("*"));
};

Connection.prototype.setup = function() {
	return this.url;
};

Connection.prototype.save = function(cb) {
	this.emit("save");
	/**
	 * Lo! Behold! The callback-stream pattern!
	 * Because of the nature of request you can use
	 * both stream and callbacks. Its methods, you see,
	 * return streams but also accept callbacks. These
	 * methods in achilles.Model are desgined to work in
	 * exactly the same way.
	 */
	var method = "";
	if(this[this.constructor.idAttribute]) {
		method = "put";
	} else {
		method = "post";
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

Connection.prototype.del = function(cb) {
	return request.del({url: this.getURL(), json:true}, cb && function(err, res, body) {
		cb(err, body);
	});
};

Connection.prototype.refresh = function(prop, cb) {
	if(typeof prop === "function") {
		cb = prop;
		return request.get({url: this.getURL(), json:true}, function(err, res, body) {
			if(!err) {
				this.parse(body);
			}
			if(cb) {
				cb(err, this); // Pass back error and the model to callback
			}
		}.bind(this));
	}
	return request.get({url: this.getURL() + "/" + prop, json:true}, function(err, res, body) {
		if(!err) {
			this[prop] = body;
		}
		if(cb) {
			cb(err, this); // Pass back error and the model to callback
		}
	}.bind(this));	
};

module.exports = Connection;
