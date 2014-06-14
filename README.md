achilles
========

A lightweight framework for structured web applications.

## Introduction
### Install
```bash
npm install achilles --save
```

### Why yet another framework?
The internet is populated with so many client-side frameworks from Backbone.js to Angular.js to React.js to Ractive.js to Vue.js. Why yet another framework? achilles was born out of the need to:
- Have a lightweight framework, that could work with **all** templating languages including asyncronous templates, and d3 graphs
- Have an API which was consistent with Node.js, for instance: `template` and `templateSync`; the of an Node's EventEmitter as the base for `achilles.Object`
- The choice of Node's `util.inherits` method over the horrific `.extend` pattern seen in many other frameowrks
- The necessity for a strong-typed object system, that was based `util.inherits`
- The seperation of presentation and content (i.e. the seperation of HTML, CSS, JS), which is a principle Angular.js et al. so keenly violate
- Consistent naming structure: classes should be capitalised; everything else including nampespaces should not. An example of this is Node's `events` module.

## API

### achilles.Object
Inheriting from events.EventEmitter, achilles.Object provides an object-orientated structure for classes:
```js
var achilles = require("achilles");
var util = require("util");

function Person(name) {
    this.define("name", String);
    this.define("height", Number);
    this.define("dataOfBirth", Date);
    this.define("alive", Boolean);
    
    this.name = name;
}

util.inherits(Person, achilles.Object);

Person.prototype.reset = function() {
    this.height = 0;
    this.alive = true;
};

```

### achilles.EventEmitter
Inheriting from achilles.Object, and therefore events.EventEmitter, achilles.EventEmitter provides an interface to attach events to a given element, and its children via event delegation.

```js
var achilles = require("achilles");

var Main = new achilles.EventEmitter(document.querySelector("main"));

Main.on("click button.submit", function(e) {
    // A button with the class `submit`, inside `<main>`, was clicked
});

Main.on("click", function(e) {
    // The main element was clicked
});
```

