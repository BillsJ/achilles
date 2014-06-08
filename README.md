achilles
========

Lightweight framework for structured web applications.

Made to be used with browserify.

Doesn't need to be used with jQuery, etc.

### achilles.EventEmitter
Inherits from Node's EventEmitter, and therefore all its methods. The constructor takes one argument, an element. 
Events assigned used `on`, can use event delegation. Example:

```js
var Main = new achilles.EventEmitter(document.querySelector("main"));

Main.on("click button.submit", function(e) {
    // A button with the class `submit` was clicked
});

Main.on("click", function(e) {
    // The main element was clicked
});

```

