var Config = require('../../public/js/lib/config');
var deviceTypes = Config.Enums['Device Model Types'];
var portProtocols = Config.Enums['Port Protocols'];
var devicePorts = Config.Enums['Device Ports'];
var getPropertyObject = Config.Utility.getPropertyObject;
var data;
var point;
var oldPoint;

var checkBasicProperties = function() {
  expect(point['Model Type'].isDisplayable).to.equal(true);
  expect(point['Model Type'].isReadOnly).to.equal(false);
  expect(point['Model Type'].eValue).to.equal(point._devModel);
  expect(point._relPoint).to.equal(0);
};

describe('Device Model', function() {
  beforeEach(function() {
    point = Config.Templates.getTemplate('Device');
    oldPoint = Config.Templates.getTemplate('Device');
    data = {
      point: point,
      oldPoint: oldPoint,
      property: ''
    };
  });

  afterEach(function() {
    checkBasicProperties();
  });

  it('should update Unknown model', function() {
    point['Model Type'].Value = 'Unknown';
    point['Model Type'].eValue = deviceTypes.Unknown.enum;
    Config.EditChanges.applyDeviceDevModel(data);

    // Changed from template
    expect(point._devModel).to.equal(0);

    // Checks against code
    expect(point['Uplink Port'].ValueOptions).to.deep.equal({
      'Ethernet': 0,
      'Port 1': 1,
      'Port 2': 2,
      'Port 3': 3,
      'Port 4': 4
    });
    expect(point['Uplink Port'].Value).to.equal('Ethernet');
    expect(point['Uplink Port'].eValue).to.equal(0);

    // Displayable
    expect(point['Ethernet Address'].isDisplayable).to.equal(true);
    expect(point['Ethernet IP Port'].isDisplayable).to.equal(true);
    expect(point['Ethernet Network'].isDisplayable).to.equal(true);
    expect(point['Ethernet Protocol'].isDisplayable).to.equal(true);
    expect(point['Port 1 Protocol'].isDisplayable).to.equal(true);
    expect(point['Port 2 Protocol'].isDisplayable).to.equal(true);
    expect(point['Port 3 Protocol'].isDisplayable).to.equal(true);
    expect(point['Port 4 Protocol'].isDisplayable).to.equal(true);
    expect(point['Uplink Port'].isDisplayable).to.equal(true);

    expect(point['Downlink Broadcast Delay'].isDisplayable).to.equal(false);
    expect(point['Downlink Broadcast Delay'].isDisplayable).to.equal(false);
    expect(point['Downlink IP Port'].isDisplayable).to.equal(false);
    expect(point['Downlink IP Port'].isDisplayable).to.equal(false);
    expect(point['Downlink Network'].isDisplayable).to.equal(false);
    expect(point['Downlink Network'].isDisplayable).to.equal(false);
    expect(point['Firmware 2 Version'].isDisplayable).to.equal(false);
    expect(point['Port 1 Address'].isDisplayable).to.equal(false);
    expect(point['Port 1 Maximum Address'].isDisplayable).to.equal(false);
    expect(point['Port 1 Network'].isDisplayable).to.equal(false);
    expect(point['Port 2 Address'].isDisplayable).to.equal(false);
    expect(point['Port 2 Maximum Address'].isDisplayable).to.equal(false);
    expect(point['Port 2 Network'].isDisplayable).to.equal(false);
    expect(point['Port 3 Address'].isDisplayable).to.equal(false);
    expect(point['Port 3 Maximum Address'].isDisplayable).to.equal(false);
    expect(point['Port 3 Network'].isDisplayable).to.equal(false);
    expect(point['Port 4 Address'].isDisplayable).to.equal(false);
    expect(point['Port 4 Maximum Address'].isDisplayable).to.equal(false);
    expect(point['Port 4 Network'].isDisplayable).to.equal(false);

    // Read Only
    expect(point['Ethernet Protocol'].isReadOnly).to.equal(true);

    expect(point['Port 1 Protocol'].isReadOnly).to.equal(false);
    expect(point['Port 2 Protocol'].isReadOnly).to.equal(false);
    expect(point['Port 3 Protocol'].isReadOnly).to.equal(false);
    expect(point['Port 4 Protocol'].isReadOnly).to.equal(false);
    expect(point['Time Zone'].isReadOnly).to.equal(false);

  });

  it('should update Central Device model', function() {
    var type = 'Central Device';
    point['Model Type'].Value = type;
    point['Model Type'].eValue = deviceTypes[type].enum;
    Config.EditChanges.applyDeviceDevModel(data);

    // Changed from template
    expect(point._devModel).to.equal(deviceTypes[type].enum);

    // Checks against code
    expect(point['Uplink Port'].ValueOptions).to.deep.equal({
      'Ethernet': 0
    });
    expect(point['Uplink Port'].Value).to.equal('Ethernet');
    expect(point['Uplink Port'].eValue).to.equal(0);

    // Displayable
    expect(point['Downlink Broadcast Delay'].isDisplayable).to.equal(false);
    expect(point['Downlink IP Port'].isDisplayable).to.equal(false);
    expect(point['Downlink Network'].isDisplayable).to.equal(false);
    expect(point['Downlink Protocol'].isDisplayable).to.equal(false);
    expect(point['Firmware 2 Version'].isDisplayable).to.equal(false);
    expect(point['Port 1 Protocol'].isDisplayable).to.equal(false);
    expect(point['Port 2 Protocol'].isDisplayable).to.equal(false);
    expect(point['Port 3 Protocol'].isDisplayable).to.equal(false);
    expect(point['Port 4 Protocol'].isDisplayable).to.equal(false);


    // Read Only
    expect(point['Ethernet Address'].isReadOnly).to.equal(true);
    expect(point['Ethernet IP Port'].isReadOnly).to.equal(true);
    expect(point['Ethernet Network'].isReadOnly).to.equal(true);
    expect(point['Time Zone'].isReadOnly).to.equal(true);

  });

  it('should update all Interface Devices the same', function() {
    var types = ['Field Interface Device', 'MicroScan Interface Device', 'Staefa Interface Device', 'N2 Interface Device', 'Sierra Steam Meter Device', 'Armstrong SteamEye Device', 'Siemens Power Meter Device', 'Ingersol Rand Intellysis Device'];
    types.forEach(function(type) {
      point['Model Type'].Value = type;
      point['Model Type'].eValue = deviceTypes[type].enum;
      Config.EditChanges.applyDeviceDevModel(data);
      // comparePoints(point, oldPoint);
      // Changed from template
      expect(point._devModel).to.equal(deviceTypes[type].enum);

      // Checks against code
      expect(point['Port 1 Protocol'].Value).to.equal('MS/TP');
      expect(point['Port 1 Protocol'].eValue).to.equal(portProtocols['MS/TP'].enum);
      expect(point['Uplink Port'].ValueOptions).to.deep.equal({
        'Port 1': 1
      });
      expect(point['Uplink Port'].Value).to.equal('Port 1');
      expect(point['Uplink Port'].eValue).to.equal(devicePorts['Port 1'].enum);

      // Displayable
      expect(point['Downlink Broadcast Delay'].isDisplayable).to.equal(false);
      expect(point['Downlink IP Port'].isDisplayable).to.equal(false);
      expect(point['Downlink Network'].isDisplayable).to.equal(false);
      expect(point['Ethernet Address'].isDisplayable).to.equal(false);
      expect(point['Ethernet IP Port'].isDisplayable).to.equal(false);
      expect(point['Ethernet Network'].isDisplayable).to.equal(false);
      expect(point['Ethernet Protocol'].isDisplayable).to.equal(false);
      expect(point['Firmware 2 Version'].isDisplayable).to.equal(false);
      expect(point['Port 2 Protocol'].isDisplayable).to.equal(false);
      expect(point['Port 3 Protocol'].isDisplayable).to.equal(false);
      expect(point['Port 4 Protocol'].isDisplayable).to.equal(false);

      expect(point['Port 1 Protocol'].isDisplayable).to.equal(true);
      expect(point['Port 1 Address'].isDisplayable).to.equal(true);
      expect(point['Port 1 Maximum Address'].isDisplayable).to.equal(true);
      expect(point['Port 1 Network'].isDisplayable).to.equal(true);

      // Read Only
      expect(point['Time Zone'].isReadOnly).to.equal(true);
      expect(point['Port 1 Protocol'].isReadOnly).to.equal(true);

      expect(point['Ethernet Protocol'].isReadOnly).to.equal(false);
    });
  });

  it('should update MicroScan 4 Devices', function() {
    var types = ['MicroScan 4 UNV', 'MicroScan 4 xTalk', 'MicroScan 4 Digital'];
    types.forEach(function(type) {
      point['Model Type'].Value = type;
      point['Model Type'].eValue = deviceTypes[type].enum;
      Config.EditChanges.applyDeviceDevModel(data);
      // comparePoints(point, oldPoint);
      // Changed from template
      expect(point._devModel).to.equal(deviceTypes[type].enum);

      // Checks against code
      expect(point['Uplink Port'].ValueOptions).to.deep.equal({
        'Ethernet': 0,
        'Port 1': 1
      });

      // Displayable
      expect(point['Downlink Broadcast Delay'].isDisplayable).to.equal(false);
      expect(point['Downlink IP Port'].isDisplayable).to.equal(false);
      expect(point['Downlink Network'].isDisplayable).to.equal(false);
      expect(point['Downlink Protocol'].isDisplayable).to.equal(false);
      expect(point['Firmware 2 Version'].isDisplayable).to.equal(false);
      expect(point['Port 3 Protocol'].isDisplayable).to.equal(false);
      expect(point['Port 4 Protocol'].isDisplayable).to.equal(false);

      // Read Only
      expect(point['Time Zone'].isReadOnly).to.equal(true);
    });
  });

  it('should update MicroScan 5 Devices', function() {
    var types = ['MicroScan 5 UNV', 'MicroScan 5 xTalk', 'SCADA Vio', 'SCADA IO'];
    types.forEach(function(type) {
      point['Model Type'].Value = type;
      point['Model Type'].eValue = deviceTypes[type].enum;
      Config.EditChanges.applyDeviceDevModel(data);
      // Changed from template
      expect(point._devModel).to.equal(deviceTypes[type].enum);

      // Checks against code
      expect(point['Uplink Port'].ValueOptions).to.deep.equal({
        'Ethernet': 0,
        'Port 1': 1,
        'Port 2': 2,
        'Port 3': 3,
        'Port 4': 4
      });

      // Displayable
      expect(point['Downlink Broadcast Delay'].isDisplayable).to.equal(false);
      expect(point['Downlink IP Port'].isDisplayable).to.equal(false);
      expect(point['Downlink Network'].isDisplayable).to.equal(false);

      // Read Only

    });
  });
});