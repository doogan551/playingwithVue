var Config = require('../../public/js/lib/config');
var enums = Config.Enums;
var data;
var point;
var oldPoint;

describe('Analog Input Model', function() {
  beforeEach(function() {
    point = Config.Templates.getTemplate('Analog Input');
    oldPoint = Config.Templates.getTemplate('Analog Input');
    data = {
    	point: point,
      oldPoint: oldPoint,
      property: ""
    };
  });

  it('should run update unknown model', function() {
    point._devModel = enums['Device Model Types'].Unknown.enum;
    var results = Config.EditChanges.applyAnalogInputTypeDevModel(data);
    /*for(var prop in point){
      if(!_.isEqual(point[prop], oldPoint[prop])){
        console.log('-----------');
        console.log('prop', prop);
        console.log(point[prop], oldPoint[prop]);
        console.log('-----------');
      }
    }*/
    expect(oldPoint._relPoint).to.not.equal(point._relPoint);
    expect(oldPoint['Conversion Coefficient 1'].isDisplayable).to.not.equal(point['Conversion Coefficient 1'].isDisplayable);
    expect(oldPoint['Conversion Coefficient 2'].isDisplayable).to.not.equal(point['Conversion Coefficient 2'].isDisplayable);
    expect(oldPoint['VAV Channel'].ValueOptions).to.not.deep.equal(point['VAV Channel'].ValueOptions);
  });
});
