process.setMaxListeners(0);
var mongo = require('mongodb');
var async = require('async');
var Config = require('../public/js/lib/config.js');
var ObjectID = mongo.ObjectID;
var util = require('util');
var lodash = require('lodash');
var moment = require('moment');
var config = require('config');
var logger = require('../helpers/logger')(module);
var importconfig = require('./importconfig.js');
var utils = require('../helpers/utils');
var dbModel = require('../helpers/db');
var Utility = require('../models/utility');
var localTZ = config.get('Infoscan.location').timezone;
var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

var conn = connectionString.join('');
var xmlPath = importconfig.xmlPath;
console.log(conn, xmlPath);
var pointsCollection = "points";
var systemInfoCollection = "SystemInfo";

var processFlag = "default";
var importProcess = new importUpdate();

process.argv.forEach(function(val, index, array) {
	if (index == 2) {
		if (val == "gpl") {
			// expection a command line argument to match
			// node importapp.js gpl c:/folder1/folder2
			processFlag = "gpl";
			if (array[3] !== undefined) {
				xmlPath = array[3].toString();
			} else
				logger.info("No xml path given. Using", xmlPath);
		} else if (val === "default") {
			logger.info("Beginning default import process.");
		} else if (val === "innerloop") {
			processFlag = "innerloop";
		} else if (val === "updategpl") {
			processFlag = "updategpl";
		} else if (val === "updateHistory") {
			processFlag = "updateHistory";
		} else {
			logger.info("No args passed. Proceeding with default import process.");
		}
	}
});

if (processFlag === "gpl") {
	mongo.connect(conn, function(err, db) {
		if (err) logger.info(err);
		else doGplImport(db, xmlPath);
	});
} else if (processFlag === "innerloop") {
	logger.info("Beginning innerloop process.");
	mongo.connect(conn, function(err, db) {
		importProcess.innerLoop(db, 2000, 0);
	});
} else if (processFlag === "updategpl") {
	mongo.connect(conn, function(err, db) {
		updateGPLRefs(db, function(err) {
			// updateGPLReferences(db, function(err) {
			if (err)
				logger.info("updateGPLReferences err:", err);
			logger.info("done", err, new Date());
		});
	});
} else if (processFlag === 'updateHistory') {
	dbModel.connect(connectionString.join(''), function(err) {
		updateHistory(function(err) {
			console.log('done');
		})
	});
} else {
	mongo.connect(conn, function(err, db) {
		importProcess.start();
	});
}

