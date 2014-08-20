function Group(name, permissions) {
	if (!(this instanceof Group)) {
		return new Group(name, permissions);
	}
	if(Group.all_groups[name]) {
		throw "Group Same Name Error";
	} else {
		Group.all_groups[name] = permissions;
	}
}

Group.all_groups = {};

module.exports = Group;

