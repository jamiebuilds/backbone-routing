import _ from 'lodash';
import Backbone from 'backbone';
import $ from 'jquery';
import {Route, Router} from '../../src/backbone-routing';

Backbone.$ = $;

function stubHooks(target, hooks) {
  stub(target, 'trigger');

  _.each(hooks, function(event, method) {
    stub(target, method);
  });
}

function checkHooks(target, hooks, calledHooks) {
  let prev;
  _.each(hooks, function(event, method) {
    let args = calledHooks[method];
    if (args) {
      expect(target[method]).to.have.been.calledOnce.and.calledWith(...args);
      if (event) {
        expect(target.trigger).to.have.been.calledWith(event, target, ...args);
      }
      if (prev) {
        expect(target[method]).to.have.been.calledAfter(target[prev]);
      }
      prev = method;
    } else {
      expect(target[method]).not.to.have.been.called;
      if (event) {
        expect(target.trigger).not.to.have.been.calledWith(event, target, ...args);
      }
      prev = null;
    }
  });
}

let routeHooks = {
  onBeforeEnter   : 'before:enter',
  onBeforeFetch   : 'before:enter',
  fetch           : null,
  onFetch         : 'fetch',
  onBeforeRender  : 'before:render',
  render          : null,
  onRender        : 'render',
  onEnter         : 'enter',

  onBeforeExit    : 'before:exit',
  onBeforeDestroy : 'before:destroy',
  destroy         : null,
  onDestroy       : 'destroy',
  onExit          : 'exit',

  onError         : 'error',
  onErrorEnter    : 'error:enter',
  onErrorExit     : 'error:exit'
};

describe('Route', function() {
  beforeEach(function() {
    this.router = new Router();
    this.route = new Route();
  });

  describe('#enter', function() {
    it('should call all the methods in the appropriate order', function() {
      let args = [1, 2, 3];

      stubHooks(this.route, routeHooks);

      return this.route.enter(args).then(() => {
        checkHooks(this.route, routeHooks, {
          onBeforeEnter  : args,
          onBeforeFetch  : args,
          fetch          : args,
          onFetch        : args,
          onBeforeRender : args,
          render         : args,
          onRender       : args,
          onEnter        : args
        });
      });
    });

    describe('when fetch errors', function() {
      it('should call all the methods in the appropriate order', function() {
        let args = [1, 2, 3];
        let err = new Error('FooError');

        stubHooks(this.route, routeHooks);
        this.route.fetch.throws(err);

        return this.route.enter(args).catch(_err => {
          expect(_err).to.equal(err);
        }).then(() => {
          checkHooks(this.route, routeHooks, {
            onBeforeEnter : args,
            onBeforeFetch : args,
            fetch         : args,
            onError       : [err],
            onErrorEnter  : [err]
          });
        });
      });
    });

    describe('when render errors', function() {
      it('should call all the methods in the appropriate order', function() {
        let args = [1, 2, 3];
        let err = new Error('FooError');

        stubHooks(this.route, routeHooks);
        this.route.render.throws(err);

        return this.route.enter(args).catch(_err => {
          expect(_err).to.equal(err);
        }).then(() => {
          checkHooks(this.route, routeHooks, {
            onBeforeEnter  : args,
            onBeforeFetch  : args,
            fetch          : args,
            onFetch        : args,
            onBeforeRender : args,
            render         : args,
            onError        : [err],
            onErrorEnter   : [err]
          });
        });
      });
    });
  });

  describe('#exit', function() {
    it('should call all the methods in the appropriate order', function() {
      stubHooks(this.route, routeHooks);

      return this.route.exit().then(() => {
        checkHooks(this.route, routeHooks, {
          onBeforeExit    : [],
          onBeforeDestroy : [],
          destroy         : [],
          onDestroy       : [],
          onExit          : []
        });
      });
    });

    describe('when destroy errors', function() {
      it('should call all the methods in the appropriate order', function() {
        let err = new Error('FooError');

        stubHooks(this.route, routeHooks);
        this.route.destroy.throws(err);

        return this.route.exit().catch(_err => {
          expect(_err).to.equal(err);
        }).then(() => {
          checkHooks(this.route, routeHooks, {
            onBeforeExit    : [],
            onBeforeDestroy : [],
            destroy         : [],
            onError         : [err],
            onErrorExit     : [err]
          });
        });
      });
    });
  });

  describe('#cancel', function() {

  });

  describe('#isEntering', function() {
    it('should return false before entering', function() {
      expect(this.route.isEntering()).to.be.false;
    });

    it('should return true while entering', function() {
      let entering = this.route.enter();
      expect(this.route.isEntering()).to.be.true;
      return entering;
    });

    it('should return false after entering', function() {
      return this.route.enter().then(() => {
        expect(this.route.isEntering()).to.be.false;
      });
    });
  });

  describe('#isExiting', function() {
    beforeEach(function() {
      return this.route.enter();
    });

    it('should return false before exiting', function() {
      expect(this.route.isExiting()).to.be.false;
    });

    it('should return true while exiting', function() {
      let exiting = this.route.exit();
      expect(this.route.isExiting()).to.be.true;
      return exiting;
    });

    it('should return false after exiting', function() {
      return this.route.exit().then(() => {
        expect(this.route.isExiting()).to.be.false;
      });
    });
  });

  describe('#isCancelled', function() {
    it('should return false before cancelling', function() {
      let entering = this.route.enter();
      expect(this.route.isCancelled()).to.be.false;
      return entering;
    });

    it('should return true after cancelling', function() {
      let entering = this.route.enter();
      let cancelling = this.route.cancel();
      expect(this.route.isCancelled()).to.be.true;
      return Promise.all([entering, cancelling]);
    });
  });
});

