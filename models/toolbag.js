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
			limit: 0 // g_limit
		};

		Utility.get(criteria, cb);
	},
	generateCppHeaderFile: function(data, cb) {
		var key;
		var key2; // Work var
		var keyCount; // Work var
		var keyTotal; // Work var
		var maxChars; // Work var
		var prepend; // Work var
		var buffer = ""; // This is our string buffer that we'll write out to a file when complete
		var oneTab = "   "; // This is one tab and controls the key indent from the beginning of the line
		var padding = "  "; // This is the padding between the key name and the '=' sign
		var filepath = "./logs/";
		var filename = "enumsJSON.h";
		var map = {
			"Point Types": {
				name: "PointType",
				prepend: "pt",
				extraKeyName: "None",
				extraKeyValue: -1
			},
			"Properties": {
				name: "Property",
				prepend: "pid",
				extraKeyName: "NoProperty",
				extraKeyValue: -1
			}
		};
		var newLine = function(n) {
			n = n ? n : 1;
			for (var str = "", i = 0; i < n; i++) str += "\r\n";
			return str;
		};
		var padString = function(textString) {
			var i;
			var len = maxChars - textString.length;
			if (len) {
				for (i = 0; i < len; i++)
					textString += " ";
			}
			return textString;
		};
		var addPropertyToBuffer = function(propertyName, propertyValue) {
			buffer += newLine(1) + oneTab + prepend + padString(propertyName.replace(/\s+/g, '')) + padding + "= " + propertyValue;
		};

		// Add file header
		buffer = "// " + new Date().toString() + newLine(2);
		buffer += "#ifndef __ENUMSJSON_H__" + newLine(1);
		buffer += "#define __ENUMSJSON_H__";

		for (key in map) {
			maxChars = 0;
			keyCount = 0;
			keyTotal = 0;
			prepend = map[key].prepend;

			// Calculate the longest key name & total keys
			for (key2 in Config.Enums[key]) {
				var numChars = key2.replace(/\s+/g, '').length; // Strip whitespace and calculate key2 length
				if (numChars > maxChars) maxChars = numChars;
				keyTotal++;
			}

			// Begin new enum collection
			buffer += newLine(2);
			buffer += "enum " + map[key].name + newLine(1) + "{";

			// Add the extra key CPP requires
			addPropertyToBuffer(map[key].extraKeyName, map[key].extraKeyValue);
			buffer += ",";

			// Add all the keys
			for (key2 in Config.Enums[key]) {
				keyCount++;
				addPropertyToBuffer(key2, Config.Enums[key][key2].enum);
				if (keyCount < keyTotal) buffer += ",";
			}
			// Close the collection
			buffer += newLine(1) + "};";
		}

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