// - -------------------------------------------------------------------- - //

"use strict";

var assert = require("assert");
var jsdom = require("mocha-jsdom");
var Router = require("../");

// - -------------------------------------------------------------------- - //

describe("Router",function() {

  jsdom();

  it("it should match simple routes", function() {
    var router = new Router();
    router.setRoute({
      "/home": function() { return "home"; },
      "/login": function() { return "login"; },
    });
    var route = router.findRoute("/login");
    assert.strictEqual(typeof route.handler,"function");
    assert.strictEqual(route.handler(),"login");
  });
  
  it("it should match routes with params", function() {
    var router = new Router();
    router.setRoute({
      "/item": function() {},
      "/item/{id}": function() {}
    });
    var route = router.findRoute("/item/3");
    assert.strictEqual(typeof route.handler,"function");
    assert.strictEqual(route.params.id,"3");
  });
  
  it("it should navigate between routes", function(done) {
    var router = new Router();
    router.setRoute({
      "/item": function() {},
      "/item/{id}": function(route) {
        assert.strictEqual(route.params.id,"a");
        assert.strictEqual(router.activeRoute, route);
        assert.deepEqual(router.getRouteParams(), route.params);
        done();
      }
    });
    router.navigate("/item/a");
  });
  
  it("it should navigate synchronously between routes", function() {
    var router = new Router();
    router.setRoute({
      "/item": function() {},
      "/item/{id}": function() {}
    });
    router.navigateSync("/item/a");
    assert.strictEqual(router.isRouteActive("/item/a"), true);
    assert.deepEqual(router.getRouteParams(), { id: "a" });
  });
  
  it("it should return undefined query if not present in url", function() {
    var router = new Router();
    var parsed = router.parse("http://localhost");
    assert.strictEqual(parsed.query, undefined);
    router.setRoute({
      "/home": function() { return "home"; },
      "/login": function() { return "login"; },
    });
    var route = router.findRoute("/login");
    assert.strictEqual(route.query, undefined);
  });
  
});

// - -------------------------------------------------------------------- - //
