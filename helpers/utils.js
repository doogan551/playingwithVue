var bcrypt = require('bcrypt-nodejs');
var Config = require('../public/js/lib/config');
var Enums = Config.Enums;

var Utils = {
	buildActivityLog: function(data) {
		var log = {
				userId: data.user._id,
				username: data.user.username,
				upi: 0,
				Name: '',
				name1: '',
				name2: '',
				name3: '',
				name4: '',
				pointType: null,
				activity: data.activity,
				timestamp: data.timestamp,
				Security: [],
				log: data.log
			},
			propertyChange = {
				property: '',
				valueType: 0,
				oldValue: {
					Value: 0,
					eValue: 0
				},
				newValue: {
					Value: 0,
					eValue: 0
				}
			};

		log.upi = (data.point._id !== undefined) ? data.point._id : '';
		log.pointType = (data.point["Point Type"].eValue !== undefined) ? data.point["Point Type"].eValue : null;
		log.Security = (data.point.Security !== undefined) ? data.point.Security : [];
		log.Name = (data.point.Name !== undefined) ? data.point.Name : '';
		log.name1 = (data.point.name1 !== undefined) ? data.point.name1 : '';
		log.name2 = (data.point.name2 !== undefined) ? data.point.name2 : '';
		log.name3 = (data.point.name3 !== undefined) ? data.point.name3 : '';
		log.name4 = (data.point.name4 !== undefined) ? data.point.name4 : '';

		if ((data.activityEnum === 1 || data.activityEnum === 2)) {
			if (data.oldValue !== undefined) {
				propertyChange.oldValue = data.oldValue;
			} else {
				delete propertyChange.oldValue;
			}
			propertyChange.property = data.prop;
			propertyChange.newValue = data.newValue;
			propertyChange.valueType = data.point[prop].ValueType;
			log.propertyChanges = propertyChange;
		}

		return log;
	},
	buildName: function(name1, name2, name3, name4) {
		_name1 = (name1) ? name1.toLowerCase() : "";
		_name2 = (name2) ? name2.toLowerCase() : "";
		_name3 = (name3) ? name3.toLowerCase() : "";
		_name4 = (name4) ? name4.toLowerCase() : "";

		Name = "";

		if (name1)
			Name = Name + name1;
		if (name2)
			Name = Name + "_" + name2;
		if (name3)
			Name = Name + "_" + name3;
		if (name4)
			Name = Name + "_" + name4;

		_Name = Name.toLowerCase();
	},
	buildNameSegmentQuery: function(segment, name) {
		var beginStr, nameStr;
		beginStr = '';
		nameStr = '';

		if (req.body[searchTypeString] == 'begin') {
			beginStr = '^';
			endStr = '';
		} else if (req.body[searchTypeString] == 'contain') {
			beginStr = '.*';
			endStr = '.*';
		} else if (req.body[searchTypeString] == 'end') {
			beginStr = '';
			endStr = '$';
		}
		if (req.body[segment].value !== null && req.body[segment].value !== undefined) {
			nameStr = req.body[segment].value;
		} else {
			nameStr = req.body[segment];
		}

		return {
			'$regex': '(?i)' + beginStr + name1str + endStr
		};
	},
	CONSTANTS: function(constant) {
		constant = constant.toUpperCase();
		var constants = {
			"READ": 1,
			"CONTROL": 2,
			"ACKNOWLEDGE": 4,
			"WRITE": 8,
			"POINTSCOLLECTION": "points",
			"PROPERTIESCOLLECTION": "PropPointTypes",
			"TODCOLLECTION": "Time of Day",
			"ENUMCOLLECTION": "Enums",
			"USERSCOLLECTION": "Users",
			"THUMBNAILSCOLLECTION": "Thumbnails",
			"ALARMSCOLLECTION": "Alarms",
			"CALENDARCOLLECTION": "Holiday",
			"SYSTEMINFOPROPERTIES": "SystemInfo",
			"HISTORYCOLLECTION": "historydata",
			"USERGROUPSCOLLECTION": "User Groups",
			"ACTIVITYLOGCOLLECTION": "Activity Logs",
			"UPIS": "upis"
		};

		return constants[constant];
	},
	converters: {
		isNumber: function(n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		},

		isBool: function(n) {
			if (this.isNumber(n))
				return false;

			return (n.toLowerCase() === 'true') ? true : (n.toLowerCase() === 'false') ? true : false;
		},

		convertBool: function(n) {
			return (this.isBool(n)) ? (n.toLowerCase() === 'true') : n;
		},

		convertNumber: function(n) {
			return (this.isNumber(n)) ? parseFloat(n) : n;
		},

		convertType: function(n, type) {
			switch (type) {
				case "String":
					return n.toString();
				case "Unsigned":
				case "UniquePID":
				case "BitString":
					return this.convertNumber(n);
				default:
					return this.convertBool(this.convertNumber(n));
			}
		}
	},
	getDBProperty: function(property) {
		if (Enums.Properties[property].hasOwnProperty('intLink')) {
			return Enums.Properties[property].intLink;
		} else {
			return property;
		}
	},
	getHumanProperty: function(property) {
		if (Enums['Internal Properties'].hasOwnProperty(property)) {
			for (var prop in Enums.Properties) {
				if (Enums.Properties[prop].hasOwnProperty('intLink') && Enums.Properties[prop].intLink === property) {
					return prop;
				}
			}
		} else {
			return property;
		}
	},
	getHumanPropertyObj: function(property, value) {
		if (Enums['Internal Properties'].hasOwnProperty(property)) {
			for (var prop in Enums.Properties) {
				if (Enums.Properties[prop].hasOwnProperty('intLink') && Enums.Properties[prop].intLink === property) {
					var obj = {};
					var enumSet = Enums[Enums.Properties[prop].enumsSet];
					if (Enums.Properties[prop].valueType === 'Enum') {
						obj = {
							Value: 'Invalid',
							eValue: value,
							ValueType: Enums['Value Types'].Enum.enum
						};
						for (var prop in enumSet) {
							if (enumSet[prop].enum === value) {
								obj.Value = prop;
							}
						}
					} else {
						obj = {
							Value: value,
							ValueType: Enums['Value Types'][Enums.Properties[prop].valueType].enum
						};
					}
					return obj;
				}
			}
		} else {
			return value;
		}
	},
	// when data is returned from the db, check internal properties for enum types and return a string
	encrypt: function(pass) {
		var salt = bcrypt.genSaltSync(10);
		return bcrypt.hashSync(pass, salt);
	},
	FileLocationsForControllers: function(file) {
		file = file.toLowerCase();

		var locations = {

			underscore: '../public/js/lib/underscore.js',
			config: '../public/js/lib/config.js',
			filters: '../lib/filters',
			infoscanstore: '../lib/infoScanStore'

		};

		return locations[file];
	},
	getRegex: function(str, options) {
		var regex = '';
		var len = str.length;
		var strArray;

		options = options || {};

		if (str.charAt(0) === '"' && str.charAt(len - 1) === '"') {
			regex = '^' + str.substring(1, len - 1) + '$';
		} else if (str.indexOf('*') < 0) { // No wildcard characters in string
			if (options.matchBeginning) {
				regex = '^';
			}
			regex += str;
		} else {
			regex = '^';
			strArray = str.split('');
			for (var i = 0; i < strArray.length; i++) {
				regex += (strArray[i] === '*') ? '.*' : strArray[i];
			}
			regex += '$';
		}
		return new RegExp(regex);
	},
	sendResponse: function(res, data) {

		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		res.header("Access-Control-Allow-Headers", "Content-Type");

		return res.json(data);
	},
	setupNonFieldPoints: function(point) {
		if (Config.Utility.getPropertyObject('Device Point', point) === null) {
			point._cfgRequired = false;
			point._devModel = 0;
		}
	},
	updateNetworkAndAddress: function(point) {
		var propertyNetwork = point["Uplink Port"].Value + " Network";
		var propertyAddress = point["Uplink Port"].Value + " Address";

		point["Network Segment"].Value = point[propertyNetwork].Value;
		point["Device Address"].Value = point[propertyAddress].Value.toString();
	}
};

module.exports = Utils;