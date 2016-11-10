/* global global, process, chai */
// process.env.NODE_ENV = 'tester';
var _ = require('lodash');

before(function(done) {

  global.chai = require('chai');
  global.expect = chai.expect;
  global._ = _;

  global.comparePoints = function(point, oldPoint) {
    // get array of property names, run it through compare fx
    // check for different objs and if one is missing from either point or new is missing/added one from enums template
    // do same thing with point refs
    var missingSubProps = {};

    var checkIsNumber = function(val) {
      var float = parseFloat(val);
      return typeof float === 'number' && !isNaN(float);
    };

    var checkForMissing = function(point, comparePoint, which) {
      Object.keys(point).forEach(function(prop) {
        if (!comparePoint.hasOwnProperty(prop)) {
          console.log('missing property in', which, '--', prop);
        } else if (typeof point[prop] === 'object') {
          Object.keys(point[prop]).forEach(function(property) {
            if (!comparePoint[prop].hasOwnProperty(property)) {
              missingSubProps[prop] = true;
              console.log('missing sub property in', which, '.', prop, '--', property);
            }
          });
        }
      });
    };

    var checkProperties = function(point, comparePoint) {
      for (var prop in point) {
        if (prop === 'Point Refs') {
          checkProperties(point[prop], comparePoint[prop]);
        } else if (!missingSubProps.hasOwnProperty(prop)) {
          if (comparePoint.hasOwnProperty(prop)) {
            if (!_.isEqual(point[prop], comparePoint[prop])) {
              console.log('***********');
              console.log('prop', checkIsNumber(prop) ? point[prop].PropertyName : prop);
              if (typeof point[prop] === 'object') {
                for (var property in point[prop]) {
                  if (comparePoint[prop].hasOwnProperty(property)) {
                    if (!_.isEqual(point[prop][property], comparePoint[prop][property])) {
                      console.log(property);
                      console.log('new', point[prop][property]);
                      console.log('old', comparePoint[prop][property]);
                      console.log('-----------');
                    }
                  }
                }
              } else {
                console.log(prop, point[prop], comparePoint[prop]);
                console.log('-----------');
              }
            }
          }
        }
      }
    };

    checkForMissing(point, oldPoint, 'old');
    checkForMissing(oldPoint, point, 'new');
    checkProperties(point, oldPoint);
  };

  global.checkValues = function(point, properties, subProp, val){
    properties.forEach(function(prop){
      // console.log(prop);
      expect(point[prop][subProp]).to.equal(val);
    });
  };

  done();
});