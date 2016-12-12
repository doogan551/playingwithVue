// NODE MODULES
var fs = require('fs');

// NPM MODULES
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var rimraf = require('rimraf');
var _ = require('lodash');

// OTHERS
var Utility = require('../models/utility');
var utils = require('../helpers/utils');
var constants = utils.CONSTANTS;
var Config = require('../public/js/lib/config.js');
var actLogsEnums = Config.Enums["Activity Logs"];
var logger = require('../helpers/logger')(module);
var zmq = require('../helpers/zmq');

var pointsCollection = utils.CONSTANTS("pointsCollection");
var historyCollection = utils.CONSTANTS("historyCollection");
var alarmsCollection = utils.CONSTANTS("alarmsCollection");
var activityLogCollection = utils.CONSTANTS("activityLogCollection");

var common = {
  sockets: require('../helpers/sockets.js')
};

var io = common.sockets.get().io;
var rooms = io.sockets.adapter.rooms;
common.rooms = rooms;

var socket = function() {
  Utility.getOne({
    collection: 'SystemInfo',
    query: {
      Name: 'Quality Codes'
    }
  }, function(err, codes) {
    common.qualityCodes = codes.Entries;
    Utility.getOne({
      collection: 'SystemInfo',
      query: {
        Name: 'Control Priorities'
      }
    }, function(err, priorities) {
      common.controlPriorities = priorities.Entries;
      loader();
    });
  });
};

var loader = function() {
  require('./socketio')(common);
  require('./oplog')(common);
  require('./tcp')(common);
};

