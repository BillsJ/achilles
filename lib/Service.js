var Router = require("./Router");
var util = require("util");

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
			if(req.user.can(model, "get")) {
				req
					.pipe(model.find(req.query))
					.pipe(res);
			} else {

			}
		});
		this.get("/:_id", function(req, res) {
			if(req.user.can(model, "get", req.params._id)) {
				req
					.pipe(model.getById(req.params))
					.pipe(res);
			} else {

			}
		});
		this.post("/", function(req, res) {
			/*
			 * `nova` means `new` Latin & `new` is a
			 * reserved keyword so you know
			 */
			var nova = new model();
			for(var key in req.body) {
				nova[key] = req.body[key];
			}
			nova.save().pipe(res);
		});
		this.put("/:_id", function(req, res) {
			var nova = new model();
			nova._id = req.params._id;
			for(var key in req.body) {
				nova[key] = req.body[key];
			}
			nova.save().pipe(res);
		});
		this.del("/:_id", function(req, res) {
			model.delById(req.params).pipe(res);
		});
		var subdocs = model.getSubDocsTree();
		Object.keys(subdocs).forEach((function(key) {
			var value = subdocs[key];

			this.get("/:_base/" + key, function(req, res) {
				model.subdoc(key, req.params._base)
					.pipe(res);
			});
			this.get("/:_base/" + key + "/:_id", function(req, res) {
				model.subdoc(key, req.params._base, req.params._id)
					.pipe(res);
			});
			this.post("/:_base/" + key + "/", function(req, res) {
				var z = new value();
				for(var k in req.body) {
					z[k] = req.body[z];
				}
				model.subdoc(key, req.params._base, z.toJSON())
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
