var Utility = require('../models/utility');
var logger = require('../helpers/logger')(module);

module.exports = {
	getGplInfo: function(upi, cb) {
		var seqData,
			sendToJade = function(err, pointdata) {
				// console.log('GPL:', 'got points');
				cb({
					data: seqData,
					pointdata: pointdata
				});
			},
			getPointData = function() {
				getGplPoints(seqData, sendToJade);
			};

		Utility.getOne({
			collection: 'points',
			query: {
				_id: upi
			}
		}, function(err, result) {
			// console.log('GPL:', 'got point');
			seqData = result;
			getPointData();
		});
	},
	getReferences: function(data, cb) {

		var upoint = parseInt(data.upoint, 10);

		Utility.getOne({
			collection: 'points',
			query: {
				_id: upoint
			},
			fields: {
				SequenceData: 1
			}
		}, cb);
	}
};

var getGplPoints = function(seq, cb) {
	var c,
		list = seq.SequenceData,
		len,
		block,
		upi,
		upis = [];

	if (list && list.sequence) {
		list = list.sequence.block || [];
		len = list.length;
		for (c = 0; c < len; c++) {
			block = list[c];
			upi = block.upi;
			if (upi !== 0) {
				if (upis.indexOf(upi) === -1) {
					upis.push(upi);
				}
			}
		}

		Utility.get({
			collection: 'points',
			query: {
				_id: {
					$in: upis
				}
			}
		}, cb);
	} else {
		cb(null, {});
	}

};