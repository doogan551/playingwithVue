var fs = require('fs');

var Utility = require('../models/utility');

module.exports = {

	getModelFiles: function(data, cb) {
		var model = data.model,
			firmwareFolder = process.env.driveLetter + ":/InfoScan/Firmware/" + model + "/";

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