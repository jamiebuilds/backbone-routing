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
   * @abstract
   * @method fetch
   */
  fetch() {},

  /**
   * @public
   * @abstract
   * @method render
   */
  render() {},

  /**
   * @public
   * @abstract
   * @method destroy
   */
  destroy() {},

  /**
   * @private
   * @method _onHistoryRoute
   */
  _onHistoryRoute(router) {
    this._isActive = (router === this);
  },

  /**
   * @public
   * @method enter
   * @returns {Promise}
   */
  enter(args = []) {
    this._triggerMethod('before:enter', 'onBeforeEnter', args);
    this._triggerMethod('before:fetch', 'onBeforeFetch', args);
    return Promise.resolve()
      .then(() => this.fetch(...args))
      .then(() => {
        this._triggerMethod('fetch', 'onFetch', args);
        this._triggerMethod('before:render', 'onBeforeRender', args);
      })
      .then(() => this.render(...args))
      .then(() => {
        this._triggerMethod('render', 'onRender', args);
        this._triggerMethod('enter', 'onEnter', args);
      })
      .catch(err => {
        this._triggerMethod('error', 'onError', [err]);
        this._triggerMethod('error:enter', 'onErrorEnter', [err]);
        throw err;
      });
  },

  /**
   * @public
   * @method exit
   * @returns {Promise}
   */
  exit() {
    this._triggerMethod('before:exit', 'onBeforeExit');
    this._triggerMethod('before:destroy', 'onBeforeDestroy');
    return Promise.resolve()
      .then(() => this.destroy())
      .then(() => {
        this._triggerMethod('destroy', 'onDestroy');
        this._triggerMethod('exit', 'onExit');
        this.stopListening();
      })
      .catch(err => {
        this._triggerMethod('error', 'onError', [err]);
        this._triggerMethod('error:exit', 'onErrorExit', [err]);
        this.stopListening();
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
  _triggerMethod(name, callbackName, args = []) {
    if (this[callbackName]) {
      this[callbackName](...args);
    }
    this.trigger(name, this, ...args);

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

    Promise.resolve(this._execute(callback, args)).then(() => {
      if (wasInactive) {
        this.onEnter();
        this.trigger('enter');
      }

      this.onRoute();
      this.trigger('route');
    }).catch(err => {
      this.onError(err);
      this.trigger('error', this, err);
      Backbone.history.trigger('error', this, err);
    });
  },

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