// io & oplog
common.setQualityLabel = function(point) {

  if (point._cfgRequired !== undefined && point._cfgRequired === true)
    point["Quality Label"] = "Fault";
  else if (point._relDevice !== undefined && point._relDevice === Config.Enums.Reliabilities["Stop Scan"]["enum"])
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

common.newUpdate = newUpdate;
common.signalExecTOD = signalExecTOD;
common.updateDependencies = updateDependencies;
common.restorePoint = restorePoint;
common.deletePoint = deletePoint;
common.updateDeviceToDs = updateDeviceToDs;
common.signalHostTOD = signalHostTOD;
common.addToDevices = addToDevices;
common.updateCfgRequired = updateCfgRequired;
common.getActiveAlarmsNew = getActiveAlarmsNew;
common.getRecentAlarms = getRecentAlarms;
common.getUnacknowledged = getUnacknowledged;
common.sendUpdate = sendUpdate;
common.acknowledgePointAlarms = acknowledgePointAlarms;
common.addPoint = addPoint;

module.exports = {
  socket: socket,
  common: common
};

(function loop() {
  setTimeout(function() {
    // logger.info('@@@@@@@ Server still active');
    autoAcknowledgeAlarms(function(result) {
      loop();
    });
  }, 300000);
})();

//io, updateSequencePoints, runScheduleEntry(tcp), updateDependencies
function newUpdate(oldPoint, newPoint, flags, user, callback) {
  var generateActivityLog = false,
    updateReferences = false,
    updateModelType = false,
    updateCfgReq = false,
    downloadPoint = false,
    updateDownlinkNetwk = false,
    configRequired,
    updateObject = {},
    //activityLogObject = {},
    activityLogObjects = [],
    errors = [],
    readOnlyProps,
    executeTOD = false,
    msg = null,
    logData = {
      user: user,
      timestamp: Date.now(),
      point: newPoint
    };
  readOnlyProps = ["_id", "_cfgDevice", "_updTOD", "_pollTime", "_pAccess",
    "_forceAllCOV", "_actvAlmId", "Alarm State", "Control Pending", "Device Status",
    "Last Report Time", "Point Type", "Reliability"
  ];
  // JDR - Removed "Authorized Value" from readOnlyProps because it changes when ValueOptions change. Keep this note.

  Utility.getOne({
    collection: 'points',
    query: {
      _id: newPoint._id
    },
    fields: {
      _pStatus: 1,
      _id: 0
    }
  }, function(err, dbPoint) {
    if (err) {
      return callback({
        err: err
      }, null);
    } else if (!dbPoint) {
      return callback({
        err: "Point not found: " + newPoint._id
      }, null);
    } else if (dbPoint._pStatus === Config.Enums["Point Statuses"].Deleted.enum) {
      return callback({
        err: "Point deleted: " + newPoint._id
      }, null);
    }

    configRequired = newPoint._cfgRequired;

    // TODO should this be === or !== ? - probably !== since it is used again
    if (flags.method !== null) {
      if (oldPoint._pStatus === Config.Enums["Point Statuses"].Active.enum && newPoint._pStatus === Config.Enums["Point Statuses"].Active.enum) {
        generateActivityLog = true;
      } else if (oldPoint._pStatus === Config.Enums["Point Statuses"].Inactive.enum && newPoint._pStatus === Config.Enums["Point Statuses"].Active.enum) {
        if (flags.method === "restore") {
          activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
            log: "Point restored",
            activity: actLogsEnums["Point Restore"].enum
          })));
        } else {
          activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
            log: "Point added",
            activity: actLogsEnums["Point Add"].enum
          })));
        }
      } else if (oldPoint._pStatus === Config.Enums["Point Statuses"].Active.enum && newPoint._pStatus === Config.Enums["Point Statuses"].Inactive.enum) {
        if (flags.method === "hard") {
          activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
            log: "Point destroyed",
            activity: actLogsEnums["Point Hard Delete"].enum
          })));
        } else if (flags.method === "soft") {
          activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
            log: "Point deleted",
            activity: actLogsEnums["Point Soft Delete"].enum
          })));
        }
      } else if (newPoint.Name !== oldPoint.Name) {
        activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
          log: "Point renamed from " + oldPoint.Name + " to " + newPoint.Name,
          activity: actLogsEnums["Point Restore"].enum
        })));
      }
    }

    if (newPoint["Point Type"].Value === "Script" && newPoint["Script Source File"] !== oldPoint["Script Source File"] && !!flags.path) {
      commitScript({
        point: newPoint,
        path: flags.path
      }, function(response) {
        if (response.err) {
          return callback(response.err);
        } else {
          updateProperties();
        }
      });
    } else {
      updateProperties();
    }

    var compare = function(a, b) {
      return a * 1 > b * 1;
    };

    function updateProperties() {
      for (var prop in newPoint) {
        if (readOnlyProps.indexOf(prop) === -1) {
          // sort enums first
          if (newPoint[prop].hasOwnProperty('ValueOptions')) {
            var options = newPoint[prop].ValueOptions;

            var newOptions = {};
            var temp = [];
            for (var stringVal in options) {
              temp.push(options[stringVal]);
            }
            temp.sort(compare);
            for (var key = 0; key < temp.length; key++) {
              for (var property in options) {
                if (options[property] === temp[key]) {
                  newOptions[property] = options[property];
                }
              }
            }
            newPoint[prop].ValueOptions = newOptions;
          }

          // this will compare Slides and Point Refs arrays.
          if (!_.isEqual(newPoint[prop], oldPoint[prop])) {

            logger.info(newPoint._id, prop);
            if (prop === "Broadcast Enable" && user["System Admin"].Value !== true) {
              continue;
            }

            logData.activity = Config.Enums["Activity Logs"]["Point Property Edit"].enum;
            logData.prop = prop;
            logData.oldValue = {
              Value: oldPoint[prop].Value
            };
            logData.newValue = {
              Value: newPoint[prop].Value
            };
            if (newPoint[prop].eValue !== undefined) {
              logData.newValue.eValue = newPoint[prop].eValue;
            }
            if (oldPoint[prop].eValue !== undefined) {
              logData.oldValue.eValue = oldPoint[prop].eValue;
            }

            switch (prop) {
              case "Configure Device":
                if (newPoint[prop].Value === true) {
                  updateObject._cfgDevice = true;
                  if (newPoint["Point Type"].eValue === Config.Enums["Point Types"]["Remote Unit"].enum)
                    downloadPoint = true;
                }
                break;

              case "Value":
                var propName = "";

                if (!_.isEqual(newPoint[prop].ValueOptions, oldPoint[prop].ValueOptions)) {
                  updateReferences = true;
                  propName = "Value.ValueOptions";
                  updateObject[propName] = newPoint[prop].ValueOptions;
                }
                if (newPoint[prop].isReadOnly !== oldPoint[prop].isReadOnly) {
                  propName = "Value.isReadOnly";
                  updateObject[propName] = newPoint[prop].isReadOnly;
                }
                if (newPoint[prop].Value !== oldPoint[prop].Value) {
                  propName = "Value.Value";
                  updateObject[propName] = newPoint[prop].Value;

                  if (newPoint[prop].eValue !== undefined) {
                    propName = "Value.eValue";
                    updateObject[propName] = newPoint[prop].eValue;
                  }

                  if (newPoint["Out of Service"].Value === true) {

                    if (newPoint.Value.oosValue !== undefined) {
                      downloadPoint = true;
                      if (newPoint[prop].eValue !== undefined) {
                        updateObject["Value.oosValue"] = newPoint[prop].eValue;
                      } else {
                        updateObject["Value.oosValue"] = newPoint[prop].Value;
                      }
                    }

                  }
                }
                break;

              case "Out of Service":
                if (newPoint[prop].Value === true && newPoint.Value.oosValue !== undefined) {
                  updateObject["Value.oosValue"] = (newPoint.Value.eValue !== undefined) ? newPoint.Value.eValue : newPoint.Value.Value;
                }

                downloadPoint = true;
                break;

              case "Name":
              case "Compiled Code":
                updateReferences = true;
                break;

              case "Conversion Adjustment":
              case "Conversion Coefficient 1":
              case "Conversion Coefficient 2":
              case "Conversion Coefficient 3":
              case "Conversion Coefficient 4":
              case "Conversion Type":
                if (newPoint["Point Type"].eValue === Config.Enums["Point Types"].Sensor.enum)
                  updateReferences = true;
                else
                  downloadPoint = true;
                break;

              case "Model Type":
                updateReferences = true;
                configRequired = true;
                updateModelType = true;
                break;

              case "Firmware Version":
                updateReferences = true;
                configRequired = true;
                break;

              case "_rmuModel":
              case "_devModel":
                configRequired = true;
                break;

              case "Active Control":
              case "Active Release":
              case "Active Value":
              case "Alarm Adjust Band":
              case "Alarm Deadband":
              case "APDU Timeout":
              case "APDU Retries":
              case "Broadcast Enable":
              case "Broadcast Period":
              case "Calculation Type":
              case "Calibration Factor":
              case "CFM Deadband":
              case "Close Polarity":
              case "Control Band Value":
              case "Control Priority":
              case "Controller":
              case "Cooling Equipment":
              case "Cooling Gain":
              case "Cooling Setpoint":
              case "COV Period":
              case "COV Enable":
              case "COV Increment":
              case "Damper Max Output":
              case "Damper Min Output":
              case "Damper Proportional Band":
              case "Damper Reset Gain":
              case "Damper Reverse Action":
              case "Damper Run Unoccupied":
              case "Damper Unoccupied Output":
              case "Digital Heat 1 Run Unoccupied":
              case "Digital Heat 1 Start Load":
              case "Digital Heat 1 Stop Load":
              case "Digital Heat 2 Run Unoccupied":
              case "Digital Heat 2 Start Load":
              case "Digital Heat 2 Stop Load":
              case "Digital Heat 3 Run Unoccupied":
              case "Digital Heat 3 Start Load":
              case "Digital Heat 3 Stop Load":
              case "Default Value":
              case "Delay Time":
              case "Demand Enable":
              case "Demand Interval":
              case "Disable Limit Fault":
              case "Downlink Broadcast":
              case "Enable Warning Alarms":
              case "Fail Action":
              case "Fan Off CFM Setpoint":
              case "Fan Off Temp Deadband":
              case "Fan On CFM Setpoint":
              case "Fast Pulse":
              case "Feedback Polarity":
              case "Filter":
              case "Filter Weight":
              case "Heat 1 Max Output":
              case "Heat 1 Min Output":
              case "Heat 1 Proportional Band":
              case "Heat 1 Reset Gain":
              case "Heat 1 Reverse Action":
              case "Heat 1 Run Unoccupied":
              case "Heat 1 Unoccupied Output":
              case "Heating Equipment":
              case "Heating Gain":
              case "Heating Setpoint":
              case "High Alarm Limit":
              case "High Deadband":
              case "High Setpoint":
              case "High Warning Limit":
              case "If Compare 1":
              case "If Compare 2":
              case "If Compare 3":
              case "If Compare 4":
              case "If Compare 5":
              case "If Result 2":
              case "If Result 3":
              case "If Result 4":
              case "If Result 5":
              case "If Value 1":
              case "If Value 2":
              case "If Value 3":
              case "If Value 4":
              case "If Value 5":
              case "In Alarm":
              case "In Fault":
              case "In Out of Service":
              case "In Override":
              case "Inactive Control":
              case "Inactive Release":
              case "Inactive Value":
              case "Interlock State":
              case "Input 1 Constant":
              case "Input 2 Constant":
              case "Input Deadband":
              case "Input High Limit":
              case "Input Low Limit":
              case "Input Range":
              case "Input Rate":
              case "Lead Time":
              case "Low Alarm Limit":
              case "Low Deadband":
              case "Low Setpoint":
              case "Low Warning Limit":
              case "Maximum Change":
              case "Maximum Value":
              case "Minimum Value":
              case "Minimum Off Time":
              case "Minimum On Time":
              case "Modbus Order":
              case "Momentary Delay":
              case "Occupancy Schedule":
              case "Occupied Cool Setpoint Value":
              case "Occupied Heat Setpoint Value":
              case "Occupied Max Cool CFM":
              case "Occupied Max Heat CFM":
              case "Occupied Min Cool CFM":
              case "Occupied Min Heat CFM":
              case "Open Polarity":
              case "Outside Air Gain":
              case "Override Time":
              case "Polarity":
              case "Program Change Request":
              case "Proportional Band":
              case "Pulse Weight":
              case "Rate":
              case "Rate Period":
              case "Reset Gain":
              case "Reset Interval":
              case "Reset Time":
              case "Reverse Action":
              case "Run Total":
              case "Same State Test":
              case "Scale Factor":
              case "Select State":
              case "Setback Controller":
              case "Setback Deadband":
              case "Setback Enable":
              case "Setpoint Value":
              case "Shutdown Control":
              case "Shutdown Enable":
              case "Shutdown Release":
              case "Shutdown State":
              case "Shutdown Value":
              case "Square Root":
              case "Startup Delay":
              case "Stop Gain":
              case "Supervised Input":
              case "Total":
              case "Trend COV Increment":
              case "Trend Enable":
              case "Trend Interval":
              case "Trigger Constant":
              case "Unoccupied Cool Setpoint Value":
              case "Unoccupied Heat Setpoint Value":
              case "Unoccupied Max Cool CFM":
              case "Unoccupied Max Heat CFM":
              case "Unoccupied Min Cool CFM":
              case "Unoccupied Min Heat CFM":
              case "Update Interval":
              case "Value Deadband":
              case "Verify Delay":
              case "Warmup Deadband":
              case "Warning Adjust Band":
              case "Boolean Registers":
              case "Integer Registers":
              case "Real Registers":
              case "Point Registers":
                // Lift station point props
              case "Pump Control Mode":
              case "Pump Select Mode":
              case "Pump Sequence Delay":
              case "Max Pump Off Time":
              case "Max Pump Run Time":
              case "Light Control Point":
              case "Light Output Configuration":
              case "Horn Control Point":
              case "Horn Output Configuration":
              case "Auxiliary Control Point":
              case "Auxiliary Output Configuration":
              case "High Level Float Point":
              case "Lag Level Float Point":
              case "Lead Level Float Point":
              case "Off Level Float Point":
              case "Low Level Float Point":
              case "Level Sensor Point":
              case "High Level Setpoint":
              case "Lag Level Setpoint":
              case "Lead Level Setpoint":
              case "Off Level Setpoint":
              case "Low Level Setpoint":
              case "Emergency Pump Down Time":
                downloadPoint = true;
                break;

              case "Channel":
              case "Close Channel":
              case "Device Address":
              case "Device Port":
              case "Downlink IP Port":
              case "Feedback Channel":
              case "Feedback Type":
              case "Input Type":
              case "Network Segment":
              case "Network Type":
              case "Off Channel":
              case "On Channel":
              case "Open Channel":
              case "Output Type":
              case "Port 1 Address":
              case "Port 1 Maximum Address":
              case "Port 1 Network":
              case "Port 1 Protocol":
              case "Port 2 Address":
              case "Port 2 Maximum Address":
              case "Port 2 Network":
              case "Port 2 Protocol":
              case "Port 3 Address":
              case "Port 3 Maximum Address":
              case "Port 3 Network":
              case "Port 3 Protocol":
              case "Port 4 Address":
              case "Port 4 Maximum Address":
              case "Port 4 Network":
              case "Port 4 Protocol":
              case "Time Zone":
              case "VAV Channel":
              case "Pump Control Mode": // Lift station point prop
                configRequired = true;
                break;


              case "Boolean Register Names":
              case "Integer Register Names":
              case "Point Register Names":
              case "Real Register Names":
                if (newPoint["Point Type"].eValue !== Config.Enums["Point Types"].Script.enum)
                  downloadPoint = true;
                break;

              case "Alarm Delay Time":
              case "Stop Scan":
                if (newPoint["Point Type"].eValue !== Config.Enums["Point Types"].Device.enum)
                  downloadPoint = true;
                break;

              case "Alarm Value":
              case "Alarms Off":
                if (newPoint["Point Type"].eValue !== Config.Enums["Point Types"].Device.enum && newPoint["Point Type"].eValue !== Config.Enums["Point Types"]["Remote Unit"].enum)
                  downloadPoint = true;
                break;

              case "Execute Now":
                executeTOD = true;
                break;

              case "Trend Samples":
                if (newPoint._devModel == Config.Enums["Device Model Types"]["MicroScan 5 UNV"].enum || newPoint._devModel == Config.Enums["Device Model Types"]["MicroScan 5 xTalk"].enum || newPoint._devModel == Config.Enums["Device Model Types"]["SCADA Vio"].enum) {
                  downloadPoint = true;
                } else
                  configRequired = true;
                break;

              case "Point Refs":
                var pointRefProps = Config.Utility.getPointRefProperties(newPoint);
                for (var r = 0; r < pointRefProps.length; r++) {
                  if (!_.isEqual(Config.Utility.getPropertyObject(pointRefProps[r], newPoint), Config.Utility.getPropertyObject(pointRefProps[r], oldPoint))) {
                    switch (pointRefProps[r]) {
                      case "Alarm Adjust Point":
                      case "CFM Input Point":
                      case "Control Point":
                      case "Damper Control Point":
                      case "Digital Heat 1 Control Point":
                      case "Digital Heat 2 Control Point":
                      case "Digital Heat 3 Control Point":
                      case "Dry Bulb Point":
                      case "Fan Control Point":
                      case "Feedback Point":
                      case "Heat 1 Control Point":
                      case "Humidity Point":
                      case "Input Point 1":
                      case "Input Point 2":
                      case "Input Point 3":
                      case "Input Point 4":
                      case "Input Point 5":
                      case "Interlock Point":
                      case "Lights Control Point":
                      case "Mixed Air Point":
                      case "Monitor Point":
                      case "Occupied Cool Setpoint":
                      case "Occupied Heat Setpoint":
                      case "Occupied Input":
                      case "Occupied Point":
                      case "Outside Air Point":
                      case "Return Air Point":
                      case "Select Input":
                      case "Setpoint Input":
                      case "Shutdown Point":
                      case "Source Air Temp Point":
                      case "Trigger Point":
                      case "Unoccupied Cool Setpoint":
                      case "Unoccupied Heat Setpoint":
                      case "Zone Temp Point":
                      case "Zone Offset Point":
                        downloadPoint = true;
                        break;

                      case "Device Point":
                        updateReferences = true;
                        configRequired = true;
                        updateCfgReq = true;
                        break;

                      case "Remote Unit Point":
                      case "Script Point":
                        configRequired = true;
                        break;

                      default:
                        break;
                    }
                  }
                }

                break;

              case "Ethernet Network":
                if (newPoint["Point Type"].Value === "Device") {
                  updateDownlinkNetwk = true;
                }
                break;
              case "Downlink Network":
                downloadPoint = true;
                break;
              default:
                break;
            }

            if (prop !== "Configure Device" && prop !== "Value") {
              if (downloadPoint === false && false)
                downloadPoint = true;
              updateObject[prop] = newPoint[prop];
            }

            if (generateActivityLog === true && flags.from === 'ui') {
              var oldVal = (oldPoint[prop].Value !== '') ? oldPoint[prop].Value : "[blank]",
                newVal = (newPoint[prop].Value !== '') ? newPoint[prop].Value : "[blank]";
              //if enum, if evalue changed AL, else if not enum, compare value
              if (['Report', 'Sequence'].indexOf(newPoint['Point Type'].Value) >= 0) {
                activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                  log: newPoint['Point Type'].Value + " updated",
                  activity: actLogsEnums["Point Property Edit"].enum
                })));
              } else if (updateObject[prop] !== undefined && ((updateObject[prop].ValueType === 5 && updateObject[prop].eValue !== oldPoint[prop].eValue) || (updateObject[prop].ValueType !== 5 && updateObject[prop].Value !== oldPoint[prop].Value))) {
                if (prop === "Configure Device") {
                  activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                    log: "Device configuration requested",
                    activity: actLogsEnums["Device Configuration"].enum
                  })));
                } else if (newPoint[prop].ValueType === Config.Enums["Value Types"].Bool.enum) {
                  if (newPoint[prop].Value === true)
                    activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                      log: prop + " set",
                      activity: actLogsEnums["Point Property Edit"].enum
                    })));
                  else
                    activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                      log: prop + " cleared",
                      activity: actLogsEnums["Point Property Edit"].enum
                    })));
                } else if (newPoint[prop].ValueType === Config.Enums["Value Types"].UniquePID.enum) {
                  if (oldPoint[prop].PointInst !== null && newPoint[prop].PointInst === null)
                    activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                      log: newPoint[prop].Name + " removed from " + prop,
                      activity: actLogsEnums["Point Property Edit"].enum
                    })));
                  else if (oldPoint[prop].PointInst === null && newPoint[prop].PointInst !== null)
                    activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                      log: newPoint[prop].Name + " added to " + prop,
                      activity: actLogsEnums["Point Property Edit"].enum
                    })));
                  else
                    activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                      log: prop + " changed from " + oldPoint[prop].Name + " to " + newPoint[prop].Name,
                      activity: actLogsEnums["Point Property Edit"].enum
                    })));
                } else if ([Config.Enums["Value Types"].HourMinSec.enum, Config.Enums["Value Types"].MinSec.enum, Config.Enums["Value Types"].HourMin.enum].indexOf(newPoint[prop].ValueType) > -1) {
                  var timeMessage,
                    hour = 0,
                    min = 0,
                    sec = oldPoint[prop].Value;
                  switch (newPoint[prop].ValueType) {
                    case 12:
                      hour = Math.floor(sec / 3600);
                      sec %= 3600;
                      min = Math.floor(sec / 60);
                      sec %= 60;
                      hour = hour > 9 ? hour : "0" + hour;
                      min = min > 9 ? min : "0" + min;
                      sec = sec > 9 ? sec : "0" + sec;
                      timeMessage = prop + " changed from " + hour + ":" + min + ":" + sec + " to ";
                      sec = newPoint[prop].Value;
                      hour = Math.floor(sec / 3600);
                      sec %= 3600;
                      min = Math.floor(sec / 60);
                      sec %= 60;
                      hour = hour > 9 ? hour : "0" + hour;
                      min = min > 9 ? min : "0" + min;
                      sec = sec > 9 ? sec : "0" + sec;
                      timeMessage += hour + ":" + min + ":" + sec;
                      break;
                    case 13:
                      min = Math.floor(sec / 60);
                      sec %= 60;
                      min = min > 9 ? min : "0" + min;
                      sec = sec > 9 ? sec : "0" + sec;
                      timeMessage = prop + " changed from " + min + ":" + sec + " to ";
                      sec = newPoint[prop].Value;
                      min = Math.floor(sec / 60);
                      sec %= 60;
                      min = min > 9 ? min : "0" + min;
                      sec = sec > 9 ? sec : "0" + sec;
                      timeMessage += min + ":" + sec;
                      break;
                    case 17:
                      hour = Math.floor(sec / 3600);
                      sec %= 3600;
                      min = Math.floor(sec / 60);
                      hour = hour > 9 ? hour : "0" + hour;
                      min = min > 9 ? min : "0" + min;
                      timeMessage = prop + " changed from " + hour + ":" + min + " to ";
                      sec = newPoint[prop].Value;
                      hour = Math.floor(sec / 3600);
                      sec %= 3600;
                      min = Math.floor(sec / 60);
                      hour = hour > 9 ? hour : "0" + hour;
                      min = min > 9 ? min : "0" + min;
                      timeMessage += hour + ":" + min;
                      break;
                  }
                  activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                    log: timeMessage,
                    activity: actLogsEnums["Point Property Edit"].enum
                  })));
                } else {
                  activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                    log: prop + " changed from " + oldVal + " to " + newVal,
                    activity: actLogsEnums["Point Property Edit"].enum
                  })));
                }
              } else if (prop === "Point Refs") {
                if (newPoint["Point Type"].Value === "Slide Show") {
                  activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                    log: "Slide Show edited",
                    activity: actLogsEnums["Slideshow Edit"].enum
                  })));
                } else if (newPoint["Point Type"].Value === "Program") {
                  activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                    log: "Program edited",
                    activity: actLogsEnums["Program Edit"].enum
                  })));
                } else {
                  compareArrays(newPoint[prop], oldPoint[prop], activityLogObjects);
                }
              } else if (prop === "Alarm Messages" || prop === "Occupancy Schedule" || prop === "Sequence Details" || prop === "Security" || prop === "Script Source File") {
                activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                  log: prop + " updated",
                  activity: actLogsEnums["Point Property Edit"].enum

                })));
              } else if (prop === "Name") {
                if (newPoint[prop] !== oldPoint[prop]) {
                  activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                    log: prop + " changed from " + oldPoint[prop] + " to " + newPoint[prop],
                    activity: actLogsEnums["Point Property Edit"].enum
                  })));
                }
                /*} else if (prop === "Value") {
                  if (newPoint[prop].Value !== oldPoint[prop].Value) {
                    activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                      log: prop + " changed from " + oldVal + " to " + newVal,
                      activity: actLogsEnums["Point Property Edit"].enum
                    })));
                  }*/
              } else if (prop === "States") {
                if (!_.isEqual(newPoint[prop], oldPoint[prop])) {
                  activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                    log: prop + " updated",
                    activity: actLogsEnums["Point Property Edit"].enum
                  })));
                }
              }
            } else {
              generateActivityLog = false;
            }

          }
        }
      }

      if (!_.isEmpty(updateObject)) {
        if (newPoint["Point Type"].Value === "Schedule Entry") {
          downloadPoint = false;
          updateReferences = false;
        } else if (newPoint["Point Type"].Value === "Device") {
          utils.updateNetworkAndAddress(newPoint);

          updateObject["Network Segment.Value"] = newPoint['Network Segment'].Value;
          updateObject["Device Address.Value"] = newPoint['Device Address'].Value.toString();
        }

        if (configRequired === true) {
          updateObject._cfgRequired = true;
          downloadPoint = false;

        } else if (newPoint._pStatus !== Config.Enums["Point Statuses"].Active.enum ||
          newPoint._devModel === Config.Enums["Device Model Types"].Unknown.enum ||
          newPoint._devModel === Config.Enums["Device Model Types"]["Central Device"].enum ||
          newPoint["Point Type"].Value === "Sequence" ||
          (newPoint["Point Type"].Value !== "Device" &&
            (Config.Utility.getPropertyObject("Device Point", newPoint) === null ||
              Config.Utility.getPropertyObject("Device Point", newPoint).PointInst === 0))) {
          // not active
          // or (central device or unknown)
          // or (!device and !device point)

          downloadPoint = false;
        } else if (flags.from === "updateDependencies") {
          updateObject._updPoint = true;
          downloadPoint = false;
        }

        updSecurity(newPoint, function(err) {
          Utility.findAndModify({
            collection: 'points',
            query: {
              _id: newPoint._id
            },
            sort: [],
            updateObj: {
              $set: updateObject
            },
            options: {
              new: true
            }
          }, function(err, result) {
            if (err) return callback({
              err: err
            }, null);
            var error = null;
            updDownlinkNetwk(updateDownlinkNetwk, newPoint, oldPoint, function(err) {
              if (err)
                return callback({
                  err: err
                }, result);
              updPoint(downloadPoint, newPoint, function(err, msg) {
                if (err)
                  error = err;
                signalExecTOD(executeTOD, function(err) {
                  if (err)
                    error = error;
                  doActivityLogs(generateActivityLog, activityLogObjects, function(err) {
                    if (err)
                      return callback({
                        err: err
                      }, result);
                    update_Model(updateModelType, newPoint, function(err) {
                      if (err)
                        return callback({
                          err: err
                        }, result);
                      fixCfgRequired(updateCfgReq, oldPoint, newPoint, function(err) {
                        if (err)
                          return callback({
                            err: err
                          }, result);
                        updateRefs(updateReferences, newPoint, flags, user, function(err) {
                          if (err)
                            return callback({
                              err: err
                            }, result);
                          else if (error)
                            return callback({
                              err: error
                            }, result);
                          else {
                            msg = (msg !== undefined && msg !== null) ? msg : "success";
                            return callback({
                              message: msg
                            }, result);
                          }
                        });
                      });
                    });
                  });
                });
              });
            });
          });

        });
      } else {
        return callback({
          message: "success"
        }, newPoint);
      }
    }
  });

  /*point._cfgRequired = false; // These flags should always be set to false before sending
      point._updPoint = false; // to the UI to avoid a race condition. The UI will set*/

  function createActivityLog(property, message) {
    var activityObject = {};
    activityObject[property] = message;
    return activityObject;
  }

  function compareArrays(newArray, oldArray, activityLogObjects) {
    for (var i = 0; i < newArray.length; i++) {
      if (newArray[i].Value !== oldArray[i].Value) {
        logData.prop = newArray[i].PropertyName;
        if (newArray[i].Value === 0 && oldArray[i].Value !== 0) {
          activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
            log: logData.prop + " removed",
            activity: actLogsEnums["Point Property Edit"].enum
          })));
        } else if (newArray[i].Value !== 0 && oldArray[i].Value === 0) {
          activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
            log: logData.prop + " added",
            activity: actLogsEnums["Point Property Edit"].enum
          })));
        } else {
          activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
            log: logData.prop + " changed from " + oldArray[i].PointName + " to " + newArray[i].PointName,
            activity: actLogsEnums["Point Property Edit"].enum
          })));
        }
      }
    }
  }
}

