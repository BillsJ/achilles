var accepts = require("accepts");
var redirect = require("response-redirect");
var SimpleRouter = require("simple-router");
var util = require("util");
var flash = require("connect-flash");
var HTTPError = require("node-http-error");

function Router(options) {
	SimpleRouter.call(this);
	this.formatters = {};
	this.authenticators = {};
	options = options || {};
	this.silent = options.silent || false;

	this.use(function(req, res, next) {
		if(!req.accepts) {
			req.accepts = accepts(req);
			res.redirect = redirect;
			res.error = function(err) {
				var status = err.code || err.status || 500;
				res.writeHead(status);
				res.end(err.message || err.toString());
				if(!options.silent) {
					console.log(err.stack);
				}
			};
		}
		next();
	});

	this.use(flash());
}

util.inherits(Router, SimpleRouter);

Router.prototype.addFormatter = function(from, to, stream) {
	if(!this.formatters[from]) {
		this.formatters[from] = {};
	}
	this.formatters[from][to] = stream;
	function formatAdd () {
		stream()
			.pipe(this.formatters[to][f]());
	}
	for(var f in this.formatters[to]) {
		if (this.formatters[to].hasOwnProperty(f)) {
			var v = this.formatters[to][f];
			this.addFormatter(from, f, formatAdd());
		}
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
	return function(req, res, next) {
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
		};
		a.authenticate(req);
	}.bind(this);
};

Router.prototype.server = function() {
	var server = SimpleRouter.prototype.server.call(this);
	var silent = this.silent;
	return function(req, res, next) {
		if(!req.url) {
			req.url = "/";
			req.originalUrl += "/";
			req.path += "/";
			req._parsedUrl.pathname += "/";
		}
		server(req, res, next || function(err) {
			if (!err) {
				// If no error, default to 404 (Not Found)
				err = new HTTPError(404);
			}
			/*
			 * Errors may contain a `code` or status property.
			 * This tells us the appropriate HTTP response code.
			 * If no error code, default to 500 (Internal Server Error).
			 */
			var status = err.code || err.status || 500;
			res.writeHead(status);
			res.end(err.message || err.toString());

			if(!(process.env.NODE_ENV === "production" && status >= 400 && status < 500) && !silent) {
				console.log(err.stack);
			}
		});
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
