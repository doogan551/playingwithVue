var Config = require('../../public/js/lib/config');
var deviceTypes = Config.Enums['Device Model Types'];
var getPropertyObject = Config.Utility.getPropertyObject;
var data;
var point;
var oldPoint;

// get array of property names, run it through compare fx
// check for different objs and if one is missing from either point or new is missing/added one from enums template
// do same thing with point refs
var comparePoints = function(point, oldPoint) {
  var props = Object.keys(point);
  var oldProps = Object.keys(oldPoint);
  var propsMissingFromNew = [];
  var propsMissingFromOld = [];

  var compareProperties = function(props, compareProps, point, comparePoint, missingProps) {
    props.forEach(function(prop) {
      if (prop === 'Point Refs') {
        var refProps = [];
        comparePoint[prop].forEach(function(ref){
          refProps.push(ref.PropertyName);
        });
        console.log(refProps);
      } else {
        if (comparePoint.hasOwnProperty(prop)) {
          if (!_.isEqual(point[prop], comparePoint[prop])) {
            console.log('-----------');
            console.log('old point prop', prop);
            console.log(point[prop]);
            console.log(comparePoint[prop]);
            console.log('-----------');
          }
        } else {
          missingProps.push(prop);
        }
      }
    });
  };

  compareProperties(props, oldProps, point, oldPoint, propsMissingFromOld);
  compareProperties(oldProps, props, oldPoint, point, propsMissingFromNew);


  /*var compareRefs = function(ref, index) {
    if (!_.isEqual(point[prop][index], oldPoint[prop][index])) {
      console.log('***********');
      console.log('prop', prop);
      console.log(point[prop][index]);
      console.log(oldPoint[prop][index]);
      console.log('***********');
    }
  };

  for (var prop in point) {
    if (prop === 'Point Refs') {
      point[prop].forEach(compareRefs);
    } else {
      if (!_.isEqual(point[prop], oldPoint[prop])) {
        console.log('-----------');
        console.log('prop', prop);
        console.log(point[prop]);
        console.log(oldPoint[prop]);
        console.log('-----------');
      }
    }
  }*/
};

describe('Device Model', function() {
  beforeEach(function() {
    point = Config.Templates.getTemplate('Device');
    oldPoint = Config.Templates.getTemplate('Device');
    data = {
      point: point,
      oldPoint: oldPoint,
      property: ""
    };
  });
  it('should run compare fx', function(){
    comparePoints(point, oldPoint);
  });
});