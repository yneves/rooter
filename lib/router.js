/*!
**  rooter -- Dumb router.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/rooter>
*/
// - -------------------------------------------------------------------- - //

'use strict';

var url = require('url');
var events = require('events');
var factory = require('bauer-factory');

// - -------------------------------------------------------------------- - //

var Router = factory.createClass({

  inherits: events.EventEmitter,

  // new Router() :Router
  constructor: function () {
    this.routes = {};
  },

  parse: function (str, qs) {
    var parsed = url.parse(str, qs);
    ['host', 'port', 'protocol', 'hostname', 'pathname'].forEach(function (prop) {
      if (!parsed[prop]) {
        parsed[prop] = window.location[prop];
      }
    });
    if (!parsed.query || Object.keys(parsed.query).length === 0) {
      parsed.query = undefined;
    }
    return parsed;
  },

  format: function (obj) {
    return url.format(obj);
  },

  setRoute: {

    // .setRoute(routes Object) :void
    o: function (routes) {
      Object.keys(routes).forEach(function (route) {
        this.setRoute(route, routes[route]);
      }.bind(this));
    },

    // .setRoute(route String, handler Function) :void
    sf: function (route, handler) {
      this.routes[route] = {
        trace: new Error('Router: route "' + route + '" handler error'),
        handler: handler
      };
    },

    // .setRoute(route String, data Object) :void
    so: function (route, data) {
      data.trace = new Error('Router: route "' + route + '" handler error');
      this.routes[route] = data;
    }
  },

  findRoute: {

    // .findRoute(path String) :Function
    s: function (path) {
      return this.findRoute(this.parse(path, true));
    },

    // .findRoute(parsed Object) :Function
    o: function (parsed) {

      var route;

      // Exact match
      if (this.routes[parsed.pathname]) {
        route = factory.merge(this.routes[parsed.pathname], {
          path: parsed.path,
          query: parsed.query,
          params: {},
          pathname: parsed.pathname
        });

      // Match params
      } else {

        var routes = Object.keys(this.routes);
        var routesLength = routes.length;
        var routeMatcher;
        var paramsLength;
        var params;
        var values;
        var i;
        var p;

        for (i = 0; i < routesLength; i++) {

          params = routes[i].match(/\{[\w]+\}/g);
          if (params) {

            paramsLength = params.length;

            for (p = 0; p < paramsLength; p++) {
              params[p] = params[p].substr(1, params[p].length - 2);
            }

            routeMatcher = new RegExp('^' + routes[i].replace(/\{[\w]+\}/g, '([\\w0-9-]+)') + '$');
            values = parsed.pathname ? parsed.pathname.match(routeMatcher) : undefined;

            if (values) {

              route = factory.merge(this.routes[routes[i]], {
                path: parsed.path,
                params: {},
                query: parsed.query,
                pathname: parsed.pathname
              });

              for (p = 0; p < paramsLength; p++) {
                route.params[params[p]] = values[p + 1];
              }
            }
          }

          if (route) {
            break;
          }
        }
      }
      return route;
    }
  },

  validateRoute: {

    // .validateRoute(route Object) :Boolean
    o: function (route) {
      var valid = true;
      if (factory.isFunction(route.validate)) {
        valid = route.validate();
      } else if (factory.isBoolean(route.validate)) {
        valid = route.validate;
      }
      return valid;
    }
  },

  replace: {

    // .navigate(options Object) :void
    o: function (options) {
      this.replace(url.format(options));
    },

    // .replace(path String) :void
    s: function (path) {
      var state = { route: path };
      window.history.replaceState(state, document.title, path);
    }
  },

  navigate: {

    // .navigate(options Object) :void
    o: function (options) {
      var route = url.format(options);
      var trace = new Error('Router: navigate to "' + route + '" handler error');
      this.navigate(route, true, trace);
    },

    // .navigate(options Object, pushState Boolean) :void
    ob: function (options, pushState) {
      var route = url.format(options);
      var trace = new Error('Router: navigate to "' + route + '" handler error');
      this.navigate(route, pushState, trace);
    },

    // .navigate(route String) :void
    s: function (route) {
      var trace = new Error('Router: navigate to "' + route + '" handler error');
      this.navigate(route, true, trace);
    },

    // .navigate(route String, pushState Boolean) :void
    sb: function (route, pushState) {
      var trace = new Error('Router: navigate to "' + route + '" handler error');
      this.navigate(route, pushState, trace);
    },

    // .navigate(route String, pushState Boolean, trace Error) :void
    sbe: function (route, pushState, trace) {
      if (this.navigateTimeout) {
        clearTimeout(this.navigateTimeout);
        this.navigateTimeout = undefined;
      }
      this.navigateTimeout = setTimeout(function () {
        this.navigateTimeout = undefined;
        this.navigateSync(route, pushState, trace);
      }.bind(this), 1);
    }
  },

  navigateSync: {

    // .navigateSync(options Object) :void
    o: function (options) {
      var route = url.format(options);
      var trace = new Error('Router: navigate to "' + route + '" handler error');
      this.navigateSync(route, true, trace);
    },

    // .navigateSync(options Object, pushState Boolean) :void
    ob: function (options, pushState) {
      var route = url.format(options);
      var trace = new Error('Router: navigate to "' + route + '" handler error');
      this.navigateSync(route, pushState, trace);
    },

    // .navigateSync(route String) :void
    s: function (route) {
      var trace = new Error('Router: navigate to "' + route + '" handler error');
      this.navigateSync(route, true, trace);
    },

    // .navigateSync(route String, pushState Boolean) :void
    sb: function (route, pushState) {
      var trace = new Error('Router: navigate to "' + route + '" handler error');
      this.navigateSync(route, pushState, trace);
    },

    // .navigateSync(route String, pushState Boolean, trace Error) :void
    sbe: function (route, pushState, trace) {

      this.activeRoute = undefined;

      var parsed = this.parse(route, true);

      if (parsed.host && parsed.host !== window.location.host) {
        window.location.href = route;

      } else {

        var activeRoute = this.findRoute(parsed);
        var valid = this.validateRoute(activeRoute);

        if (valid) {

          this.activeRoute = activeRoute;

          var pageTitle = document.title;
          var state = { route: this.format(parsed) };
          if (pushState) {
            window.history.pushState(state, pageTitle, route);
          }

          if (activeRoute && factory.isFunction(activeRoute.handler)) {
            this.handleRoute(activeRoute, trace);
            if (pageTitle !== document.title) {
              window.history.replaceState(state, document.title, route);
            }
          }

        } else if (activeRoute.redirect) {
          this.navigateSync(activeRoute.redirect, pushState, trace);
        }
      }
    }
  },

  handleRoute: {

    // .handleRoute(route Object, trace Error) :void
    oe: function (route, trace) {
      try {
        this.emit('navigate', route);
      } catch (error) {
        if (this.listenerCount('error')) {
          this.emit('error', error, trace, route.trace);
        } else {
          console.error(error, trace, route.trace);
        }
      }
      try {
        route.handler(route);
      } catch (error) {
        if (this.listenerCount('error')) {
          this.emit('error', error, trace, route.trace);
        } else {
          console.error(error, trace, route.trace);
        }
      }
    }
  },

  back: {

    // .back() :void
    0: function () {
      window.history.back();
    }
  },

  start: {

    // .start() :void
    0: function () {
      this.start(window.location.href);
    },

    // .start(options Object) :void
    o: function (options) {
      this.start(url.format(options));
    },

    // .start(url String) :void
    s: function (url) {

      window.addEventListener('popstate', function (e) {
        if (e && e.state) {
          var trace = new Error('popstate event');
          this.navigateSync(e.state.route, false, trace);
        }
      }.bind(this));

      this.navigateSync(url, false);
    }
  },

  isRouteActive: {

    // .isRouteActive(route String) :Boolean
    s: function (route) {
      return this.parse(window.location.href).path === this.parse(route).path;
    }
  },

  // .getRouteParams() :Object
  getRouteParams: function () {
    return this.activeRoute ? this.activeRoute.params : undefined;
  }

});

// - -------------------------------------------------------------------- - //

module.exports = Router;

// - -------------------------------------------------------------------- - //
