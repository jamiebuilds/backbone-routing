(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('backbone'), require('backbone-metal')) : typeof define === 'function' && define.amd ? define(['backbone', 'backbone-metal'], factory) : global.Backbone.Routing = factory(global.Backbone, global.Metal);
})(this, function (Backbone, Metal) {
  'use strict';

  /*jshint -W120 */
  var Route = Metal.Class.extend({
    constructor: function constructor() {
      this.listenTo(Backbone.history, 'route', this._onHistoryRoute);
      this._super.apply(this, arguments);
    },

    fetch: function fetch() {},

    render: function render() {},

    destroy: function destroy() {},

    _onHistoryRoute: function _onHistoryRoute(router) {
      this._isActive = router === this;
    },

    enter: function enter(args) {
      var _this = this;

      this._triggerMethod('before:enter', 'onBeforeEnter', args);
      this._triggerMethod('before:fetch', 'onBeforeFetch', args);
      return Promise.resolve().then(function () {
        return _this.fetch.apply(_this, args);
      }).then(function () {
        _this._triggerMethod('fetch', 'onFetch', args);
        _this._triggerMethod('before:render', 'onBeforeRender', args);
      }).then(function () {
        return _this.render.apply(_this, args);
      }).then(function () {
        _this._triggerMethod('render', 'onRender', args);
        _this._triggerMethod('enter', 'onEnter', args);
      })['catch'](function (err) {
        _this._triggerMethod('error', 'onError', [err]);
        _this._triggerMethod('error:enter', 'onErrorEnter', [err]);
        throw err;
      });
    },

    exit: function exit() {
      var _this2 = this;

      this._triggerMethod('before:exit', 'onBeforeExit');
      this._triggerMethod('before:destroy', 'onBeforeDestroy');
      return Promise.resolve().then(function () {
        return _this2.destroy();
      }).then(function () {
        _this2._triggerMethod('destroy', 'onDestroy');
        _this2._triggerMethod('exit', 'onExit');
        _this2.stopListening();
      })['catch'](function (err) {
        _this2._triggerMethod('error', 'onError', [err]);
        _this2._triggerMethod('error:exit', 'onErrorExit', [err]);
        _this2.stopListening();
        throw err;
      });
    },

    _triggerMethod: function _triggerMethod(name, callbackName, args) {
      if (this[callbackName]) {
        this[callbackName].apply(this, args);
      }
      this.trigger.apply(this, [name, this].concat(args));

      if (!this.router) {
        return;
      }

      if (this.router[callbackName + 'Route']) {
        this.router[callbackName + 'Route'](this);
      }
      this.trigger(name + ':route', this);
    }
  });

  var backbone_routing___prevRoute = undefined;

  var Router = Metal.Class.extend({
    constructor: function constructor() {
      this.listenTo(Backbone.history, 'route', this._onHistoryRoute);
      this._super.apply(this, arguments);
    },

    isActive: function isActive() {
      return !!this._isActive;
    },

    execute: function execute(callback, args) {
      var _this3 = this;

      var wasInactive = !this._isActive;
      if (wasInactive) {
        this.onBeforeEnter();
        this.trigger('before:enter', this);
      }

      this.onBeforeRoute();
      this.trigger('before:route', this);

      Promise.resolve(this._execute(callback, args)).then(function () {
        if (wasInactive) {
          _this3.onEnter();
          _this3.trigger('enter');
        }

        _this3.onRoute();
        _this3.trigger('route');
      })['catch'](function (err) {
        _this3.onError(err);
        _this3.trigger('error', _this3, err);
        Backbone.history.trigger('error', _this3, err);
      });
    },

    _execute: function _execute(callback, args) {
      var _this4 = this;

      return Promise.resolve().then(function () {
        if (backbone_routing___prevRoute instanceof Route) {
          return backbone_routing___prevRoute.exit();
        }
      }).then(function () {
        var route = backbone_routing___prevRoute = callback.apply(_this4, args);
        if (route instanceof Route) {
          route.router = _this4;
          return route.enter(args);
        }
      });
    },

    _onHistoryRoute: function _onHistoryRoute(router) {
      this._isActive = router === this;
    }
  });

  var backbone_routing = { Route: Route, Router: Router };

  return backbone_routing;
});
//# sourceMappingURL=./backbone-routing.js.map