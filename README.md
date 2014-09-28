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

util.inherits(Book, achilles.Model);

Book.prototype.getReaderCount = function() {
    return this.readership.length;
};

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

N.B.: Works server-side and client-side (with browserify)

### Why yet another framework?
Why yet another framework? Achilles was born from the need to:
- Have a lightweight framework, that could work with **all** templating languages including asyncronous templates, and d3 graphs
- Have an API which was consistent with Node.js, for instance: `template` and `templateSync`; the of an Node's EventEmitter as the base for `achilles.Object`
- The choice of Node's `util.inherits` method over `.extend()` 
- Strong-typed object system
- The seperation of presentation and content (i.e. the seperation of HTML, CSS, JS) (unlike Angular.js)
- Consistent naming structure: classes should be capitalised; everything else including nampespaces should not.
- No need for boilerplate `window.onload` or `$(document).ready()` code

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

#### Defining properties
```js
    this.define("name", String);
```

The method *define* accepts two parameters: first a property name, and second a class. 

To define properties as arrays of a class, put the class in an array, e.g.:

```js
this.define("favouriteColours", [String]); // An array of Strings
this.define("favouriteNumbers", [Number]); // An array of Numbers
this.define("children", [Person]); // An array of People
```

A TypeError will be raised if a property is set to a value that does not match the type.

### achilles.Model
*Inherits achilles.Model*

The constructor has to have a `connection` property, which accepts an adapter. An adapter allows you to retrieve and save data to and from a database. Achilles provides a REST adapter built-in:

```js
Book.connection = new achilles.Connection("/");
```

Other adapaters include a [MongoDB adapter](https://github.com/TheMuses/achilles-mongodb).

#### getById()
A static method that takes an id and a callback.

#### delById()
A static method that takes an id of an object to delete and a callback.

#### save()
Saves the object to the database; it accepts a callback that is called after the operation is done.

#### refresh()
Refreshes its conents.

#### del()
Deletes the object.

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

To put an event on a child element:
```js
MyApp.on("click button.reload", function(e) {
    // Code here
});
```
