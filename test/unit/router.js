import {Router, Route} from '../../src/backbone-routing';

describe('Router', function() {
  beforeEach(function() {
    this.route = new Route();
    this.router = new Router();
  });

  describe('#execute', function() {
    it('should call the callback', function() {
      let callback = stub();
      let args = [1, 2, 3];
      this.router.execute(callback, args);
      expect(callback).to.have.been.calledWith(...args);
    });
  });
});
