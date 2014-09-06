achilles [![NPM Module](http://img.shields.io/npm/v/achilles.svg?style=flat-square)](https://npmjs.org/package/achilles) [![NPM Module](http://img.shields.io/travis/TheMuses/achilles.svg?style=flat-square)](https://travis-ci.org/TheMuses/achilles) [![Code Climate](http://img.shields.io/codeclimate/github/TheMuses/achilles.svg)](https://codeclimate.com/github/TheMuses/achilles)

========

A lightweight framework for structured web applications. N.B: This is still a work in progress; help would greatly be appreciated, as would any ideas.

### Install
```bash
npm install achilles --save
```

### Usage: Browserify
achilles is designed to work seamlessly with achilles, simply do:
```js
var achilles = require("achilles");
```

### Why yet another framework?
The internet is populated with so many client-side frameworks from Backbone.js to Angular.js to React.js to Ractive.js to Vue.js. Why yet another framework? achilles was born from the need to:
- Have a lightweight framework, that could work with **all** templating languages including asyncronous templates, and d3 graphs
- Have an API which was consistent with Node.js, for instance: `template` and `templateSync`; the of an Node's EventEmitter as the base for `achilles.Object`
- The choice of Node's `util.inherits` method over the horrific `.extend` pattern seen in many other frameowrks
- The necessity for a strong-typed object system, that was based `util.inherits`
- The seperation of presentation and content (i.e. the seperation of HTML, CSS, JS), which is a principle Angular.js et al. so keenly violate
- Consistent naming structure: classes should be capitalised; everything else including nampespaces should not. An example of this is Node's `events` module.
- No need for boilerplate `window.addEventListener("load"...` or `$(document).ready()` code, thanks to an event-driven architecture

## API

### achilles.Object

#### Example
Inheriting from *events.EventEmitter*, *achilles.Object* provides an object-orientated structure for classes. To create a class called `Person` with properties such as `name`, `height`, `dateOfBirth`, `alive` and `children`, as well as methods such as `reset()`:

```js
var util = require("util");

function Person(name) {
    this.define("name", String);
    this.define("height", Number);
    this.define("dataOfBirth", Date);
    this.define("alive", Boolean);
    this.define("children", [Person]);

    this.name = name;
}

util.inherits(Person, achilles.Object);

Person.prototype.reset = function() {
    this.height = 0;
    this.alive = true;
};

```

The last part makes *MyClass* inherit all of *achilles.Object*'s methods, which are used in the following sections to declare properties.

#### Defining properties
Inside the construcutor use the *define* method, which is inherited from *achilles.Object* to declare properties:
```js
function Person(name) {
    this.define("name", String);
    this.name = name;
}
```

The method *define* accepts two parameters: first a property name, and second a type. 

##### Defining properties as arrays
To define properties as arrays of a type, put the type in an array, e.g.:

```js
this.define("favouriteColours", [String]); // An array of Strings
this.define("favouriteNumbers", [Number]); // An array of Numbers
this.define("children", [Person]); // An array of People
```

To instantiate a class, do:
```js
var George = new Person("George");
```

To get a property, do:
```js
George.age;
```

To set a  property, do:
```js
George.age = 13;
```

A TypeError will be raised if a property is set to a value that does not match the type.

### achilles.View
#### Example
*achilles.View* inherits from *achilles.Object*, and provides a beautifully-designed jQuery-less interface to listen to DOM events. Not only that, *achilles.View* is a sturdy foundation on to of which other *achilles* classes are created.

```js
var MyApp = new achilles.View("main"); // Registers events on the <main> element

MyApp.on("click button.submit", function(e) {
    // A button with the class `submit`, inside `<main>`, was clicked
});

Main.on("click", function(e) {
    // The main element was clicked
});
```

#### No need for boilerplate code
Users of jQuery et al. might have realised that in the previous example there was no boilerplate code. In jQuery et al. you need to wait for the DOM to load:
```js
$(document).ready(function() {
    // Code here
});
```
Because of *achilles*'s event-driven architecture, that is not the case here.

#### Instantiating
To create an *achilles.View*, pass a CSS selector into its constructor, e.g:
```js
var MyApp = new achilles.View("#container");
```
Here *achilles.View* is assigned to the event with the id *container*.

#### Events
To declare an events, on the `#container` element, use the *on* method:
```js
MyApp.on("click", function(e) {

});
```
The first parameter of *on* method is an event name, and the second is a function, that itself takes an Event argument. The Event argumenet isn't strictly necessary, but it provides information about the event.

#### Event delegation
You will rarely only need to put events on the root element, in this case `#container`. To declare event handlers for children of the root element, use event delegation:
```js
MyApp.on("click button.reload", function(e) {

});
```
