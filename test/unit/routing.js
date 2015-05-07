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
    this.route.router = this.router;
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
    this.route.router = this.router;
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
});

describe('Integration', function() {
  beforeEach(function(done) {
    this.Route = Route.extend({
      fetch: stub().returns(Promise.resolve()),
      render: stub().returns(Promise.resolve()),
      destroy: stub().returns(Promise.resolve())
    });

    this.route = new this.Route();

    this.Router = Router.extend({
      routes: {'foo/:arg1/:arg2': 'foo'},
      foo: () => this.route,
      onEnter: done
    });

    this.router = new this.Router();
    Backbone.history.start();
    Backbone.history.navigate('foo/1/2', true);
  });

  afterEach(function() {
    Backbone.history.stop();
  });

  it('should enter the route successfully', function() {
    expect(this.route.fetch).to.have.been.called;
  });
});
