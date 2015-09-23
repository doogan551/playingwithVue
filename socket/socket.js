var Utils = require('../lib/utils.js'),
	passport = require('passport'),
	mongo = require('mongodb'),
	BSON = mongo.BSONPure,
	Config = require('../public/js/lib/config.js'),
	_ = require('lodash'),
	cppApi = new(require('Cpp_API').Tasks)(),
	monitorSender = new(require('MonitorSender').Tasks)(),
	pointsCollection = Utils.CONSTANTS("pointsCollection"),
	historyCollection = Utils.CONSTANTS("historyCollection"),
	alarmsCollection = Utils.CONSTANTS("alarmsCollection"),
	activityLogCollection = Utils.CONSTANTS("activityLogCollection"),
	async = require('async'),
	fs = require('fs'),
	net = require('net'),
	events = require('events'),
	qualityCodes = [],
	actLogsEnums = Config.Enums["Activity Logs"],
	tmp = require('tmp'),
	fs = require('fs'),
	compiler = require('../lib/scriptCompiler.js'),
	rimraf = require('rimraf'),
	controllerPriorities = [],
	eventEmitter = new events.EventEmitter(),
	oplog;

module.exports = function(opts) {
	var mydb, io, openDisplays, openAlarms, tcpServer;

	io = opts.io();
	io.set('log level', 1);
	oplog = opts.oplog();
	tcpServer = opts.tcp();
	mydb = opts.infoScanStore;

	mydb.collection("SystemInfo").findOne({
		Name: "Quality Codes"
	}, function(err, codes) {
		qualityCodes = codes.Entries;
	});

	mydb.collection("SystemInfo").findOne({
		Name: "Control Priorities"
	}, function(err, conts) {
		controllerPriorities = conts.Entries;
	});

	openDisplays = [];
	openAlarms = [];
	//tcp
	tcpServer.on('connection', function(socket) {
		console.log("connected tcpServer");
		socket.setEncoding('utf8');

		socket.on('data', function(buf) {
			var jbuf = JSON.parse(buf);

			if (jbuf.msg == 'newtod') {

				var point = jbuf.point,
					date = new Date(),
					dateString = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDay() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
					nameString = (point.name1) ? (point.name2) ? (point.name3) ? (point.name4) ? point.name1 + "_" + point.name2 + "_" + point.name3 + "_" + point.name4 : point.name1 + "_" + point.name2 + "_" + point.name3 : point.name1 + "_" + point.name2 : point.name1 : "";

				runScheduleEntry(jbuf.point, function(err) {
					err = (err) ? err : "Success";
					writeToLogs(dateString + ' -  ToD Schedule - ' + point._id + ' - ' + nameString + ' - ' + err + "\n", function(err) {
						console.log(err);
					});
				});
			} else if (jbuf.msg === 'serverup' || jbuf.msg === 'serverdown') {
				io.sockets.emit('statusUpdate', jbuf.msg);
				systemStatus = jbuf.msg;
			}
		});
		socket.on('close', function(data) {
			console.log("closing tcpServer", data);
		});
		socket.on('error', function(error) {
			console.log("error on tcpServer", error);
		});
	});
	//? probably io
	monitorSender.serverMonitor("{ \"Command Type\" : 10 }", function(err, result) {
		// only returns errors
		console.log("serverMonitor returned error");
		console.log(result);
	});
	//oplog
	oplog.on('insert', function(doc) {
		var startDate, endDate;
		if (doc.ns === 'infoscan.Alarms' || doc.ns === 'infoscan.ActiveAlarms') {
			var userHasAccess = false;

			// recent and unack
			// compare saved filter against new point
			for (var k = 0; k < openAlarms.length; k++) {

				if (openAlarms[k].alarmView === "Recent" || openAlarms[k].alarmView === "Unacknowledged" || openAlarms[k].alarmView === "Active") {

					if (compareOplogNames(openAlarms[k].data.name1, doc.o.Name1)) {
						continue;
					}
					if (compareOplogNames(openAlarms[k].data.name2, doc.o.Name2)) {
						continue;
					}
					if (compareOplogNames(openAlarms[k].data.name3, doc.o.Name3)) {
						continue;
					}
					if (compareOplogNames(openAlarms[k].data.name4, doc.o.Name4)) {
						continue;
					}

					if (openAlarms[k].data.msgCat !== undefined && openAlarms[k].data.msgCat.indexOf(doc.o.msgCat) < 0) {
						continue;
					}
					if (openAlarms[k].data.almClass !== undefined && openAlarms[k].data.almClass.indexOf(doc.o.almClass) < 0) {
						continue;
					}
					if (openAlarms[k].data.pointTypes !== undefined && openAlarms[k].data.pointTypes.indexOf(doc.o.PointType) < 0) {
						continue;
					}

					if (!checkUserAccess(openAlarms[k].data.user, doc.o.Security)) {
						continue;
					}

					// unack
					if (doc.o.ackStatus === 1 && openAlarms[k].alarmView === "Unacknowledged" && doc.ns === 'infoscan.Alarms') {
						io.sockets.socket(openAlarms[k].sockId).emit('newUnackAlarm', {
							newAlarm: doc.o,
							reqID: openAlarms[k].data.reqID
						});
					}

					//recent
					startDate = (typeof parseInt(openAlarms[k].data.startDate, 10) === "number") ? openAlarms[k].data.startDate : 0;
					endDate = (parseInt(openAlarms[k].data.endDate, 10) === 0) ? Math.ceil(new Date().getTime() / 1000) + 10000 : openAlarms[k].data.endDate;
					if (openAlarms[k].alarmView === "Recent" && doc.ns === 'infoscan.Alarms' && doc.o.msgTime >= startDate && doc.o.msgTime <= endDate) {
						io.sockets.socket(openAlarms[k].sockId).emit('newRecentAlarm', {
							newAlarm: doc.o,
							reqID: openAlarms[k].data.reqID
						});
					}

					// active
					if (openAlarms[k].alarmView === "Active" && doc.ns === 'infoscan.ActiveAlarms') {

						io.sockets.socket(openAlarms[k].sockId).emit('addingActiveAlarm', {
							newAlarm: doc.o,
							reqID: openAlarms[k].data.reqID
						});
					}
				}
			}

		}
		/* else if (doc.ns === 'infoscan.ActiveAlarms') {
					console.log('insert active', doc);
					var alarm = doc.o;
					for (var m = 0; m < openAlarms.length; m++) {
						if (openAlarms[m].alarmView === "Active" && ((openAlarms[m].pointTypes !== undefined) ? openAlarms[m].pointTypes.indexOf(alarm.PointType) > -1 : true) && checkUserAccess(openAlarms[m].data.user, alarm.Security)) {
							io.sockets.socket(openAlarms[m].sockId).emit('addingActiveAlarm', {
								newAlarm: doc.o,
								reqID: openAlarms[m].data.reqID
							});
						}
					}
				}*/
	});
	//oplog
	oplog.on('update', function(doc) {
		if (doc.ns === "infoscan.points" && doc.o.$set !== undefined) {
			var start = new Date();
			var updateArray;
			var updateValueFlag = false,
				updateReliabilityFlag = false,
				updateCurAlarmFlag = false,
				newValue = null,
				newReliability = null,
				newCurAlarm = null,
				updatePoint = {},
				fields = {
					Value: 1,
					"Alarm State": 1,
					_relDevice: 1,
					_relRMU: 1,
					_relPoint: 1,
					"Status Flags": 1,
					"Alarms Off": 1,
					"COV Enable": 1,
					"Control Pending": 1,
					"Quality Code Enable": 1,
					Reliability: 1,
					_curAlmId: 1,
					"Point Type": 1,
					_actvAlmId: 1
				};

			updateArray = [];
			async.waterfall([

					function(wfcb) {
						mydb.collection(pointsCollection).findOne({
							_id: doc.o2._id
						}, fields, function(err, point) {
							wfcb(err, point);
						});
					},

					function(point, wfcb) {
						if (doc.o.$set !== undefined && (doc.o.$set.Value !== undefined || doc.o.$set["Value.Value"] !== undefined || doc.o.$set["Value.ValueOptions"] !== undefined || doc.o.$set["Value.eValue"] !== undefined)) {


							var tempVal = _.clone(point.Value, true);
							if (point.Value && point.Value.eValue !== undefined && point.Value.eValue !== null) {
								var pv = point.Value;
								for (var prop in pv.ValueOptions) {
									if (pv.ValueOptions[prop] === point.Value.eValue)
										point.Value.Value = prop;
								}
							}
							if (point.Value.Value !== tempVal.Value) {
								updateValueFlag = true;
								newValue = point.Value;
							}
							wfcb(null, point);
						} else {
							wfcb(null, point);
						}
					},
					function(point, wfcb) {
						if (doc.o.$set._actvAlmId !== undefined) {
							doCurAlarm(point, function(err) {
								wfcb(err, point);
							});
						} else {
							wfcb(null, point);
						}
					},
					function(point, wfcb) {
						if (doc.o.$set !== undefined && (doc.o.$set.Reliability !== undefined || doc.o.$set["Reliability.eValue"] !== undefined || doc.o.$set["Reliability.Value"] !== undefined || doc.o.$set._relDevice !== undefined || doc.o.$set._relRMU !== undefined || doc.o.$set._relPoint !== undefined)) {

							updateReliability(point, function(err, point) {
								wfcb(err, point);
							});
						} else {
							wfcb(null, point);
						}
					},
					function(point, wfcb) {

						for (var i = 0; i < openDisplays.length; i++) {
							if (openDisplays[i].display["Screen Objects"]) {
								for (var j = 0; j < openDisplays[i].display["Screen Objects"].length; j++) {
									if ((openDisplays[i].display["Screen Objects"][j].isGplSocket === true || openDisplays[i].display["Screen Objects"][j]["Screen Object"] === 0 || openDisplays[i].display["Screen Objects"][j]["Screen Object"] === "0") && updateArray.indexOf(openDisplays[i].display["Screen Objects"][j].upi) === -1) {
										updateArray.push(openDisplays[i].display["Screen Objects"][j].upi);
									}
								}
							}
						}

						if (updateArray.indexOf(doc.o2._id) !== -1 && checkDynamicProperties(doc.o.$set)) {
							checkForPointTail(doc.o2._id, point, function() {
								/*if (updateValueFlag || updateReliabilityFlag) {
									updateFromTail(doc.o2._id, newValue, newReliability);
								}*/
								wfcb(null, point);
							});
						} else {
							/*if (updateValueFlag || updateReliabilityFlag) {
								updateFromTail(doc.o2._id, newValue, newReliability);
							}*/
							wfcb(null, point);
						}
					}
				],
				function(err, result) {
					if (updateValueFlag || updateReliabilityFlag /*|| updateCurAlarmFlag*/ ) {
						updateFromTail(doc.o2._id, newValue, newReliability /*, newCurAlarm*/ );
					}
					return;
				});
		} else if (doc.ns === "infoscan.Alarms") {
			if (doc.o.$set !== undefined && doc.o.$set.ackStatus === 2) {
				for (var k = 0; k < openAlarms.length; k++) {
					if (openAlarms[k].alarmView === "Unacknowledged") {
						io.sockets.socket(openAlarms[k].sockId).emit('removingUnackAlarm', {
							_id: doc.o2._id,
							ackStatus: doc.o.$set.ackStatus,
							ackUser: doc.o.$set.ackUser,
							ackTime: doc.o.$set.ackTime,
							reqID: openAlarms[k].data.reqID
						});
					}
				}
			}
		} else if (doc.ns === "infoscan.SystemInfo") {
			var name = '';
			if (doc.o.$set !== undefined && doc.o.$set.Entries !== undefined) {
				if (doc.o.$set.Entries[0].hasOwnProperty("Priority Level")) {
					name = "controlpriorities";
				} else if (doc.o.$set.Entries[0].hasOwnProperty("Quality Code")) {
					name = "qualityCodes";
				} else if (doc.o.$set.Entries[0].hasOwnProperty("Controller Name")) {
					name = "controllers";
				}

				if (name !== '') {
					io.sockets.emit('updatedSystemInfo', {
						name: name
					});
				}
			}
		}

		function updateReliability(point, callback) {
			if (point.Reliability !== undefined) {
				var tempRel = _.clone(point.Reliability, true);
				point = Config.EditChanges.applyReliability({
					point: point
				});

				if (tempRel.Value !== point.Reliability.Value) {
					updateReliabilityFlag = true;
					newReliability = point.Reliability;
				}
			}
			if (doc.o.$set._relDevice !== undefined || doc.o.$set._relRMU !== undefined) {
				doCurAlarm(point, function(err) {
					callback(err, point);
				});
			} else {
				callback(null, point);
			}
		}

		function doCurAlarm(point, callback) {
			if ((!BSON.ObjectID("000000000000000000000000").equals(point._actvAlmId)) && (point["Point Type"].Value === "Device" || (point["Point Type"].Value === "Remote Unit" && point._relDevice === 0) || (point._relDevice === 0 && point._relRMU === 0))) {
				addActiveAlarm(BSON.ObjectID(point._actvAlmId), callback);
			} else {
				removeActiveAlarm(point._id, callback);
			}
			// updateCurAlarmFlag = true;
			// newCurAlarm = point._curAlmId;
			// callback(null);

		}
	});
	//oplog
	oplog.on('delete', function(doc) {
		console.log('delete', doc);
		if (doc.ns === 'infoscan.ActiveAlarms') {
			for (var n = 0; n < openAlarms.length; n++) {
				if (openAlarms[n].alarmView === "Active") {
					io.sockets.socket(openAlarms[n].sockId).emit('removingActiveAlarm', {
						_id: doc.o._id,
						reqID: openAlarms[n].data.reqID
					});
				}
			}
		}
	});
	//oplog
	function addActiveAlarm(alarmId, callback) {
		mydb.collection(alarmsCollection).findOne({
			_id: alarmId
		}, function(err1, alarm) {
			if (alarm !== null) {
				mydb.collection('ActiveAlarms').insert(alarm, function(err2, result) {
					console.log('inserted', alarm.upi);
					callback(err1 /*|| err2*/ );
				});
			}
		});
	}
	//oplog
	function removeActiveAlarm(upi, callback) {
		mydb.collection('ActiveAlarms').remove({
			upi: upi
		}, function(err, result) {
			callback(err);
		});
	}

	//oplog
	function updateFromTail(_id, value, reliability) {
		var updateObj = {
			$set: {}
		};

		if (value !== undefined && value !== null)
			updateObj.$set["Value.Value"] = value.Value;
		if (reliability !== undefined && reliability !== null) {
			updateObj.$set["Reliability.Value"] = reliability.Value;
			updateObj.$set["Reliability.eValue"] = reliability.eValue;
		}
		/*if (curAlarm !== undefined && curAlarm !== null)
			updateObj.$set._curAlmId = BSON.ObjectID(curAlarm);*/
		mydb.collection(pointsCollection).update({
			_id: _id
		}, updateObj, function(err, result) {

		});
	}
	//oplog
	function checkDynamicProperties(obj) {
		if (obj.Value !== undefined || obj["Value.Value"] !== undefined || obj["Value.ValueOptions"] !== undefined || obj["Reliability.Value"] !== undefined || (obj.Reliability !== undefined && obj.Reliability.Value !== undefined) || obj['Alarm State.Value'] !== undefined || (obj['Alarm State'] !== undefined && obj['Alarm State'].Value !== undefined) || obj['Status Flags.Value'] !== undefined || (obj['Status Flags'] !== undefined && obj['Status Flags'].Value !== undefined) || obj['Alarms Off.Value'] !== undefined || (obj['Alarms Off'] !== undefined && obj['Alarms Off'].Value !== undefined) || obj['COV Enable.Value'] !== undefined || (obj['COV Enable'] !== undefined && obj['COV Enable'].Value !== undefined) || obj['Control Pending.Value'] !== undefined || (obj['Control Pending'] !== undefined && obj['Control Pending'].Value !== undefined) || obj['Quality Code Enable.Value'] !== undefined || (obj['Quality Code Enable'] !== undefined && obj['Quality Code Enable'].Value !== undefined)) {
			return true;
		}
		return false;
	}
	//oplog
	function compareOplogNames(queryNameSegment, alarmName) {
		/*if (queryNameSegment !== undefined)
			return true;*/
		if (!queryNameSegment)
			return false;
		if (queryNameSegment.length > 0 && alarmName.match(new RegExp("^" + queryNameSegment, 'i')) === null)
			return true;
		return false;
	}
	// is this still necessary?
	(function loop() {

		setTimeout(function() {
			if (oplog.conn.db !== undefined) {

				updateAlarms(function() {});
			} else
				loop();
		}, 10000);
	})();

	(function loop() {
		setTimeout(function() {
			autoAcknowledgeAlarms(function(result) {
				loop();
			});
		}, 300000);
	})();

	io.sockets.on('connection', function(sock) {
		var sockId, socket, user;
		socket = sock;
		sockId = sock.id;
		user = io.request.user;

		/*eventEmitter.on('statusUpdate', function(status){
			sock.broadcast.emit({statusUpdate:status});
		});*/

		sock.on('getStatus', function() {
			sock.emit('statusUpdate', systemStatus);
		});

		//this is just a call for console page to request displays
		sock.on('getDisplays', function(data) {
			sock.emit('sendDisplays', {
				data: openDisplays
			});
		});

		//sendUpdater from console page (client)
		sock.on('sendUpdate', function(dynamic) {
			sendUpdate(dynamic.dynamic);
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

			maintainAlarmViews(sock.id, "Recent", data);
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

			maintainAlarmViews(sock.id, "Unacknowledged", data);
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

			maintainAlarmViews(sock.id, "Active", data);
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
			console.log('firmwarefile', data);
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
			doUpdateSequence(data, sock);
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
			], function(err, returnPoints) {
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
			/*,
				path: (data.hasOwnProperty(path)) ? data.path : null*/
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
			if (typeof data === "string")
				data = JSON.parse(data);
			deletePoint(data.upi, data.method, user, null, function(msg) {
				msg.reqID = data.reqID;
				sock.emit('pointUpdated', JSON.stringify(msg));
			});
		});

		sock.on('restorePoint', function(data) {
			if (typeof data === "string")
				data = JSON.parse(data);
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

	//oplog
	function checkUserAccess(user, pointSecurity) {

		if (user["System Admin"].Value === true)
			return true;
		else {
			for (var i = 0; i < user.groups.length; i++) {
				if (pointSecurity.indexOf(user.groups[i]._id) !== -1)
					return true;
			}
			return false;
			// iterate over pointSecurity's groups and check if user is in any of them
			// return true, else return false when done iterating
		}
	}
	//io *
	function getBlockTypes(cb) {
		mydb.collection('points').find({
			SequenceData: {
				$exists: true
			}
		}, {
			"SequenceData.Sequence.Block": 1
		}).toArray(function(err, results) {
			var c,
				cc,
				len = results.length,
				row,
				blockType,
				blockTypes = {};

			for (c = 0; c < len; c++) {
				row = results[c].SequenceData.Sequence.Block;
				for (cc = 0; cc < row.length; cc++) {
					blockType = row[cc].data.BlockType;
					blockTypes[blockType] = blockTypes[blockType] || true;
				}
			}

			cb({
				err: err,
				types: blockTypes
			});
		});
	}
	//io *
	function doRefreshSequence(data, socket) {
		var _id = data.sequenceID;

		mydb.collection('points').update({
			_id: _id
		}, {
			$set: {
				'_pollTime': new Date().getTime()
			}
		}, function(err, updated) {
			if (err) {}
		});
	}
	//io *
	function doUpdateSequence(data, socket) {
		var name = data.sequenceName,
			sequenceData = data.sequenceData;

		// mydb.collection('points').findOne({
		//     "Name": name
		// }, {
		//     '_id': 1
		// },
		// function(err, result) {
		//     if(result) {
		//         var _id = result._id;

		//         if(!err) {
		mydb.collection('points').update({
			"Name": name
		}, {
			$set: {
				'SequenceData': sequenceData
			}
		}, function(updateErr, updateRecords) {
			if (updateErr) {
				socket.emit('sequenceUpdateMessage', 'Error: ' + updateErr.err);
			} else {
				socket.emit('sequenceUpdateMessage', 'success');
			}
		});
		//         } else {
		//             socket.emit('sequenceUpdateMessage', {
		//                 type: 'error',
		//                 message: err.err,
		//                 name: name
		//             });
		//             complete();
		//         }
		//     } else {
		//         socket.emit('sequenceUpdateMessage', {
		//             type: 'empty',
		//             message: 'empty',
		//             name: name
		//         });
		//         complete();
		//     }
		// });
	}
	//io *
	function maintainAlarmViews(socketid, view, data) {

		if (typeof data === "string")
			data = JSON.parse(data);

		for (var i = 0; i < openAlarms.length; i++) {
			if (openAlarms[i].sockId === socketid && openAlarms[i].alarmView === view) {
				openAlarms[i].data = data;
				return;
			}
		}

		openAlarms.push({
			sockId: socketid,
			alarmView: view,
			data: data
		});
	}
	//io *
	function sendUpdate(dynamic) {
		io.sockets.socket(dynamic.sock).emit('recieveUpdate', {
			sock: dynamic.sock,
			upi: dynamic.upi,
			dynamic: dynamic.dyn
		});
	}
	//io *
	function getVals() {

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
	//not used?
	function updateVals(finalCB) {
		var valsStart, updateArray, obj;

		valsStart = new Date();
		updateArray = [];

		for (var i = 0; i < openDisplays.length; i++) {
			if (openDisplays[i].display["Screen Objects"]) {
				for (var j = 0; j < openDisplays[i].display["Screen Objects"].length; j++) {
					obj = openDisplays[i].display['Screen Objects'][j];
					if ((obj.isGplSocket === true || obj["Screen Object"] === 0 || obj["Screen Object"] === "0") && updateArray.indexOf(obj.upi) === -1) {
						updateArray.push(obj.upi);
					}
				}
			}
		}

		async.forEach(updateArray, function(upi, callback) {

			getChangedVals(upi, function(point) {
				if (point) {
					if (point.Value && point.Value.eValue !== undefined && point.Value.eValue !== null) {
						var pv = point.Value;
						for (var prop in pv.ValueOptions) {
							if (pv.ValueOptions[prop] === point.Value.eValue)
								point.Value.Value = prop;
						}
					}
					for (var i = 0; i < openDisplays.length; i++) {
						if (openDisplays[i].display["Screen Objects"]) {
							for (var j = 0; j < openDisplays[i].display["Screen Objects"].length; j++) {
								if (parseInt(openDisplays[i].display["Screen Objects"][j].upi, 10) === point._id && (openDisplays[i].display["Screen Objects"][j].Value !== point.Value.Value || isRelDiff(openDisplays[i].display["Screen Objects"][j]["Quality Label"], point))) {
									openDisplays[i].display["Screen Objects"][j].Value = point.Value.Value;
									openDisplays[i].display["Screen Objects"][j].eValue = point.Value.eValue;
									openDisplays[i].display["Screen Objects"][j]["Quality Label"] = point["Quality Label"];
									sendUpdate({
										sock: openDisplays[i].sockId,
										upi: point._id,
										dyn: {
											Value: point.Value.Value,
											"Quality Label": point["Quality Label"]
										}
									});
									break;
								}
							}
						}
					}

				}

				callback(null);
			});

		}, function(err) {
			return finalCB();
		});
	}
	//oplog
	function checkForPointTail(upi, point, callback) {
		if (!point) {
			getChangedVals(upi, function(point) {
				updateValsTail(point, function() {
					callback(null);
				});
			});
		} else {
			updateValsTail(point, function() {
				callback(null);
			});
		}
	}
	//oplog
	function updateValsTail(point, finalCB) {

		if (point) {
			point = setQualityLabel(point);
			if (point.Value && point.Value.eValue !== undefined && point.Value.eValue !== null) {
				var pv = point.Value;
				for (var prop in pv.ValueOptions) {
					if (pv.ValueOptions[prop] === point.Value.eValue)
						point.Value.Value = prop;
				}
			}

			for (var i = 0; i < openDisplays.length; i++) {
				if (openDisplays[i].display["Screen Objects"]) {
					for (var j = 0; j < openDisplays[i].display["Screen Objects"].length; j++) {
						if (parseInt(openDisplays[i].display["Screen Objects"][j].upi, 10) === point._id && (openDisplays[i].display["Screen Objects"][j].Value !== point.Value.Value || isRelDiff(openDisplays[i].display["Screen Objects"][j]["Quality Label"], point))) {
							openDisplays[i].display["Screen Objects"][j].Value = point.Value.Value;
							openDisplays[i].display["Screen Objects"][j].eValue = point.Value.eValue;
							openDisplays[i].display["Screen Objects"][j]["Quality Label"] = point["Quality Label"];
							sendUpdate({
								sock: openDisplays[i].sockId,
								upi: point._id,
								dyn: {
									Value: point.Value.Value,
									eValue: point.Value.eValue,
									"Quality Label": point["Quality Label"]
								}
							});
							break;
						}
					}
				}
			}

		}

		finalCB(null);
	}
	//oplog
	function isRelDiff(dynRel, point) {
		if (dynRel !== point["Quality Label"])
			return true;
		else return false;
	}
	//io
	function getInitialVals(id, callback) {
		var fields = {
			Value: 1,
			Name: 1,
			eValue: 1,
			"Alarm State": 1,
			_relDevice: 1,
			_relRMU: 1,
			_relPoint: 1,
			"Status Flags": 1,
			"Alarms Off": 1,
			"COV Enable": 1,
			"Control Pending": 1,
			"Quality Code Enable": 1
		};

		mydb.collection(pointsCollection).findOne({
			_id: parseInt(id, 10)
		}, fields, function(err, point) {
			if (point)
				point = setQualityLabel(point);

			callback(point);
		});

	}
	//oplog
	function getChangedVals(id, callback) {
		var fields = {
			Value: 1,
			"Alarm State": 1,
			_relDevice: 1,
			_relRMU: 1,
			_relPoint: 1,
			"Status Flags": 1,
			"Alarms Off": 1,
			"COV Enable": 1,
			"Control Pending": 1,
			"Quality Code Enable": 1
		};

		mydb.collection(pointsCollection).findOne({
			_id: parseInt(id, 10)
		}, fields, function(err, point) {


			callback(point);
		});

	}
	//io & oplog *
	function setQualityLabel(point) {

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
	}
	//io *
	function getRecentAlarms(data, callback) {
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
		mydb.collection(alarmsCollection).find(query).skip((currentPage - 1) * itemsPerPage).limit(numberItems).sort(sort).toArray(function(err, alarms) {
			if (err) console.error(err);
			mydb.collection(alarmsCollection).count(query, function(err, count) {
				if (err) console.error(err);
				callback(err, alarms, count);
			});
		});
	}
	//io *
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
	//io *
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
	//io *
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
	//io *
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
	//io & loop
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
	//loop
	function autoAcknowledgeAlarms(callback) {
		var now, twentyFourHoursAgo;
		now = Math.floor(Date.now() / 1000);
		twentyFourHoursAgo = now - 86400;
		mydb.collection(alarmsCollection).update({
			msgTime: {
				$lte: twentyFourHoursAgo
			},
			ackStatus: 1
		}, {
			$set: {
				ackUser: "System",
				ackTime: now,
				ackStatus: 2
			}
		}, {
			multi: true
		}, function(err, result) {
			callback(result);
		});
	}
	//io *
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
	//newupdate
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

		mydb.collection(pointsCollection).findOne({
			_id: newPoint._id
		}, {
			_pStatus: 1,
			_id: 0
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
						activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
							log: "Point restored",
							activity: actLogsEnums["Point Restore"].enum
						})));
					} else {
						activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
							log: "Point added",
							activity: actLogsEnums["Point Add"].enum
						})));
					}
				} else if (oldPoint._pStatus === Config.Enums["Point Statuses"].Active.enum && newPoint._pStatus === Config.Enums["Point Statuses"].Inactive.enum) {
					if (flags.method === "hard") {
						activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
							log: "Point destroyed",
							activity: actLogsEnums["Point Hard Delete"].enum
						})));
					} else if (flags.method === "soft") {
						activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
							log: "Point deleted",
							activity: actLogsEnums["Point Soft Delete"].enum
						})));
					}
				}
				/*else if (newPoint.Name !== oldPoint.Name && flags.method === "rename") {
					activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {log:"Point renamed from " + oldPoint.Name + " to " + newPoint.Name, activity: actLogsEnums["Point Restore"].enum})));
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
											activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
												log: "Slide Show edited",
												activity: actLogsEnums["Slide Show Edit"].enum
											})));
										} else {
											compareArrays(newPoint[prop], oldPoint[prop], activityLogObjects);
										}
									} else if (prop === "Configure Device") {
										activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
											log: "Device configuration requested",
											activity: actLogsEnums["Device Configuration"].enum
										})));
									} else if (newPoint[prop].ValueType === Config.Enums["Value Types"].Bool.enum) {
										if (newPoint[prop].Value === true)
											activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
												log: prop + " set",
												activity: actLogsEnums["Point Property Edit"].enum
											})));
										else
											activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
												log: prop + " cleared",
												activity: actLogsEnums["Point Property Edit"].enum
											})));
									} else if (newPoint[prop].ValueType === Config.Enums["Value Types"].UniquePID.enum) {
										if (oldPoint[prop].PointInst !== null && newPoint[prop].PointInst === null)
											activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
												log: newPoint[prop].Name + " removed from " + prop,
												activity: actLogsEnums["Point Property Edit"].enum
											})));
										else if (oldPoint[prop].PointInst === null && newPoint[prop].PointInst !== null)
											activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
												log: newPoint[prop].Name + " added to " + prop,
												activity: actLogsEnums["Point Property Edit"].enum
											})));
										else
											activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
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
										activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
											log: timeMessage,
											activity: actLogsEnums["Point Property Edit"].enum
										})));
									} else {
										activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
											log: prop + " changed from " + oldVal + " to " + newVal,
											activity: actLogsEnums["Point Property Edit"].enum
										})));
									}
								} else if (prop === "Alarm Messages" || prop === "Occupancy Schedule" || prop === "Sequence Details" || prop === "Security" || prop === "Script Source File") {
									activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
										log: prop + " updated",
										activity: actLogsEnums["Point Property Edit"].enum

									})));
								} else if (prop === "Name") {
									if (newPoint[prop] !== oldPoint[prop]) {
										activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
											log: prop + " changed from " + oldPoint[prop] + " to " + newPoint[prop],
											activity: actLogsEnums["Point Property Edit"].enum
										})));
									}
									/*} else if (prop === "Value") {
										if (newPoint[prop].Value !== oldPoint[prop].Value) {
											activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
												log: prop + " changed from " + oldVal + " to " + newVal,
												activity: actLogsEnums["Point Property Edit"].enum
											})));
										}*/
								} else if (prop === "States") {
									if (!_.isEqual(newPoint[prop], oldPoint[prop])) {
										activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
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
					mydb.collection(pointsCollection).findAndModify({
						_id: newPoint._id
					}, [], {
						$set: updateObject
					}, {
						'new': true
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
						activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
							log: "Property deleted",
							activity: actLogsEnums["Point Property Edit"].enum
						})));
					} else if (newArray[i].Value !== 0 && oldArray[i].Value === 0) {
						activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
							log: "Property added",
							activity: actLogsEnums["Point Property Edit"].enum
						})));
					} else {
						activityLogObjects.push(Utils.buildActivityLog(_.merge(logData, {
							log: "Property changed",
							activity: actLogsEnums["Point Property Edit"].enum
						})));
					}
				}
			}
		}
	}
	// newudpate
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
	//newupdate
	function doActivityLogs(generateActivityLog, logs, callback) {
		if (generateActivityLog) {
			async.forEach(logs, function(log, cb) {
				mydb.collection(activityLogCollection).insert(log, function(err, response) {
					cb(err);
				});
			}, callback);
		} else {
			return callback(null);
		}

	}
	//tcp
	function writeToLogs(msg, callback) {
		fs.appendFile('./logs/activitylogs.txt', msg, function(err) {
			callback(err);
		});
	}
	//updateDependencies, deleteScheduleEntries, updateSchedules
	function updateDeviceToDs(devices, callback) {
		mydb.collection(pointsCollection).update({
			_id: {
				$in: devices
			}
		}, {
			$set: {
				_updTOD: true
			}
		}, {
			multi: true
		}, function(err, result) {
			callback(err);
		});
	}
	//updateDependencies, deleteScheduleEntries, updateSchedules
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
	//runScheduleEntry, newupdate
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
	//tcp
	function runScheduleEntry(scheduleEntry, callback) {
		// get control point
		// get props allowed based on point type value
		// if pass
		// switch on control property

		var error;

		mydb.collection(pointsCollection).findOne({
			_id: Config.Utility.getPropertyObject("Control Point", scheduleEntry).Value,
			_pStatus: 0
		}, function(err, point) {
			if (err)
				callback(err);
			else if (!point)
				callback("No point found");
			var controlProperty = scheduleEntry["Control Property"].Value;
			if (Config.Enums["Point Types"][point["Point Type"].Value].schedProps.indexOf(controlProperty) !== -1) {
				if (controlProperty === "Execute Now") {
					mydb.collection(pointsCollection).update({
						_id: point._id
					}, {
						$set: {
							"Execute Now.Value": true
						}
					}, function(err, result) {
						signalExecTOD(true, function(err, msg) {
							callback(err);
						});
					});
				} else if (["Analog Output", "Analog Value", "Binary Output", "Binary Value", "Accumulator", "MultiState Value"].indexOf(point["Point Type"].Value) !== -1 && controlProperty === "Value") {
					var control = {
						"Command Type": 7,
						"upi": point._id,
						"Controller": scheduleEntry.Controller.eValue,
						"Priority": scheduleEntry["Control Priority"].eValue,
						"Relinquish": (scheduleEntry["Active Release"].Value === true) ? 1 : 0
					};

					control.Value = (scheduleEntry["Control Value"].ValueType === 5) ? scheduleEntry["Control Value"].eValue : scheduleEntry["Control Value"].Value;

					control = JSON.stringify(control);
					cppApi.command(control, function(err, msg) {
						if (err !== 0 && err !== null) {
							error = JSON.parse(err);

							callback(error);
						} else {
							callback(null);
						}
					});
				} else {
					var oldPoint = _.cloneDeep(point);
					point[controlProperty].Value = scheduleEntry["Control Value"].Value;
					var result = Config.Update.formatPoint({
						oldPoint: oldPoint,
						point: point,
						property: controlProperty,
						refPoint: null
					});
					if (result.err)
						callback(result.err);
					else {
						newUpdate(oldPoint, point, {
							method: "update",
							from: "updateToD"
						}, {
							username: "ToD Schedule"
						}, function(response, point) {
							callback(response.err);
						});
					}
				}

			} else {
				callback(null);
			}

		});

	}
	//newudpate
	function updDownlinkNetwk(updateDownlinkNetwk, newPoint, callback) {
		if (updateDownlinkNetwk) {
			mydb.collection(pointsCollection).update({
				"Point Type.Value": "Device",
				"Uplink Port.Value": "Ethernet",
				"Downlink Network.Value": newPoint["Ethernet Network"].Value
			}, {
				$set: {
					_updPoint: true
				}
			}, function(err, result) {
				callback(err);
			});
		} else {
			callback(null);
		}
	}
	//newupdate
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
						mydb.collection(pointsCollection).update({
							_id: newPoint._id
						}, {
							$set: {
								_updPoint: true
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
	//renamePoint, deletePoint, restorePoint, updateRefs
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
			ObjectID = mongo.ObjectID,
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

		mydb.collection(pointsCollection).find({
			"Point Refs.Value": refPoint._id
		}, {
			_id: 1
		}).toArray(function(err, dependencies) {



			async.forEachSeries(dependencies, function(dependencyId, depCB) {
				mydb.collection(pointsCollection).findOne({
					_id: dependencyId._id
				}, function(err, dependency) {
					// TODO Check for errors
					async.waterfall([

						function(cb1) {
							if (dependency["Point Type"].Value === "Schedule Entry" && flags.method === "hard") {
								updateScheduleEntries(dependency, devices, null, function(todSignal) {
									signalTOD = (signalTOD | todSignal) ? true : false;
									// does deletePoint need to be called here?
									mydb.collection(pointsCollection).remove({
										_id: dependency._id
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
	//updateSchedules, io
	function addPoint(point, user, options, callback) {
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
			point["Point Instance"].Value = point._id;

			var searchQuery = {};
			var updateObj = {};

			if (!point.Security)
				point.Security = [];

			//strip activity log and then insert act msg into db

			searchQuery._id = point._id;
			delete point._id;
			updateObj = point;
			updateObj._actvAlmId = BSON.ObjectID(updateObj._actvAlmId);
			updateObj._curAlmId = BSON.ObjectID(updateObj._curAlmId);

			mydb.collection(pointsCollection).update(searchQuery, updateObj, function(err, freeName) {
				if (err)
					callback(err);
				else {
					point._id = searchQuery._id;
					logData.point._id = searchQuery._id;
					if (!!options && options.from === "updateSchedules") {
						return callback({
							msg: "success"
						}, point);
					}
					mydb.collection(activityLogCollection).insert(Utils.buildActivityLog(logData), function(err, result) {
						callback({
							msg: "success"
						}, point);
					});
				}
			});

		});
	}
	//deletepoint
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

		mydb.collection(pointsCollection).find(query).toArray(function(err, points) {
			var devices = [],
				signalTOD = false;
			async.forEachSeries(points, function(point, asyncCB) {
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
	//not used anymore?
	function renamePoint(Name, upi, user, callback) {
		var names, updateObj;

		names = Name.split("_");

		updateObj = {
			Name: Name
		};

		updateObj.name1 = (names[0] !== undefined) ? names[0] : "";
		updateObj.name2 = (names[1] !== undefined) ? names[1] : "";
		updateObj.name3 = (names[2] !== undefined) ? names[2] : "";
		updateObj.name4 = (names[3] !== undefined) ? names[3] : "";

		updateObj._name1 = (names[0] !== undefined) ? names[0].toLowerCase() : "";
		updateObj._name2 = (names[1] !== undefined) ? names[1].toLowerCase() : "";
		updateObj._name3 = (names[2] !== undefined) ? names[2].toLowerCase() : "";
		updateObj._name4 = (names[3] !== undefined) ? names[3].toLowerCase() : "";

		mydb.collection(pointsCollection).findAndModify({
			_id: parseInt(upi, 10)
		}, [], {
			$set: updateObj
		}, {
			'new': true
		}, function(err, point) {
			if (err) return callback({
				err: err
			});
			updateDependencies(point, {
				method: "rename"
			}, user, function(err) {
				if (err) return callback({
					err: err
				});
				return callback({
					message: "success"
				});
			});
		});
	}
	//updateSchedules, io, deleteScheduleEntries, updateSequencePoints
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
				mydb.collection(pointsCollection).findOne(query, function(err, point) {
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
					mydb.collection(pointsCollection).remove(query, function(err, result) {
						cb(err);
					});
				} else {
					query._pStatus = 0;
					mydb.collection(pointsCollection).findAndModify(query, sort, update, options, function(err, point) {
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
				mydb.collection('upis').findAndModify(query, sort, update, function(err, result) {
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
				mydb.collection(historyCollection).remove(query, function(err, result) {
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
				mydb.collection(activityLogCollection).insert(Utils.buildActivityLog(_logData), function(err, result) {
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
	//io *
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
	//io *
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
	//updateSchedules, updateScheduleEntries
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
	//addpoint, deletepoint
	function updateCfgRequired(point, callback) {
		if (point["Point Type"].Value === "Device") {
			point._cfgRequired = true;
			callback(null);
		} else if (Config.Utility.getPropertyObject("Device Point", point) !== null) {
			point._cfgRequired = true;
			if (Config.Utility.getPropertyObject("Device Point", point).PointInst !== 0) {
				mydb.collection(pointsCollection).update({
					_id: Config.Utility.getPropertyObject("Device Point", point).PointInst
				}, {
					$set: {
						_cfgRequired: true
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
	//io *
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

	// The 'data' object looks like this:
	// {
	//      pointType:  String,
	//      _pointType: String w/ underscores instead of spaces
	//      domElement: String
	// }

	//io *
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
};
