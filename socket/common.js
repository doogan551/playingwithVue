// NODE MODULES
var fs = require('fs');

// NPM MODULES
var async = require('async');
var ObjectID = require('mongodb').ObjectID;

// OTHERS
var Utility = require('../models/utility');
var utils = require('../helpers/utils');
var constants = utils.CONSTANTS;
var Config = require('../public/js/lib/config.js');
var actLogsEnums = Config.Enums["Activity Logs"];

var openDisplays = [];
var openAlarms = [];
var common = {
  sockets: require('../helpers/sockets.js'),
  openDisplays: openDisplays,
  openAlarms: openAlarms
};

var socket = function() {
  Utility.getOne({
    collection: 'SystemInfo',
    query: {
      Name: 'Quality Codes'
    }
  }, function(err, codes) {
    common.qualityCodes = codes.Entries;
  });
  Utility.getOne({
    collection: 'SystemInfo',
    query: {
      Name: 'Control Priorities'
    }
  }, function(err, priorities) {
    common.controlPriorities = priorities.Entries;
  });
  loader();
};

var loader = function() {
  require('./socketio')(common);
  require('./oplog')(common);
  require('./tcp')(common);
};

// io & oplog
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

common.newUpdate = newUpdate;
common.signalExecTOD = signalExecTOD;
common.updateDependencies = updateDependencies;
common.deletePoint = deletePoint;
common.updateDeviceToDs = updateDeviceToDs;
common.signalHostTOD = signalHostTOD;
common.addToDevices = addToDevices;
common.updateCfgRequired = updateCfgRequired;

module.exports = {
  socket: socket
};

// is this still necessary?
(function loop() {

  setTimeout(function() {
    // if (oplog.conn.db !== undefined) {

    updateAlarms(function() {});
    // } else
    // loop();
  }, 10000);
})();

(function loop() {
  setTimeout(function() {
    autoAcknowledgeAlarms(function(result) {
      loop();
    });
  }, 300000);
})();

