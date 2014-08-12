var pathToRegex = require("path-to-regexp");
var url = require("url");
var accepts = require("accepts");
var redirect = require("response-redirect");

function Router() {
	this._events = [];
	this.formatters = {};
	this.route = this.route.bind(this);
}

Router.prototype.addFormatter = function(from, to, stream) {
	if(!this.formatters[from]) {
		this.formatters[from] = {};
	}
	this.formatters[from][to] = stream;
	for(var f in this.formatters[to]) {
		var v = this.formatters[to][f];
		this.addFormatter(from, f, function() {
			stream()
				.pipe(v());
		});
	}
};

Router.prototype.on = function(listener) {
	this._events.push(listener);
};

Router.prototype.use = function(url, listener) {
	var keys = [];
	if(typeof url === "function" || url instanceof Router) {
		listener = url;
		var regex = new RegExp(".*", "g");
	} else {
		if(listener instanceof Router) {
			var original = url;
			url += "/:foo*";
		}
		var regex = pathToRegex(url, keys);
	}

	if(listener instanceof Router) {
		listener = listener.route;
	}

	this.on(function(req, res, next) {
		if(regex.test(req.url)) {
			var values = regex.exec(req.url);
			var obj = {};
			keys.forEach(function(key, i) {
				obj[key.name] = values[i+1];
			});
			req.params = obj;
			if(original) {
				req.url = req.url.slice(original.length);
				if(req.url === "") {
					req.url = "/";
				}
			}
			listener(req, res, next);
		} else {
			next();
		}
	});
};

Router.prototype.route = function(req, res, cb) {
	var i = 0;
	if(!req.query) { // Ensure req.query is not set twice (by achille.Router using achilles.Router)
		var u = url.parse(req.url, true);
		req.query = u.query; // Sets req.query
		req.url = u.pathname; // Strip queries off url
		req.originalUrl = u.href; // Original URL
	}
	/**
	 * Content Negotiation
	 */
	if(!req.accepts) {
		req.accepts = accepts(req);
		res.redirect = redirect;
	}
	var next = (function(err) {
		if(err) {
			console.log(err);
			throw err;
		} else if(this._events.length != i) {
			i++;
			this._events[i - 1].apply(this, [req, res, next]);
		} else if(cb) {
			cb();
		} else {
			res.writeHead(404);
			res.end();
		}
	}).bind(this);

	next();
};

["GET", "POST", "PUT", "DELETE", "PATCH"].forEach(function(method) {
	Router.prototype[method === "DELETE" ? "del" : method.toLowerCase()] = function(url, fn) {
		this.use(url, function(req, res, next) {
			if(req.method === method) {
				fn.apply(this, Array.prototype.slice.call(arguments));
			} else {
				next();
			}
		});
	};
});

Router.prototype.view = function(url, view) {
	this.get(url, function(req, res, cb) {
		if(req.accepts.types("html")) {
			res.end(view({
				params: req.params,
				query: req.query
			}));
		} else {
			cb();
		}
	});
};

module.exports = Router;
