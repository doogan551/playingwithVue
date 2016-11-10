var Config = require('../../public/js/lib/config');
var deviceTypes = Config.Enums['Device Model Types'];
var getPropertyObject = Config.Utility.getPropertyObject;
var data;
var point;
var oldPoint;

var VAVChannels = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  '11': 11,
  '12': 12,
  '13': 13,
  '14': 14,
  '15': 15,
  '16': 16
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

  it('should update Unknown type', function() {
    point._devModel = deviceTypes.Unknown.enum;
    Config.EditChanges.applyAnalogInputDevModel(data);

    // Changed from template
    expect(point._devModel).to.equal(0);

    // Checks against code
    expect(point._relPoint).to.equal(130);
    expect(point.Channel.ValueOptions).to.deep.equal(VAVChannels);

    // Displayable
    expect(point['Conversion Type'].isDisplayable).to.equal(true);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(true);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(true);
    expect(getPropertyObject("Sensor Point", point).isDisplayable).to.equal(true);

    expect(point['Input Type'].isDisplayable).to.equal(false);
    expect(point['Channel'].isDisplayable).to.equal(false);
    expect(point['Instance'].isDisplayable).to.equal(false);
    expect(point['Read Only'].isDisplayable).to.equal(false);
    expect(point['Modbus Order'].isDisplayable).to.equal(false);
    expect(point['Poll Register'].isDisplayable).to.equal(false);
    expect(point['Poll Data Type'].isDisplayable).to.equal(false);
    expect(point['Poll Function'].isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 3'].isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 4'].isDisplayable).to.equal(false);

    // Read Only
    expect(point['Conversion Type'].isReadOnly).to.equal(false);
    expect(point['Conversion Coefficient 1'].isReadOnly).to.equal(false);
    expect(point['Conversion Coefficient 2'].isReadOnly).to.equal(false);
    expect(point['Conversion Coefficient 3'].isReadOnly).to.equal(false);
    expect(point['Conversion Coefficient 4'].isReadOnly).to.equal(false);

  });

  it('should update Central Device type', function() {
    point._devModel = deviceTypes['Central Device'].enum;
    Config.EditChanges.applyAnalogInputDevModel(data);

    expect(point._relPoint).to.equal(130);
    expect(point._devModel).to.equal(1);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(true);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(true);
    expect(point.Channel.ValueOptions).to.deep.equal(VAVChannels);
  });

  it('should update MicroScan 5 xTalk type', function() {
    var sensorPoint = getPropertyObject('Sensor Point', point);
    point._devModel = deviceTypes['MicroScan 5 xTalk'].enum;
    Config.EditChanges.applyAnalogInputDevModel(data);

    expect(point._relPoint).to.equal(131);
    expect(point._devModel).to.equal(18);
    expect(point.Channel.isDisplayable).to.equal(false);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(true);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(true);
    expect(point['Conversion Type'].isDisplayable).to.equal(true);
    expect(point['Input Type'].isDisplayable).to.equal(false);
    expect(sensorPoint.isDisplayable).to.equal(true);
    expect(point.Channel.ValueOptions).to.deep.equal(VAVChannels);
  });

  it('should update MicroScan 5 UNV type', function() {
    point._devModel = deviceTypes['MicroScan 5 UNV'].enum;
    Config.EditChanges.applyAnalogInputDevModel(data);

    expect(point._relPoint).to.equal(0);
    expect(point._devModel).to.equal(19);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(true);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(true);
    expect(point.Channel.ValueOptions).to.deep.equal(VAVChannels);
  });

  it('should update SCADA VIO type', function() {
    point._devModel = deviceTypes['SCADA Vio'].enum;
    Config.EditChanges.applyAnalogInputDevModel(data);

    expect(point._relPoint).to.equal(0);
    expect(point._devModel).to.equal(20);
    expect(point.Channel.Max).to.equal(undefined);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(true);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(true);
    expect(point['Input Type'].ValueOptions).to.deep.equal({
      '20 mA SP': 3,
      'Rate Input': 5
    });
    expect(point.Channel.ValueOptions).to.deep.equal({
      '1': 1,
      '2': 2
    });
  });

  it('should update SCADA IO type', function() {
    point._devModel = deviceTypes['SCADA IO'].enum;
    Config.EditChanges.applyAnalogInputDevModel(data);

    expect(point._relPoint).to.equal(0);
    expect(point._devModel).to.equal(21);
    expect(point.Channel.Max).to.equal(undefined);
    expect(point['Conversion Coefficient 1'].isDisplayable).to.equal(true);
    expect(point['Conversion Coefficient 2'].isDisplayable).to.equal(true);
    expect(point['Input Type'].ValueOptions).to.deep.equal({
      '10 Volts': 2,
      '20 mA': 3,
      'Rate Input': 5
    });
    expect(point.Channel.ValueOptions).to.deep.equal({
      'I/O 1': 1,
      'I/O 2': 2,
      'I/O 3': 3,
      'I/O 4': 4,
      'I/O 5': 5,
      'I/O 6': 6,
      'I/O 7': 7,
      'I/O 8': 8,
      'Battery Voltage': 9,
      'Temperature': 10,
      'Power Voltage': 11,
      'Power Current': 12,
      'Power Consumption': 13
    });
  });
});