let routerHooks = {
  onBeforeEnter : 'before:enter',
  onBeforeRoute : 'before:route',
  callback      : null,
  onRoute       : 'route',
  onEnter       : 'enter',

  onError       : 'error'
};

describe('Router', function() {
  beforeEach(function() {
    this.router = new Router();
    this.route = new Route();
    this.router.callback = function() {};
  });

  describe('#execute', function() {
    it('should call the callback', function() {
      let args = [1, 2, 3];

      stub(this.router, 'callback');

      return this.router.execute(this.router.callback, args).then(() => {
        expect(this.router.callback).to.have.been.calledWith(...args);
      });
    });

    it('should call all the methods in the appropriate order', function() {
      let args = [1, 2, 3];

      stubHooks(this.router, routerHooks);

      return this.router.execute(this.router.callback, args).then(() => {
        checkHooks(this.router, routerHooks, {
          onBeforeEnter  : [],
          onBeforeRoute  : [],
          callback       : args,
          onRoute        : [],
          onEnter        : []
        });
      });
    });
  });

  describe('#isActive', function() {
    it('should return false before a router becomes active', function() {
      expect(this.router.isActive()).to.be.false;
    });

    it('should return true when a router is active', function() {
      Backbone.history.trigger('route', this.router);
      expect(this.router.isActive()).to.be.true;
    });

    it('should return false after a router becomes inactive', function() {
      Backbone.history.trigger('route', this.router);
      Backbone.history.trigger('route', {});
      expect(this.router.isActive()).to.be.false;
    });
  });
});

function createStubbedRoute() {
  let route = new Route();
  route.fetch = stub();
  route.render = stub();
  route.destroy = stub();
  return route;
}

describe('Integration', function() {
  beforeEach(function() {
    Backbone.history.navigate('');
    Backbone.history.start();
  });

  afterEach(function() {
    Backbone.history.navigate('');
    Backbone.history.stop();
  });

  describe('Entering', function() {
    beforeEach(function() {
      this.route = createStubbedRoute();
      this.router = new Router({
        routes: {
          'route/:arg1/:arg2': () => this.route
        }
      });
    });

    it('should enter the route successfully', function(done) {
      this.route.onBeforeEnter = () => {
        expect(this.route.fetch).not.to.have.been.called;
        expect(this.route.render).not.to.have.been.called;
      };

      this.route.onEnter = () => {
        expect(this.route.fetch).to.have.been.called;
        expect(this.route.render).to.have.been.called;
        done();
      };

      this.route.onError = done;

      Backbone.history.navigate('route/1/2', true);
    });
  });

  describe('Exiting', function() {
    beforeEach(function(done) {
      this.route1 = createStubbedRoute();
      this.route2 = createStubbedRoute();

      this.router = new Router({
        routes: {
          'route1/:arg1/:arg2': () => this.route1,
          'route2/:arg1/:arg2': () => this.route2
        }
      });

      this.route1.onEnter = () => done();
      Backbone.history.navigate('route1/1/2', true);
    });

    it('should exit the route successfully', function(done) {
      this.route1.onBeforeExit = () => {
        expect(this.route1.destroy).not.to.have.been.called;
      };

      this.route1.onExit = () => {
        expect(this.route1.destroy).to.have.been.called;
        expect(this.route2.fetch).not.to.have.been.called;
        expect(this.route2.render).not.to.have.been.called;
      };

      this.route2.onEnter = () => {
        expect(this.route2.fetch).to.have.been.called;
        expect(this.route2.render).to.have.been.called;
        done();
      };

      this.route1.onError = this.route2.onError = done;

      Backbone.history.navigate('route2/1/2', true);
    });
  });

  describe('Cancelling', function() {
    beforeEach(function() {
      this.route = createStubbedRoute();
      this.router = new Router({
        routes: {
          'route/:arg1/:arg2': () => this.route
        }
      });
    });

    it('should cancel the route successfully', function(done) {
      this.route.onFetch = this.route.cancel;

      this.route.onRender = this.route.onCancel = () => {
        expect(this.route.render).not.to.have.been.called;
        done();
      };

      this.route.onError = done;

      Backbone.history.navigate('route/1/2', true);
    });
  });
});
