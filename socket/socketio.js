// CORE MODULES
var fs = require('fs');
var net = require('net');
var events = require('events');

// NPM MODULES
var passport = require('passport');
var _ = require('lodash');
var async = require('async');
var tmp = require('tmp');
var rimraf = require('rimraf');

// OTHERS
var utils = require('../helpers/utils.js')
var config = require('../public/js/lib/config.js');
// var cppApi = new(require('Cpp_API').Tasks)();
// var monitorSender = new(require('MonitorSender').Tasks)();
var compiler = require('../helpers/scriptCompiler.js');

var pointsCollection = utils.CONSTANTS("pointsCollection");
var historyCollection = utils.CONSTANTS("historyCollection");
var alarmsCollection = utils.CONSTANTS("alarmsCollection");
var activityLogCollection = utils.CONSTANTS("activityLogCollection");
var qualityCodes = [];
var actLogsEnums = config.Enums["Activity Logs"];
var controllerPriorities = [];
var eventEmitter = new events.EventEmitter();

module.exports = function socketio(common) {
  var io = common.sockets.get().io;

  io.sockets.on('connection', function(sock) {
    var sockId, socket, user;
    socket = sock;
    sockId = sock.id;

    user = sock.request.user;

    sock.on('getStatus', function() {
      // sock.emit('statusUpdate', systemStatus);
      console.log('system  status not gotten');
    });

    //socket function called from client to let server know a new display is open
    sock.on('displayOpen', function(data) {

      if (data.data.display.message === undefined) {
        //pop on displays array
        openDisplays.push({
          sockId: data.data.socketid,
          display: data.data.display
        });


        io.sockets.emit('sendDisplays', {
          data: openDisplays
        });

        getVals();
      }
    });

    //removes display from active list when closed
    sock.on('disconnect', function() {
      //checks to see if closed socket was an active display, and removes it from the list.
      var splicenum = -1;

      for (var j = 0; j < openDisplays.length; j++) {
        if (openDisplays[j].sockId == sock.id) {
          splicenum = j;
        }
      }

      for (var k = 0; k < openAlarms.length; k++) {
        if (openAlarms[k].sockId == sock.id) {
          openAlarms.splice(k, 1);
          k--;
        }
      }

      if (splicenum > -1) {
        openDisplays.splice(splicenum, 1);
        //this just alerts the console page to refresh the list
        io.sockets.emit('sendDisplays', {
          data: openDisplays
        });
      }
    });

    sock.on('getRecentAlarms', function(data) {
      if (typeof data === "string")
        data = JSON.parse(data);

      maintainAlarmViews(sock.id, "Recent", data, common);

      getRecentAlarms(data, function(err, alarms, count) {
        sock.emit('recentAlarms', {
          alarms: alarms,
          count: count,
          reqID: data.reqID
        });
      });
    });

    sock.on('getUnacknowledged', function(data) {
      if (typeof data === "string")
        data = JSON.parse(data);

      maintainAlarmViews(sock.id, "Unacknowledged", data, common);

      getUnacknowledged(data, function(err, alarms, count) {
        sock.emit('unacknowledged', {
          alarms: alarms,
          count: count,
          reqID: data.reqID
        });
      });
    });

    sock.on('getActiveAlarms', function(data) {
      if (typeof data === "string")
        data = JSON.parse(data);

      maintainAlarmViews(sock.id, "Active", data, common);

      getActiveAlarmsNew(data, function(err, alarms, count) {
        sock.emit('activeAlarms', {
          alarms: alarms,
          count: count,
          reqID: data.reqID
        });
      });
    });

    sock.on('sendAcknowledge', function(data) {
      if (typeof data === "string")
        data = JSON.parse(data);

      sendAcknowledge(data, function(err, result) {
        sock.emit('acknowledgeResponse', {
          result: result,
          reqID: data.reqID
        });
      });
    });

    sock.on('fieldCommand', function(data) {
      jsonData = JSON.parse(data);
      var error, logData, i;
      //data = JSON.stringify(data);
      if (jsonData["Command Type"] === 7) {
        logData = {
          user: jsonData.logData.user,
          timestamp: Date.now(),
          point: jsonData.logData.point,
          activity: Config.Enums["Activity Logs"]["Point Control"].enum,
          prop: "Value",
          Security: jsonData.logData.point.Security
        };

        if (jsonData.Relinquish === 0) {
          logData.newValue = {
            Value: jsonData.logData.newValue.Value
          };
          if (jsonData.logData.newValue.eValue !== undefined) {
            logData.newValue.eValue = jsonData.logData.newValue.eValue;
          }
          logData.log = "Control to " + logData.newValue.Value;
          if (jsonData.hasOwnProperty("Priority")) {
            for (i = 0; i < controllerPriorities.length; i++) {
              if (controllerPriorities[i]["Priority Level"] === jsonData.Priority) {
                logData.log += " at priority " + controllerPriorities[i]["Priority Text"];
              }
            }

          }
        } else {
          for (i = 0; i < controllerPriorities.length; i++) {
            if (controllerPriorities[i]["Priority Level"] === jsonData.Priority) {
              logData.log = "Control relinquished at priority " + controllerPriorities[i]["Priority Text"];
            }
          }
        }

      } else if (jsonData["Command Type"] === 2) {
        logData = {
          user: jsonData.logData.user,
          timestamp: Date.now(),
          point: jsonData.logData.point,
          Security: jsonData.logData.point.Security
        };
        if (jsonData.state === 1) {
          logData.activity = Config.Enums["Activity Logs"]["Warm Restart"].enum;
          logData.log = "Warm Restart sent";
        } else {
          logData.activity = Config.Enums["Activity Logs"].Reset.enum;
          logData.log = "Reset sent";
        }
      }

      delete jsonData.logData;
      data = JSON.stringify(jsonData);

      if ([2, 7].indexOf(jsonData["Command Type"]) > -1) {
        logData = Utils.buildActivityLog(logData);
        mydb.collection(activityLogCollection).insert(logData, function(err, result) {});
      }

      cppApi.command(data, function(err, msg) {

        if (err !== 0 && err !== null) {
          error = JSON.parse(err);

          sock.emit('returnFromField', JSON.stringify({
            err: error.ApduErrorMsg
          }));
        } else {
          sock.emit('returnFromField', msg);
        }
      });
    });

    sock.on('firmwareLoader', function(data) {

      var error, filePath, dataJSON = JSON.stringify(data),
        logData = {
          user: data.logData.user,
          timestamp: Date.now(),
          point: data.logData.point,
          activity: Config.Enums["Activity Logs"]["Firmware Load"].enum,
          Security: data.logData.point.Security,
          log: data.logData.point["Firmware Version"] + " Firmware '" + data.fileName + "' loaded"
        },
        sendCommand = function(filePath) {
          var command = {
            "Command Type": 11,
            "devices": data.devices,
            "remotes": data.remotes,
            "cardtype": data.model,
            "firmwarefile": filePath,
          };
          command = JSON.stringify(command);
          cppApi.command(command, function(data) {
            data = JSON.parse(data);
            if (data.err !== undefined) {
              sock.emit('returnFromLoader', {
                percent: 100
              });
              sock.emit('returnFromLoader', JSON.stringify({
                err: data.error.ApduErrorMsg
              }));
            } else {
              sock.emit('returnFromLoader', {
                percent: 100
              });
              sock.emit('returnFromLoader', {
                message: data.msg
              });
            }
          });

          /*function testProgress(percent) {
						if (percent <= 100) {
							sock.emit('returnFromLoader', {
								percent: percent
							});
							setTimeout(function() {
								testProgress(percent + 10);
							}, 500);
						} else {
							sock.emit('returnFromLoader', {
								message: "success"
							});
						}
					}
					testProgress(0);*/
        },
        logMessage = function(logData) {
          logData = Utils.buildActivityLog(logData);
          mydb.collection(activityLogCollection).insert(logData, function(err, result) {});
        };

      if (data.uploadFile !== undefined) {
        filePath = process.env.driveLetter + ":/InfoScan/Firmware/" + data.model + "/" + data.fileName;
        logMessage(logData);
        fs.writeFile(filePath, data.uploadFile, function(err) {
          sendCommand(filePath);
          if (false) {
            fs.unlink(filePath, function(err) {

            });
          }
        });
      } else {
        filePath = process.env.driveLetter + ":/InfoScan/Firmware/" + data.model + "/" + data.fileName;
        logMessage(logData);
        sendCommand(filePath);
      }

    });

    sock.on('startbackup', function(data) {
      sock.emit('returnfrombackup', {
        message: 'done'
      });
    });

    sock.on('checkPropertiesForOne', function(data) {
      checkProperties(data, function(data) {
        sock.emit('returnProperties', data); // Handle the received results
      });
    });

    sock.on('getBlockTypes', function() {
      getBlockTypes(function(result) {
        sock.emit('gplTypes', result);
      });
    });

    sock.on('doGplImport', function(data) {
      doGplImport(data, sock);
    });

    sock.on('doRefreshSequence', function(data) {
      doRefreshSequence(data, sock);
    });

    sock.on('updateSequence', function(data) {
      doUpdateSequence(data, function(result) {
        socket.emit('sequenceUpdateMessage', result);
      });
    });

    sock.on('compileScript', function(data) {
      compileScript(data, function(response) {
        sock.emit('compiledScript', response);
      });
    });

    sock.on('updatePoint', function(data) {
      if (typeof data === 'string')
        data = JSON.parse(data);
      newUpdate(data.oldPoint, data.newPoint, {
        method: "update",
        from: "ui",
        path: (data.hasOwnProperty('path')) ? data.path : null
      }, user, function(response, point) {
        if (response.err) {
          if (response.err.code === 11000) {
            sock.emit('pointUpdated', {
              err: "Name already exists.",
              point: (point) ? point : null
            });
          } else {
            sock.emit('pointUpdated', {
              err: response.err,
              point: (point) ? point : null
            });
          }
        } else {
          sock.emit('pointUpdated', {
            message: response.message,
            point: point
          });
        }
      });
    });

    sock.on('updateSequencePoints', function(data) {
      var returnPoints = [];

      async.waterfall([
          function(callback) {
            async.mapSeries(data.adds, function(point, callback) {
              addPoint(point, user, null, function(response, updatedPoint) {
                callback(response.err, updatedPoint);
              });
            }, function(err, newPoints) {
              callback(err, returnPoints.concat(newPoints));
            });
          },

          function(returnPoints, callback) {
            async.mapSeries(data.updates, function(point, callback) {
              newUpdate(point.oldPoint, point.newPoint, {
                method: "update",
                from: "ui"
              }, user, function(response, updatedPoint) {
                callback(response.err, updatedPoint);
              });
            }, function(err, newPoints) {
              callback(err, returnPoints.concat(newPoints));
            });
          },

          function(returnPoints, callback) {
            async.mapSeries(data.deletes, function(upi, callback) {
              deletePoint(upi, "hard", user, null, function(response) {
                callback(response.err);
              });
            }, function(err, newPoints) {
              callback(err, returnPoints);
            });
          }
        ],
        function(err, returnPoints) {
          if (err) {
            sock.emit('sequencePointsUpdated', {
              err: err
            });
          } else {
            sock.emit('sequencePointsUpdated', {
              message: "success",
              points: returnPoints
            });
          }
        });
    });

    sock.on('addPoint', function(data) {
      addPoint(data.point, user, null, function(response, point) {
        if (response.err) {
          sock.emit('pointUpdated', {
            err: response.err
          });
        } else {
          sock.emit('pointUpdated', {
            message: response.msg,
            point: point
          });
        }
      });
    });

    sock.on('deletePoint', function(data) {
      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      deletePoint(data.upi, data.method, user, null, function(msg) {
        msg.reqID = data.reqID;
        sock.emit('pointUpdated', JSON.stringify(msg));
      });
    });

    sock.on('restorePoint', function(data) {
      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      restorePoint(data.upi, user, function(msg) {
        msg.reqID = data.reqID;
        sock.emit('pointUpdated', JSON.stringify(msg));
      });
    });

    sock.on('updateSchedules', function(data) {
      data.user = user;
      updateSchedules(data, function(err) {
        if (err) {
          sock.emit('scheduleUpdated', {
            err: err
          });
        } else {
          sock.emit('scheduleUpdated', {
            message: "success"
          });
        }

      });
    });

    sock.on('getScheduleEntries', function(data) {
      getScheduleEntries(data, function(err, entries) {
        sock.emit('returnEntries', {
          err: err,
          entries: entries
        });
      });
    });
  });
};
//needs socket
function sendUpdate(dynamic) {
  io.sockets.socket(dynamic.sock).emit('recieveUpdate', {
    sock: dynamic.sock,
    upi: dynamic.upi,
    dynamic: dynamic.dyn
  });
}
//needs socket or cb all dynamics. probably needs a rework to only update the recently opened displays
function getVals(common, cb) {

  var updateArray = [];

  for (var i = 0; i < openDisplays.length; i++) {
    if (openDisplays[i].display["Screen Objects"]) {
      for (var j = 0; j < openDisplays[i].display["Screen Objects"].length; j++) {
        if ((parseInt(openDisplays[i].display["Screen Objects"][j].upi, 10) !== 0 && openDisplays[i].display["Screen Objects"][j].upi !== "0") && updateArray.indexOf(openDisplays[i].display["Screen Objects"][j].upi) === -1) {
          updateArray.push(openDisplays[i].display["Screen Objects"][j].upi);
        }
      }
    }
  }

  updateArray.forEach(function(upi) {

    getInitialVals(upi, function(point) {
      if (point) {
        if (point.Value && point.Value.eValue !== undefined && point.Value.eValue !== null) {

          var pv = point.Value;

          for (var prop in pv.ValueOptions) {

            if (pv.ValueOptions[prop] === point.Value.eValue)
              point.Value.Value = prop;
          }
        }
        for (var i = 0; i < openDisplays.length; i++) {
          for (var j = 0; j < openDisplays[i].display["Screen Objects"].length; j++) {

            if (openDisplays[i].display["Screen Objects"][j].upi === point._id) {
              var dyn = {};
              if (point.Value) {

                dyn.Value = point.Value.Value;
                dyn.eValue = point.Value.eValue;
                openDisplays[i].display["Screen Objects"][j].Value = point.Value.Value;
                openDisplays[i].display["Screen Objects"][j].eValue = point.Value.eValue;
                openDisplays[i].display["Screen Objects"][j]["Quality Label"] = point["Quality Label"];
              }

              dyn["Quality Label"] = point["Quality Label"];
              dyn.Name = point.Name;
              sendUpdate({
                sock: openDisplays[i].sockId,
                upi: point._id,
                dyn: dyn
              });
              break;
            }
          }
        }

      }
    });

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

  groups = user.groups.map(function(group) {
    return group._id.toString();
  });

  if (!user["System Admin"].Value) {
    query.Security = {
      $in: groups
    };
  }

  sort.msgTime = (data.sort !== 'desc') ? -1 : 1;
  var start = new Date();
  mydb.collection(alarmsCollection).find(query).sort(sort).skip((currentPage - 1) * itemsPerPage).limit(numberItems).toArray(function(err, alarms) {
    mydb.collection(alarmsCollection).count(query, function(err, count) {
      if (err) callback(err, null, null);
      callback(err, alarms, count);
    });
  });
}

function getActiveAlarms(data, callback) {
  var currentPage, itemsPerPage, numberItems, user, groups, query, sort, alarmIds;

  if (typeof data === "string")
    data = JSON.parse(data);

  currentPage = parseInt(data.currentPage, 10);
  itemsPerPage = parseInt(data.itemsPerPage, 10);
  user = data.user;

  if (!itemsPerPage) {
    itemsPerPage = 200;
  }
  if (!currentPage || currentPage < 1) {
    currentPage = 1;
  }

  numberItems = data.hasOwnProperty('numberItems') ? parseInt(data.numberItems, 10) : itemsPerPage;

  sort = {};
  sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

  query = {
    _pStatus: 0,
    _actvAlmId: {
      $ne: BSON.ObjectID("000000000000000000000000")
    },
    $or: [{
      "Point Type.Value": "Device"
    }, {
      "Point Type.Value": "Remote Unit",
      "_relDevice": 0
    }, {
      "_relDevice": 0,
      "_relRMU": 0
    }]
  };

  groups = user.groups.map(function(group) {
    return group._id.toString();
  });

  if (!user["System Admin"].Value) {
    query.Security = {
      $in: groups
    };
  }

  if (data.pointTypes) {
    query["Point Type.eValue"] = {
      $in: data.pointTypes
    };
  }

  mydb.collection(pointsCollection).find(query, {
    _actvAlmId: 1,
    _id: 1
  }).toArray(function(err, alarms) {

    if (err) callback(err, null, null);

    alarmIds = [];
    for (var i = 0; i < alarms.length; i++) {
      if (alarms[i]._actvAlmId !== 0)
        alarmIds.push(alarms[i]._actvAlmId);
    }
    var alarmsQuery = {
      _id: {
        $in: alarmIds
      }
    };

    if (data.name1 !== undefined) {
      if (data.name1 !== null) {
        alarmsQuery.Name1 = new RegExp("^" + data.name1, 'i');
      } else {
        alarmsQuery.Name1 = "";
      }
    }
    if (data.name2 !== undefined) {
      if (data.name2 !== null) {
        alarmsQuery.Name2 = new RegExp("^" + data.name2, 'i');
      } else {
        alarmsQuery.Name2 = "";
      }
    }
    if (data.name3 !== undefined) {
      if (data.name3 !== null) {
        alarmsQuery.Name3 = new RegExp("^" + data.name3, 'i');
      } else {
        alarmsQuery.Name3 = "";
      }
    }
    if (data.name4 !== undefined) {
      if (data.name4 !== null) {
        alarmsQuery.Name4 = new RegExp("^" + data.name4, 'i');
      } else {
        alarmsQuery.Name4 = "";
      }
    }

    if (data.msgCat) {
      alarmsQuery.msgCat = {
        $in: data.msgCat
      };
    }
    if (data.almClass) {
      alarmsQuery.almClass = {
        $in: data.almClass
      };
    }
    var start = new Date();
    mydb.collection(alarmsCollection).find(alarmsQuery).skip((currentPage - 1) * itemsPerPage).limit(numberItems).sort(sort).toArray(function(err, recents) {
      mydb.collection(alarmsCollection).count(alarmsQuery, function(err, count) {

        callback(err, recents, count);
      });
    });
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

  groups = user.groups.map(function(group) {
    return group._id.toString();
  });

  if (!user["System Admin"].Value) {
    query.Security = {
      $in: groups
    };
  }

  sort.msgTime = (data.sort !== 'desc') ? -1 : 1;

  var start = new Date();
  mydb.collection("ActiveAlarms").find(query).skip((currentPage - 1) * itemsPerPage).limit(numberItems).sort(sort).toArray(function(err, alarms) {
    if (err) console.error(err);
    mydb.collection("ActiveAlarms").count(query, function(err, count) {
      if (err) console.error(err);
      callback(err, alarms, count);
    });
  });
}

function sendAcknowledge(data, callback) {
  var ids, username, time;

  ids = data.ids;
  username = data.username;
  time = Math.floor(new Date().getTime() / 1000);

  for (var j = 0; j < ids.length; j++) {
    ids[j] = BSON.ObjectID(ids[j]);
  }

  mydb.collection(alarmsCollection).update({
    _id: {
      $in: ids
    },
    ackStatus: 1
  }, {
    $set: {
      ackStatus: 2,
      ackUser: username,
      ackTime: time
    }
  }, {
    multi: true
  }, function(err, result) {
    callback(err, result);
  });
}

function updateAlarms(finalCB) {
  var alarmsStart = new Date();
  async.forEach(openAlarms,
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

function compileScript(data, callback) {
  var upi, script, fileName, filepath, re;

  re = new RegExp("\"(.*), ");

  fileName = data.upi;
  script = data.script;

  tmp.dir({
    dir: __dirname + "/../scripts/"
  }, function _tempDirCreated(err, path, cleanupCallback) {

    filepath = path + '/' + fileName + '.dsl';
    fs.writeFile(filepath, script, function(err) {

      compiler.compile(filepath, path + '/' + fileName, function(err) {

        fs.readFile(path + '/' + fileName + '.err', function(err, data) {
          if (data.length > 0)
            return callback({
              err: data.toString().replace(re, '')
            });
          return callback({
            path: path
          });
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
  mydb.collection(pointsCollection).findAndModify({
    _id: upi
  }, [], {
    $set: {
      _pStatus: 0
    }
  }, {
    new: true
  }, function(err, point) {

    if (err)
      return callback({
        err: err
      });

    logData.activity = actLogsEnums["Point Restore"].enum;
    logData.log = "Point restored";
    logData.point = point;
    mydb.collection(activityLogCollection).insert(Utils.buildActivityLog(logData), function(err, result) {
      if (point["Point Type.Value"] === "Schedule") {
        // get points based on parentupi
      } else {
        updateDependencies(point, {
          method: "restore"
        }, user, function() {
          return callback({
            message: "success"
          });
        });
      }
    });
  });
}

function updateSchedules(data, callback) {
  var oldPoints, updateScheds, newScheds, cancelScheds, hardScheds, schedule, oldPoint, flags, user, devInst, options,
    devices = [],
    signalTOD = false,
    logData;

  user = data.user;

  oldPoints = (data.oldPoints) ? data.oldPoints : [];
  updateScheds = (data.updateScheds) ? data.updateScheds : [];
  newScheds = (data.newScheds) ? data.newScheds : [];
  cancelScheds = (data.cancelScheds) ? data.cancelScheds : [];
  hardScheds = (data.hardScheds) ? data.hardScheds : [];
  schedule = (data.schedule) ? data.schedule : null;

  async.waterfall([

    function(wfCB) {
      async.forEachSeries(updateScheds, function(updateSched, feCB) {
        logData = {
          timestamp: Date.now(),
          user: user
        };
        updateObj = {
          $set: {}
        };
        for (var i = 0; i < oldPoints.length; i++) {
          if (oldPoints[i]._id === updateSched._id) {
            oldPoint = oldPoints[i];
            break;
          }
        }
        for (var prop in updateSched) {
          if (!_.isEqual(updateSched[prop], oldPoint[prop])) {
            updateObj.$set[prop] = updateSched[prop];
          }
        }

        if (updateSched["Host Schedule"].Value === true || oldPoint["Host Schedule"].Value === true) {
          signalTOD = true;
        }
        if (updateSched["Host Schedule"].Value === false || oldPoint["Host Schedule"].Value === false) {
          addToDevices(updateSched, devices, oldPoint);
        }

        if (!_.isEmpty(updateObj.$set)) {
          mydb.collection(pointsCollection).update({
            _id: updateSched._id
          }, updateObj, function(err, result) {
            if (err)
              feCB(err);

            ctrlPoint = Config.Utility.getPropertyObject("Control Point", updateSched);
            mydb.collection(pointsCollection).findOne({
              _id: ctrlPoint.Value
            }, function(err, point) {
              logData.point = point;
              logData.Security = point.Security;
              logData.activity = Config.Enums["Activity Logs"]["Schedule Entry Edit"].enum;
              logData.log = "Schedule entry edited";
              logData = Utils.buildActivityLog(logData);
              mydb.collection(activityLogCollection).insert(logData, function(err, result) {
                feCB(err);
              });
            });
          });
        } else {
          feCB(null);

        }

      }, function(err) {
        wfCB(err);
      });
    },
    function(wfCB) {
      async.forEachSeries(newScheds, function(newSched, feCB) {
        logData = {
          timestamp: Date.now(),
          user: user
        };
        if (newSched["Host Schedule"].Value === true) {
          signalTOD = true;
        } else {
          addToDevices(newSched, devices);
        }
        options = {
          from: "updateSchedules",
          schedule: schedule
        };
        addPoint(newSched, user, options, function(returnData) {
          if (returnData.err)
            feCB(returnData.err);
          if (newSched._pStatus !== 0)
            return feCB(null);

          ctrlPoint = Config.Utility.getPropertyObject("Control Point", newSched);
          mydb.collection(pointsCollection).findOne({
            _id: ctrlPoint.Value
          }, function(err, point) {
            logData.point = point;
            logData.Security = point.Security;
            logData.activity = Config.Enums["Activity Logs"]["Schedule Entry Add"].enum;
            logData.log = "Schedule entry added";
            logData = Utils.buildActivityLog(logData);
            mydb.collection(activityLogCollection).insert(logData, function(err, result) {
              feCB(err);
            });
          });
        });
      }, function(err) {
        wfCB(err);
      });
    },
    function(wfCB) {
      async.forEachSeries(cancelScheds, function(cancelSched, feCB) {
        logData = {
          timestamp: Date.now(),
          user: user
        };

        deletePoint(cancelSched._id, "hard", user, null, function(returnData) {
          if (returnData.err)
            feCB(returnData.err);
          if (cancelSched._pStatus !== 0)
            return feCB(null);
          ctrlPoint = Config.Utility.getPropertyObject("Control Point", cancelSched);
          mydb.collection(pointsCollection).findOne({
            _id: ctrlPoint.Value
          }, function(err, point) {
            logData.point = point;
            logData.Security = point.Security;
            logData.activity = Config.Enums["Activity Logs"]["Schedule Entry Delete"].enum;
            logData.log = "Schedule entry deleted";
            logData = Utils.buildActivityLog(logData);
            mydb.collection(activityLogCollection).insert(logData, function(err, result) {
              feCB(err);
            });
          });
        });
      }, function(err) {
        wfCB(err);
      });
    },
    function(wfCB) {
      async.forEachSeries(hardScheds, function(hardSched, feCB) {
        logData = {
          timestamp: Date.now(),
          user: user
        };
        options = {
          from: "updateSchedules",
          schedule: schedule
        };
        if (hardSched["Host Schedule"].Value === true) {
          signalTOD = true;
        } else {
          addToDevices(hardSched, devices);
        }

        deletePoint(hardSched._id, "hard", user, options, function(returnData) {
          if (returnData.err)
            feCB(returnData.err);
          if (hardSched._pStatus !== 0)
            return feCB(null);

          ctrlPoint = Config.Utility.getPropertyObject("Control Point", hardSched);
          mydb.collection(pointsCollection).findOne({
            _id: ctrlPoint.Value
          }, function(err, point) {
            logData.point = point;
            logData.Security = point.Security;
            logData.activity = Config.Enums["Activity Logs"]["Schedule Entry Delete"].enum;
            logData.log = "Schedule entry deleted";
            logData = Utils.buildActivityLog(logData);
            mydb.collection(activityLogCollection).insert(logData, function(err, result) {
              feCB(err);
            });
          });
        });
      }, function(err) {
        wfCB(err);
      });
    }
  ], function(err) {
    if (err)
      console.log("updateScheds err:", err);
    signalHostTOD(signalTOD, function(err) {
      if (err)
        return callback(err);
      updateDeviceToDs(devices, function(err) {
        return callback((err !== null) ? err : "success");
      });
    });
  });
}

function getScheduleEntries(data, callback) {
  var isSchedule = data.isSchedule,
    upi = data.upi;

  if (isSchedule) {
    mydb.collection(pointsCollection).find({
      "Point Type.Value": "Schedule Entry",
      _parentUpi: upi
    }).toArray(callback);
  } else {
    mydb.collection(pointsCollection).find({
      "Point Type.Value": "Schedule Entry",
      "Point Refs": {
        $elemMatch: {
          "Value": upi,
          "PropertyName": "Control Point"
        }
      }
    }).toArray(callback);
  }
}

function checkProperties(data, callback) {
  var template = Config.Templates.getTemplate(data.pointType), // Template object
    dbResult,
    skipProperties = {
      "Trend Last Status": 1,
      "Trend Last Value": 1,
    },
    skipRefProperties = {
      "Point Register": 1,
      "Display Dynamic": 1,
      "Display Animation": 1,
      "Display Trend": 1,
      "Display Button": 1,
      "Slide Display": 1
    },
    skipDeepPropertyCheck = {
      "_actvAlmId": 1,
    },
    // skipKeys is on a per-point basis
    skipKeys = {
      "Schedule Entry": {
        "Control Value": ["eValue"]
      },
      "Comparator": {
        "Input 2 Constant": ["eValue", "ValueOptions"]
      }
    };

  data.results = []; // Add some keys to data
  data.err = false;
  data.errMsg = '';

  dbResult = mydb.collection('points').find({
    'Point Type.Value': data.pointType
  }); // Get all records

  // If we found a template for the specified point type (i.e. it's a recognized point type)
  if (template !== undefined) {

    // Convert mongo cursor result to array
    dbResult.toArray(function(recsErr, recs) {

      var prop, // Work vars
        key,
        subKey,
        propName,
        propertyObject;

      // Check for operation error
      if (recsErr) {

        // TODO change summary to error. Verify viewModel looks @ error key
        data.err = true;
        data.errMsg = "INTERNAL ERROR: dbResult.toArray() failed."; // Push the 'problems found object' onto our results array
        callback(data); // Perform the callback

        return;
      }

      // Itterate through mongo result set
      for (var i = 0; i < recs.length; i++) {
        // Initialize temporary object which contains the problems found for this point (also stores identifying info)
        var tempObj = {
          _id: recs[i]._id,
          Name: recs[i].Name,
          Problems: []
        };

        // Find template properties that do not exist in the database
        for (prop in template) {
          if (skipProperties.hasOwnProperty(prop)) {
            continue; // Go to next property
          }

          // If the template property doesn't exist in the database
          if (recs[i][prop] === undefined) {
            // Log the problem
            tempObj.Problems.push("Property '" + prop + "' exists in template but not in DB.");
          }
          // Property exists in database. If the template property's value is actually an object, check the keys, i.e.
          //          point {
          //              prop_name_1: prop_value,
          //              prop_name_2: prop_value,
          //              prop_name_3: {
          //                  key_name_1: key_value,  <~~~ in the following loop we're checking for matching key names
          //                  key_name_2: key_Value        (not the key value mind you, the key name)
          //              }
          //          }
          //
          // If the prop_value is actually an object
          else if ((typeof template[prop] === 'object') && (template[prop] !== null)) {
            // The template does not define the keys for some properties because they are different for every point, so we skip 'em!
            if (skipDeepPropertyCheck.hasOwnProperty(prop)) {
              continue; // Go to next property
            } else if ((Config.Enums.Properties[prop].valueType === "Array") && (prop !== "Point Refs")) {
              continue;
            }

            // Find template property keys that do not exist in the database.
            for (key in template[prop]) {
              if (prop == "Point Refs") {
                propName = template[prop][key].PropertyName;

                if (skipRefProperties.hasOwnProperty(propName)) {
                  continue;
                } else if ((propertyObject = Config.Utility.getPropertyObject(propName, recs[i])) === null) {
                  tempObj.Problems.push("Reference property '" + propName + "' exists in template but not in DB.");
                } else {
                  for (subKey in template[prop][key]) {
                    if (propertyObject[subKey] === undefined) {
                      tempObj.Problems.push("Key '" + subKey + "' for reference property '" + propName + "' exists in template but not in DB.");
                    } else {
                      delete propertyObject[subKey]; // No problems found. Delete the subKey out of the db record so we don't re-evaluate it again
                    }
                  }
                }
              }
              // If the template key doesn't exist in the database
              else if (recs[i][prop][key] === undefined) {
                // Log the problem
                tempObj.Problems.push("Key '" + key + "' for property '" + prop + "' exists in template but not in DB.");
              } else {
                delete recs[i][prop][key]; // No problems found. Delete the key out of the db record so we don't re-evaluate it again
              }
            }
          } else {
            delete recs[i][prop]; // No problems found. Delete the property out of the db record so we don't re-evaluate it again
          }
        }

        // Find database properties that do not exist in the template
        for (prop in recs[i]) {
          if (skipProperties.hasOwnProperty(prop)) {
            continue; // Go to next property
          }

          // If the database property doesn't exist in the template
          if (template[prop] === undefined) {

            // Log the problem
            tempObj.Problems.push("Property '" + prop + "' exists in DB but not in template.");
          }
          // Property exists in template. If the database property's value is actually an object, check the keys, i.e.
          //          point {
          //              prop_name_1: prop_value,
          //              prop_name_2: prop_value,
          //              prop_name_3: {
          //                  key_name_1: key_value,  <~~~ in the following loop we're checking for matching key names
          //                  key_name_2: key_Value        (not the key value mind you, the key name)
          //              }
          //          }
          //
          // If the prop_value is actually an object
          else if ((typeof recs[i][prop] === 'object') && (recs[i][prop] !== null)) {

            // The template does not define the keys for some properties because they are different for every point, so we skip 'em!
            if (skipDeepPropertyCheck.hasOwnProperty(prop)) {
              continue; // Go to next property
            } else if ((Config.Enums.Properties[prop].valueType === "Array") && (prop !== "Point Refs")) {
              continue;
            }

            // Find database property keys that do not exist in the template.
            for (key in recs[i][prop]) {
              if (prop == "Point Refs") {
                if (_.isEmpty(recs[i][prop][key]))
                  continue;

                propName = recs[i][prop][key].PropertyName;

                if (skipRefProperties.hasOwnProperty(propName)) {
                  continue;
                } else if ((propertyObject = Config.Utility.getPropertyObject(propName, template)) === null) {
                  tempObj.Problems.push("Reference property '" + propName + "' exists in DB but not in template.");
                } else {
                  for (subKey in recs[i][prop][key]) {
                    if (propertyObject[subKey] === undefined) {
                      tempObj.Problems.push("Key '" + subKey + "' for reference property '" + propName + "' exists in template but not in DB.");
                    }
                  }
                }
              } else if (skipKeys[data.pointType] && skipKeys[data.pointType][prop] && skipKeys[data.pointType][prop].indexOf(key) !== -1)
                continue;
              // If the database key doesn't exist in the template
              else if (template[prop][key] === undefined) {
                // Log the problem
                tempObj.Problems.push("Key '" + key + "' for property '" + prop + "' exists in DB but not in template.");
              }
            }
          }
        }

        // If we found at least one problem
        if (tempObj.Problems.length !== 0) {
          data.results.push(tempObj); // Push the 'problems found object' onto our results array

          if (data.results.length >= 25) { // Limit number of reported points with problems to 25
            break; // Do not process any more points
          }
        }
      }
      callback(data); // Perform the callback
    }); // end dbResult.toArray(function ())
  }
  // Could not find point type in template
  else {

    // TODO change summary to error. Verify viewModel looks @ error key
    data.err = true;
    data.errMsg = "Error! Point type '" + data.pointType + "' was not found in the template."; // Log this error

    callback(data); // Perform the callback
  }
}