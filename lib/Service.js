var express = require("express");
//var util = require("util");
//var HTTPError = require("node-http-error");
//var through = require("through2");
var JSONStream = require("JSONStream");

/**
   @class Bridges a model with a client
*/

function Service(Model, options) {
	var router = new express.Router(options);
	/**
	 * process.nextTick allows you add your own
	 * authentication or formatter functions
	 */

	var tree = Model.getTree();
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
		router.get(baseURL || "/", function(req, res) {
			var nova = new Model();
			if(baseURL === "") {
				if(!req.user || req.user.can(tree[key], "get")) {
					Model.get(req.query) // req.query can contain options such as `limit` or `skip`
						.pipe(JSONStream.stringify())
						.pipe(res);
				} else {
					Model.getByIds(req.user.getAllAccessible(tree[key], "get"))
						.pipe(JSONStream.stringify())
						.pipe(res);
				}
			} else {
				var i = 0;
				if(!req.user || req.user.can(tree[key], "get")) {
					nova[Model.idAttribute] = req.params.base;
					for(i = 0; i < base.length - 1; i++) {
						nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]()];
						nova = nova[base[i]][0];
						nova[Model.iAttribute] = req.params[base[i]];
					}
					nova.refresh(base[base.length-1])
					//						.pipe(through.obj(transform))
					//						.pipe(JSONStream.stringify())
						.pipe(res);
				} else {
					nova[Model.idAttribute] = req.params.base;
					if(baseURL !== "") {
						for(i = 0; i < base.length - 1; i++) {
							nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]()];
							nova = nova[base[i]][0];
							nova[nova.constructor.idAttribute] = req.params[base[i]];
						}
					}
					nova[base[base.length-1]] = [];
					var n = req.user.getAllAccessible(tree[key], "get");
					if(n.length !== 0) {
						var str = new JSONStream.stringify();
						i = 0;
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
		router.get(baseURL + "/:" + (baseURL !== "" ? base[base.length -1] : "base"), function(req, res) {
			var nova = new Model();
			nova[Model.idAttribute] = req.params.base;
			if(baseURL !== "") {
				for(var i = 0; i < base.length; i++) {
					nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]()];
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
		router.post(baseURL || "/", function(req, res) {
			if(req.user && !req.user.can(tree[key], "post")) {
				res.status(401);
				res.end();
			} else {
				var nova = new Model();
				nova[Model.idAttribute] = req.params.base;
				for(var i = 0; i < base.length; i++) {
					if(i === base.length -1) {
						nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")](req.body)];
					} else {
						nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]()];
					}
					nova = nova[base[i]][0];
					nova[Model.idAttribute] = req.params[base[i]];
				}
				nova.save(function(err, doc) {
					if(err) {
						return res.error(err);
					}
					res.writeHead(201);
					if(doc[doc.constructor.idAttribute]) {
						var resp = {};
						resp[doc.constructor.idAttribute] = doc[doc.constructor.idAttribute];
						res.end(JSON.stringify(resp));
					} else {
						res.end();
					}
				});
			}
		});
		router.put(baseURL + "/:" + base[base.length], function(req, res) {
			if(req.user && !req.user.can(tree[key], "put", req.params[req.params.length-1])) {
				res.status(401);
				res.end();
			} else {
				var nova = new Model();
				nova[Model.idAttribute] = req.params.base;
				for(var i = 0; i < base.length; i++) {
					if(i === base.length - 1) {
						nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")](req.body)];
					} else {
						nova[base[i]] = [new tree[base.slice(0, i + 1).join(".")]()];
					}
					nova = nova[base[i]][0];
					nova[Model.idAttribute] = req.params[base[i]];
				}
				nova.save(function(err) {
					if(err) {
						return res.error(err);
					}
					res.writeHead(204);
					res.end();
				});
			}
		});
		router.delete(baseURL + "/:" + base[base.length], function(req, res) {
			if(req.user && !req.user.can(tree[key], "del", req.params[req.params.length-1])) {
				res.status(401);
				res.end();
			} else {
				var nova = new Model();
				nova[Model.idAttribute] = req.params.base;
				for(var i = 0; i < base.length; i++) {
					nova[base[i]] = new tree[base.slice(0, i + 1).join(".")]();
					nova = nova[base[i]];
					nova[Model.iAttribute] = req.params[base[i]];
				}
				nova.del(function(err) {
					if(err) {
						return res.error(err);
					}
					res.writeHead(204);
					res.end();
				});
			}
		});
	});

	return router;
}

//util.inherits(Service, express.Router);

module.exports = Service;
