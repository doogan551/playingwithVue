var Utils = require('../lib/utils.js'),
	passport = require('passport'),
	mongo = require('mongodb'),
	BSON = mongo.BSONPure,
	Config = require('../public/js/lib/config.js'),
	_ = require('lodash'),
	cppApi = new(require('Cpp_API').Tasks)(),
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
	
	//? probably io


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

		async.each(updateArray, function(upi, callback) {

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


	//not used anymore?
	/*function renamePoint(Name, upi, user, callback) {
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
	}*/


};
