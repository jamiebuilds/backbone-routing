import Backbone from 'backbone';
import Metal from 'backbone-metal';

/**
 * @public
 * @class Route
 */
const Route = Metal.Class.extend({
  constructor() {
    this.listenTo(Backbone.history, 'route', this._onHistoryRoute);
    this._super(...arguments);
  },

  /**
   * @public
   * @method enter
   * @returns {Promise}
   */
  enter(args = []) {
    this.onBeforeEnter(...args);
    this.trigger('before:enter', this, ...args);
    this.onBeforeFetch(...args);
    this.trigger('before:fetch', this, ...args);

    return Promise.resolve()
      .then(() => this.fetch(...args))
      .then(() => {
        this.onFetch(...args);
        this.trigger('fetch', this, ...args);
        this.onBeforeRender(...args);
        this.trigger('before:render', this, ...args);
      })
      .then(() => this.render(...args))
      .then(() => {
        this.onRender(...args);
        this.trigger('render', this, ...args);
        this.onEnter(...args);
        this.trigger('enter', this, ...args);
      })
      .catch(err => {
        this.onError(err);
        this.trigger('error', this, err);
        this.onErrorEnter(err);
        this.trigger('error:enter', this, err);
        throw err;
      });
  },

  /**
   * @public
   * @method exit
   * @returns {Promise}
   */
  exit() {
    this.onBeforeExit();
    this.trigger('before:exit', this);
    this.onBeforeDestroy();
    this.trigger('before:destroy', this);

    return Promise.resolve()
      .then(() => this.destroy())
      .then(() => {
        this.onDestroy();
        this.trigger('destroy', this);
        this.onExit();
        this.trigger('exit', this);
        this.stopListening();
      })
      .catch(err => {
        this.onError(err);
        this.trigger('error', this, err);
        this.onErrorExit(err);
        this.trigger('error:exit', this, err);
        this.stopListening();
        throw err;
      });
  },

  /**
   * @public
   * @abstract
   * @method onBeforeEnter
   */
  onBeforeEnter() {},

  /**
   * @public
   * @abstract
   * @method onBeforeFetch
   */
  onBeforeFetch() {},

  /**
   * @public
   * @abstract
   * @method fetch
   */
  fetch() {},

  /**
   * @public
   * @abstract
   * @method onFetch
   */
  onFetch() {},

  /**
   * @public
   * @abstract
   * @method onBeforeRender
   */
  onBeforeRender() {},

  /**
   * @public
   * @abstract
   * @method render
   */
  render() {},

  /**
   * @public
   * @abstract
   * @method onRender
   */
  onRender() {},

  /**
   * @public
   * @abstract
   * @method onEnter
   */
  onEnter() {},

  /**
   * @public
   * @abstract
   * @method onBeforeExit
   */
  onBeforeExit() {},

  /**
   * @public
   * @abstract
   * @method onBeforeDestroy
   */
  onBeforeDestroy() {},

  /**
   * @public
   * @abstract
   * @method destroy
   */
  destroy() {},

  /**
   * @public
   * @abstract
   * @method onDestroy
   */
  onDestroy() {},

  /**
   * @public
   * @abstract
   * @method onExit
   */
  onExit() {},

  /**
   * @public
   * @abstract
   * @method onError
   */
  onError() {},

  /**
   * @public
   * @abstract
   * @method onErrorEnter
   */
  onErrorEnter() {},

  /**
   * @public
   * @abstract
   * @method onErrorExit
   */
  onErrorExit() {},

  /**
   * @private
   * @method _onHistoryRoute
   */
  _onHistoryRoute(router) {
    this._isActive = (router === this);
  }
});

/**
 * @public
 * @class Router
 */
const Router = Metal.Class.extend({
  constructor() {
    this.listenTo(Backbone.history, 'route', this._onHistoryRoute);
    this._super(...arguments);
  },

  /**
   * @public
   * @method isActive
   * @returns {Boolean}
   */
  isActive() {
    return !!this._isActive;
  },

  /**
   * @public
   * @method execute
   * @param {Function} callback
   * @param {Array} [args]
   */
  execute(callback, args) {
    var wasInactive = !this._isActive;
    if (wasInactive) {
      this.onBeforeEnter();
      this.trigger('before:enter', this);
    }

    this.onBeforeRoute();
    this.trigger('before:route', this);

    return Promise.resolve().then(() => {
      return this._execute(callback, args);
    }).then(() => {
      this.onRoute();
      this.trigger('route', this);

      if (wasInactive) {
        this.onEnter();
        this.trigger('enter', this);
      }
    }).catch(err => {
      this.onError(err);
      this.trigger('error', this, err);
      Backbone.history.trigger('error', this, err);
    });
  },

  /**
   * @public
   * @abstract
   * @method onBeforeEnter
   */
  onBeforeEnter() {},

  /**
   * @public
   * @abstract
   * @method onBeforeRoute
   */
  onBeforeRoute() {},

  /**
   * @public
   * @abstract
   * @method onRoute
   */
  onRoute() {},

  /**
   * @public
   * @abstract
   * @method onEnter
   */
  onEnter() {},

  /**
   * @public
   * @abstract
   * @method onError
   */
  onError() {},

  /**
   * @public
   * @method execute
   * @param {Function} callback
   * @param {Array} [args]
   * @returns {Promise}
   */
  _execute(callback, args) {
    return Promise.resolve().then(() => {
      if (Router._prevRoute instanceof Route) {
        return Router._prevRoute.exit();
      }
    }).then(() => {
      let route = Router._prevRoute = callback.apply(this, args);
      if (route instanceof Route) {
        route.router = this;
        return route.enter(args);
      }
    });
  },

  /**
   * @private
   * @method _onHistoryRoute
   * @param {Router} router
   */
  _onHistoryRoute(router) {
    this._isActive = (router === this);
  }
}, {

  /**
   * @private
   * @member _prevRoute
   */
  _prevRoute: null
});

export default {Route, Router};
