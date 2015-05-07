import Backbone from 'backbone';
import Metal from 'backbone-metal';

/**
 * @public
 * @class CancellationError
 */
const CancellationError = Metal.Error.extend({
  name: 'CancellationError'
});

/**
 * @public
 * @class Route
 */
const Route = Metal.Class.extend({

  /**
   * @public
   * @method enter
   * @returns {Promise}
   * @param {...*} [args=[]]
   */
  enter(args = []) {
    this._isEntering = true;
    this.onBeforeEnter(...args);
    this.trigger('before:enter', this, ...args);
    this.onBeforeFetch(...args);
    this.trigger('before:fetch', this, ...args);

    return Promise.resolve()
      .then(() => {
        if (this._isCancelled) {
          return Promise.reject(new CancellationError());
        }
        return this.fetch(...args);
      })
      .then(() => {
        this.onFetch(...args);
        this.trigger('fetch', this, ...args);
        this.onBeforeRender(...args);
        this.trigger('before:render', this, ...args);
      })
      .then(() => {
        if (this._isCancelled) {
          return Promise.reject(new CancellationError());
        }
        return this.render(...args);
      })
      .then(() => {
        this._isEntering = false;
        this.onRender(...args);
        this.trigger('render', this, ...args);
        this.onEnter(...args);
        this.trigger('enter', this, ...args);
      })
      .catch(err => {
        this._isEntering = false;
        if (err instanceof CancellationError) {
          this.onCancel();
          this.trigger('cancel', this);
        } else {
          this.onError(err);
          this.trigger('error', this, err);
          this.onErrorEnter(err);
          this.trigger('error:enter', this, err);
          throw err;
        }
      });
  },

  /**
   * @public
   * @method exit
   * @returns {Promise}
   */
  exit() {
    if (this._isEntering) {
      this.cancel();
    }
    this._isExiting = true;
    this.onBeforeExit();
    this.trigger('before:exit', this);
    this.onBeforeDestroy();
    this.trigger('before:destroy', this);

    return Promise.resolve()
      .then(() => this.destroy())
      .then(() => {
        this._isExiting = false;
        this.onDestroy();
        this.trigger('destroy', this);
        this.onExit();
        this.trigger('exit', this);
        this.stopListening();
      })
      .catch(err => {
        this._isExiting = false;
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
   * @method cancel
   * @returns {Promise}
   */
  cancel() {
    if (!this._isEntering) {
      return;
    }
    this.onBeforeCancel();
    this.trigger('before:cancel', this);
    this._isCancelled = true;
    return new Promise((resolve, reject) => {
      this.once('cancel', resolve);
      this.once('enter error', reject);
    });
  },

  /**
   * @public
   * @method isEntering
   * @returns {Boolean}
   */
  isEntering() {
    return !!this._isEntering;
  },

  /**
   * @public
   * @method isExiting
   * @returns {Boolean}
   */
  isExiting() {
    return !!this._isExiting;
  },

  /**
   * @public
   * @method isCancelled
   * @returns {Boolean}
   */
  isCancelled() {
    return !!this._isCancelled;
  },

  /* jshint unused:false */

  /**
   * @public
   * @abstract
   * @method onBeforeEnter
   * @param {...*} [args=[]]
   */
  onBeforeEnter() {},

  /**
   * @public
   * @abstract
   * @method onBeforeFetch
   * @param {...*} [args=[]]
   */
  onBeforeFetch() {},

  /**
   * @public
   * @abstract
   * @method fetch
   * @param {...*} [args=[]]
   */
  fetch() {},

  /**
   * @public
   * @abstract
   * @method onFetch
   * @param {...*} [args=[]]
   */
  onFetch() {},

  /**
   * @public
   * @abstract
   * @method onBeforeRender
   * @param {...*} [args=[]]
   */
  onBeforeRender() {},

  /**
   * @public
   * @abstract
   * @method render
   * @param {...*} [args=[]]
   */
  render() {},

  /**
   * @public
   * @abstract
   * @method onRender
   * @param {...*} [args=[]]
   */
  onRender() {},

  /**
   * @public
   * @abstract
   * @method onEnter
   * @param {...*} [args=[]]
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
   * @method onBeforeCancel
   */
  onBeforeCancel() {},

  /**
   * @public
   * @abstract
   * @method onCancel
   */
  onCancel() {},

  /**
   * @public
   * @abstract
   * @method onError
   * @param {Error} err
   */
  onError(err) {},

  /**
   * @public
   * @abstract
   * @method onErrorEnter
   * @param {Error} err
   */
  onErrorEnter(err) {},

  /**
   *
   * @public
   * @abstract
   * @method onErrorExit
   * @param {Error} err
   */
  onErrorExit(err) {} // jshint ignore:line

  /* jshint unused:true */
});

/**
 * @public
 * @class Router
 */
const Router = Metal.Class.extend(Backbone.Router.prototype, Backbone.Router).extend({
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
    let wasInactive = !this._isActive;
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

  /* jshint unused:false */

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
   * @param {Error} err
   */
  onError(err) {},

  /* jshint unused:true */

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

export default {Route, Router, CancellationError};
