var accepts = require("accepts");
var redirect = require("response-redirect");
var SimpleRouter = require("simple-router");
var util = require("util");

function Router() {
	SimpleRouter.call(this);
	this.formatters = {};

	this.use(function(req, res, next) {
		req.accepts = accepts(req);
		res.redirect = redirect;
		next();
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

Router.prototype.server = function() {
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
	this.delete.apply(arguments);
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
