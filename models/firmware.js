var fs = require('fs');
var config = require('config');

var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

module.exports = {

	getModelFiles: function(data, cb) {
		var model = data.model;
		var firmwareFolder = config.get('Infoscan.files').firmwareLocation + model + "/";

		fs.readdir(firmwareFolder, cb);
	},
	getRemoteUnits: function(data, cb) {

		var upi = parseInt(data.deviceUpi, 10);

		Utility.get({
			collection: 'points',
			query: {
				"Point Type.Value": "Remote Unit",
				"Point Refs": {
					$elemMatch: {
						"Value": upi,
						"PropertyName": "Device Point"
					}
				}
			}
		}, cb);
	}
};