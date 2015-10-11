# rooter
Dumb router.

## Installation

`npm install rooter`

## Usage

This is meant to be used with `browserify`.


```js
var Router = require("rooter");

var router = new Router();

router.setRoute({
  "/home" : function() {},
  "/login": function() {}
});

router.start();

router.navigate("/login");
```

# License
[MIT](./LICENSE)