// newupdate
function commitScript(data, callback) {
  var upi, fileName, path, csv, updateObj, markObsolete;

  var script = data.point;
  fileName = script._id;
  path = data.path;
  markObsolete = false;

  fs.readFile(path + '/' + fileName + '.sym', function(err, sym) {
    if (err)
      return callback({
        err: err
      });

    sym = sym.toString();
    csv = sym.split(/[\r\n,]/);

    script["Point Register Names"] = [];
    script["Integer Register Names"] = [];
    script["Real Register Names"] = [];
    script["Boolean Register Names"] = [];

    for (var i = 0; i < csv.length; i++) {
      if (csv[i - 1] !== 'TOTAL') {
        if (csv[i] === "POINT") {
          script["Point Register Names"].push(csv[i + 2]);
        } else if (csv[i] === "INTEGER") {
          script["Integer Register Names"].push(csv[i + 2]);
        } else if (csv[i] === "REAL") {
          script["Real Register Names"].push(csv[i + 2]);
        } else if (csv[i] === "BOOLEAN") {
          script["Boolean Register Names"].push(csv[i + 2]);
        }
      }

    }

    script["Point Register Count"] = script["Point Register Names"].length;
    script["Integer Register Count"] = script["Integer Register Names"].length;
    script["Real Register Count"] = script["Real Register Names"].length;
    script["Boolean Register Count"] = script["Boolean Register Names"].length;



    fs.readFile(path + '/' + fileName + '.dsl', function(err, dsl) {
      if (err)
        return callback({
          err: err
        });

      dsl = dsl.toString();


      script["Script Source File"] = dsl;
      //"Script Filename": fileName + '.dsl'


      fs.readFile(path + '/' + fileName + '.pcd', function(err, pcd) {
        if (err)
          return callback({
            err: err
          });

        //var buffer = new Buffer(pcd);

        script["Compiled Code"] = pcd;
        script["Compiled Code Size"] = pcd.length;


        rimraf(path, function(err) {
          if (err)
            return callback({
              err: err
            });
          else
            return callback({
              err: false
            });
        });
      });
    });
  });
}
// newupdate
function updateRefs(updateReferences, newPoint, flags, user, callback) {
  if (updateReferences === true) {
    updateDependencies(newPoint, {
      from: "newUpdate",
      method: (flags.method === null) ? "update" : flags.method
    }, user, function(err) {
      return callback(err);
    });

  } else {
    return callback(null);
  }
}
// newupdate
function doActivityLogs(generateActivityLog, logs, callback) {
  if (generateActivityLog) {
    async.each(logs, function(log, cb) {
      Utility.insert({
        collection: constants('activityLogCollection'),
        insertObj: log
      }, function(err, response) {
        cb(err);
      });
    }, callback);
  } else {
    return callback(null);
  }
}

