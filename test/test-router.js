// - -------------------------------------------------------------------- - //

"use strict";

var assert = require("assert");
var Router = require("../");

// - -------------------------------------------------------------------- - //

describe("Router",function() {

  it("it should match simple routes",function() {
    var router = new Router();
    router.setRoute({
      "/home": function() { return "home"; },
      "/login": function() { return "login"; },
    });
    var route = router.findRoute("/login");
    assert.strictEqual(typeof route.handler,"function");
    assert.strictEqual(route.handler(),"login");
  });
  
  it("it should match routes with params",function() {
    var router = new Router();
    router.setRoute({
      "/item": function() {},
      "/item/{id}": function() {}
    });
    var route = router.findRoute("/item/3");
    assert.strictEqual(typeof route.handler,"function");
    assert.strictEqual(route.params.id,"3");
  });
  
});

// - -------------------------------------------------------------------- - //
