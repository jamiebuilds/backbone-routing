import _ from 'lodash';
import Backbone from 'backbone';
import $ from 'jquery';
import {Route, Router} from '../../src/backbone-routing';

Backbone.$ = $;

function stubHooks(target, hooks) {
  spy(target, 'trigger');

  _.each(hooks, (hook) => {
    if (hook.method) {
      hook.stub = stub(target, hook.method);
    } else if (hook.event) {
      hook.stub = stub();
      target.on(hook.event, hook.stub);
    }
  });
}

function checkHooks(target, hooks, calledHooks) {
  let prev;
  _.each(hooks, (hook) => {
    let type = hook.event ? 'event' : 'method';
    let name = hook[type];

    let match = _.findWhere(calledHooks, { [type]: name });

    if (!match) {
      expect(hook.stub, name).not.to.have.been.called;
    } else {
      expect(hook.stub, name).to.have.been.calledOnce.and.calledWith(...match.args);

      if (prev) {
        expect(prev.stub).to.have.been.calledBefore(hook.stub);
      }

      prev = hook;
    }
  });
}

function resetHooks(hooks) {
  _.each(hooks, (hook) => {
    hook.stub.reset();
  });
}

let routeHooks = [
  { event  : 'before:enter'   },
  { event  : 'before:enter'   },
  { method : 'fetch'          },
  { event  : 'fetch'          },
  { event  : 'before:render'  },
  { method : 'render'         },
  { event  : 'render'         },
  { event  : 'enter'          },

  { event  : 'before:exit'    },
  { event  : 'before:destroy' },
  { method : 'destroy'        },
  { event  : 'destroy'        },
  { event  : 'exit'           },
  { event  : 'error'          },
  { event  : 'error:enter'    },
  { event  : 'error:exit'     },
];

describe('Route', function() {
  beforeEach(function() {
    this.router = new Router();
    this.route = new Route();
  });

  describe('#enter', function() {
    beforeEach(function() {
      stubHooks(this.route, routeHooks);
    });

    afterEach(function() {
      resetHooks(routeHooks);
    });

    it('should call all the methods in the appropriate order', function() {
      let args = [1, 2, 3];

      return this.route.enter(args).then(() => {
        checkHooks(this.route, routeHooks, [
          { event  : 'before:enter',  args: [this.route, ...args] },
          { event  : 'before:fetch',  args: [this.route, ...args] },
          { method : 'fetch',         args },
          { event  : 'fetch',         args: [this.route, ...args] },
          { event  : 'before:render', args: [this.route, ...args] },
          { method : 'render',        args },
          { event  : 'render',        args: [this.route, ...args] },
          { event  : 'enter',         args: [this.route, ...args] },
        ]);
      });
    });

    describe('when fetch errors', function() {
      it('should call all the methods in the appropriate order', function() {
        let args = [1, 2, 3];
        let err = new Error('FooError');

        this.route.fetch.throws(err);

        return this.route.enter(args).catch(_err => {
          expect(_err).to.equal(err);
        }).then(() => {
          checkHooks(this.route, routeHooks, [
            { event  : 'before:enter', args: [this.route, ...args] },
            { event  : 'before:fetch', args: [this.route, ...args] },
            { method : 'fetch',        args },
            { event  : 'error',        args: [this.route, err] },
            { event  : 'error:enter',  args: [this.route, err] },
          ]);
        });
      });
    });

    describe('when render errors', function() {
      it('should call all the methods in the appropriate order', function() {
        let args = [1, 2, 3];
        let err = new Error('FooError');

        this.route.render.throws(err);

        return this.route.enter(args).catch(_err => {
          expect(_err).to.equal(err);
        }).then(() => {
          checkHooks(this.route, routeHooks, [
            { event  : 'before:enter',  args: [this.route, ...args] },
            { event  : 'before:fetch',  args: [this.route, ...args] },
            { method : 'fetch',         args },
            { event  : 'fetch',         args: [this.route, ...args] },
            { event  : 'before:render', args: [this.route, ...args] },
            { method : 'render',        args },
            { event  : 'error',         args: [this.route, err] },
            { event  : 'error:enter',   args: [this.route, err] },
          ]);
        });
      });
    });
  });

  describe('#exit', function() {
    beforeEach(function() {
      stubHooks(this.route, routeHooks);
    });

    afterEach(function() {
      resetHooks(routeHooks);
    });

    it('should call all the methods in the appropriate order', function() {
      return this.route.exit().then(() => {
        checkHooks(this.route, routeHooks, [
          { event  : 'before:exit',    args: [this.route] },
          { event  : 'before:destroy', args: [this.route] },
          { method : 'destroy',        args: [] },
          { event  : 'destroy',        args: [this.route] },
          { event  : 'exit',           args: [this.route] },
        ]);
      });
    });

    describe('when destroy errors', function() {
      it('should call all the methods in the appropriate order', function() {
        let err = new Error('FooError');

        this.route.destroy.throws(err);

        return this.route.exit().catch(_err => {
          expect(_err).to.equal(err);
        }).then(() => {
          checkHooks(this.route, routeHooks, [
            { event  : 'before:exit',    args: [this.route] },
            { event  : 'before:destroy', args: [this.route] },
            { method : 'destroy',        args: [] },
            { event  : 'error',          args: [this.route, err] },
            { event  : 'error:exit',     args: [this.route, err] }
          ]);
        });
      });
    });
  });

  describe('#cancel', function() {
    beforeEach(function() {
      stubHooks(this.route, routeHooks);
    });

    afterEach(function() {
      resetHooks(routeHooks);
    });
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

let routerHooks = [
  { event  : 'before:enter' },
  { event  : 'before:route' },
  { method : 'callback'     },
  { event  : 'route'        },
  { event  : 'enter'        },
  { event  : 'error'        },
];

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
        checkHooks(this.router, routerHooks, [
          { event  : 'before:enter', args: [] },
          { event  : 'before:route', args: [] },
          { method : 'callback',     args },
          { event  : 'route',        args: [] },
          { event  : 'enter',        args: [] },
        ]);
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
      this.route.on('before:enter', () => {
        expect(this.route.fetch).not.to.have.been.called;
        expect(this.route.render).not.to.have.been.called;
      });

      this.route.on('enter', () => {
        expect(this.route.fetch).to.have.been.called;
        expect(this.route.render).to.have.been.called;
        done();
      });

      this.route.on('error', (route, err) => done(err));

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

      this.route1.on('enter', () => done());
      Backbone.history.navigate('route1/1/2', true);
    });

    it('should exit the route successfully', function(done) {
      this.route1.on('before:exit', () => {
        expect(this.route1.destroy).not.to.have.been.called;
      });

      this.route1.on('exit', () => {
        expect(this.route1.destroy).to.have.been.called;
        expect(this.route2.fetch).not.to.have.been.called;
        expect(this.route2.render).not.to.have.been.called;
      });

      this.route2.on('enter', () => {
        expect(this.route2.fetch).to.have.been.called;
        expect(this.route2.render).to.have.been.called;
        done();
      });

      this.route1.on('error', (route, err) => done(err));
      this.route2.on('error', (route, err) => done(err));

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
      this.route.on('fetch', this.route.cancel);
      this.route.on('render cancel', () => {
        expect(this.route.render).not.to.have.been.called;
        done();
      });

      this.route.on('error', (route, err) => done(err));
      Backbone.history.navigate('route/1/2', true);
    });
  });
});
