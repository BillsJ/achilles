var accepts = require("accepts");
var redirect = require("response-redirect");
var SimpleRouter = require("simple-router");
var util = require("util");
var flash = require("connect-flash");

function Router() {
	SimpleRouter.call(this);
	this.formatters = {};
	this.authenticators = {};

	this.use(flash());

	this.use(function(req, res, next) {
		try {
			if(!req.accepts) {
				req.accepts = accepts(req);
				res.redirect = redirect;

				/**
				 * Add res.setLink() mixin
				 */
				res.setLink = function(key, value) {
					var links = li.parse(res.getHeader("Link"));
					links[key] = value;
					res.setHeader("Link", li.stringify(links));
				}
			}
			next();
		} catch(e) {
			/*
			 * It is essential to catch every single error
			 * Whether in debugging or not
			 * E.g. it may be a database failure
			 * E.g. which may happen when you're presenting at a conference
			 * You don't want the server to bail out on you
			 */
			res.writeHead(e.code);
			res.end(e.message || e.toString());
		}
	});
}

util.inherits(Router, SimpleRouter);

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

/**
 * Authentication
 * ===
 * Achilles is backward compatible with passsport authentication
 * strategies so it comes supported with everything from Facebook to
 * GitHub authentication out of the box really
 */

Router.prototype.addAuthenticator = function(strategy) {
	this.authenticators[strategy.name] = strategy;
};

Router.prototype.authenticate = function(strategy, failureRoute) {
	return (function(req, res, next) {
		var a = Object.create(this.authenticators[strategy]);
		a.fail = function(info) {
			//req.flash(info);
			res.redirect(failureRoute || "/login");
		};
		a.error = function(err) {
			res.writeHead(500);
			res.end(err.toString());
		};
		a.success = function(user, info) {
			req.session.user = user;
			next();
		}
		a.authenticate(req);
	}).bind(this);
};

Router.prototype.server = function() {
//	console.log("Here");
	var sev = SimpleRouter.prototype.server.call(this);
	return function(req, res, next) {
		if(!req.url) {
			req.url = "/";
			req.originalUrl += "/";
			req.path += "/";
			req._parsedUrl.pathname += "/";
		}
		sev.apply(this, arguments);
	};
};

/*
 * Alias delete -> del
 */
Router.prototype.del = function() {
	this.delete.apply(this, arguments);
};

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
