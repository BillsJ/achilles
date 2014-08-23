var Router = require("./Router");
var util = require("util");
var HTTPError = require("node-http-error");

/**
   @class Bridges a model with a client
*/

function Service(model) {
	Router.call(this);
	/**
	 * process.nextTick allows you add your own
	 * authentication or formatter functions
	 */
	process.nextTick((function() {
		/**
		 * Throughout achilles.Service, the streaming API
		 * is used because it is so much more efficent.
		 * This is one of achilles.Services' major advantages.
		 */
		this.get("/", function(req, res) {
			if(!req.user || req.user.can(model, "get")) {
				model.get(req.query) // req.query can contain options such as `limit` or `skip` 
					.pipe(through.obj(function(doc, enc, cb) {
						doc = doc.toJSON();
						obj.put = req.user.can(model, "put", doc._id);
						obj.del = req.user.can(model, "del", doc._id);
						this.push(doc);
						cb();
					}))
					.pipe(res);
			} else {
				throw HTTPError(401); // 401 === Unauthorised
			}
		});
		this.get("/:_id", function(req, res) {
			if(!req.user || req.user.can(model, "get", req.params._id)) {
				model.getById(req.params, function(err, doc) {
					doc = doc.toJSON();
					doc.put = req.user.can(model, "put", doc._id);
					doc.del = req.user.can(model, "del", doc._id);
					res.write(JSON.stringify(doc));
				});
			} else {
				throw HTTPError(401);
			}
		});
		this.post("/", function(req, res) {
			if(!req.user || req.user.can(model, "post")) {
				/*
				 * `nova` means `new` Latin & `new` is a
				 * reserved keyword so you know
				 */
				model.parse(req.body)
					.save()
					.pipe(res);
			} else {
				throw HTTPError(401);
			}
		});
		this.put("/:_id", function(req, res) {
			if(!req.user || req.user.can(model, "put", req.params._id)) {
				var nova = model.parse(req.body);
				nova._id = req.params._id;
				nova.save()
					.pipe(res);
			} else {
				throw HTTPError(401);
			}
		});
		this.del("/:_id", function(req, res) {
			if(!req.user || req.user.can(model, "del", req.params._id)) {
				model.delById(req.params)
					.pipe(res);
			} else {
				throw HTTPError(401);
			}
		});
		var subdocs = model.getSubDocsTree();
		Object.keys(subdocs).forEach((function(key) {
			var value = subdocs[key];

			this.get("/:_base/" + key, function(req, res) {
				model.getSubDoc(key, req.params._base)
					.pipe(through.obj(function(doc, enc, cb) {
						doc = doc.toJSON();
						obj.put = req.user.can(value, "put", doc._id);
						obj.del = req.user.can(value, "del", doc._id);
						this.push(doc);
						cb();
					}))
					.pipe(res);
			});

			this.get("/:_base/" + key + "/:_id", function(req, res) {
				model.getSubDoc(key, req.params._base, req.params._id)
					.pipe(res);
			});

			this.post("/:_base/" + key + "/", function(req, res) {
				var z = value.parse(req.body);
				model.postSubDoc(key, req.params._base, z.toJSON())
					.pipe(res);
			});

			this.put("/:_base/" + key + "/" + "/:_id", function(req, res) {
				var nova  = new model();
				nova._id = req.params._base;
				nova.refresh(function() {
					var n = new value();
					n._id = req.params._id;
					for(var key in req.body) {
						n[key] = req.body[key];
					}
					nova[key].push(n);
					nova.save().pipe(res);
				});
			});
		}).bind(this));
	}).bind(this));
}

util.inherits(Service, Router);

module.exports = Service;
