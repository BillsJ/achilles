function Group(name, roles) {
	if(Group.all[name]) {
		throw "Group Same Name Error";
	} else {
		Group.all[name] = this;
	}
	this.roles = [];
	for(var model in roles) {
		for(var operation in roles[model]) {
			this.roles.push(model + ":" + operation);
		}
	}
}

Group.all = {};

module.exports = Group;