function updSecurity(point, callback) {
  // if (!point.hasOwnProperty('Security')) {
  return callback();
  // }
  point.Security = point.Security.map(function(groupId) {
    return ObjectID(groupId);
  });

  var updateObj = {
    $set: {}
  };
  updateObj.$set['Points.' + point._id] = true;

  Utility.update({
    collection: 'User Groups',
    query: {
      _id: {
        $in: point.Security
      }
    },
    updateObj: updateObj
  }, function(err, group) {
    var updateObj = {
      $unset: {}
    };
    updateObj.$unset['Points.' + point._id] = 1;
    Utility.update({
      collection: 'User Groups',
      query: {
        _id: {
          $nin: point.Security
        }
      },
      updateObj: updateObj
    }, function(err, group) {
      point.Security = [];
      return callback(err);
    });
  });
}
//newupdate
function fixCfgRequired(updateCfgReq, oldPoint, newPoint, callback) {
  if (!!updateCfgReq) {
    var oldDevPoint = Config.Utility.getPropertyObject('Device Point', oldPoint).Value;
    var newDevPoint = Config.Utility.getPropertyObject('Device Point', newPoint).Value;
    // 0 > 0 - no change
    // N > 0 - cfg old
    // 0 > N - cfg new
    // N > M - cfg both
    var areBothZero = oldDevPoint === 0 && newDevPoint === 0;
    var isNowOffDevice = oldDevPoint !== 0 && newDevPoint === 0;
    var isNowOnDevice = oldDevPoint === 0 && newDevPoint !== 0;
    var didChangeDevice = oldDevPoint !== 0 && newDevPoint !== 0 && oldDevPoint !== newDevPoint;

    if (!areBothZero && (!!isNowOffDevice || !!isNowOnDevice || !!didChangeDevice)) {
      var upis = [];
      if (isNowOffDevice || didChangeDevice) {
        upis.push(oldDevPoint);
      }
      if (isNowOnDevice || didChangeDevice) {
        upis.push(newDevPoint);
      }

      Utility.update({
        collection: 'points',
        query: {
          _id: {
            $in: upis
          }
        },
        updateObj: {
          $set: {
            _cfgRequired: true
          }
        }
      }, callback);
    } else {
      callback();
    }
  } else {
    callback();
  }
}
//newupdate
function update_Model(updateModelType, newPoint, callback) {
  if (!!updateModelType) {
    var criteria = {
      collection: 'points',
      query: {
        'Point Refs.Value': newPoint._id
      }
    };
    Utility.iterateCursor(criteria, function(err, doc, next) {
      if (newPoint['Point Type'].Value === 'Device') {
        doc._devModel = newPoint['Model Type'].eValue;
      } else if (newPoint['Point Type'].Value === 'Remote Unit') {
        doc._rmuModel = newPoint['Model Type'].eValue;
      }
      Config.Utility.updDevModel({
        point: doc
      });
      Utility.update({
        collection: 'points',
        query: {
          _id: doc._id
        },
        updateObj: doc
      }, next);
    }, callback);
  } else {
    callback();
  }
}