function importUpdate() {
	this.start = function() {
		var self = this;
		mongo.connect(conn, function(err, db) {
			dbModel.connect(connectionString.join(''), function(err) {
				var start = new Date(),
					limit = 2000,
					skip = 0;
				logger.info("starting", new Date());
				doGplImport(db, xmlPath, function(err) {
					initImport(db, function(err) {
						updateIndexes(function(err) {
							fixUpisCollection(db, pointsCollection, function(err) {
								convertHistoryReports(db, function(err) {
									convertTotalizerReports(function(err) {
										convertScheduleEntries(db, function(err) {
											updateAllProgramPoints(db, function(err) {
												updateAllSensorPoints(db, function(err) {

													self.innerLoop(db, limit, skip);
													// logger.info('done');
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	};


	this.innerLoop = function(db, limit, skip) {
		logger.info("innerLoop");
		var count = 0;
		var criteria = {
			collection: pointsCollection,
			query: {
				_Name: {
					$exists: 0
				}
			}
		};

		Utility.iterateCursor(criteria, function(err, doc, cb) {
			// logger.info("retrieved", err);
			// logger.info("doc.id = " + doc._id);
			importPoint(db, doc, function(err) {
				count++;
				if (count % 10000 === 0) {
					logger.info(count);
				}
				cb(err);
			});
		}, function(err) {
			logger.info('innerLoop cursor done', err);
			updateGPLReferences(db, function(err) {
				fixPowerMeters(function(err, count) {
					logger.info('number of powermeters changed:', count);
					logger.info("before changeUpis", err, new Date());
					// changeUpis(function(err) {
					fixUpisCollection(db, 'new_points', function(err) {
						// updateHistory(function(err) {
						// logger.info('finished updateHistory', err);
						// cleanupDB(db, function(err) {
						if (err) {
							logger.info("updateGPLReferences err:", err);
						}
						logger.info("done", err, new Date());
						process.exit(0);
						// });
					});
					// });
					// });
				});
			});
		});

	};


	importPoint = function(db, point, cb) {

		updateNameSegments(point, function(err) {
			if (err)
				logger.info("updateNameSegments", err);
			updateSequences(point, function(err) {
				if (err)
					logger.info("updateSequences", err);
				updateTaglist(point, function(err) {
					if (err)
						logger.info('updateTaglist', err);
					updateCfgRequired(point, function(err) {
						if (err)
							logger.info("updateCfgRequired", err);
						updateOOSValue(point, function(err) {
							if (err)
								logger.info("updateOOSValue", err);
							addTrendProperties(point, function(err) {
								if (err)
									logger.info("addTrendProperties", err);
								updateScriptPoint(point, function(err) {
									if (err)
										logger.info("updateScriptPoint", err);
									/*updateProgramPoints(point, db, function(err) {
											if (err)
												logger.info("updateProgramPoints", err);*/
									updateMultiplexer(point, function(err) {
										if (err)
											logger.info("updateMultiplexer", err);
										updateGPLBlocks(point, function(err) {
											if (err)
												logger.info("updateGPLBlocks", err);
											/*updateSensorPoints(db, point, function(err) {
												if (err)
													logger.info("updateSensorPoints", err);*/
											updateReferences(db, point, function(err) {
												if (err)
													logger.info("updateReferences", err);
												// needs to be done after point refs is added to point
												utils.setupNonFieldPoints(point);

												utils.setChannelOptions(point);
												updateTimeZones(point, function(err) {
													if (err)
														logger.info("updateTimeZones", err);
													updateDevices(point, function(err) {
														if (err)
															logger.info("updateDevices", err);
														updateModels(db, point, function(err) {
															if (err)
																logger.info("updateModels", err);
															updateAlarmMessages(point, function(err) {
																if (err)
																	logger.info("updateAlarmMessages", err);
																addBroadcastPeriod(point, function(err) {
																	if (err)
																		logger.info("addBroadcastPeriod", err);
																	updateTrend(point, function(err) {
																		if (err)
																			logger.info("updateTrend", err);
																		updateAlarmRepeat(point, function(err) {
																			if (err)
																				logger.info("updateAlarmRepeat", err);
																			rearrangeProperties(point, function(err) {
																				if (err)
																					logger.info("rearrangeProperties", err);
																				updatePoint(db, point, function(err) {
																					if (err)
																						logger.info("updatePoint", err);
																					cb(null);
																				});
																			});
																		});
																	});
																});
															});
														});
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
			// });
			//});
		});
	};
}

function doOOSValue(db, skip, limit) {

	db.collection(pointsCollection).find({}, {
		"Point Type": 1,
		"Value": 1
	}).skip(skip).limit(limit).toArray(function(err, points) {
		logger.info("points returned", points.length);
		async.forEachSeries(points, function(point, callback) {
			updateOOSValue(point, function(err) {
				if (point.Value !== undefined && point.Value !== null) {
					db.collection(pointsCollection).update({
						_id: point._id
					}, {
						$set: {
							Value: point.Value
						}
					}, function(err, result) {
						callback(err);
					});
				} else {
					callback(err);
				}
			});
		}, function(err) {
			if (err)
				logger.info("points loop err:", err);
			else if (points.length < limit)
				logger.info("done", err, new Date());
			else {
				setTimeout(function() {
					doOOSValue(db, skip + limit, limit);
				}, 6000);
			}

		});
	});
}

function updatePoint(db, point, cb) {
	db.collection(pointsCollection).update({
		_id: point._id
	}, point, function(err, result) {
		cb(err);
	});
}

function addDefaultUser(db, cb) {

	db.collection('Users').find({}).toArray(function(err, users) {
		async.eachSeries(users, function(user, callback) {
			updateControllers(db, "add", user.username, function(err) {
				callback(err);
			});
		}, cb);
	});

	function updateControllers(db, op, username, callback) {
		var searchCriteria = {
			Name: "Controllers"
		};
		db.collection(systemInfoCollection).findOne(searchCriteria, function(err, controllers) {
			if (op === "add") {
				var id = 0,
					ids = [],
					maxId = 0;

				for (var a = 0; a < controllers.Entries.length; a++) {
					ids.push(controllers.Entries[a]["Controller ID"]);
					maxId = (controllers.Entries[a]["Controller ID"] > maxId) ? controllers.Entries[a]["Controller ID"] : maxId;
				}

				for (var i = 0; i < ids.length; i++) {
					if (ids[i] !== i + 1) {
						id = i + 1;

						if (ids.indexOf(id) === -1) {
							break;
						} else {
							id = 0;
						}

					}
				}

				if (id === 0)
					id = maxId + 1;
				controllers.Entries.push({
					"Controller ID": id,
					"Controller Name": username,
					"Description": username,
					isUser: true
				});
				db.collection(systemInfoCollection).update(searchCriteria, {
					$set: {
						Entries: controllers.Entries
					}
				}, function(err, result) {
					callback(err);
				});
			} else {
				for (var j = 0; j < controllers.Entries.length; j++) {
					if (controllers.Entries[j]["Controller Name"] === username) {
						controllers.Entries.splice(j, 1);
						break;
					}
				}

				db.collection(systemInfoCollection).update(searchCriteria, {
					$set: {
						Entries: controllers.Entries
					}
				}, function(err, result) {
					callback(err);
				});
			}

		});
	}
}

function setupCurAlmIds(db, callback) {
	logger.info("setupCurAlmIds");
	db.collection(pointsCollection).update({
		"Point Type.Value": {
			$nin: ["Imux"]
		},
		_curAlmId: {
			$exists: false
		}
	}, {
		$set: {
			_curAlmId: new ObjectID("000000000000000000000000")
		}
	}, {
		multi: true
	}, function(err, result) {
		callback(err);
	});
}

function setupCfgRequired(db, callback) {
	logger.info("setupCfgRequired");
	db.collection(pointsCollection).update({
		$or: [{
			"Point Type.Value": "Device"
		}, {
			"Point Refs.PropertyName": "Device Point"
		}]
	}, {
		$set: {
			_cfgRequired: true
		}
	}, {
		multi: true
	}, function(err, result) {
		callback(err);
	});
}

function createEmptyCollections(db, callback) {
	var collections = ['Alarms', 'Users', 'User Groups', 'historydata', 'upis', 'versions', 'Schedules', 'dev'];
	async.forEach(collections, function(coll, cb) {
		db.createCollection(coll, function(err, result) {
			cb(err);
		});
	}, function(err) {
		callback(err);
	});
}

function setupDevCollection(callback) {
	Utility.insert({
		collection: 'dev',
		insertObj: {
			"item": "distinct",
			"values": []
		}
	}, callback);
}

function setupReportsCollections(db, callback) {
	var canned = importconfig.cannedReports,
		templates = importconfig.reportTemplates;

	async.forEachSeries(canned, function(predefined, cb) {
		db.collection("CannedReports").insert(predefined, function(err, result) {
			cb(err);
		});
	}, function(err) {
		async.forEachSeries(templates, function(template, cb) {
			db.collection("ReportTemplates").insert(template, function(err, result) {
				cb(err);
			});
		}, function(err) {
			callback(err);
		});
	});
}

function setupSystemInfo(db, callback) {
	var pjson = require('../package.json');
	var curVersion = pjson.version;
	var timezones = importconfig.timeZones;

	db.collection(systemInfoCollection).insert(timezones, function(err, result) {
		db.collection(systemInfoCollection).update({
			Name: 'Preferences'
		}, {
			$set: {
				'Time Zone': localTZ,
				'InfoscanJS Version': curVersion
			}
		}, callback);
	});
}

function setupPointRefsArray(db, callback) {

	logger.info("setupPointRefsArray");
	db.collection(pointsCollection).update({
		"Point Type.Value": {
			$nin: ["Imux"]
		},
		"Point Refs": {
			$exists: false
		}
	}, {
		$set: {
			"Point Refs": []
		}
	}, {
		multi: true
	}, function(err, result) {
		callback(err);
	});
}

function fixPowerMeters(callback) {
	var objs = {
		DemandInUpi: {
			name3: 'W3P SUM',
			newProp: 'DemandSumUpi'
		},
		UsageInUpi: {
			name3: 'WH3P SUM',
			newProp: 'UsageSumUpi'
		},
		KVARInUpi: {
			name3: 'MVR3 SUM',
			newProp: 'KVARSumUpi'
		}
	};

	var splitName = function(meter) {
		return meter.Name.split('_');
	}

	Utility.iterateCursor({
		collection: 'PowerMeters',
		query: {}
	}, function(err, meter, cb) {
		var names = {
			name1: splitName(meter)[0],
			name2: splitName(meter)[1],
			name4: splitName(meter)[3]
		};
		async.waterfall([function(wfCb) {
			Utility.getOne({
				collection: 'points',
				query: {
					name1: names.name1,
					name2: names.name2,
					name4: names.name4,
					name3: objs.DemandInUpi.name3
				}
			}, function(err, point) {
				if (!!point) {
					var updateObj = {
						$set: {}
					};
					updateObj.$set[objs.DemandInUpi.newProp] = point._id;
					Utility.update({
						collection: 'PowerMeters',
						query: {
							_id: meter._id
						},
						updateObj: updateObj
					}, function(err, result) {
						wfCb();
					});
				} else {
					wfCb();
				}
			});
		}, function(wfCb) {
			Utility.getOne({
				collection: 'points',
				query: {
					name1: names.name1,
					name2: names.name2,
					name4: names.name4,
					name3: objs.UsageInUpi.name3
				}
			}, function(err, point) {
				if (!!point) {
					var updateObj = {
						$set: {}
					};
					updateObj.$set[objs.UsageInUpi.newProp] = point._id;
					Utility.update({
						collection: 'PowerMeters',
						query: {
							_id: meter._id
						},
						updateObj: updateObj
					}, function(err, result) {
						wfCb();
					});
				} else {
					wfCb();
				}
			});
		}, function(wfCb) {
			Utility.getOne({
				collection: 'points',
				query: {
					name1: names.name1,
					name2: names.name2,
					name4: names.name4,
					name3: objs.KVARInUpi.name3
				}
			}, function(err, point) {
				if (!!point) {
					var updateObj = {
						$set: {}
					};
					updateObj.$set[objs.KVARInUpi.newProp] = point._id;
					Utility.update({
						collection: 'PowerMeters',
						query: {
							_id: meter._id
						},
						updateObj: updateObj
					}, function(err, result) {
						wfCb();
					});
				} else {
					wfCb();
				}
			});
		}], cb)
	}, function(err, count) {
		callback(err, count);
	});
}

function changeUpis(callback) {
	// rename schedule entries
	// drop pointinst and devinst indexes
	var centralDeviceUPI = 0;
	var newPoints = 'new_points';
	var points = 'points';
	var newUpi = 0;
	var lowest = 1;
	var highestDevice = 4194302;

	var updateDependencies = function(oldId, newId, collection, cb) {
		Utility.iterateCursor({
				collection: collection,
				query: {
					$or: [{
						'Point Refs.Value': oldId
					}, {
						'Point Refs.PointInst': oldId
					}, {
						'Point Refs.DevInst': oldId
					}]
				}
			},
			function(err, dep, cb2) {
				var refs = dep['Point Refs'];
				for (var i = 0; i < refs.length; i++) {
					if (refs[i].Value === oldId) {
						// console.log('changing Value', oldId, collection);
						refs[i].Value = newId;
					}
					if (refs[i].PointInst === oldId) {
						// console.log('changing PointInst', oldId, collection);
						refs[i].PointInst = newId;
					}
					if (refs[i].DevInst === oldId) {
						// console.log('changing DevInst', oldId, collection);
						refs[i].DevInst = newId;
					}
				}
				// console.log(dep['Point Refs']);
				Utility.update({
					collection: collection,
					updateObj: dep,
					query: {
						_id: dep._id
					}
				}, cb2);
			}, cb);
	};

	var doHistory = function() {};
	Utility.getOne({
		collection: 'SystemInfo',
		query: {
			Name: 'Preferences'
		}
	}, function(err, sysinfo) {
		centralDeviceUPI = sysinfo['Central Device UPI'];
		Utility.iterateCursor({
				collection: points,
				query: {},
				sort: {
					_id: 1
				}
			}, function(err, doc, cb) {
				var oldId = doc._id;
				if (doc['Point Type'].Value === 'Device') {
					newUpi = highestDevice;
					if (doc._id === centralDeviceUPI) {
						centralDeviceUPI = newUpi;
					}
					highestDevice--;
				} else {
					newUpi = lowest;
					lowest++;
				}
				doc._newUpi = newUpi;
				doc._oldUpi = oldId;

				Utility.update({
					query: {
						_id: oldId
					},
					updateObj: doc,
					collection: points
				}, function(err, result) {
					cb();
				});
			},
			function(err, count) {
				Utility.update({
					collection: 'SystemInfo',
					query: {
						Name: 'Preferences'
					},
					updateObj: {
						$set: {
							'Central Device UPI': centralDeviceUPI
						}
					}
				}, function(err, sysinfo) {
					Utility.iterateCursor({
						collection: points,
						query: {}
					}, function(err, doc, cb) {
						doc._id = doc._newUpi;

						Utility.insert({
							collection: newPoints,
							insertObj: doc
						}, function(err) {
							cb(err);
						});
					}, function(err, count) {

						console.log('count', count);
						Utility.iterateCursor({
							collection: newPoints,
							query: {}
						}, function(err, doc, cb) {
							updateDependencies(doc._oldUpi, doc._newUpi, newPoints, function(err, count) {
								cb(err);
							});
						}, function(err, count) {
							callback(err);
						});
					});
				});
			});
	});
}

function fixUpisCollection(db, baseCollection, callback) {
	logger.info("starting fixUpisCollection");

	var _count = 0,
		indexes = [{
			index: {
				_id: 1,
				_pStatus: 1
			},
			options: {}
		}, {
			index: {
				_pStatus: 1
			},
			options: {}
		}],
		setupUpis = function(fnCB) {
			var upisCount = 4194302, //4194302
				upisArray = [];
			db.collection('upis').count({}, function(err, count) {
				if (count < upisCount) {
					db.dropCollection('upis', function(err, result) {
						if (err)
							return callback(err);
						for (var i = 1; i <= upisCount; i++) {
							upisArray.push(i);
						}
						async.forEachSeries(upisArray, function(upi, cb) {
							db.collection('upis').insert({
								_id: upi,
								_pStatus: 1
							}, function(err, result) {
								cb(err);
							});
						}, function(err) {
							return fnCB(err);
						});
					});
				} else {
					return fnCB(null);
				}
			});
		};
	setupUpis(function(err) {
		if (err)
			return callback(err);

		async.forEachSeries(indexes, function(index, indexCB) {
			db.ensureIndex('upis', index.index, index.options, function(err, IndexName) {
				logger.info(IndexName, "err:", err);
				indexCB(null);
			});
		}, function(err) {
			logger.info("done with indexing");
			db.collection('upis').update({}, {
				$set: {
					_pStatus: 1
				}
			}, {
				multi: true
			}, function(err, result) {
				if (err) callback(err);
				Utility.distinct({
					collection: 'points',
					field: '_id'
				}, function(err, results) {
					var criteria = {
						collection: 'upis',
						query: {
							_id: {
								$in: results
							}
						},
						updateObj: {
							$set: {
								_pStatus: 0
							}
						},
						options: {
							multi: true
						}
					};

					Utility.update(criteria, function(err, result) {
						if (err) logger.info("fixUpisCollection err", err);
						logger.info("finished fixUpisCollection");
						return callback(err);
					});
				});
			});
		});
	});

}

function testHistory() {
	logger.info('testing history');
	mongo.connect(conn, function(err, db) {
		convertHistoryReports(db, function(err) {
			logger.info("testHistory err", err);
		});
	});
}

function convertHistoryReports(db, callback) {
	console.log('converting history reports');
	db.collection('OldHistLogs').find({}, function(err, cursor) {
		function processPoint(err, point) {
			if (point === null) {
				callback(err);
			} else {

				var guide = importconfig.reportGuide,
					template = Config.Templates.getTemplate("Report"),
					report = lodash.merge(template, guide);

				report["Report Type"].Value = "History";
				report["Report Type"].eValue = Config.Enums["Report Types"]["History"].enum;
				report["Point Refs"] = [];
				report._pStatus = 0;
				report._id = point._id;
				report.Name = point.Name;
				//report._Name = point.Name.toLowerCase();
				delete report._Name;

				var names = report.Name.split('_'),
					index = 0;

				for (var i = 1; i <= names.length; i++) {
					report["name" + i] = names[i - 1];
					report["_name" + i] = names[i - 1].toLowerCase();
				}
				report["Report Config"].reportTitle = report.Name;

				report['Report Config'].interval.period = 'Minute';
				report['Report Config'].interval.value = Math.floor(point.Interval / 60);
				report['Report Config'].duration.selectedRange = 'Today';

				async.forEachSeries(point.upis, function(upi, cb) {
					db.collection(pointsCollection).findOne({
						_id: upi
					}, {
						Name: 1,
						Value: 1,
						"Point Type": 1,
						"Point Refs": 1,
						'Engineering Units': 1
					}, function(err, ref) {
						if (!!ref) {
							report["Report Config"].columns.push({
								"colName": ref.Name,
								"colDisplayName": ref.Name,
								"valueType": "None",
								"operator": "",
								"calculation": [],
								"canCalculate": true,
								"includeInReport": true,
								"includeInChart": true,
								"multiplier": 1,
								"precision": 5,
								"pointType": ref['Point Type'].Value,
								"units": !!ref['Engineering Units'] ? ref['Engineering Units'].Value : '',
								"canBeCharted": true,
								"yaxisGroup": "A",
								"AppIndex": ++index      // AppIndex 0 is reserved for Device Point
							});
							report["Point Refs"].push({
								"PropertyName": "Column Point",
								"PropertyEnum": 131,
								"AppIndex": index,
								"isDisplayable": true,
								"isReadOnly": false,
								"Value": ref._id,
								"PointName": "",
								"PointType": 0,
								"PointInst": 0,
								"DevInst": 0
							});
							report = Config.EditChanges.applyUniquePIDLogic({
								point: report,
								refPoint: ref
							}, index-1); // array index, not appindex
							report._actvAlmId = ObjectID("000000000000000000000000");
						}
						cb(null);

					});
				}, function(err) {
					db.collection(pointsCollection).insert(report, function(err, result) {
						cursor.nextObject(processPoint);
					});

				});
			}
		}

		cursor.nextObject(processPoint);
	});
}

function convertTotalizerReports(callback) {
	console.log('converting totalizer reports');
	var criteria = {
		collection: 'Totalizers',
		query: {}
	};
	var intervals = Config.Enums['Report Intervals'];
	Utility.iterateCursor(criteria, function(err, doc, cb) {
		var guide = importconfig.reportGuide;
		var template = Config.Templates.getTemplate("Report");
		var report = lodash.merge(template, guide);
		var refIds = [];

		report["Report Type"].Value = "Totalizer";
		report["Report Type"].eValue = Config.Enums["Report Types"]["Totalizer"].enum;
		report["Point Refs"] = [];
		report._pStatus = 0;
		report.Name = doc.Name;
		//report._Name = point.Name.toLowerCase();
		delete report._Name;

		var names = report.Name.split('_'),
			index = 0;

		for (var i = 1; i <= names.length; i++) {
			report["name" + i] = names[i - 1];
			report["_name" + i] = names[i - 1].toLowerCase();
		}
		report["Report Config"].reportTitle = report.Name;

		switch (doc['Reset Interval']) {
			case 'Year':
				report['Report Config'].interval.period = 'Month';
				report['Report Config'].interval.value = 1;
				report['Report Config'].duration.selectedRange = 'This Year';
				break;
			case 'Month':
				report['Report Config'].interval.period = 'Day';
				report['Report Config'].interval.value = 1;
				report['Report Config'].duration.selectedRange = 'This Month';
				break;
			case 'Day':
			case 'Hour':
			case 'None':
				report['Report Config'].interval.period = 'Hour';
				report['Report Config'].interval.value = 1;
				report['Report Config'].duration.selectedRange = 'Last 7 Days';
				break;
		}

		async.forEachSeries(doc.Monitors, function(monitor, cb2) {
			var monitorCriteria = {
				collection: 'points',
				query: {
					_id: monitor['Monitor upi']
				},
				fields: {
					Name: 1,
					Value: 1,
					"Point Type": 1,
					"Point Refs": 1,
					'Engineering Units': 1
				}
			};

			Utility.getOne(monitorCriteria, function(err, ref) {
				if (!!ref) {
					if (refIds.indexOf(ref._id) < 0) {
						refIds.push(ref._id);

						report["Point Refs"].push({
							"PropertyName": "Column Point",
							"PropertyEnum": 131,
							"AppIndex": ++index,   // AppIndex 0 is reserved for Device Point
							"isDisplayable": true,
							"isReadOnly": false,
							"Value": monitor['Monitor upi'],
							"PointName": "",
							"PointType": 0,
							"PointInst": 0,
							"DevInst": 0
						});
					}
					report["Report Config"].columns.push({
						"colName": ref.Name,
						"colDisplayName": ref.Name,
						"valueType": "None",
						"operator": monitor['Monitor Property'],
						"calculation": [],
						"canCalculate": true,
						"includeInReport": true,
						"includeInChart": true,
						"multiplier": 1,
						"precision": 3,
						"pointType": ref['Point Type'].Value,
						"units": !!ref['Engineering Units'] ? ref['Engineering Units'].Value : '',
						"canBeCharted": true,
						"yaxisGroup": "A",
						"AppIndex": index
					});
					report = Config.EditChanges.applyUniquePIDLogic({
						point: report,
						refPoint: ref
					}, refIds.indexOf(ref._id));
					report._actvAlmId = ObjectID("000000000000000000000000");
				}
				cb2(null);

			});
		}, function(err) {
			criteria = {
				collection: 'upis',
				query: {
					_pStatus: 1
				},
				sort: [
					['_id', 'asc']
				],
				updateObj: {
					$set: {
						_pStatus: 0
					}
				},
				options: {
					'new': true
				}
			};
			Utility.findAndModify(criteria, function(err, upiObj) {
				report._id = upiObj._id;
				Utility.insert({
					collection: pointsCollection,
					insertObj: report
				}, cb);
			});
		});
	}, function(err, count) {
		console.log('convertTotalizerReports', err, count);
		callback(err);
	});
}

function testSchedules() {
	mongo.connect(conn, function(err, db) {
		convertScheduleEntries(db, function(err) {
			logger.info("convertScheduleEntries err", err);
		});
	});
}

function convertScheduleEntries(db, callback) {
	logger.info("convertScheduleEntries");
	// get sched entry template & set pstatus to 0
	// get all schedule entries from SE collection
	// get _id from upi's collection
	// set _parentUpi to SE's _schedUPI
	// set name1 "Schedule Entry", name2 = _id
	// if _parentUpi is 0, create new scedule point with control point's value for id, name from Point Name
	// if name is 3 or fewer segments, the next available segment is "Segment", if 4 segments, last segment is "XYZ Segment"
	var scheduleEntryTemplate = Config.Templates.getTemplate("Schedule Entry");
	var scheduleTemplate = Config.Templates.getTemplate("Schedule");

	scheduleEntryTemplate._pStatus = 0;
	scheduleEntryTemplate._cfgRequired = false;
	scheduleTemplate._pStatus = 0;
	scheduleTemplate._cfgRequired = false;

	db.collection("ScheduleEntries").find({}).toArray(function(err, oldScheduleEntries) {
		logger.info("results", oldScheduleEntries.length);
		async.forEachSeries(oldScheduleEntries, function(oldScheduleEntry, forEachCallback) {
			var criteria = {
				collection: 'upis',
				query: {
					_pStatus: 1
				},
				sort: [
					['_id', 'asc']
				],
				updateObj: {
					$set: {
						_pStatus: 0
					}
				},
				options: {
					'new': true
				}
			};
			Utility.findAndModify(criteria, function(err, upiObj) {
				/*if (oldScheduleEntry["Control Value"].eValue !== undefined) {
					scheduleEntryTemplate["Control Value"].ValueOptions = refPoint.Value.ValueOptions;
				}*/
				scheduleEntryTemplate._id = upiObj._id;
				scheduleEntryTemplate._parentUpi = oldScheduleEntry._schedUpi;
				scheduleEntryTemplate.name1 = "Schedule Entry";
				scheduleEntryTemplate.name2 = scheduleEntryTemplate._id.toString();
				scheduleEntryTemplate.Name = scheduleEntryTemplate.name1 + "_" + scheduleEntryTemplate.name2;
				/*scheduleEntryTemplate._name1 = scheduleEntryTemplate.name1.toLowerCase();
				scheduleEntryTemplate._name2 = scheduleEntryTemplate.name2.toLowerCase();
				scheduleEntryTemplate._Name = scheduleEntryTemplate.Name.toLowerCase();*/

				scheduleEntryTemplate["Control Point"] = oldScheduleEntry["Control Point"];
				scheduleEntryTemplate["Host Schedule"].Value = oldScheduleEntry.hostEntry;

				for (var prop in oldScheduleEntry) {
					if (scheduleEntryTemplate.hasOwnProperty(prop) && prop !== "_id") {
						scheduleEntryTemplate[prop] = oldScheduleEntry[prop];
					}
				}

				scheduleEntryTemplate["Point Refs"] = [];

				delete scheduleEntryTemplate._Name;
				if (scheduleEntryTemplate["Control Point"].Value !== scheduleEntryTemplate._parentUpi) {
					insertScheduleEntry(db, scheduleEntryTemplate, function(err) {
						forEachCallback(err);
					});
				} else {
					console.log('not inserting SE', scheduleEntryTemplate._id);
					forEachCallback();
				}
			});
		}, function(err) {
			logger.info('convertScheduleEntries err', err);
			return callback(err);
		});
	});
}

function insertScheduleEntry(db, scheduleEntry, callback) {

	db.collection(pointsCollection).insert(scheduleEntry, function(err, result) {

		callback(err);
	});
}

function cleanupDB(db, callback) {
	db.dropCollection('points', function() {
		db.collection("new_points").update({
			_oldUpi: {
				$exists: 1
			}
		}, {
			$unset: {
				_oldUpi: 1
			}
		}, {
			multi: true
		}, function(err, result) {
			db.collection("new_points").update({
				_newUpi: {
					$exists: 1
				}
			}, {
				$unset: {
					_newUpi: 1
				}
			}, {
				multi: true
			}, function(err, result) {

				db.collection('new_points').rename('points', function() {
					db.dropCollection('ScheduleEntries', function(err) {
						if (err) {
							return callback(err);
						}
						db.dropCollection('OldHistLogs', function() {
							db.dropCollection('Totalizers', callback);
						});
					});
				});
			});
		});
	});
}

function updateGPLReferences(db, callback) {
	logger.info("starting updateGPLReferences");
	db.collection(pointsCollection).find({
		"gplLabel": {
			$exists: 1
		}
	}).toArray(function(err, gplBlocks) {
		logger.info("gplBlocks.length = " + gplBlocks.length);
		async.forEachSeries(gplBlocks, function(gplBlock, cb) {
			gplBlock.name4 = gplBlock.gplLabel;
			gplBlock.Name = gplBlock.name1 + "_" + gplBlock.name2 + "_" + gplBlock.name3 + "_" + gplBlock.name4;

			gplBlock._name4 = gplBlock.name4.toLowerCase();
			gplBlock._Name = gplBlock.Name.toLowerCase();
			delete gplBlock.gplLabel;

			db.collection(pointsCollection).update({
				_id: gplBlock._id
			}, gplBlock, function(err, result) {
				if (err)
					logger.info('updateGPLReferences1 err', err);

				db.collection(pointsCollection).find({
					"Point Refs.Value": gplBlock._id
				}, {
					"Point Refs": 1
				}).toArray(function(err, gplRefs) {
					async.forEachSeries(gplRefs, function(gplRef, cb2) {
						for (var m = 0; m < gplRef["Point Refs"].length; m++) {
							if (gplRef["Point Refs"][m].Value === gplBlock._id) {
								gplRef["Point Refs"][m].PointName = gplBlock.Name;
							}
						}
						db.collection(pointsCollection).update({
							_id: gplRef._id
						}, {
							$set: {
								"Point Refs": gplRef["Point Refs"]
							}
						}, function(err, result) {
							if (err)
								logger.info('updateGPLReferences2 err', err);
							cb2(null);
						});
					}, function(err) {
						cb(null);
					});

				});

			});
		}, function(err) {
			callback(null);
		});
	});
}

function updateGPLRefs(db, callback) {
	db.collection(pointsCollection).find({
		"Point Type.Value": "Sequence",
		"SequenceData": {
			$exists: 1
		}
	}).toArray(function(err, sequences) {
		async.forEachSeries(sequences, function(sequence, cb) {
			addReferencesToSequencePointRefs(db, sequence, function() {
				db.collection(pointsCollection).update({
					_id: sequence._id
				}, sequence, cb);
			});
		}, callback);
	});
}

function initImport(db, callback) {
	// remove name
	// remove VAV
	// model type property set isreadonly to false
	createEmptyCollections(db, function(err) {
		setupDevCollection(function(err) {
			// setupReportsCollections(db, function(err) {
			setupSystemInfo(db, function(err) {
				setupPointRefsArray(db, function(err) {
					addDefaultUser(db, function(err) {
						// setupCurAlmIds(db, function(err) {
						setupCfgRequired(db, function(err) {
							setupProgramPoints(db, function(err) {
								callback(null);
							});
						});
					});
					// });
				});
			});
		});
		// });
	});

}

function updateIndexes(callback) {
	var indexes = [{
		index: {
			name1: 1,
			name2: 1,
			name3: 1,
			name4: 1
		},
		options: {
			name: "name1-4"
		},
		collection: pointsCollection
	}, {
		index: {
			_name1: 1,
			_name2: 1,
			_name3: 1,
			_name4: 1
		},
		options: {
			name: "_name1-4"
		},
		collection: pointsCollection
	}, {
		index: {
			Name: 1
		},
		options: {
			unique: true
		},
		collection: pointsCollection
	}, {
		index: {
			_pStatus: 1
		},
		options: {},
		collection: pointsCollection
	}, {
		index: {
			"Point Refs.Value": 1
		},
		options: {},
		collection: pointsCollection
	}, {
		index: {
			"Point Refs.DevInst": 1
		},
		options: {},
		collection: pointsCollection
	}, {
		index: {
			"Point Refs.PointInst": 1
		},
		options: {},
		collection: pointsCollection
	}, {
		index: {
			"Point Refs.PropertyName": 1
		},
		options: {},
		collection: pointsCollection
	}, {
		index: {
			"Point Refs.PropertyEnum": 1
		},
		options: {},
		collection: pointsCollection
	}, {
		index: {
			"Point Refs.PointInst": 1,
			"Point Refs.PropertyEnum": 1
		},
		options: {},
		collection: pointsCollection
	}, {
		index: {
			"Point Type.Value": 1,
			"name1": 1,
			"name2": 1,
			"name3": 1,
			"name4": 1
		},
		options: {
			name: "Pt, name1-4"
		},
		collection: pointsCollection
	}, {
		index: {
			"Point Type.Value": 1,
			"Network Segment.Value": 1
		},
		options: {},
		collection: pointsCollection
	}, {
		index: {
			"Point Type.Value": 1,
			_name1: 1,
			_name2: 1,
			_name3: 1,
			_name4: 1
		},
		options: {
			name: "PT, _name1-4"
		},
		collection: pointsCollection
	}, {
		index: {
			name1: 1,
			name2: 1,
			name3: 1,
			name4: 1
		},
		options: {
			name: "name1-4"
		},
		collection: "new_points"
	}, {
		index: {
			_name1: 1,
			_name2: 1,
			_name3: 1,
			_name4: 1
		},
		options: {
			name: "_name1-4"
		},
		collection: "new_points"
	}, {
		index: {
			Name: 1
		},
		options: {
			unique: true
		},
		collection: "new_points"
	}, {
		index: {
			_pStatus: 1
		},
		options: {},
		collection: "new_points"
	}, {
		index: {
			"Point Refs.Value": 1
		},
		options: {},
		collection: "new_points"
	}, {
		index: {
			"Point Refs.DevInst": 1
		},
		options: {},
		collection: "new_points"
	}, {
		index: {
			"Point Refs.PointInst": 1
		},
		options: {},
		collection: "new_points"
	}, {
		index: {
			"Point Refs.PropertyName": 1
		},
		options: {},
		collection: "new_points"
	}, {
		index: {
			"Point Refs.PropertyEnum": 1
		},
		options: {},
		collection: "new_points"
	}, {
		index: {
			"Point Refs.PointInst": 1,
			"Point Refs.PropertyEnum": 1
		},
		options: {},
		collection: "new_points"
	}, {
		index: {
			"Point Type.Value": 1,
			"name1": 1,
			"name2": 1,
			"name3": 1,
			"name4": 1
		},
		options: {
			name: "Pt, name1-4"
		},
		collection: "new_points"
	}, {
		index: {
			"Point Type.Value": 1,
			"Network Segment.Value": 1
		},
		options: {},
		collection: "new_points"
	}, {
		index: {
			"Point Type.Value": 1,
			_name1: 1,
			_name2: 1,
			_name3: 1,
			_name4: 1
		},
		options: {
			name: "PT, _name1-4"
		},
		collection: "new_points"
	}, {
		index: {
			"msgTime": 1
		},
		options: {},
		collection: "Alarms"
	}, {
		index: {
			"msgCat": 1
		},
		options: {},
		collection: "Alarms"
	}, {
		index: {
			"almClass": 1
		},
		options: {},
		collection: "Alarms"
	}, {
		index: {
			"Name1": 1
		},
		options: {},
		collection: "Alarms"
	}, {
		index: {
			"Name2": 1
		},
		options: {},
		collection: "Alarms"
	}, {
		index: {
			"Name3": 1
		},
		options: {},
		collection: "Alarms"
	}, {
		index: {
			"Name4": 1
		},
		options: {},
		collection: "Alarms"
	}, {
		index: {
			"ackStatus": 1,
			"msgTime": 1
		},
		options: {},
		collection: "Alarms"
	}, {
		index: {
			"Users": 1
		},
		options: {},
		collection: "User Groups"
	}, {
		index: {
			username: 1
		},
		options: {
			unique: true
		},
		collection: "Users"
	}, {
		index: {
			"upi": 1
		},
		options: {},
		collection: "historydata"
	}, {
		index: {
			"timestamp": -1
		},
		options: {},
		collection: "historydata"
	}, {
		index: {
			"upi": 1,
			"timestamp": 1
		},
		options: {
			unique: true
		},
		collection: "historydata"
	}];

	async.forEachSeries(indexes, function(index, indexCB) {
		Utility.ensureIndex({
			collection: index.collection,
			index: index.index,
			options: index.options
		}, function(err, IndexName) {
			logger.info(IndexName, "err:", err);
			indexCB(null);
		});
	}, function(err) {
		logger.info("done with indexes");
		callback(err);
	});
}

function updateMultiplexer(point, callback) {
	if (point['Point Type'].Value === 'Multiplexer') {
		point['Select State'].eValue = 1;
		point['Select State'].Value = 'On';
	}
	return callback(null);
}

function updateGPLBlocks(point, callback) {
	var parentUpi = point._parentUpi;
	var pointTypes = ["Alarm Status", "Analog Selector", "Average", "Binary Selector", "Comparator", "Delay", "Digital Logic", "Economizer", "Enthalpy", "Logic", "Math", "Multiplexer", "Proportional", "Ramp", "Select Value", "Setpoint Adjust", "Totalizer"];
	if (pointTypes.indexOf(point["Point Type"].Value) !== -1) {

		for (var prop in point) {
			if (point[prop].ValueType == 8) {
				if (parentUpi !== 0)
					point[prop].isReadOnly = true;
				else
					point[prop].isReadOnly = false;
			}
		}

		if (point['Shutdown Point'].Value === 0) {
			point['Shutdown Control'].Value = true;
		}

		switch (point["Point Type"].Value) {
			case 'Proportional':
			case 'Binary Selector':
			case 'Analog Selector':
				point['Setpoint Value'].isReadOnly = (parentUpi !== 0) ? true : false;
				break;
			case 'Math':
			case 'Multiplexer':
				point['Input 1 Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
				point['Input 2 Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
				break;
			case 'Delay':
				point['Trigger Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
				break;
			case 'Comparator':
				point['Input 2 Constant'].isReadOnly = (parentUpi !== 0) ? true : false;
				break;
			case 'Totalizer':
				point['Reset Time'].Value *= 60;
				break;
		}

		/*point.name4 = point.gplNameSegment;
		point.Name = point.name1 + "_" + point.name2 + "_" + point.name3 + "_" + point.name4;
		point._name4 = point.name4.toLowerCase();
		point._Name = point.Name.toLowerCase();
		delete point.gplNameSegment;*/

		/*db.collection(pointsCollection).update({
			_id: point._id
		}, point, function(err, result) {*/

		callback(null);
		// });
	} else {
		callback(null);
	}
}

function updateTimeZones(point, cb) {
	if (!point.hasOwnProperty("Time Zone") && point['Point Type'].Value === 'Device') {
		var timezones = Config.Enums['Time Zones'];

		point['Time Zone'] = Config.Templates.getTemplate("Device")["Time Zone"];
		point['Time Zone'].eValue = localTZ;

		for (var prop in timezones) {
			if (timezones[prop].enum === localTZ) {
				point['Time Zone'].Value = prop;
			}
		}
	}
	cb(null);
}

/**
 * Subfunction ran by devModelLogic that updates the db.
 *
 * @class updateModels
 * @constructor
 * @param {String} value the string name of the point type
 * @param {String} model the shortened name of the point type used to associate with the function in Config.js
 * @param {Object} db the db connection being passed in.
 * @param {Function} callback the callback function.
 * @return {String} console messages. "inside 4" is the final message.
 */
function updateModels(db, point, cb) {
	Config.Utility.updDevModel({
		point: point
	});
	cb();
}

function updateCfgRequired(point, callback) {
	if (["Schedule", "Schedule Entry"].indexOf(point["Point Type"].Value) > -1) {
		point._cfgRequired = false;
	}
	callback(null);
}

function findRefs(db, callback) {
	logger.info("findRefs");
	db.collection(pointsCollection).find({}).toArray(function(err, points) {
		logger.info("Points returned", points.length);
		for (i = 0; i < points.length; i++) {
			upi = points[i]._id;

			for (j = 0; j < points.length; j++) {

				if (points[j]["Alarm Adjust Point"] && points[j]["Alarm Adjust Point"].Value === upi)
					points[j]["Alarm Adjust Point"].PointInst = upi;
				if (points[j]["Alarm Display Point"] && points[j]["Alarm Display Point"].Value === upi)
					points[j]["Alarm Display Point"].PointInst = upi;
				if (points[j]["Control Point"] && points[j]["Control Point"].Value === upi)
					points[j]["Control Point"].PointInst = upi;
				if (points[j]["Device Point"] && points[j]["Device Point"].Value === upi)
					points[j]["Device Point"].PointInst = upi;
				if (points[j]["Dry Bulb Point"] && points[j]["Dry Bulb Point"].Value === upi)
					points[j]["Dry Bulb Point"].PointInst = upi;
				if (points[j]["Feedback Point"] && points[j]["Feedback Point"].Value === upi)
					points[j]["Feedback Point"].PointInst = upi;
				if (points[j]["Humidity Point"] && points[j]["Humidity Point"].Value === upi)
					points[j]["Humidity Point"].PointInst = upi;
				if (points[j]["Input Point 1"] && points[j]["Input Point 1"].Value === upi)
					points[j]["Input Point 1"].PointInst = upi;
				if (points[j]["Input Point 2"] && points[j]["Input Point 2"].Value === upi)
					points[j]["Input Point 2"].PointInst = upi;
				if (points[j]["Input Point 3"] && points[j]["Input Point 3"].Value === upi)
					points[j]["Input Point 3"].PointInst = upi;
				if (points[j]["Input Point 4"] && points[j]["Input Point 4"].Value === upi)
					points[j]["Input Point 4"].PointInst = upi;
				if (points[j]["Input Point 5"] && points[j]["Input Point 5"].Value === upi)
					points[j]["Input Point 5"].PointInst = upi;
				if (points[j]["Interlock Point"] && points[j]["Interlock Point"].Value === upi)
					points[j]["Interlock Point"].PointInst = upi;
				if (points[j]["Mixed Air Point"] && points[j]["Mixed Air Point"].Value === upi)
					points[j]["Mixed Air Point"].PointInst = upi;
				if (points[j]["Monitor Point"] && points[j]["Monitor Point"].Value === upi)
					points[j]["Monitor Point"].PointInst = upi;
				if (points[j]["Outside Air Point"] && points[j]["Outside Air Point"].Value === upi)
					points[j]["Outside Air Point"].PointInst = upi;
				if (points[j]["Remote Unit Point"] && points[j]["Remote Unit Point"].Value === upi)
					points[j]["Remote Unit Point"].PointInst = upi;
				if (points[j]["Return Air Point"] && points[j]["Return Air Point"].Value === upi)
					points[j]["Return Air Point"].PointInst = upi;
				if (points[j]["Select Input Point"] && points[j]["Select Input"].Value === upi)
					points[j]["Select Input"].PointInst = upi;
				if (points[j]["Setpoint Input"] && points[j]["Setpoint Input"].Value === upi)
					points[j]["Setpoint Input"].PointInst = upi;
				if (points[j]["Shutdown Point"] && points[j]["Shutdown Point"].Value === upi)
					points[j]["Shutdown Point"].PointInst = upi;
				if (points[j]["Sensor Point"] && points[j]["Sensor Point"].Value === upi)
					points[j]["Sensor Point"].PointInst = upi;
				if (points[j]["Trigger Point"] && points[j]["Trigger Point"].Value === upi)
					points[j]["Trigger Point"].PointInst = upi;

			}
		}

		async.forEach(points, function(ref, refCB) {
			db.collection(pointsCollection).update({
				_id: ref._id
			}, ref, function(err, result) {
				refCB(err);
			});
		}, function(err) {
			logger.info("done with db update");
			callback(err);
		});
	});
}

function updateOOSValue(point, callback) {
	var pointTemplate = Config.Templates.getTemplate(point["Point Type"].Value);
	//logger.info(point["Point Type"].Value, pointTemplate["Point Type"].Value);
	if (pointTemplate.Value !== undefined && pointTemplate.Value.oosValue !== undefined)
		point.Value.oosValue = (point.Value.eValue !== undefined) ? point.Value.eValue : point.Value.Value;
	callback(null);
}

function addTrendProperties(point, callback) {
	var pt = point['Point Type'].Value;
	if (pt === 'Optimum Start') {
		point['Trend Enable'] = Config.Templates.getTemplate(pt)['Trend Enable'];
		point['Trend Interval'] = Config.Templates.getTemplate(pt)['Trend Interval'];
		point['Trend Last Status'] = Config.Templates.getTemplate(pt)['Trend Last Status'];
		point['Trend Last Value'] = Config.Templates.getTemplate(pt)['Trend Last Value'];
		point['Trend Samples'] = Config.Templates.getTemplate(pt)['Trend Samples'];
	}
	callback(null);
}

function updateScriptPoint(point, callback) {
	if (point["Point Type"].Value === "Script") {
		point._cfgRequired = false;
		if (!point.hasOwnProperty("Development Source File")) {
			point["Development Source File"] = "";
		}
		delete point["Script Filename"];
	}
	callback(null);
}

function updateSensorPoints(db, point, callback) {

	if (point["Point Type"].Value === "Sensor") {

		var sensorTemplate = Config.Templates.getTemplate(point["Point Type"].Value),
			updateProps = function() {
				for (var prop in sensorTemplate) {
					if (!point.hasOwnProperty(prop) || prop === "Point Refs") {
						point[prop] = sensorTemplate[prop];
					}
				}
			};

		point._cfgRequired = false;

		if (!!point.Remarks) {
			point.name1 = "Sensor";
			point.name2 = "";
			point.name3 = "";
			point.name4 = "";

			for (var i = 0; i < point.Remarks.Value.length; i++) {
				if (Config.Utility.isPointNameCharacterLegal(point.Remarks.Value[i])) {
					point.name2 += point.Remarks.Value[i];
				}
			}
			point.Name = point.name1 + "_" + point.name2;
			delete point.Remarks;
			updateNameSegments(point, function(err) {
				db.collection(pointsCollection).find({
					_name1: point._name1,
					_name2: point._name2
				}, {
					_name1: 1,
					_name2: 1,
					_name3: 1,
					_name4: 1
				}).toArray(function(err, points) {
					var nextNum = 1,
						name3Number;
					for (var j = 0; j < points.length; j++) {
						name3Number = parseInt(points[j]._name3, 10);
						if (nextNum < name3Number)
							nextNum = name3Number + 1;
					}
					if (nextNum > 1) {
						point.name3 = nextNum.toString();
						point.Name += "_" + point.name3;
					}
					updateNameSegments(point, function(err) {
						delete point._Name;
						updateProps();
						db.collection(pointsCollection).update({
							_id: point._id
						}, point, function(err, result) {

							callback(err);

						});
					});
				});

			});
		} else {
			updateProps();
			db.collection(pointsCollection).update({
				_id: point._id
			}, point, function(err, result) {

				callback(err);

			});
		}

	} else {
		callback(null);
	}

}

function formatPoints(limit, skip, db, formatCB) {
	logger.info("formatPoints");
	var properties = [];
	count = 0;
	db.collection(pointsCollection).findOne({}, {}, {
		limit: limit,
		skip: skip
	}, function(err, point) {
		if (!point) {
			formatCB(null);
			return;
		}

		for (var key in point) {
			properties.push(key);
		}
		async.waterfall([

			function(nextWF) {
				async.map(properties, function(property, callback) {

					if (point[property] !== undefined && point[property].ValueType === 8 && point[property].Value !== 0) {

						db.collection(pointsCollection).findOne({
							_id: point[property].Value
						}, function(err, refPoint) {

							returnObj = {};
							returnObj[property] = (refPoint) ? refPoint : null;
							callback(null, returnObj);
						});
					} else {
						returnObj = {};
						returnObj[property] = null;
						callback(null, returnObj);
					}
				}, function(err, results) {
					async.forEachSeries(results, function(result, fesCB) {

						for (var prop in result) {
							data = {};

							data.point = point;
							data.refPoint = result[prop];
							data.property = prop;

							if (point[prop].PointType !== 143)
								point = Config.Update.formatPoint(data);
						}
						fesCB(null);
					}, function(err) {
						nextWF(err, point);
					});


				});
			},
			function(point, nextWF) {

				db.collection(pointsCollection).update({
					_id: point._id
				}, point, function(err, updateRes) {

					nextWF(err);
				});
			}
		], function(err) {

			formatPoints(limit, skip + 1, db, function(err) {
				formatCB(null);
			});
		});

	});
}

function updateProgramPoints(point, db, callback) {
	if (point["Point Type"].Value === "Script") {

		db.collection(pointsCollection).update({
			"Point Type.Value": "Program",
			$or: [{
				"Script Point.Value": point._id
			}, {
				"Point Refs": {
					$elemMatch: {
						Value: point._id,
						PropertyEnum: 270
					}
				}
			}]
		}, {
			$set: {
				"Boolean Register Names": point["Boolean Register Names"],
				"Integer Register Names": point["Integer Register Names"],
				"Point Register Names": point["Point Register Names"],
				"Real Register Names": point["Real Register Names"]
			}
		}, {
			multi: true
		}, function(err, result) {

			callback(err);
		});
	} else {
		callback(null);
	}
}

function addReferencesToSlideShowPointRefs(db, point, cb) {
	var referencedSlides = point.Slides,
		upiList = [],
		c,
		pRefAppIndex = 1, // skipping 0 for "Device Point"
		matchUpisToPointRefs = function() {
			var setPointRefIndex = function(slides) {
				var slide,
					pRef;

				if (!!slides) {
					for (c = 0; c < slides.length; c++) {
						slide = slides[c];
						if (!!slide.display) {
							pRef = point["Point Refs"].filter(function(pointRef) {
								return pointRef.Value === slide.display && pointRef.PropertyName === "Slide Display";
							});

							pRef = (!!pRef && pRef.length > 0 ? pRef[0] : null);

							if (!!pRef) {
								slide.pointRefIndex = pRef.AppIndex;
								// delete slide.display; // TODO to clear out duplicate data (point ref contains the UPI)
							}
						}
					}
				}
			};

			setPointRefIndex(referencedSlides);
			cb();
		},
		makePointRef = function(refPoint) {
			var pointType = refPoint["Point Type"].Value,
				baseRef = {
					"PropertyName": "Slide Display",
					"PropertyEnum": Config.Enums.Properties["Slide Display"].enum,
					"Value": refPoint._id,
					"AppIndex": pRefAppIndex++,
					"isDisplayable": true,
					"isReadOnly": false,
					"PointName": refPoint.Name,
					"PointInst": (refPoint._pStatus !== 2) ? refPoint._id : 0,
					"DevInst": (Config.Utility.getPropertyObject("Device Point", refPoint) !== null) ? Config.Utility.getPropertyObject("Device Point", refPoint).Value : 0,
					"PointType": Config.Enums['Point Types'][pointType].enum || 0
				};

			return baseRef;
		},
		setPointData = function() {
			var pushPointObjectsUPIs = function(slides) {
				var slide;

				if (!!slides) {
					for (c = 0; c < slides.length; c++) {
						slide = slides[c];

						if (!!slide.display && slide.display > 0) {
							if (upiList.indexOf(slide.display) === -1) {
								upiList.push(slide.display);
							}
						}
					}
				}
			};

			pushPointObjectsUPIs(referencedSlides);

			if (!!upiList && upiList.length > 0) {
				db.collection(pointsCollection).find({
					_id: {
						$in: upiList
					}
				}).toArray(function(err, points) {
					var referencedPoint;
					if (!!points) {
						for (c = 0; c < points.length; c++) {
							referencedPoint = points[c];
							point["Point Refs"].push(makePointRef(referencedPoint));
						}
					}
					matchUpisToPointRefs();
				});
			} else {
				cb();
			}
		};

	setPointData();
}

function addReferencesToDisplayPointRefs(db, point, cb) {
	var screenObjectsCollection = point["Screen Objects"],
		upiList = [],
		upiCrossRef = [],
		c,
		pRefAppIndex = 0,
		getScreenObjectType = function(screenObjectType) {
			var propEnum = 0,
				propName = "";

			switch (screenObjectType) {
				case 0:
					propEnum = Config.Enums.Properties["Display Dynamic"].enum;
					propName = "Display Dynamic";
					break;
				case 1:
					propEnum = Config.Enums.Properties["Display Button"].enum;
					propName = "Display Button";
					break;
				case 3:
					propEnum = Config.Enums.Properties["Display Animation"].enum;
					propName = "Display Animation";
					break;
				case 7:
					propEnum = Config.Enums.Properties["Display Trend"].enum;
					propName = "Display Trend";
					break;
				default:
					propEnum = 0;
					propName = "";
					break;
			}

			return {
				name: propName,
				enum: propEnum
			};
		},
		getCrossRefByUPIandName = function(upi, propertyName) {
			return upiCrossRef.filter(function(ref) {
				return ref.upi === upi && ref.PropertyName === propertyName;
			});
		},
		getCrossRefByUPI = function(upi) {
			return upiCrossRef.filter(function(ref) {
				return ref.upi === upi;
			});
		},
		matchUpisToPointRefs = function() {
			var setPointRefIndex = function(screenObjects) {
				var screenObject,
					prop,
					pRef;

				if (!!screenObjects) {
					for (c = 0; c < screenObjects.length; c++) {
						screenObject = screenObjects[c];
						if (!!screenObject.upi) {
							prop = getScreenObjectType(screenObject["Screen Object"]);
							pRef = point["Point Refs"].filter(function(pointRef) {
								return pointRef.Value === screenObject.upi && pointRef.PropertyName === prop.name;
							});

							pRef = (!!pRef && pRef.length > 0 ? pRef[0] : null);

							if (!!pRef) {
								screenObject.pointRefIndex = pRef.AppIndex;
								// delete screenObject.upi; // TODO to clear out duplicate data (point ref contains the UPI)
							}
						}
					}
				}
			};

			setPointRefIndex(screenObjectsCollection);
			cb();
		},
		makePointRef = function(refPoint, propName, propType) {
			var pointType = refPoint["Point Type"].Value,
				//pointRef.DevInst =
				baseRef = {
					"PropertyName": propName,
					"PropertyEnum": propType,
					"Value": refPoint._id,
					"AppIndex": pRefAppIndex++,
					"isDisplayable": true,
					"isReadOnly": false,
					"PointName": refPoint.Name,
					"PointInst": (refPoint._pStatus !== 2) ? refPoint._id : 0,
					"DevInst": (Config.Utility.getPropertyObject("Device Point", refPoint) !== null) ? Config.Utility.getPropertyObject("Device Point", refPoint).Value : 0,
					"PointType": Config.Enums['Point Types'][pointType].enum || 0
				};

			return baseRef;
		},
		setDisplayPointData = function() {
			var pushScreenObjectsUPIs = function(screenObjects) {
				var screenObject,
					prop;

				if (!!screenObjects) {
					for (c = 0; c < screenObjects.length; c++) {
						screenObject = screenObjects[c];
						prop = getScreenObjectType(screenObject["Screen Object"]);

						if (!!screenObject.upi && screenObject.upi > 0) {
							if (upiList.indexOf(screenObject.upi) === -1) {
								upiList.push(screenObject.upi);
							}

							if (getCrossRefByUPIandName(screenObject.upi, prop.name).length === 0) {
								upiCrossRef.push({
									upi: screenObject.upi,
									name: prop.name,
									type: prop.enum
								});
							}
						}
					}
				}
			};

			pushScreenObjectsUPIs(screenObjectsCollection);

			if (!!upiList && upiList.length > 0) {
				db.collection(pointsCollection).find({
					_id: {
						$in: upiList
					}
				}).toArray(function(err, points) {
					var referencedPoint,
						neededRefs,
						i;
					if (!!points) {
						for (c = 0; c < points.length; c++) {
							referencedPoint = points[c];
							neededRefs = getCrossRefByUPI(referencedPoint._id); // all types of screen objects
							for (i = 0; i < neededRefs.length; i++) {
								point["Point Refs"].push(makePointRef(referencedPoint, neededRefs[i].name, neededRefs[i].enum));
							}
						}
					}
					matchUpisToPointRefs();
				});
			} else {
				cb();
			}
		};

	setDisplayPointData();
}

function addReferencesToSequencePointRefs(db, point, cb) {
	var blocks = point.SequenceData && point.SequenceData.sequence && point.SequenceData.sequence.block,
		dynamics = point.SequenceData && point.SequenceData.sequence && point.SequenceData.sequence.dynamic,
		upiList = [],
		upiCrossRef = [],
		skipTypes = ['Constant'],
		c,
		pRefAppIndex = 1,
		getCrossRefByUPIandName = function(upi, propertyName) {
			return upiCrossRef.filter(function(ref) {
				return ref.upi === upi && ref.PropertyName === propertyName;
			});
		},
		getCrossRefByUPI = function(upi) {
			return upiCrossRef.filter(function(ref) {
				return ref.upi === upi;
			});
		},
		matchUpisToPointRefs = function() {
			var setPointRefIndex = function(gplObjects, propertyName) {
				var gplObject,
					pRef;

				if (!!gplObjects) {
					for (c = 0; c < gplObjects.length; c++) {
						gplObject = gplObjects[c];
						if (gplObject.upi && skipTypes.indexOf(gplObject.blockType) === -1) {
							if (!!gplObject.upi) {
								pRef = point["Point Refs"].filter(function(pointRef) {
									return pointRef.Value === gplObject.upi && pointRef.PropertyName === propertyName;
								});

								pRef = (!!pRef && pRef.length > 0 ? pRef[0] : null);

								if (!!pRef) {
									gplObject.pointRefIndex = pRef.AppIndex;
									// delete gplObject.upi; // TODO to clear out duplicate data (point ref contains the UPI)
								}
							}
						}
					}
				}
			};

			setPointRefIndex(blocks, "GPLBlock");
			setPointRefIndex(dynamics, "GPLDynamic");
			cb();
		},
		makePointRef = function(refPoint, propName, propType) {
			var pointType = refPoint["Point Type"].Value;
			var baseRef = {
				"PropertyName": propName,
				"PropertyEnum": propType,
				"Value": refPoint._id,
				"AppIndex": pRefAppIndex++,
				"isDisplayable": true,
				"isReadOnly": true,
				"PointName": refPoint.Name,
				"PointInst": (refPoint._pStatus !== 2) ? refPoint._id : 0,
				"DevInst": (Config.Utility.getPropertyObject("Device Point", refPoint) !== null) ? Config.Utility.getPropertyObject("Device Point", refPoint).Value : 0,
				"PointType": Config.Enums['Point Types'][pointType].enum || 0
			};

			return baseRef;
		},
		setGPLPointData = function() {
			var pushGPLObjectUPIs = function(gplObjects, propName, propType) {
				var gplObject;
				if (!!gplObjects) {
					for (c = 0; c < gplObjects.length; c++) {
						gplObject = gplObjects[c];
						if (gplObject.upi && skipTypes.indexOf(gplObject.blockType) === -1) {
							if (upiList.indexOf(gplObject.upi) === -1) {
								upiList.push(gplObject.upi);
							}

							if (getCrossRefByUPIandName(gplObject.upi, propName).length === 0) {
								upiCrossRef.push({
									upi: gplObject.upi,
									name: propName,
									type: propType
								});
							}
						}
					}
				}
			};

			pushGPLObjectUPIs(blocks, "GPLBlock", 439);
			pushGPLObjectUPIs(dynamics, "GPLDynamic", 440);

			if (!!upiList && upiList.length > 0) {
				db.collection(pointsCollection).find({
					_id: {
						$in: upiList
					}
				}).toArray(function(err, points) {
					var referencedPoint,
						neededRefs,
						i;
					if (!!points) {
						for (c = 0; c < points.length; c++) {
							referencedPoint = points[c];
							neededRefs = getCrossRefByUPI(referencedPoint._id); // gets both Blocks and Dynamics refs
							for (i = 0; i < neededRefs.length; i++) {
								point["Point Refs"].push(makePointRef(referencedPoint, neededRefs[i].name, neededRefs[i].type));
							}
						}
					}
					matchUpisToPointRefs();
				});
			} else {
				cb();
			}
		};

	setGPLPointData();
}

function updateReferences(db, point, mainCallback) {

	var uniquePID = function(pointRefs) {
		var index = 0;
		var prop;

		async.forEachSeries(pointRefs, function(pointRef, cb) {
			if (pointRef.Value !== 0) {
				db.collection(pointsCollection).findOne({
					_id: pointRef.Value
				}, function(err, refPoint) {
					if (err)
						return cb(err);

					if (pointRef.PropertyName === 'GPLBlock') {
						prop = index;
					} else {
						prop = pointRef.PropertyName;
					}
					prop = index;
					refPoint = Config.EditChanges.applyUniquePIDLogic({
						point: point,
						refPoint: refPoint
					}, prop);

					index++;

					cb(null);
				});
			} else {
				cb(null);
			}
		}, function(err) {
			mainCallback(err);
		});
	};
	if (point["Point Refs"].length === 0) {

		var properties = [],
			pointTemplate = Config.Templates.getTemplate(point["Point Type"].Value);

		for (var i = 0; i < pointTemplate["Point Refs"].length; i++) {
			properties.push(pointTemplate["Point Refs"][i].PropertyName);
		}

		if (point["Point Type"].Value === "Slide Show") {
			addReferencesToSlideShowPointRefs(db, point, function() {
				uniquePID(point["Point Refs"]);
			});
		}
		/*else if (point["Point Type"].Value === "Sensor") {

			var pointRef = {
				"PropertyName": "Sensor Point",
				"PropertyEnum": 154,
				"AppIndex": 0,
				"isDisplayable": true,
				"isReadOnly": false,
				"Value": 0,
				"PointName": "",
				"PointType": 0,
				"PointInst": 0,
				"DevInst": 0
			};

			point["Point Refs"].push(pointRef);

			uniquePID(point["Point Refs"]);

		}*/
		else if (point["Point Type"].Value === "Display") {
			if (point["Screen Objects"] !== undefined) {
				addReferencesToDisplayPointRefs(db, point, function() {
					uniquePID(point["Point Refs"]);
				});
			} else {
				point["Screen Objects"] = [];
				/*db.collection(pointsCollection).update({
						_id: point._id
					}, {
						$set: {
							"Screen Objects": []
						}
					}, function(err, result) {*/
				uniquePID(point["Point Refs"]);
				//});
			}
		} else if (point["Point Type"].Value === "Program") {
			async.waterfall([

				function(wfcb) {
					async.forEachSeries(properties, function(prop, callback) {

						if (point[prop] !== null && (point[prop].ValueType === 8)) {

							var propName = prop;
							var propEnum = Config.Enums.Properties[prop].enum;
							var appIndex = 0;

							var pointRef = {
								PropertyName: propName,
								PropertyEnum: propEnum,
								Value: point[prop].Value,
								AppIndex: appIndex,
								isDisplayable: point[prop].isDisplayable,
								isReadOnly: point[prop].isReadOnly,
								PointName: point[prop].PointName,
								PointInst: point[prop].PointInst,
								DevInst: point[prop].DevInst,
								PointType: point[prop].PointType
							};

							point["Point Refs"].push(pointRef);
							delete point[prop];
							callback(null);

						} else {
							callback(null);
						}
					}, function(err) {
						wfcb(err);
					});
				},
				function(wfcb) {
					var tempAppIndex = 0,
						tempRefsArray = [],
						index, appIndexes = {};

					for (var i = 0; i < point["Point Registers"].length; i++) {
						appIndexes[point["Point Registers"][i]] = [];
					}

					for (var prop in appIndexes) {
						index = point["Point Registers"].indexOf(parseInt(prop, 10));
						while (index !== -1) {
							appIndexes[prop].push(index + 1);
							index = point["Point Registers"].indexOf(parseInt(prop, 10), index + 1);
						}
					}

					async.forEachSeries(point["Point Registers"], function(register, propCb) {
						db.collection(pointsCollection).findOne({
							_id: register
						}, function(err, registerPoint) {
							if (err)
								propCb(err);
							var pointRef = {};

							pointRef.PropertyEnum = Config.Enums.Properties["Point Register"].enum;
							pointRef.PropertyName = "Point Register";
							pointRef.isDisplayable = true;
							pointRef.AppIndex = appIndexes[register].shift();
							pointRef.isReadOnly = false;
							pointRef.DevInst = (Config.Utility.getPropertyObject("Device Point", registerPoint) !== null) ? Config.Utility.getPropertyObject("Device Point", registerPoint).Value : 0;

							if (registerPoint !== null) {
								pointRef.Value = registerPoint._id;
								pointRef.PointName = registerPoint.Name;
								pointRef.PointType = registerPoint["Point Type"].eValue;
								pointRef.PointInst = (registerPoint._pStatus !== 2) ? registerPoint._id : 0;
							} else {
								pointRef.Value = 0;
								pointRef.PointName = "";
								pointRef.PointType = 0;
								pointRef.PointInst = 0;
							}
							tempRefsArray.push(pointRef);
							propCb(null);
						});

					}, function(err) {
						tempRefsArray.sort(function(a, b) {
							return (a.AppIndex > b.AppIndex) ? 1 : ((b.AppIndex > a.AppIndex) ? -1 : 0);
						});
						for (var a = 0; a < tempRefsArray.length; a++) {
							point["Point Refs"].push(tempRefsArray[a]);
						}
						wfcb(err);
					});
				}
			], function(err) {
				/*db.collection(pointsCollection).update({
						_id: point._id
					}, point, function(err, result) {*/
				uniquePID(point["Point Refs"]);
				//});
			});

		} else {

			async.forEachSeries(properties, function(prop, callback) {
				/*if (prop === "Sequence Device")
					prop = "Device Point";*/

				if (point[prop] !== null && (point[prop].ValueType === 8)) {
					var propName = prop;
					var propEnum = Config.Enums.Properties[prop].enum;
					var appIndex = 0;

					if ((prop === "Device Point" || prop === "Remote Unit Point") && point._parentUpi === 0)
						point[prop].isReadOnly = false;

					/*if (point["Point Type"].Value === "Sequence" && prop === "Device Point") {
						propName = "Sequence Device";
						propEnum = Config.Enums.Properties[propName].enum;
					}*/

					var pointRef = {
						PropertyName: propName,
						PropertyEnum: propEnum,
						Value: point[prop].Value,
						AppIndex: appIndex,
						isDisplayable: point[prop].isDisplayable,
						isReadOnly: point[prop].isReadOnly,
						PointName: point[prop].PointName,
						PointInst: point[prop].PointInst,
						DevInst: point[prop].DevInst,
						PointType: point[prop].PointType
					};

					//logger.info("pushing", pointRef);
					point["Point Refs"].push(pointRef);
					delete point[prop];
					callback(null);

				} else {
					callback(null);
				}
			}, function(err) {
				// compare size of point register's name array to the number of point registers in the points ref array and add any Value
				/*db.collection(pointsCollection).update({
						_id: point._id
					}, point, function(err, result) {*/

				if (point['Point Type'].Value === 'Sequence') {
					addReferencesToSequencePointRefs(db, point, function() {
						uniquePID(point["Point Refs"]);
					});
				} else {
					uniquePID(point["Point Refs"]);
				}
				//});
			});
		}
	} else {
		uniquePID(point["Point Refs"]);
	}
}

function updateDevices(point, callback) {
	if (point["Point Type"].Value === "Device") {

		point["Serial Number"] = Config.Templates.getTemplate("Device")["Serial Number"];
		point["Device Address"] = Config.Templates.getTemplate("Device")["Device Address"];
		point["Network Segment"] = Config.Templates.getTemplate("Device")["Network Segment"];
		point['Firmware 2 Version'] = Config.Templates.getTemplate("Device")["Firmware 2 Version"];
		point["Ethernet Gateway"] = Config.Templates.getTemplate("Device")["Ethernet Gateway"];
		point["Ethernet Subnet"] = Config.Templates.getTemplate("Device")["Ethernet Subnet"];
		point["Ethernet IP Port"].isReadOnly = true;

		if (typeof point["Ethernet Address"].Value !== "string") {
			point["Ethernet Address"].Value = "0.0.0.0";
			point["Ethernet Address"].ValueType = 2;
		}

		utils.updateNetworkAndAddress(point);

		point._cfgDevice = true;
		point["Stop Scan"].Value = true;
		point["Device Status"].Value = "Stop Scan";
		point["Device Status"].eValue = 66;

	} else if (point["Point Type"].Value === "Remote Unit") {
		point["Device Address"].ValueType = 2;
		if (typeof point["Device Address"].Value !== "string") {
			point["Device Address"].Value = point["Device Address"].Value.toString();
		}
		point["Router Address"].ValueType = 2;
		if (typeof point["Router Address"].Value !== "string") {
			point["Router Address"].Value = point["Router Address"].Value.toString();
		}
		point["Device Status"].Value = "Stop Scan";
		point["Device Status"].eValue = 66;

	}
	callback(null);
}

function updateAlarmMessages(point, callback) {
	//logger.info("updateAlarmMessages");
	var alarmClasses = ["Emergency", "Critical"];
	if (point.hasOwnProperty('Alarm Messages')) {
		point['Notify Policies'] = [];
	}

	if (point["Alarm Class"] !== undefined && alarmClasses.indexOf(point["Alarm Class"].Value) !== -1) {

		for (var i = 0; i < point["Alarm Messages"].length; i++) {
			point["Alarm Messages"][i].ack = true;
		}
		/*db.collection(pointsCollection).update({
			_id: point._id
		}, {
			$set: {
				"Alarm Messages": point["Alarm Messages"]
			}
		}, function(err, result) {*/

		callback(null);
		//});
	} else {
		callback(null);
	}
}

function addBroadcastPeriod(point, callback) {
	if (point["Broadcast Enable"] !== undefined) {
		point["Broadcast Period"] = {
			"isDisplayable": point["Broadcast Enable"].Value,
			"isReadOnly": false,
			"ValueType": 13,
			"Value": 15
		};
	}
	callback(null);
}

function updateTrend(point, callback) {
	if (point.hasOwnProperty('Trend Enable')) {
		point["Trend Last Status"] = Config.Templates.getTemplate(point["Point Type"].Value)["Trend Last Status"];
		point["Trend Last Value"] = Config.Templates.getTemplate(point["Point Type"].Value)["Trend Last Value"];
	}
	callback(null);
}

function updateAlarmRepeat(point, callback) {
	if (point.hasOwnProperty('Alarm Repeat Time')) {
		point["Alarm Repeat Time"].isDisplayable = false;
	}
	if (point.hasOwnProperty('Alarm Repeat Enable')) {
		point["Alarm Repeat Enable"].isDisplayable = false;
	}
	callback();
}

function rearrangeProperties(point, callback) {
	var compare = function(a, b) {
		var _a = a.toLowerCase();
		var _b = b.toLowerCase();
		if (_a === '_id') {
			return -1;
		} else if (_b === '_id') {
			return 1;
		}
		if (_a.match(/^name|^_/) && _b.match(/^name|^_/)) {
			if (_a > _b) {
				return -1;
			} else if (a < _b) {
				return 1;
			}
		} else if (!_a.match(/^name|^_/) && !_b.match(/^name|^_/)) {
			if (_a > _b) {
				return 1;
			} else if (a < _b) {
				return -1;
			}
		} else if (_a.match(/^name|^_/)) {
			return -1;
		} else if (_b.match(/^name|^_/)) {
			return 1;
		}
		return 0;
	}
	var arr = [];
	var o = {};
	for (var prop in point) {
		arr.push(prop);
	}
	arr.sort(compare);
	for (var i = 0; i < arr.length; i++) {
		o[arr[i]] = point[arr[i]];
	}
	point = o;
	callback(null);
}

function test(db) {

	db.collection(pointsCollection).findOne({
		_id: 54381
	}, function(err, point) {


		async.forEachSeries(point["Screen Objects"], function(screenObject, propCb) {
				if (screenObject["Screen Object"] === 0 || screenObject["Screen Object"] === 1 || screenObject["Screen Object"] === 3 || screenObject["Screen Object"] === 7) {

					var propertyEnum = 0;
					var propertyName = "";
					if (screenObject["Screen Object"] === 0) {
						propertyEnum = Config.Enums.Properties["Display Dynamic"].enum;
						propertyName = "Display Dynamic";
					}
					if (screenObject["Screen Object"] === 1) {
						propertyEnum = Config.Enums.Properties["Display Button"].enum;
						propertyName = "Display Button";
					}
					if (screenObject["Screen Object"] === 3) {
						propertyEnum = Config.Enums.Properties["Display Animation"].enum;
						propertyName = "Display Animation";
					}
					if (screenObject["Screen Object"] === 7) {
						propertyEnum = Config.Enums.Properties["Display Trend"].enum;
						propertyName = "Display Trend";
					}

					db.collection(pointsCollection).findOne({
						_id: screenObject.upi
					}, function(err, displaypoint) {
						var pointRef = {};
						if (displaypoint !== null) {
							pointRef.PropertyEnum = propertyEnum;
							pointRef.PropertyName = propertyName;
							pointRef.Value = displaypoint._id;
							pointRef.AppIndex = 1;
							pointRef.isDisplayable = true;
							pointRef.isReadOnly = false;
							pointRef.PointName = displaypoint.Name;
							pointRef.PointType = displaypoint["Point Type"].eValue;
							pointRef.PointInst = (displaypoint._pStatus !== 2) ? displaypoint._id : 0;
							pointRef.DevInst = (Config.Utility.getPropertyObject("Device Point", displaypoint) !== null) ? Config.Utility.getPropertyObject("Device Point", displaypoint).Value : 0;

							point["Point Refs"].push(pointRef);
						}
						propCb(null);
					});
				} else
					propCb(null);
			},
			function(err) {

			});
	});
}

function updateNameSegments(point, callback) {
	//logger.info("updateNameSegments");
	//var updObj = {};

	point._name1 = point.name1.toLowerCase();
	point._name2 = point.name2.toString().toLowerCase();
	point._name3 = point.name3.toLowerCase();
	point._name4 = point.name4.toLowerCase();
	point._Name = point.Name.toLowerCase();
	/*db.collection(pointsCollection).update({
		_id: point._id
	}, {
		$set: updObj
	}, function(err, result) {*/

	// });
	callback(null);
}

function updateSequences(point, callback) {
	if (point['Point Type'].Value === 'Sequence') {
		point._parentUpi = 0;
	}
	callback();
}

function updateTaglist(point, callback) {
	for (var i = 0; i < point.taglist.length; i++) {
		point.taglist[i] = point.taglist[i].toLowerCase();
	}
	callback();
}

function setUpCollections(db, callback) {
	logger.info("setUpCollections");
	setupAlarms(db, function(err) {
		setUserGroups(db, function(err) {
			// setupUsers(db, function(err) {
			setupHistoryData(db, function(err) {
				setupUpis(db, function(err) {
					setupVersions(db, function(err) {
						callback();
					});
				});
			});
			// });
		});
	});
}

function setupProgramPoints(db, callback) {
	db.collection(pointsCollection).update({
		"Point Type.Value": "Program"
	}, {
		$set: {
			/*"Boolean Register Names": [],
			"Integer Register Names": [],
			"Point Register Names": [],
			"Real Register Names": [],*/
			"Last Report Time": {
				"isDisplayable": true,
				"isReadOnly": true,
				"ValueType": 11,
				"Value": 0
			}
		}
	}, {
		multi: true
	}, function(err, result) {
		callback(err);
	});
}

function updateAllProgramPoints(db, callback) {
	db.collection(pointsCollection).find({
		"Point Type.Value": "Script"
	}).toArray(function(err, scripts) {
		async.forEachSeries(scripts, function(script, cb) {
			updateProgramPoints(script, db, function(err) {
				if (err)
					logger.info("updateProgramPoints", err);
				cb(err);
			});
		}, function(err) {
			callback(err);
		});

	});
}

function updateAllSensorPoints(db, callback) {
	logger.info("starting updateAllSensorPoints");
	db.collection(pointsCollection).find({
		"Point Type.Value": "Sensor"
	}).toArray(function(err, sensors) {
		async.forEachSeries(sensors, function(sensor, cb) {
			updateSensorPoints(db, sensor, function(err) {
				if (err)
					logger.info("updateSensorPoints", err);
				cb(err);
			});
		}, function(err) {
			callback(err);
		});

	});
}

function setupAlarms(db, callback) {
	db.createCollection('Alarms', function(err, collection) {
		callback(err);
	});
}

function setUserGroups(db, callback) {
	db.createCollection('User Groups', function(err, collection) {
		callback(err);
	});

}

function setupUsers(db, callback) {
	db.createCollection('Users', function(err, collection) {
		db.collection('Users').insert({
			"Auto Logout Duration": {
				"Value": 0
			},
			"Contact Info": {
				"Value": [{
					"Type": "Home",
					"Value": "(336) 469-1234"
				}, {
					"Type": "Mobile",
					"Value": "(336) 469-5678"
				}, {
					"Type": "Email",
					"Value": "johndoe@dorsett-tech.com"
				}, {
					"Type": "Pager",
					"Value": "(336) 469-1245"
				}]
			},
			"Description": {
				"Value": ""
			},
			"First Name": {
				"Value": "John"
			},
			"Last Activity Time": {
				"Value": 0
			},
			"Last Login Time": {
				"Value": 0
			},
			"Last Name": {
				"Value": "Doe"
			},
			"Password": {
				"Value": "$2a$10$kXPCe68hNnuTtMRsHpm2F.wnxoWvyAaiRFLhSqoGgG/Wyu3kP4NEG"
			},
			"Password Reset": {
				"Value": true
			},
			"Photo": {
				"Value": "JohnnyRoberts.jpg"
			},
			"System Admin": {
				"Value": true
			},
			"Title": {
				"Value": "user1's title"
			},
			"username": "user1"
		}, function(err, result) {
			callback(err);
		});
	});

}

function setupHistoryData(db, callback) {
	db.createCollection('historydata', function(err, collection) {
		callback(err);
	});

}

function setupUpis(db, callback) {
	db.createCollection('upis', function(err, collection) {
		var upis = [];
		/*for (var i = 1; i <= 4194302; i++) {*/
		for (var i = 1; i <= 494302; i++) {
			upis.push({
				_id: i,
				_pStatus: 1
			});
		}
		async.forEachSeries(upis, function(upi, cb) {
			db.collection('upis').insert(upi, function(err, result) {
				cb(err);
			});
		}, function(err) {
			callback(err);
		});

	});

}

function setupVersions(db, callback) {
	db.createCollection('versions', function(err, collection) {
		callback(err);
	});

}

function doGplImport(db, xmlPath, cb) {
	var fs = require('fs'),
		upiMap = {},
		count = 0,
		max = 0,
		start = new Date(),
		xml2js = require('xml2js'),
		parser = new xml2js.Parser({
			trim: false,
			explicitArray: false,
			mergeAttrs: true,
			tagNameProcessors: [

				function(name) {
					return name.charAt(0).toLowerCase() + name.substring(1);
				}
			],
			attrNameProcessors: [

				function(name) {
					if (name === 'UPI') {
						return 'upi';
					}
					return name.charAt(0).toLowerCase() + name.substring(1);
				}
			]
		}),
		convertStrings = function(obj) {
			var key,
				prop,
				type,
				c,
				propsToRemove = {
					// 'xp:Value': true
				},
				booleans = {
					LabelVisible: true,
					PresentValueVisible: true
				},
				matrix = {
					object: function(o) {
						return convertStrings(o);
					},
					string: function(o) {
						var ret;
						if (booleans[key]) {
							ret = !!o;
						} else {
							if (!o.match(/[^\d.]/g)) { //no characters, must be number
								if (o.indexOf('.') > -1) {
									ret = parseFloat(o);
								} else {
									ret = parseInt(o, 10);
								}
							} else {
								ret = o;
							}
						}
						return ret;
					},
					array: function(o) {
						var arr = [];
						for (c = 0; c < o.length; c++) {
							arr[c] = convertStrings(o[c]);
						}
						return arr;
					}
				};

			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (!propsToRemove[key]) {
						prop = obj[key];
						type = typeof prop;
						if (type === 'object') {
							if (util.isArray(prop)) {
								type = 'array';
							}
						}
						if (matrix[type]) {
							obj[key] = matrix[type](prop);
						}
					} else {
						delete obj[key];
					}
				}
			}
			return obj;
		},
		complete = function(cb) {
			count++;
			// logger.info('count:', count, 'max:', max);
			if (count === max) {
				logger.info('GPLIMPORT: complete');
				// socket.emit('gplImportComplete', {});
			}
			cb();
		},
		update = function(json, name, cb) {
			var blocks = (json.sequence || {}).block,
				skipTypes = ['Output', 'Input', 'Constant'],
				upiMap = [],
				block,
				label,
				c,
				upi,
				saveSequence = function() {
					//logger.info('GPLIMPORT: saving sequence', name);
					db.collection(pointsCollection).findOne({
							"Name": name
						}, {
							'_id': 1
						},
						function(err, result) {
							if (result) {
								var _id = result._id;

								if (!err) {
									db.collection(pointsCollection).update({
										_id: _id
									}, {
										$set: {
											'SequenceData': json
										}
									}, function(updateErr, updateRecords) {
										/*if (updateErr) {
											socket.emit('gplImportMessage', {
												type: 'error',
												message: updateErr.err,
												name: name
											});
										} else {
											socket.emit('gplImportMessage', {
												type: 'success',
												message: 'success',
												name: name
											});
										}*/
										complete(cb);
									});
								} else {
									/*socket.emit('gplImportMessage', {
										type: 'error',
										message: err.err,
										name: name
									});*/
									complete(cb);
								}
							} else {
								/*socket.emit('gplImportMessage', {
									type: 'empty',
									message: 'empty',
									name: name
								});*/
								complete(cb);
							}
						});
				},
				doNext = function() {
					var upi,
						label,
						row,
						done = function() {
							if (c >= upiMap.length) {
								saveSequence();
							} else {
								c++;
								doNext();
							}
						};

					row = upiMap[c];

					if (row) {
						upi = row.upi;
						label = row.label;

						db.collection(pointsCollection).update({
							_id: upi
						}, {
							$set: {
								gplLabel: label
							}
						}, function(err, records) {
							/*if (err) {
								socket.emit('gplImportMessage', {
									type: 'error',
									message: 'Error: ' + err,
									name: upi
								});
								done();
							} else {
								socket.emit('gplImportMessage', {
									type: 'success',
									message: 'Added gplLabel to upi: ' + upi,
									name: upi
								});*/
							done();
							// }
						});
					} else {
						done();
					}
				};

			if (blocks) {
				for (c = 0; c < blocks.length; c++) {
					block = blocks[c];
					if (skipTypes.indexOf(block.blockType) === -1) {
						upi = block.upi;
						label = block.label;
						if (upi && label) {
							upiMap.push({
								upi: upi,
								label: label
							});
						}
					}
				}
			}

			c = 0;

			doNext();
		};

	fs.readdir(xmlPath, function(err, files) {
		var filename,
			xmls = [],
			filedata,
			c,
			cleanup = function(str) {
				if (str.sequence['xd:Dynamics']) {
					// console.log('copying dynamics');
					str.sequence.dynamic = str.sequence['xd:Dynamics']['xd:Dynamic'];
					// console.log(str.sequence['xd:Dynamics']['xd:Dynamic']);
					// console.log(str.sequence.dynamic);
					delete str.sequence['xd:Dynamics'];
				}
				var st = JSON.stringify(str);
				st = st.replace(/\"(f|F)alse\"/g, 'false');
				st = st.replace(/\"(t|T)rue\"/g, 'true');
				st = st.replace(/xp:Value/g, 'value');
				st = st.replace('Value', 'value');
				// st = st.replace(/xd:Dynamics/g, 'dynamic');
				// st = st.replace(/xd:Dynamic/g, 'dynamic');
				return JSON.parse(st);
			},
			doNext = function() {
				if (c < max) {
					filename = xmls[c];
					filedata = fs.readFileSync(xmlPath + '\\' + filename, {
						encoding: 'utf8'
					});
					parser.parseString(filedata, handler(filename));
				} else {
					logger.info('GPLIMPORT: finished xmls in', ((new Date() - start) / 1000), 'seconds');
					if (cb) {
						cb();
					}
					// socket.emit('gplImportComplete', {});
				}
			},
			handler = function(name) {
				return function(err, result) {
					var json = cleanup(result),
						newName = name.replace('.xml', '');

					while (newName.slice(-1) === '_') {
						newName = newName.slice(0, -1);
					}

					json = convertStrings(json);

					// json = convertSequence(json);
					// logger.info('GPLIMPORT: sending', name, 'to update');
					update(json, newName, function() {
						c++;
						doNext();
					});
				};
			};

		for (c = 0; c < files.length; c++) {
			filename = files[c];
			if (filename.match('.xml')) {
				xmls.push(filename);
			}
		}

		max = xmls.length;
		logger.info('Processing', xmls.length, 'XML files');

		c = 0;

		doNext();

		/*for (c = 0; c < xmls.length; c++) {
			filename = xmls[c];
			filedata = fs.readFileSync(dir + '\\' + filename, {
				encoding: 'utf8'
			});
			parser.parseString(filedata, handler(filename));
		}*/
	});
}

function updateHistory(cb) {
	var Archive = require('../models/archiveutility');
	var now = moment().endOf('month');
	var start = moment('2000/01', 'YYYY/MM');
	var count = 0;
	var currentYear = now.year();

	logger.info('starting updateHistory upis');
	Utility.get({
		collection: 'new_points',
		query: {},
		fields: {
			_oldUpi: 1
		},
		sort: {
			_id: 1
		}
	}, function(err, results) {
		async.whilst(function() {
			return now.isAfter(start);
		}, function(callback) {
			async.eachSeries(results, function(doc, eachCB) {
				var criteria = {
					year: now.year(),
					statement: ['UPDATE History_', now.year(), now.format('MM'), ' SET UPI=? WHERE UPI=?'].join('')
				};
				Archive.prepare(criteria, function(stmt) {
					criteria = {
						year: now.year(),
						statement: stmt,
						parameters: [doc._id, doc._oldUpi]
					};
					Archive.runStatement(criteria, function() {
						count += this.changes;
						Archive.finalizeStatement(criteria, function() {
							eachCB();
						});
					});
				});
			}, function(err) {
				now = now.subtract(1, 'month');
				if (now.year() !== currentYear) {
					currentYear = now.year();
					logger.info(currentYear, count);
				}
				callback(err);
			});
		}, cb);
	});
}