function Group(name, roles) {
	roles = roles || {};
	if(Group.all[name]) {
		throw "Group Same Name Error";
	} else {
		Group.all[name] = this;
	}
	this.roles = [];
	for(var model in roles) {
		if(roles.hasOwnProperty(model)) { 
			for(var operation in roles[model]) {
				if (roles[model].hasOwnProperty(operation)) {
					this.roles.push(model + ":" + operation);
				}
			}
		}
	}
}

Group.all = {};

module.exports = Group;