// newupdate
function updDownlinkNetwk(updateDownlinkNetwk, newPoint, oldPoint, callback) {
  if (updateDownlinkNetwk) {
    Utility.update({
      collection: constants('pointsCollection'),
      query: {
        "Point Type.Value": "Device",
        "Uplink Port.Value": "Ethernet",
        $and: [{
          "Downlink Network.Value": {
            $ne: 0
          }
        }, {
          $or: [{
            'Downlink Network.Value': newPoint["Ethernet Network"].Value
          }, {
            'Downlink Network.Value': oldPoint["Ethernet Network"].Value
          }]
        }]
      },
      updateObj: {
        $set: {
          _updPoint: true
        }
      }
    }, function(err, result) {
      callback(err);
    });
  } else {
    callback(null);
  }
}

// newupdate
function updPoint(downloadPoint, newPoint, callback) {
  var errVar;
  if (downloadPoint === true) {
    //send download point request to c++ module
    var command = {
      "Command Type": 6,
      "upi": newPoint._id
    };
    var err;
    var code;
    command = JSON.stringify(command);

    zmq.sendCommand(command, function(error, msg) {
      if (!!error) {
        err = error.ApduErrorMsg;
        code = parseInt(error.ApduError, 10);
      }

      if (err) {
        if (code >= 2300 && code < 2304) {
          Utility.update({
            collection: constants('pointsCollection'),
            query: {
              _id: newPoint._id
            },
            updateObj: {
              $set: {
                _updPoint: true
              }
            }
          }, function(dberr, result) {
            if (dberr)
              return callback(dberr, null);
            else
              return callback(err, "success");
          });
        } else {
          return callback(err, null);
        }
      } else {
        return callback(null, "success");
      }
    });

  } else {
    callback(null, "success");
  }
}

//runScheduleEntry (tcp), newupdate (common)
function signalExecTOD(executeTOD, callback) {
  if (executeTOD === true) {
    var command = {
      "Command Type": 10
    };
    command = JSON.stringify(command);
    zmq.sendCommand(command, function(err, msg) {
      return callback(err, msg);
    });

  } else {
    callback(null, "success");
  }
}

