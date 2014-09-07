var Router = require("./Router");
var util = require("util");
var HTTPError = require("node-http-error");
var through = require("through2");
var JSONStream = require("JSONStream");

/**
   @class Bridges a model with a client
*/

function Service(model, options) {
	Router.call(this, options);
	/**
	 * process.nextTick allows you add your own
	 * authentication or formatter functions
	 */
	process.nextTick(function() {
		var tree = model.getTree();
		Object.keys(tree).forEach(function(key) {
			var base = key.split(".");
			var baseURL = "";
			if(base !== [""]) {
				base.forEach(function(part, i) {
					if(part !== "") {
						if(i === 0) {
							baseURL += "/:base";
						} else {
							baseURL += "/:" + base[i-1];
						}
						baseURL += "/" + part;
					}
				}.bind(this));
			}
			this.get(baseURL || "/", function(req, res) {
				if(baseURL === "") {
					if(!req.user || req.user.can(tree[key], "get")) {
						model.get(req.query) // req.query can contain options such as `limit` or `skip`
							.pipe(JSONStream.stringify())
							.pipe(res);
					} else {
						model.getByIds(req.user.getAllAccessible(tree[key], "get"))
							.pipe(JSONStream.stringify())
							.pipe(res);
					}
				} else {
					if(!req.user || req.user.can(tree[key], "get")) {
						var nova = new model();
						nova[model.idAttribute] = req.params.base;
						for(var i = 0; i < base.length - 1; i++) {
							nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]()];
							nova = nova[base[i]][0];
							nova[model.iAttribute] = req.params[base[i]];
						}
						nova.refresh(base[base.length-1])
						//						.pipe(through.obj(transform))
						//						.pipe(JSONStream.stringify())
							.pipe(res);
					} else {
						var nova = new model();
						nova[model.idAttribute] = req.params.base;
						if(baseURL !== "") {
							for(var i = 0; i < base.length - 1; i++) {
								nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]];
								nova = nova[base[i]][0];
								nova[nova.constructor.idAttribute] = req.params[base[i]];
							}
						}
						nova[base[base.length-1]] = [];
						var n = req.user.getAllAccessible(tree[key], "get");
						if(n.length !== 0) {
							var str = new JSONStream.stringify();
							var i = 0;
							n.forEach(function(id) {
								var y = new tree[key]();
								nova[base[base.length-1]].push(y);
								y[y.constructor.idAttribute] = id;
								y.refresh(function(err, y) {
									if(err) {
										return str.emit("error", err);
									}
									str.write(y.toJSON());
									i++;
									if(i === n.length) {
										str.end();
									}
								});
							});
							str.pipe(res);
						} else {
							res.end("[]");
						}
					}
				}
			});
			this.get(baseURL + "/:" + (baseURL !== "" ? base[base.length -1] : "base"), function(req, res) {
				var nova = new model();
				nova[model.idAttribute] = req.params.base;
				if(baseURL !== "") {
					for(var i = 0; i < base.length; i++) {
						nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]];
						nova = nova[base[i]][0];
						nova[nova.constructor.idAttribute] = req.params[base[i]];
					}
				}
				nova.refresh(function(err, doc) {
					if(err) {
						res.error(err);
					}
					res.end(JSON.stringify(doc.toJSON()));
				});
			});
			this.post(baseURL || "/", function(req, res) {
				if(req.user && !req.user.can(tree[key], "post")) {
					return res.error(new HTTPError(401));
				}
				var nova = new model();
				nova[model.idAttribute] = req.params.base;
				for(var i = 0; i < base.length; i++) {
					nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]()];
					nova = nova[base[i]][0];
					nova[model.iAttribute] = req.params[base[i]];
				}
				nova.save(function(err, doc) {
					if(err) {
						return res.error(err);
					}
					res.writeHead(201);
					if(doc[doc.constructor.idAttribute]) {
						var resp = {};
						resp[nova.constructor.idAttribute] = doc[nova.constructor.idAttribute];
						res.end(JSON.stringify(resp));
					} else {
						res.end();
					}
				});
			});
			this.put(baseURL + "/:" + base[base.length], function(req, res) {
				if(req.user && !req.user.can(tree[key], "put", req.params[req.params.length-1])) {
					return res.error(new HTTPError(401));
				}
				var nova = new model();
				nova[model.idAttribute] = req.params.base;
				for(var i = 0; i < base.length; i++) {
					nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]];
					nova = nova[base[i]][0];
					nova[model.iAttribute] = req.params[base[i]];
				}
				nova.save(function(err) {
					if(err) {
						return res.error(err);
					}
					res.writeHead(204);
					res.end();
				});
			});
			this.del(baseURL + "/:" + base[base.length], function(req, res) {
				if(req.user && !req.user.can(tree[key], "del", req.params[req.params.length-1])) {
					return res.error(new HTTPError(401));
				}
				var nova = new model();
				nova[model.idAttribute] = req.params.base;
				for(var i = 0; i < base.length; i++) {
					nova[base[i]] = new tree[base.slice(0, i + 1).join(".")];
					nova = nova[base[i]];
					nova[model.iAttribute] = req.params[base[i]];
				}
				nova.del(function(err) {
					if(err) {
						return res.error(err);
					}
					res.writeHead(204);
					res.end();
				});
			});
		}.bind(this));
	}.bind(this));
}

util.inherits(Service, Router);

module.exports = Service;
