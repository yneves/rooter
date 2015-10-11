// - -------------------------------------------------------------------- - //

"use strict";

var assert = require("assert");
var Router = require("../");

// - -------------------------------------------------------------------- - //

describe("Router",function() {

  it("it should match routes correctly",function() {
    var router = new Router();
    router.setRoute({
      "/home": function() { return "home" },
      "/login": function() { return "login" },
    });
    var route = router.findRoute("/login");
    assert.strictEqual(typeof route.handler,"function");
    assert.strictEqual(route.handler(),"login");
  });
  
});

// - -------------------------------------------------------------------- - //
