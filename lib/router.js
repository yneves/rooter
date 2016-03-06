/*!
**  rooter -- Dumb router.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/rooter>
*/
// - -------------------------------------------------------------------- - //

"use strict";

var url = require("url");
var events = require("events");
var factory = require("bauer-factory");

// - -------------------------------------------------------------------- - //

var Router = factory.createClass({
  
  inherits: events.EventEmitter,
  
  // new Router() :Router
  constructor: function() {
    this.routes = {};
  },
  
  parse: function(str, qs) {
    var parsed = url.parse(str, qs);
    ["host", "port", "protocol", "hostname", "pathname"].forEach(function(prop) {
      if (!parsed[prop]) {
        parsed[prop] = window.location[prop];
      }
    });
    return parsed;
  },
  
  format: function(obj) {
    return url.format(obj);
  },
  
  setRoute: {
    
    // .setRoute(routes Object) :Router
    o: function(routes) {
      Object.keys(routes).forEach(function(route) {
        this.setRoute(route, routes[route]);
      }.bind(this));
      return this;
    },
    
    // .setRoute(route String, handler Function) :Router
    sf: function(route, handler) {
      this.routes[route] = {
        handler: handler
      };
      return this;
    },
    
    // .setRoute(route String, data Object) :Router
    so: function(route, data) {
      this.routes[route] = data;
      return this;
    }
  },
  
  findRoute: {
    
    // .findRoute(path String) :Function
    s: function(path) {
      return this.findRoute(this.parse(path, true));
    },
    
    // .findRoute(parsed Object) :Function
    o: function(parsed) {
      
      var route;
      
      // exact match
      if (this.routes[parsed.pathname]) {
        route = factory.merge(this.routes[parsed.pathname], {
          path: parsed.path,
          query: parsed.query,
          params: {},
          pathname: parsed.pathname || ""
        });
      
      // match params
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
            
            routeMatcher = new RegExp("^" + routes[i].replace(/\{[\w]+\}/g, "([\\w0-9-]+)") + "$");
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
  
  replace: {
    
    // .navigate(options Object) :void
    o: function(options) {
      this.replace(url.format(options));
    },
    
    // .replace(path String) :void
    s: function(path) {
      var state = { route: path };
      window.history.replaceState(state, document.title, path);
    }
  },
  
  navigate: {
    
    // .navigate(options Object) :void
    o: function(options) {
      this.navigate(url.format(options), true);
    },
    
    // .navigate(options Object, pushState Boolean) :void
    ob: function(options, pushState) {
      this.navigate(url.format(options), pushState);
    },
    
    // .navigate(route String) :void
    s: function(route) {
      this.navigate(route, true);
    },
    
    // .navigate(href String, pushState Boolean) :void
    sb: function(href, pushState) {
      if (this.navigateTimeout) {
        clearTimeout(this.navigateTimeout);
        this.navigateTimeout = undefined;
      }
      this.navigateTimeout = setTimeout(function() {
        this.navigateTimeout = undefined;
        this.navigateSync(href, pushState);
      }.bind(this), 1);
    }
  },
  
  navigateSync: {
    
    // .navigateSync(options Object) :void
    o: function(options) {
      this.navigateSync(url.format(options), true);
    },
    
    // .navigateSync(options Object, pushState Boolean) :void
    ob: function(options, pushState) {
      this.navigateSync(url.format(options), pushState);
    },
    
    // .navigateSync(route String) :void
    s: function(route) {
      this.navigateSync(route, true);
    },
    
    // .navigateSync(href String, pushState Boolean) :void
    sb: function(href, pushState) {
      
      this.activeRoute = undefined;
      
      var parsed = this.parse(href, true);
      
      if (parsed.host && parsed.host !== window.location.host) {
        window.location.href = href;
        
      } else {
        
        var route = this.activeRoute = this.findRoute(parsed);
        var pageTitle = document.title;
        var state = { route: this.format(parsed) };
        
        if (pushState) {
          window.history.pushState(state, pageTitle, href);
        }
        
        if (route && factory.isFunction(route.handler)) {
          this.emit("navigate", route);
          route.handler(route);
          
          if (pageTitle !== document.title) {
            window.history.replaceState(state, document.title, href);
          }
        }
      }
    }
  },
  
  back: {
    
    // .back() :void
    0: function() {
      window.history.back();
    }
  },
  
  start: {
    
    // .start() :void
    0: function() {
      this.start(window.location.href);
    },
    
    // .navigate(options Object) :void
    o: function(options) {
      this.start(url.format(options));
    },
    
    // .start(url String) :void
    s: function(url) {
      
      window.addEventListener("popstate", function(e) {
        if (!e.state) {
          throw new Error("popstate called without state");
        }
        this.navigateSync(e.state.route, false);
      }.bind(this));
      
      this.navigateSync(url, false);
    }
  },
  
  isRouteActive: {
    
    // .isRouteActive(route String) :Boolean
    s: function(route) {
      return this.parse(window.location.href).path === this.parse(route).path;
    }
  },
  
  // .getRouteParams() :Object
  getRouteParams: function() {
    return this.activeRoute ? this.activeRoute.params : undefined;
  }

});

// - -------------------------------------------------------------------- - //

module.exports = Router;

// - -------------------------------------------------------------------- - //
