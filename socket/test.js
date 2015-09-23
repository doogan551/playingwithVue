// OTHERS
var Utility = require('../models/utility');

var openDisplays = [];
var openAlarms = [];
var common = {
  sockets: require('../helpers/sockets.js'),
  openDisplays: openDisplays,
  openAlarms: openAlarms
};

var socket = function () {
  Utility.getOne({
    collection: 'System Info',
    query: {
      Name: 'Quality Codes'
    }
  }, function (err, codes) {
    common.qualityCodes = codes.Entries;
  });
  Utility.getOne({
    collection: 'System Info',
    query: {
      Name: 'Control Priorities'
    }
  }, function (err, priorities) {
    common.controlPriorities = priorities.Entries;
  });
  loader();
};

var loader = function () {
  require('./socketio')(common);
  require('./oplog')(common);
  require('./tcp')(common);
};

common.setQualityLabel = function(point) {

  if (point._relDevice !== undefined && point._relDevice === Config.Enums.Reliabilities["Stop Scan"]["enum"])
    point["Quality Label"] = "Stop Scan";
  else if (point._relDevice !== undefined && point._relDevice !== Config.Enums.Reliabilities["No Fault"]["enum"])
    point["Quality Label"] = "Fault";
  else if (point._relRMU !== undefined && point._relRMU === Config.Enums.Reliabilities["Stop Scan"]["enum"])
    point["Quality Label"] = "Stop Scan";
  else if (point._relRMU !== undefined && point._relRMU !== Config.Enums.Reliabilities["No Fault"]["enum"])
    point["Quality Label"] = "Fault";
  else if (point["COV Enable"] !== undefined && point["COV Enable"].Value === false && point["Quality Code Enable"] !== undefined && (point["Quality Code Enable"].Value & Config.Enums["Quality Code Enable Bits"]["COV Enable"]["enum"]) !== 0)
    point["Quality Label"] = "COV Disabled";
  else if (point._relPoint !== undefined && point._relPoint !== Config.Enums.Reliabilities["No Fault"]["enum"])
    point["Quality Label"] = "Fault";
  else if (point["Status Flags"] !== undefined && (point["Status Flags"].Value & Config.Enums["Status Flags Bits"]["Out of Service"]["enum"]) !== 0)
    point["Quality Label"] = "Out of Service";
  else if (point["Alarm State"] !== undefined && (point["Alarm State"].eValue === Config.Enums["Alarm States"].Offnormal["enum"] || point["Alarm State"].eValue === Config.Enums["Alarm States"].Open["enum"] || point["Alarm State"].eValue && point["Alarm State"].eValue === Config.Enums["Alarm States"].Closed["enum"]))
    point["Quality Label"] = "Abnormal";
  else if (point["Alarm State"] !== undefined && point["Alarm State"].eValue === Config.Enums["Alarm States"].Shutdown["enum"])
    point["Quality Label"] = "Shutdown";
  else if (point["Alarm State"] !== undefined && point["Alarm State"].eValue === Config.Enums["Alarm States"]["High Limit"]["enum"])
    point["Quality Label"] = "Analog Alarm High Limit";
  else if (point["Alarm State"] !== undefined && point["Alarm State"].eValue === Config.Enums["Alarm States"]["Low Limit"]["enum"])
    point["Quality Label"] = "Analog Alarm Low Limit";
  else if (point["Alarm State"] !== undefined && point["Alarm State"].eValue === Config.Enums["Alarm States"]["High Warning"]["enum"])
    point["Quality Label"] = "Analog High Warning";
  else if (point["Alarm State"] !== undefined && point["Alarm State"].eValue === Config.Enums["Alarm States"]["Low Warning"]["enum"])
    point["Quality Label"] = "Analog Low Warning";
  else if (point["Control Pending"] !== undefined && point["Control Pending"].Value === true && point["Quality Code Enable"].Value && (point["Quality Code Enable"].Value & Config.Enums["Quality Code Enable Bits"]["Command Pending"]["enum"]) !== 0)
    point["Quality Label"] = "Control Pending";
  else if (point["Status Flags"] !== undefined && (point["Status Flags"].Value & Config.Enums["Status Flags Bits"].Override["enum"]) !== 0 && point["Quality Code Enable"].Value && (point["Quality Code Enable"].Value & Config.Enums["Quality Code Enable Bits"].Override["enum"]) !== 0)
    point["Quality Label"] = "Overridden";
  else if (point["Alarms Off"] !== undefined && point["Alarms Off"].Value === true && point["Quality Code Enable"].Value && (point["Quality Code Enable"].Value & Config.Enums["Quality Code Enable Bits"]["Alarms Off"]["enum"]) !== 0)
    point["Quality Label"] = "Alarms Off";
  else
    point["Quality Label"] = "none";

  return point;
};

module.exports = {
  socket: socket
}
