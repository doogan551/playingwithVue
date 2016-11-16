var fs = require('fs');
var Utility = require('../models/utility');
var utils = require('../helpers/utils.js');
var Config = require(utils.FileLocationsForControllers("Config"));
var logger = require('../helpers/logger')(module);

module.exports = {
	getPoints: function(data, cb) {
		var criteria = {
			collection: 'points',
			query: data,
			limit: 25 // g_limit
		};

		Utility.get(criteria, cb);
	},
	generateCppHeaderFile: function(data, cb) {
		var buffer = ""; // This is our string buffer that we'll write out to a file when complete
		var oneTab = "   "; // This is one tab and controls the key indent from the beginning of the line
		var padding = "  "; // This is the padding between the key name and the '=' sign
		var filepath = "./logs/";
		var filename = "enumsJSON.h";
		var map = {
			"Point Types": {
				name: "PointType",
				prepend: "pt",
				keyMap: {},
				extraKeys: {
					None: -1
				}
			},
			"Properties": {
				name: "Property",
				prepend: "pid",
				keyMap: {},
				extraKeys: {
					NoProperty: -1
				}
			},
			"Acknowledge Statuses": {
				name: "AckStatus",
				prepend: "as",
				keyMap: {
					"None Required": "None",
					"Not Acknowledged": "NotAcked",
					"Acknowledged": "Acked",
					"Auto Acknowledge": "AutoAck"
				},
				extraKeys: {}
			},
			"Value Types": {
				name: "ValueType",
				prepend: "vt",
				keyMap: {
					"UniquePID": "UPI",
					"Timet": "TimeT"
				},
				extraKeys: {}
			},
			"Property Keys": {
				name: "PropertyKey",
				prepend: "pk",
				keyMap: {},
				extraKeys: {}
			},
			"Internal Properties": {
				name: "InternalProperty",
				prepend: "",
				keyMap: {},
				extraKeys: {}
			},
			"Point Statuses": {
				name: "PointStatus",
				prepend: "ps",
				keyMap: {},
				extraKeys: {}
			},
			"Reliabilities": {
				name: "Reliability",
				prepend: "rel",
				keyMap: {},
				extraKeys: {}
			},
			"Status Flags Bits": {
				name: "StatusFlags",
				prepend: "sf",
				keyMap: {},
				extraKeys: {
					None: 0
				}
			},
			"Device Statuses": {
				name: "DeviceStatus",
				prepend: "ds",
				keyMap: {},
				extraKeys: {}
			},
			"Alarm States": {
				name: "AlarmState",
				prepend: "alm",
				keyMap: {},
				extraKeys: {}
			},
			"Day of Week Flags": {
				name: "DowFlag",
				prepend: "dow",
				keyMap: {},
				extraKeys: {}
			},
			"Device Ports": {
				name: "DevicePort",
				prepend: "dvp",
				keyMap: {},
				extraKeys: {}
			},
			"Ethernet Protocols": {
				name: "EthernetProtocol",
				prepend: "eth",
				keyMap: {},
				extraKeys: {}
			},
			"Fail Actions": {
				name: "FailAction",
				prepend: "fa",
				keyMap: {},
				extraKeys: {}
			},
			"Input Rates": {
				name: "InputRate",
				prepend: "ir",
				keyMap: {},
				extraKeys: {}
			},
			"Default Feedback Types": {
				name: "FeedbackType",
				prepend: "fbt",
				keyMap: {},
				extraKeys: {}
			},
			"Network Types": {
				name: "NetworkType",
				prepend: "nt",
				keyMap: {
					"MS/TP": "MSTP"
				},
				extraKeys: {}
			},
			"Port Protocols": {
				name: "PortProtocol",
				prepend: "pp",
				keyMap: {
					"MS/TP": "MSTP",
					"MS/RTU": "MSRTU"
				},
				extraKeys: {}
			},
			"Program Error": {
				name: "ProgramError",
				prepend: "pge",
				keyMap: {
					"None": "NORMAL",
					"Load Failed": "LOAD_FAILED",
					"Internal": "INTERNAL",
					"Program": "PROGRAM",
					"Other": "OTHER",
					"Illegal Opcode": "ILLEGAL_OPCODE",
					"Illegal Operand": "ILLEGAL_OPERAND",
					"Stack Underflow": "STACK_UNDERFLOW",
					"Stack Overflow": "STACK_OVERFLOW",
					"Divide By Zero": "DIVIDE_BY_ZERO",
					"No Support For Property": "NO_SUPPORT_FOR_PROPERTY",
					"Obsolete": "OBSOLETE",
					"Unreliable Property": "UNRELIABLE_PROPERTY",
					"Boolean Register Access Violation": "BOOLEAN_REGISTER_ACCVIO",
					"Integer Register Access Violation": "INTEGER_REGISTER_ACCVIO",
					"Real Register Access Violation": "REAL_REGISTER_ACCVIO",
					"Point Register Access Violation": "POINT_REGISTER_ACCVIO",
					"Unknown Point": "UNKNOWN_POINT"
				},
				extraKeys: {}
			},
			"Program Change Requests": {
				name: "ProgramRequest",
				prepend: "pgr",
				keyMap: {
					"None": "Ready",
					"Pause": "Halt"
				},
				extraKeys: {}
			},
			"Program States": {
				name: "ProgramStates",
				prepend: "pgs",
				keyMap: {
					"Paused": "Waiting"
				},
				extraKeys: {}
			},
			"Reset Intervals": {
				name: "ResetInterval",
				prepend: "ri",
				keyMap: {},
				extraKeys: {}
			},
			"Sensor Types": {
				name: "SensorType",
				prepend: "st",
				keyMap: {},
				extraKeys: {}
			},
			"Device Model Types": {
				name: "DeviceModelType",
				prepend: "dev",
				keyMap: {},
				extraKeys: {}
			},
			"Remote Unit Model Types": {
				name: "RMUModelType",
				prepend: "rmu",
				keyMap: {},
				extraKeys: {}
			},
			"Command Types": {
				name: "CommandType",
				prepend: "cm",
				keyMap: {},
				extraKeys: {
					SignalHostTOD: 9,
					SignalExecTOD: 10,
					DeviceLoader: 11,
					StartServer: 12,
					StopServer: 13,
					DoBackup: 14,
					ReadDeviceNetInfo: 15,
					ReadSystemInfo: 16,
					SetCountInterval: 17,
					PrintRouterTable: 18,
					GetSystemStatus: 19
				}
			},
			// Per LMH 11/16/2016 Remove Alarm Types
			// "Alarm Types": {
			// 	name: "AlarmType",
			// 	prepend: "",
			// 	keyMap: {
			// 		"Return to Normal": "RETURN_TO_NORMAL",
			// 		"Low Limit": "ANALOG_LOW_LIMIT_EXCEEDED",
			// 		"High Limit": "ANALOG_HIGH_LIMIT_EXCEEDED",
			// 		"Offnormal": "BINARY_OFF_NORMAL",
			// 		"Device Warm Start": "DEVICE_WARM_RESTART_COMPLETED",
			// 		"Device Failure": "DEVICE_FAILED",
			// 		"Device Operational": "DEVICE_OPERATIONAL",
			// 		"Device Stop Scan": "DEVICE_STOP_SCANNED",
			// 		"Device Configuration Started": "DEVICE_CONFIGURATION_STARTED",
			// 		"Device Configuration Failed": "DEVICE_CONFIGURATION_FAILED",
			// 		"Device Configuration Successful": "DEVICE_CONFIGURATION_SUCCESSFUL",
			// 		"Reliability": "POINT_RELIABILITY",
			// 		"Run Time Limit": "RUN_TIME_LIMIT_EXCEEDED",
			// 		"Starts Limit": "NUMBER_OF_STARTS_LIMIT_EXCEEDED",
			// 		"Program Halt": "PGM_HALTED",
			// 		"Device Failed - No COVs": "COV_NOT_REPORTING",
			// 		"Low Warning": "ANALOG_LOW_WARN_EXCEEDED",
			// 		"High Warning": "ANALOG_HIGH_WARN_EXCEEDED",
			// 		"Open": "BOTH_INPUTS_OPEN",
			// 		"Closed": "BOTH_INPUTS_CLOSED"
			// 	},
			// 	extraKeys: {
			// 		UNKNOWN_ALARM: 1,
			// 		HOST_NETWORK_DEVICE_FAILURE: 13,
			// 		TELE_APPL_MSG_RESPONSE_TIMEOUT: 14,
			// 		COV_UNKNOWN_DEVICE_REPORTING: 15,
			// 		COV_UNKNOWN_POINT_REPORTING: 16,
			// 		COMMAND_FAILURE: 18,
			// 		HISTORY60_TABLE_NEEDS_ARCHIVED: 19,
			// 		TELE_APPL_INVALID_MAC_OUTBOUND: 21,
			// 		TELE_APPL_INVALID_APDU_OUTBOUND: 22,
			// 		TELE_NETL_INVALID_MAC_OUTBOUND: 23,
			// 		TELE_NETL_INVALID_APDU_OUTBOUND: 24,
			// 		DEVICE_CONFIG_HOST_PROCESS_ABORTED: 25,
			// 		INVALID_COV: 27,
			// 		SERVER_ACTIVE: 28,
			// 		SERVER_INACTIVE: 29,
			// 		SERVER_FAILURE: 30,
			// 		SERVER_ACTIVE_FAILURE_DETECT: 31,
			// 		SERVER_FAILOVER_STARTED: 32,
			// 		SERVER_MAINT_MODE_ACTIVE: 33,
			// 		SERVER_MAINT_MODE_INACTIVE: 34,
			// 		UPLOAD_REQUEST_FAILURE: 35,
			// 		INVALID_DOWNLINK: 46,
			// 		PAGING_SEND_ERROR: 51,
			// 		ROUTER_NOT_AVAILABLE: 52,
			// 		INCORRECT_MODEL_TYPE: 53,
			// 		DEVICE_MEMORY_FULL: 54,
			// 		POINT_COV_FROM_INCORRECT_DEVICE: 55
			// 	}
			// },
			"Time Zones": {
				name: "TZENUM",
				prepend: "tz",
				keyMap: {
					"Eastern Time Zone": "EST",
					"Central Time Zone": "CST",
					"Mountain Time Zone": "MST",
					"Pacific Time Zone": "PST",
					"Alaska Time Zone": "AKST",
					"Arizona Time Zone, No DST": "AZ",
					"Hawaii Time Zone, No DST": "HI"
				},
				extraKeys: {}
			}
		};
		var forEach = function (obj, fn) {
			var keys = Object.keys(obj),
				len = keys.length,
				c;

			for (c = 0; c < len; c++) {
				fn(obj[keys[c]], keys[c], c);
			}
		};
		var forEachArray = function (arr, fn) {
			var list = arr || [],
				len = list.length,
				c;

			for (c = 0; c < len; c++) {
				fn(list[c], c);
			}
		};
		var newLine = function(n) {
			n = n ? n : 1;
			for (var str = "", i = 0; i < n; i++) str += "\r\n";
			return str;
		};
		var padString = function(obj) {
			// obj = {
			//	key: string,
			//	value: int,
			//	prepend: string
			//	maxChars: int
			// }
			var arr = [],
				str = obj.key,
				len = obj.maxChars - str.length;

			if (len) {
				arr[len] = '';
				str += arr.join(' ');
			}
			return str;
		};
		var addPropertyToBuffer = function(obj) {
			// obj = {
			//	key: string,
			//	value: int,
			//	prepend: string
			//	maxChars: int
			// }
			buffer += newLine(1) + oneTab + obj.prepend + padString(obj) + padding + "= " + obj.value;
		};

		// Add file header
		buffer = "// " + new Date().toString() + newLine(2);
		buffer += "#ifndef __ENUMSJSON_H__" + newLine(1);
		buffer += "#define __ENUMSJSON_H__";

		forEach(map, function (mapObj, mapKey) {
			var arr = [],
				maxChars = 0,
				numChars;

			// Get key values
			forEach(Config.Enums[mapKey], function (enumObj, enumKey) {
				var key = mapObj.keyMap[enumKey] ? mapObj.keyMap[enumKey] : enumKey;

				key = key.replace(/\s+/g, ''); // Strip whitespace
				numChars = key.length; // Calculate key length

				arr.push({
					key: key,
					value: enumObj.enum
				});

				if (numChars > maxChars) {
					maxChars = numChars;
				}
			});

			// Get extra key values
			forEach(mapObj.extraKeys, function (extraKeyValue, extraKeyName) {
				numChars = extraKeyName.length;
				
				arr.push({
					key: extraKeyName,
					value: extraKeyValue
				});

				if (numChars > maxChars) {
					maxChars = numChars;
				}
			});

			// Sort the array by key value
			arr.sort(function (a, b) {
				return a.value < b.value ? -1:1;
			});

			// Begin new enum collection
			buffer += newLine(2);
			buffer += "enum  " + mapObj.name + newLine(1) + "{";

			// Add all keys
			forEachArray(arr, function (obj) {
				addPropertyToBuffer({
					key: obj.key,
					value: obj.value,
					prepend: mapObj.prepend,
					maxChars: maxChars
				});
				buffer += ",";
			});

			// Remove the last character (,)
			buffer = buffer.slice(0, -1);

			// Close the collection
			buffer += newLine(1) + "};";
		});

		// Add file footer
		buffer += newLine(2) + "#endif  //  __ENUMSJSON_H__";

		fs.writeFile(filepath + filename, buffer, function(err) {
			var rtnObj = {};

			if (err) {
				rtnObj.result = 0;
				rtnObj.err = err;
			} else {
				rtnObj.result = 1;
				rtnObj.filename = filename;
			}
			return cb(err, rtnObj);
		});
	}
};