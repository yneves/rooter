/*!
**  rooter -- Dumb router.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/rooter>
*/
// - -------------------------------------------------------------------- - //

"use strict";

var url = require("url");
var factory = require("bauer-factory");

// - -------------------------------------------------------------------- - //

var Router = factory.createClass({
  
  constructor: function() {
    this.routes = {};
  },
  
  setRoute: {
    
    // .setRoute(routes Object) :void
    o: function(routes) {
      Object.keys(routes).forEach(function(route) {
        this.setRoute(route, routes[route]);
      }.bind(this));
    },
    
    // .setRoute(route String, )
    sf: function(route, handler) {
      this.routes[route] = handler;
    },
  },
  
  findRoute: {
    
    // .findRoute(path String) :Function
    s: function(path) {
      
      var route;
      var parsed = url.parse(path);
      
      // exact match
      if (this.routes.hasOwnProperty(parsed.path)) {
        route = {
          path: path,
          handler: this.routes[parsed.path]
        };
      
      // match params
      } else {
        
        var routes = Object.keys(this.routes);
        var length = routes.length;
        var i;
        
        for (i = 0; i < length; i++) {
          
          var params = routes[i].match(/\{[\w]+\}/g);
          if (params) {
            
            params = params.map(function(param) {
              return param.substr(1, param.length - 2);
            });
            
            var routeMatcher = new RegExp("^" + routes[i].replace(/\{[\w]+\}/g, "([\\w0-9-]+)") + "$");
            var values = parsed.path.match(routeMatcher);
            
            if (values) {
              
              route = {
                path: path,
                params: {},
                handler: this.routes[routes[i]]
              };
              
              params.forEach(function(param, index) {
                route.params[param] = values[index + 1];
              });
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
  
  navigate: {
    
    // .navigate(route String) :void
    s: function(route) {
      this.navigate(route, true);
    },
    
    // .navigate(path String, pushState Boolean) :void
    sb: function(path, pushState) {
      
      var route = this.findRoute(path);
      var pageTitle = document.title;
      var state = { route: path };
      
      if (pushState) {
        window.history.pushState(state, pageTitle, path);
      }
      
      if (route && factory.isFunction(route.handler)) {
        route.handler(route);
        
        if (pageTitle !== document.title) {
          window.history.replaceState(state, document.title, path);
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
    
    // .start(url String) :void
    s: function(url) {
      window.onpopstate = function(e) {
        if (e.state) {
          this.navigate(e.state.route, false);
        } else {
          console.log(e);
        }
      }.bind(this);
      this.navigate(url, false);
    }
  },
  
  isActive: {
    
    // .isActive(route String) :Boolean
    s: function(route) {
      return url.parse(window.location.href).path === url.parse(route).path;
    }
  }

});

// - -------------------------------------------------------------------- - //

module.exports = Router;

// - -------------------------------------------------------------------- - //