//renamePoint(depre), deletePoint, restorePoint(io), updateRefs (common)
function updateDependencies(refPoint, flags, user, callback) {
  // schedule entries collection - find the control point properties and
  // run this against those properties that match the upi
  // create a new function for this and call from within this.
  var error = null;
  var data = {
    point: null,
    refPoint: refPoint,
    oldPoint: null,
    property: null,
    propertyObject: null
  };
  var devices = [];
  var signalTOD = false;
  var deepClone = function(o) {
    // Return the value if it's not an object; shallow copy mongo ObjectID objects
    if ((o === null) || (typeof(o) !== 'object') || (o instanceof ObjectID))
      return o;

    var temp = o.constructor();

    for (var key in o) {
      temp[key] = deepClone(o[key]);
    }
    return temp;
  };

  Utility.get({
    collection: constants('pointsCollection'),
    query: {
      "Point Refs.Value": refPoint._id
        // _parentUpi
    },
    fields: {
      _id: 1
    }
  }, function(err, dependencies) {
    async.eachSeries(dependencies, function(dependencyId, depCB) {
      Utility.getOne({
        collection: constants('pointsCollection'),
        query: {
          _id: dependencyId._id
        }
      }, function(err, dependency) {
        // TODO Check for errors
        console.log('waterfall', dependency.Name, dependency["Point Type"].Value, flags.method);
        async.waterfall([
          function(cb1) {
            if (dependency["Point Type"].Value === "Schedule Entry" && flags.method === "hard") {
              updateScheduleEntries(dependency, devices, null, function(todSignal) {
                signalTOD = (signalTOD | todSignal) ? true : false;
                // does deletePoint need to be called here?
                Utility.remove({
                  collection: constants('pointsCollection'),
                  query: {
                    _id: dependency._id
                  }
                }, function(err, result) {
                  console.log('first err', err);
                  cb1(err);
                });
              });

            } else {
              cb1(null);
            }
          },
          function(cb2) {

            data.point = dependency;
            data.oldPoint = deepClone(dependency);

            if (dependency["Point Type"].Value !== "Schedule Entry" || (flags.method !== "hard")) {
              if (dependency["Point Type"].Value === "Schedule Entry" && dependency._parentUpi === 0 && flags.method === "soft") {
                dependency._pStatus = 2;
                return cb2(null);
              }
              // dependency._cfgRequired = false;
              // dependency._updPoint = false;

              for (var i = 0; i < dependency["Point Refs"].length; i++) {
                if (dependency["Point Refs"][i].Value === refPoint._id) {
                  data.property = i;
                  data.propertyObject = dependency["Point Refs"][i];

                  switch (flags.method) {
                    case "hard":
                      data.propertyObject.Value = 0;
                      data.refPoint = null;
                      break;
                    case "soft":
                      data.propertyObject.PointInst = 0;
                      data.refPoint = null;
                      break;
                    case "restore":
                      data.propertyObject.PointInst = data.propertyObject.Value;
                      break;
                  }

                  /*if (dependency["Point Refs"][i]["Point Type"].Value === "Script")
                    data.newPoint._cfgRequired = true;*/
                  Config.Update.formatPoint(data);
                  if (data.err !== undefined) {
                    logger.error('data.err: ', data.err);
                    error = "ERROR!";
                    cb2(data.err);
                  }
                }
              }
              cb2(null);
            } else {
              cb2(null);
            }
          },
          function(cb3) {
            if (dependency["Point Type"].Value === "Schedule Entry") {
              if (flags.method !== 'hard') {
                updateScheduleEntries(dependency, devices, null, function(todSignal) {
                  signalTOD = (signalTOD | todSignal) ? true : false;
                  // does deletePoint need to be called here?
                  newUpdate(data.oldPoint, data.point, {
                    method: flags.method,
                    from: "updateDependencies"
                  }, user, function(response, point) {
                    console.log('second err', err);
                    cb3(response.err);
                  });
                });
              } else {
                return cb3();
              }
            } else {
              newUpdate(data.oldPoint, data.point, {
                method: flags.method,
                from: "updateDependencies"
              }, user, function(response, point) {
                cb3(null);
              });
            }
          }
        ], function(err) {
          console.log('err', err);
          depCB(err);
        });
      });
    }, function(err) {
      signalHostTOD(signalTOD, function(err) {
        if (err)
          return callback(err);
        updateDeviceToDs(devices, function(err) {
          callback((error !== null) ? error : err);
        });
      });
    });
  });
}

function restorePoint(upi, user, callback) {
  var logData = {
    user: user,
    timestamp: Date.now()
  };
  Utility.findAndModify({
    collection: pointsCollection,
    query: {
      _id: upi
    },
    sort: [],
    updateObj: {
      $set: {
        _pStatus: 0
      }
    },
    options: {
      new: true
    }
  }, function(err, point) {

    if (err)
      return callback({
        err: err
      });

    logData.activity = actLogsEnums["Point Restore"].enum;
    logData.log = "Point restored";
    logData.point = point;
    Utility.insert({
      collection: activityLogCollection,
      insertObj: logData
    }, function(err, result) {
      if (["Schedule", 'Sequence'].indexOf(point["Point Type"].Value) >= 0) {
        // get points based on parentupi
        Utility.update({
          collection: 'points',
          query: {
            _parentUpi: point._id
          },
          updateObj: {
            $set: {
              _pStatus: 0
            }
          },
          options: {
            multi: true
          }
        }, function(err, result) {
          return callback({
            message: "success"
          });
        });
      } else {
        restoreScheduleEntries(point, user, function() {
          common.updateDependencies(point, {
            method: "restore"
          }, user, function() {
            return callback({
              message: "success"
            });
          });
        });
      }
    });
  });
}

function restoreScheduleEntries(refPoint, user, callback) {
  var options = {
      from: "updateSchedules"
    },
    query = {
      'Point Type.Value': 'Schedule Entry',
      'Point Refs': {
        $elemMatch: {
          Value: refPoint._id,
          PropertyName: "Control Point"
        }
      }
    };

  Utility.get({
    collection: constants('pointsCollection'),
    query: query
  }, function(err, points) {
    var devices = [],
      signalTOD = false;
    async.eachSeries(points, function(point, asyncCB) {
      // if host schedule - set flag
      updateScheduleEntries(point, devices, refPoint, function(todSignal) {
        signalTOD = (signalTOD | todSignal) ? true : false;
        restorePoint(point._id, user, function(err) {
          asyncCB(err.err);
        });
      });
    }, function(err) {
      signalHostTOD(signalTOD, function(err) {
        if (err)
          return callback(err);
        updateDeviceToDs(devices, function(err) {
          callback(err);
        });
      });
    });
  });
}

