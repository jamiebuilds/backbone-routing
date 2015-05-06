(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('backbone'), require('backbone-metal')) : typeof define === 'function' && define.amd ? define(['backbone', 'backbone-metal'], factory) : global.Backbone.Routing = factory(global.Backbone, global.Metal);
})(this, function (Backbone, Metal) {
  'use strict';

  var Route = Metal.Class.extend({
    constructor: function constructor() {
      this.listenTo(Backbone.history, 'route', this._onHistoryRoute);
      this._super.apply(this, arguments);
    },

    /**
     * @public
     * @abstract
     * @method fetch
     */
    fetch: function fetch() {},

    /**
     * @public
     * @abstract
     * @method render
     */
    render: function render() {},

    /**
     * @public
     * @abstract
     * @method destroy
     */
    destroy: function destroy() {},

    /**
     * @private
     * @method _onHistoryRoute
     */
    _onHistoryRoute: function _onHistoryRoute(router) {
      this._isActive = router === this;
    },

    /**
     * @public
     * @method enter
     * @returns {Promise}
     */
    enter: function enter() {
      var _this = this;

      var args = arguments[0] === undefined ? [] : arguments[0];

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

    /**
     * @public
     * @method exit
     * @returns {Promise}
     */
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

    /**
     * @private
     * @method _triggerMethod
     * @param {String} name
     * @param {String} callbackName
     * @param {array} [args]
     */
    _triggerMethod: function _triggerMethod(name, callbackName) {
      var args = arguments[2] === undefined ? [] : arguments[2];

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

  /**
   * @public
   * @class Router
   */
  var Router = Metal.Class.extend({
    constructor: function constructor() {
      this.listenTo(Backbone.history, 'route', this._onHistoryRoute);
      this._super.apply(this, arguments);
    },

    /**
     * @public
     * @method isActive
     * @returns {Boolean}
     */
    isActive: function isActive() {
      return !!this._isActive;
    },

    /**
     * @public
     * @method execute
     * @param {Function} callback
     * @param {Array} [args]
     */
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

    /**
     * @public
     * @method execute
     * @param {Function} callback
     * @param {Array} [args]
     * @returns {Promise}
     */
    _execute: function _execute(callback, args) {
      var _this4 = this;

      return Promise.resolve().then(function () {
        if (Router._prevRoute instanceof Route) {
          return Router._prevRoute.exit();
        }
      }).then(function () {
        var route = Router._prevRoute = callback.apply(_this4, args);
        if (route instanceof Route) {
          route.router = _this4;
          return route.enter(args);
        }
      });
    },

    /**
     * @private
     * @method _onHistoryRoute
     * @param {Router} router
     */
    _onHistoryRoute: function _onHistoryRoute(router) {
      this._isActive = router === this;
    }
  }, {

    /**
     * @private
     * @member _prevRoute
     */
    _prevRoute: null
  });

  var backbone_routing = { Route: Route, Router: Router };

  return backbone_routing;
});
//# sourceMappingURL=./backbone-routing.js.map