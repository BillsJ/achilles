achilles [![NPM Module](http://img.shields.io/npm/v/achilles.svg?style=flat-square)](https://npmjs.org/package/achilles) [![NPM Downlaods](http://img.shields.io/npm/dm/achilles.svg?style=flat-square)](https://npmjs.org/package/achilles) [![Travis CI](http://img.shields.io/travis/TheMuses/achilles.svg?style=flat-square)](https://travis-ci.org/TheMuses/achilles) [![Code Climate](http://img.shields.io/codeclimate/github/TheMuses/achilles.svg?style=flat-square)](https://codeclimate.com/github/TheMuses/achilles)
========

A lightweight framework for structured web applications.


### tl;dr Example
```js
var achilles = require("achilles");
var mongodb = require("achilles-mongodb");

function Book() {
    achilles.Model.call(this);

    this.define("title", String);
    this.define("author", String);
    this.define("rating", Number);
    this.define("datePublished", Date);
    this.define("readership", [String]);
}

Book.prototype.getTotalReaders = function() {
    return this.readership.length;
};

util.inherits(Book, achilles.Model);

Book.connection = new mongodb.Connection("mongodb://127.0.0.1:27017/test");

var book = new Book();
book.title = "Harry Potter";
book.author = "J.K. Rowling";

book.save(function(err, book) {
   // AFTER SAVE
});

Book.getById("DUMMY_ID", function(err, book) {
   // AFTER GET   
});
```

### Install
```bash
npm install achilles --save
```

Works serverside and with browserify.

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
*Inherits events.EventEmitter*

To create a class called `Person` with properties such as `name`, `height`, `dateOfBirth`, `alive` and `children`, as well as methods such as `reset()`:

```js
var util = require("util");

function Person(name) {
    achilles.Object.call(this);

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
```js
    this.define("name", String);
```

The method *define* accepts two parameters: first a property name, and second a type. 

To define properties as arrays of a type, put the type in an array, e.g.:

```js
this.define("favouriteColours", [String]); // An array of Strings
this.define("favouriteNumbers", [Number]); // An array of Numbers
this.define("children", [Person]); // An array of People
```

A TypeError will be raised if a property is set to a value that does not match the type.

### achilles.View
*Inherits achilles.Object*

```js
var MyApp = new achilles.View("#container"); // Registers events on the <main> element

MyApp.on("click button.submit", function(e) {
    // A button with the class `submit`, inside `#container` element, was clicked
});

Main.on("click", function(e) {
    // The main element was clicked
});
```

N.B.: There is no need for boilerplate code such as `window.onload` or `$.ready()`.

The constructor accepts either a CSS selector or an element or nothing.

#### Events
To declare an events, on the `#container` element, use the *on* method:
```js
MyApp.on("click", function(e) {
    // `e` provides information about the event
});
```

#### Putting Events on Child Element
```js
MyApp.on("click button.reload", function(e) {
    // Code here
});
```

N.B.: This uses event delegation.