//updateSchedules(io), io, deleteChildren, updateSequencePoints(io)
function deletePoint(upi, method, user, options, callback) {
  var _point,
    _updateFromSchedule = !!options && options.from === "updateSchedules",
    _upi = parseInt(upi, 10),
    _logData = {
      user: user,
      timestamp: Date.now()
    },
    _warning = '',
    _buildWarning = function(msg) {
      if (_warning.length) {
        _warning += '; ' + msg;
      } else {
        _warning = msg;
      }
    },
    _findPoint = function(cb) {
      var query = {
        _id: _upi
      };
      Utility.getOne({
        collection: constants('pointsCollection'),
        query: query
      }, function(err, point) {
        // Save point reference
        _point = point;
        // STOP PROCESSING if the the point wasn't found
        if (!err && !point) {
          err = 'Point not found';
        }
        cb(err);
      });
    },
    _deletePoint = function(cb) {
      var query = {
          _id: _upi
        },
        sort = [],
        update = {
          $set: {
            _pStatus: 2
          }
        },
        options = {
          new: true
        };

      if (method === 'hard') {
        Utility.remove({
          collection: constants('pointsCollection'),
          query: query
        }, function(err, result) {
          cb(err);
        });
      } else {
        query._pStatus = 0;
        Utility.findAndModify({
          collection: constants('pointsCollection'),
          query: query,
          sort: sort,
          updateObj: update,
          options: options
        }, function(err, point) {
          // Update our point reference
          _point = point;
          // STOP PROCESSING if we couldn't modify the point or if it wasn't found
          if (!err && !point) {
            err = "Point already deleted";
          }
          cb(err);
        });
      }
    },
    _updateUpis = function(cb) {
      // We only update the upis collection if the point is hard deleted (destroyed)
      if (method === 'soft') {
        return cb(null);
      }
      var query = {
          _id: _upi
        },
        sort = [],
        update = {
          $set: {
            _pStatus: 2
          }
        };
      // Not specifiying new: true because we don't need the updated document after the update
      Utility.findAndModify({
        collection: constants('upis'),
        query: query,
        sort: sort,
        updateObj: update
      }, function(err, result) {
        if (err) {
          _buildWarning('could not update the UPI collection');
        }
        cb(null);
      });
    },
    _deleteHistory = function(cb) {
      // We only remove entries from the history collection if the point is hard deleted (destroyed)
      if (method === 'soft') {
        return cb(null);
      }
      var query = {
        _id: _upi
      };
      Utility.remove({
        collection: constants('historyCollection'),
        query: query
      }, function(err, result) {
        if (err) {
          _buildWarning('could not remove all history entries');
        }
        cb(null);
      });
    },
    _fromScheduleExitCheck = function(cb) {
      // STOP PROCESSING if updating from schedules; otherwise continue down the waterfall
      if (_updateFromSchedule) {
        cb('OK');
      } else {
        cb(null);
      }
    },
    _addActivityLog = function(cb) {
      if (method === 'hard') {
        _logData.activity = actLogsEnums["Point Hard Delete"].enum;
        _logData.log = "Point destroyed";
      } else {
        _logData.activity = actLogsEnums["Point Soft Delete"].enum;
        _logData.log = "Point deleted";
      }
      _logData.point = _point;
      Utility.insert({
        collection: constants('activityLogCollection'),
        insertObj: utils.buildActivityLog(_logData)
      }, function(err, result) {
        if (err) {
          _buildWarning('could not create activity log');
        }
        cb(null);
      });
    },
    _deleteChildren = function(cb) {
      deleteChildren(method, _point["Point Type"].Value, _point._id, null, function(err) {
        if (err) {
          _buildWarning('could not delete all schedule entries associated with this point');
        }
        cb(null);
      });
    },
    _updateCfgRequired = function(cb) {
      updateCfgRequired(_point, function(err) {
        if (err) {
          _buildWarning('could not update the configuration required flag on all point dependencies');
        }
        cb(null);
      });
    },
    _updateDependencies = function(cb) {
      var refPoint = {
          _id: _upi
        },
        flags = {
          method: method
        };
      updateDependencies(refPoint, flags, user, function(err) {
        if (err) {
          _buildWarning('could not update all point dependencies');
        }
        cb(null);
      });
    },
    executeFunctions = [_findPoint, _deletePoint, _updateUpis, _deleteHistory, _fromScheduleExitCheck, _addActivityLog,
      _deleteChildren, _updateCfgRequired, _updateDependencies
    ];

  async.waterfall(executeFunctions, function(err) {
    var data = {};
    // If error is null or 'OK' (we send 'OK' when we need to exit the waterfall before it's completed)
    if (err === null || err === 'OK') {
      if (_warning.length) {
        data.warning = _warning;
      } else {
        data.message = 'success';
      }
    } else {
      data.err = err;
    }
    callback(data);
  });
}

// deletepoint
function deleteChildren(method, pointType, upi, user, callback) {
  var options = {
      from: "updateSchedules"
    },
    query = {};
  // Build the query object
  if (["Schedule", 'Sequence'].indexOf(pointType) >= 0) {
    query._parentUpi = upi;
    if (method === 'soft') {

      Utility.update({
        collection: constants('pointsCollection'),
        query: query,
        updateObj: {
          $set: {
            _pStatus: 2
          }
        },
        options: {
          multi: true
        }
      }, function(err, results) {
        callback(err);
      });
    } else if (method === 'hard') {
      Utility.remove({
          collection: constants('pointsCollection'),
          query: query
        },
        callback);
    } else {
      return callback();
    }
  } else {
    return callback();
  }
}

//updateDependencies, deleteChildren, updateSchedules(io)
function updateDeviceToDs(devices, callback) {
  Utility.update({
    collection: constants('pointsCollection'),
    query: {
      _id: {
        $in: devices
      }
    },
    updateObj: {
      $set: {
        _updTOD: true
      }
    },
    options: {
      multi: true
    }
  }, function(err, result) {
    callback(err);
  });
}
//updateDependencies, deleteChildren, updateSchedules(io)
function signalHostTOD(signalTOD, callback) {
  if (signalTOD === true) {
    var command = {
      "Command Type": 9
    };
    command = JSON.stringify(command);
    zmq.sendCommand(command, function(err, msg) {
      return callback(err, msg);
    });

  } else {
    callback(null, "success");
  }
}
//updateDependencies, deleteChildren
function updateScheduleEntries(scheduleEntry, devices, refPoint, callback) {
  var signalTOD = false;

  if (refPoint !== null)
    scheduleEntry = Config.Update.formatPoint({
      point: scheduleEntry,
      oldPoint: scheduleEntry,
      property: "Control Point",
      refPoint: refPoint
    });

  if (scheduleEntry["Host Schedule"].Value === true) {
    signalTOD = true;
  } else {
    addToDevices(scheduleEntry, devices);
  }

  return callback(signalTOD);
}


//updateSchedules(io), updateScheduleEntries
function addToDevices(scheduleEntry, devices, oldPoint) {
  var devInst = Config.Utility.getPropertyObject("Control Point", scheduleEntry).DevInst;
  if (devInst !== null && devInst !== 0 && devices.indexOf(devInst) === -1) {
    devices.push(parseInt(devInst, 10));
  }
  if (!!oldPoint) {
    devInst = Config.Utility.getPropertyObject("Control Point", oldPoint).DevInst;
    if (devInst !== null && devInst !== 0 && devices.indexOf(devInst) === -1) {
      devices.push(parseInt(devInst, 10));
    }
  }
}
//addpoint (io), deletepoint
function updateCfgRequired(point, callback) {
  if (point["Point Type"].Value === "Device") {
    point._cfgRequired = true;
    callback(null);
  } else if (Config.Utility.getPropertyObject("Device Point", point) !== null) {
    point._cfgRequired = true;
    if (Config.Utility.getPropertyObject("Device Point", point).PointInst !== 0) {
      Utility.update({
        collection: constants('pointsCollection'),
        query: {
          _id: Config.Utility.getPropertyObject("Device Point", point).PointInst
        },
        updateObj: {
          $set: {
            _cfgRequired: true
          }
        }
      }, function(err, result) {
        callback(err);
      });
    } else {
      callback(null);
    }
  } else { // TODO Schedule Entry comes to here. Added to progress.
    callback(null);
  }
}

function getRecentAlarms(data, callback) {
  var currentPage, itemsPerPage, numberItems, startDate, endDate, count, query, sort, groups = [];

  if (typeof data === "string")
    data = JSON.parse(data);
  currentPage = parseInt(data.currentPage, 10);
  itemsPerPage = parseInt(data.itemsPerPage, 10);
  startDate = (typeof parseInt(data.startDate, 10) === "number") ? data.startDate : 0;
  endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;

  sort = {};

  if (!itemsPerPage) {
    itemsPerPage = 200;
  }
  if (!currentPage || currentPage < 1) {
    currentPage = 1;
  }

  numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

  query = {
    $and: [{
      msgTime: {
        $gte: startDate
      }
    }, {
      msgTime: {
        $lte: endDate
      }
    }]
  };

  if (data.name1 !== undefined) {
    if (data.name1 !== null) {
      query.Name1 = new RegExp("^" + data.name1, 'i');
    } else {
      query.Name1 = "";
    }

  }
  if (data.name2 !== undefined) {
    if (data.name2 !== null) {
      query.Name2 = new RegExp("^" + data.name2, 'i');
    } else {
      query.Name2 = "";
    }
  }
  if (data.name3 !== undefined) {
    if (data.name3 !== null) {
      query.Name3 = new RegExp("^" + data.name3, 'i');
    } else {
      query.Name3 = "";
    }
  }
  if (data.name4 !== undefined) {
    if (data.name4 !== null) {
      query.Name4 = new RegExp("^" + data.name4, 'i');
    } else {
      query.Name4 = "";
    }
  }
  if (data.msgCat) {
    query.msgCat = {
      $in: data.msgCat
    };
  }
  if (data.almClass) {
    query.almClass = {
      $in: data.almClass
    };
  }

  if (data.pointTypes) {
    query.PointType = {
      $in: data.pointTypes
    };
  }

  sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

  var start = new Date();
  Utility.getWithSecurity({
    collection: alarmsCollection,
    query: query,
    sort: sort,
    _skip: (currentPage - 1) * itemsPerPage,
    _limit: numberItems,
    data: data
  }, function(err, alarms, count) {
    callback(err, alarms, count);
  });
}

