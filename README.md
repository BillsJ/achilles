achilles
========

A lightweight framework for structured web applications.

### achilles.EventEmitter
Inherits from Node's EventEmitter, and therefore all its methods. The constructor takes one argument, an element. 
Event delegation can be used. Example:

```js
var Main = new achilles.EventEmitter(document.querySelector("main"));

Main.on("click button.submit", function(e) {
    // A button with the class `submit` was clicked
});

Main.on("click", function(e) {
    // The main element was clicked
});

```

