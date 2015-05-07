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
     * @method enter
     * @returns {Promise}
     */
    enter: function enter() {
      var _this = this;

      var args = arguments[0] === undefined ? [] : arguments[0];

      this.onBeforeEnter.apply(this, args);
      this.trigger.apply(this, ['before:enter', this].concat(args));
      this.onBeforeFetch.apply(this, args);
      this.trigger.apply(this, ['before:fetch', this].concat(args));

      return Promise.resolve().then(function () {
        return _this.fetch.apply(_this, args);
      }).then(function () {
        _this.onFetch.apply(_this, args);
        _this.trigger.apply(_this, ['fetch', _this].concat(args));
        _this.onBeforeRender.apply(_this, args);
        _this.trigger.apply(_this, ['before:render', _this].concat(args));
      }).then(function () {
        return _this.render.apply(_this, args);
      }).then(function () {
        _this.onRender.apply(_this, args);
        _this.trigger.apply(_this, ['render', _this].concat(args));
        _this.onEnter.apply(_this, args);
        _this.trigger.apply(_this, ['enter', _this].concat(args));
      })['catch'](function (err) {
        _this.onError(err);
        _this.trigger('error', _this, err);
        _this.onErrorEnter(err);
        _this.trigger('error:enter', _this, err);
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

      this.onBeforeExit();
      this.trigger('before:exit', this);
      this.onBeforeDestroy();
      this.trigger('before:destroy', this);

      return Promise.resolve().then(function () {
        return _this2.destroy();
      }).then(function () {
        _this2.onDestroy();
        _this2.trigger('destroy', _this2);
        _this2.onExit();
        _this2.trigger('exit', _this2);
        _this2.stopListening();
      })['catch'](function (err) {
        _this2.onError(err);
        _this2.trigger('error', _this2, err);
        _this2.onErrorExit(err);
        _this2.trigger('error:exit', _this2, err);
        _this2.stopListening();
        throw err;
      });
    },

    /**
     * @public
     * @abstract
     * @method onBeforeEnter
     */
    onBeforeEnter: function onBeforeEnter() {},

    /**
     * @public
     * @abstract
     * @method onBeforeFetch
     */
    onBeforeFetch: function onBeforeFetch() {},

    /**
     * @public
     * @abstract
     * @method fetch
     */
    fetch: function fetch() {},

    /**
     * @public
     * @abstract
     * @method onFetch
     */
    onFetch: function onFetch() {},

    /**
     * @public
     * @abstract
     * @method onBeforeRender
     */
    onBeforeRender: function onBeforeRender() {},

    /**
     * @public
     * @abstract
     * @method render
     */
    render: function render() {},

    /**
     * @public
     * @abstract
     * @method onRender
     */
    onRender: function onRender() {},

    /**
     * @public
     * @abstract
     * @method onEnter
     */
    onEnter: function onEnter() {},

    /**
     * @public
     * @abstract
     * @method onBeforeExit
     */
    onBeforeExit: function onBeforeExit() {},

    /**
     * @public
     * @abstract
     * @method onBeforeDestroy
     */
    onBeforeDestroy: function onBeforeDestroy() {},

    /**
     * @public
     * @abstract
     * @method destroy
     */
    destroy: function destroy() {},

    /**
     * @public
     * @abstract
     * @method onDestroy
     */
    onDestroy: function onDestroy() {},

    /**
     * @public
     * @abstract
     * @method onExit
     */
    onExit: function onExit() {},

    /**
     * @public
     * @abstract
     * @method onError
     */
    onError: function onError() {},

    /**
     * @public
     * @abstract
     * @method onErrorEnter
     */
    onErrorEnter: function onErrorEnter() {},

    /**
     * @public
     * @abstract
     * @method onErrorExit
     */
    onErrorExit: function onErrorExit() {},

    /**
     * @private
     * @method _onHistoryRoute
     */
    _onHistoryRoute: function _onHistoryRoute(router) {
      this._isActive = router === this;
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

      return Promise.resolve().then(function () {
        return _this3._execute(callback, args);
      }).then(function () {
        _this3.onRoute();
        _this3.trigger('route', _this3);

        if (wasInactive) {
          _this3.onEnter();
          _this3.trigger('enter', _this3);
        }
      })['catch'](function (err) {
        _this3.onError(err);
        _this3.trigger('error', _this3, err);
        Backbone.history.trigger('error', _this3, err);
      });
    },

    /**
     * @public
     * @abstract
     * @method onBeforeEnter
     */
    onBeforeEnter: function onBeforeEnter() {},

    /**
     * @public
     * @abstract
     * @method onBeforeRoute
     */
    onBeforeRoute: function onBeforeRoute() {},

    /**
     * @public
     * @abstract
     * @method onRoute
     */
    onRoute: function onRoute() {},

    /**
     * @public
     * @abstract
     * @method onEnter
     */
    onEnter: function onEnter() {},

    /**
     * @public
     * @abstract
     * @method onError
     */
    onError: function onError() {},

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