function getUnacknowledged(data, callback) {
  var currentPage, itemsPerPage, numberItems, user, groups, query, count, alarmIds, sort;

  if (typeof data === "string")
    data = JSON.parse(data);

  currentPage = parseInt(data.currentPage, 10);
  itemsPerPage = parseInt(data.itemsPerPage, 10);
  user = data.user;
  sort = {};

  if (!itemsPerPage) {
    itemsPerPage = 200;
  }
  if (!currentPage || currentPage < 1) {
    currentPage = 1;
  }

  numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

  user = data.user;

  query = {
    ackStatus: 1
  };

  if (data.name1 !== undefined) {
    if (data.name1 !== null) {
      query.Name1 = new RegExp("^" + data.name1, 'i');
    } else {
      query.Name1 = "";
    }
  }
  if (data.name2 !== undefined) {
    if (data.name2 !== null) {
      query.Name2 = new RegExp("^" + data.name2, 'i');
    } else {
      query.Name2 = "";
    }
  }
  if (data.name3 !== undefined) {
    if (data.name3 !== null) {
      query.Name3 = new RegExp("^" + data.name3, 'i');
    } else {
      query.Name3 = "";
    }
  }
  if (data.name4 !== undefined) {
    if (data.name4 !== null) {
      query.Name4 = new RegExp("^" + data.name4, 'i');
    } else {
      query.Name4 = "";
    }
  }

  if (data.msgCat) {
    query.msgCat = {
      $in: data.msgCat
    };
  }

  if (data.almClass) {
    query.almClass = {
      $in: data.almClass
    };
  }

  if (data.pointTypes) {
    query.PointType = {
      $in: data.pointTypes
    };
  }

  sort.msgTime = (data.sort !== 'desc') ? -1 : 1;
  var start = new Date();
  Utility.getWithSecurity({
    collection: alarmsCollection,
    query: query,
    sort: sort,
    _skip: (currentPage - 1) * itemsPerPage,
    _limit: numberItems,
    data: data
  }, function(err, alarms, count) {
    if (err) callback(err, null, null);
    callback(err, alarms, count);
  });
}

function getActiveAlarmsNew(data, callback) {
  var currentPage, itemsPerPage, numberItems, startDate, endDate, count, user, query, sort, groups = [];

  if (typeof data === "string")
    data = JSON.parse(data);
  currentPage = parseInt(data.currentPage, 10);
  itemsPerPage = parseInt(data.itemsPerPage, 10);
  startDate = (typeof parseInt(data.startDate, 10) === "number") ? data.startDate : 0;
  endDate = (parseInt(data.endDate, 10) === 0) ? Math.floor(new Date().getTime() / 1000) : data.endDate;

  sort = {};

  if (!itemsPerPage) {
    itemsPerPage = 200;
  }
  if (!currentPage || currentPage < 1) {
    currentPage = 1;
  }

  numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

  user = data.user;

  query = {
    $and: [{
      msgTime: {
        $gte: startDate
      }
    }, {
      msgTime: {
        $lte: endDate
      }
    }]
  };

  if (data.name1 !== undefined) {
    if (data.name1 !== null) {
      query.Name1 = new RegExp("^" + data.name1, 'i');
    } else {
      query.Name1 = "";
    }

  }
  if (data.name2 !== undefined) {
    if (data.name2 !== null) {
      query.Name2 = new RegExp("^" + data.name2, 'i');
    } else {
      query.Name2 = "";
    }
  }
  if (data.name3 !== undefined) {
    if (data.name3 !== null) {
      query.Name3 = new RegExp("^" + data.name3, 'i');
    } else {
      query.Name3 = "";
    }
  }
  if (data.name4 !== undefined) {
    if (data.name4 !== null) {
      query.Name4 = new RegExp("^" + data.name4, 'i');
    } else {
      query.Name4 = "";
    }
  }
  if (data.msgCat) {
    query.msgCat = {
      $in: data.msgCat
    };
  }
  if (data.almClass) {
    query.almClass = {
      $in: data.almClass
    };
  }

  if (data.pointTypes) {
    query.PointType = {
      $in: data.pointTypes
    };
  }

  sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

  var start = new Date();
  Utility.getWithSecurity({
    collection: "ActiveAlarms",
    query: query,
    sort: sort,
    _skip: (currentPage - 1) * itemsPerPage,
    _limit: numberItems,
    data: data
  }, function(err, alarms, count) {
    callback(err, alarms, count);
  });
}

//loop
function autoAcknowledgeAlarms(callback) {
  var now, twentyFourHoursAgo;
  now = Math.floor(Date.now() / 1000);
  twentyFourHoursAgo = now - 86400;
  Utility.update({
    collection: constants('alarmsCollection'),
    query: {
      msgTime: {
        $lte: twentyFourHoursAgo
      },
      ackStatus: 1
    },
    updateObj: {
      $set: {
        ackUser: "System",
        ackTime: now,
        ackStatus: 2
      }
    },
    options: {
      multi: true
    }
  }, function(err, result) {
    callback(result);
  });
}

function sendUpdate(dynamic) {
  if (rooms.hasOwnProperty(dynamic.upi)) {
    io.to(dynamic.upi).emit('recieveUpdate', dynamic);
  }
}

function acknowledgePointAlarms(alarm) {
  if (alarm.ackStatus === Config.Enums['Acknowledge Statuses']['Auto Acknowledge'].enum) {
    var now = Math.floor(Date.now() / 1000);
    var upi = alarm.upi;
    var criteria = {
      collection: 'Alarms',
      query: {
        upi: upi,
        ackStatus: Config.Enums['Acknowledge Statuses']['Not Acknowledged'].enum
      },
      updateObj: {
        $set: {
          ackUser: "System",
          ackTime: now,
          ackStatus: Config.Enums['Acknowledge Statuses'].Acknowledged.enum
        }
      },
      options: {
        multi: true
      }
    };
    logger.info('acknowledgePointAlarms', JSON.stringify(criteria));
    Utility.update(criteria, function(err, result) {
      if (err) {
        logger.error(err);
      } else {
        criteria.collection = 'ActiveAlarms';
        Utility.update(criteria, function(err, result) {
          if (err) {
            logger.error(err);
          }

        });
      }
    });
  }
}

function addPoint(data, user, options, callback) {
  var point = data.point;
  var logData = {
    user: user,
    timestamp: Date.now(),
    point: point,
    activity: actLogsEnums["Point Add"].enum,
    log: "Point added"
  };


  updateCfgRequired(point, function(err) {
    if (err)
      callback(err);

    point._pStatus = 0;

    var searchQuery = {};
    var updateObj = {};

    if (!point.Security)
      point.Security = [];

    //strip activity log and then insert act msg into db

    searchQuery._id = point._id;
    delete point._id;
    updateObj = point;
    updateObj._actvAlmId = ObjectID(updateObj._actvAlmId);
    // updateObj._curAlmId = ObjectID(updateObj._curAlmId);


    Utility.update({
      collection: pointsCollection,
      query: searchQuery,
      updateObj: updateObj
    }, function(err, freeName) {
      if (err) {
        callback(err);
      } else {
        point._id = searchQuery._id;
        logData.point._id = searchQuery._id;
        if (!!options && options.from === "updateSchedules") {
          return callback({
            msg: "success"
          }, point);
        }
        var logObj = utils.buildActivityLog(logData);

        Utility.insert({
          collection: activityLogCollection,
          insertObj: logObj
        }, function(err, result) {
          if (data.hasOwnProperty('oldPoint')) {
            newUpdate(data.oldPoint, point, {
              from: 'addpoint'
            }, user, function(err, newPoint) {
              callback({
                msg: "success"
              }, newPoint);
            });
          } else {
            return callback({
              msg: "success"
            }, point);
          }
        });
      }
    });

  });
}