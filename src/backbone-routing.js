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
    this.trigger('before:enter before:fetch', this, ...args);

    return Promise.resolve()
      .then(() => {
        if (this._isCancelled) {
          return Promise.reject(new CancellationError());
        }
        return this.fetch(...args);
      })
      .then(() => this.trigger('fetch before:render', this, ...args))
      .then(() => {
        if (this._isCancelled) {
          return Promise.reject(new CancellationError());
        }
        return this.render(...args);
      })
      .then(() => {
        this._isEntering = false;
        this.trigger('render enter', this, ...args);
      })
      .catch(err => {
        this._isEntering = false;
        if (err instanceof CancellationError) {
          this.trigger('cancel', this);
        } else {
          this.trigger('error error:enter', this, err);
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
    this.trigger('before:exit before:destroy', this);

    return Promise.resolve()
      .then(() => this.destroy())
      .then(() => {
        this._isExiting = false;
        this.trigger('destroy exit', this);
        this.stopListening();
      })
      .catch(err => {
        this._isExiting = false;
        this.trigger('error error:exit', this, err);
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
   * @method render
   * @param {...*} [args=[]]
   */
  render() {},

  /**
   * @public
   * @abstract
   * @method destroy
   */
  destroy() {}
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
      this.trigger('before:enter', this);
    }

    this.trigger('before:route', this);

    return Promise.resolve().then(() => {
      return this._execute(callback, args);
    }).then(() => {
      this.trigger('route', this);

      if (wasInactive) {
        this.trigger('enter', this);
      }
    }).catch(err => {
      this.trigger('error', this, err);
      Backbone.history.trigger('error', this, err);
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