//io, updateSequencePoints, runScheduleEntry(tcp), updateDependencies
function newUpdate(oldPoint, newPoint, flags, user, callback) {
  var generateActivityLog = false,
    updateReferences = false,
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

  readOnlyProps = ["_id", "_relDevice", "_relRMU", "_cfgDevice", "_updPoint", "_updTOD", "_pollTime",
    "_forceAllCOV", "_actvAlmId", "_curAlmId", "Alarm State", "Control Pending", "Device Status",
    "Last Report Time", "Point Instance", "Point Type", "Reliability", "Trend Last Status", "Trend Last Value"
  ];
  // JDR - Removed "Authorized Value" from readOnlyProps because it changes when ValueOptions change. Keep this note.

  Utility.getOne({
    collection: 'points',
    criteria: {
      _id: newPoint._id
    },
    fields: {
      _pStatus: 1,
      _id: 0
    }
  }, function(err, dbPoint) {
    if (err)
      return callback({
        err: err
      }, null);
    else if (!dbPoint)
      return callback({
        err: "Point not found: " + newPoint._id
      }, null);
    else if (dbPoint._pStatus === Config.Enums["Point Statuses"].Deleted.enum)
      return callback({
        err: "Point deleted: " + newPoint._id
      }, null);

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
      }
      /*else if (newPoint.Name !== oldPoint.Name && flags.method === "rename") {
        activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {log:"Point renamed from " + oldPoint.Name + " to " + newPoint.Name, activity: actLogsEnums["Point Restore"].enum})));
      }*/
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

    function updateProperties() {
      for (var prop in newPoint) {

        // this will compare Slides and Point Refs arrays.
        if (!_.isEqual(newPoint[prop], oldPoint[prop])) {
          if (readOnlyProps.indexOf(prop) !== -1) {
            return callback({
              err: "A read only property has been changed: " + prop
            }, null);
          } else {
            console.log(prop);
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

                if (!_.isEqual(newPoint[prop].ValueOptions, oldPoint[prop].valueOptions)) {
                  updateReferences = true;
                  propName = "Value.ValueOptions";
                  updateObject[propName] = newPoint[prop].ValueOptions;
                }
                if (newPoint[prop].isReadOnly !== oldPoint[prop].isReadOnly) {
                  propName = "Value.isReadOnly";
                  updateObject[propName] = newPoint[prop].isReadOnly;
                }
                if (newPoint[prop].Value !== oldPoint[prop].Value) {
                  if (newPoint["Out of Service"].Value === true) {
                    downloadPoint = true;

                    propName = "Value.Value";
                    updateObject[propName] = newPoint[prop].Value;

                    if (newPoint[prop].eValue !== undefined) {
                      propName = "Value.eValue";
                      updateObject[propName] = newPoint[prop].eValue;

                      if (newPoint.Value.oosValue !== undefined)
                        updateObject["Value.oosValue"] = newPoint[prop].eValue;

                    } else if (newPoint.Value.oosValue !== undefined) {
                      updateObject["Value.oosValue"] = newPoint[prop].Value;
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
              case "Demand Enable":
              case "Demand Interval":
              case "Disable Limit Fault":
              case "Downlink Broadcast":
              case "Downlink Network":
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
                downloadPoint = true;
                break;

              case "Channel":
              case "Close Channel":
              case "Control Data Type":
              case "Control Function":
              case "Control Register":
              case "Device Address":
              case "Device Port":
              case "Downlink IP Port":
              case "Ethernet IP Port":
              case "Feedback Channel":
              case "Feedback Type":
              case "Input Type":
              case "Instance":
              case "Network Segment":
              case "Network Type":
              case "Off Channel":
              case "Off Control Data Type":
              case "Off Control Function":
              case "Off Control Register":
              case "Off Control Value":
              case "On Channel":
              case "On Control Data Type":
              case "On Control Function":
              case "On Control Register":
              case "On Control Value":
              case "Open Channel":
              case "Output Type":
              case "Poll Data Type":
              case "Poll Function":
              case "Poll Register":
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
              case "VAV Channel":
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
                if (newPoint["Point Type"].Value === "Device")
                  updateDownlinkNetwk = true;
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
              if (updateObject[prop] !== undefined && ((updateObject[prop].ValueType === 5 && updateObject[prop].eValue !== oldPoint[prop].eValue) || (updateObject[prop].ValueType !== 5 && updateObject[prop].Value !== oldPoint[prop].Value))) {
                if (prop === "Point Refs") {
                  if (newPoint["Point Type"].Value === "Slide Show") {
                    activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
                      log: "Slide Show edited",
                      activity: actLogsEnums["Slide Show Edit"].enum
                    })));
                  } else {
                    compareArrays(newPoint[prop], oldPoint[prop], activityLogObjects);
                  }
                } else if (prop === "Configure Device") {
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
          var propertyNetwork = newPoint["Uplink Port"].Value + " Network",
            propertyAddress = newPoint["Uplink Port"].Value + " Address";
          updateObject["Network Segment.Value"] = newPoint[propertyNetwork].Value;
          updateObject["Device Address.Value"] = newPoint[propertyAddress].Value.toString();
        }

        if (configRequired === true) {
          updateObject._cfgRequired = true;
          downloadPoint = false;

        } else if (newPoint._pStatus !== Config.Enums["Point Statuses"].Active.enum ||
          newPoint._devModel === Config.Enums["Device Model Types"].Unknown.enum ||
          newPoint._devModel === Config.Enums["Device Model Types"]["Central Device"].enum ||
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
          updDownlinkNetwk(updateDownlinkNetwk, newPoint, function(err) {
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
                  updateRefs(updateReferences, newPoint, flags, function(err) {
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
            log: "Property deleted",
            activity: actLogsEnums["Point Property Edit"].enum
          })));
        } else if (newArray[i].Value !== 0 && oldArray[i].Value === 0) {
          activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
            log: "Property added",
            activity: actLogsEnums["Point Property Edit"].enum
          })));
        } else {
          activityLogObjects.push(utils.buildActivityLog(_.merge(logData, {
            log: "Property changed",
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

  script = data.point;
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
function updateRefs(updateReferences, newPoint, flags, callback) {
  if (updateReferences === true) {
    updateDependencies(newPoint, {
      from: "newUpdate",
      method: (flags.method === null) ? "update" : flags.method
    }, null, function(err) {
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
// newupdate
function updDownlinkNetwk(updateDownlinkNetwk, newPoint, callback) {
  if (updateDownlinkNetwk) {
    Utility.update({
      collection: constants('pointsCollection'),
      query: {
        "Point Type.Value": "Device",
        "Uplink Port.Value": "Ethernet",
        "Downlink Network.Value": newPoint["Ethernet Network"].Value
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
      },
      err, code;
    command = JSON.stringify(command);
    cppApi.command(command, function(error, msg) {
      if (error !== 0 && error !== null) {
        errVar = JSON.parse(error);
        err = errVar.ApduErrorMsg;
        code = parseInt(errVar.ApduError, 10);
      } else
        msg = JSON.parse(msg);

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
        } else
          return callback(err, null);
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
    cppApi.command(command, function(error, msg) {
      error = JSON.parse(error);
      msg = JSON.parse(msg);


      return callback(error, msg);
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
  var error = null,
    data = {
      point: null,
      refPoint: refPoint,
      oldPoint: null,
      property: null,
      propertyObject: null
    },
    devices = [],
    signalTOD = false,
    deepClone = function(o) {
      // Return the value if it's not an object; shallow copy mongo ObjectID objects
      if ((o === null) || (typeof(o) !== 'object') || (o instanceof ObjectID))
        return o;

      var temp = o.constructor();

      for (var key in o) {
        temp[key] = deepClone(o[key]);
      }
      return temp;
    }
    /*,
          //updateDependency = ,
          updateDependencyProperty = */
  ;

  Utility.get({
    collection: constants('pointsCollection'),
    query: {
      "Point Refs.Value": refPoint._id
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
              if (dependency["Point Type"].Value === "Schedule Entry" && flags.method === "soft")
                dependency._pStatus = 1; // was _pAccess

              dependency._cfgRequired = false;
              dependency._updPoint = false;

              for (var i = 0; i < dependency["Point Refs"].length; i++) {
                if (dependency["Point Refs"][i].Value === refPoint._id) {
                  data.property = dependency["Point Refs"][i].PropertyName;
                  data.propertyObject = dependency["Point Refs"][i];

                  if (flags.method === "hard")
                    data.propertyObject.Value = 0;

                  if (flags.method === "hard" || flags.method === "soft")
                    data.refPoint = null;

                  /*if (dependency["Point Refs"][i]["Point Type"].Value === "Script")
                    data.newPoint._cfgRequired = true;*/
                  Config.Update.formatPoint(data);
                  if (data.err !== undefined) {
                    console.log('data.err: ', data.err);
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
              updateScheduleEntries(dependency, devices, null, function(todSignal) {
                signalTOD = (signalTOD | todSignal) ? true : false;
                // does deletePoint need to be called here?
                newUpdate(data.oldPoint, data.point, {
                  method: flags.method,
                  from: "updateDependencies"
                }, null, function(response, point) {
                  cb3(response.err);
                });
              });
            } else {
              newUpdate(data.oldPoint, data.point, {
                method: flags.method,
                from: "updateDependencies"
              }, null, function(response, point) {
                cb3(null);
              });
            }
          }
        ], function(err) {
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

//updateSchedules(io), io, deleteScheduleEntries, updateSequencePoints(io)
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
    _deleteScheduleEntries = function(cb) {
      deleteScheduleEntries(method, _point["Point Type"].Value, _point._id, null, function(err) {
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
      _deleteScheduleEntries, _updateCfgRequired, _updateDependencies
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
function deleteScheduleEntries(method, pointType, upi, user, callback) {
  var options = {
      from: "updateSchedules"
    },
    query = {};

  // Build the query object
  if (pointType === "Schedule") {
    query._parentUpi = upi;
  } else {
    // deleted a non-schedule point
    // do i need to search based on parentUpi still?
    query._parentUpi = 0;
    query["Point Type.Value"] = "Schedule Entry";
    query["Point Refs"] = {
      $elemMatch: {
        Value: upi,
        PropertyName: "Control Point"
      }
    };
  }

  Utility.get({
    collection: constants('pointsCollection'),
    query: query
  }, function(err, points) {
    var devices = [],
      signalTOD = false;
    async.eachSeries(points, function(point, asyncCB) {
      // if host schedule - set flag
      updateScheduleEntries(point, devices, null, function(todSignal) {
        signalTOD = (signalTOD | todSignal) ? true : false;
        deletePoint(point._id, method, user, options, function(err) {
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
      callback(err);
    });
  });
}

//updateDependencies, deleteScheduleEntries, updateSchedules(io)
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
//updateDependencies, deleteScheduleEntries, updateSchedules(io)
function signalHostTOD(signalTOD, callback) {
  if (signalTOD === true) {
    var command = {
      "Command Type": 9
    };
    command = JSON.stringify(command);
    cppApi.command(command, function(error, msg) {
      error = JSON.parse(error);
      msg = JSON.parse(msg);


      return callback(error, msg);
    });

  } else {
    callback(null, "success");
  }
}
//updateDependencies, deleteScheduleEntries
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

//loop
function updateAlarms(finalCB) {
  var alarmsStart = new Date();
  async.each(openAlarms,
    function(openAlarm, callback) {
      if (openAlarm.alarmView === "Recent") {

        getRecentAlarms(openAlarm.data, function(err, recents, count) {
          io.sockets.socket(openAlarm.sockId).emit('recentAlarms', {
            alarms: recents,
            count: count
          });

          return callback(null);
        });
      }
      if (openAlarm.alarmView === "Active") {
        getActiveAlarms(openAlarm.data, function(err, recents, count) {

          io.sockets.socket(openAlarm.sockId).emit('activeAlarms', {
            alarms: recents,
            count: count
          });
          return callback(null);
        });
      }
      if (openAlarm.alarmView === "Unacknowledged") {
        getUnacknowledged(openAlarm.data, function(err, recents, count) {

          io.sockets.socket(openAlarm.sockId).emit('unacknowledged', {
            alarms: recents,
            count: count
          });
          return callback(null);
        });
      }
    },
    function(err) {
      return finalCB();
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