(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('backbone'), require('backbone-metal')) : typeof define === 'function' && define.amd ? define(['backbone', 'backbone-metal'], factory) : global.Backbone.Routing = factory(global.Backbone, global.Metal);
})(this, function (Backbone, Metal) {
  'use strict';

  var CancellationError = Metal.Error.extend({
    name: 'CancellationError'
  });

  /**
   * @public
   * @class Route
   */
  var Route = Metal.Class.extend({

    /**
     * @public
     * @method enter
     * @returns {Promise}
     * @param {...*} [args=[]]
     */
    enter: function enter() {
      var _this = this;

      var args = arguments[0] === undefined ? [] : arguments[0];

      this._isEntering = true;
      this.trigger.apply(this, ['before:enter before:fetch', this].concat(args));

      return Promise.resolve().then(function () {
        if (_this._isCancelled) {
          return Promise.reject(new CancellationError());
        }
        return _this.fetch.apply(_this, args);
      }).then(function () {
        return _this.trigger.apply(_this, ['fetch before:render', _this].concat(args));
      }).then(function () {
        if (_this._isCancelled) {
          return Promise.reject(new CancellationError());
        }
        return _this.render.apply(_this, args);
      }).then(function () {
        _this._isEntering = false;
        _this.trigger.apply(_this, ['render enter', _this].concat(args));
      })['catch'](function (err) {
        _this._isEntering = false;
        if (err instanceof CancellationError) {
          _this.trigger('cancel', _this);
        } else {
          _this.trigger('error error:enter', _this, err);
          throw err;
        }
      });
    },

    /**
     * @public
     * @method exit
     * @returns {Promise}
     */
    exit: function exit() {
      var _this2 = this;

      if (this._isEntering) {
        this.cancel();
      }
      this._isExiting = true;
      this.trigger('before:exit before:destroy', this);

      return Promise.resolve().then(function () {
        return _this2.destroy();
      }).then(function () {
        _this2._isExiting = false;
        _this2.trigger('destroy exit', _this2);
        _this2.stopListening();
      })['catch'](function (err) {
        _this2._isExiting = false;
        _this2.trigger('error error:exit', _this2, err);
        _this2.stopListening();
        throw err;
      });
    },

    /**
     * @public
     * @method cancel
     * @returns {Promise}
     */
    cancel: function cancel() {
      var _this3 = this;

      if (!this._isEntering) {
        return;
      }
      this.trigger('before:cancel', this);
      this._isCancelled = true;
      return new Promise(function (resolve, reject) {
        _this3.once('cancel', resolve);
        _this3.once('enter error', reject);
      });
    },

    /**
     * @public
     * @method isEntering
     * @returns {Boolean}
     */
    isEntering: function isEntering() {
      return !!this._isEntering;
    },

    /**
     * @public
     * @method isExiting
     * @returns {Boolean}
     */
    isExiting: function isExiting() {
      return !!this._isExiting;
    },

    /**
     * @public
     * @method isCancelled
     * @returns {Boolean}
     */
    isCancelled: function isCancelled() {
      return !!this._isCancelled;
    },

    /**
     * @public
     * @abstract
     * @method fetch
     * @param {...*} [args=[]]
     */
    fetch: function fetch() {},

    /**
     * @public
     * @abstract
     * @method render
     * @param {...*} [args=[]]
     */
    render: function render() {},

    /**
     * @public
     * @abstract
     * @method destroy
     */
    destroy: function destroy() {}
  });

  /**
   * @public
   * @class Router
   */
  var Router = Metal.Class.extend(Backbone.Router.prototype, Backbone.Router).extend({
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
      var _this4 = this;

      var wasInactive = !this._isActive;
      if (wasInactive) {
        this.trigger('before:enter', this);
      }

      this.trigger('before:route', this);

      return Promise.resolve().then(function () {
        return _this4._execute(callback, args);
      }).then(function () {
        _this4.trigger('route', _this4);

        if (wasInactive) {
          _this4.trigger('enter', _this4);
        }
      })['catch'](function (err) {
        _this4.trigger('error', _this4, err);
        Backbone.history.trigger('error', _this4, err);
        throw err;
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
      var _this5 = this;

      return Promise.resolve().then(function () {
        if (Router._prevRoute instanceof Route) {
          return Router._prevRoute.exit();
        }
      }).then(function () {
        var route = Router._prevRoute = callback.apply(_this5, args);
        if (route instanceof Route) {
          route.router = _this5;
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

  var backbone_routing = { Route: Route, Router: Router, CancellationError: CancellationError };

  return backbone_routing;
});
//# sourceMappingURL=./backbone-routing.js.map