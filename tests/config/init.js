/* global global, process, chai */
// process.env.NODE_ENV = 'tester';
var _ = require('lodash');

before(function(done) {

  global.chai = require('chai');
  global.expect = chai.expect;
  global._ = _;

  done();
});