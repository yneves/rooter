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
      var parsed = url.parse(path);
      var handler = this.routes[parsed.path];
      if (handler) {
        return {
          path: path,
          handler: handler
        };
      }
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
      
      if (factory.isFunction(route.handler)) {
        route.handler(route);
        
        if (pageTitle !== document.title) {
          window.history.replaceState(state, document.title, path);
        }
      }
    }
  },
  
  start: {
    
    // .start() :void
    0: function() {
      window.onpopstate = function(e) {
        this.navigate(e.state.route, false);
      }.bind(this);
      this.navigate(window.location.href, false);
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
