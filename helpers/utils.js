var bcrypt = require('bcrypt-nodejs');

var CONSTANTS = function(constant) {
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
		"ACTIVITYLOGCOLLECTION": "Activity Logs"
	};

	return constants[constant];
};

var FileLocationsForControllers = function(file) {
	file = file.toLowerCase();

	var locations = {

		underscore: '../public/js/lib/underscore.js',
		config: '../public/js/lib/config.js',
		filters: '../lib/filters',
		infoscanstore: '../lib/infoScanStore'

	};

	return locations[file];
};

var encrypt = function(pass) {
	var salt = bcrypt.genSaltSync(10);
	return bcrypt.hashSync(pass, salt);
};

var buildQuery = function(params) {

};

var sendResponse = function(res, data) {

	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Headers", "Content-Type");

	return res.json(data);
};

var buildNameSegmentQuery = function(segment, name) {
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
};

var buildActivityLog = function(data) {
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
};

var converters = {
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
				return this.convertNumber(n);
			default:
				return this.convertBool(this.convertNumber(n));
		}
	}
};

module.exports = {
	CONSTANTS: CONSTANTS,
	FileLocationsForControllers: FileLocationsForControllers,
	encrypt: encrypt,
	sendResponse: sendResponse,
	buildNameSegmentQuery: buildNameSegmentQuery,
	buildActivityLog: buildActivityLog,
	converters: converters
};