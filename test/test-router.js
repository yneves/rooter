// - -------------------------------------------------------------------- - //

'use strict';

var assert = require('assert');
var jsdom = require('mocha-jsdom');
var Router = require('../');

// - -------------------------------------------------------------------- - //

describe('Router', function () {

  jsdom();

  it('should match simple routes', function () {
    var router = new Router();
    router.setRoute({
      '/home': function () { return 'home'; },
      '/login': function () { return 'login'; }
    });
    var route = router.findRoute('/login');
    assert.strictEqual(typeof route.handler, 'function');
    assert.strictEqual(route.handler(), 'login');
  });

  it('should match routes with params', function () {
    var router = new Router();
    router.setRoute({
      '/item': function () {},
      '/item/{id}': function () {}
    });
    var route = router.findRoute('/item/3');
    assert.strictEqual(typeof route.handler, 'function');
    assert.strictEqual(route.params.id, '3');
  });

  it('should navigate between routes', function (done) {
    var router = new Router();
    router.setRoute({
      '/item': function () {},
      '/item/{id}': function (route) {
        assert.strictEqual(route.params.id, 'a');
        assert.strictEqual(router.activeRoute, route);
        assert.deepEqual(router.getRouteParams(), route.params);
        done();
      }
    });
    router.navigate('/item/a');
  });

  it('should navigate synchronously between routes', function () {
    var router = new Router();
    router.setRoute({
      '/item': function () {},
      '/item/{id}': function () {}
    });
    router.navigateSync('/item/a');
    assert.strictEqual(router.isRouteActive('/item/a'), true);
    assert.deepEqual(router.getRouteParams(), { id: 'a' });
  });

  it('should return undefined query if not present in url', function () {
    var router = new Router();
    var parsed = router.parse('http://localhost');
    assert.strictEqual(parsed.query, undefined);
    router.setRoute({
      '/home': function () { return 'home'; },
      '/login': function () { return 'login'; }
    });
    var route = router.findRoute('/login');
    assert.strictEqual(route.query, undefined);
  });

  it('should handle errors inside route handlers', function () {
    var router = new Router();
    router.setRoute({
      '/home': function () { this.undefined(); }
    });
    var errorHandled = false;
    router.on('error', function (error, traceNavigate, traceSetRoute) {
      assert.ok(error instanceof Error);
      assert.ok(traceNavigate instanceof Error);
      assert.ok(traceSetRoute instanceof Error);
      assert.strictEqual(traceNavigate.message, 'Router: navigate to "/home" handler error');
      assert.strictEqual(traceSetRoute.message, 'Router: route "/home" handler error');
      errorHandled = true;
    });
    router.navigateSync('/home');
    assert.ok(errorHandled);
  });

});

// - -------------------------------------------------------------------- - //
