var Config = require('../../public/js/lib/config');
var deviceTypes = Config.Enums['Device Model Types'];
var getPropertyObject = Config.Utility.getPropertyObject;
var data;
var point;
var oldPoint;

var VAVChannels = {
  '1 - Zone Temperature': 1,
  '2 - Setpoint Adjust': 2,
  '3 - Supply Temperature': 3,
  '4 - Auxiliary': 4,
  '5 - Air Volume': 5
};

var comparePoints = function(point, oldPoint) {
  var compareRefs = function(ref, index) {
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
  }
};

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

  it('should update Unknown model', function() {
    point._devModel = deviceTypes.Unknown.enum;
    Config.EditChanges.applyAnalogInputTypeDevModel(data);

    expect(point._relPoint).to.equal(130);
    expect(point._devModel).to.equal(0);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(false);
    expect(point['VAV Channel'].ValueOptions).to.deep.equal(VAVChannels);
  });

  it('should update Central Device model', function() {
    point._devModel = deviceTypes['Central Device'].enum;
    Config.EditChanges.applyAnalogInputTypeDevModel(data);

    expect(point._relPoint).to.equal(130);
    expect(point._devModel).to.equal(1);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(false);
    expect(point['VAV Channel'].ValueOptions).to.deep.equal(VAVChannels);
  });

  it('should update MicroScan 5 xTalk model', function() {
    var sensorPoint = getPropertyObject('Sensor Point', point);
    point._devModel = deviceTypes['MicroScan 5 xTalk'].enum;
    Config.EditChanges.applyAnalogInputTypeDevModel(data);

    expect(point._relPoint).to.equal(131);
    expect(point._devModel).to.equal(18);
    expect(point.Channel.isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(false);
    expect(point['Conversion Type'].isDisplayable).to.equal(false);
    expect(point['Input Type'].isDisplayable).to.equal(false);
    expect(sensorPoint.isDisplayable).to.equal(false);
    expect(point['VAV Channel'].ValueOptions).to.deep.equal(VAVChannels);
  });

  it('should update MicroScan 5 UNV model', function() {
    point._devModel = deviceTypes['MicroScan 5 UNV'].enum;
    Config.EditChanges.applyAnalogInputTypeDevModel(data);

    expect(point._relPoint).to.equal(0);
    expect(point._devModel).to.equal(19);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(false);
    expect(point['VAV Channel'].ValueOptions).to.deep.equal(VAVChannels);
  });

  it('should update SCADA VIO model', function() {
    point._devModel = deviceTypes['SCADA Vio'].enum;
    Config.EditChanges.applyAnalogInputTypeDevModel(data);

    expect(point._relPoint).to.equal(0);
    expect(point._devModel).to.equal(20);
    expect(point.Channel.Max).to.equal(2);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(false);
    expect(point['Input Type'].ValueOptions).to.deep.equal({
      '20 mA SP': 3,
      'Rate Input': 5
    });
    expect(point['VAV Channel'].ValueOptions).to.deep.equal(VAVChannels);
  });

  it('should update SCADA IO model', function() {
    point._devModel = deviceTypes['SCADA IO'].enum;
    Config.EditChanges.applyAnalogInputTypeDevModel(data);

    expect(point._relPoint).to.equal(0);
    expect(point._devModel).to.equal(21);
    expect(point.Channel.Max).to.equal(8);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(false);
    expect(point['Input Type'].ValueOptions).to.deep.equal({
      '10 Volts': 2,
      '20 mA': 3,
      'Rate Input': 5,
      'Internal Input': 6
    });
    expect(point['VAV Channel'].ValueOptions).to.deep.equal(VAVChannels);
  });
});