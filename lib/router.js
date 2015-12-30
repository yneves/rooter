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
    return url.parse(str, qs);
  },
  
  format: function(obj) {
    return url.format(obj);
  },
  
  setRoute: {
    
    // .setRoute(routes Object) :void
    o: function(routes) {
      Object.keys(routes).forEach(function(route) {
        this.setRoute(route, routes[route]);
      }.bind(this));
    },
    
    // .setRoute(route String, handler Function) :void
    sf: function(route, handler) {
      this.routes[route] = {
        handler: handler
      };
    },
    
    // .setRoute(route String, data Object) :void
    so: function(route, data) {
      this.routes[route] = data;
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
      if (this.routes.hasOwnProperty(parsed.pathname)) {
        route = factory.merge(this.routes[parsed.pathname], {
          path: parsed.path,
          query: parsed.query || {},
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
                query: parsed.query || {},
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
    
    // .navigate(path String, pushState Boolean) :void
    sb: function(path, pushState) {
      
      var parsed = this.parse(path, true);
      
      if (parsed.host && parsed.host !== window.location.host) {
        window.location.href = path;
        
      } else {
        
        var route = this.findRoute(parsed);
        var pageTitle = document.title;
        var state = { route: url.format(parsed) };
        
        if (pushState) {
          window.history.pushState(state, pageTitle, path);
        }
        
        if (route && factory.isFunction(route.handler)) {
          this.emit("navigate", route);
          route.handler(route);
          
          if (pageTitle !== document.title) {
            window.history.replaceState(state, document.title, path);
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
        if (e.state) {
          this.navigate(e.state.route, false);
        } else {
          console.error(e);
        }
      }.bind(this));
      
      this.navigate(url, false);
    }
  },
  
  isActive: {
    
    // .isActive(route String) :Boolean
    s: function(route) {
      return this.parse(window.location.href).path === this.parse(route).path;
    }
  }

});

// - -------------------------------------------------------------------- - //

module.exports = Router;

// - -------------------------------------------------------------------- - //
