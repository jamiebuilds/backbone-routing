import {Route, Router} from '../../src/backbone-routing';

describe('Route', function() {
  beforeEach(function() {
    this.router = new Router();
    this.route = new Route();
    this.route.router = this.router;
  });

  describe('#enter', function() {
    it('should call all the methods in the appropriate order', function() {
      let args = [1, 2, 3];

      stub(this.route, '_triggerMethod');

      stub(this.route, 'fetch', () => {
        expect(this.route._triggerMethod.args).to.deep.equal([
          ['before:enter', 'onBeforeEnter', args],
          ['before:fetch', 'onBeforeFetch', args]
        ]);
      });

      stub(this.route, 'render', () => {
        expect(this.route._triggerMethod.args).to.deep.equal([
          ['before:enter', 'onBeforeEnter', args],
          ['before:fetch', 'onBeforeFetch', args],
          ['fetch', 'onFetch', args],
          ['before:render', 'onBeforeRender', args]
        ]);
      });

      return this.route.enter(args).then(() => {
        expect(this.route._triggerMethod.args).to.deep.equal([
          ['before:enter', 'onBeforeEnter', args],
          ['before:fetch', 'onBeforeFetch', args],
          ['fetch', 'onFetch', args],
          ['before:render', 'onBeforeRender', args],
          ['render', 'onRender', args],
          ['enter', 'onEnter', args]
        ]);

        expect(this.route.fetch).to.have.been.calledWith(...args);
        expect(this.route.render).to.have.been.calledWith(...args);
      });
    });

    describe('when fetch errors', function() {
      it('should call all the methods in the appropriate order', function() {
        let error = new Error('FooError');

        stub(this.route, '_triggerMethod');
        stub(this.route, 'fetch').throws(error);
        stub(this.route, 'render');

        return this.route.enter().catch(err => {
          expect(err).to.equal(error);
        }).then(() => {
          expect(this.route._triggerMethod.args).to.deep.equal([
            ['before:enter', 'onBeforeEnter', []],
            ['before:fetch', 'onBeforeFetch', []],
            ['error', 'onError', [error]],
            ['error:enter', 'onErrorEnter', [error]]
          ]);
          expect(this.route.render).not.to.have.been.called;
        });
      });
    });

    describe('when render errors', function() {
      it('should call all the methods in the appropriate order', function() {
        let error = new Error('FooError');

        stub(this.route, '_triggerMethod');
        stub(this.route, 'fetch');
        stub(this.route, 'render').throws(error);

        return this.route.enter().catch(err => {
          expect(err).to.equal(error);
        }).then(() => {
          expect(this.route._triggerMethod.args).to.deep.equal([
            ['before:enter', 'onBeforeEnter', []],
            ['before:fetch', 'onBeforeFetch', []],
            ['fetch', 'onFetch', []],
            ['before:render', 'onBeforeRender', []],
            ['error', 'onError', [error]],
            ['error:enter', 'onErrorEnter', [error]]
          ]);
        });
      });
    });
  });

  describe('#exit', function() {
    it('should call all the methods in the appropriate order', function() {
      stub(this.route, '_triggerMethod');

      stub(this.route, 'destroy', () => {
        expect(this.route._triggerMethod.args).to.deep.equal([
          ['before:exit', 'onBeforeExit'],
          ['before:destroy', 'onBeforeDestroy']
        ]);
      });

      return this.route.exit().then(() => {
        expect(this.route._triggerMethod.args).to.deep.equal([
          ['before:exit', 'onBeforeExit'],
          ['before:destroy', 'onBeforeDestroy'],
          ['destroy', 'onDestroy'],
          ['exit', 'onExit']
        ]);

        expect(this.route.destroy).to.have.been.called;
      });
    });

    describe('when destroy errors', function() {
      it('should call all the methods in the appropriate order', function() {
        let error = new Error('FooError');

        stub(this.route, '_triggerMethod');
        stub(this.route, 'destroy').throws(error);

        return this.route.exit().catch(err => {
          expect(err).to.equal(error);
        }).then(() => {
          expect(this.route._triggerMethod.args).to.deep.equal([
            ['before:exit', 'onBeforeExit'],
            ['before:destroy', 'onBeforeDestroy'],
            ['error', 'onError', [error]],
            ['error:exit', 'onErrorExit', [error]]
          ]);
          expect(this.route.destroy).to.have.been.called;
        });
      });
    });
  });
});
