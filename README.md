# Backbone Routing

Simple router and route classes for Backbone.

[![Travis build status](http://img.shields.io/travis/thejameskyle/backbone-routing.svg?style=flat)](https://travis-ci.org/thejameskyle/backbone-routing)
[![Code Climate](https://codeclimate.com/github/thejameskyle/backbone-routing/badges/gpa.svg)](https://codeclimate.com/github/thejameskyle/backbone-routing)
[![Test Coverage](https://codeclimate.com/github/thejameskyle/backbone-routing/badges/coverage.svg)](https://codeclimate.com/github/thejameskyle/backbone-routing)
[![Dependency Status](https://david-dm.org/thejameskyle/backbone-routing.svg)](https://david-dm.org/thejameskyle/backbone-routing)
[![devDependency Status](https://david-dm.org/thejameskyle/backbone-routing/dev-status.svg)](https://david-dm.org/thejameskyle/backbone-routing#info=devDependencies)

## Usage

> _**Note:** Backbone-routing requires a global `Promise` object to
> exist, please include a `Promise` polyfill if necessary._

```js
import {Route, Router} from 'backbone-routing';

const IndexRoute = Route.extend({
  initialize(options) {
    this.collection = options.collection;
  },

  fetch() {
    return this.collection.fetch();
  },

  render() {
    this.view = new View();
    this.view.render();
  },

  destroy() {
    this.view.remove();
  }
});

const ShowRoute = Route.extend({
  initialize(options) {
    this.collection = options.collection;
  },

  fetch(id) {
    this.model = this.collection.get(id);

    if (!this.model) {
      this.model = new Model({id});
      return this.model.fetch();
    }
  },

  render() {
    this.view = new View({
      model: this.model
    });
  },

  destroy() {
    this.view.remove();
  }
});

const MyRouter = Router.extend({
  initialize() {
    this.collection = new Collection();
  },

  routes: {
    '' : 'index',
    ':id' : 'show'
  },

  index() {
    return new IndexRoute({
      collection: this.collection
    });
  },

  show() {
    return new ShowRoute({
      collection: this.collection
    });
  }
});
```

## Contibuting

### Getting Started

[Fork](https://help.github.com/articles/fork-a-repo/) and
[clone](http://git-scm.com/docs/git-clone) this repo.

```
git clone git@github.com:thejameskyle/backbone-routing.git && cd backbone-routing
```

Make sure [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/) are
[installed](http://nodejs.org/download/).

```
npm install
```

### Running Tests

```
npm test
```

===

© 2015 James Kyle. Distributed under ISC license.
